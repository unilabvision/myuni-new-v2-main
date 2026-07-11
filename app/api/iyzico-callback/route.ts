import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import {
  markSiteApplicationPaid,
  notifyUniboardPaymentConfirm,
} from '@/lib/siteApplications/applicationPayments';
import Iyzipay from 'iyzipay';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const token = formData.get('token')?.toString();
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        
        let iyzipay;
        try {
          const IyzipayClass = (Iyzipay as any).default || Iyzipay;
          iyzipay = new IyzipayClass({
            apiKey: process.env.IYZICO_API_KEY || '',
            secretKey: process.env.IYZICO_SECRET_KEY || '',
            uri: process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com'
          });
        } catch (e: any) {
          console.error("Iyzipay initialization error:", e);
          return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', baseUrl), 303);
        }
        
        if (!token) {
            return NextResponse.redirect(new URL('/tr/payment-failed?error=missing_token', baseUrl), 303);
        }

        return new Promise((resolve) => {
            iyzipay.checkoutForm.retrieve({
                locale: Iyzipay.LOCALE.TR,
                token: token
            }, async function (err: any, result: any) {
                if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                    console.error("Iyzico Retrieve Error:", err, result);
                    if (result && result.basketId) {
                         await supabase.from('orders').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('orderid', result.basketId);
                    }
                    resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=payment_failed', baseUrl), 303));
                    return;
                }
                
                const orderId = result.basketId;
                
                // Siparişi al
                const { data: order } = await supabase.from('orders').select('*').eq('orderid', orderId).single();
                if (!order) {
                    resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=order_not_found', baseUrl), 303));
                    return;
                }
                
                const userId = order.custom_data?.userId || order.useremail;
                const locale = order.custom_data?.locale || 'tr';
                const isCartMode = order.custom_data?.cartMode === true;
                const cartItems = order.custom_data?.cartItems || [];
                
                let firstEnrollmentId: string | undefined;
                let deliveredItemsDetails: string[] = [];

                // ---- 1. SEPET MODU TESLİMATI (ÇOKLU ÜRÜN) ----
                if (isCartMode && cartItems.length > 0) {
                    for (const item of cartItems) {
                        if (item.type === 'product') {
                            const { data: existingPurchase } = await supabase
                                .from('myuni_products_purchases')
                                .select('id')
                                .eq('user_id', userId)
                                .eq('product_id', item.id)
                                .single();

                            if (!existingPurchase) {
                                const { data: newPurchase } = await supabase
                                    .from('myuni_products_purchases')
                                    .insert({
                                        user_id: userId,
                                        product_id: item.id,
                                        purchased_at: new Date().toISOString(),
                                        price_paid: item.price
                                    })
                                    .select()
                                    .single();
                                if (newPurchase && !firstEnrollmentId) {
                                    firstEnrollmentId = newPurchase.id;
                                }
                            } else if (!firstEnrollmentId) {
                                firstEnrollmentId = existingPurchase.id;
                            }
                        } else if (item.type === 'package') {
                            const { checkUserPackageEnrollment, enrollUserInPackage } = await import('../../../lib/enrollmentService');
                            const alreadyEnrolled = await checkUserPackageEnrollment(userId, item.id);
                            if (!alreadyEnrolled) {
                                await enrollUserInPackage(userId, item.id, orderId);
                            }
                            if (!firstEnrollmentId) {
                                firstEnrollmentId = orderId;
                            }
                        } else if (item.type === 'tier') {
                            const { enrollUserInTier } = await import('../../../lib/enrollmentService');
                            if (item.courseId && item.tierId) {
                                const result = await enrollUserInTier(userId, item.courseId, item.tierId);
                                if (result.enrollmentId && !firstEnrollmentId) {
                                    firstEnrollmentId = result.enrollmentId;
                                }
                            }
                        } else {
                            // course
                            const { data: existingEnrollment } = await supabase
                                .from('myuni_enrollments')
                                .select('id, is_active')
                                .eq('user_id', userId)
                                .eq('course_id', item.id)
                                .single();

                            if (!existingEnrollment) {
                                const { data: newEnrollment } = await supabase
                                    .from('myuni_enrollments')
                                    .insert({
                                        user_id: userId,
                                        course_id: item.id,
                                        enrolled_at: new Date().toISOString(),
                                        progress_percentage: 0,
                                        is_active: true
                                    })
                                    .select()
                                    .single();
                                if (newEnrollment && !firstEnrollmentId) {
                                    firstEnrollmentId = newEnrollment.id;
                                }
                            } else {
                                if (!existingEnrollment.is_active) {
                                    await supabase.from('myuni_enrollments').update({
                                        is_active: true,
                                        enrolled_at: new Date().toISOString()
                                    }).eq('id', existingEnrollment.id);
                                }
                                if (!firstEnrollmentId) {
                                    firstEnrollmentId = existingEnrollment.id;
                                }
                            }
                        }
                        deliveredItemsDetails.push(item.title);
                    }
                } 
                // ---- 2. TEKİL ÜRÜN MODU TESLİMATI ----
                else {
                    const itemType = order.custom_data?.itemType || 'course';

                    if (itemType === 'event_certificate') {
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
                            resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=application_update_failed', baseUrl), 303));
                            return;
                        }

                        await notifyUniboardPaymentConfirm(siteApplicationId, orderId);

                        await supabase.from('orders').update({
                            status: 'completed',
                            enrolled: false,
                            updated_at: new Date().toISOString(),
                            custom_data: {
                                ...order.custom_data,
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
                    
                    if (itemType === 'product') {
                        const { data: existingPurchase } = await supabase
                            .from('myuni_products_purchases')
                            .select('id')
                            .eq('user_id', userId)
                            .eq('product_id', order.courseid)
                            .single();

                        if (!existingPurchase) {
                            const { data: newPurchase } = await supabase
                                .from('myuni_products_purchases')
                                .insert({
                                    user_id: userId,
                                    product_id: order.courseid,
                                    purchased_at: new Date().toISOString(),
                                    price_paid: result.paidPrice ? parseFloat(result.paidPrice) : (order.amount || 0),
                                })
                                .select()
                                .single();
                            firstEnrollmentId = newPurchase?.id;
                        } else {
                            firstEnrollmentId = existingPurchase.id;
                        }
                    } else if (itemType === 'package') {
                        const { checkUserPackageEnrollment, enrollUserInPackage } = await import('../../../lib/enrollmentService');
                        const alreadyEnrolled = await checkUserPackageEnrollment(userId, order.courseid);
                        if (!alreadyEnrolled) {
                            await enrollUserInPackage(userId, order.courseid, orderId);
                        }
                        firstEnrollmentId = orderId;
                    } else if (itemType === 'tier') {
                        const tierId = order.custom_data?.tierId;
                        const { enrollUserInTier } = await import('../../../lib/enrollmentService');
                        if (tierId) {
                            const result = await enrollUserInTier(userId, order.courseid, tierId);
                            firstEnrollmentId = result.enrollmentId;
                        }
                    } else {
                        const { data: existingEnrollment } = await supabase
                            .from('myuni_enrollments')
                            .select('id, is_active')
                            .eq('user_id', userId)
                            .eq('course_id', order.courseid)
                            .single();
                        
                        if (!existingEnrollment) {
                            const { data: newEnrollment } = await supabase
                                .from('myuni_enrollments')
                                .insert({
                                    user_id: userId,
                                    course_id: order.courseid,
                                    enrolled_at: new Date().toISOString(),
                                    progress_percentage: 0,
                                    is_active: true
                                }).select().single();
                            firstEnrollmentId = newEnrollment?.id;
                        } else {
                            if (!existingEnrollment.is_active) {
                                await supabase.from('myuni_enrollments').update({ 
                                    is_active: true, 
                                    enrolled_at: new Date().toISOString() 
                                }).eq('id', existingEnrollment.id);
                            }
                            firstEnrollmentId = existingEnrollment.id;
                        }
                    }
                    deliveredItemsDetails.push(order.coursename);
                }

                // Siparişi başarıyla güncelle
                await supabase.from('orders').update({ 
                    status: 'completed', 
                    enrolled: true, 
                    enrollmentid: firstEnrollmentId || null,
                    updated_at: new Date().toISOString(),
                    custom_data: {
                        ...order.custom_data,
                        iyzico_paymentId: result.paymentId,
                        iyzico_authCode: result.authCode
                    }
                }).eq('orderid', orderId);
                
                // Referrals / Affiliate Ödüllerini Tetikle
                try {
                  const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
                  await incrementUsageCountAfterPayment(userId);
                  await createRewardCodeAfterPayment(userId);
                } catch (e) {
                  console.error("Referral update error", e);
                }
                
                // Email Gönderimi
                try {
                  const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
                  const userName = order.useremail.split('@')[0];
                  
                  if (isCartMode && cartItems.length > 0) {
                      // Sepet modu için tüm ürünleri içeren TEK bir e-posta gönderimi
                      await sendPurchaseConfirmationEmail(
                        { name: order.custom_data?.userName || userName, email: order.useremail },
                        { title: 'Sepet Alımı', items: cartItems },
                        { orderId: orderId, amount: result.paidPrice, isFree: false },
                        locale,
                        'cart'
                      );
                  } else {
                      // Tekil ürün onay e-postası
                      const itemType = order.custom_data?.itemType || 'course';
                      let emailItemData: { title: string; description?: string; slug?: string; course_type?: string } | null = null;
                      
                      if (itemType === 'product') {
                        const { data: productForEmail } = await supabase
                          .from('myuni_products').select('title, description, slug').eq('id', order.courseid).single();
                        emailItemData = productForEmail;
                      } else {
                        const { data: courseForEmail } = await supabase
                          .from('myuni_courses').select('title, description, slug, course_type').eq('id', order.courseid).single();
                        emailItemData = courseForEmail;
                      }

                      if (emailItemData) {
                        await sendPurchaseConfirmationEmail(
                          { name: order.custom_data?.userName || userName, email: order.useremail },
                          { title: emailItemData.title, description: emailItemData.description || '', slug: emailItemData.slug || '' },
                          { orderId: orderId, amount: result.paidPrice, isFree: false },
                          locale,
                          itemType === 'product' ? 'product' : (emailItemData.course_type || 'online')
                        );
                      }
                  }
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
            });
        });

    } catch (error) {
        console.error("Iyzico callback error:", error);
        return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), 303);
    }
}
