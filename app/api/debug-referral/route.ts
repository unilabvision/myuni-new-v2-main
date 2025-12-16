import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '../../../lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const debugUserId = url.searchParams.get('userId') || userId;

    console.log('=== DEBUG REFERRAL SYSTEM ===');
    console.log('Debug User ID:', debugUserId);

    // 1. Bu kullanıcının referral kodunu bul
    const { data: userReferralCode, error: userCodeError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', debugUserId)
      .eq('is_referral', true)
      .not('code', 'like', 'USAGE_%') // Orijinal referral kodları
      .single();

    console.log('User referral code:', userReferralCode);
    console.log('User code error:', userCodeError);

    // 2. Bu kullanıcının kullandığı referral kodlarını bul
    const { data: usedReferralCodes, error: usedCodesError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('used_by', debugUserId)
      .eq('is_referral', true)
      .eq('is_used', true);

    console.log('Used referral codes:', usedReferralCodes);
    console.log('Used codes error:', usedCodesError);

    // 3. Bu kullanıcının kazandığı ödül kodlarını bul
    const { data: rewardCodes, error: rewardError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('influencer_id', debugUserId)
      .eq('is_referral', false)
      .eq('discount_amount', 15);

    console.log('Reward codes:', rewardCodes);
    console.log('Reward error:', rewardError);

    // 4. Bu kullanıcının kullandığı tüm kodları bul
    const { data: allUsedCodes, error: allCodesError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('used_by', debugUserId)
      .eq('is_used', true);

    console.log('All used codes:', allUsedCodes);
    console.log('All codes error:', allCodesError);

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
          allCodesError
        }
      }
    });

  } catch (error) {
    console.error('Debug referral error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Debug işlemi başarısız' 
      }, 
      { status: 500 }
    );
  }
}
