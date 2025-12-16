// app/api/shopier-return/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabase from '../../_services/supabaseClient';

// Type definitions
interface PaymentParams {
  status?: string;
  platform_order_id?: string;
  payment_id?: string;
  custom_params?: string;
  courseId?: string;
  courseName?: string;
  locale?: string;
  random_nr?: string;
  total_order_value?: string;
  currency?: string;
  signature?: string;
  installment?: string;
  [key: string]: string | undefined;
}

interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  alreadyEnrolled?: boolean;
  reactivated?: boolean;
  newEnrollment?: boolean;
  error?: string;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  course_type?: string;
}

// İmza doğrulama fonksiyonu
async function verifySignature(params: PaymentParams, secret: string): Promise<boolean> {
  try {
    const { random_nr, platform_order_id, total_order_value, currency = '0' } = params;
    
    if (!random_nr || !platform_order_id || !total_order_value) {
      console.error('Missing signature parameters:', { random_nr, platform_order_id, total_order_value, currency });
      return false;
    }
    
    const signatureData = `${random_nr}${platform_order_id}${total_order_value}${currency}`;
    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(signatureData)
      .digest('base64');
    
    const isValid = calculatedSignature === params.signature;
    console.log('Signature verification:', { isValid, calculatedSignature, receivedSignature: params.signature });
    
    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Kursa kayıt fonksiyonu
async function enrollUserToCourse(userId: string, courseId: string): Promise<EnrollmentResult> {
  try {
    console.log(`Starting enrollment process - User: ${userId}, Course: ${courseId}`);
    
    // Kullanıcının zaten kayıtlı olup olmadığını kontrol et
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('myuni_enrollments')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Enrollment check error:', checkError);
    }

    // Zaten aktif kayıt varsa
    if (existingEnrollment && existingEnrollment.is_active) {
      console.log('User already enrolled in course:', { userId, courseId, enrollmentId: existingEnrollment.id });
      return { success: true, enrollmentId: existingEnrollment.id, alreadyEnrolled: true };
    }

    // Kayıt varsa ama aktif değilse, aktif hale getir
    if (existingEnrollment && !existingEnrollment.is_active) {
      console.log('Reactivating existing enrollment:', existingEnrollment.id);
      
      const { data: updatedEnrollment, error: updateError } = await supabase
        .from('myuni_enrollments')
        .update({ 
          is_active: true, 
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0 
        })
        .eq('id', existingEnrollment.id)
        .select()
        .single();

      if (updateError) {
        console.error('Enrollment update error:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('Enrollment reactivated successfully:', updatedEnrollment);
      return { success: true, enrollmentId: updatedEnrollment.id, reactivated: true };
    }

    // Yeni kayıt oluştur
    console.log('Creating new enrollment...');
    
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true
    };

    const { data: newEnrollment, error: insertError } = await supabase
      .from('myuni_enrollments')
      .insert(enrollmentData)
      .select()
      .single();

    if (insertError) {
      console.error('New enrollment error:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('New enrollment created successfully:', newEnrollment);
    return { success: true, enrollmentId: newEnrollment.id, newEnrollment: true };

  } catch (error) {
    console.error('Enrollment process error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Email gönderme fonksiyonu
async function sendPaymentSuccessEmail(
  courseData: CourseData, 
  userEmail: string,
  userName: string,
  orderId: string, 
  paymentAmount: string,
  locale: string = 'tr'
): Promise<void> {
  try {
    // Dynamic import for email service
    const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
    
    if (!userEmail) {
      console.log('No user email found, skipping email notification');
      return;
    }

    const userInfo = {
      name: userName,
      email: userEmail
    };

    const courseInfo = {
      title: courseData.title,
      description: courseData.description || '',
      slug: courseData.slug
    };

    const orderInfo = {
      orderId: orderId,
      amount: paymentAmount,
      isFree: false // Normal ödeme
    };

    // Kurs tipini belirle
    const courseType = courseData.course_type || 'online';

    console.log('Sending payment success email...', {
      email: userEmail,
      course: courseData.title,
      order: orderId,
      amount: paymentAmount,
      courseType: courseType
    });

    const emailResult = await sendPurchaseConfirmationEmail(
      userInfo, 
      courseInfo, 
      orderInfo, 
      locale,
      courseType
    );

    if (emailResult.success) {
      console.log('Payment success email sent successfully:', emailResult.messageId);
    } else {
      console.error('Failed to send payment success email:', emailResult.error);
    }

  } catch (error) {
    console.error('Error in sendPaymentSuccessEmail:', error);
  }
}

// Request verilerini ayrıştırma fonksiyonu
async function parseRequestData(request: Request): Promise<PaymentParams> {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    console.log('Shopier Return - Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data') || 
        contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      const data: PaymentParams = {};
      for (const [key, value] of formData.entries()) {
        data[key as keyof PaymentParams] = value as string;
      }
      console.log('Shopier Return - Parsed form data:', data);
      return data;
    }
    
    if (contentType.includes('application/json')) {
      const data = await request.json() as PaymentParams;
      console.log('Shopier Return - Parsed JSON data:', data);
      return data;
    }
    
    const text = await request.text();
    console.log('Shopier Return - Raw request text:', text);
    
    if (text.includes('=')) {
      const params = new URLSearchParams(text);
      const data: PaymentParams = {};
      for (const [key, value] of params.entries()) {
        data[key as keyof PaymentParams] = value;
      }
      console.log('Shopier Return - Parsed URL-encoded data:', data);
      return data;
    }
    
    try {
      const data = JSON.parse(text) as PaymentParams;
      console.log('Shopier Return - Parsed fallback JSON data:', data);
      return data;
    } catch {
      console.log('Shopier Return - No parseable data found');
      return {};
    }
  } catch (error) {
    console.error('Shopier Return - Request parsing error:', error);
    return {};
  }
}

// Ana ödeme return işleme fonksiyonu
async function handlePaymentReturn(params: PaymentParams): Promise<NextResponse> {
  try {
    const { status, platform_order_id, payment_id } = params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    
    console.log('=== SHOPIER RETURN HANDLER ===');
    console.log('Received params:', params);
    
    // İmza doğrulama (varsa) - Development ve test modunda skip
    const apiSecret = process.env.SHOPIER_API_SECRET;
    const isTestMode = params.platform_order_id?.startsWith('MOCK-') || 
                      params.platform_order_id?.startsWith('TEST-') ||
                      process.env.NODE_ENV === 'development';
    
    if (apiSecret && params.signature && params.random_nr && params.total_order_value && !isTestMode) {
      const isValidSignature = await verifySignature(params, apiSecret);
      if (!isValidSignature) {
        console.error('Invalid signature in return - rejecting');
        const failUrl = new URL(`/tr/payment-failed`, baseUrl);
        failUrl.searchParams.set('error', 'invalid_signature');
        return NextResponse.redirect(failUrl, 303);
      }
      console.log('Signature verified successfully');
    } else if (isTestMode) {
      console.log('Development/Test mode detected - skipping signature verification');
    }

    // Sipariş ID kontrolü
    if (!platform_order_id) {
      console.error('No platform_order_id found in return data');
      const failUrl = new URL(`/tr/payment-failed`, baseUrl);
      failUrl.searchParams.set('error', 'missing_order_id');
      return NextResponse.redirect(failUrl, 303);
    }

    // Siparişi veritabanından al
    console.log('Fetching order from database using order ID:', platform_order_id);
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderid', platform_order_id)
      .single();

    if (orderError || !orderData) {
      console.error('Order fetch error:', orderError);
      const failUrl = new URL(`/tr/payment-failed`, baseUrl);
      failUrl.searchParams.set('error', 'order_not_found');
      failUrl.searchParams.set('orderId', platform_order_id);
      return NextResponse.redirect(failUrl, 303);
    }

    console.log('Order data retrieved from database:', orderData);

    // Siparişten bilgileri al
    const courseId = orderData.courseid;
    const courseName = orderData.coursename;
    const userEmail = orderData.useremail;
    const locale = orderData.custom_data?.locale || 'tr';
    const userId = orderData.custom_data?.clerkUserId || orderData.custom_data?.userId || userEmail;
    const userName = orderData.custom_data?.userName || userEmail.split('@')[0].replace(/[._]/g, ' ');

    console.log('Final extracted data:', { courseId, courseName, locale, userEmail, userId, status });

    // Ödeme durumu kontrolü
    if (status !== 'success') {
      console.error('Payment failed in return - Order:', platform_order_id, 'Status:', status);
      
      // Siparişin durumunu failed olarak güncelle
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          paymentid: payment_id || null,
          updated_at: new Date().toISOString(),
          notes: `Payment failed with status: ${status}`
        })
        .eq('orderid', platform_order_id);
      
      // Başarısız ödeme sayfasına yönlendir
      const failUrl = new URL(`/${locale}/payment-failed`, baseUrl);
      failUrl.searchParams.set('error', 'payment_failed');
      failUrl.searchParams.set('orderId', platform_order_id);
      failUrl.searchParams.set('status', status || 'failed');
      
      return NextResponse.redirect(failUrl, 303);
    }

    console.log('Payment successful in return - Order:', platform_order_id);

    // Siparişin durumunu completed olarak güncelle
    await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        paymentid: payment_id || null,
        paymentmethod: 'shopier',
        updated_at: new Date().toISOString()
      })
      .eq('orderid', platform_order_id);

    // Kurs ve kullanıcı bilgileri varsa enrollment işlemini yap
    if (courseId && userId) {
      console.log('=== STARTING ENROLLMENT PROCESS ===');
      
      try {
        // Kurs bilgilerini al
        const { data: courseData, error: courseError } = await supabase
          .from('myuni_courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (courseError || !courseData) {
          console.error('Course fetch error:', courseError);
          // Kurs bulunamasa bile başarılı ödeme sayfasına yönlendir
          // Çünkü ödeme başarılı olmuş
        } else {
          console.log('Course data retrieved:', { id: courseData.id, title: courseData.title });
          
          // Enrollment işlemi
          const enrollmentResult = await enrollUserToCourse(userId, courseId);
          
          if (enrollmentResult.success) {
            console.log('Enrollment successful:', {
              enrollmentId: enrollmentResult.enrollmentId,
              status: enrollmentResult.alreadyEnrolled ? 'already_enrolled' : 
                      enrollmentResult.reactivated ? 'reactivated' : 'new'
            });

            // Orders tablosunu enrollment bilgisiyle güncelle
            await supabase
              .from('orders')
              .update({ 
                enrolled: true, 
                enrollmentid: enrollmentResult.enrollmentId,
                updated_at: new Date().toISOString()
              })
              .eq('orderid', platform_order_id);

      // USAGE COUNT ARTIRMA - Başarılı ödeme sonrası
      try {
        const { incrementUsageCountAfterPayment } = await import('../../../lib/referralService');
        const usageResult = await incrementUsageCountAfterPayment(userId);
        
        if (usageResult.success) {
          console.log('Usage count başarıyla artırıldı');
        } else {
          console.error('Usage count artırılamadı:', usageResult.error);
        }
      } catch (usageError) {
        console.error('Usage count işlemi başarısız:', usageError);
        // Usage count hatası ödeme sürecini durdurmasın
      }

      // REFERRAL ÖDÜL KODU OLUŞTURMA - Başarılı ödeme sonrası
      console.log('=== RETURN: REFERRAL ÖDÜL KODU OLUŞTURMA BAŞLADI ===');
      console.log('Return User ID:', userId);
      try {
        const { createRewardCodeAfterPayment } = await import('../../../lib/referralService');
        const rewardResult = await createRewardCodeAfterPayment(userId);
        
        if (rewardResult.success && rewardResult.code) {
          console.log('Referral ödül kodu oluşturuldu:', rewardResult.code);
        } else if (rewardResult.success) {
          console.log('Referral kodu kullanılmamış, ödül kodu oluşturulmadı');
        } else {
          console.error('Referral ödül kodu oluşturulamadı:', rewardResult.error);
        }
      } catch (referralError) {
        console.error('Referral ödül kodu işlemi başarısız:', referralError);
        // Referral hatası ödeme sürecini durdurmasın
      }

            // Email gönder (enrollment başarılı ise)
            if (userEmail && enrollmentResult.enrollmentId) {
              try {
                await sendPaymentSuccessEmail(
                  courseData,
                  userEmail,
                  userName,
                  platform_order_id,
                  params.total_order_value || orderData.amount?.toString() || '0',
                  locale
                );
              } catch (emailError) {
                console.error('Email sending failed but continuing:', emailError);
              }
            }
          } else {
            console.error('Enrollment failed:', enrollmentResult.error);
            // Enrollment başarısız olsa bile success sayfasına yönlendir
            // Çünkü ödeme başarılı olmuş
          }
        }
      } catch (enrollmentError) {
        console.error('Error during enrollment process:', enrollmentError);
        // Enrollment hatası olsa bile success sayfasına yönlendir
      }
    } else {
      console.log('Missing courseId or userId, skipping enrollment:', { courseId, userId });
    }
    
    // Başarılı ödeme sayfasına yönlendir
    const successUrl = new URL(`/${locale}/payment-success`, baseUrl);
    successUrl.searchParams.set('orderId', platform_order_id);
    
    if (payment_id) {
      successUrl.searchParams.set('paymentId', payment_id);
    }
    
    if (courseId) {
      successUrl.searchParams.set('courseId', courseId);
    }
    
    if (courseName) {
      successUrl.searchParams.set('name', encodeURIComponent(courseName));
    }
    
    // Enrollment durumunu belirt
    successUrl.searchParams.set('enrolled', 'true');
    
    console.log('Redirecting to success page:', successUrl.toString());
    console.log('=== SHOPIER RETURN COMPLETED ===');
    
    return NextResponse.redirect(successUrl, 303);
    
  } catch (error) {
    console.error('Error in handlePaymentReturn:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const failUrl = new URL('/tr/payment-failed', baseUrl);
    failUrl.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(failUrl, 303);
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  try {
    console.log('=== SHOPIER RETURN ÇAĞRILDI ===');
    console.log('Timestamp:', new Date().toISOString());
    // URL search params'dan parametreleri al
    const url = new URL(request.url);
    const params: PaymentParams = Object.fromEntries(url.searchParams.entries());
    console.log('Shopier Return GET - URL params:', params);
    
    return await handlePaymentReturn(params);
  } catch (error) {
    console.error('Error in Shopier return GET:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const failUrl = new URL('/tr/payment-failed', baseUrl);
    failUrl.searchParams.set('error', 'get_handler_error');
    return NextResponse.redirect(failUrl, 303);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // POST body'den parametreleri al
    const params = await parseRequestData(request);
    console.log('Shopier Return POST - Processed data:', params);
    
    return await handlePaymentReturn(params);
  } catch (error) {
    console.error('Error in Shopier return POST:', error);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
    const failUrl = new URL('/tr/payment-failed', baseUrl);
    failUrl.searchParams.set('error', 'post_handler_error');
    return NextResponse.redirect(failUrl, 303);
  }
}

// Options handler
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}