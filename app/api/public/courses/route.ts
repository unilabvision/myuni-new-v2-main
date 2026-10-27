import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/courseService';
import {
  getPublicCacheHeaders,
  PUBLIC_CACHE_TAGS,
} from '@/lib/publicCache';
import { createServerSupabasePublicClient } from '@/lib/supabase-server';

type RatingSummaryRow = {
  course_id: string;
  average_rating: number | string;
  rating_count: number | string;
};

const PUBLIC_PACKAGE_COLUMNS = `
  id, slug, title, description, price, original_price, level, thumbnail_url, banner_url
`;

const COURSE_CATALOG_CACHE_SECONDS = 6 * 60 * 60;

async function loadRatingMap(courseIds: string[]) {
  if (courseIds.length === 0) return {};

  const supabase = createServerSupabasePublicClient();
  const { data, error } = await supabase.rpc('get_course_rating_summary', {
    p_course_ids: courseIds,
  });

  if (error) return loadRatingMapFallback(courseIds);

  return ((data || []) as RatingSummaryRow[]).reduce<
    Record<string, { avg: number; count: number }>
  >((ratingMap, row) => {
    ratingMap[String(row.course_id)] = {
      avg: Number(row.average_rating) || 0,
      count: Number(row.rating_count) || 0,
    };
    return ratingMap;
  }, {});
}

async function loadRatingMapFallback(courseIds: string[]) {
  const supabase = createServerSupabasePublicClient();
  const { data, error } = await supabase
    .from('myuni_comments')
    .select('course_id, rating')
    .in('course_id', courseIds)
    .eq('status', 'approved')
    .not('rating', 'is', null);

  if (error) {
    console.error('[api/public/courses] Rating fallback failed:', error.message);
    return {};
  }

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const row of data || []) {
    const rating = Number(row.rating);
    if (rating <= 0) continue;
    const courseId = String(row.course_id);
    const current = totals[courseId] || { sum: 0, count: 0 };
    totals[courseId] = { sum: current.sum + rating, count: current.count + 1 };
  }

  return Object.fromEntries(
    Object.entries(totals).map(([courseId, total]) => [
      courseId,
      { avg: total.sum / total.count, count: total.count },
    ])
  );
}

async function loadPublicCatalog(locale: string, programType: string) {
  const supabase = createServerSupabasePublicClient();
  const courses = await getAllCourses(
    locale,
    programType ? { programType } : { excludeProgramTypes: ['mentorship'] }
  );

  const [{ data: packages, error: packagesError }, ratingMap] = await Promise.all([
    supabase
      .from('myuni_packages')
      .select(PUBLIC_PACKAGE_COLUMNS)
      .eq('is_active', true),
    loadRatingMap(courses.map((course) => String(course.id))),
  ]);

  if (packagesError) {
    console.error('[api/public/courses] Package query failed:', packagesError.message);
  }

  return {
    courses,
    packages: packages || [],
    ratingMap,
  };
}

const getCachedPublicCatalog = unstable_cache(
  loadPublicCatalog,
  ['public-course-catalog-v3'],
  {
    revalidate: COURSE_CATALOG_CACHE_SECONDS,
    tags: [
      PUBLIC_CACHE_TAGS.courses,
      PUBLIC_CACHE_TAGS.packages,
      PUBLIC_CACHE_TAGS.courseRatings,
    ],
  }
);

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { success: false, error: 'Configuration error' },
        { status: 500 }
      );
    }

    const locale = request.nextUrl.searchParams.get('locale') || 'tr';
    const programType = request.nextUrl.searchParams.get('program_type') || '';
    const catalog = await getCachedPublicCatalog(locale, programType);

    return NextResponse.json(
      { success: true, ...catalog },
      { headers: getPublicCacheHeaders() }
    );
  } catch (error) {
    console.error(
      '[api/public/courses] Request failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return NextResponse.json(
      { success: false, error: 'Failed to load courses' },
      { status: 500 }
    );
  }
}
