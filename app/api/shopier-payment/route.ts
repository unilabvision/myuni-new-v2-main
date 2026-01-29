// app/api/shopier-payment/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

interface PaymentRequestBody {
  courseId: string;
  courseName: string;
  amount: number;
  email: string;
  phone?: string;
  name: string;
  address?: string;
  city?: string;
  district?: string;
  zipCode?: string;
  discountCodes?: string;
  totalDiscount?: number;
  referralCode?: string;
  notes?: string;
  locale?: string;
  clerkUserId?: string;
  userId?: string;
}

interface CourseData {
  id: string;
  title: string;
  description?: string;
  slug: string;
  price: number;
  is_active: boolean;
  course_type?: string;
}

// Ücretsiz kayıt email gönderme
async function sendFreeEnrollmentEmail(
  courseData: CourseData, 
  userInfo: { name: string; email: string }, 
  orderId: string, 
  locale: string, 
  courseType: string = 'online'
) {
  try {
    const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
    
    const userInfoForEmail = {
      name: userInfo.name,
      email: userInfo.email
    };

    const courseInfo = {
      title: courseData.title,
      description: courseData.description || '',
      slug: courseData.slug
    };

    const orderInfo = {
      orderId: orderId,
      amount: '0.00',
      isFree: true
    };

    console.log('Sending free enrollment confirmation email...', {
      email: userInfo.email,
      course: courseData.title,
      order: orderId,
      courseType: courseType
    });

    const emailResult = await sendPurchaseConfirmationEmail(
      userInfoForEmail, 
      courseInfo, 
      orderInfo, 
      locale,
      courseType
    );

    if (emailResult.success) {
      console.log('Free enrollment confirmation email sent successfully:', emailResult.messageId);
      return { success: true, messageId: emailResult.messageId };
    } else {
      console.error('Failed to send free enrollment confirmation email:', emailResult.error);
      return { success: false, error: emailResult.error };
    }

  } catch (error) {
    console.error('Error in sendFreeEnrollmentEmail:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

// Sipariş kaydetme fonksiyonu
async function saveOrderToDatabase(orderData: {
  orderId: string;
  courseId: string;
  userEmail: string;
  courseName: string;
  amount: number;
  clerkUserId?: string;
  userId: string;
  locale: string;
  discountCodes: string;
  totalDiscount: number;
  userPhone: string;
  userName: string;
  userAddress: string;
  userCity: string;
  userNotes: string;
  ipAddress: string;
  userAgent: string;
}) {
  try {
    console.log('Saving order to database:', orderData);
    
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        orderid: orderData.orderId,
        courseid: orderData.courseId,
        useremail: orderData.userEmail,
        coursename: orderData.courseName,
        amount: orderData.amount,
        status: 'pending',
        paymentmethod: 'shopier',
        custom_data: {
          clerkUserId: orderData.clerkUserId,
          userId: orderData.userId,
          locale: orderData.locale,
          discountCodes: orderData.discountCodes,
          totalDiscount: orderData.totalDiscount,
          userPhone: orderData.userPhone,
          userName: orderData.userName,
          userAddress: orderData.userAddress,
          userCity: orderData.userCity,
          userNotes: orderData.userNotes
        },
        discountcode: orderData.discountCodes,
        discountamount: orderData.totalDiscount || 0,
        ip_address: orderData.ipAddress,
        user_agent: orderData.userAgent
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error saving order to database:', orderError);
      return { success: false, error: orderError.message };
    }

    console.log('Order saved successfully:', savedOrder);
    return { success: true, order: savedOrder };
  } catch (error) {
    console.error('Error in saveOrderToDatabase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

export async function POST(request: Request) {
  try {
    console.log('=== SHOPIER PAYMENT (OAuth2) ÇAĞRILDI ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const body: PaymentRequestBody = await request.json();

    // DEBUG: Gelen veriyi logla
    console.log('=== SHOPIER OAuth2 API DEBUG ===');
    console.log('Received body:', body);
    console.log('body.clerkUserId:', body.clerkUserId);
    console.log('body.userId:', body.userId);
    console.log('body.email:', body.email);
    console.log('================================');

    // OAuth2 API bilgileri
    const clientId = process.env.SHOPIER_CLIENT_ID;
    const clientSecret = process.env.SHOPIER_CLIENT_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myunilab.net";

    if (!clientId || !clientSecret) {
      console.error('Missing Shopier OAuth2 credentials');
      return NextResponse.json({ 
        success: false, 
        message: "Shopier OAuth2 bilgileri eksik" 
      }, { status: 500 });
    }

    // İstek doğrulama
    if (!body.courseId || !body.email || !body.name) {
      return NextResponse.json({ 
        success: false, 
        message: "Gerekli parametreler eksik (courseId, email, name)" 
      }, { status: 400 });
    }

    // Clerk User ID'sini doğru şekilde al
    const clerkUserId = body.clerkUserId || body.userId;
    
    // User ID doğrulama
    if (!clerkUserId || clerkUserId.includes('@')) {
      console.error('=== USER ID WARNING ===');
      console.error('Invalid or missing Clerk user ID:', clerkUserId);
      console.error('Expected format: user_xxxxxxxxxx');
      console.error('Falling back to email:', body.email);
      console.error('=======================');
    }

    // Kurs bilgilerini Supabase'den al
    const { data: courseData, error: courseError } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('id', body.courseId)
      .eq('is_active', true)
      .single();

    if (courseError || !courseData) {
      return NextResponse.json({ 
        success: false, 
        message: "Kurs bulunamadı veya aktif değil" 
      }, { status: 404 });
    }

    // Sipariş detayları
    const orderId = `MYU-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // Tutar kontrolü
    const amount = parseFloat(String(body.amount || courseData.price));
    
    const buyerName = body.name.split(' ')[0] || body.name;
    const buyerSurname = body.name.split(' ').slice(1).join(' ') || "";
    const buyerEmail = body.email;
    const buyerPhone = body.phone || "";
    const courseName = courseData.title;
    
    // Enrollment için kullanılacak user ID'yi belirle
    const userIdForEnrollment = clerkUserId && !clerkUserId.includes('@') ? clerkUserId : buyerEmail;
    
    console.log('=== ENROLLMENT USER ID DECISION ===');
    console.log('clerkUserId:', clerkUserId);
    console.log('buyerEmail:', buyerEmail);
    console.log('userIdForEnrollment:', userIdForEnrollment);
    console.log('===================================');

    // İstek bilgileri
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Sipariş verisini hazırla
    const orderData = {
      orderId: orderId,
      courseId: body.courseId,
      userEmail: buyerEmail,
      courseName: courseName,
      amount: amount,
      clerkUserId: clerkUserId,
      userId: userIdForEnrollment,
      locale: body.locale || 'tr',
      discountCodes: body.discountCodes || '',
      totalDiscount: body.totalDiscount || 0,
      userPhone: buyerPhone,
      userName: body.name,
      userAddress: body.address || '',
      userCity: body.city || '',
      userNotes: body.notes || '',
      ipAddress: ipAddress,
      userAgent: userAgent
    };

    // Siparişi veritabanına kaydet
    const saveResult = await saveOrderToDatabase(orderData);
    if (!saveResult.success) {
      console.error('Failed to save order:', saveResult.error);
      return NextResponse.json({
        success: false,
        message: "Sipariş kaydedilirken hata oluştu: " + saveResult.error
      }, { status: 500 });
    }
    
    // %100 indirim durumunda doğrudan kayıt
    if (amount <= 0) {
      try {
        // Siparişi completed olarak güncelle
        await supabase
          .from('orders')
          .update({ 
            status: 'completed',
            paymentmethod: 'free_discount',
            updated_at: new Date().toISOString()
          })
          .eq('orderid', orderId);

        // Kullanıcının zaten kayıtlı olup olmadığını kontrol et
        const { data: existingEnrollment, error: checkError } = await supabase
          .from('myuni_enrollments')
          .select('id')
          .eq('user_id', userIdForEnrollment)
          .eq('course_id', body.courseId)
          .eq('is_active', true)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Enrollment check error:', checkError);
        }

        let enrollmentId = null;

        if (!existingEnrollment) {
          console.log('=== CREATING FREE ENROLLMENT ===');
          console.log('user_id:', userIdForEnrollment);
          console.log('course_id:', body.courseId);
          
          const enrollmentData = {
            user_id: userIdForEnrollment,
            course_id: body.courseId,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
            is_active: true
          };

          const { data: newEnrollment, error: enrollError } = await supabase
            .from('myuni_enrollments')
            .insert(enrollmentData)
            .select()
            .single();

          if (enrollError) {
            console.error('Enrollment error:', enrollError);
            return NextResponse.json({
              success: false,
              message: "Kursa kaydedilirken bir hata oluştu: " + enrollError.message
            }, { status: 500 });
          }

          console.log('Free enrollment successful:', newEnrollment);
          enrollmentId = newEnrollment.id;
        } else {
          console.log('User already enrolled:', existingEnrollment);
          enrollmentId = existingEnrollment.id;
        }

        // Orders tablosunu enrollment bilgisiyle güncelle
        await supabase
          .from('orders')
          .update({ 
            enrolled: true,
            enrollmentid: enrollmentId,
            updated_at: new Date().toISOString()
          })
          .eq('orderid', orderId);

        // Referral işlemleri
        try {
          const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
          await incrementUsageCountAfterPayment(userIdForEnrollment);
          await createRewardCodeAfterPayment(userIdForEnrollment);
        } catch (referralError) {
          console.error('Referral işlemi başarısız:', referralError);
        }
        
        // Email gönder
        const userInfo = {
          name: body.name,
          email: buyerEmail
        };

        const courseType = courseData.course_type || 'online';

        try {
          await sendFreeEnrollmentEmail(courseData, userInfo, orderId, body.locale || 'tr', courseType);
        } catch (emailError) {
          console.error('Free enrollment email failed:', emailError);
        }
        
        // Başarılı kayıt ve yönlendirme
        const successUrl = `${baseUrl}/${body.locale || 'tr'}/payment-success?courseId=${encodeURIComponent(body.courseId)}&name=${encodeURIComponent(courseName)}&free=true&orderId=${orderId}`;
        
        return NextResponse.json({
          success: true,
          redirectToDirect: true,
          redirectUrl: successUrl,
          orderId: orderId,
          enrollmentSuccess: true,
          userIdUsed: userIdForEnrollment
        }, { status: 200 });
        
      } catch (enrollError) {
        console.error("Ücretsiz kurs kayıt hatası:", enrollError);
        const errorMessage = enrollError instanceof Error ? enrollError.message : "Bilinmeyen hata";
        return NextResponse.json({
          success: false,
          message: "Kursa kaydedilirken bir hata oluştu: " + errorMessage
        }, { status: 500 });
      }
    }

    // OAuth2 için state parametresi oluştur (sipariş bilgilerini içerir)
    const stateData = {
      orderId: orderId,
      courseId: body.courseId,
      userId: userIdForEnrollment,
      email: buyerEmail,
      locale: body.locale || 'tr',
      amount: amount.toFixed(2),
      courseName: courseName
    };
    
    // State'i base64 encode et
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    
    // Callback URL
    const redirectUri = `${baseUrl}/api/shopier-callback`;
    
    // Shopier OAuth2 Authorization URL oluştur
    const shopierAuthUrl = new URL('https://www.shopier.com/oauth2/authorize');
    shopierAuthUrl.searchParams.set('client_id', clientId);
    shopierAuthUrl.searchParams.set('redirect_uri', redirectUri);
    shopierAuthUrl.searchParams.set('response_type', 'code');
    shopierAuthUrl.searchParams.set('state', state);
    shopierAuthUrl.searchParams.set('scope', 'payment');
    
    // Ek parametreler (ödeme bilgileri)
    shopierAuthUrl.searchParams.set('amount', amount.toFixed(2));
    shopierAuthUrl.searchParams.set('currency', 'TRY');
    shopierAuthUrl.searchParams.set('order_id', orderId);
    shopierAuthUrl.searchParams.set('product_name', courseName);
    shopierAuthUrl.searchParams.set('buyer_name', `${buyerName} ${buyerSurname}`.trim());
    shopierAuthUrl.searchParams.set('buyer_email', buyerEmail);
    shopierAuthUrl.searchParams.set('buyer_phone', buyerPhone);
    
    console.log('=== SHOPIER OAuth2 REDIRECT ===');
    console.log('Order ID:', orderId);
    console.log('Amount:', amount.toFixed(2));
    console.log('Redirect URI:', redirectUri);
    console.log('Authorization URL:', shopierAuthUrl.toString());
    console.log('===============================');

    // Yönlendirme URL'ini döndür
    return NextResponse.json({
      success: true,
      redirectUrl: shopierAuthUrl.toString(),
      orderId: orderId,
      userIdUsed: userIdForEnrollment
    }, { status: 200 });

  } catch (error) {
    console.error("Shopier OAuth2 ödeme hazırlama hatası:", error);
    const errorMessage = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ 
      success: false, 
      message: "Ödeme hazırlanırken bir hata oluştu: " + errorMessage
    }, { status: 500 });
  }
}
