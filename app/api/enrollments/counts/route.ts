import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const COUNT_CACHE_SECONDS = 10 * 60;
const COUNT_CACHE_HEADERS = {
  'Cache-Control': `public, s-maxage=${COUNT_CACHE_SECONDS}, stale-while-revalidate=3600`,
};

const loadEnrollmentCounts = unstable_cache(
  async (courseIdsKey: string, sinceDays: number) => {
    const courseIds = courseIdsKey.split(',');
    let query = supabaseAdmin
      .from('myuni_enrollments')
      .select('course_id')
      .in('course_id', courseIds)
      .eq('is_active', true);

    if (sinceDays > 0) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      query = query.gte('enrolled_at', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const counts: Record<string, number> = Object.fromEntries(
      courseIds.map((id) => [id, 0])
    );
    for (const row of data || []) {
      const courseId = String(row.course_id);
      if (courseId in counts) counts[courseId] += 1;
    }
    return counts;
  },
  ['public-enrollment-counts-v2'],
  { revalidate: COUNT_CACHE_SECONDS }
);

/**
 * GET /api/enrollments/counts?courseIds=id1,id2
 * Public aggregate counts only — no row data.
 * Optional: ?sinceDays=30 for recent enrollments (FeaturedFilter / CourseList)
 */
export async function GET(request: NextRequest) {
  try {
    const courseIdsParam = request.nextUrl.searchParams.get('courseIds') || '';
    const parsedSinceDays = Number.parseInt(
      request.nextUrl.searchParams.get('sinceDays') || '0',
      10
    );
    const sinceDays = Number.isFinite(parsedSinceDays)
      ? Math.max(0, Math.min(3650, parsedSinceDays))
      : 0;

    const courseIds = courseIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const limitedIds = Array.from(new Set(courseIds)).sort().slice(0, 200);

    if (limitedIds.length === 0) {
      return NextResponse.json(
        { success: true, counts: {} },
        { headers: COUNT_CACHE_HEADERS }
      );
    }

    const counts = await loadEnrollmentCounts(limitedIds.join(','), sinceDays);
    return NextResponse.json(
      { success: true, counts },
      { headers: COUNT_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/enrollments/counts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
