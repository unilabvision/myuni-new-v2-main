import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';

type UpdatePayload = {
  code?: string;
  discount_amount?: number;
  discount_type?: 'percentage' | 'fixed';
  valid_until?: string;
  applicable_courses?: string[] | null;
  max_usage?: number;
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
};

/**
 * GET – Get a single discount code by id (admin only).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? 'Kayıt bulunamadı' },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

/**
 * PATCH – Update a discount code (admin only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  }

  const body = (await request.json()) as UpdatePayload;

  const updates: Record<string, unknown> = {};

  if (body.code !== undefined) updates.code = String(body.code).trim().toUpperCase();
  if (body.discount_amount !== undefined) updates.discount_amount = Number(body.discount_amount);
  if (body.discount_type !== undefined) updates.discount_type = body.discount_type;
  if (body.valid_until !== undefined) updates.valid_until = body.valid_until;
  if (body.applicable_courses !== undefined) updates.applicable_courses = body.applicable_courses;
  if (body.max_usage !== undefined) updates.max_usage = Math.max(1, Number(body.max_usage));
  if (body.is_campaign !== undefined) updates.is_campaign = body.is_campaign;
  if (body.campaign_name !== undefined) updates.campaign_name = body.campaign_name;
  if (body.campaign_description !== undefined) updates.campaign_description = body.campaign_description;
  if (body.campaign_cover_image !== undefined) updates.campaign_cover_image = body.campaign_cover_image;
  if (body.campaign_slug !== undefined) updates.campaign_slug = body.campaign_slug;
  if (body.campaign_name_en !== undefined) updates.campaign_name_en = body.campaign_name_en;
  if (body.campaign_description_en !== undefined) updates.campaign_description_en = body.campaign_description_en;
  if (body.has_balance_limit !== undefined) updates.has_balance_limit = body.has_balance_limit;
  if (body.remaining_balance !== undefined) updates.remaining_balance = body.remaining_balance;
  if (body.initial_balance !== undefined) updates.initial_balance = body.initial_balance;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: 'Güncellenecek alan yok' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Admin discount-codes PATCH error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Güncellenemedi' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

/**
 * DELETE – Delete a discount code (admin only).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Admin discount-codes DELETE error:', error);
    return NextResponse.json(
      { error: error.message ?? 'Silinemedi' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
