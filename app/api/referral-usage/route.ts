import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleReferralUsage } from '../../../lib/referralService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ 
        success: false, 
        error: 'Referral kodu gerekli' 
      }, { status: 400 });
    }

    const result = await handleReferralUsage(code, userId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Referral kodu başarıyla kullanıldı! Satın alma işlemi tamamlandığında davet eden kişiye ödül kodu oluşturulacak.' 
      });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error('Referral usage API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bir hata oluştu' 
      }, 
      { status: 500 }
    );
  }
}
