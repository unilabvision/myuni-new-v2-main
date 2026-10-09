export const PUBLIC_CACHE_TAGS = {
  campaigns: 'public-campaigns',
  courseRatings: 'public-course-ratings',
  courses: 'public-courses',
  events: 'public-events',
  packages: 'public-packages',
} as const;

export type PublicCacheResource = keyof typeof PUBLIC_CACHE_TAGS;

export const PUBLIC_CACHE_SECONDS = 10 * 60;

export function getPublicCacheHeaders() {
  return {
    'Cache-Control': `public, s-maxage=${PUBLIC_CACHE_SECONDS}, stale-while-revalidate=86400`,
  };
}
