import 'server-only';
import { supabaseAdmin as supabase } from './supabaseAdmin';
import {
  buildOrderSnapshot,
  resolveEmailCourseType,
  rescaleSnapshotForActualPaid,
  type OrderSnapshot,
} from './orderSnapshot';
import { deliverOrderAccess, orderNeedsDelivery } from './orderDelivery';
import {
  mapIyzicoPaymentToOrderStatus,
  retrieveCheckoutForm,
  type IyzicoCheckoutRetrieveResult,
} from './iyzicoClient';
import {
  markSiteApplicationPaid,
  notifyUniboardPaymentConfirm,
} from './siteApplications/applicationPayments';

function isEventCertificateOrder(order: any): boolean {
  return order?.custom_data?.itemType === 'event_certificate';
}

function resolveSiteApplicationId(order: any): string | null {
  const fromCustom = order?.custom_data?.siteApplicationId;
  if (typeof fromCustom === 'string' && fromCustom.trim()) return fromCustom.trim();
  if (order?.courseid) return String(order.courseid);
  return null;
}

/**
 * Finalize a paid guest event-certificate order: mark application paid,
 * notify Uniboard, complete the order. Does NOT create Clerk enrollments.
 */
async function finalizeEventCertificateOrder(
  order: any,
  paidPriceNum: number,
  baseCustom: Record<string, unknown>,
  retrieve: IyzicoCheckoutRetrieveResult,
  orderSnapshot: OrderSnapshot
): Promise<ReconcileResult> {
  const orderId = order.orderid;
  const siteApplicationId = resolveSiteApplicationId(order);

  if (!siteApplicationId) {
    await supabase
      .from('orders')
      .update({
        status: 'payment_error',
        enrolled: false,
        amount: paidPriceNum,
        updated_at: new Date().toISOString(),
        custom_data: {
          ...baseCustom,
          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
          deliveryErrors: ['Missing siteApplicationId on event_certificate order'],
        },
      })
      .eq('orderid', orderId);

    return {
      success: false,
      orderId,
      orderStatus: 'payment_error',
      iyzicoPaymentStatus: String(baseCustom.iyzicoPaymentStatus || ''),
      fraudStatus: (baseCustom.iyzicoFraudStatus as number | null) ?? null,
      message: 'Iyzico SUCCESS but event application id missing',
      errors: ['Missing siteApplicationId on event_certificate order'],
    };
  }

  const paymentResult = await markSiteApplicationPaid(
    siteApplicationId,
    orderId,
    'iyzico'
  );

  if (!paymentResult.success && !paymentResult.alreadyPaid) {
    await supabase
      .from('orders')
      .update({
        status: 'payment_error',
        enrolled: false,
        amount: paidPriceNum,
        updated_at: new Date().toISOString(),
        custom_data: {
          ...baseCustom,
          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
          deliveryErrors: [paymentResult.error || 'Application payment update failed'],
        },
      })
      .eq('orderid', orderId);

    return {
      success: false,
      orderId,
      orderStatus: 'payment_error',
      iyzicoPaymentStatus: String(baseCustom.iyzicoPaymentStatus || ''),
      fraudStatus: (baseCustom.iyzicoFraudStatus as number | null) ?? null,
      message: 'Iyzico SUCCESS but application payment update failed',
      errors: [paymentResult.error || 'Application payment update failed'],
    };
  }

  await notifyUniboardPaymentConfirm(siteApplicationId, orderId);

  await supabase
    .from('orders')
    .update({
      status: 'completed',
      enrolled: false,
      amount: paidPriceNum,
      updated_at: new Date().toISOString(),
      custom_data: {
        ...baseCustom,
        orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
        siteApplicationId,
        reconciledVia: 'iyzico-reconcile',
        eventCertificateFinalizedAt: new Date().toISOString(),
      },
    })
    .eq('orderid', orderId);

  return {
    success: true,
    orderId,
    orderStatus: 'completed',
    iyzicoPaymentStatus: String(baseCustom.iyzicoPaymentStatus || ''),
    fraudStatus: (baseCustom.iyzicoFraudStatus as number | null) ?? null,
    delivered: [order.coursename || siteApplicationId],
    message: paymentResult.alreadyPaid
      ? 'Iyzico SUCCESS — event certificate already paid; order completed'
      : 'Iyzico SUCCESS — event certificate marked paid, Uniboard notified',
  };
}

