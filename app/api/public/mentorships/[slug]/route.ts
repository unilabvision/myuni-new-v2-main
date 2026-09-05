import { NextRequest, NextResponse } from 'next/server';
import { getPublicMentorshipBySlug } from '@/lib/mentorshipService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const { slug } = await context.params;
    const mentorship = await getPublicMentorshipBySlug(slug, locale);

    if (!mentorship) {
      return NextResponse.json(
        { success: false, error: 'Not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, locale, mentorship });
  } catch (err) {
    console.error('Public mentorship detail error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load mentorship',
      },
      { status: 500 }
    );
  }
}
