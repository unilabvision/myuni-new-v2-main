import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/courseService';
import {
  getPublicCacheHeaders,
  PUBLIC_CACHE_TAGS,
} from '@/lib/publicCache';
import { createServerSupabasePublicClient } from '@/lib/supabase-server';
import { getPackageDisplayPrice } from '@/lib/packagePresentation';

type RatingSummaryRow = {
  course_id: string;
  average_rating: number | string;
  rating_count: number | string;
};

type CourseTierEarlyBirdRow = {
  course_id: string;
  early_bird_price: number | string;
  early_bird_deadline: string;
  order_index: number | null;
};

type CourseTierEarlyBird = {
  price: number;
  deadline: string;
  orderIndex: number;
};

type PublicPackageCourse = {
  package_id: string;
  myuni_courses: Array<{
    id: string;
    title: string;
    slug: string;
    thumbnail_url?: string | null;
    level?: string | null;
  }>;
};

const PUBLIC_PACKAGE_COLUMNS = `
  id, slug, title, description, price, original_price, level, thumbnail_url, banner_url
`;

const PUBLIC_PACKAGE_COURSES_COLUMNS = `
  package_id,
  order_index,
  myuni_courses (id, title, slug, thumbnail_url, level)
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

async function loadCourseTierEarlyBirdMap(
  courses: Array<{ id: string | number; price: number }>
) {
  if (courses.length === 0) return {};

  const supabase = createServerSupabasePublicClient();
  const { data, error } = await supabase
    .from('myuni_course_tiers')
    .select('course_id, early_bird_price, early_bird_deadline, order_index')
    .in('course_id', courses.map((course) => String(course.id)))
    .eq('is_active', true)
    .or('is_registration_open.is.null,is_registration_open.eq.true')
    .or('is_full_course.is.null,is_full_course.eq.false')
    .not('early_bird_price', 'is', null)
    .gt('early_bird_deadline', new Date().toISOString());

  if (error) {
    console.error('[api/public/courses] Tier early-bird query failed:', error.message);
    return {};
  }

  const coursePriceMap = Object.fromEntries(
    courses.map((course) => [String(course.id), Number(course.price) || 0])
  );

  return ((data || []) as CourseTierEarlyBirdRow[]).reduce<
    Record<string, CourseTierEarlyBird>
  >((earlyBirdMap, tier) => {
    const courseId = String(tier.course_id);
    const candidate = {
      price: Number(tier.early_bird_price),
      deadline: tier.early_bird_deadline,
      orderIndex: tier.order_index ?? Number.MAX_SAFE_INTEGER,
    };
    const current = earlyBirdMap[courseId];
    const coursePrice = coursePriceMap[courseId] ?? 0;
    const candidateDifference = Math.abs(candidate.price - coursePrice);
    const currentDifference = current
      ? Math.abs(current.price - coursePrice)
      : Number.POSITIVE_INFINITY;

    if (
      !current ||
      candidateDifference < currentDifference ||
      (candidateDifference === currentDifference && candidate.orderIndex < current.orderIndex)
    ) {
      earlyBirdMap[courseId] = candidate;
    }
    return earlyBirdMap;
  }, {});
}

function hasActiveCourseEarlyBird(course: {
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}) {
  if (course.early_bird_price == null || !course.early_bird_deadline) return false;
  const deadline = new Date(course.early_bird_deadline);
  return Number.isFinite(deadline.getTime()) && deadline > new Date();
}

async function loadPublicCatalog(locale: string, programType: string) {
  const supabase = createServerSupabasePublicClient();
  const courses = await getAllCourses(
    locale,
    programType ? { programType } : { excludeProgramTypes: ['mentorship'] }
  );
  const [
    { data: packages, error: packagesError },
    { data: packageCourses },
    ratingMap,
    tierEarlyBirdMap,
  ] = await Promise.all([
    supabase
      .from('myuni_packages')
      .select(PUBLIC_PACKAGE_COLUMNS)
      .eq('is_active', true),
    supabase
      .from('myuni_package_courses')
      .select(PUBLIC_PACKAGE_COURSES_COLUMNS)
      .order('order_index', { ascending: true }),
    loadRatingMap(courses.map((course) => String(course.id))),
    loadCourseTierEarlyBirdMap(courses),
  ]);

  if (packagesError) {
    console.error('[api/public/courses] Package query failed:', packagesError.message);
  }

  return {
    courses: courses.map((course) => {
      const tierEarlyBird = tierEarlyBirdMap[String(course.id)];
      if (!tierEarlyBird || hasActiveCourseEarlyBird(course)) return course;

      return {
        ...course,
        early_bird_price: tierEarlyBird.price,
        early_bird_deadline: tierEarlyBird.deadline,
      };
    }),
    packages: (packages || []).map((pkg) => ({
      ...pkg,
      price: getPackageDisplayPrice(pkg),
      included_courses: (packageCourses || [])
        .filter((relation: PublicPackageCourse) => relation.package_id === pkg.id)
        .flatMap((relation: PublicPackageCourse) => relation.myuni_courses),
    })),
    ratingMap,
  };
}

const getCachedPublicCatalog = unstable_cache(
  loadPublicCatalog,
  ['public-course-catalog-v7'],
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