export type ReconcileResult = {
  success: boolean;
  orderId: string;
  orderStatus: string;
  iyzicoPaymentStatus?: string;
  fraudStatus?: number | null;
  delivered?: string[];
  emailSent?: boolean;
  message: string;
  errors?: string[];
};

async function sendConfirmationIfNeeded(order: any, snapshot: OrderSnapshot, paidPriceNum: number) {
  if (order.custom_data?.emailSentAt) {
    return false;
  }

  const { sendPurchaseConfirmationEmail } = await import('@/app/_services/emailService');
  const locale = order.custom_data?.locale || 'tr';
  const isCartMode = order.custom_data?.cartMode === true;
  const emailTitle =
    isCartMode || snapshot.items.length > 1
      ? 'Sepet Alımı'
      : snapshot.items[0]?.title || order.coursename || 'Sipariş';

  await sendPurchaseConfirmationEmail(
    {
      name: order.custom_data?.userName || order.useremail?.split('@')[0],
      email: order.useremail,
    },
    { title: emailTitle, items: snapshot.items },
    {
      orderId: order.orderid,
      amount: paidPriceNum,
      isFree: paidPriceNum <= 0,
      listTotal: snapshot.listTotal,
      discountAmount: snapshot.discountAmount,
      discountCodes: snapshot.discountCodes,
      commissionAmount: snapshot.commissionAmount || 0,
    },
    locale,
    resolveEmailCourseType(snapshot, isCartMode)
  );

  return true;
}

/**
 * Ask Iyzico for the real payment status of a pending order (using stored checkout token)
 * and sync Supabase: pending | payment_review | failed | completed (+ deliver/email).
 */
