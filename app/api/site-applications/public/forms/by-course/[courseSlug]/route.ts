import { NextRequest, NextResponse } from 'next/server';
import { getPublicFormByCourseSlug } from '@/lib/siteApplications/service';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ courseSlug: string }> }
) {
  try {
    const { courseSlug } = await context.params;
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';

    const result = await getPublicFormByCourseSlug(courseSlug, locale);
    if (!result) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Public form by course error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
