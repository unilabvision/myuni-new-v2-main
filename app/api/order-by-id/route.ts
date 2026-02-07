// Shopier link entegrasyonu: Ödeme sonrası Shopier kullanıcıyı order_id ile yönlendirdiğinde
// bu API ile sipariş sorgulanır; payment-success sayfasına courseId ve name ile yönlendirme yapılır.

import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id')?.trim();

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Missing order_id' }, { status: 400 });
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('orderid, courseid, coursename, status')
      .eq('orderid', orderId)
      .maybeSingle();

    if (error) {
      console.error('[order-by-id]', error);
      return NextResponse.json({ success: false, message: 'Order lookup failed' }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      courseId: order.courseid,
      courseName: order.coursename,
      status: order.status,
    });
  } catch (e) {
    console.error('[order-by-id]', e);
    return NextResponse.json(
      { success: false, message: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
