import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.MEDIA_STORAGE_BUCKET || 'myunilab';
const PAGE_SIZE = 500;
const SOURCE_DIRECTORIES = ['app', 'components', 'lib'];
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
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

function collectStoragePaths(value, paths) {
  if (typeof value === 'string') {
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    let markerIndex = value.indexOf(marker);
    while (markerIndex >= 0) {
      const rawPath = value
        .slice(markerIndex + marker.length)
        .split(/[?#\s"'<>]/, 1)[0];
      if (rawPath) paths.add(decodeURIComponent(rawPath));
      markerIndex = value.indexOf(marker, markerIndex + marker.length);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectStoragePaths(item, paths));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectStoragePaths(item, paths));
  }
}

async function loadSourceReferences(directory, paths) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  await Promise.all(entries.map(async (entry) => {
    const pathname = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await loadSourceReferences(pathname, paths);
      return;
    }
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) return;
    collectStoragePaths(await readFile(pathname, 'utf8'), paths);
  }));
}

async function loadReferencedPaths() {
  const paths = new Set();
  const scannedTables = [];
  const skippedTables = [];

  for (const table of REFERENCE_TABLES) {
    let offset = 0;
    let didFail = false;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        skippedTables.push({ table, reason: error.message });
        didFail = true;
        break;
      }
      (data || []).forEach((row) => collectStoragePaths(row, paths));
      if (!data || data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
    if (!didFail) scannedTables.push(table);
  }

  await Promise.all(
    SOURCE_DIRECTORIES.map((directory) => loadSourceReferences(directory, paths))
  );

  return { paths, scannedTables, skippedTables };
}

async function listStorageFiles(prefix = '') {
  const files = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw new Error(`Storage listing failed at "${prefix}": ${error.message}`);

    for (const item of data || []) {
      const path = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) files.push({ ...item, path });
      else files.push(...await listStorageFiles(path));
    }

    if (!data || data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return files;
}

function isImageFile(file) {
  const mimeType = String(file.metadata?.mimetype || file.metadata?.contentType || '');
  return mimeType.startsWith('image/') || /\.(?:avif|gif|jpe?g|png|webp)$/i.test(file.path);
}

function findDuplicateCandidates(files) {
  const groups = new Map();
  for (const file of files) {
    const etag = file.metadata?.eTag || file.metadata?.etag;
    if (!etag) continue;
    const matches = groups.get(etag) || [];
    matches.push(file);
    groups.set(etag, matches);
  }
  return [...groups.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([etag, matches]) => ({
      etag,
      paths: matches.map((file) => file.path),
      redundantBytes: matches
        .slice(1)
        .reduce((sum, file) => sum + Number(file.metadata?.size || 0), 0),
    }));
}

const references = await loadReferencedPaths();
const files = (await listStorageFiles()).filter(isImageFile);
const totalBytes = files.reduce((sum, file) => sum + Number(file.metadata?.size || 0), 0);
const referencedManagedDirectories = new Set(
  [...references.paths]
    .filter((pathname) => /\/[a-f0-9]{64}\/original\.webp$/i.test(pathname))
    .map((pathname) => pathname.slice(0, -'/original.webp'.length))
);
const isReferencedFile = (file) => {
  if (references.paths.has(file.path)) return true;
  const directory = file.path.slice(0, file.path.lastIndexOf('/'));
  return referencedManagedDirectories.has(directory) && /\/w-\d+\.webp$/i.test(file.path);
};
const unreferencedCandidates = files
  .filter((file) => !isReferencedFile(file))
  .map((file) => ({
    path: file.path,
    bytes: Number(file.metadata?.size || 0),
    createdAt: file.created_at,
  }));

const duplicateCandidates = findDuplicateCandidates(files);
const report = {
  generatedAt: new Date().toISOString(),
  destructiveChanges: false,
  warning: 'Unreferenced files are candidates only. Review rich-text and external-dashboard references before deletion.',
  bucket: BUCKET,
  totalFiles: files.length,
  totalBytes,
  referencedFiles: files.length - unreferencedCandidates.length,
  scannedTables: references.scannedTables,
  skippedTables: references.skippedTables,
  duplicateCandidates,
  unreferencedCandidates,
};

if (process.argv.includes('--summary')) {
  console.log(JSON.stringify({
    generatedAt: report.generatedAt,
    destructiveChanges: false,
    bucket: BUCKET,
    totalImages: files.length,
    totalBytes,
    referencedImages: report.referencedFiles,
    duplicateGroups: duplicateCandidates.length,
    duplicateRedundantBytes: duplicateCandidates.reduce(
      (sum, group) => sum + group.redundantBytes,
      0
    ),
    unreferencedCandidates: unreferencedCandidates.length,
    unreferencedCandidateBytes: unreferencedCandidates.reduce(
      (sum, file) => sum + file.bytes,
      0
    ),
    skippedTables: references.skippedTables,
  }, null, 2));
} else {
  console.log(JSON.stringify(report, null, 2));
}
