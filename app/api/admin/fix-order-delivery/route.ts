import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { deliverOrderAccess, orderNeedsDelivery } from '@/lib/orderDelivery';

/**
 * Admin recovery: re-deliver enrollments/purchases for a paid order
 * that is completed/payment_error/pending but missing access.
 *
 * POST { orderId: "MYU-IYZ-..." }
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const orderId = body?.orderId || body?.orderid;

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('orderid', orderId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const needs = await orderNeedsDelivery(order);
    if (!needs) {
      return NextResponse.json({
        success: true,
        alreadyDelivered: true,
        orderId,
        status: order.status,
        message: 'Access already present for all items',
      });
    }

    const delivery = await deliverOrderAccess(order);

    const nextStatus =
      order.status === 'pending' ||
      order.status === 'processing' ||
      order.status === 'payment_error' ||
      order.status === 'failed'
        ? delivery.success
          ? 'completed'
          : 'payment_error'
        : order.status;

    await supabase
      .from('orders')
      .update({
        status: nextStatus,
        enrolled: delivery.success,
        enrollmentid: delivery.firstEnrollmentId || order.enrollmentid || null,
        updated_at: new Date().toISOString(),
        custom_data: {
          ...order.custom_data,
          adminDeliveryRepair: {
            at: new Date().toISOString(),
            by: admin.userId,
            success: delivery.success,
            errors: delivery.errors,
            delivered: delivery.deliveredTitles,
          },
        },
      })
      .eq('orderid', orderId);

    return NextResponse.json({
      success: delivery.success,
      orderId,
      status: nextStatus,
      delivered: delivery.deliveredTitles,
      errors: delivery.errors,
      firstEnrollmentId: delivery.firstEnrollmentId,
    });
  } catch (e) {
    console.error('admin/fix-order-delivery error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
