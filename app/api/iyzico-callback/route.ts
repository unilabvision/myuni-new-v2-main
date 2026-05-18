import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import Iyzipay from 'iyzipay';

// Iyzipay config will be initialized inside POST

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
                
                // Fetch order details
                const { data: order } = await supabase.from('orders').select('*').eq('orderid', orderId).single();
                if (!order) {
                    resolve(NextResponse.redirect(new URL('/tr/payment-failed?error=order_not_found', baseUrl), 303));
                    return;
                }
                
                // Fetch course/product details
                const { data: courseData } = await supabase.from('myuni_courses').select('*').eq('id', order.courseid).single();
                
                const userId = order.custom_data?.userId || order.useremail;
                const locale = order.custom_data?.locale || 'tr';
                const itemType = order.custom_data?.itemType || 'course';
                
                let enrollmentId: string | undefined;

                if (itemType === 'product') {
                    // Koleksiyon ürünü → myuni_products_purchases tablosuna kaydet
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
                        enrollmentId = newPurchase?.id;
                    } else {
                        enrollmentId = existingPurchase.id;
                    }
                } else {
                    // Kurs → myuni_enrollments tablosuna kaydet
                    const { data: existingEnrollment } = await supabase.from('myuni_enrollments').select('id, is_active').eq('user_id', userId).eq('course_id', order.courseid).single();
                    
                    if (!existingEnrollment) {
                        const { data: newEnrollment } = await supabase.from('myuni_enrollments').insert({
                            user_id: userId,
                            course_id: order.courseid,
                            enrolled_at: new Date().toISOString(),
                            progress_percentage: 0,
                            is_active: true
                        }).select().single();
                        enrollmentId = newEnrollment?.id;
                    } else if (!existingEnrollment.is_active) {
                        await supabase.from('myuni_enrollments').update({ is_active: true, enrolled_at: new Date().toISOString() }).eq('id', existingEnrollment.id);
                        enrollmentId = existingEnrollment.id;
                    } else {
                        enrollmentId = existingEnrollment.id;
                    }
                }

                
                await supabase.from('orders').update({ 
                    status: 'completed', 
                    enrolled: true, 
                    enrollmentid: enrollmentId,
                    updated_at: new Date().toISOString(),
                    custom_data: {
                        ...order.custom_data,
                        iyzico_paymentId: result.paymentId,
                        iyzico_authCode: result.authCode
                    }
                }).eq('orderid', orderId);
                
                // Referrals
                try {
                  const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
                  await incrementUsageCountAfterPayment(userId);
                  await createRewardCodeAfterPayment(userId);
                } catch (e) {
                  console.error("Referral update error", e);
                }
                
                // Email
                try {
                  const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
                  const userName = order.useremail.split('@')[0];
                  let emailItemData: { title: string; description?: string; slug?: string; course_type?: string } | null = courseData;
                  if (itemType === 'product' && !courseData) {
                    const { data: productForEmail } = await supabase
                      .from('myuni_products').select('title, description, slug').eq('id', order.courseid).single();
                    emailItemData = productForEmail;
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
                } catch (e) {
                  console.error("Email sending error", e);
                }

                // Başarı URL — type parametresi ile
                let itemTitle = courseData?.title || order.coursename;
                if (itemType === 'product' && !courseData) {
                  const { data: productForTitle } = await supabase
                    .from('myuni_products').select('title').eq('id', order.courseid).single();
                  if (productForTitle) itemTitle = productForTitle.title;
                }
                const successUrl = new URL(`/${locale}/payment-success`, baseUrl);
                successUrl.searchParams.set('orderId', orderId);
                successUrl.searchParams.set('courseId', order.courseid);
                successUrl.searchParams.set('type', itemType);
                successUrl.searchParams.set('name', itemTitle || '');
                successUrl.searchParams.set('enrolled', 'true');
                
                resolve(NextResponse.redirect(successUrl, 303));
            });
        });

    } catch (error) {
        console.error("Iyzico callback error:", error);
        return NextResponse.redirect(new URL('/tr/payment-failed?error=internal_error', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'), 303);
    }
}
