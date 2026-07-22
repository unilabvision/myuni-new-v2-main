import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/enrollments/tiers?courseId=
 * Returns tier_id list for the authenticated user's enrollments on a course.
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const courseId = request.nextUrl.searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_enrollments')
      .select('tier_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .not('tier_id', 'is', null);

    if (error) {
      console.error('Enrollment tiers error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const tierIds = (data || []).map((row) => row.tier_id).filter(Boolean) as string[];
    return NextResponse.json({ success: true, tierIds });
  } catch (error) {
    console.error('GET /api/enrollments/tiers error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
