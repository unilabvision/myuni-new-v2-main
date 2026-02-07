import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

export type DiscountCodePayload = {
  code: string;
  discount_amount: number;
  discount_type: 'percentage' | 'fixed';
  valid_until: string;
  applicable_courses?: string[] | null;
  is_referral?: boolean;
  max_usage?: number;
  usage_count?: number;
  is_campaign?: boolean;
  campaign_name?: string | null;
  campaign_description?: string | null;
  campaign_cover_image?: string | null;
  campaign_slug?: string | null;
  campaign_name_en?: string | null;
  campaign_description_en?: string | null;
  has_balance_limit?: boolean;
  remaining_balance?: number | null;
  initial_balance?: number | null;
  owner_id?: string | null;
  influencer_id?: string | null;
  campaign_id?: string | null;
  commission?: number | null;
};

/**
 * GET – List all discount codes (admin only).
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const isReferral = searchParams.get('is_referral');
    const isCampaign = searchParams.get('is_campaign');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    let query = supabaseAdmin
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (isReferral === 'true') query = query.eq('is_referral', true);
    if (isReferral === 'false') query = query.eq('is_referral', false);
    if (isCampaign === 'true') query = query.eq('is_campaign', true);

    const { data, error } = await query;

    if (error) {
      console.error('Admin discount-codes list error:', error);
      return NextResponse.json(
        { error: error.message || 'Liste alınamadı' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: data ?? [] });
  } catch (e) {
    console.error('Admin discount-codes GET error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}

/**
 * POST – Create a new discount code (admin only).
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as DiscountCodePayload;

    const code = (body.code ?? '').trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { error: 'Kod alanı zorunludur' },
        { status: 400 }
      );
    }

    const validUntil = body.valid_until ?? '';
    if (!validUntil) {
      return NextResponse.json(
        { error: 'Geçerlilik tarihi (valid_until) zorunludur' },
        { status: 400 }
      );
    }

    const discountAmount = Number(body.discount_amount);
    if (Number.isNaN(discountAmount) || discountAmount < 0) {
      return NextResponse.json(
        { error: 'Geçerli bir indirim miktarı girin' },
        { status: 400 }
      );
    }

    const discountType = body.discount_type === 'fixed' ? 'fixed' : 'percentage';
    const hasBalanceLimit = Boolean(body.has_balance_limit);
    const remainingBalance = hasBalanceLimit
      ? (body.remaining_balance != null ? Number(body.remaining_balance) : 0)
      : null;
    const initialBalance = hasBalanceLimit
      ? (body.initial_balance != null ? Number(body.initial_balance) : remainingBalance)
      : null;

    const row = {
      code,
      discount_amount: discountAmount,
      discount_type: discountType,
      valid_until: validUntil,
      applicable_courses: Array.isArray(body.applicable_courses) ? body.applicable_courses : [],
      is_referral: Boolean(body.is_referral),
      max_usage: Math.max(1, Math.min(999999, Number(body.max_usage) || 1)),
      usage_count: Number(body.usage_count) || 0,
      is_campaign: Boolean(body.is_campaign),
      campaign_name: body.campaign_name ?? null,
      campaign_description: body.campaign_description ?? null,
      campaign_cover_image: body.campaign_cover_image ?? null,
      campaign_slug: body.campaign_slug ?? null,
      campaign_name_en: body.campaign_name_en ?? null,
      campaign_description_en: body.campaign_description_en ?? null,
      has_balance_limit: hasBalanceLimit,
      remaining_balance: remainingBalance,
      initial_balance: initialBalance,
      owner_id: body.owner_id ?? null,
      influencer_id: body.influencer_id ?? null,
      campaign_id: body.campaign_id ?? null,
      commission: body.commission != null ? Number(body.commission) : null,
    };

    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .insert(row)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Bu kod zaten kayıtlı. Farklı bir kod girin.' },
          { status: 409 }
        );
      }
      console.error('Admin discount-codes create error:', error);
      return NextResponse.json(
        { error: error.message || 'Kod eklenemedi' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Admin discount-codes POST error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
