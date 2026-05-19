import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import Iyzipay from 'iyzipay';

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
  itemType?: 'course' | 'product'; // Koleksiyon ürünü için 'product'
}

// Iyzipay config will be initialized inside the POST function to catch any errors

// Ücretsiz kayıt email gönderme
async function sendFreeEnrollmentEmail(
  courseData: any, 
  userInfo: { name: string; email: string }, 
  orderId: string, 
  locale: string, 
  courseType: string = 'online'
) {
  try {
    const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
    const userInfoForEmail = { name: userInfo.name, email: userInfo.email };
    const courseInfo = { title: courseData.title, description: courseData.description || '', slug: courseData.slug };
    const orderInfo = { orderId: orderId, amount: '0.00', isFree: true };

    const emailResult = await sendPurchaseConfirmationEmail(userInfoForEmail, courseInfo, orderInfo, locale, courseType);
    if (emailResult.success) {
      return { success: true, messageId: emailResult.messageId };
    } else {
      return { success: false, error: emailResult.error };
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Sipariş kaydetme fonksiyonu
async function saveOrderToDatabase(orderData: any) {
  try {
    const { data: savedOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        orderid: orderData.orderId,
        courseid: orderData.courseId,
        useremail: orderData.userEmail,
        coursename: orderData.courseName,
        amount: orderData.amount,
        status: 'pending',
        paymentmethod: 'iyzico',
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
          userNotes: orderData.userNotes,
          itemType: orderData.itemType || 'course', // 'course' veya 'product'
        },
        discountcode: orderData.discountCodes,
        discountamount: orderData.totalDiscount || 0,
        ip_address: orderData.ipAddress,
        user_agent: orderData.userAgent
      })
      .select()
      .single();

    if (orderError) return { success: false, error: orderError.message };
    return { success: true, order: savedOrder };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function POST(request: Request) {
  try {
    const body: PaymentRequestBody = await request.json();

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
      return NextResponse.json({ success: false, message: "Ödeme altyapısı başlatılamadı: " + e.message }, { status: 500 });
    }

    // Doğrulamalar
    if (!body.courseId || !body.email || !body.name) {
      return NextResponse.json({ success: false, message: "Gerekli parametreler eksik (courseId, email, name)" }, { status: 400 });
    }

    const clerkUserId = body.clerkUserId || body.userId;
    const isProduct = body.itemType === 'product';

    // Kurs veya ürün bilgilerini al
    let itemData: { title: string; price: number; course_type?: string } | null = null;

    if (isProduct) {
      const { data: productData, error: productError } = await supabase
        .from('myuni_products')
        .select('id, title, price, description, slug')
        .eq('id', body.courseId)
        .eq('is_active', true)
        .single();
      if (productError || !productData) {
        return NextResponse.json({ success: false, message: "Ürün bulunamadı veya aktif değil" }, { status: 404 });
      }
      itemData = productData;
    } else {
      const { data: courseData, error: courseError } = await supabase
        .from('myuni_courses')
        .select('*')
        .eq('id', body.courseId)
        .eq('is_active', true)
        .single();
      if (courseError || !courseData) {
        return NextResponse.json({ success: false, message: "Kurs bulunamadı veya aktif değil" }, { status: 404 });
      }
      itemData = courseData;
    }

    const orderId = `MYU-IYZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const amount = parseFloat(String(body.amount || itemData.price));
    
    const buyerName = body.name.split(' ')[0] || body.name;
    const buyerSurname = body.name.split(' ').slice(1).join(' ') || buyerName;
    const buyerEmail = body.email;
    const buyerPhone = body.phone || "+905555555555";
    const courseName = itemData.title;
    
    const userIdForEnrollment = clerkUserId && !clerkUserId.includes('@') ? clerkUserId : buyerEmail;

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     '85.34.78.112'; // Default valid IP if local/unknown
                     
    // Iyzico doesn't accept invalid IP like ::1
    const validIpAddress = (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') ? '85.34.78.112' : ipAddress;

    const userAgent = request.headers.get('user-agent') || 'unknown';

    const orderData = {
      orderId, courseId: body.courseId, userEmail: buyerEmail, courseName, amount,
      clerkUserId, userId: userIdForEnrollment, locale: body.locale || 'tr',
      discountCodes: body.discountCodes || '', totalDiscount: body.totalDiscount || 0,
      userPhone: buyerPhone, userName: body.name, userAddress: body.address || 'Belirtilmedi',
      userCity: body.city || 'Belirtilmedi', userNotes: body.notes || '',
      ipAddress: validIpAddress, userAgent,
      itemType: body.itemType || 'course',
    };

    const saveResult = await saveOrderToDatabase(orderData);
    if (!saveResult.success) {
      return NextResponse.json({ success: false, message: "Sipariş kaydedilirken hata: " + saveResult.error }, { status: 500 });
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Ücretsiz Kayıt Mantığı
    if (amount <= 0) {
      try {
        await supabase.from('orders').update({ status: 'completed', paymentmethod: 'free_discount', updated_at: new Date().toISOString() }).eq('orderid', orderId);
        const { data: existingEnrollment } = await supabase.from('myuni_enrollments').select('id').eq('user_id', userIdForEnrollment).eq('course_id', body.courseId).eq('is_active', true).single();

        let enrollmentId = existingEnrollment?.id;
        if (!existingEnrollment) {
          const { data: newEnrollment, error: enrollError } = await supabase.from('myuni_enrollments').insert({
            user_id: userIdForEnrollment, course_id: body.courseId, enrolled_at: new Date().toISOString(), progress_percentage: 0, is_active: true
          }).select().single();
          if (enrollError) throw enrollError;
          enrollmentId = newEnrollment.id;
        }

        await supabase.from('orders').update({ enrolled: true, enrollmentid: enrollmentId, updated_at: new Date().toISOString() }).eq('orderid', orderId);

        try {
          const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
          await incrementUsageCountAfterPayment(userIdForEnrollment);
          await createRewardCodeAfterPayment(userIdForEnrollment);
        } catch (e) {}
        
        await sendFreeEnrollmentEmail(courseData, { name: body.name, email: buyerEmail }, orderId, body.locale || 'tr', courseData.course_type || 'online');
        
        return NextResponse.json({
          success: true,
          redirectToDirect: true,
          redirectUrl: `${baseUrl}/${body.locale || 'tr'}/payment-success?courseId=${encodeURIComponent(body.courseId)}&name=${encodeURIComponent(courseName)}&free=true&orderId=${orderId}`,
          orderId, userIdUsed: userIdForEnrollment
        }, { status: 200 });
      } catch (e) {
        return NextResponse.json({ success: false, message: "Ücretsiz kayıt hatası." }, { status: 500 });
      }
    }

    // Iyzico Request Payload
    // URL sonuna rastgele sayı ekleyerek tarayıcının eski Clerk yönlendirmesini hatırlamasını (önbellek) engelliyoruz
    const callbackUrl = `${baseUrl}/api/iyzico-callback?t=${Date.now()}`;
    const iyzicoRequest = {
        locale: body.locale === 'en' ? Iyzipay.LOCALE.EN : Iyzipay.LOCALE.TR,
        conversationId: orderId,
        price: (amount + (body.totalDiscount || 0)).toFixed(2),
        paidPrice: amount.toFixed(2),
        currency: Iyzipay.CURRENCY.TRY,
        basketId: orderId,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: callbackUrl,
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
            id: userIdForEnrollment,
            name: buyerName,
            surname: buyerSurname,
            gsmNumber: buyerPhone,
            email: buyerEmail,
            identityNumber: "11111111111", 
            lastLoginDate: "2023-01-01 12:00:00",
            registrationDate: "2023-01-01 12:00:00",
            registrationAddress: body.address || "Belirtilmedi",
            ip: validIpAddress,
            city: body.city || "Istanbul",
            country: "Turkey",
            zipCode: body.zipCode || "34000"
        },
        shippingAddress: {
            contactName: `${buyerName} ${buyerSurname}`.trim(),
            city: body.city || "Istanbul",
            country: "Turkey",
            address: body.address || "Belirtilmedi",
            zipCode: body.zipCode || "34000"
        },
        billingAddress: {
            contactName: `${buyerName} ${buyerSurname}`.trim(),
            city: body.city || "Istanbul",
            country: "Turkey",
            address: body.address || "Belirtilmedi",
            zipCode: body.zipCode || "34000"
        },
        basketItems: [
            {
                id: body.courseId,
                name: courseName,
                category1: "Eğitim",
                itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                price: (amount + (body.totalDiscount || 0)).toFixed(2)
            }
        ]
    };

    return new Promise((resolve) => {
        iyzipay.checkoutFormInitialize.create(iyzicoRequest, function (err: any, result: any) {
            if (err) {
                console.error("Iyzico Error:", err);
                resolve(NextResponse.json({ success: false, message: "Iyzico hatası: " + err.message }, { status: 500 }));
            } else if (result.status === 'success') {
                resolve(NextResponse.json({
                    success: true,
                    redirectUrl: result.paymentPageUrl, // Redirect the user here
                    orderId: orderId,
                    userIdUsed: userIdForEnrollment
                }, { status: 200 }));
            } else {
                console.error("Iyzico Fail:", result);
                resolve(NextResponse.json({ success: false, message: "Iyzico ödeme başlatılamadı: " + result.errorMessage }, { status: 500 }));
            }
        });
    });

  } catch (error) {
    console.error("Iyzico ödeme hazırlama hatası:", error);
    return NextResponse.json({ success: false, message: "Ödeme hazırlanırken bir hata oluştu." }, { status: 500 });
  }
}
