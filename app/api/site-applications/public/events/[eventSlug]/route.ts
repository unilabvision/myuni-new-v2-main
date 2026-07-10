import { NextRequest, NextResponse } from 'next/server';
import { getEventApplicationSummary } from '@/lib/siteApplications/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const summary = await getEventApplicationSummary(eventSlug, locale);

    if (!summary) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json(
      { available: true, ...summary },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
    );
  } catch (err) {
    console.error('Event application summary error:', err);
    return NextResponse.json({ available: false }, { status: 500 });
  }
}
