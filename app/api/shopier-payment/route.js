// app/api/shopier-payment/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import supabase from '../../_services/supabaseClient.js';

async function sendFreeEnrollmentEmail(courseData, userInfo, orderId, locale, courseType = 'online') {
  try {
    // Dynamic import for email service
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
    return { success: false, error: error.message };
  }
}

// Sipariş kaydetme fonksiyonu
async function saveOrderToDatabase(orderData) {
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
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  try {
    console.log('=== SHOPIER PAYMENT ÇAĞRILDI ===');
    console.log('Timestamp:', new Date().toISOString());
    const body = await request.json();

    // DEBUG: Gelen veriyi logla
    console.log('=== SHOPIER API DEBUG ===');
    console.log('Received body:', body);
    console.log('body.clerkUserId:', body.clerkUserId);
    console.log('body.userId:', body.userId);
    console.log('body.email:', body.email);
    console.log('========================');

    // API bilgileri - Environment variables'dan al
    const apiKey = process.env.NEXT_PUBLIC_SHOPIER_API_KEY;
    const apiSecret = process.env.SHOPIER_API_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://myunilab.net";

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ 
        success: false, 
        message: "Shopier API bilgileri eksik" 
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
      console.error('=== USER ID ERROR ===');
      console.error('Invalid or missing Clerk user ID:', clerkUserId);
      console.error('Expected format: user_xxxxxxxxxx');
      console.error('Falling back to email:', body.email);
      console.error('=====================');
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
    
    // Tutar kontrolü - minimum 0.01
    let amount = parseFloat(body.amount || courseData.price);
    amount = amount <= 0 ? 0.01 : amount;
    
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
    console.log('Is valid Clerk ID?', userIdForEnrollment.startsWith('user_'));
    console.log('===================================');

    // İstek bilgileri (IP, User Agent vs.)
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
    
    // %100 indirim durumunda doğrudan kayıt ve yönlendirme
    if (parseFloat(body.amount) <= 0) {
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
          console.log('================================');
          
          // Kursa kayıt yap
          const enrollmentData = {
            user_id: userIdForEnrollment,
            course_id: body.courseId,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
            is_active: true
          };

          console.log('Enrollment data to insert:', enrollmentData);

          const { data: newEnrollment, error: enrollError } = await supabase
            .from('myuni_enrollments')
            .insert(enrollmentData)
            .select()
            .single();

          if (enrollError) {
            console.error('Enrollment error:', enrollError);
            console.error('Enrollment error details:', enrollError.details);
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

          // USAGE COUNT ARTIRMA - %100 indirim durumu için
          try {
            const { incrementUsageCountAfterPayment } = await import('../../../lib/referralService');
            const usageResult = await incrementUsageCountAfterPayment(userIdForEnrollment);
            
            if (usageResult.success) {
              console.log('Usage count başarıyla artırıldı (free)');
            } else {
              console.error('Usage count artırılamadı (free):', usageResult.error);
            }
          } catch (usageError) {
            console.error('Usage count işlemi başarısız (free):', usageError);
            // Usage count hatası ödeme sürecini durdurmasın
          }

          // REFERRAL ÖDÜL KODU OLUŞTURMA - %100 indirim durumu için
          console.log('=== PAYMENT: REFERRAL ÖDÜL KODU OLUŞTURMA BAŞLADI ===');
          console.log('Payment User ID:', userIdForEnrollment);
          try {
            const { createRewardCodeAfterPayment } = await import('../../../lib/referralService');
            const rewardResult = await createRewardCodeAfterPayment(userIdForEnrollment);
            
            if (rewardResult.success && rewardResult.code) {
              console.log('Referral ödül kodu oluşturuldu (free):', rewardResult.code);
            } else if (rewardResult.success) {
              console.log('Referral kodu kullanılmamış, ödül kodu oluşturulmadı (free)');
            } else {
              console.error('Referral ödül kodu oluşturulamadı (free):', rewardResult.error);
            }
          } catch (referralError) {
            console.error('Referral ödül kodu işlemi başarısız (free):', referralError);
            // Referral hatası ödeme sürecini durdurmasın
          }
        
        // EMAIL GÖNDERME - Ücretsiz kayıt için
        const userInfo = {
          name: body.name,
          email: buyerEmail
        };

        // Kurs tipini belirle (course_type alanından)
        const courseType = courseData.course_type || 'online'; // varsayılan: online

        try {
          await sendFreeEnrollmentEmail(courseData, userInfo, orderId, body.locale || 'tr', courseType);
        } catch (emailError) {
          console.error('Free enrollment email failed but continuing:', emailError);
          // Email hatası işlemi durdurmasın
        }
        
        // Başarılı kayıt ve yönlendirme
        const successUrl = `${baseUrl}/${body.locale || 'tr'}/payment-success?courseId=${encodeURIComponent(body.courseId)}&name=${encodeURIComponent(courseName)}&free=true&orderId=${orderId}`;
        
        console.log('Redirecting to success URL:', successUrl);
        
        return NextResponse.json({
          success: true,
          redirectToDirect: true,
          redirectUrl: successUrl,
          orderId: orderId,
          enrollmentSuccess: true,
          userIdUsed: userIdForEnrollment,
          emailSent: true
        }, { status: 200 });
        
      } catch (enrollError) {
        console.error("Ücretsiz kurs kayıt hatası:", enrollError);
        return NextResponse.json({
          success: false,
          message: "Kursa kaydedilirken bir hata oluştu: " + (enrollError.message || "Bilinmeyen hata")
        }, { status: 500 });
      }
    }

    // Normal ödeme için Shopier form verileri
    const randomNumber = Math.floor(Math.random() * 999999);
    const currency = 0; // TL için 0
    const productType = 1; // Dijital ürün için 1
    const currentLanguage = body.locale === 'en' ? 1 : 0; // 0: Türkçe, 1: İngilizce
    
    const shopierFormData = {
      API_key: apiKey,
      website_index: 1,
      platform_order_id: orderId,
      product_name: courseName,
      product_type: productType,
      buyer_name: buyerName,
      buyer_surname: buyerSurname,
      buyer_email: buyerEmail,
      buyer_phone: buyerPhone,
      buyer_account_age: 0,
      buyer_id_nr: 0,
      billing_address: body.address || "Dijital Ürün",
      billing_city: body.city || "İstanbul",
      billing_country: "TR",
      billing_postcode: body.zipCode || "34000",
      shipping_address: body.address || "Dijital Ürün",
      shipping_city: body.city || "İstanbul",
      shipping_country: "TR", 
      shipping_postcode: body.zipCode || "34000",
      total_order_value: amount.toFixed(2),
      currency: currency,
      platform: 0,
      is_in_frame: 0,
      current_language: currentLanguage,
      modul_version: "1.0.0",
      random_nr: randomNumber,
      custom_params: JSON.stringify({
        courseId: body.courseId,
        userEmail: buyerEmail,
        clerkUserId: clerkUserId,
        userId: userIdForEnrollment,
        courseName: courseName,
        orderId: orderId,
        discountCodes: body.discountCodes || '',
        totalDiscount: body.totalDiscount || 0,
        locale: body.locale || 'tr'
      })
    };
    
    // İmza oluştur
    const signatureData = `${randomNumber}${orderId}${amount.toFixed(2)}${currency}`;
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureData)
      .digest('base64');
    
    shopierFormData.signature = signature;
    
    // Callback ve return URL'leri
    shopierFormData.return_url = `${baseUrl}/api/shopier-return`;
    shopierFormData.callback_url = `${baseUrl}/api/shopier-callback`;
    
    console.log('Shopier Form Data prepared for order:', orderId);
    console.log('Custom params included:', shopierFormData.custom_params);

    // Başarılı yanıt (normal ödeme için)
    return NextResponse.json({
      success: true,
      formAction: "https://www.shopier.com/ShowProduct/api_pay4.php",
      formData: shopierFormData,
      orderId: orderId,
      userIdUsed: userIdForEnrollment
    }, { status: 200 });

  } catch (error) {
    console.error("Shopier ödeme hazırlama hatası:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Ödeme hazırlanırken bir hata oluştu: " + (error.message || "Bilinmeyen hata") 
    }, { status: 500 });
  }
}