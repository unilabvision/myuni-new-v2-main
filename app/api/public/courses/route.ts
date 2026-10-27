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

type EarlyBirdTierRow = {
  course_id: string;
  title: string;
  slug: string;
  price: number | string;
  original_price: number | string | null;
  early_bird_price: number | string;
  early_bird_deadline: string;
  is_full_course: boolean | null;
  order_index: number | null;
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

async function loadEarlyBirdTierMap(courseIds: string[]) {
  if (courseIds.length === 0) return {};

  const supabase = createServerSupabasePublicClient();
  const { data, error } = await supabase
    .from('myuni_course_tiers')
    .select(
      'course_id, title, slug, price, original_price, early_bird_price, early_bird_deadline, is_full_course, order_index'
    )
    .in('course_id', courseIds)
    .eq('is_active', true)
    .or('is_registration_open.is.null,is_registration_open.eq.true')
    .not('early_bird_price', 'is', null)
    .gt('early_bird_deadline', new Date().toISOString())
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[api/public/courses] Early-bird tier query failed:', error.message);
    return {};
  }

  return ((data || []) as EarlyBirdTierRow[]).reduce<Record<string, EarlyBirdTierRow>>(
    (tierMap, tier) => {
      const current = tierMap[tier.course_id];
      const isFullCourse =
        tier.is_full_course === true ||
        tier.slug === 'tam-egitim' ||
        tier.title.toLocaleLowerCase('tr-TR').includes('tam eğitim');
      const currentIsFullCourse = current && (
        current.is_full_course === true ||
        current.slug === 'tam-egitim' ||
        current.title.toLocaleLowerCase('tr-TR').includes('tam eğitim')
      );

      if (!current || (isFullCourse && !currentIsFullCourse)) {
        tierMap[tier.course_id] = tier;
      }
      return tierMap;
    },
    {}
  );
}

async function loadPublicCatalog(locale: string, programType: string) {
  const supabase = createServerSupabasePublicClient();
  const courses = await getAllCourses(
    locale,
    programType ? { programType } : { excludeProgramTypes: ['mentorship'] }
  );
  const courseIds = courses.map((course) => String(course.id));

  const [{ data: packages, error: packagesError }, ratingMap, earlyBirdTierMap] = await Promise.all([
    supabase
      .from('myuni_packages')
      .select(PUBLIC_PACKAGE_COLUMNS)
      .eq('is_active', true),
    loadRatingMap(courseIds),
    loadEarlyBirdTierMap(courseIds),
  ]);

  if (packagesError) {
    console.error('[api/public/courses] Package query failed:', packagesError.message);
  }

  return {
    courses: courses.map((course) => {
      const tier = earlyBirdTierMap[String(course.id)];
      if (!tier) return course;

      return {
        ...course,
        price: Number(tier.price) || course.price,
        originalPrice: tier.original_price == null ? null : Number(tier.original_price),
        original_price: tier.original_price == null ? null : Number(tier.original_price),
        early_bird_price: Number(tier.early_bird_price),
        early_bird_deadline: tier.early_bird_deadline,
      };
    }),
    packages: packages || [],
    ratingMap,
  };
}

const getCachedPublicCatalog = unstable_cache(
  loadPublicCatalog,
  ['public-course-catalog-v4'],
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
