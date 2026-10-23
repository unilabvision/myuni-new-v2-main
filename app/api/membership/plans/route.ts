import { NextResponse } from 'next/server';
import { getPublishedMembershipPlans } from '@/lib/membershipPlans';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await getPublishedMembershipPlans();
    return NextResponse.json(
      { plans },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('[membership/plans] query failed', error);
    return NextResponse.json(
      { error: 'Membership plans are temporarily unavailable.' },
      { status: 503 }
    );
  }
}
