import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { requireAdmin } from '@/lib/adminAuth';
import { reconcileOrderWithIyzico } from '@/lib/iyzicoReconcile';

/**
 * Reconcile a pending Iyzico order by querying Iyzico with the stored checkout token.
 * Use when callback was lost (network/timeout) so status becomes:
 * pending | payment_review | failed | completed
 *
 * POST { orderId: "MYU-IYZ-..." }
 * Auth: order owner (Clerk) or admin. Optional CRON_SECRET via Authorization: Bearer ...
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const orderId = body?.orderId || body?.orderid;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization') || '';
    const isCron =
      Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    const admin = await requireAdmin();
    const { userId } = await auth();

    const { data: order } = await supabase
      .from('orders')
      .select('orderid, useremail, custom_data, status')
      .eq('orderid', orderId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const ownerId = order.custom_data?.userId || order.custom_data?.clerkUserId;
    const isOwner = Boolean(userId && ownerId && userId === ownerId);

    if (!isCron && !admin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await reconcileOrderWithIyzico(orderId);
    return NextResponse.json(result, { status: result.success ? 200 : 422 });
  } catch (e) {
    console.error('iyzico-reconcile error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