export async function reconcileOrderWithIyzico(orderId: string): Promise<ReconcileResult> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('orderid', orderId)
    .maybeSingle();

  if (error || !order) {
    return {
      success: false,
      orderId,
      orderStatus: 'unknown',
      message: error?.message || 'Order not found',
    };
  }

  // Already finalized — still repair delivery if needed (courses only)
  if (order.status === 'completed') {
    if (isEventCertificateOrder(order)) {
      const siteApplicationId = resolveSiteApplicationId(order);
      if (siteApplicationId) {
        const paymentResult = await markSiteApplicationPaid(
          siteApplicationId,
          orderId,
          'iyzico'
        );
        if (paymentResult.success) {
          await notifyUniboardPaymentConfirm(siteApplicationId, orderId);
        }
      }
      return {
        success: true,
        orderId,
        orderStatus: 'completed',
        message: 'Event certificate order already completed',
      };
    }

    const needs = await orderNeedsDelivery(order);
    if (needs) {
      const delivery = await deliverOrderAccess(order);
      await supabase
        .from('orders')
        .update({
          enrolled: delivery.success,
          enrollmentid: delivery.firstEnrollmentId || order.enrollmentid,
          updated_at: new Date().toISOString(),
        })
        .eq('orderid', orderId);
      return {
        success: delivery.success,
        orderId,
        orderStatus: 'completed',
        delivered: delivery.deliveredTitles,
        message: delivery.success
          ? 'Order already completed; missing access repaired'
          : 'Order completed but delivery still incomplete',
        errors: delivery.errors,
      };
    }
    return {
      success: true,
      orderId,
      orderStatus: 'completed',
      message: 'Order already completed',
    };
  }

  const token = order.custom_data?.iyzicoCheckoutToken;
  if (!token) {
    return {
      success: false,
      orderId,
      orderStatus: order.status,
      message:
        'No iyzicoCheckoutToken on order — cannot query Iyzico. Older checkouts before token persistence need manual admin fix.',
    };
  }

  let retrieve: IyzicoCheckoutRetrieveResult;
  try {
    retrieve = await retrieveCheckoutForm(token, orderId);
  } catch (e) {
    return {
      success: false,
      orderId,
      orderStatus: order.status,
      message: e instanceof Error ? e.message : 'Iyzico retrieve failed',
    };
  }

  const mapped = mapIyzicoPaymentToOrderStatus(retrieve);
  const paidPriceNum = retrieve.paidPrice
    ? parseFloat(String(retrieve.paidPrice))
    : Number(order.amount) || 0;

  const baseCustom = {
    ...order.custom_data,
    iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
    iyzicoFraudStatus: mapped.fraudStatus,
    iyzicoReconciledAt: new Date().toISOString(),
    iyzico_paymentId: retrieve.paymentId || order.custom_data?.iyzico_paymentId,
    iyzico_authCode: retrieve.authCode || order.custom_data?.iyzico_authCode,
  };

  // ---- Still open at Iyzico ----
  if (mapped.orderStatus === 'pending') {
    await supabase
      .from('orders')
      .update({
        status: 'pending',
        updated_at: new Date().toISOString(),
        custom_data: baseCustom,
      })
      .eq('orderid', orderId);

    return {
      success: true,
      orderId,
      orderStatus: 'pending',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      fraudStatus: mapped.fraudStatus,
      message: 'Iyzico: payment not finalized yet — order remains pending',
    };
  }

  // ---- Fraud review ----
  if (mapped.orderStatus === 'payment_review') {
    await supabase
      .from('orders')
      .update({
        status: 'payment_review',
        updated_at: new Date().toISOString(),
        amount: paidPriceNum || order.amount,
        custom_data: baseCustom,
      })
      .eq('orderid', orderId);

    return {
      success: true,
      orderId,
      orderStatus: 'payment_review',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      fraudStatus: mapped.fraudStatus,
      message: 'Iyzico: payment captured but in fraud review — awaiting approval',
    };
  }

  // ---- Failed ----
  if (mapped.orderStatus === 'failed') {
    await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString(),
        custom_data: baseCustom,
      })
      .eq('orderid', orderId)
      .in('status', ['pending', 'failed', 'payment_error', 'payment_review', 'processing']);

    return {
      success: true,
      orderId,
      orderStatus: 'failed',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      fraudStatus: mapped.fraudStatus,
      message: 'Iyzico: payment failed/rejected',
    };
  }

  // ---- SUCCESS / approved → claim + deliver ----
  // Include `processing` so stuck mid-callback / mid-reconcile orders can be finalized.
  const { data: claimed, error: claimError } = await supabase
    .from('orders')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('orderid', orderId)
    .in('status', ['pending', 'failed', 'payment_error', 'payment_review', 'processing', 'cancelled'])
    .select()
    .maybeSingle();

  if (claimError || !claimed) {
    // Another worker finished it — repair if needed
    const { data: fresh } = await supabase
      .from('orders')
      .select('*')
      .eq('orderid', orderId)
      .maybeSingle();

    if (fresh && isEventCertificateOrder(fresh) && fresh.status !== 'completed') {
      const repairSnapshot: OrderSnapshot =
        fresh.custom_data?.orderSnapshot &&
        Array.isArray(fresh.custom_data.orderSnapshot.items) &&
        fresh.custom_data.orderSnapshot.items.length > 0
          ? rescaleSnapshotForActualPaid(
              fresh.custom_data.orderSnapshot as OrderSnapshot,
              paidPriceNum
            )
          : buildOrderSnapshot(
              [
                {
                  id: fresh.courseid,
                  title: fresh.coursename,
                  price: Number(fresh.amount) || paidPriceNum,
                  type: 'event_certificate',
                },
              ],
              {
                paidTotal: paidPriceNum,
                discountAmount: 0,
                discountCodes: '',
              }
            );
      return finalizeEventCertificateOrder(
        fresh,
        paidPriceNum,
        {
          ...fresh.custom_data,
          ...baseCustom,
        },
        retrieve,
        repairSnapshot
      );
    }

    if (fresh && (await orderNeedsDelivery(fresh))) {
      const repair = await deliverOrderAccess(fresh);
      return {
        success: repair.success,
        orderId,
        orderStatus: fresh.status,
        iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
        delivered: repair.deliveredTitles,
        message: 'Order already claimed; repaired delivery',
        errors: repair.errors,
      };
    }
    return {
      success: true,
      orderId,
      orderStatus: fresh?.status || 'processing',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      message: 'Order already being processed or completed',
    };
  }

  const cartItems = order.custom_data?.cartItems || [];
  const orderSnapshot: OrderSnapshot =
    order.custom_data?.orderSnapshot &&
    Array.isArray(order.custom_data.orderSnapshot.items) &&
    order.custom_data.orderSnapshot.items.length > 0
      ? rescaleSnapshotForActualPaid(
          order.custom_data.orderSnapshot as OrderSnapshot,
          paidPriceNum
        )
      : buildOrderSnapshot(
          cartItems.length > 0
            ? cartItems.map((item: any) => ({
                ...item,
                price: item.listPrice ?? item.price ?? 0,
              }))
            : [
                {
                  id: order.courseid,
                  title: order.coursename,
                  price: Number(order.amount) || paidPriceNum,
                  type: order.custom_data?.itemType || 'course',
                },
              ],
          {
            paidTotal: paidPriceNum,
            discountAmount: Number(
              order.discountamount || order.custom_data?.totalDiscount || 0
            ),
            discountCodes: order.discountcode || order.custom_data?.discountCodes || '',
          }
        );

  // Guest webinar / event certificate — no Clerk enrollment
  if (isEventCertificateOrder(claimed) || isEventCertificateOrder(order)) {
    return finalizeEventCertificateOrder(
      { ...order, ...claimed, custom_data: { ...order.custom_data, ...claimed.custom_data } },
      paidPriceNum,
      baseCustom,
      retrieve,
      orderSnapshot
    );
  }

  const priceByItemId = new Map(
    orderSnapshot.items.map((item) => [item.id, item.paidPrice] as const)
  );

  const delivery = await deliverOrderAccess(order, priceByItemId);
  let emailSent = false;

  if (!delivery.success && delivery.deliveredTitles.length === 0) {
    await supabase
      .from('orders')
      .update({
        status: 'payment_error',
        enrolled: false,
        amount: paidPriceNum,
        updated_at: new Date().toISOString(),
        custom_data: {
          ...baseCustom,
          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
          deliveryErrors: delivery.errors,
        },
      })
      .eq('orderid', orderId);

    return {
      success: false,
      orderId,
      orderStatus: 'payment_error',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      fraudStatus: mapped.fraudStatus,
      message: 'Iyzico SUCCESS but delivery failed',
      errors: delivery.errors,
    };
  }

  if (delivery.success) {
    try {
      emailSent = await sendConfirmationIfNeeded(
        { ...order, custom_data: baseCustom },
        orderSnapshot,
        paidPriceNum
      );
    } catch (e) {
      console.error('Reconcile email error:', orderId, e);
    }

    try {
      const { consumeDiscountCodeForOrder, createRewardCodeAfterPayment } =
        await import('./referralService');
      await consumeDiscountCodeForOrder(orderId);
      const userId = order.custom_data?.userId;
      if (userId) await createRewardCodeAfterPayment(userId);
    } catch (e) {
      console.error('Reconcile referral error:', orderId, e);
    }

    await supabase
      .from('orders')
      .update({
        status: 'completed',
        enrolled: true,
        enrollmentid: delivery.firstEnrollmentId || null,
        amount: paidPriceNum,
        updated_at: new Date().toISOString(),
        custom_data: {
          ...baseCustom,
          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
          ...(emailSent ? { emailSentAt: new Date().toISOString() } : {}),
          reconciledVia: 'iyzico-reconcile',
        },
      })
      .eq('orderid', orderId);

    return {
      success: true,
      orderId,
      orderStatus: 'completed',
      iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
      fraudStatus: mapped.fraudStatus,
      delivered: delivery.deliveredTitles,
      emailSent,
      message: 'Iyzico SUCCESS — order completed, access delivered',
    };
  }

  // Partial delivery
  await supabase
    .from('orders')
    .update({
      status: 'payment_error',
      enrolled: false,
      enrollmentid: delivery.firstEnrollmentId || null,
      amount: paidPriceNum,
      updated_at: new Date().toISOString(),
      custom_data: {
        ...baseCustom,
        orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: retrieve.paidPrice },
        deliveryErrors: delivery.errors,
      },
    })
    .eq('orderid', orderId);

  return {
    success: false,
    orderId,
    orderStatus: 'payment_error',
    iyzicoPaymentStatus: mapped.iyzicoPaymentStatus,
    delivered: delivery.deliveredTitles,
    message: 'Iyzico SUCCESS — partial delivery',
    errors: delivery.errors,
  };
}

