// app/api/shopier-callback/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

// Type definitions
interface StateData {
  orderId: string;
  courseId: string;
  userId: string;
  email: string;
  locale: string;
  amount: string;
  courseName: string;
}

interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
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

// OAuth2 Token alma fonksiyonu
async function getOAuth2Token(code: string, state: string): Promise<{ success: boolean; data?: TokenResponse; error?: string }> {
  try {
    const clientId = process.env.SHOPIER_CLIENT_ID;
    const clientSecret = process.env.SHOPIER_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myunilab.net";
    const redirectUri = `${baseUrl}/api/shopier-callback`;

    if (!clientId || !clientSecret) {
      return { success: false, error: 'Missing OAuth2 credentials' };
    }

    console.log('=== SHOPIER OAuth2 TOKEN REQUEST ===');
    console.log('Token URL: https://api.shopier.com:8443/v1/oauth2/token');
    console.log('Code:', code.substring(0, 20) + '...');
    console.log('State:', state.substring(0, 50) + '...');
    console.log('Redirect URI:', redirectUri);

    // Token endpoint'ine POST isteği
    const tokenUrl = 'https://api.shopier.com:8443/v1/oauth2/token';
    
    const postData = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      state: state,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData.toString()
    });

    const responseText = await response.text();
    console.log('Token response status:', response.status);
    console.log('Token response:', responseText);

    if (!response.ok) {
      let errorMessage = 'Token request failed';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = responseText || errorMessage;
      }
      return { success: false, error: errorMessage };
    }

    const tokenData: TokenResponse = JSON.parse(responseText);
    console.log('Token received successfully');
    console.log('Token type:', tokenData.token_type);
    console.log('Expires in:', tokenData.expires_in);
    
    return { success: true, data: tokenData };

  } catch (error) {
    console.error('OAuth2 token request error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
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

// Ödeme başarılı email gönderme
async function sendPaymentSuccessEmail(
  courseData: CourseData, 
  userEmail: string,
  userName: string,
  orderId: string, 
  paymentAmount: string,
  locale: string = 'tr'
): Promise<void> {
  try {
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
      isFree: false
    };

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

// State'i decode et
function decodeState(state: string): StateData | null {
  try {
    const decoded = Buffer.from(state, 'base64').toString('utf-8');
    return JSON.parse(decoded) as StateData;
  } catch (error) {
    console.error('Failed to decode state:', error);
    return null;
  }
}

// Ana OAuth2 callback işleme fonksiyonu
async function processOAuth2Callback(request: Request): Promise<NextResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net';
  
  try {
    console.log('=== SHOPIER OAuth2 CALLBACK STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    
    // URL parametrelerini al
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Received parameters:');
    console.log('- code:', code ? code.substring(0, 20) + '...' : 'null');
    console.log('- state:', state ? state.substring(0, 50) + '...' : 'null');
    console.log('- error:', error);
    console.log('- error_description:', errorDescription);

    // Hata kontrolü
    if (error) {
      console.error('OAuth2 error received:', error, errorDescription);
      const failUrl = new URL('/tr/payment-failed', baseUrl);
      failUrl.searchParams.set('error', error);
      failUrl.searchParams.set('message', errorDescription || 'OAuth2 hatası');
      return NextResponse.redirect(failUrl, 303);
    }

    // Code ve state kontrolü
    if (!code || !state) {
      console.error('Missing code or state parameter');
      const failUrl = new URL('/tr/payment-failed', baseUrl);
      failUrl.searchParams.set('error', 'missing_parameters');
      return NextResponse.redirect(failUrl, 303);
    }

    // State'i decode et
    const stateData = decodeState(state);
    if (!stateData) {
      console.error('Failed to decode state');
      const failUrl = new URL('/tr/payment-failed', baseUrl);
      failUrl.searchParams.set('error', 'invalid_state');
      return NextResponse.redirect(failUrl, 303);
    }

    console.log('Decoded state data:', stateData);
    const { orderId, courseId, userId, email, locale, amount, courseName } = stateData;

    // Token al
    console.log('Requesting OAuth2 token...');
    const tokenResult = await getOAuth2Token(code, state);

    if (!tokenResult.success || !tokenResult.data) {
      console.error('Failed to get OAuth2 token:', tokenResult.error);
      
      // Siparişi failed olarak güncelle
      await supabase
        .from('orders')
        .update({ 
          status: 'failed',
          updated_at: new Date().toISOString(),
          notes: `OAuth2 token failed: ${tokenResult.error}`
        })
        .eq('orderid', orderId);

      const failUrl = new URL(`/${locale}/payment-failed`, baseUrl);
      failUrl.searchParams.set('error', 'token_failed');
      failUrl.searchParams.set('orderId', orderId);
      return NextResponse.redirect(failUrl, 303);
    }

    console.log('OAuth2 token received successfully!');
    const { access_token, refresh_token, expires_in, token_type } = tokenResult.data;

    // Token'ı sipariş verisiyle birlikte kaydet (ileride kullanmak için)
    await supabase
      .from('orders')
      .update({ 
        status: 'completed',
        paymentmethod: 'shopier_oauth2',
        updated_at: new Date().toISOString(),
        custom_data: {
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_in: expires_in,
          token_type: token_type,
          token_received_at: new Date().toISOString()
        }
      })
      .eq('orderid', orderId);

    // Kurs bilgilerini al
    console.log('Fetching course data for:', courseId);
    const { data: courseData, error: courseError } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      console.error('Course fetch error:', courseError);
      // Kurs bulunamasa bile ödeme başarılı sayılabilir
    }

    // Kursa kayıt işlemi
    console.log('Starting enrollment process...');
    const enrollmentResult = await enrollUserToCourse(userId, courseId);

    if (!enrollmentResult.success) {
      console.error('Enrollment failed:', enrollmentResult.error);
      // Enrollment başarısız olsa bile ödeme tamamlandı
    } else {
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
        .eq('orderid', orderId);
    }

    // Referral işlemleri
    try {
      const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
      
      const usageResult = await incrementUsageCountAfterPayment(userId);
      if (usageResult.success) {
        console.log('Usage count başarıyla artırıldı');
      }

      const rewardResult = await createRewardCodeAfterPayment(userId);
      if (rewardResult.success && rewardResult.code) {
        console.log('Referral ödül kodu oluşturuldu:', rewardResult.code);
      }
    } catch (referralError) {
      console.error('Referral işlemi başarısız:', referralError);
    }

    // Email gönder
    if (courseData && email) {
      try {
        const userName = email.split('@')[0].replace(/[._]/g, ' ');
        await sendPaymentSuccessEmail(
          courseData,
          email,
          userName,
          orderId,
          amount,
          locale
        );
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    // Başarılı sayfasına yönlendir
    const successUrl = new URL(`/${locale}/payment-success`, baseUrl);
    successUrl.searchParams.set('orderId', orderId);
    successUrl.searchParams.set('courseId', courseId);
    successUrl.searchParams.set('name', courseName);
    successUrl.searchParams.set('enrolled', 'true');
    
    console.log('=== SHOPIER OAuth2 CALLBACK COMPLETED ===');
    console.log('Redirecting to:', successUrl.toString());
    
    return NextResponse.redirect(successUrl, 303);

  } catch (error) {
    console.error('=== SHOPIER OAuth2 CALLBACK ERROR ===');
    console.error('Error:', error);
    
    const failUrl = new URL('/tr/payment-failed', baseUrl);
    failUrl.searchParams.set('error', 'internal_error');
    return NextResponse.redirect(failUrl, 303);
  }
}

// HTTP Method Handlers
export async function GET(request: Request): Promise<NextResponse> {
  console.log('Shopier OAuth2 callback received via GET');
  return processOAuth2Callback(request);
}

export async function POST(request: Request): Promise<NextResponse> {
  console.log('Shopier OAuth2 callback received via POST');
  return processOAuth2Callback(request);
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
