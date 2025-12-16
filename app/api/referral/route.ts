import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  createReferralCode, 
  getReferralStats, 
  getUserReferralCode, 
  getUserRewardCodes
} from '../../../lib/referralService';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = await getReferralStats(userId);
        return NextResponse.json({ success: true, data: stats });

      case 'code':
        const code = await getUserReferralCode(userId);
        return NextResponse.json({ success: true, data: { code } });

      case 'rewards':
        const rewards = await getUserRewardCodes(userId);
        return NextResponse.json({ success: true, data: rewards });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bir hata oluştu' 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create':
        const result = await createReferralCode(userId);
        return NextResponse.json(result);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Referral API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Bir hata oluştu' 
      }, 
      { status: 500 }
    );
  }
}
