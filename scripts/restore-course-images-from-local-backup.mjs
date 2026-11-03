import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const BUCKET = 'myunilab';
const RESPONSIVE_WIDTHS = [320, 640, 960, 1280, 1920, 2560];
const BACKUP_ROOT = '/Users/mac/Documents/supabase-deploy/myuni-products/myunilab';
const MANIFEST_DIRECTORY = path.resolve('scripts/.media-migrations');

const COURSES = [
  {
    id: 'bbd8d0df-f07f-4adf-82f2-b4700324cffe',
    slug: 'ngs-e-giris-egitimi-kamp-1',
    title: "NGS'e Giriş Eğitimi Kamp 1",
    thumbnail: 'Courses/NGS-kamp1.webp',
    banner: 'Courses/NGS-kamp1.webp',
  },
  {
    id: 'dc75a7ce-7f1b-42f5-95a7-8e421c484d92',
    slug: 'ngs-egitimi-kamp-2',
    title: 'NGS Eğitimi Kamp 2',
    thumbnail: 'Courses/NGS-kamp2.webp',
    banner: 'Courses/NGS-kamp2.webp',
  },
  {
    id: '37af131a-b606-483e-8926-0df5e79f5b89',
    slug: 'klinik-arastirmalar-kariyer-akademisi',
    title: 'Klinik Araştırmalar Kariyer Akademisi',
    thumbnail: 'Courses/Klinik-Araştırmalar-Kariyer-Akademisi.webp',
    banner: 'Courses/Klinik-Araştırmalar-Kariyer-Akademisi.webp',
  },
  {
    id: '8ec5091b-4e75-4f7e-ab11-9a64ed9f4a72',
    slug: 'embriyology-egitim-kamp',
    title: 'Embriyoloji Eğitim Kampı',
    thumbnail: 'Courses/embgkamp.jpeg',
    banner: 'Courses/embgkamp.jpeg',
  },
  {
    id: 'fa4d4a6b-417e-4f2d-bbc2-b16e870f6468',
    slug: 'molekuler-biyolojide-etkili-metot-ve-prosedur-yazimi-egitimi',
    title: 'Moleküler Biyolojide Etkili Metot ve Prosedür Yazımı Eğitimi',
    thumbnail: 'Courses/molekuler-biyolojide-etkili-metot-ve-prosedur-yazimi-egitimi.webp',
    banner: 'Courses/molekuler-biyolojide-etkili-metot-ve-prosedur-yazimi-egitimi.webp',
  },
  {
    id: '591008c5-1c40-4337-a769-254fc17fc983',
    slug: 'klinik-arastirmalarda-yeni-ufuklar',
    title: 'Klinik Araştırmalarda Yeni Ufuklar',
    thumbnail:
      'events/thumbnail/klinik-arastirmalarda-yeni-ufuklar-erken-faz-veri-ve-yapay-z/1790243101052_bygjyc.webp',
    banner:
      'events/banner/klinik-arastirmalarda-yeni-ufuklar-erken-faz-veri-ve-yapay-z/1790243104246_32gwhg.webp',
  },
  {
    id: 'd78faa1f-645f-4c52-92a4-dc1f4df8ee57',
    slug: 'bilimden-pazara-biyoteknoloji-dunyasina-stratejik-bakis',
    title: 'Bilimden Pazara: Biyoteknoloji Dünyasına Stratejik Bakış',
    thumbnail:
      'events/thumbnail/bilimden-pazara-biyoteknoloji-dunyasina-stratejik-bakis/1792922214739_a7m954.webp',
    banner:
      'events/banner/bilimden-pazara-biyoteknoloji-dunyasina-stratejik-bakis/1792922216586_uo06fc.webp',
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_LEARNING_URL;
const supabaseKey = process.env.SUPABASE_LEARNING_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_LEARNING_URL and SUPABASE_LEARNING_SECRET_KEY are required.',
  );
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function publicUrl(objectPath) {
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

async function optimizeImage(sourcePath) {
  const source = await readFile(sourcePath);
  return sharp(source, { failOn: 'error', limitInputPixels: 40_000_000 })
    .rotate()
    .resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 4, smartSubsample: true })
    .toBuffer();
}

