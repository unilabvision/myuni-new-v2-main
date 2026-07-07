import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getOpportunitiesForUser,
  getUserApplications,
} from '@/lib/opportunityService';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locale =
      new URL(request.url).searchParams.get('locale') || 'tr';

    const [opportunities, applications] = await Promise.all([
      getOpportunitiesForUser(userId, locale),
      getUserApplications(userId),
    ]);

    return NextResponse.json({
      success: true,
      recommended: opportunities.filter((o) => o.is_recommended),
      all: opportunities,
      applications,
    });
  } catch (error) {
    console.error('[api/opportunities/my] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
