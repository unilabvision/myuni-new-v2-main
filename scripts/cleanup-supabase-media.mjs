import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MANIFEST_PATH = process.argv[2];
const APPLY_CHANGES = process.argv.includes('--apply');
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
if (!MANIFEST_PATH || MANIFEST_PATH === '--apply') {
  throw new Error('Usage: npm run media:cleanup -- <manifest-path> [--apply]');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));

function collectReferencedPaths(value, paths) {
  if (typeof value === 'string') {
    const marker = `/storage/v1/object/public/${manifest.bucket}/`;
    let offset = value.indexOf(marker);
    while (offset >= 0) {
      const remainder = value.slice(offset + marker.length);
      const rawPath = remainder.split(/[?#\s"'<>),]/, 1)[0];
      if (rawPath) paths.add(decodeURIComponent(rawPath));
      offset = value.indexOf(marker, offset + marker.length);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectReferencedPaths(item, paths));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectReferencedPaths(item, paths));
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
    collectReferencedPaths(await readFile(pathname, 'utf8'), paths);
  }));
}

async function loadReferencedPaths() {
  const paths = new Set();
  for (const table of REFERENCE_TABLES) {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) break;
      (data || []).forEach((row) => collectReferencedPaths(row, paths));
      if (!data || data.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }
  }
  await Promise.all(
    SOURCE_DIRECTORIES.map((directory) => loadSourceReferences(directory, paths))
  );
  return paths;
}

if (Date.now() < Date.parse(manifest.deleteAfter)) {
  throw new Error(`Retention period has not elapsed. Earliest deletion: ${manifest.deleteAfter}`);
}

const sourcePaths = manifest.migrations.map(({ sourcePath }) => sourcePath);
const referencedPaths = await loadReferencedPaths();
const stillReferenced = sourcePaths.filter((sourcePath) => referencedPaths.has(sourcePath));
if (stillReferenced.length > 0) {
  throw new Error(`Cleanup blocked; ${stillReferenced.length} source objects are still referenced.`);
}
if (!APPLY_CHANGES) {
  console.log(JSON.stringify({ mode: 'dry-run', deleteAfter: manifest.deleteAfter, sourcePaths }, null, 2));
  process.exit(0);
}

const { error } = await supabase.storage.from(manifest.bucket).remove(sourcePaths);
if (error) throw new Error(`Storage cleanup failed: ${error.message}`);

console.log(JSON.stringify({ mode: 'apply', deletedObjects: sourcePaths.length }, null, 2));
