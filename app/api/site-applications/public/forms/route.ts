import { NextRequest, NextResponse } from 'next/server';
import { getVisibleSiteApplicationForms } from '@/lib/siteApplications/service';

/** myunilab.net ana site menüsü için aktif formlar */
export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') === 'en' ? 'en' : 'tr';
    const forms = await getVisibleSiteApplicationForms(locale);
    return NextResponse.json({ forms, locale });
  } catch (err) {
    console.error('Public forms list error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
