import { NextRequest, NextResponse } from 'next/server';
import { getPublicMentorships } from '@/lib/mentorshipService';

/** Site — /tr/mentorluk listesi (dashboard mentorships tablosu, is_active=true) */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const featuredOnly = request.nextUrl.searchParams.get('featured') === 'true';
    const mentorships = await getPublicMentorships(locale, { featuredOnly });

    return NextResponse.json({
      success: true,
      locale,
      mentorships,
      count: mentorships.length,
    });
  } catch (err) {
    console.error('Public mentorships list error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to load mentorships',
        mentorships: [],
      },
      { status: 500 }
    );
  }
}
