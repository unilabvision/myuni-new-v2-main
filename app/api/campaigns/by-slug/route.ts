import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type CampaignRow = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses: string[] | null;
  created_at: string;
  is_used: boolean | null;
  used_by: string | null;
  used_at: string | null;
  influencer_id: string | null;
  campaign_id: string | null;
  commission: number | null;
  is_referral: boolean | null;
  max_usage: number | null;
  usage_count: number | null;
  is_campaign: boolean | null;
  campaign_name: string | null;
  campaign_description: string | null;
  campaign_cover_image: string | null;
  campaign_slug: string | null;
  campaign_name_en?: string | null;
  campaign_description_en?: string | null;
};

function createSlug(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const CAMPAIGN_SELECT = [
  'id',
  'code',
  'discount_amount',
  'discount_type',
  'valid_until',
  'applicable_courses',
  'created_at',
  'is_used',
  'used_by',
  'used_at',
  'influencer_id',
  'campaign_id',
  'commission',
  'is_referral',
  'max_usage',
  'usage_count',
  'is_campaign',
  'campaign_name',
  'campaign_description',
  'campaign_cover_image',
  'campaign_slug',
  'campaign_name_en',
  'campaign_description_en',
].join(',');

/**
 * Public campaign lookup by slug. Only returns is_campaign=true rows.
 */
export async function GET(request: NextRequest) {
  try {
    const slug = (request.nextUrl.searchParams.get('slug') || '').trim();
    const relatedLimit = Math.min(
      parseInt(request.nextUrl.searchParams.get('relatedLimit') || '3', 10) || 3,
      10
    );

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'slug is required' },
        { status: 400 }
      );
    }

    const bySlug = await supabaseAdmin
      .from('discount_codes')
      .select(CAMPAIGN_SELECT)
      .eq('is_campaign', true)
      .eq('campaign_slug', slug)
      .limit(1)
      .maybeSingle();

    if (bySlug.error && bySlug.error.code !== 'PGRST116') {
      console.error('Campaign by-slug error:', bySlug.error);
      return NextResponse.json(
        { success: false, error: bySlug.error.message },
        { status: 500 }
      );
    }

    let campaign = bySlug.data as CampaignRow | null;

    if (!campaign) {
      const { data: campaigns, error } = await supabaseAdmin
        .from('discount_codes')
        .select(CAMPAIGN_SELECT)
        .eq('is_campaign', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Campaign fallback list error:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      campaign =
        ((campaigns || []) as CampaignRow[]).find((c) => {
          if (!c.campaign_name) return false;
          return createSlug(c.campaign_name) === slug;
        }) || null;
    }

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    const { data: related, error: relatedError } = await supabaseAdmin
      .from('discount_codes')
      .select(CAMPAIGN_SELECT)
      .eq('is_campaign', true)
      .neq('id', campaign.id)
      .order('created_at', { ascending: false })
      .limit(relatedLimit);

    if (relatedError) {
      console.error('Related campaigns error:', relatedError);
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        related: (related || []) as CampaignRow[],
      },
    });
  } catch (error) {
    console.error('Campaigns by-slug API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
