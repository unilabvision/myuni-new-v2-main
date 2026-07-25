import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * Returns discount codes owned by the authenticated user (dashboard).
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('discount_codes')
      .select(
        [
          'id',
          'code',
          'discount_amount',
          'discount_type',
          'valid_until',
          'applicable_courses',
          'created_at',
          'max_usage',
          'usage_count',
          'is_used',
          'is_referral',
          'has_balance_limit',
          'remaining_balance',
          'owner_id',
          'influencer_id',
          'minimum_order_amount',
          'maximum_order_amount',
          'full_course_only',
        ].join(',')
      )
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Discount codes mine error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Discount codes mine API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
