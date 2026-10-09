import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getEventsForFilter, getAllEvents } from '@/lib/eventService';
import {
  getPublicCacheHeaders,
  PUBLIC_CACHE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from '@/lib/publicCache';

const getCachedEvents = unstable_cache(
  async (locale: string, type: string) =>
    type === 'filter' ? getEventsForFilter(locale) : getAllEvents(locale),
  ['public-events-v2'],
  {
    revalidate: PUBLIC_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.events],
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const type = searchParams.get('type') || 'all'; // 'all' or 'filter'
    
    console.log('Fetching events via API:', { locale, type });

    const events = await getCachedEvents(locale, type);

    console.log(`API returned ${events.length} events`);

    return NextResponse.json(
      {
        success: true,
        data: events,
        count: events.length
      },
      { headers: getPublicCacheHeaders() }
    );

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
