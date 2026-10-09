import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.MEDIA_STORAGE_BUCKET || 'myunilab';
const APPLY_CHANGES = process.argv.includes('--apply');
const EXPLICIT_URLS = process.argv
  .filter((argument) => argument.startsWith('--source-url='))
  .map((argument) => argument.slice('--source-url='.length));
const PAGE_SIZE = 500;
const RETENTION_DAYS = 30;
const RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920, 2560];
const MANIFEST_DIRECTORY = path.resolve('scripts/.media-migrations');
const REFERENCE_TABLES = [
  'certificate_templates',
  'discount_codes',
  'hero_slides',
  'internship_applications',
  'mentorships',
  'myuni_courses',
  'myuni_events',
  'myuni_opportunities',
  'myuni_packages',
  'myuni_products',
  'myuni_site_application_form_fields',
  'myuni_site_application_forms',
  'myuni_site_applications',
  'projects_content',
  'unilab_vision_blog_posts',
];

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getPublicUrl(pathname) {
  return supabase.storage.from(BUCKET).getPublicUrl(pathname).data.publicUrl;
}

function getStoragePath(value) {
  if (typeof value !== 'string') return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const markerIndex = value.indexOf(marker);
  if (markerIndex < 0) return null;
  const rawPath = value.slice(markerIndex + marker.length).split(/[?#]/, 1)[0];
  return decodeURIComponent(rawPath);
}

function getStorageUrls(value) {
  if (typeof value !== 'string') return [];
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  if (/^https?:\/\//.test(value) && value.includes(marker)) return [value];

  const escapedBucket = BUCKET.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `https?:\\/\\/[^\\s/"'<>]+\\/storage\\/v1\\/object\\/public\\/${escapedBucket}\\/[^"'<>]+`,
    'g'
  );
  return value.match(pattern) || [];
}

function isManagedPath(pathname) {
  return /(?:^|\/)[a-f0-9]{64}\/original\.webp$/i.test(pathname);
}

function collectReferences(value, references) {
  if (typeof value === 'string') {
    for (const url of getStorageUrls(value)) {
      const pathname = getStoragePath(url);
      if (pathname && !isManagedPath(pathname)) references.set(url, pathname);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferences(item, references));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectReferences(item, references));
  }
}

function replaceReferences(value, replacements) {
  if (typeof value === 'string') {
    let replaced = value;
    for (const [sourceUrl, targetUrl] of replacements) {
      replaced = replaced.replaceAll(sourceUrl, targetUrl);
    }
    return replaced;
  }
  if (Array.isArray(value)) return value.map((item) => replaceReferences(item, replacements));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, replaceReferences(item, replacements)])
  );
}

async function loadRows() {
  const rows = [];
  const skippedTables = [];
  for (const table of REFERENCE_TABLES) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) {
        skippedTables.push({ table, reason: error.message });
        break;
      }
      rows.push(...(data || []).map((row) => ({ table, row })));
      if (!data || data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }
  return { rows, skippedTables };
}

async function optimizeImage(data) {
  return sharp(data, { failOn: 'error', limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 4, smartSubsample: true })
    .toBuffer();
}

async function createVariants(data) {
  return Promise.all(
    RESPONSIVE_WIDTHS.map(async (width) => ({
      width,
      data: await sharp(data)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toBuffer(),
    }))
  );
}

async function uploadIfMissing(pathname, data) {
  const { error } = await supabase.storage.from(BUCKET).upload(pathname, data, {
    cacheControl: '31536000',
    contentType: 'image/webp',
    upsert: false,
  });
  if (!error || /already exists|duplicate/i.test(error.message)) return;
  throw new Error(`Upload failed for ${pathname}: ${error.message}`);
}

async function migratePath(sourcePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(sourcePath);
  if (error || !data) throw new Error(`Download failed for ${sourcePath}: ${error?.message}`);

  const original = await optimizeImage(Buffer.from(await data.arrayBuffer()));
  const checksum = createHash('sha256').update(original).digest('hex');
  const directory = `migrated/${checksum}`;
  const targetPath = `${directory}/original.webp`;
  const variants = await createVariants(original);

  await Promise.all([
    uploadIfMissing(targetPath, original),
    ...variants.map(({ width, data: variant }) =>
      uploadIfMissing(`${directory}/w-${width}.webp`, variant)
    ),
  ]);

  return { sourcePath, targetPath, targetUrl: getPublicUrl(targetPath) };
}

