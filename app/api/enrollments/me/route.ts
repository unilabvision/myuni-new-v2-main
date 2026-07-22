import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/enrollments/me
 * - ?courseId= → single course enrollment status
 * - no courseId → list all active enrollments with course join
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');

    if (courseId) {
      const { data: rows, error } = await supabaseAdmin
        .from('myuni_enrollments')
        .select('id, welcome_shown, is_active, progress_percentage, tier_id, enrolled_at')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Enrollment me check error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const enrollments = rows || [];
      const fullEnrollment = enrollments.find((e) => !e.tier_id) || null;
      const tierIds = enrollments
        .map((e) => e.tier_id)
        .filter(Boolean) as string[];
      const primary = fullEnrollment || enrollments[0] || null;

      return NextResponse.json({
        success: true,
        isEnrolled: enrollments.length > 0,
        hasFullEnrollment: !!fullEnrollment,
        welcomeShown: primary?.welcome_shown || false,
        enrollmentId: primary?.id || null,
        progressPercentage: primary?.progress_percentage ?? 0,
        tierId: primary?.tier_id || null,
        tierIds,
        enrollment: primary,
      });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_enrollments')
      .select(
        `
        *,
        course:myuni_courses(*)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Enrollment me list error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('GET /api/enrollments/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
