import { NextRequest, NextResponse } from 'next/server';
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
  campaign_discription_en?: string | null;
};

function isPublicPromoCode(row: DiscountRow): boolean {
  if (row.is_referral) return false;
  // İnfluencer kodları influencer tarafından dağıtılır; public şeritte gösterilmez
  if (row.influencer_id) return false;
  const code = String(row.code || '').toUpperCase();
  if (code.startsWith('REFUSER_') || code.startsWith('REF_') || code.startsWith('REWARDUSER_')) {
    return false;
  }
  return true;
}

/**
 * Açık kod: süresi dolmamış + kullanım hakkı var.
 * Çok kullanımlılarda is_used bazen yanlış true kalıyor (YAZ26);
 * asıl ölçüt usage_count < max_usage.
 * Tek kullanımlılarda is_used=true → kapalı.
 */
function isDiscountStillUsable(row: DiscountRow): boolean {
  if (!row.valid_until) return false;
  const validUntil = new Date(row.valid_until);
  if (/^\d{4}-\d{2}-\d{2}$/.test(row.valid_until)) {
    validUntil.setHours(23, 59, 59, 999);
  }
  if (Number.isNaN(validUntil.getTime()) || validUntil <= new Date()) return false;

  const maxUsage = Number(row.max_usage ?? 0);
  const used = Number(row.usage_count ?? 0);

  if (maxUsage > 0 && used >= maxUsage) return false;

  // Tek kullanımlık kod kapandıysa gösterme
  if (maxUsage <= 1 && row.is_used === true) return false;

  if (row.has_balance_limit && Number(row.remaining_balance ?? 0) <= 0) return false;

  return true;
}

function formatCampaign(campaign: DiscountRow, locale: string) {
  const campaignImage =
    campaign.campaign_cover_image && campaign.campaign_cover_image.trim() !== ''
      ? campaign.campaign_cover_image
      : 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop&crop=center';

  const localizedTitle =
    locale === 'en'
      ? campaign.campaign_name_en || campaign.campaign_name || campaign.code
      : campaign.campaign_name || campaign.code;

  const localizedDescription =
    locale === 'en'
      ? campaign.campaign_description_en ||
        campaign.campaign_discription_en ||
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
    image: campaignImage,
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
    const { searchParams } = new URL(request.url);
    const locale = (searchParams.get('locale') || 'tr').toLowerCase();

    // En son oluşturulan önce — şeritte yalnızca en yeni açık kod
    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Campaigns fetch error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const rows = (data || []) as DiscountRow[];

    // Sadece en son açık kod (şimdilik YAZ26); FARMA30 / HOŞGELDİN15 vb. dönmez
    const newestOpen = rows.find((r) => isPublicPromoCode(r) && isDiscountStillUsable(r));

    const formattedCampaigns = newestOpen ? [formatCampaign(newestOpen, locale)] : [];

    return NextResponse.json({
      success: true,
      data: formattedCampaigns,
    });
  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
