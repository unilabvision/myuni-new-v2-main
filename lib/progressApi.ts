/**
 * Client-safe progress helpers. Call Next.js APIs (Clerk cookie auth).
 * userId args are kept for call-site compatibility and ignored.
 */

async function parseJson(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`);
  }
  return json;
}

export async function getUserCourseProgress(_userId: string, courseId: string) {
  const res = await fetch(`/api/progress/me?courseId=${encodeURIComponent(courseId)}`);
  const json = await parseJson(res);
  return json.data || [];
}

export async function getUserLessonProgress(_userId: string, lessonId: string) {
  const res = await fetch(`/api/progress/me?lessonId=${encodeURIComponent(lessonId)}`);
  const json = await parseJson(res);
  return json.data;
}

export async function getCourseCompletionStats(_userId: string, courseId: string) {
  const res = await fetch(
    `/api/progress/me?courseId=${encodeURIComponent(courseId)}&stats=1`
  );
  const json = await parseJson(res);
  return json.data;
}

export async function getLatestQuizResult(_userId: string, quickId: string) {
  const res = await fetch(`/api/progress/me?quickId=${encodeURIComponent(quickId)}`);
  const json = await parseJson(res);
  return json.data;
}

export async function updateUserProgress(
  _userId: string,
  lessonId: string,
  progressData: Record<string, unknown>
) {
  const res = await fetch('/api/progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, ...progressData }),
  });
  const json = await parseJson(res);
  return json.data;
}

export async function markLessonCompleted(
  _userId: string,
  lessonId: string,
  watchTimeSeconds?: number
) {
  const res = await fetch('/api/progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessonId,
      markCompleted: true,
      watch_time_seconds: watchTimeSeconds,
    }),
  });
  const json = await parseJson(res);
  return json.data;
}

export async function updateVideoPosition(
  _userId: string,
  lessonId: string,
  positionSeconds: number,
  totalWatchTime?: number
) {
  const progressData: Record<string, unknown> = { last_position_seconds: positionSeconds };
  if (totalWatchTime !== undefined) {
    progressData.watch_time_seconds = totalWatchTime;
  }
  return updateUserProgress(_userId, lessonId, progressData);
}

export async function saveQuizResult(
  _userId: string,
  lessonId: string,
  quickId: string,
  score: number
) {
  const res = await fetch('/api/progress/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lessonId, quickId, score }),
  });
  return parseJson(res);
}

export async function getCourseAnalytics(_userId: string, courseId: string) {
  const res = await fetch(
    `/api/progress/me?courseId=${encodeURIComponent(courseId)}&analytics=1`
  );
  const json = await parseJson(res);
  return json.data || [];
}
