import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * GET /api/event-enrollments/counts?eventIds=id1,id2
 * Public aggregate attendee counts only.
 */
export async function GET(request: NextRequest) {
  try {
    const eventIdsParam = request.nextUrl.searchParams.get('eventIds') || '';
    const eventIds = eventIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 200);

    if (eventIds.length === 0) {
      return NextResponse.json({ success: false, error: 'eventIds is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select('event_id')
      .in('event_id', eventIds);

    if (error) {
      console.error('Event enrollment counts error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const id of eventIds) counts[id] = 0;
    for (const row of data || []) {
      const eid = row.event_id as string;
      counts[eid] = (counts[eid] || 0) + 1;
    }

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    console.error('GET /api/event-enrollments/counts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
