const CLIENT_CACHE_MS = 10 * 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

export type PublicCatalogPayload = {
  success: boolean;
  courses?: unknown[];
  packages?: unknown[];
  ratingMap?: Record<string, { avg: number; count: number }>;
  error?: string;
};

type CountPayload = {
  success: boolean;
  counts: Record<string, number>;
  error?: string;
};

const catalogCache = new Map<string, CacheEntry<PublicCatalogPayload>>();
const enrollmentCountCache = new Map<string, CacheEntry<CountPayload>>();
const eventCountCache = new Map<string, CacheEntry<CountPayload>>();

function cachedRequest<T>(
  cache: Map<string, CacheEntry<T>>,
  key: string,
  request: () => Promise<T>,
  ttlMs = CLIENT_CACHE_MS
): Promise<T> {
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.promise;

  const promise = request().catch((error) => {
    if (cache.get(key)?.promise === promise) cache.delete(key);
    throw error;
  });
  cache.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = (await response.json()) as T & { success?: boolean; error?: string };
  if (!response.ok || payload.success === false) {
    throw new Error(payload.error || `Request failed with status ${response.status}`);
  }
  return payload;
}

function normalizeIds(ids: Array<string | number>, limit = 200): string[] {
  return Array.from(
    new Set(ids.map((id) => String(id).trim()).filter(Boolean))
  )
    .sort()
    .slice(0, limit);
}

export function fetchPublicCatalog(
  locale: string,
  programType = ''
): Promise<PublicCatalogPayload> {
  const normalizedLocale = locale === 'en' ? 'en' : 'tr';
  const normalizedProgramType = programType.trim().toLowerCase();
  const params = new URLSearchParams({ locale: normalizedLocale });
  if (normalizedProgramType) params.set('program_type', normalizedProgramType);
  const key = params.toString();

  return cachedRequest(catalogCache, key, () =>
    fetchJson<PublicCatalogPayload>(`/api/public/courses?${key}`)
  );
}

export function fetchEnrollmentCounts(
  courseIds: Array<string | number>,
  sinceDays = 0
): Promise<CountPayload> {
  const ids = normalizeIds(courseIds);
  if (ids.length === 0) {
    return Promise.resolve({ success: true, counts: {} });
  }

  const normalizedSinceDays = Math.max(0, Math.min(3650, Math.floor(sinceDays)));
  const key = `${normalizedSinceDays}:${ids.join(',')}`;
  const params = new URLSearchParams({ courseIds: ids.join(',') });
  if (normalizedSinceDays) params.set('sinceDays', String(normalizedSinceDays));

  return cachedRequest(enrollmentCountCache, key, () =>
    fetchJson<CountPayload>(`/api/enrollments/counts?${params.toString()}`)
  );
}

export function fetchEventEnrollmentCounts(
  eventIds: Array<string | number>
): Promise<CountPayload> {
  const ids = normalizeIds(eventIds);
  if (ids.length === 0) {
    return Promise.resolve({ success: true, counts: {} });
  }

  const key = ids.join(',');
  const params = new URLSearchParams({ eventIds: key });
  return cachedRequest(
    eventCountCache,
    key,
    () => fetchJson<CountPayload>(`/api/event-enrollments/counts?${params.toString()}`),
    60 * 1000
  );
}
