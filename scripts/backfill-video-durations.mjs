/**
 * Vimeo'dan gerçek video sürelerini çekip veritabanına yazar.
 *
 * Kullanım:
 *   node scripts/backfill-video-durations.mjs            # sadece eksik olanları doldurur
 *   node scripts/backfill-video-durations.mjs --all      # tüm videoları yeniden senkronize eder
 *   node scripts/backfill-video-durations.mjs --dry-run  # hiçbir şey yazmadan raporlar
 *
 * Gerekli ortam değişkenleri (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VIMEO_ACCESS_TOKEN
 */

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DRY_RUN = process.argv.includes('--dry-run');
const SYNC_ALL = process.argv.includes('--all');
const VIMEO_CONCURRENCY = 4;

function loadEnv() {
  const file = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      })
  );
}

const env = { ...loadEnv(), ...process.env };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const VIMEO_TOKEN = env.VIMEO_ACCESS_TOKEN;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY tanımlı olmalı.');
  process.exit(1);
}
if (!VIMEO_TOKEN) {
  console.error('VIMEO_ACCESS_TOKEN tanımlı olmalı. .env.local dosyasına ekleyin.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

/** Unlisted videolarda Vimeo API kimliği "<id>:<hash>" biçiminde olmalı. */
function resolveVimeoIdentifier(video) {
  const id = String(video.vimeo_id || '').trim();
  if (!id) return null;

  let hash = (video.vimeo_hash || '').trim();
  if (video.vimeo_embed_url) {
    try {
      hash = new URL(video.vimeo_embed_url).searchParams.get('h') || hash;
    } catch {
      // geçersiz embed url, kayıtlı hash ile devam
    }
  }
  // Eski kayıtlarda hash alanına video id yazılmış olabiliyor
  if (!hash || hash === id || /^\d+$/.test(hash)) return id;
  return `${id}:${hash}`;
}

async function fetchVimeoDuration(identifier, attempt = 1) {
  const res = await fetch(`https://api.vimeo.com/videos/${identifier}?fields=duration,name`, {
    headers: {
      Authorization: `Bearer ${VIMEO_TOKEN}`,
      Accept: 'application/vnd.vimeo.*+json;version=3.4',
    },
  });

  if (res.status === 429 && attempt <= 5) {
    const waitMs = Number(res.headers.get('retry-after') || 30) * 1000;
    console.warn(`  rate limit, ${waitMs / 1000}s bekleniyor...`);
    await new Promise((r) => setTimeout(r, waitMs));
    return fetchVimeoDuration(identifier, attempt + 1);
  }

  if (!res.ok) {
    throw new Error(`Vimeo ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return { duration: Number(json.duration) || 0, name: json.name };
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        results[index] = await worker(items[index], index);
      }
    })
  );
  return results;
}

async function syncVideos(videoTable, lessonTable, label) {
  console.log(`\n=== ${label} ===`);

  let query = supabase
    .from(videoTable)
    .select('id, lesson_id, title, vimeo_id, vimeo_hash, vimeo_embed_url, duration_seconds');
  if (!SYNC_ALL) {
    query = query.or('duration_seconds.is.null,duration_seconds.eq.0');
  }

  const { data: videos, error } = await query;
  if (error) throw new Error(`${videoTable} okunamadı: ${error.message}`);

  if (!videos?.length) {
    console.log('Güncellenecek video yok.');
    return;
  }
  console.log(`${videos.length} video işlenecek.`);

  const failures = [];
  const touchedLessonIds = new Set();

  await mapWithConcurrency(videos, VIMEO_CONCURRENCY, async (video) => {
    const identifier = resolveVimeoIdentifier(video);
    if (!identifier) {
      failures.push({ title: video.title, reason: 'vimeo_id yok' });
      return;
    }

    try {
      const { duration } = await fetchVimeoDuration(identifier);
      if (!duration) {
        failures.push({ title: video.title, reason: 'Vimeo süresi 0 döndü' });
        return;
      }

      console.log(`  ${video.title}: ${duration}s`);
      if (video.lesson_id) touchedLessonIds.add(video.lesson_id);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from(videoTable)
          .update({ duration_seconds: duration })
          .eq('id', video.id);
        if (updateError) throw new Error(updateError.message);
      }
    } catch (err) {
      failures.push({ title: video.title, reason: err.message });
    }
  });

  await syncLessonDurations(videoTable, lessonTable, [...touchedLessonIds]);

  if (failures.length) {
    console.log(`\n${failures.length} video güncellenemedi:`);
    failures.forEach((f) => console.log(`  - ${f.title}: ${f.reason}`));
  }
}

/** Ders süresini, o derse bağlı videoların toplam süresinden yeniden hesaplar. */
async function syncLessonDurations(videoTable, lessonTable, lessonIds) {
  if (!lessonIds.length) return;

  const { data: videos, error } = await supabase
    .from(videoTable)
    .select('lesson_id, duration_seconds')
    .in('lesson_id', lessonIds);
  if (error) throw new Error(`${videoTable} süreleri okunamadı: ${error.message}`);

  const secondsByLesson = new Map();
  for (const video of videos || []) {
    secondsByLesson.set(
      video.lesson_id,
      (secondsByLesson.get(video.lesson_id) || 0) + (video.duration_seconds || 0)
    );
  }

  for (const [lessonId, seconds] of secondsByLesson) {
    if (!seconds) continue;
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (DRY_RUN) {
      console.log(`  [ders] ${lessonId} -> ${minutes} dk`);
      continue;
    }
    const { error: updateError } = await supabase
      .from(lessonTable)
      .update({ duration_minutes: minutes })
      .eq('id', lessonId);
    if (updateError) {
      console.warn(`  [ders] ${lessonId} güncellenemedi: ${updateError.message}`);
    }
  }

  console.log(`${secondsByLesson.size} dersin süresi güncellendi.`);
}

if (DRY_RUN) console.log('DRY RUN — veritabanına yazılmayacak.\n');

await syncVideos('myuni_videos', 'myuni_course_lessons', 'Kurs videoları');
await syncVideos('myuni_event_videos', 'myuni_event_lessons', 'Etkinlik videoları');

console.log('\nTamamlandı.');
