import type { ProgressUpdate } from './progressService';

const CLIENT_PROGRESS_FIELDS = [
  'watch_time_seconds',
  'is_completed',
  'last_position_seconds',
  'notes',
  'video_watch_count',
  'last_video_watch_at',
] as const;

export function buildClientProgressUpdate(body: Record<string, unknown>): ProgressUpdate {
  const progressData: ProgressUpdate = {};
  for (const field of CLIENT_PROGRESS_FIELDS) {
    if (body[field] !== undefined) {
      (progressData as Record<string, unknown>)[field] = body[field];
    }
  }
  return progressData;
}

export function normalizeQuizScore(value: unknown): number | null {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 0 || score > 100) return null;
  return score;
}
