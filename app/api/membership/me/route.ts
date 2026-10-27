import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getMembershipTemporalState, getRemainingDays } from '@/lib/membershipTime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const { data: passes, error } = await supabaseAdmin
    .from('myuni_membership_passes')
    .select('id, status, starts_at, ends_at, revoked_at, plan_snapshot')
    .eq('user_id', userId)
    .order('ends_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[membership/me] query failed', error);
    return NextResponse.json({ error: 'Membership could not be loaded' }, { status: 500 });
  }

  const memberships = (passes ?? []).map((pass) => {
    const status = getMembershipTemporalState(pass, now);
    return {
      ...pass,
      status,
      isActive: status === 'active',
      remainingDays: status === 'active' ? getRemainingDays(pass.ends_at, now) : 0,
    };
  });
  const current = memberships.find((pass) => pass.isActive) ?? null;

  return NextResponse.json(
    { isActive: Boolean(current), current, memberships },
    { headers: { 'Cache-Control': 'private, no-store' } }
  );
}
