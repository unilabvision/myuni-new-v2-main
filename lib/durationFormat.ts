/** Süre biçimlendirme yardımcıları — ders/video süreleri için tek kaynak. */

/** "1 sa 12 dk" / "12 dk" biçiminde okunabilir süre üretir. */
export function formatDurationMinutes(
  minutes: number | null | undefined,
  locale: string = 'tr'
): string {
  const total = Math.round(Number(minutes));
  if (!Number.isFinite(total) || total <= 0) return '';

  const minLabel = locale === 'en' ? 'min' : 'dk';
  const hourLabel = locale === 'en' ? 'h' : 'sa';

  if (total < 60) return `${total} ${minLabel}`;

  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  return remaining === 0
    ? `${hours} ${hourLabel}`
    : `${hours} ${hourLabel} ${remaining} ${minLabel}`;
}

/** Saniye toplamını dakikaya çevirir; 0'dan büyük her süre en az 1 dk sayılır. */
export function secondsToMinutes(seconds: number | null | undefined): number {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(1, Math.round(total / 60));
}

/**
 * Dersin süresini belirler. Panelde yalnızca `duration_minutes` okunuyordu; bu
 * alan boş kaldığında süreler kaybolduğu için videoların toplam süresine düşer.
 */
export function resolveLessonDurationMinutes(lesson: {
  duration_minutes?: number | null;
  videos?: Array<{ duration_seconds?: number | null }> | null;
}): number {
  const stored = Number(lesson.duration_minutes);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);

  const videoSeconds = (lesson.videos || []).reduce(
    (total, video) => total + (Number(video?.duration_seconds) || 0),
    0
  );
  return secondsToMinutes(videoSeconds);
}
