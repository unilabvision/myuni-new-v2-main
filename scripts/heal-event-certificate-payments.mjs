/**
 * Heal stuck event-certificate Iyzico orders (pending / payment_error / processing
 * / payment_review) by calling the production reconcile API.
 *
 * After deploying the event_certificate reconcile fix, run:
 *
 *   RECONCILE_BASE_URL=https://www.myunilab.net \
 *   CRON_SECRET=... \
 *   node scripts/heal-event-certificate-payments.mjs
 *
 * Optional:
 *   LIMIT=100 MAX_AGE_HOURS=336 MIN_AGE_MINUTES=0
 *
 * Or load from .env.local (RECONCILE_BASE_URL / NEXT_PUBLIC_BASE_URL / CRON_SECRET).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnvLocal() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        let v = l.slice(i + 1).trim();
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        return [l.slice(0, i).trim(), v];
      })
  );
}

const fileEnv = loadEnvLocal();
const baseUrl = (
  process.env.RECONCILE_BASE_URL ||
  fileEnv.RECONCILE_BASE_URL ||
  process.env.NEXT_PUBLIC_BASE_URL ||
  fileEnv.NEXT_PUBLIC_BASE_URL ||
  ''
).replace(/\/$/, '');

const cronSecret = process.env.CRON_SECRET || fileEnv.CRON_SECRET || '';
const limit = Number(process.env.LIMIT || 100);
const maxAgeHours = Number(process.env.MAX_AGE_HOURS || 336);
const minAgeMinutes = Number(process.env.MIN_AGE_MINUTES ?? 0);

if (!baseUrl) {
  console.error('Missing RECONCILE_BASE_URL / NEXT_PUBLIC_BASE_URL');
  process.exit(1);
}
if (!cronSecret) {
  console.error('Missing CRON_SECRET');
  process.exit(1);
}

const url = `${baseUrl}/api/iyzico-reconcile?limit=${limit}&maxAgeHours=${maxAgeHours}&minAgeMinutes=${minAgeMinutes}`;

console.log('Healing stuck Iyzico orders via', url);

const res = await fetch(url, {
  method: 'GET',
  headers: { Authorization: `Bearer ${cronSecret}` },
});

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  body = text;
}

console.log('HTTP', res.status);
console.log(JSON.stringify(body, null, 2));

if (!res.ok) process.exit(1);

const results = Array.isArray(body?.results) ? body.results : [];
const eventish = results.filter(
  (r) =>
    String(r?.message || '').toLowerCase().includes('event certificate') ||
    String(r?.message || '').toLowerCase().includes('event_certificate')
);

console.log('\nSummary:', {
  scanned: body?.scanned,
  reconciled: body?.reconciled,
  completed: body?.completed,
  stillPending: body?.stillPending,
  failed: body?.failed,
  paymentReview: body?.paymentReview,
  errors: body?.errors,
  eventCertificateMessages: eventish.length,
});
