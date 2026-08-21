import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import {
  markSiteApplicationPaid,
  notifyUniboardPaymentConfirm,
} from '@/lib/siteApplications/applicationPayments';
import {
  buildOrderSnapshot,
  resolveEmailCourseType,
  rescaleSnapshotForActualPaid,
  type OrderSnapshot,
} from '@/lib/orderSnapshot';
import {
  deliverOrderAccess,
  orderNeedsDelivery,
} from '@/lib/orderDelivery';
import Iyzipay from 'iyzipay';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token')?.toString();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        // Fail fast instead of silently constructing the Iyzico client with
        // empty credentials, and make it impossible to miss in logs when
        // IYZICO_BASE_URL isn't explicitly set — it silently defaults to the
        // LIVE endpoint, so a misconfigured staging deploy without this
        // variable would otherwise verify callbacks against production Iyzico.
        const iyzicoApiKey = process.env.IYZICO_API_KEY;
        const iyzicoSecretKey = process.env.IYZICO_SECRET_KEY;
        const iyzicoBaseUrl = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com';

        if (!iyzicoApiKey || !iyzicoSecretKey) {
          console.error('CRITICAL: IYZICO_API_KEY / IYZICO_SECRET_KEY is not configured. Refusing to verify callback.');
          return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', baseUrl), 303);
        }
        if (!process.env.IYZICO_BASE_URL) {
          console.warn(`IYZICO_BASE_URL is not set — defaulting to the LIVE Iyzico endpoint (${iyzicoBaseUrl}). If this is not production, set IYZICO_BASE_URL to the sandbox URL.`);
        }

        let iyzipay;
        try {
          const IyzipayClass = (Iyzipay as any).default || Iyzipay;
          iyzipay = new IyzipayClass({
            apiKey: iyzicoApiKey,
            secretKey: iyzicoSecretKey,
            uri: iyzicoBaseUrl
          });
        } catch (e: any) {
          console.error("Iyzipay initialization error:", e);
          return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', baseUrl), 303);
        }
        
        if (!token) {
            return NextResponse.redirect(new URL('/tr/payment-failed?error=missing_token', baseUrl), 303);
        }

        return new Promise<NextResponse>((resolve) => {
            iyzipay.checkoutForm.retrieve({
                locale: Iyzipay.LOCALE.TR,
                token: token
            }, async function (err: any, result: any) {
              // The whole handler is wrapped in try/catch: it awaits ~200 lines
              // of DB/enrollment/email calls, and the Iyzico SDK invokes this
              // callback fire-and-forget (it never awaits/handles a rejected
              // promise). Without this, any thrown error here would become an
              // unhandled rejection that never calls resolve() — hanging the
              // request forever — while a buyer who already paid and got
              // claimed into 'processing' would stay stuck there permanently,
              // since the claim below deliberately excludes 'processing' from
              // being re-claimed by a retry.
              try {
                if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                    console.error("Iyzico Retrieve Error:", err, result);
                    if (result && result.basketId) {
                         const paymentStatus = String(result.paymentStatus || '').toUpperCase();
                         const fraudStatus = result.fraudStatus;
                         const { data: failOrder } = await supabase
                           .from('orders')
                           .select('custom_data')
                           .eq('orderid', result.basketId)
                           .maybeSingle();
                         const mergedCustom = {
                           ...(failOrder?.custom_data || {}),
                           iyzicoPaymentStatus: paymentStatus || 'FAILURE',
                           iyzicoFraudStatus: fraudStatus ?? null,
                           iyzicoCallbackAt: new Date().toISOString(),
                           iyzicoError: result.errorMessage || null,
                         };

                         // Fraud review: payment may be held — keep distinct from hard failure
                         if (paymentStatus === 'SUCCESS' && Number(fraudStatus) === 0) {
                           await supabase
                             .from('orders')
                             .update({
                               status: 'payment_review',
                               updated_at: new Date().toISOString(),
                               custom_data: {
                                 ...mergedCustom,
                                 iyzicoPaymentStatus: 'SUCCESS',
                               },
                             })
                             .eq('orderid', result.basketId)
                             .in('status', ['pending', 'failed', 'payment_review']);
                           const reviewUrl = new URL('/tr/payment-success', baseUrl);
                           reviewUrl.searchParams.set('orderId', result.basketId);
                           resolve(NextResponse.redirect(reviewUrl, 303));
                           return;
                         }

                         await supabase
                           .from('orders')
                           .update({
                             status: 'failed',
                             updated_at: new Date().toISOString(),
                             custom_data: mergedCustom,
                           })
                           .eq('orderid', result.basketId)
                           .in('status', ['pending', 'failed', 'payment_review']);
                    }
                    resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=payment_failed', baseUrl), 303));
                    return;
                }
                
                const orderId = result.basketId;

                // Fraud hold: don't deliver until Iyzico approves (fraudStatus === 1)
                if (Number(result.fraudStatus) === 0) {
                    const { data: reviewOrder } = await supabase
                      .from('orders')
                      .select('custom_data')
                      .eq('orderid', orderId)
                      .maybeSingle();
                    await supabase
                      .from('orders')
                      .update({
                        status: 'payment_review',
                        updated_at: new Date().toISOString(),
                        custom_data: {
                          ...(reviewOrder?.custom_data || {}),
                          iyzicoPaymentStatus: 'SUCCESS',
                          iyzicoFraudStatus: 0,
                          iyzicoCallbackAt: new Date().toISOString(),
                          iyzico_paymentId: result.paymentId,
                          iyzico_authCode: result.authCode,
                        },
                      })
                      .eq('orderid', orderId)
                      .in('status', ['pending', 'failed', 'payment_review', 'payment_error']);
                    const localeHold = reviewOrder?.custom_data?.locale || 'tr';
                    const holdUrl = new URL(`/${localeHold}/payment-success`, baseUrl);
                    holdUrl.searchParams.set('orderId', orderId);
                    resolve(NextResponse.redirect(holdUrl, 303));
                    return;
                }
                
                // Siparişi al. maybeSingle() kullanıyoruz ki "sipariş bulunamadı"
                // ile gerçek bir DB hatası birbirinden ayrılıp loglanabilsin —
                // .single() ikisini de sessizce aynı "not found" sonucuna
                // indirgiyordu.
                const { data: order, error: orderFetchError } = await supabase
                  .from('orders')
                  .select('*')
                  .eq('orderid', orderId)
                  .maybeSingle();
                if (orderFetchError) {
                    console.error('Order fetch error in Iyzico callback:', orderId, orderFetchError);
                }
                if (!order) {
                    resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=order_not_found', baseUrl), 303));
                    return;
                }

                // Idempotency guard: Iyzico may retry/replay the callback (or the
                // buyer may resubmit the same token/hit back-button), and two
                // such requests can race each other concurrently. Atomically
                // claim the order by requiring it be in a fresh state
                // ('pending', 'failed', or a previously stuck 'payment_error') —
                // this excludes BOTH 'completed' AND 'processing', so only ONE
                // concurrent request can ever win the claim; every other
                // (replayed or racing) request affects zero rows here and is
                // redirected without re-running enrollment / referral rewards /
                // emails again. Including 'payment_error' lets a retry recover
                // an order that got stuck after a delivery exception (see catch
                // block below) instead of leaving it stuck forever.
                const { data: claimedOrder, error: claimError } = await supabase
                    .from('orders')
                    .update({ status: 'processing', updated_at: new Date().toISOString() })
                    .eq('orderid', orderId)
                    .in('status', ['pending', 'failed', 'payment_error', 'payment_review'])
                    .select()
                    .maybeSingle();

                if (claimError || !claimedOrder) {
                    // Idempotent retry: payment already claimed/completed, but access
                    // may still be missing (partial failure). Re-deliver if needed.
                    const { data: freshOrder } = await supabase
                      .from('orders')
                      .select('*')
                      .eq('orderid', orderId)
                      .maybeSingle();

                    const orderForRetry = freshOrder || order;
                    const needsDelivery = await orderNeedsDelivery(orderForRetry);
                    let repairedOrder = orderForRetry;

                    if (needsDelivery) {
                      console.warn(
                        `Iyzico callback retry: order ${orderId} status=${orderForRetry.status} needs delivery — repairing access`
                      );
                      const repair = await deliverOrderAccess(orderForRetry);
                      if (repair.success || repair.deliveredTitles.length > 0) {
                        const shouldComplete =
                          repair.success &&
                          ['processing', 'payment_error', 'pending'].includes(
                            orderForRetry.status
                          );

                        const { data: updated } = await supabase
                          .from('orders')
                          .update({
                            enrolled: repair.success,
                            enrollmentid: repair.firstEnrollmentId || orderForRetry.enrollmentid || null,
                            status: shouldComplete ? 'completed' : orderForRetry.status,
                            updated_at: new Date().toISOString(),
                            custom_data: {
                              ...orderForRetry.custom_data,
                              deliveryRepair: {
                                at: new Date().toISOString(),
                                success: repair.success,
                                errors: repair.errors,
                              },
                            },
                          })
                          .eq('orderid', orderId)
                          .select()
                          .maybeSingle();
                        if (updated) repairedOrder = updated;
                      } else {
                        console.error(
                          `CRITICAL: Callback retry could not deliver order ${orderId}:`,
                          repair.errors
                        );
                      }
                    }

                    // If access is OK but confirmation email never went out, send once.
                    const emailAlreadySent = Boolean(repairedOrder.custom_data?.emailSentAt);
                    const stillNeedsAccess = await orderNeedsDelivery(repairedOrder);
                    if (!emailAlreadySent && !stillNeedsAccess) {
                      try {
                        const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
                        const localeRetry = repairedOrder.custom_data?.locale || 'tr';
                        const isCartRetry = repairedOrder.custom_data?.cartMode === true;
                        const cartRetry = repairedOrder.custom_data?.cartItems || [];
                        const snapshotRetry =
                          repairedOrder.custom_data?.orderSnapshot &&
                          Array.isArray(repairedOrder.custom_data.orderSnapshot.items)
                            ? repairedOrder.custom_data.orderSnapshot
                            : buildOrderSnapshot(
                                cartRetry.length > 0
                                  ? cartRetry
                                  : [
                                      {
                                        id: repairedOrder.courseid,
                                        title: repairedOrder.coursename,
                                        price: Number(repairedOrder.amount) || 0,
                                        type: repairedOrder.custom_data?.itemType || 'course',
                                      },
                                    ],
                                {
                                  paidTotal: Number(repairedOrder.amount) || 0,
                                  discountAmount: Number(
                                    repairedOrder.discountamount ||
                                      repairedOrder.custom_data?.totalDiscount ||
                                      0
                                  ),
                                  discountCodes:
                                    repairedOrder.discountcode ||
                                    repairedOrder.custom_data?.discountCodes ||
                                    '',
                                }
                              );
                        const emailTitle =
                          isCartRetry || snapshotRetry.items?.length > 1
                            ? 'Sepet Alımı'
                            : snapshotRetry.items?.[0]?.title ||
                              repairedOrder.coursename ||
                              'Sipariş';
                        await sendPurchaseConfirmationEmail(
                          {
                            name:
                              repairedOrder.custom_data?.userName ||
                              repairedOrder.useremail?.split('@')[0],
                            email: repairedOrder.useremail,
                          },
                          { title: emailTitle, items: snapshotRetry.items || [] },
                          {
                            orderId,
                            amount: Number(repairedOrder.amount) || 0,
                            isFree: Number(repairedOrder.amount) <= 0,
                            listTotal: snapshotRetry.listTotal,
                            discountAmount: snapshotRetry.discountAmount,
                            discountCodes: snapshotRetry.discountCodes,
                            commissionAmount: snapshotRetry.commissionAmount || 0,
                          },
                          localeRetry,
                          resolveEmailCourseType(snapshotRetry, isCartRetry)
                        );
                        await supabase
                          .from('orders')
                          .update({
                            custom_data: {
                              ...repairedOrder.custom_data,
                              emailSentAt: new Date().toISOString(),
                            },
                            updated_at: new Date().toISOString(),
                          })
                          .eq('orderid', orderId);
                      } catch (mailErr) {
                        console.error('Retry confirmation email failed:', orderId, mailErr);
                      }
                    }

                    const dupLocale = repairedOrder.custom_data?.locale || 'tr';
                    const dupIsCartMode = repairedOrder.custom_data?.cartMode === true;
                    const successUrl = new URL(`/${dupLocale}/payment-success`, baseUrl);
                    successUrl.searchParams.set('orderId', orderId);
                    successUrl.searchParams.set('enrolled', 'true');
                    if (dupIsCartMode) {
                        successUrl.searchParams.set('cartMode', 'true');
                    } else {
                        successUrl.searchParams.set('courseId', repairedOrder.courseid);
                        successUrl.searchParams.set('type', repairedOrder.custom_data?.itemType || 'course');
                    }
                    resolve(NextResponse.redirect(successUrl, 303));
                    return;
                }
                
                const userId = order.custom_data?.userId || order.useremail;
                const locale = order.custom_data?.locale || 'tr';
                const isCartMode = order.custom_data?.cartMode === true;
                const cartItems = order.custom_data?.cartItems || [];
                const paidPriceNum = result.paidPrice
                  ? parseFloat(result.paidPrice)
                  : Number(order.amount) || 0;

                // Sanity floor: the gateway-reported paidPrice may legitimately be
                // HIGHER than the quoted amount (installment commission surplus),
                // but it must never be materially LOWER — that would mean we're
                // about to deliver goods for less than what was agreed, which can
                // only happen from a gateway anomaly, a currency mismatch, or a
                // partial capture. Refuse to deliver and flag for manual review
                // instead of silently trusting the figure.
                const quotedAmount = Number(order.amount) || 0;
                const AMOUNT_TOLERANCE = 0.01;
                if (quotedAmount > 0 && paidPriceNum + AMOUNT_TOLERANCE < quotedAmount) {
                    console.error(
                      `CRITICAL: Iyzico paidPrice (${paidPriceNum}) is below the quoted order amount (${quotedAmount}) for order ${orderId}. Refusing to deliver.`
                    );
                    await supabase
                      .from('orders')
                      .update({
                        status: 'payment_error',
                        updated_at: new Date().toISOString(),
                        custom_data: {
                          ...order.custom_data,
                          paidPriceMismatch: { quoted: quotedAmount, paid: paidPriceNum },
                        },
                      })
                      .eq('orderid', orderId)
                      .eq('status', 'processing');
                    resolve(NextResponse.redirect(new URL(`/${order.custom_data?.locale || 'tr'}/payment-failed?error=amount_mismatch`, baseUrl), 303));
                    return;
                }

                // If a snapshot was already persisted at checkout-initiation time,
                // reconcile it with the amount Iyzico/the bank actually charged —
                // rescaling every line item's paidPrice proportionally (instead of
                // only overwriting the top-level paidTotal) so the parts still sum
                // to the whole, and recording any installment-commission surplus
                // separately rather than silently inflating recorded revenue.
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
                          discountAmount: Number(order.discountamount || order.custom_data?.totalDiscount || 0),
                          discountCodes: order.discountcode || order.custom_data?.discountCodes || '',
                        }
                      );

                const snapshotById = new Map(
                  orderSnapshot.items.map((item) => [item.id, item] as const)
                );

                // ---- Event certificate (special path) ----
                const itemType = order.custom_data?.itemType || 'course';
                if (!isCartMode && itemType === 'event_certificate') {
                        const siteApplicationId =
                          order.custom_data?.siteApplicationId || order.courseid;
                        const eventSlug = order.custom_data?.eventSlug || '';

                        const paymentResult = await markSiteApplicationPaid(
                          siteApplicationId,
                          orderId,
                          'iyzico'
                        );

                        if (!paymentResult.success && !paymentResult.alreadyPaid) {
                            console.error('Event certificate payment update failed:', paymentResult.error);
                            resolve(NextResponse.redirect(new URL(`/${locale}/payment-failed?error=application_update_failed`, baseUrl), 303));
                            return;
                        }

                        await notifyUniboardPaymentConfirm(siteApplicationId, orderId);

                        await supabase.from('orders').update({
                            status: 'completed',
                            enrolled: false,
                            updated_at: new Date().toISOString(),
                            amount: paidPriceNum,
                            custom_data: {
                                ...order.custom_data,
                                orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: result.paidPrice },
                                iyzico_paymentId: result.paymentId,
                                iyzico_authCode: result.authCode,
                            },
                        }).eq('orderid', orderId);

                        const successUrl = new URL(`/${locale}/payment-success`, baseUrl);
                        successUrl.searchParams.set('type', 'event_application');
                        successUrl.searchParams.set('applicationId', siteApplicationId);
                        successUrl.searchParams.set('orderId', orderId);
                        if (eventSlug) {
                            successUrl.searchParams.set('eventSlug', eventSlug);
                        }
                        successUrl.searchParams.set('name', order.coursename || '');

                        resolve(NextResponse.redirect(successUrl, 303));
                        return;
                }

                // ---- Course / package / product / cart delivery (idempotent) ----
                if (!order.custom_data?.userId || !String(order.custom_data.userId).startsWith('user_')) {
                    console.error(
                      `CRITICAL: Order ${orderId} missing Clerk userId — refusing silent email-based enrollment. userId=`,
                      userId
                    );
                    await supabase
                      .from('orders')
                      .update({
                        status: 'payment_error',
                        updated_at: new Date().toISOString(),
                        custom_data: {
                          ...order.custom_data,
                          deliveryError: 'missing_clerk_user_id',
                        },
                      })
                      .eq('orderid', orderId)
                      .eq('status', 'processing');
                    resolve(NextResponse.redirect(new URL(`/${locale}/payment-failed?error=delivery_error`, baseUrl), 303));
                    return;
                }

                const priceByItemId = new Map(
                  [...snapshotById.entries()].map(([id, snap]) => [id, snap.paidPrice] as const)
                );
                const delivery = await deliverOrderAccess(order, priceByItemId);

                if (!delivery.success) {
                    console.error(
                      `CRITICAL: Partial/failed delivery for paid order ${orderId}:`,
                      delivery.errors
                    );
                    await supabase
                      .from('orders')
                      .update({
                        status: 'payment_error',
                        enrolled: false,
                        enrollmentid: delivery.firstEnrollmentId || null,
                        updated_at: new Date().toISOString(),
                        amount: paidPriceNum,
                        custom_data: {
                          ...order.custom_data,
                          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: result.paidPrice },
                          iyzico_paymentId: result.paymentId,
                          iyzico_authCode: result.authCode,
                          deliveryErrors: delivery.errors,
                        },
                      })
                      .eq('orderid', orderId)
                      .eq('status', 'processing');

                    // Buyer was charged — if nothing was delivered, fail visibly.
                    // If some items were delivered, still send them to success; retry/admin repairs the rest.
                    if (delivery.deliveredTitles.length === 0) {
                      resolve(NextResponse.redirect(new URL(`/${locale}/payment-failed?error=delivery_error`, baseUrl), 303));
                      return;
                    }
                }

                const firstEnrollmentId = delivery.firstEnrollmentId;
                const deliveredItemsDetails = delivery.deliveredTitles;

                // Siparişi başarıyla güncelle (yalnızca tam teslimatta completed)
                if (delivery.success) {
                  await supabase.from('orders').update({ 
                      status: 'completed', 
                      enrolled: true, 
                      enrollmentid: firstEnrollmentId || null,
                      updated_at: new Date().toISOString(),
                      amount: paidPriceNum,
                      custom_data: {
                          ...order.custom_data,
                          orderSnapshot: { ...orderSnapshot, iyzicoPaidPrice: result.paidPrice },
                          iyzico_paymentId: result.paymentId,
                          iyzico_authCode: result.authCode
                      }
                  }).eq('orderid', orderId);
                }
                
                // İndirim kodu tüketimi + Referrals / Affiliate Ödüllerini Tetikle
                try {
                  const { consumeDiscountCodeForOrder, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
                  await consumeDiscountCodeForOrder(orderId);
                  await createRewardCodeAfterPayment(userId);
                } catch (e) {
                  console.error("Referral update error", e);
                }
                
                // Email Gönderimi — sipariş snapshot (kalemler + ödenen tutar)
                try {
                  const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
                  const userName = order.custom_data?.userName || order.useremail.split('@')[0];
                  const courseType = resolveEmailCourseType(orderSnapshot, isCartMode);
                  const emailTitle =
                    isCartMode || orderSnapshot.items.length > 1
                      ? 'Sepet Alımı'
                      : orderSnapshot.items[0]?.title || order.coursename || 'Sipariş';

                  await sendPurchaseConfirmationEmail(
                    { name: userName, email: order.useremail },
                    {
                      title: emailTitle,
                      items: orderSnapshot.items,
                    },
                    {
                      orderId: orderId,
                      amount: paidPriceNum,
                      isFree: paidPriceNum <= 0,
                      listTotal: orderSnapshot.listTotal,
                      discountAmount: orderSnapshot.discountAmount,
                      discountCodes: orderSnapshot.discountCodes,
                      commissionAmount: orderSnapshot.commissionAmount || 0,
                    },
                    locale,
                    courseType
                  );

                  const { data: latestForEmail } = await supabase
                    .from('orders')
                    .select('custom_data')
                    .eq('orderid', orderId)
                    .maybeSingle();
                  await supabase
                    .from('orders')
                    .update({
                      custom_data: {
                        ...(latestForEmail?.custom_data || order.custom_data || {}),
                        emailSentAt: new Date().toISOString(),
                      },
                      updated_at: new Date().toISOString(),
                    })
                    .eq('orderid', orderId);
                } catch (e) {
                  console.error("Email sending error", e);
                }

                // Başarı URL oluştur ve yönlendir
                const successUrl = new URL(`/${locale}/payment-success`, baseUrl);
                successUrl.searchParams.set('orderId', orderId);
                successUrl.searchParams.set('enrolled', 'true');
                
                if (isCartMode) {
                    successUrl.searchParams.set('cartMode', 'true');
                    successUrl.searchParams.set('names', deliveredItemsDetails.join(', '));
                } else {
                    successUrl.searchParams.set('courseId', order.courseid);
                    successUrl.searchParams.set('type', order.custom_data?.itemType || 'course');
                    successUrl.searchParams.set('name', deliveredItemsDetails[0] || '');
                }
                
                resolve(NextResponse.redirect(successUrl, 303));
              } catch (deliveryError) {
                // Anything that throws after this point (a Supabase error, a
                // rejected enrollment call, etc.) lands here instead of hanging
                // the request or leaving the order silently stuck. If the order
                // was already claimed into 'processing', flip it to a distinct
                // 'payment_error' state — the buyer WAS charged, delivery did
                // NOT complete, and a subsequent retry/replay from Iyzico (or a
                // manual admin action) can re-claim and retry it, per the
                // widened claim condition above. This log line is intentionally
                // unmissable so it can be wired to an ops alert.
                console.error('CRITICAL: Iyzico callback delivery failed after payment was captured. Order requires manual review.', deliveryError);
                try {
                  const basketIdForRecovery = result?.basketId;
                  if (basketIdForRecovery) {
                    await supabase
                      .from('orders')
                      .update({ status: 'payment_error', updated_at: new Date().toISOString() })
                      .eq('orderid', basketIdForRecovery)
                      .eq('status', 'processing');
                  }
                } catch (recoveryError) {
                  console.error('Failed to flag order as payment_error after delivery exception:', recoveryError);
                }
                resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=delivery_error', baseUrl), 303));
              }
            });
        });

    } catch (error) {
        console.error("Iyzico callback error:", error);
        return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), 303);
    }
}
