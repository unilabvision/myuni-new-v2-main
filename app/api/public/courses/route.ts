import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/courseService';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'tr';
    const courses = await getAllCourses(locale);

    const { data: packages, error: packagesError } = await supabase
      .from('myuni_packages')
      .select('*')
      .eq('is_active', true);

    if (packagesError) {
      console.error('[api/public/courses] packages:', packagesError);
    }

    const courseIds = courses.map((course) => String(course.id));
    const ratingMap: Record<string, { avg: number; count: number }> = {};

    if (courseIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('myuni_comments')
        .select('course_id, rating, status')
        .in('course_id', courseIds)
        .eq('status', 'approved');

      if (commentsError) {
        console.error('[api/public/courses] comments:', commentsError);
      } else if (comments) {
        const agg: Record<string, { sum: number; count: number }> = {};
        for (const row of comments as Array<{ course_id: string; rating: number | null }>) {
          if (row.rating && row.rating > 0) {
            if (!agg[row.course_id]) agg[row.course_id] = { sum: 0, count: 0 };
            agg[row.course_id].sum += row.rating;
            agg[row.course_id].count += 1;
          }
        }
        Object.entries(agg).forEach(([courseId, value]) => {
          ratingMap[courseId] = {
            avg: value.sum / value.count,
            count: value.count,
          };
        });
      }
    }

    return NextResponse.json({
      success: true,
      courses,
      packages: packages || [],
      ratingMap,
    });
  } catch (error) {
    console.error('[api/public/courses] GET:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load courses' },
      { status: 500 }
    );
  }
}
