import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';
import Iyzipay from 'iyzipay';

interface CartItemInput {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  type: 'course' | 'product' | 'package' | 'tier';
  slug: string;
  courseId?: string;
  tierId?: string;
}

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
  tierId?: string;
  itemType?: 'course' | 'product' | 'package' | 'tier' | 'cart' | 'event_certificate';
  eventSlug?: string;
  // Cart Mode fields
  cartMode?: boolean;
  cartItems?: CartItemInput[];
}

function getTierActivePrice(tier: {
  price: number;
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}): number {
  if (tier.early_bird_price != null && tier.early_bird_deadline) {
    const now = new Date();
    const deadline = new Date(tier.early_bird_deadline);
    if (now < deadline) return Number(tier.early_bird_price);
  }
  return Number(tier.price) || 0;
}

// Ücretsiz kayıt e-postası gönderme
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
    return { success: emailResult.success };
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
        paymentmethod: orderData.paymentMethod || 'iyzico',
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
          itemType: orderData.itemType || 'course',
          siteApplicationId: orderData.siteApplicationId || null,
          eventSlug: orderData.eventSlug || null,
          tierId: orderData.tierId || null,
          cartMode: orderData.cartMode || false,
          cartItems: orderData.cartItems || [],
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
    if (!body.email || !body.name) {
      return NextResponse.json({ success: false, message: "Gerekli parametreler eksik (email, name)" }, { status: 400 });
    }

    const clerkUserId = body.clerkUserId || body.userId;
    const isCartMode = body.cartMode === true;
    const buyerEmail = body.email;
    const buyerPhone = body.phone || "+905555555555";
    const buyerName = body.name.split(' ')[0] || body.name;
    const buyerSurname = body.name.split(' ').slice(1).join(' ') || buyerName;
    const userIdForEnrollment = clerkUserId && !clerkUserId.includes('@') ? clerkUserId : buyerEmail;

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     request.headers.get('x-real-ip') || 
                     request.headers.get('cf-connecting-ip') || 
                     '85.34.78.112';
                     
    const validIpAddress = (ipAddress === 'unknown' || ipAddress === '::1' || ipAddress === '127.0.0.1') ? '85.34.78.112' : ipAddress;
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let validatedItems: any[] = [];
    let originalTotalAmount = 0;
    let totalDiscount = body.totalDiscount || 0;
    let finalAmount = 0;
    let orderName = '';
    
    // ---- 1. SEPET MODU MANTIĞI ----
    if (isCartMode) {
      if (!body.cartItems || body.cartItems.length === 0) {
        return NextResponse.json({ success: false, message: "Sepet boş olamaz" }, { status: 400 });
      }

      // Sepetteki tüm ürünleri veritabanından doğrula
      for (const item of body.cartItems) {
        if (item.type === 'product') {
          const { data: pData } = await supabase
            .from('myuni_products')
            .select('id, title, price, description, slug')
            .eq('id', item.id)
            .eq('is_active', true)
            .single();

          if (pData) {
            validatedItems.push({
              id: pData.id,
              title: pData.title,
              price: pData.price,
              type: 'product',
              slug: pData.slug
            });
            originalTotalAmount += pData.price;
          }
        } else if (item.type === 'package') {
          const { data: pData } = await supabase
            .from('myuni_packages')
            .select('id, title, price, description, slug')
            .eq('id', item.id)
            .eq('is_active', true)
            .single();

          if (pData) {
            validatedItems.push({
              id: pData.id,
              title: pData.title,
              price: pData.price,
              type: 'package',
              slug: pData.slug
            });
            originalTotalAmount += pData.price;
          }
        } else if (item.type === 'tier') {
          const { data: tierData } = await supabase
            .from('myuni_course_tiers')
            .select('id, title, price, early_bird_price, early_bird_deadline, course_id, myuni_courses(slug, title)')
            .eq('id', item.id)
            .eq('is_active', true)
            .single();

          if (tierData) {
            const activePrice = getTierActivePrice(tierData);
            const courseInfo = tierData.myuni_courses as { slug?: string; title?: string } | null;
            validatedItems.push({
              id: tierData.id,
              title: item.title || `${courseInfo?.title || 'Kurs'} — ${tierData.title}`,
              price: activePrice,
              type: 'tier',
              slug: courseInfo?.slug || item.slug,
              courseId: tierData.course_id,
              tierId: tierData.id,
            });
            originalTotalAmount += activePrice;
          }
        } else {
          // course
          const { data: cData } = await supabase
            .from('myuni_courses')
            .select('id, title, price, description, slug, early_bird_price, early_bird_deadline, course_type')
            .eq('id', item.id)
            .eq('is_active', true)
            .single();

          if (cData) {
            // Erken kayıt fiyatı geçerli mi kontrol et
            let activePrice = cData.price;
            if (cData.early_bird_price && cData.early_bird_deadline) {
              const now = new Date();
              const deadline = new Date(cData.early_bird_deadline);
              if (now < deadline) {
                activePrice = cData.early_bird_price;
              }
            }

            validatedItems.push({
              id: cData.id,
              title: cData.title,
              price: activePrice,
              type: 'course',
              slug: cData.slug,
              course_type: cData.course_type
            });
            originalTotalAmount += activePrice;
          }
        }
      }

      if (validatedItems.length === 0) {
        return NextResponse.json({ success: false, message: "Sepetteki ürünler geçerli değil veya aktif değil" }, { status: 400 });
      }

      finalAmount = Math.max(0, originalTotalAmount - totalDiscount);
      orderName = `Sepet Siparişi (${validatedItems.length} Ürün)`;
    } 
    // ---- 2. TEKİL ÜRÜN MODU MANTIĞI ----
    else {
      if (!body.courseId) {
        return NextResponse.json({ success: false, message: "Kurs ID belirtilmelidir" }, { status: 400 });
      }

      const isProduct = body.itemType === 'product';
      const isPackage = body.itemType === 'package';
      const isTier = body.itemType === 'tier';
      const isEventCertificate = body.itemType === 'event_certificate';

      if (isEventCertificate) {
        const applicationId = body.courseId;
        if (!applicationId) {
          return NextResponse.json({ success: false, message: 'Application ID required' }, { status: 400 });
        }

        const siteAppsSupabase = getSiteApplicationsSupabase();
        const { data: application, error: appError } = await siteAppsSupabase
          .from(siteApplicationsDb.applications)
          .select('id, email, first_name, last_name, event_name, event_id, submission_data, myuni_events ( slug, title, is_active )')
          .eq('id', applicationId)
          .maybeSingle();

        if (appError || !application) {
          return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
        }

        const submission = (application.submission_data || {}) as Record<string, unknown>;
        if (submission.registration_tier !== 'certificate') {
          return NextResponse.json({ success: false, message: 'Invalid application tier' }, { status: 400 });
        }
        if (submission.payment_status === 'paid') {
          return NextResponse.json({ success: false, message: 'Application already paid' }, { status: 409 });
        }
        if (submission.payment_status === 'superseded') {
          return NextResponse.json(
            {
              success: false,
              message:
                'This application was superseded by another paid registration for the same email/event',
            },
            { status: 409 }
          );
        }

        // Aynı e-posta + etkinlikte başka ödenmiş sertifika varsa yeni ödeme başlatma
        if (application.email && application.event_id) {
          const { data: siblingApps } = await siteAppsSupabase
            .from(siteApplicationsDb.applications)
            .select('id, submission_data')
            .eq('event_id', application.event_id)
            .ilike('email', String(application.email).trim())
            .neq('id', applicationId)
            .limit(20);

          const siblingPaid = (siblingApps || []).find((row) => {
            const s = (row.submission_data || {}) as Record<string, unknown>;
            return (
              s.registration_tier === 'certificate' && s.payment_status === 'paid'
            );
          });
          if (siblingPaid) {
            return NextResponse.json(
              {
                success: false,
                message: 'Certificate already paid for this email and event',
                paidApplicationId: siblingPaid.id,
              },
              { status: 409 }
            );
          }
        }

        // Açık pending siparişleri kapat — her checkout'ta yeni pending birikmesin
        await supabase
          .from('orders')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('courseid', applicationId)
          .eq('status', 'pending');

        const packagePrice = Number(submission.package_price) || 0;
        if (packagePrice <= 0) {
          return NextResponse.json({ success: false, message: 'Invalid certificate price' }, { status: 400 });
        }

        const eventInfoRaw = application.myuni_events as
          | { slug: string; title: string; is_active: boolean }
          | { slug: string; title: string; is_active: boolean }[]
          | null;
        const eventInfo = Array.isArray(eventInfoRaw) ? eventInfoRaw[0] : eventInfoRaw;
        const eventTitle = eventInfo?.title || application.event_name || 'Etkinlik';

        if (body.eventSlug && eventInfo?.slug && body.eventSlug !== eventInfo.slug) {
          return NextResponse.json({ success: false, message: 'Event mismatch' }, { status: 400 });
        }

        validatedItems.push({
          id: applicationId,
          title: `Sertifika - ${eventTitle}`,
          price: packagePrice,
          type: 'event_certificate',
          slug: eventInfo?.slug || body.eventSlug || '',
          eventId: application.event_id,
        });
        originalTotalAmount = packagePrice;
      } else if (isProduct) {
        const { data: productData } = await supabase
          .from('myuni_products')
          .select('id, title, price, description, slug')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .single();

        if (!productData) {
          return NextResponse.json({ success: false, message: "Ürün bulunamadı veya aktif değil" }, { status: 404 });
        }
        validatedItems.push({
          id: productData.id,
          title: productData.title,
          price: productData.price,
          type: 'product',
          slug: productData.slug
        });
        originalTotalAmount = productData.price;
      } else if (isPackage) {
        const { data: packageData } = await supabase
          .from('myuni_packages')
          .select('id, title, price, description, slug')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .single();

        if (!packageData) {
          return NextResponse.json({ success: false, message: "Paket bulunamadı veya aktif değil" }, { status: 404 });
        }
        validatedItems.push({
          id: packageData.id,
          title: packageData.title,
          price: packageData.price,
          type: 'package',
          slug: packageData.slug
        });
        originalTotalAmount = packageData.price;
      } else if (isTier) {
        if (!body.tierId) {
          return NextResponse.json({ success: false, message: 'Paket ID belirtilmelidir' }, { status: 400 });
        }

        const { data: tierData } = await supabase
          .from('myuni_course_tiers')
          .select('*, myuni_courses(id, title, slug, course_type, description, is_active)')
          .eq('id', body.tierId)
          .eq('course_id', body.courseId)
          .eq('is_active', true)
          .single();

        if (!tierData) {
          return NextResponse.json({ success: false, message: 'Paket bulunamadı veya aktif değil' }, { status: 404 });
        }

        const courseInfoRaw = tierData.myuni_courses;
        const courseInfo = Array.isArray(courseInfoRaw) ? courseInfoRaw[0] : courseInfoRaw;
        if (!courseInfo) {
          return NextResponse.json({ success: false, message: 'Paketin bağlı kursu bulunamadı' }, { status: 404 });
        }

        const activePrice = getTierActivePrice(tierData);

        validatedItems.push({
          id: tierData.id,
          title: `${courseInfo.title} — ${tierData.title}`,
          price: activePrice,
          type: 'tier',
          slug: courseInfo.slug,
          courseId: body.courseId,
          tierId: tierData.id,
          course_type: courseInfo.course_type,
          fullData: courseInfo,
        });
        originalTotalAmount = activePrice;
      } else {
        const { data: courseData } = await supabase
          .from('myuni_courses')
          .select('*')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .single();

        if (!courseData) {
          return NextResponse.json({ success: false, message: "Kurs bulunamadı veya aktif değil" }, { status: 404 });
        }

        let activePrice = courseData.price;
        if (courseData.early_bird_price && courseData.early_bird_deadline) {
          const now = new Date();
          const deadline = new Date(courseData.early_bird_deadline);
          if (now < deadline) {
            activePrice = courseData.early_bird_price;
          }
        }

        validatedItems.push({
          id: courseData.id,
          title: courseData.title,
          price: activePrice,
          type: 'course',
          slug: courseData.slug,
          course_type: courseData.course_type,
          fullData: courseData
        });
        originalTotalAmount = activePrice;
      }

      finalAmount = Math.max(0, originalTotalAmount - totalDiscount);
      orderName = validatedItems[0].title;
    }

    const orderId = `MYU-IYZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isTierPurchase = !isCartMode && body.itemType === 'tier';

    // Sipariş bilgilerini kaydet
    const isEventCertificateOrder = !isCartMode && body.itemType === 'event_certificate';

    const orderData = {
      orderId,
      courseId: isCartMode ? 'CART' : (isTierPurchase ? body.courseId : validatedItems[0].id),
      tierId: isTierPurchase ? body.tierId : (validatedItems[0]?.type === 'tier' ? validatedItems[0].tierId : undefined),
      userEmail: buyerEmail,
      courseName: isEventCertificateOrder
        ? validatedItems[0].title
        : orderName,
      amount: finalAmount,
      clerkUserId,
      userId: userIdForEnrollment,
      locale: body.locale || 'tr',
      discountCodes: body.discountCodes || '',
      totalDiscount: totalDiscount,
      userPhone: buyerPhone,
      userName: body.name,
      userAddress: body.address || 'Belirtilmedi',
      userCity: body.city || 'Belirtilmedi',
      userNotes: body.notes || '',
      ipAddress: validIpAddress,
      userAgent,
      itemType: isCartMode ? 'cart' : (body.itemType || 'course'),
      siteApplicationId: isEventCertificateOrder ? body.courseId : undefined,
      eventSlug: isEventCertificateOrder ? (body.eventSlug || validatedItems[0]?.slug) : undefined,
      cartMode: isCartMode,
      cartItems: validatedItems,
    };

    const saveResult = await saveOrderToDatabase(orderData);
    if (!saveResult.success) {
      return NextResponse.json({ success: false, message: "Sipariş kaydedilirken hata: " + saveResult.error }, { status: 500 });
    }

    // ---- 3. ÜCRETSİZ SİPARİŞ MANTIĞI (%100 İndirim Kodu / Bakiye) ----
    if (finalAmount <= 0) {
      try {
        // Siparişi tamamlandı olarak güncelle
        await supabase.from('orders').update({ 
          status: 'completed', 
          paymentmethod: 'free_discount', 
          updated_at: new Date().toISOString() 
        }).eq('orderid', orderId);

        let enrolledItemsDetails: string[] = [];

        // Her bir ürünü tek tek teslim et (enroll / purchase)
        for (const item of validatedItems) {
          if (item.type === 'product') {
            const { data: existingPurchase } = await supabase
              .from('myuni_products_purchases')
              .select('id')
              .eq('user_id', userIdForEnrollment)
              .eq('product_id', item.id)
              .single();

            if (!existingPurchase) {
              await supabase.from('myuni_products_purchases').insert({
                user_id: userIdForEnrollment,
                product_id: item.id,
                purchased_at: new Date().toISOString(),
                price_paid: 0
              });
            }
          } else if (item.type === 'package') {
            const { checkUserPackageEnrollment, enrollUserInPackage } = await import('../../../lib/enrollmentService');
            const alreadyEnrolled = await checkUserPackageEnrollment(userIdForEnrollment, item.id);
            if (!alreadyEnrolled) {
              await enrollUserInPackage(userIdForEnrollment, item.id, orderId);
            }
          } else if (item.type === 'tier') {
            const { enrollUserInTier } = await import('../../../lib/enrollmentService');
            if (item.courseId && item.tierId) {
              await enrollUserInTier(userIdForEnrollment, item.courseId, item.tierId);
            }
          } else {
            // course
            const { data: existingEnrollment } = await supabase
              .from('myuni_enrollments')
              .select('id, is_active')
              .eq('user_id', userIdForEnrollment)
              .eq('course_id', item.id)
              .single();

            if (!existingEnrollment) {
              await supabase.from('myuni_enrollments').insert({
                user_id: userIdForEnrollment,
                course_id: item.id,
                enrolled_at: new Date().toISOString(),
                progress_percentage: 0,
                is_active: true
              });
            } else if (!existingEnrollment.is_active) {
              await supabase.from('myuni_enrollments').update({
                is_active: true,
                enrolled_at: new Date().toISOString()
              }).eq('id', existingEnrollment.id);
            }
          }
          enrolledItemsDetails.push(item.title);
        }

        // Siparişi enrolled olarak güncelle
        await supabase.from('orders').update({ 
          enrolled: true, 
          updated_at: new Date().toISOString() 
        }).eq('orderid', orderId);

        // Affiliate / Referral Ödül ve Limitleri Tetikle
        try {
          const { incrementUsageCountAfterPayment, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
          await incrementUsageCountAfterPayment(userIdForEnrollment);
          await createRewardCodeAfterPayment(userIdForEnrollment);
        } catch (e) {}
        
        // E-posta gönderimi (İlk sıradaki kurs veya sepet özeti için)
        try {
          if (!isCartMode && validatedItems[0].type === 'course' && validatedItems[0].fullData) {
            await sendFreeEnrollmentEmail(
              validatedItems[0].fullData, 
              { name: body.name, email: buyerEmail }, 
              orderId, 
              body.locale || 'tr', 
              validatedItems[0].course_type || 'online'
            );
          }
        } catch (e) {}

        const successRedirectUrl = `${baseUrl}/${body.locale || 'tr'}/payment-success?free=true&orderId=${orderId}&names=${encodeURIComponent(enrolledItemsDetails.join(', '))}`;
        
        return NextResponse.json({
          success: true,
          redirectToDirect: true,
          redirectUrl: successRedirectUrl,
          orderId,
          userIdUsed: userIdForEnrollment
        }, { status: 200 });
      } catch (e) {
        console.error("Free enrollment delivery error:", e);
        return NextResponse.json({ success: false, message: "Ücretsiz kayıt/teslimat işlemi sırasında hata oluştu." }, { status: 500 });
      }
    }

    // ---- 4. IYZICO ÖDEME FORMU MANTIĞI ----
    const callbackUrl = `${baseUrl}/api/iyzico-callback?t=${Date.now()}`;
    
    // Iyzico sepet kalemlerini hazırla
    // basketItems içindeki fiyatların toplamı root düzeyindeki price alanına eşit olmak zorundadır.
    // paidPrice ise indirim uygulandıktan sonra çekilecek nihai fiyattır.
    const iyzicoBasketItems = validatedItems.map(item => ({
      id: item.id,
      name: item.title,
      category1: item.type === 'course' ? "Eğitim" : "Koleksiyon Ürünü",
      itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
      price: item.price.toFixed(2)
    }));

    const iyzicoRequest = {
      locale: body.locale === 'en' ? Iyzipay.LOCALE.EN : Iyzipay.LOCALE.TR,
      conversationId: orderId,
      price: originalTotalAmount.toFixed(2), // Orijinal indirimsiz toplam
      paidPrice: finalAmount.toFixed(2), // İndirimli nihai toplam
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
        lastLoginDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
        registrationDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
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
      basketItems: iyzicoBasketItems
    };

    return new Promise((resolve) => {
      iyzipay.checkoutFormInitialize.create(iyzicoRequest, function (err: any, result: any) {
        if (err) {
          console.error("Iyzico Error:", err);
          resolve(NextResponse.json({ success: false, message: "Iyzico hatası: " + err.message }, { status: 500 }));
        } else if (result.status === 'success') {
          resolve(NextResponse.json({
            success: true,
            redirectUrl: result.paymentPageUrl,
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