async function buildAsset(course, kind) {
  const relativeSource = course[kind];
  const absoluteSource = path.join(BACKUP_ROOT, relativeSource);
  const original = await optimizeImage(absoluteSource);
  const checksum = createHash('sha256').update(original).digest('hex');
  const directory = `courses/restored/${course.slug}/${kind}/${checksum}`;
  const variants = await Promise.all(
    RESPONSIVE_WIDTHS.map(async (width) => ({
      objectPath: `${directory}/w-${width}.webp`,
      body: await sharp(original)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82, effort: 4, smartSubsample: true })
        .toBuffer(),
    })),
  );
  const objectPath = `${directory}/original.webp`;
  return {
    kind,
    source: relativeSource,
    objectPath,
    url: publicUrl(objectPath),
    files: [{ objectPath, body: original }, ...variants],
  };
}

async function uploadFile(file) {
  const { error } = await supabase.storage.from(BUCKET).upload(file.objectPath, file.body, {
    cacheControl: '31536000',
    contentType: 'image/webp',
    upsert: false,
  });
  if (!error || error.statusCode === '409' || /already exists|duplicate/i.test(error.message)) {
    return;
  }
  throw new Error(`Upload failed for ${file.objectPath}: ${error.message}`);
}

async function revalidateProductionCache() {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://www.myunilab.net').replace(/\/$/, '');
  const candidates = [];
  if (process.env.CACHE_REVALIDATION_SECRET) {
    candidates.push(process.env.CACHE_REVALIDATION_SECRET);
  }
  for (const key of [
    process.env.SUPABASE_LEARNING_SECRET_KEY,
    process.env.SUPABASE_IDENTITY_SECRET_KEY,
    process.env.SUPABASE_FORMS_SECRET_KEY,
  ]) {
    if (!key) continue;
    candidates.push(
      createHash('sha256').update(`myuni-cache-revalidation:${key}`).digest('hex'),
    );
  }

  for (const secret of [...new Set(candidates)]) {
    try {
      const response = await fetch(`${baseUrl}/api/admin/cache/revalidate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-cache-revalidation-secret': secret,
        },
        body: JSON.stringify({ resources: ['courses', 'packages'] }),
      });
      if (response.ok) return true;
    } catch {
      // Try the next locally available secret.
    }
  }
  return false;
}

const ids = COURSES.map((course) => course.id);
const { data: currentRows, error: currentRowsError } = await supabase
  .from('myuni_courses')
  .select('id, title, thumbnail_url, banner_url')
  .in('id', ids);

if (currentRowsError) throw currentRowsError;
if ((currentRows || []).length !== COURSES.length) {
  throw new Error(`Expected ${COURSES.length} course rows, found ${(currentRows || []).length}.`);
}

const assetsByCourse = new Map();
for (const course of COURSES) {
  const thumbnail = await buildAsset(course, 'thumbnail');
  const banner = await buildAsset(course, 'banner');
  assetsByCourse.set(course.id, { thumbnail, banner });
  console.log(`${course.title}`);
  console.log(`  thumbnail: ${thumbnail.source} -> ${thumbnail.url}`);
  console.log(`  banner:    ${banner.source} -> ${banner.url}`);
}

if (!APPLY) {
  console.log('DRY RUN: no uploads or database changes made. Re-run with --apply.');
  process.exit(0);
}

for (const assets of assetsByCourse.values()) {
  for (const asset of [assets.thumbnail, assets.banner]) {
    await Promise.all(asset.files.map(uploadFile));
  }
}

await mkdir(MANIFEST_DIRECTORY, { recursive: true });
const manifestPath = path.join(
  MANIFEST_DIRECTORY,
  `course-image-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);
await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      database: supabaseUrl,
      bucket: BUCKET,
      previousRows: currentRows,
      replacements: COURSES.map((course) => {
        const assets = assetsByCourse.get(course.id);
        return {
          id: course.id,
          title: course.title,
          thumbnail_url: assets.thumbnail.url,
          banner_url: assets.banner.url,
        };
      }),
    },
    null,
    2,
  )}\n`,
  'utf8',
);

for (const course of COURSES) {
  const assets = assetsByCourse.get(course.id);
  const { data, error } = await supabase
    .from('myuni_courses')
    .update({
      thumbnail_url: assets.thumbnail.url,
      banner_url: assets.banner.url,
    })
    .eq('id', course.id)
    .select('id, title, thumbnail_url, banner_url')
    .single();
  if (error) throw new Error(`Database update failed for ${course.title}: ${error.message}`);
  console.log(`Updated: ${data.title}`);
}

const cacheRevalidated = await revalidateProductionCache();
console.log(`Rollback manifest: ${manifestPath}`);
console.log(`Production cache revalidated: ${cacheRevalidated ? 'yes' : 'no'}`);
