import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';
import { appendFile, readFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';

const args = new Set(process.argv.slice(2));
const valueOf = (name, fallback) => {
  const prefix = `--${name}=`;
  const argument = [...args].find((item) => item.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : fallback;
};

const recipientFile = valueOf('emails-file');
const productSlug = valueOf('product-slug', 'dark-science52');
const sentLogFile = valueOf('sent-log', recipientFile ? `${recipientFile}.sent` : '');
const shouldApply = args.has('--apply');
const shouldSendEmail = args.has('--send-email');

if (args.has('--help') || !recipientFile) {
  console.log(`Usage:
  npm run gift:product -- --emails-file=/absolute/path/recipients.txt [--product-slug=dark-science52]
  npm run gift:product -- --emails-file=/absolute/path/recipients.txt --apply
  npm run gift:product -- --emails-file=/absolute/path/recipients.txt --apply --send-email

The default mode is read-only. Recipient addresses are read from a local file and are never stored in the repository.
Successful deliveries are recorded in <emails-file>.sent so an interrupted run can resume without duplicate emails.`);
  process.exit(args.has('--help') ? 0 : 1);
}

const requiredVariables = [
  'CLERK_SECRET_KEY',
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];
for (const variable of requiredVariables) {
  if (!process.env[variable]) throw new Error(`${variable} is required.`);
}

if (shouldSendEmail && !shouldApply) {
  throw new Error('--send-email requires --apply so access is verified before notification.');
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rawRecipients = await readFile(recipientFile, 'utf8');
const emails = [...new Set(
  rawRecipients
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
)];
const invalidEmails = emails.filter((email) => !emailPattern.test(email));
if (invalidEmails.length) {
  throw new Error(`Invalid email address(es): ${invalidEmails.join(', ')}`);
}
if (!emails.length) throw new Error('Recipient file is empty.');

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: product, error: productError } = await supabase
  .from('myuni_products')
  .select('id, title, slug')
  .eq('slug', productSlug)
  .single();
if (productError || !product) {
  throw new Error(`Product not found (${productSlug}): ${productError?.message || 'unknown error'}`);
}

async function prepareRecipient(email) {
  const users = await clerk.users.getUserList({ emailAddress: [email], limit: 2 });
  const exactUsers = users.data.filter((user) =>
    user.emailAddresses.some((entry) => entry.emailAddress.trim().toLowerCase() === email)
  );
  if (exactUsers.length > 1) {
    throw new Error(`Multiple Clerk users found for ${email}.`);
  }

  const user = exactUsers[0];
  const possibleOwnerIds = user ? [user.id, email] : [email];
  const { data: existing, error } = await supabase
    .from('myuni_products_purchases')
    .select('id, user_id')
    .eq('product_id', product.id)
    .in('user_id', possibleOwnerIds)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Access lookup failed for ${email}: ${error.message}`);

  return {
    email,
    userId: user?.id || null,
    ownerId: user?.id || email,
    name: user?.firstName || null,
    alreadyGranted: Boolean(existing),
  };
}

const recipients = [];
for (const email of emails) recipients.push(await prepareRecipient(email));

console.table(recipients.map(({ email, userId, ownerId, alreadyGranted }) => ({
  email,
  clerkAccount: userId ? 'yes' : 'no',
  accessOwner: ownerId,
  status: alreadyGranted ? 'already granted' : shouldApply ? 'will grant' : 'dry-run: would grant',
})));

if (!shouldApply) {
  console.log(`Dry run complete for ${recipients.length} recipient(s). No database rows or emails were created.`);
  process.exit(0);
}

for (const recipient of recipients) {
  if (recipient.alreadyGranted) continue;
  const { error } = await supabase.from('myuni_products_purchases').insert({
    user_id: recipient.ownerId,
    product_id: product.id,
    purchased_at: new Date().toISOString(),
    price_paid: 0,
  });
  if (error) throw new Error(`Grant failed for ${recipient.email}: ${error.message}`);
}

if (!shouldSendEmail) {
  console.log(`Access granted or verified for ${recipients.length} recipient(s). No emails were sent.`);
  process.exit(0);
}

for (const variable of ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASSWORD']) {
  if (!process.env[variable]) throw new Error(`${variable} is required to send email.`);
}

function resolveBaseUrl(value) {
  try {
    const url = new URL(value || 'https://myunilab.net');
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url.toString().replace(/\/$/, '');
  } catch {
    console.warn('NEXT_PUBLIC_BASE_URL is not a valid web URL; using https://myunilab.net.');
    return 'https://myunilab.net';
  }
}

const baseUrl = resolveBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
const accessUrl = `${baseUrl}/tr/collection/${product.slug}/view`;
const signUpUrl = `${baseUrl}/tr/login?tab=signup`;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT || 587),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
});
await transporter.verify();

let alreadyEmailed = new Set();
try {
  const sentLog = await readFile(sentLogFile, 'utf8');
  alreadyEmailed = new Set(sentLog.split(/\s+/).filter(Boolean));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

let emailsSent = 0;
for (const recipient of recipients) {
  if (alreadyEmailed.has(recipient.email)) {
    console.log(`Email already sent, skipping: ${recipient.email}`);
    continue;
  }

  const greeting = recipient.name ? `Merhaba ${recipient.name},` : 'Merhaba,';
  const actionUrl = recipient.userId ? accessUrl : signUpUrl;
  const actionLabel = recipient.userId ? 'Dergiyi görüntüle' : 'Hesabını oluştur';
  const instruction = recipient.userId
    ? 'Dergi MyUNI koleksiyonunuza tanımlandı. Aşağıdaki bağlantıdan hemen erişebilirsiniz.'
    : `Dergi ${recipient.email} adresine hediye olarak tanımlandı. Aynı e-posta adresiyle ücretsiz MyUNI hesabınızı oluşturduğunuzda koleksiyonunuzda otomatik olarak görünecektir.`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: recipient.email,
    subject: `Hediyeniz hazır: ${product.title}`,
    text: `${greeting}\n\n${product.title} size hediye edildi. ${instruction}\n\n${actionLabel}: ${actionUrl}\n\nMyUNI`,
    html: `<p>${escapeHtml(greeting)}</p>
      <p><strong>${escapeHtml(product.title)}</strong> size hediye edildi.</p>
      <p>${escapeHtml(instruction)}</p>
      <p><a href="${escapeHtml(actionUrl)}">${escapeHtml(actionLabel)}</a></p>
      <p>MyUNI</p>`,
  });
  await appendFile(sentLogFile, `${recipient.email}\n`, 'utf8');
  emailsSent += 1;
  console.log(`Email sent: ${recipient.email}`);
}

console.log(`Completed: ${recipients.length} access grant(s) verified and ${emailsSent} new email(s) sent.`);
