import { NextRequest, NextResponse } from 'next/server';
import { markSiteApplicationPaid } from '@/lib/siteApplications/applicationPayments';

/** Uniboard / harici ödeme onayı (opsiyonel webhook) */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.SITE_APPLICATION_PAYMENT_SECRET;
    if (!secret) {
      return NextResponse.json({ error: 'Not configured' }, { status: 503 });
    }

    const headerSecret = request.headers.get('x-payment-secret');
    if (headerSecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const applicationId = String(body.applicationId || '').trim();
    const orderId = String(body.orderId || '').trim();
    const paymentMethod = String(body.paymentMethod || 'iyzico').trim();

    if (!applicationId || !orderId) {
      return NextResponse.json({ error: 'applicationId and orderId required' }, { status: 400 });
    }

    const result = await markSiteApplicationPaid(applicationId, orderId, paymentMethod);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      alreadyPaid: result.alreadyPaid === true,
    });
  } catch (err) {
    console.error('Payment confirm webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
