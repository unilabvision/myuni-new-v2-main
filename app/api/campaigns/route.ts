import { unstable_cache } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import {
  getPublicCacheHeaders,
  PUBLIC_CACHE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from '@/lib/publicCache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type DiscountRow = {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  applicable_courses?: string[] | null;
  created_at?: string | null;
  is_used?: boolean | null;
  usage_count?: number | null;
  max_usage?: number | null;
  is_campaign?: boolean | null;
  is_referral?: boolean | null;
  influencer_id?: string | null;
  has_balance_limit?: boolean | null;
  remaining_balance?: number | null;
  campaign_name?: string | null;
  campaign_description?: string | null;
  campaign_cover_image?: string | null;
  campaign_slug?: string | null;
  campaign_name_en?: string | null;
  campaign_description_en?: string | null;
};

const PUBLIC_CAMPAIGN_COLUMNS = `
  id, code, discount_amount, discount_type, valid_until, applicable_courses,
  created_at, is_used, usage_count, max_usage, is_campaign, is_referral,
  influencer_id, has_balance_limit, remaining_balance, campaign_name,
  campaign_description, campaign_cover_image, campaign_slug, campaign_name_en,
  campaign_description_en
`;

function isPublicPromoCode(row: DiscountRow): boolean {
  if (row.is_referral || row.influencer_id) return false;
  return !/^(REFUSER_|REF_|REWARDUSER_)/.test(String(row.code || '').toUpperCase());
}

function isDiscountStillUsable(row: DiscountRow): boolean {
  if (!row.valid_until) return false;
  const validUntil = new Date(row.valid_until);
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.valid_until)) {
    validUntil.setHours(23, 59, 59, 999);
  }
  if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) return false;

  const maxUsage = Number(row.max_usage ?? 0);
  if (maxUsage > 0 && Number(row.usage_count ?? 0) >= maxUsage) return false;
  if (maxUsage <= 1 && row.is_used === true) return false;
  return !row.has_balance_limit || Number(row.remaining_balance ?? 0) > 0;
}

async function loadPublicCampaign(): Promise<DiscountRow | null> {
  const { data, error } = await supabaseAdmin.rpc('get_public_campaign');
  if (!error) return (data as DiscountRow | null) || null;

  console.warn('[campaigns] Optimized RPC unavailable, using bounded fallback:', error.message);
  const { data: rows, error: fallbackError } = await supabaseAdmin
    .from('discount_codes')
    .select(PUBLIC_CAMPAIGN_COLUMNS)
    .gte('valid_until', new Date().toISOString().slice(0, 10))
    .order('created_at', { ascending: false })
    .limit(20);

  if (fallbackError) throw fallbackError;
  return (
    ((rows || []) as unknown as DiscountRow[]).find(
      (row) => isPublicPromoCode(row) && isDiscountStillUsable(row)
    ) || null
  );
}

const getCachedPublicCampaign = unstable_cache(
  loadPublicCampaign,
  ['public-campaign-v2'],
  {
    revalidate: PUBLIC_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.campaigns],
  }
);

function formatCampaign(campaign: DiscountRow, locale: string) {
  const localizedTitle =
    locale === 'en'
      ? campaign.campaign_name_en || campaign.campaign_name || campaign.code
      : campaign.campaign_name || campaign.code;
  const localizedDescription =
    locale === 'en'
      ? campaign.campaign_description_en ||
        campaign.campaign_description ||
        `${campaign.discount_amount}% discount code`
      : campaign.campaign_description || `${campaign.discount_amount}% indirim kodu`;

  return {
    id: campaign.id,
    title: localizedTitle,
    description: localizedDescription,
    type: 'discount' as const,
    discount_percentage:
      campaign.discount_type === 'percentage' ? campaign.discount_amount : null,
    discount_amount: campaign.discount_type === 'fixed' ? campaign.discount_amount : null,
    code: campaign.code,
    valid_until: campaign.valid_until,
    image:
      campaign.campaign_cover_image ||
      'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center',
    is_featured: Boolean(campaign.is_campaign),
    is_active: true,
    category: 'İndirim',
    usage_count: campaign.usage_count || 0,
    max_usage: campaign.max_usage || 0,
    campaign_name: localizedTitle,
    campaign_description: localizedDescription,
    created_at: campaign.created_at,
    discount_type: campaign.discount_type,
    applicable_courses: campaign.applicable_courses || [],
    campaign_slug: campaign.campaign_slug || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const locale = (request.nextUrl.searchParams.get('locale') || 'tr').toLowerCase();
    const campaign = await getCachedPublicCampaign();
    return NextResponse.json(
      {
        success: true,
        data: campaign ? [formatCampaign(campaign, locale)] : [],
      },
      { headers: getPublicCacheHeaders() }
    );
  } catch (error) {
    console.error('[campaigns] Request failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
