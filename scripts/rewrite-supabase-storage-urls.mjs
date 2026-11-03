import fs from 'node:fs/promises';
import path from 'node:path';
import {
  authHeaders,
  getTargets,
  parseCliArgs,
} from './supabase-storage-targets.mjs';

const args = parseCliArgs();
const source = path.resolve(String(args.source || process.env.STORAGE_SOURCE_DIR || ''));
const apply = args.apply === true;
const includeHistory = args['include-history'] === true;
const concurrency = Math.min(20, Math.max(1, Number(args.concurrency || 8)));
const targets = getTargets(args.targets);
const allowedBuckets = new Set(
  String(args.buckets || 'myunilab,myuni-products')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);
const candidateColumn =
  /url|uri|image|video|thumb|file|logo|banner|cover|pdf|certificate|storage|content|data|meta|avatar|photo|icon/i;
const historicalTables = new Set([
  'orders',
  'myuni_membership_audit_log',
  'myuni_application_status_history',
  'myuni_site_application_status_history',
  'internship_status_history',
  'mentorship_application_status_history',
]);

if (!source || source === path.parse(source).root) {
  throw new Error('Pass the export directory with --source=/absolute/path');
}

async function walk(directory, prefix, objects) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolute = path.join(directory, entry.name);
    const objectPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) await walk(absolute, objectPath, objects);
    else if (entry.isFile()) objects.add(objectPath);
  }
}

async function localInventory() {
  const inventory = new Map();
  if (allowedBuckets.has('myunilab')) {
    const objects = new Set();
    await walk(path.join(source, 'myunilab'), '', objects);
    inventory.set('myunilab', objects);
  }
  if (allowedBuckets.has('myuni-products')) {
    const objects = new Set();
    for (const prefix of ['brand', 'products']) {
      await walk(path.join(source, prefix), prefix, objects);
    }
    inventory.set('myuni-products', objects);
  }
  const privateAttachments = new Set();
  await walk(
    path.join(source, 'myunilab', 'site-applications'),
    'site-applications',
    privateAttachments,
  );
  inventory.set('site-application-attachments', privateAttachments);
  return inventory;
}

function storageReference(value) {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value.trim())) return null;
  try {
    const url = new URL(value.trim());
    if (!url.hostname.endsWith('.supabase.co')) return null;
    const match = url.pathname.match(
      /^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/,
    );
    if (!match) return null;
    return {
      url,
      bucket: decodeURIComponent(match[1]),
      objectPath: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

function transformValue(value, target, inventory, stats, context = {}) {
  if (typeof value === 'string') {
    if (
      target.name === 'forms' &&
      context.table === 'myuni_site_applications' &&
      context.column === 'attachment_storage_path' &&
      value.startsWith('myunilab::site-applications/')
    ) {
      const objectPath = value.slice('myunilab::'.length);
      if (inventory.get('site-application-attachments')?.has(objectPath)) {
        stats.references += 1;
        return `site-application-attachments::${objectPath}`;
      }
      stats.missingObjects.add(`site-application-attachments/${objectPath}`);
      return value;
    }
    const reference = storageReference(value);
    if (!reference || !allowedBuckets.has(reference.bucket)) return value;
    if (reference.url.origin === target.url) return value;
    if (!inventory.get(reference.bucket)?.has(reference.objectPath)) {
      stats.missingObjects.add(`${reference.bucket}/${reference.objectPath}`);
      return value;
    }
    stats.references += 1;
    if (
      target.name === 'identity' &&
      context.table === 'myuni_products' &&
      context.column === 'product_content' &&
      reference.bucket === 'myuni-products' &&
      reference.objectPath.startsWith('products/')
    ) {
      return `myuni-product-files::${reference.objectPath}`;
    }
    return `${target.url}${reference.url.pathname}`;
  }
  if (Array.isArray(value)) {
    return value.map((item) => transformValue(item, target, inventory, stats, context));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        transformValue(item, target, inventory, stats, context),
      ]),
    );
  }
  return value;
}

async function fetchJson(url, target, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: authHeaders(target, options.headers),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

async function fetchAllRows(target, table, select, primaryKeys) {
  const pageSize = 1000;
  const rows = [];
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`${target.url}/rest/v1/${encodeURIComponent(table)}`);
    url.searchParams.set('select', select);
    url.searchParams.set('order', primaryKeys.map((key) => `${key}.asc`).join(','));
    const page = await fetchJson(url, target, {
      headers: { Range: `${offset}-${offset + pageSize - 1}` },
    });
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

async function processTarget(target, inventory) {
  const openApi = await fetchJson(`${target.url}/rest/v1/`, target, {
    headers: { Accept: 'application/openapi+json' },
  });
  const result = { rows: 0, references: 0, tables: {}, missingObjects: new Set() };
  const updates = [];

  for (const [table, definition] of Object.entries(openApi.definitions || {})) {
    if (!includeHistory && historicalTables.has(table)) continue;
    const properties = definition.properties || {};
    const primaryKeys = Object.entries(properties)
      .filter(([, property]) => property.description?.includes('<pk/>'))
      .map(([column]) => column);
    const columns = Object.keys(properties).filter((column) => candidateColumn.test(column));
    if (!primaryKeys.length || !columns.length) continue;

    const select = [...new Set([...primaryKeys, ...columns])].join(',');
    const rows = await fetchAllRows(target, table, select, primaryKeys);

    for (const row of rows) {
      const patch = {};
      const rowStats = { references: 0, missingObjects: result.missingObjects };
      for (const column of columns) {
        const transformed = transformValue(row[column], target, inventory, rowStats, {
          table,
          column,
        });
        if (JSON.stringify(transformed) !== JSON.stringify(row[column])) patch[column] = transformed;
      }
      if (!Object.keys(patch).length) continue;

      result.rows += 1;
      result.references += rowStats.references;
      result.tables[table] ||= { rows: 0, references: 0 };
      result.tables[table].rows += 1;
      result.tables[table].references += rowStats.references;

      if (apply) {
        const url = new URL(`${target.url}/rest/v1/${encodeURIComponent(table)}`);
        for (const primaryKey of primaryKeys) {
          url.searchParams.set(primaryKey, `eq.${row[primaryKey]}`);
        }
        updates.push({ url, patch });
      }
    }
  }

  if (apply && updates.length) {
    let next = 0;
    async function worker() {
      while (next < updates.length) {
        const update = updates[next++];
        await fetchJson(update.url, target, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify(update.patch),
        });
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, updates.length) }, worker));
  }
  return result;
}

const inventory = await localInventory();
console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
if (apply) console.log(`PATCH concurrency: ${concurrency}`);
console.log(`Historical snapshots: ${includeHistory ? 'included' : 'excluded'}`);
for (const [bucket, objects] of inventory) console.log(`${bucket}: ${objects.size} local objects`);

for (const target of targets) {
  const result = await processTarget(target, inventory);
  console.log(`\n[${target.name}] rows=${result.rows} references=${result.references}`);
  for (const [table, summary] of Object.entries(result.tables)) {
    console.log(`  ${table}: rows=${summary.rows} references=${summary.references}`);
  }
  console.log(`  skipped missing local objects=${result.missingObjects.size}`);
  if (args['report-missing'] === true) {
    for (const objectPath of [...result.missingObjects].sort()) {
      console.log(`    missing: ${objectPath}`);
    }
  }
}

if (!apply) console.log('\nNo database rows changed. Re-run with --apply after upload verification.');
