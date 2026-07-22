import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow inspecting the authenticated user's own referral data
    const debugUserId = userId;

    console.log('=== DEBUG REFERRAL SYSTEM ===');
    console.log('Debug User ID:', debugUserId);

    const { data: userReferralCode, error: userCodeError } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', debugUserId)
      .eq('is_referral', true)
      .not('code', 'like', 'USAGE_%')
      .single();

    const { data: usedReferralCodes, error: usedCodesError } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('used_by', debugUserId)
      .eq('is_referral', true)
      .eq('is_used', true);

    const { data: rewardCodes, error: rewardError } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', debugUserId)
      .eq('is_referral', false)
      .eq('discount_amount', 15);

    const { data: allUsedCodes, error: allCodesError } = await supabaseAdmin
      .from('discount_codes')
      .select('*')
      .eq('used_by', debugUserId)
      .eq('is_used', true);

    return NextResponse.json({
      success: true,
      data: {
        userReferralCode,
        usedReferralCodes,
        rewardCodes,
        allUsedCodes,
        errors: {
          userCodeError,
          usedCodesError,
          rewardError,
          allCodesError,
        },
      },
    });
  } catch (error) {
    console.error('Debug referral error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Debug işlemi başarısız',
      },
      { status: 500 }
    );
  }
}
