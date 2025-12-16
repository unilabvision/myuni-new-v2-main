import { NextRequest, NextResponse } from 'next/server';
import { getEventsForFilter, getAllEvents } from '@/lib/eventService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const type = searchParams.get('type') || 'all'; // 'all' or 'filter'
    
    console.log('Fetching events via API:', { locale, type });

    let events;
    if (type === 'filter') {
      events = await getEventsForFilter(locale);
    } else {
      events = await getAllEvents(locale);
    }

    console.log(`API returned ${events.length} events`);

    return NextResponse.json({
      success: true,
      data: events,
      count: events.length
    });

  } catch (error) {
    console.error('Error in events API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch events',
        data: []
      },
      { status: 500 }
    );
  }
}
