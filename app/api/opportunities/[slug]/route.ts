import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getOpportunityWithMatchForUser,
  localizeText,
} from '@/lib/opportunityService';
import { isUnilabVolunteerSlug } from '@/lib/unilabVolunteer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const includeInactive =
      searchParams.get('includeInactive') === '1' && isUnilabVolunteerSlug(slug);
    const { userId } = await auth();

    const opportunity = await getOpportunityWithMatchForUser(
      slug,
      userId,
      locale,
      { requireActive: !includeInactive }
    );

    if (!opportunity) {
      return NextResponse.json({ error: 'İlan bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      opportunity: {
        ...opportunity,
        display_title: localizeText(opportunity.title, locale),
        display_description: localizeText(opportunity.description, locale),
      },
    });
  } catch (error) {
    console.error('[api/opportunities/slug] GET:', error);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
