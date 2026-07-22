import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/event-enrollments/me — list event enrollments for dashboard
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select(
        `
        *,
        event:myuni_events(*)
      `
      )
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Event enrollments me error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    console.error('GET /api/event-enrollments/me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
