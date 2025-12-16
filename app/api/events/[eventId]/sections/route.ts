// app/api/events/[eventId]/sections/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getEventSections } from '../../../../../lib/eventService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching sections for event:', eventId);

    // Use the existing getEventSections function
    const sections = await getEventSections(eventId);

    if (!sections || sections.length === 0) {
      return NextResponse.json(
        { error: 'No sections found for this event' },
        { status: 404 }
      );
    }

    return NextResponse.json(sections, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });

  } catch (error) {
    console.error('Error in event sections API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}