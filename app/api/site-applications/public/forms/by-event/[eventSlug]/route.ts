import { NextRequest, NextResponse } from 'next/server';
import { getPublicFormByEventSlug } from '@/lib/siteApplications/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventSlug: string }> }
) {
  try {
    const { eventSlug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';

    const result = await getPublicFormByEventSlug(eventSlug, locale);
    if (!result) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('Public form by event error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
