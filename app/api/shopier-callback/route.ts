// app/api/shopier-callback/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabase from '../../_services/supabaseClient';

// Type definitions
interface CallbackParams {
  random_nr?: string;
  platform_order_id?: string;
  total_order_value?: string;
  currency?: string;
  signature?: string;
  status?: string;
  payment_id?: string;
  custom_params?: string;
  courseId?: string;
  userEmail?: string;
  userId?: string;
  [key: string]: string | number | boolean | undefined;
}

interface CustomParams {
  courseId?: string;
  userEmail?: string;
  userId?: string;
  courseName?: string;
  locale?: string;
  clerkUserId?: string;
  orderId?: string;
  discountCodes?: string;
  totalDiscount?: number;
  [key: string]: string | number | boolean | undefined;
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

// Shopier IP adresleri (güvenlik için)
const SHOPIER_IPS = ['185.161.45.34', '185.161.45.35'];

// İmza doğrulama fonksiyonu
async function verifySignature(params: CallbackParams, secret: string): Promise<boolean> {
  try {
    const { random_nr, platform_order_id, total_order_value, currency } = params;
    
    if (!random_nr || !platform_order_id || !total_order_value || !currency) {
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

// Request verilerini ayrıştırma fonksiyonu
async function parseRequestData(request: Request): Promise<CallbackParams> {
  let data: CallbackParams = {};
  const contentType = request.headers.get('content-type') || '';

  try {
    console.log('=== SHOPIER CALLBACK ÇAĞRILDI ===');
    console.log('Content-Type:', contentType);
    console.log('Timestamp:', new Date().toISOString());
    
    if (contentType.includes('multipart/form-data') || 
        contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        data[key] = value as string;
      }
      console.log('Parsed form data:', data);
    } else if (contentType.includes('application/json')) {
      data = await request.json() as CallbackParams;
      console.log('Parsed JSON data:', data);
    } else {
      const text = await request.text();
      console.log('Raw request text:', text);
      
      try {
        data = JSON.parse(text) as CallbackParams;
        console.log('Parsed as JSON from text:', data);
      } catch {
        const params = new URLSearchParams(text);
        data = Object.fromEntries(params.entries()) as CallbackParams;
        console.log('Parsed as URL params:', data);
      }
    }
  } catch (error) {
    console.error('Request parsing error:', error);
  }

  // URL query parametrelerini de ekle
  const url = new URL(request.url);
  const urlParams = Object.fromEntries(url.searchParams.entries()) as CallbackParams;
  
  if (Object.keys(urlParams).length > 0) {
    console.log('URL params:', urlParams);
  }
  
  return { ...urlParams, ...data };
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

// Ödeme başarılı durumunda email gönderme
async function sendPaymentSuccessEmail(
  courseData: CourseData, 
  customParams: CustomParams, 
  orderId: string, 
  paymentAmount: string
): Promise<void> {
  try {
    // Dynamic import for email service
    const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
    
    const userEmail = customParams.userEmail;
    const locale = customParams.locale || 'tr';
    
    if (!userEmail) {
      console.log('No user email found, skipping email notification');
      return;
    }

    // User name'i email'den türet veya custom_params'dan al
    const userName = userEmail.split('@')[0].replace(/[._]/g, ' ');
    
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

// Ana ödeme işleme fonksiyonu
async function processPaymentNotification(request: Request): Promise<NextResponse> {
  try {
    console.log('=== SHOPIER CALLBACK STARTED ===');
    console.log('Request method:', request.method);
    console.log('Request URL:', request.url);
    
    // Güvenlik kontrolleri (production ortamında)
    if (process.env.NODE_ENV === 'production') {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      request.headers.get('x-real-ip') ||
                      request.headers.get('cf-connecting-ip');
      
      console.log('Client IP:', clientIP);
      
      if (!clientIP || !SHOPIER_IPS.includes(clientIP)) {
        console.error('Unauthorized IP access:', clientIP);
        return NextResponse.json({ success: false, error: 'Unauthorized IP' }, { status: 403 });
      }
    }

    // İstek verilerini ayrıştır
    const formData = await parseRequestData(request);
    console.log('Parsed callback data:', formData);

    // API secret kontrolü
    const apiSecret = process.env.SHOPIER_API_SECRET;
    if (!apiSecret) {
      console.error('SHOPIER_API_SECRET not found in environment variables');
      return NextResponse.json({ success: false, error: 'Server configuration error' }, { status: 500 });
    }

    // İmzayı doğrula
    const isValidSignature = await verifySignature(formData, apiSecret);
    if (!isValidSignature) {
      console.error('Invalid signature - rejecting callback');
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 200 });
    }

    console.log('Signature verified successfully');

    // Ödeme durumunu kontrol et
    if (formData.status !== 'success') {
      console.error('Payment failed:', {
        orderId: formData.platform_order_id,
        status: formData.status,
        paymentId: formData.payment_id
      });

      // Sipariş durumunu güncelle
      if (formData.platform_order_id) {
        await supabase
          .from('orders')
          .update({ 
            status: 'failed',
            paymentid: formData.payment_id || null,
            updated_at: new Date().toISOString(),
            notes: `Payment failed with status: ${formData.status}`
          })
          .eq('orderid', formData.platform_order_id);
      }
      
      return NextResponse.json({
        success: false,
        error: 'Payment failed',
        status: formData.status,
        orderId: formData.platform_order_id
      }, { status: 200 });
    }

    console.log('Payment status is success, proceeding...');

    // Sipariş ID kontrolü
    if (!formData.platform_order_id) {
      console.error('Missing platform_order_id in callback');
      return NextResponse.json({
        success: false,
        error: 'Missing order ID'
      }, { status: 200 });
    }

    // Siparişi veritabanından al
    console.log('Fetching order from database:', formData.platform_order_id);
    
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('orderid', formData.platform_order_id)
      .single();

    if (orderError || !orderData) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order not found in database'
      }, { status: 200 });
    }

    console.log('Order data retrieved from database:', orderData);

    // Siparişten bilgileri al
    const courseId = orderData.courseid;
    const userEmail = orderData.useremail;
    const userId = orderData.custom_data?.clerkUserId || orderData.custom_data?.userId || userEmail;
    const locale = orderData.custom_data?.locale || 'tr';

    console.log('Extracted data from order:', { courseId, userEmail, userId, locale });

    // Kurs bilgilerini al
    console.log('Fetching course data for:', courseId);
    
    const { data: courseData, error: courseError } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      console.error('Course fetch error:', courseError);
      return NextResponse.json({
        success: false,
        error: 'Course not found'
      }, { status: 200 });
    }

    console.log('Course data retrieved:', { id: courseData.id, title: courseData.title });

    // Sipariş durumunu completed olarak güncelle
    await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        paymentid: formData.payment_id || null,
        paymentmethod: 'shopier',
        updated_at: new Date().toISOString()
      })
      .eq('orderid', formData.platform_order_id);

    // Kursa kayıt işlemi
    const enrollmentResult = await enrollUserToCourse(userId, courseId);

    if (!enrollmentResult.success) {
      console.error('Enrollment failed:', enrollmentResult.error);
      return NextResponse.json({
        success: false,
        error: 'Course enrollment failed',
        details: enrollmentResult.error
      }, { status: 200 });
    }

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
      .eq('orderid', formData.platform_order_id);

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
      console.log('=== CALLBACK: REFERRAL ÖDÜL KODU OLUŞTURMA BAŞLADI ===');
      console.log('Callback User ID:', userId);
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

    // EMAIL GÖNDERME - Başarılı ödeme sonrası
    try {
      const customParams = {
        userEmail: userEmail,
        locale: locale
      };

      await sendPaymentSuccessEmail(
        courseData,
        customParams,
        formData.platform_order_id,
        formData.total_order_value || orderData.amount?.toString() || '0'
      );
    } catch (emailError) {
      console.error('Email sending failed but continuing:', emailError);
      // Email hatası ödeme sürecini durdurmasın
    }

    // Başarılı yanıt
    const response = {
      success: true,
      orderId: formData.platform_order_id,
      paymentId: formData.payment_id,
      courseId: courseId,
      userId: userId,
      enrollmentId: enrollmentResult.enrollmentId,
      enrollmentStatus: enrollmentResult.alreadyEnrolled ? 'already_enrolled' : 
                       enrollmentResult.reactivated ? 'reactivated' : 'new',
      emailSent: true,
      timestamp: new Date().toISOString()
    };

    console.log('=== CALLBACK COMPLETED SUCCESSFULLY ===');
    console.log('Response:', response);
    
    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('=== CALLBACK ERROR ===');
    console.error('Payment processing error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = {
      success: false,
      error: 'Payment processing failed',
      details: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal error',
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response, { status: 200 });
  }
}

// HTTP Method Handlers
export async function GET(request: Request): Promise<NextResponse> {
  console.log('Shopier callback received via GET');
  return processPaymentNotification(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log('Shopier callback received via POST');
  return processPaymentNotification(request);
}

export async function PUT(request: Request): Promise<NextResponse> {
  console.log('Shopier callback received via PUT');
  return processPaymentNotification(request);
}

export async function PATCH(request: Request): Promise<NextResponse> {
  console.log('Shopier callback received via PATCH');
  return processPaymentNotification(request);
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, PATCH, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}