import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// GET: Check if user is enrolled in an event
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const { data: enrollment, error: enrollmentError } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select('id, attendance_status')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (enrollmentError) {
      console.error('Enrollment check error', enrollmentError);
      return NextResponse.json({ error: 'Enrollment check failed' }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({ isEnrolled: false });
    }

    const validStatuses = ['registered', 'attended', 'completed'];
    const isEnrolled = validStatuses.includes(enrollment.attendance_status);

    return NextResponse.json({
      isEnrolled,
      attendanceStatus: enrollment.attendance_status,
    });
  } catch (err) {
    console.error('GET /event-enrollment-check error', err);
    return NextResponse.json({ error: 'Failed to check enrollment' }, { status: 500 });
  }
}
