import { NextRequest, NextResponse } from 'next/server';
import { getVisibleSiteApplicationForms } from '@/lib/siteApplications/service';

/** myunilab.net ana site menüsü için aktif formlar */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const forms = await getVisibleSiteApplicationForms(locale);
    return NextResponse.json(
      { forms, locale },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
    );
  } catch (err) {
    console.error('Public forms list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
