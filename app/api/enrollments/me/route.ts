import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMembershipEntitlementAccess } from '@/lib/membershipAccess';

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
      const membershipAccess = primary
        ? null
        : await getMembershipEntitlementAccess({
            userId,
            resourceType: 'course',
            resourceId: courseId,
          });

      return NextResponse.json({
        success: true,
        isEnrolled: enrollments.length > 0 || membershipAccess?.hasAccess === true,
        hasFullEnrollment: Boolean(fullEnrollment || membershipAccess?.hasAccess),
        accessSource: membershipAccess?.hasAccess ? 'membership' : primary ? 'purchase' : null,
        accessEndsAt: membershipAccess?.endsAt ?? null,
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
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Enrollment me list error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const courseIds = [...new Set((data || []).map((row) => row.course_id as string))];
    const { data: courses, error: courseError } = courseIds.length
      ? await supabaseAdmin.from('myuni_courses').select('*').in('id', courseIds)
      : { data: [], error: null };

    if (courseError) {
      console.error('Enrollment course list error:', courseError);
      return NextResponse.json({ success: false, error: courseError.message }, { status: 500 });
    }

    const coursesById = new Map((courses || []).map((course) => [course.id as string, course]));
    const enrollments = (data || []).map((enrollment) => ({
      ...enrollment,
      course: coursesById.get(enrollment.course_id as string) || null,
    }));

    return NextResponse.json({ success: true, data: enrollments });
  } catch (error) {
    console.error('GET /api/enrollments/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