function buildRowUpdates(rows, replacements) {
  const updates = [];
  for (const { table, row } of rows) {
    if (!row.id) continue;
    const patch = {};
    const rollbackPatch = {};
    for (const [column, value] of Object.entries(row)) {
      if (column === 'id') continue;
      const replaced = replaceReferences(value, replacements);
      if (JSON.stringify(replaced) !== JSON.stringify(value)) {
        patch[column] = replaced;
        rollbackPatch[column] = value;
      }
    }
    if (Object.keys(patch).length > 0) {
      updates.push({ table, id: row.id, patch, rollbackPatch });
    }
  }
  return updates;
}

async function applyRowUpdates(updates) {
  const applied = [];
  for (const update of updates) {
    const { error } = await supabase.from(update.table).update(update.patch).eq('id', update.id);
    if (!error) {
      applied.push(update);
      continue;
    }

    const rollbackErrors = [];
    for (const previous of applied.reverse()) {
      const { error: rollbackError } = await supabase
        .from(previous.table)
        .update(previous.rollbackPatch)
        .eq('id', previous.id);
      if (rollbackError) rollbackErrors.push(`${previous.table}/${previous.id}`);
    }
    const rollbackStatus = rollbackErrors.length
      ? ` Rollback failed for: ${rollbackErrors.join(', ')}.`
      : ' Earlier row updates were rolled back.';
    throw new Error(
      `Update failed for ${update.table}/${update.id}: ${error.message}.${rollbackStatus}`
    );
  }
}

async function writeManifest(migrations, updates, skippedTables) {
  const createdAt = new Date();
  const deleteAfter = new Date(createdAt);
  deleteAfter.setUTCDate(deleteAfter.getUTCDate() + RETENTION_DAYS);
  const manifest = {
    createdAt: createdAt.toISOString(),
    deleteAfter: deleteAfter.toISOString(),
    bucket: BUCKET,
    migrations,
    updatedRows: updates.map(({ table, id }) => ({ table, id })),
    skippedTables,
  };
  await mkdir(MANIFEST_DIRECTORY, { recursive: true });
  const filename = `migration-${createdAt.toISOString().replace(/[:.]/g, '-')}.json`;
  const manifestPath = path.join(MANIFEST_DIRECTORY, filename);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

async function main() {
  const { rows, skippedTables } = await loadRows();
  const references = new Map();
  rows.forEach(({ row }) => collectReferences(row, references));
  for (const url of EXPLICIT_URLS) {
    const sourcePath = getStoragePath(url);
    if (!sourcePath) throw new Error(`Invalid source URL for ${BUCKET}: ${url}`);
    if (!isManagedPath(sourcePath)) references.set(url, sourcePath);
  }

  if (!APPLY_CHANGES) {
    const previewReplacements = new Map(
      [...references].map(([url]) => [url, 'https://media-migration.invalid/original.webp'])
    );
    console.log(JSON.stringify({
      mode: 'dry-run',
      referencedLegacyUrls: references.size,
      affectedRows: buildRowUpdates(rows, previewReplacements).length,
      skippedTables,
    }, null, 2));
    return;
  }

  const migratedByPath = new Map();
  for (const sourcePath of new Set(references.values())) {
    migratedByPath.set(sourcePath, await migratePath(sourcePath));
  }

  const replacements = new Map(
    [...references].map(([sourceUrl, sourcePath]) => [sourceUrl, migratedByPath.get(sourcePath).targetUrl])
  );
  const updates = buildRowUpdates(rows, replacements);
  await applyRowUpdates(updates);
  const migrations = [...migratedByPath.values()];
  const manifestPath = await writeManifest(migrations, updates, skippedTables);

  console.log(JSON.stringify({
    mode: 'apply',
    migratedImages: migrations.length,
    updatedRows: updates.length,
    manifestPath,
    skippedTables,
  }, null, 2));
}

await main();
