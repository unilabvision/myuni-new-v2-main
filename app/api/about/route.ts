import { NextRequest, NextResponse } from 'next/server';
import aboutContent, { type AboutContent } from '@/app/components/pages/about/content';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';

    console.log('Fetching about page content:', locale);

    const content: AboutContent = aboutContent[locale as keyof typeof aboutContent] || aboutContent.tr;

    return NextResponse.json(
      {
        success: true,
        data: content
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

  } catch (error) {
    console.error('Error in about API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch about content'
      },
      { status: 500 }
    );
  }
}
