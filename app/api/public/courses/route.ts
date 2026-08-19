import { NextRequest, NextResponse } from 'next/server';
import { getAllCourses } from '@/lib/courseService';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('[api/public/courses] Starting request...');
    
    const locale = request.nextUrl.searchParams.get('locale') || 'tr';
    console.log('[api/public/courses] Locale:', locale);
    
    // Check Supabase connection
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('[api/public/courses] Missing Supabase env vars');
      return NextResponse.json(
        { success: false, error: 'Supabase configuration missing' },
        { status: 500 }
      );
    }
    
    console.log('[api/public/courses] Fetching courses...');
    const courses = await getAllCourses(locale);
    console.log('[api/public/courses] Courses fetched:', courses.length);

    console.log('[api/public/courses] Fetching packages...');
    const { data: packages, error: packagesError } = await supabase
      .from('myuni_packages')
      .select('*')
      .eq('is_active', true);

    if (packagesError) {
      console.error('[api/public/courses] packages error:', packagesError);
    } else {
      console.log('[api/public/courses] Packages fetched:', packages?.length || 0);
    }

    const courseIds = courses.map((course) => String(course.id));
    const ratingMap: Record<string, { avg: number; count: number }> = {};

    if (courseIds.length > 0) {
      console.log('[api/public/courses] Fetching ratings for', courseIds.length, 'courses...');
      const { data: comments, error: commentsError } = await supabase
        .from('myuni_comments')
        .select('course_id, rating, status')
        .in('course_id', courseIds)
        .eq('status', 'approved');

      if (commentsError) {
        console.error('[api/public/courses] comments error:', commentsError);
      } else if (comments) {
        console.log('[api/public/courses] Comments fetched:', comments.length);
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

    console.log('[api/public/courses] Request completed successfully');
    return NextResponse.json({
      success: true,
      courses,
      packages: packages || [],
      ratingMap,
    });
  } catch (error) {
    console.error('[api/public/courses] GET error:', error);
    console.error('[api/public/courses] Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('[api/public/courses] Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load courses',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