export type BatchReconcileResult = {
  scanned: number;
  reconciled: number;
  completed: number;
  stillPending: number;
  failed: number;
  paymentReview: number;
  errors: number;
  results: ReconcileResult[];
};

/**
 * Sweep stuck orders that still have an Iyzico checkout token and reconcile each
 * against Iyzico. This is the safety net for dropped/failed callbacks: a buyer
 * who paid (Iyzico SUCCESS) but whose callback never arrived — and who never
 * reached /payment-success — would otherwise stay 'pending' forever with no
 * access and no email. Meant to be run on a schedule (cron) and on demand.
 *
 * Only orders with `custom_data.iyzicoCheckoutToken` are considered, because
 * without a token we cannot query Iyzico. Older pre-token orders need the
 * manual admin fix endpoint.
 */
export async function reconcilePendingOrders(options?: {
  maxAgeHours?: number;
  minAgeMinutes?: number;
  limit?: number;
}): Promise<BatchReconcileResult> {
  const maxAgeHours = options?.maxAgeHours ?? 24 * 14; // look back 14 days
  const minAgeMinutes = options?.minAgeMinutes ?? 3; // let the normal callback win first
  const limit = options?.limit ?? 100;

  const now = Date.now();
  const notBefore = new Date(now - maxAgeHours * 3600_000).toISOString();
  const notAfter = new Date(now - minAgeMinutes * 60_000).toISOString();

  const { data: candidates, error } = await supabase
    .from('orders')
    .select('orderid, status, custom_data, created_at')
    .in('status', [
      'pending',
      'processing',
      'payment_error',
      'payment_review',
      // Retry may cancel a pending row after Iyzico already charged — still healable via token
      'cancelled',
      'failed',
    ])
    .gte('created_at', notBefore)
    .lte('created_at', notAfter)
    .order('created_at', { ascending: false })
    .limit(limit);

  const summary: BatchReconcileResult = {
    scanned: 0,
    reconciled: 0,
    completed: 0,
    stillPending: 0,
    failed: 0,
    paymentReview: 0,
    errors: 0,
    results: [],
  };

  if (error || !candidates) {
    return summary;
  }

  const withToken = candidates.filter(
    (o) => o?.custom_data?.iyzicoCheckoutToken
  );
  summary.scanned = withToken.length;

  for (const order of withToken) {
    try {
      const result = await reconcileOrderWithIyzico(order.orderid);
      summary.results.push(result);
      summary.reconciled++;
      switch (result.orderStatus) {
        case 'completed':
          summary.completed++;
          break;
        case 'pending':
          summary.stillPending++;
          break;
        case 'failed':
          summary.failed++;
          break;
        case 'payment_review':
          summary.paymentReview++;
          break;
        default:
          if (!result.success) summary.errors++;
      }
    } catch (e) {
      summary.errors++;
      console.error('Batch reconcile error for', order.orderid, e);
    }
  }

  return summary;
}
