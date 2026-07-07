import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getActiveOpportunities,
  getOpportunitiesForUser,
  localizeText,
} from '@/lib/opportunityService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const { userId } = await auth();

    if (userId) {
      const personalized = await getOpportunitiesForUser(userId, locale);
      return NextResponse.json({ success: true, opportunities: personalized });
    }

    const opportunities = await getActiveOpportunities(locale);
    const publicList = opportunities.map((o) => ({
      ...o,
      is_recommended: false,
      can_apply: false,
      match_reasons: [],
      matching_course_ids: [],
      user_application_status: null,
      display_title: localizeText(o.title, locale),
    }));

    return NextResponse.json({ success: true, opportunities: publicList });
  } catch (error) {
    console.error('[api/opportunities] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
