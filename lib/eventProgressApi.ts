/**
 * Client-safe event progress helpers. Call Next.js APIs (Clerk cookie auth).
 * userId args are kept for call-site compatibility and ignored.
 */

async function parseJson(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`);
  }
  return json;
}

export async function getUserEventProgress(_userId: string, eventId: string) {
  const res = await fetch(`/api/event-progress/me?eventId=${encodeURIComponent(eventId)}`);
  const json = await parseJson(res);
  return json.data || [];
}

export async function getUserEventLessonProgress(_userId: string, sectionId: string) {
  const res = await fetch(
    `/api/event-progress/me?sectionId=${encodeURIComponent(sectionId)}`
  );
  const json = await parseJson(res);
  return json.data;
}

export async function getEventCompletionStats(_userId: string, eventId: string) {
  const res = await fetch(
    `/api/event-progress/me?eventId=${encodeURIComponent(eventId)}&stats=1`
  );
  const json = await parseJson(res);
  return json.data;
}

export async function getLatestEventQuizResult(_userId: string, sectionId: string) {
  const res = await fetch(
    `/api/event-progress/me?quizSectionId=${encodeURIComponent(sectionId)}`
  );
  const json = await parseJson(res);
  return json.data;
}

export async function updateUserEventProgress(
  _userId: string,
  sectionId: string,
  progressData: Record<string, unknown>
) {
  const res = await fetch('/api/event-progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId, ...progressData }),
  });
  const json = await parseJson(res);
  return json.data;
}

export async function markEventLessonCompleted(
  _userId: string,
  sectionId: string,
  watchTimeSeconds?: number
) {
  const res = await fetch('/api/event-progress', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      markCompleted: true,
      watch_time_seconds: watchTimeSeconds,
    }),
  });
  const json = await parseJson(res);
  return json.data;
}

export async function saveEventQuizResult(
  _userId: string,
  sectionId: string,
  quickId: string,
  score: number
) {
  const res = await fetch('/api/event-progress/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sectionId, quickId, score }),
  });
  return parseJson(res);
}

export async function getEventAnalytics(_userId: string, eventId: string) {
  const res = await fetch(
    `/api/event-progress/me?eventId=${encodeURIComponent(eventId)}&analytics=1`
  );
  const json = await parseJson(res);
  return json.data || [];
}
