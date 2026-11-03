import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  formatBytes,
  getTargets,
  parseCliArgs,
} from './supabase-storage-targets.mjs';

const MIME_TYPES = {
  '.avif': 'image/avif',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const args = parseCliArgs();
const source = path.resolve(String(args.source || process.env.STORAGE_SOURCE_DIR || ''));
const apply = args.apply === true;
const upsert = args.upsert === true;
const concurrency = Math.max(1, Math.min(12, Number(args.concurrency || 4)));
const targets = getTargets(args.targets);
const selectedBuckets = new Set(
  String(
    args.buckets ||
      'myunilab,myuni-products,myuni-product-files,site-application-attachments',
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

if (!source || source === path.parse(source).root) {
  throw new Error('Pass the export directory with --source=/absolute/path');
}

async function exists(directory) {
  return fs.stat(directory).then(() => true).catch(() => false);
}

async function walk(directory, bucket, relativeBase = directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolutePath, bucket, relativeBase)));
    } else if (entry.isFile()) {
      const stat = await fs.stat(absolutePath);
      files.push({
        bucket,
        absolutePath,
        objectPath: path.relative(relativeBase, absolutePath).split(path.sep).join('/'),
        size: stat.size,
      });
    }
  }
  return files;
}

const BUCKET_CONFIG = {
  myunilab: { public: true, targets: new Set(['identity', 'learning', 'forms']) },
  'myuni-products': { public: true, targets: new Set(['identity']) },
  'myuni-product-files': { public: false, targets: new Set(['identity']) },
  'site-application-attachments': { public: false, targets: new Set(['forms']) },
};

async function buildManifest() {
  const files = [];
  const myunilabDirectory = path.join(source, 'myunilab');
  if (selectedBuckets.has('myunilab') && (await exists(myunilabDirectory))) {
    const publicFiles = await walk(myunilabDirectory, 'myunilab');
    files.push(
      ...publicFiles.filter((file) => !file.objectPath.startsWith('site-applications/')),
    );
  }

  if (selectedBuckets.has('site-application-attachments')) {
    const privateDirectory = path.join(myunilabDirectory, 'site-applications');
    if (await exists(privateDirectory)) {
      files.push(
        ...(await walk(
          privateDirectory,
          'site-application-attachments',
          myunilabDirectory,
        )),
      );
    }
  }

  if (selectedBuckets.has('myuni-products')) {
    const directory = path.join(source, 'brand');
    if (await exists(directory)) {
      files.push(...(await walk(directory, 'myuni-products', source)));
    }
  }

  if (selectedBuckets.has('myuni-product-files')) {
    const directory = path.join(source, 'products');
    if (await exists(directory)) {
      files.push(...(await walk(directory, 'myuni-product-files', source)));
    }
  }
  return files;
}

async function ensureBucket(client, bucket) {
  const config = BUCKET_CONFIG[bucket];
  if (!config) throw new Error(`Missing security configuration for bucket ${bucket}`);
  const { data, error } = await client.storage.getBucket(bucket);
  if (!error && data) {
    if (data.public !== config.public) {
      throw new Error(
        `Bucket ${bucket} visibility is ${data.public ? 'public' : 'private'}, expected ${config.public ? 'public' : 'private'}`,
      );
    }
    return 'existing';
  }
  const { error: createError } = await client.storage.createBucket(bucket, {
    public: config.public,
    fileSizeLimit: 20_971_520,
  });
  if (createError) throw createError;
  return 'created';
}

async function runPool(items, worker) {
  let cursor = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  });
  await Promise.all(runners);
}

async function uploadTarget(target, files) {
  const client = createClient(target.url, target.key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const targetFiles = files.filter((file) =>
    BUCKET_CONFIG[file.bucket]?.targets.has(target.name),
  );
  for (const bucket of selectedBuckets) {
    if (targetFiles.some((file) => file.bucket === bucket)) {
      const state = await ensureBucket(client, bucket);
      console.log(`[${target.name}] bucket ${bucket}: ${state}`);
    }
  }

  const result = { uploaded: 0, skipped: 0, failed: 0, bytes: 0 };
  await runPool(targetFiles, async (file, index) => {
    const body = await fs.readFile(file.absolutePath);
    const extension = path.extname(file.absolutePath).toLowerCase();
    const { error } = await client.storage.from(file.bucket).upload(file.objectPath, body, {
      cacheControl: '31536000',
      contentType: MIME_TYPES[extension] || 'application/octet-stream',
      upsert,
    });

    if (!error) {
      result.uploaded += 1;
      result.bytes += file.size;
    } else if (error.statusCode === '409' || /already exists/i.test(error.message)) {
      result.skipped += 1;
    } else {
      result.failed += 1;
      console.error(
        `[${target.name}] failed ${file.bucket}/${file.objectPath}: ${error.message}`,
      );
    }
    if ((index + 1) % 100 === 0 || index + 1 === targetFiles.length) {
      console.log(`[${target.name}] processed ${index + 1}/${targetFiles.length}`);
    }
  });
  return result;
}

const manifest = await buildManifest();
if (!manifest.length) throw new Error(`No supported bucket files found under ${source}`);

const bucketSummary = {};
for (const file of manifest) {
  bucketSummary[file.bucket] ||= { files: 0, bytes: 0 };
  bucketSummary[file.bucket].files += 1;
  bucketSummary[file.bucket].bytes += file.size;
}

console.log(`Mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
console.log(`Source: ${source}`);
console.log(`Targets: ${targets.map((target) => target.name).join(', ')}`);
for (const [bucket, summary] of Object.entries(bucketSummary)) {
  console.log(`${bucket}: ${summary.files} files, ${formatBytes(summary.bytes)}`);
}

if (!apply) {
  console.log('No remote changes made. Re-run with --apply to create buckets and upload.');
  process.exit(0);
}

let failures = 0;
for (const target of targets) {
  const result = await uploadTarget(target, manifest);
  failures += result.failed;
  console.log(
    `[${target.name}] uploaded=${result.uploaded} skipped=${result.skipped} failed=${result.failed} bytes=${formatBytes(result.bytes)}`,
  );
}

if (failures) process.exitCode = 1;
