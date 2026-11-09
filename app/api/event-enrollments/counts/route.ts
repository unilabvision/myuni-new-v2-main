import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const COUNT_CACHE_SECONDS = 60;
const COUNT_CACHE_HEADERS = {
  'Cache-Control': `public, s-maxage=${COUNT_CACHE_SECONDS}, stale-while-revalidate=300`,
};

const loadEventEnrollmentCounts = unstable_cache(
  async (eventIdsKey: string) => {
    const eventIds = eventIdsKey.split(',');
    const { data, error } = await supabaseAdmin
      .from('myuni_event_enrollments')
      .select('event_id')
      .in('event_id', eventIds);

    if (error) throw error;

    const counts: Record<string, number> = Object.fromEntries(
      eventIds.map((id) => [id, 0])
    );
    for (const row of data || []) {
      const eventId = String(row.event_id);
      if (eventId in counts) counts[eventId] += 1;
    }
    return counts;
  },
  ['public-event-enrollment-counts-v2'],
  { revalidate: COUNT_CACHE_SECONDS }
);

/**
 * GET /api/event-enrollments/counts?eventIds=id1,id2
 * Public aggregate attendee counts only.
 */
export async function GET(request: NextRequest) {
  try {
    const eventIdsParam = request.nextUrl.searchParams.get('eventIds') || '';
    const eventIds = Array.from(new Set(eventIdsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)))
      .sort()
      .slice(0, 200);

    if (eventIds.length === 0) {
      return NextResponse.json(
        { success: true, counts: {} },
        { headers: COUNT_CACHE_HEADERS }
      );
    }

    const counts = await loadEventEnrollmentCounts(eventIds.join(','));
    return NextResponse.json(
      { success: true, counts },
      { headers: COUNT_CACHE_HEADERS }
    );
  } catch (error) {
    console.error('GET /api/event-enrollments/counts error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
