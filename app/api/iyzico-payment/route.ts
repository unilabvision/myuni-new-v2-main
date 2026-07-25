import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';
import { resolveDiscountRestrictions, itemMatchesApplicableCourses } from '@/lib/discountRestrictions';
import {
  buildOrderSnapshot,
  resolveEmailCourseType,
} from '@/lib/orderSnapshot';
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
  // TCKN for Turkish buyers, passport number for foreign buyers. Iyzico
  // requires this field; sending the SAME placeholder for every real
  // transaction (as this used to do) is a textbook fraud-ring signal to
  // their risk engine and can get transactions declined or the merchant
  // account reviewed. Collect it from the buyer once the checkout form is
  // updated to ask for it — until then we fall back to the placeholder but
  // log every fallback so this can be prioritized.
  identityNumber?: string;
  clerkUserId?: string;
  userId?: string;
  tierId?: string;
  itemType?: 'course' | 'product' | 'package' | 'tier' | 'cart' | 'event_certificate';
  eventSlug?: string;
  // Cart Mode fields
  cartMode?: boolean;
  cartItems?: CartItemInput[];
}

// Extends a date-only (YYYY-MM-DD) deadline to the end of that day so
// "deadline day" behaves the way a buyer expects. Without this, `new
// Date('2026-08-01')` parses as UTC midnight — 03:00 Turkey time — so an
// early-bird price could silently expire up to 3 hours earlier than
// intended. This mirrors the expiry handling already used for discount
// codes (`computeServerDiscount` below) so the two don't disagree.
function endOfDeadlineDay(deadline: string): Date {
  const d = new Date(deadline);
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    d.setHours(23, 59, 59, 999);
  }
  return d;
}

function isEarlyBirdActive(deadline?: string | null): boolean {
  if (!deadline) return false;
  return new Date() < endOfDeadlineDay(deadline);
}

function getTierActivePrice(tier: {
  price: number;
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}): number {
  if (tier.early_bird_price != null && isEarlyBirdActive(tier.early_bird_deadline)) {
    return Number(tier.early_bird_price);
  }
  return Number(tier.price) || 0;
}

interface DiscountableItem {
  id: string;
  price: number;
  type: string;
  courseId?: string;
  isFullCourse?: boolean;
}

/**
 * Server-side, single source of truth for discount amounts.
 * NEVER trust a client-supplied discount/total figure — always recompute
 * from the `discount_codes` table against server-validated item prices.
 * Mirrors the eligibility rules enforced in /api/discount-codes/validate.
 */
async function computeServerDiscount(
  discountCodesCsv: string,
  items: DiscountableItem[]
): Promise<{ discount: number; appliedCode: string | null; codeId: string | null }> {
  const rawCode = String(discountCodesCsv || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)[0];

  if (!rawCode || items.length === 0) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  const { data: rows, error } = await supabase
    .from('discount_codes')
    .select(
      'id, code, discount_amount, discount_type, valid_until, applicable_courses, max_usage, usage_count, is_used, is_referral, has_balance_limit, remaining_balance, minimum_order_amount, maximum_order_amount, full_course_only'
    )
    .eq('is_referral', false)
    .ilike('code', rawCode)
    .limit(5);

  if (error || !rows) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  const codeRow = rows.find(
    (r) => String(r.code || '').toLowerCase() === rawCode.toLowerCase()
  );
  if (!codeRow) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  // Expiry
  const validUntilStr = codeRow.valid_until as string | null;
  if (validUntilStr) {
    const validUntilEnd = new Date(validUntilStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(validUntilStr)) {
      validUntilEnd.setHours(23, 59, 59, 999);
    }
    if (validUntilEnd < new Date()) {
      return { discount: 0, appliedCode: null, codeId: null };
    }
  }

  // Usage limits
  const maxUsage = Number(codeRow.max_usage ?? 0);
  const usageCount = Number(codeRow.usage_count ?? 0);
  if (maxUsage > 0 && usageCount >= maxUsage) {
    return { discount: 0, appliedCode: null, codeId: null };
  }
  if (maxUsage <= 1 && codeRow.is_used === true) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  const { fullCourseOnly, minimumOrderAmount, maximumOrderAmount } =
    resolveDiscountRestrictions(codeRow);
  const applicableCourses: string[] = (codeRow.applicable_courses as string[]) || [];

  let eligibleItems = items;
  if (applicableCourses.length > 0) {
    eligibleItems = eligibleItems.filter((it) =>
      itemMatchesApplicableCourses(it, applicableCourses)
    );
  }
  if (fullCourseOnly) {
    eligibleItems = eligibleItems.filter((it) => it.type === 'tier' && it.isFullCourse);
  }

  if (eligibleItems.length === 0) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  const eligibleTotal = eligibleItems.reduce((sum, it) => sum + (Number(it.price) || 0), 0);

  if (minimumOrderAmount > 0 && eligibleTotal < minimumOrderAmount) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  if (maximumOrderAmount > 0 && eligibleTotal > maximumOrderAmount) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  if (
    codeRow.has_balance_limit &&
    codeRow.remaining_balance !== null &&
    Number(codeRow.remaining_balance) <= 0
  ) {
    return { discount: 0, appliedCode: null, codeId: null };
  }

  let discountValue = 0;
  if (
    codeRow.has_balance_limit &&
    codeRow.remaining_balance !== null &&
    codeRow.remaining_balance !== undefined
  ) {
    discountValue = Math.min(Number(codeRow.remaining_balance), eligibleTotal);
  } else if (String(codeRow.discount_type).toLowerCase() === 'percentage') {
    discountValue = (eligibleTotal * Number(codeRow.discount_amount || 0)) / 100;
  } else {
    discountValue = Math.min(Number(codeRow.discount_amount || 0), eligibleTotal);
  }

  discountValue = Math.max(0, Math.round(discountValue * 100) / 100);

  return { discount: discountValue, appliedCode: codeRow.code, codeId: codeRow.id };
}

// Ücretsiz / ücretli ortak onay e-postası
async function sendOrderConfirmationEmail(params: {
  userName: string;
  email: string;
  orderId: string;
  locale: string;
  snapshot: ReturnType<typeof buildOrderSnapshot>;
  cartMode: boolean;
  isFree?: boolean;
  paidAmount?: number | string;
}) {
  try {
    const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
    const courseType = resolveEmailCourseType(params.snapshot, params.cartMode);
    const title =
      params.cartMode || params.snapshot.items.length > 1
        ? 'Sepet Alımı'
        : params.snapshot.items[0]?.title || 'Sipariş';

    await sendPurchaseConfirmationEmail(
      { name: params.userName, email: params.email },
      {
        title,
        items: params.snapshot.items,
      },
      {
        orderId: params.orderId,
        amount: params.isFree ? '0.00' : String(params.paidAmount ?? params.snapshot.paidTotal),
        isFree: !!params.isFree,
        listTotal: params.snapshot.listTotal,
        discountAmount: params.snapshot.discountAmount,
        discountCodes: params.snapshot.discountCodes,
        commissionAmount: params.snapshot.commissionAmount || 0,
      },
      params.locale,
      courseType
    );
    return { success: true };
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
          discountCodeId: orderData.discountCodeId || null,
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
          orderSnapshot: orderData.orderSnapshot || null,
          listTotal: orderData.listTotal ?? null,
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

    // Fail fast instead of silently constructing the Iyzico client with empty
    // credentials — that used to defer the failure to a confusing, opaque
    // error deep inside the gateway call. Also make it impossible to miss in
    // logs when IYZICO_BASE_URL isn't explicitly set, since it silently
    // defaults to the LIVE endpoint — a misconfigured staging deploy without
    // this variable would otherwise transact against production Iyzico.
    const iyzicoApiKey = process.env.IYZICO_API_KEY;
    const iyzicoSecretKey = process.env.IYZICO_SECRET_KEY;
    const iyzicoBaseUrl = process.env.IYZICO_BASE_URL || 'https://api.iyzipay.com';

    if (!iyzicoApiKey || !iyzicoSecretKey) {
      console.error('CRITICAL: IYZICO_API_KEY / IYZICO_SECRET_KEY is not configured. Refusing to initiate payment.');
      return NextResponse.json({ success: false, message: "Ödeme altyapısı yapılandırılmamış." }, { status: 500 });
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
      return NextResponse.json({ success: false, message: "Ödeme altyapısı başlatılamadı: " + e.message }, { status: 500 });
    }

    // Doğrulamalar
    if (!body.email || !body.name) {
      return NextResponse.json({ success: false, message: "Gerekli parametreler eksik (email, name)" }, { status: 400 });
    }

    const isCartMode = body.cartMode === true;
    // Event certificate purchases are a guest flow tied to a pre-existing site
    // application (identified by applicationId + email), not to a Clerk session.
    // Every other purchase path enrolls a userId, so it MUST be backed by an
    // authenticated Clerk session — never trust body.clerkUserId / body.userId,
    // otherwise a caller could enroll an arbitrary account for free/cheap items.
    const isEventCertificateItemType = !isCartMode && body.itemType === 'event_certificate';

    let clerkUserId: string | undefined;
    if (!isEventCertificateItemType) {
      const { userId: sessionUserId } = await auth();
      if (!sessionUserId) {
        return NextResponse.json(
          { success: false, message: 'Bu işlem için giriş yapmanız gerekiyor.' },
          { status: 401 }
        );
      }
      clerkUserId = sessionUserId;
    }

    const buyerEmail = body.email;
    const buyerPhone = body.phone || "+905555555555";
    const buyerName = body.name.split(' ')[0] || body.name;
    const buyerSurname = body.name.split(' ').slice(1).join(' ') || buyerName;
    const userIdForEnrollment = clerkUserId && !clerkUserId.includes('@') ? clerkUserId : buyerEmail;

    // Iyzico requires a plausible buyer IP for its fraud/risk scoring, so we
    // still need SOME fallback when the real client IP can't be determined
    // (e.g. local dev, or a proxy that strips these headers) — but sending
    // the exact same fixed IP for every such buyer is itself a fraud-ring
    // signal to that engine. Check the widest set of common proxy/CDN
    // headers first, and log loudly whenever we actually fall back so this
    // is visible/monitorable rather than silent in production.
    const FALLBACK_IP = '85.34.78.112';
    const rawIpAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('true-client-ip') ||
                     request.headers.get('fastly-client-ip') ||
                     request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
                     null;

    const isUnusableIp = !rawIpAddress || rawIpAddress === 'unknown' || rawIpAddress === '::1' || rawIpAddress === '127.0.0.1';
    if (isUnusableIp) {
      console.warn(`Iyzico payment: could not determine real client IP for ${buyerEmail}; falling back to placeholder IP ${FALLBACK_IP}. This should be rare in production — frequent occurrences risk tripping Iyzico's fraud engine (many distinct buyers sharing one IP).`);
    }
    const validIpAddress = isUnusableIp ? FALLBACK_IP : (rawIpAddress as string);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Use the buyer's real identity/passport number when supplied; never fall
    // back to a fixed shared placeholder for real transactions without at
    // least logging it, since Iyzico's fraud engine can flag many distinct
    // cardholders sharing one identity number as a fraud ring.
    const suppliedIdentityNumber = String(body.identityNumber || '').trim();
    // TCKN (11-digit Turkish national ID) or a foreign passport number
    // (alphanumeric). Keep this in sync with the checkout form's validation.
    const isValidIdentityNumber = /^\d{10,11}$/.test(suppliedIdentityNumber) || /^[A-Za-z0-9]{6,20}$/.test(suppliedIdentityNumber);
    if (!isValidIdentityNumber) {
      console.warn(
        `Iyzico payment: no valid buyer identityNumber supplied for ${buyerEmail}; falling back to placeholder TCKN. Checkout form should collect this field.`
      );
    }
    const buyerIdentityNumber = isValidIdentityNumber ? suppliedIdentityNumber : '11111111111';

    let validatedItems: any[] = [];
    let originalTotalAmount = 0;
    // NEVER trust body.totalDiscount — it is recomputed server-side below from
    // discount_codes against the server-validated item prices.
    let totalDiscount = 0;
    let appliedDiscountCode: string | null = null;
    let appliedDiscountCodeId: string | null = null;
    let finalAmount = 0;
    let orderName = '';
    
    // ---- 1. SEPET MODU MANTIĞI ----
    if (isCartMode) {
      if (!body.cartItems || body.cartItems.length === 0) {
        return NextResponse.json({ success: false, message: "Sepet boş olamaz" }, { status: 400 });
      }

      // Sepetteki tüm ürünleri veritabanından doğrula. Bulunamayan/pasif bir
      // kalem artık sessizce atlanmıyor — hangi kalemin sorunlu olduğunu
      // topluyoruz ve tüm sepeti reddediyoruz, aksi halde alıcı 3 ürün
      // seçtiğini sanırken sessizce 2'sinin ücretini öder ve hiçbir uyarı
      // görmez. `.maybeSingle()` kullanıyoruz ki 0 satır (bulunamadı) ile
      // gerçek bir DB hatası birbirinden ayırt edilip loglanabilsin —
      // `.single()` ikisini de aynı şekilde "hata" olarak döndürüp
      // sessizce yutulmasına yol açıyordu.
      const skippedItems: { id: string; type: string }[] = [];

      for (const item of body.cartItems) {
        if (item.type === 'product') {
          const { data: pData, error: pError } = await supabase
            .from('myuni_products')
            .select('id, title, price, description, slug')
            .eq('id', item.id)
            .eq('is_active', true)
            .maybeSingle();

          if (pError) {
            console.error('Cart product lookup error:', item.id, pError);
          }

          if (pData) {
            validatedItems.push({
              id: pData.id,
              title: pData.title,
              price: pData.price,
              type: 'product',
              slug: pData.slug
            });
            originalTotalAmount += pData.price;
          } else {
            skippedItems.push({ id: item.id, type: 'product' });
          }
        } else if (item.type === 'package') {
          const { data: pData, error: pError } = await supabase
            .from('myuni_packages')
            .select('id, title, price, description, slug')
            .eq('id', item.id)
            .eq('is_active', true)
            .maybeSingle();

          if (pError) {
            console.error('Cart package lookup error:', item.id, pError);
          }

          if (pData) {
            validatedItems.push({
              id: pData.id,
              title: pData.title,
              price: pData.price,
              type: 'package',
              slug: pData.slug
            });
            originalTotalAmount += pData.price;
          } else {
            skippedItems.push({ id: item.id, type: 'package' });
          }
        } else if (item.type === 'tier') {
          const { data: tierData, error: tierError } = await supabase
            .from('myuni_course_tiers')
            .select('id, title, price, early_bird_price, early_bird_deadline, course_id, is_full_course, myuni_courses(slug, title)')
            .eq('id', item.id)
            .eq('is_active', true)
            .maybeSingle();

          if (tierError) {
            console.error('Cart tier lookup error:', item.id, tierError);
          }

          if (tierData) {
            const activePrice = getTierActivePrice(tierData);
            const courseInfo = tierData.myuni_courses as { slug?: string; title?: string } | null;
            // NEVER take title/slug from the client-supplied cart item — unlike
            // every other branch here, this used to prefer `item.title`, which
            // let a caller inject an arbitrary string that would flow into the
            // Iyzico basket, the persisted order snapshot, and the (unescaped)
            // confirmation email. Always derive from the server-fetched row.
            validatedItems.push({
              id: tierData.id,
              title: `${courseInfo?.title || 'Kurs'} — ${tierData.title}`,
              price: activePrice,
              type: 'tier',
              slug: courseInfo?.slug || '',
              courseId: tierData.course_id,
              tierId: tierData.id,
              isFullCourse: !!(tierData as { is_full_course?: boolean }).is_full_course,
            });
            originalTotalAmount += activePrice;
          } else {
            skippedItems.push({ id: item.id, type: 'tier' });
          }
        } else {
          // course
          const { data: cData, error: cError } = await supabase
            .from('myuni_courses')
            .select('id, title, price, description, slug, early_bird_price, early_bird_deadline, course_type')
            .eq('id', item.id)
            .eq('is_active', true)
            .maybeSingle();

          if (cError) {
            console.error('Cart course lookup error:', item.id, cError);
          }

          if (cData) {
            // Erken kayıt fiyatı geçerli mi kontrol et
            let activePrice = cData.price;
            if (cData.early_bird_price && isEarlyBirdActive(cData.early_bird_deadline)) {
              activePrice = cData.early_bird_price;
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
          } else {
            skippedItems.push({ id: item.id, type: 'course' });
          }
        }
      }

      if (skippedItems.length > 0) {
        return NextResponse.json({
          success: false,
          message: "Sepetteki bazı ürünler artık geçerli değil veya aktif değil. Lütfen sepetinizi güncelleyip tekrar deneyin.",
          skippedItems,
        }, { status: 409 });
      }

      if (validatedItems.length === 0) {
        return NextResponse.json({ success: false, message: "Sepetteki ürünler geçerli değil veya aktif değil" }, { status: 400 });
      }

      const discountResult = await computeServerDiscount(body.discountCodes || '', validatedItems);
      totalDiscount = discountResult.discount;
      appliedDiscountCode = discountResult.appliedCode;
      appliedDiscountCodeId = discountResult.codeId;

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

        // This is an unauthenticated guest flow (no Clerk session), so the only
        // proof of ownership available is knowing the email the application was
        // submitted with. Without this check, anyone who merely guesses/finds an
        // applicationId (e.g. from a shared URL) could enumerate another
        // person's application state via the distinct error responses below,
        // and even trigger the "cancel open pending orders" side effect further
        // down. Returning the SAME generic 404 as "application not found" keeps
        // this indistinguishable from a wrong ID, closing the enumeration hole.
        const applicationEmail = String(application.email || '').trim().toLowerCase();
        const requestEmail = String(body.email || '').trim().toLowerCase();
        if (!applicationEmail || applicationEmail !== requestEmail) {
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
        const { data: productData, error: productError } = await supabase
          .from('myuni_products')
          .select('id, title, price, description, slug')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (productError) {
          console.error('Product lookup error:', body.courseId, productError);
        }
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
        const { data: packageData, error: packageError } = await supabase
          .from('myuni_packages')
          .select('id, title, price, description, slug')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (packageError) {
          console.error('Package lookup error:', body.courseId, packageError);
        }
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

        const { data: tierData, error: tierError } = await supabase
          .from('myuni_course_tiers')
          .select('*, myuni_courses(id, title, slug, course_type, description, is_active)')
          .eq('id', body.tierId)
          .eq('course_id', body.courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (tierError) {
          console.error('Tier lookup error:', body.tierId, tierError);
        }
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
          isFullCourse: !!(tierData as { is_full_course?: boolean }).is_full_course,
        });
        originalTotalAmount = activePrice;
      } else {
        const { data: courseData, error: courseError } = await supabase
          .from('myuni_courses')
          .select('*')
          .eq('id', body.courseId)
          .eq('is_active', true)
          .maybeSingle();

        if (courseError) {
          console.error('Course lookup error:', body.courseId, courseError);
        }
        if (!courseData) {
          return NextResponse.json({ success: false, message: "Kurs bulunamadı veya aktif değil" }, { status: 404 });
        }

        let activePrice = courseData.price;
        if (courseData.early_bird_price && isEarlyBirdActive(courseData.early_bird_deadline)) {
          activePrice = courseData.early_bird_price;
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

      if (!isEventCertificateItemType) {
        const discountResult = await computeServerDiscount(body.discountCodes || '', validatedItems);
        totalDiscount = discountResult.discount;
        appliedDiscountCode = discountResult.appliedCode;
        appliedDiscountCodeId = discountResult.codeId;
      }

      finalAmount = Math.max(0, originalTotalAmount - totalDiscount);
      orderName = validatedItems[0].title;
    }

    const orderId = `MYU-IYZ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const isTierPurchase = !isCartMode && body.itemType === 'tier';

    // Sipariş bilgilerini kaydet
    const isEventCertificateOrder = !isCartMode && body.itemType === 'event_certificate';

    const orderSnapshot = buildOrderSnapshot(validatedItems, {
      paidTotal: finalAmount,
      discountAmount: totalDiscount,
      discountCodes: appliedDiscountCode || '',
    });

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
      discountCodes: appliedDiscountCode || '',
      discountCodeId: appliedDiscountCodeId,
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
      cartItems: orderSnapshot.items,
      orderSnapshot,
      listTotal: orderSnapshot.listTotal,
    };

    const saveResult = await saveOrderToDatabase(orderData);
    if (!saveResult.success) {
      return NextResponse.json({ success: false, message: "Sipariş kaydedilirken hata: " + saveResult.error }, { status: 500 });
    }

    // ---- 3. ÜCRETSİZ SİPARİŞ MANTIĞI (%100 İndirim Kodu / Bakiye) ----
    if (finalAmount <= 0) {
      // Idempotency guard: unlike the paid flow (where Iyzico's callback claims
      // the SAME orderId atomically), a free order is delivered directly here,
      // and `orderId` is freshly generated per HTTP request — so a double
      // click / client-side retry creates a second, distinct order row and
      // would otherwise re-run enrollment, discount-code consumption, and
      // referral rewards a second time for the same purchase. Look for
      // another order from this exact buyer, for this exact item/amount,
      // created moments ago, and short-circuit instead of delivering twice.
      // (This narrows the race but doesn't fully close it — a proper fix
      // needs a client-supplied idempotency key; see conversation notes.)
      const dedupeWindowStart = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data: duplicateOrder, error: dedupeError } = await supabase
        .from('orders')
        .select('orderid')
        .eq('useremail', buyerEmail)
        .eq('courseid', orderData.courseId)
        .eq('amount', finalAmount)
        .neq('orderid', orderId)
        .gte('created_at', dedupeWindowStart)
        .in('status', ['completed', 'processing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dedupeError) {
        console.error('Free order dedupe check failed (continuing without it):', dedupeError);
      }

      if (duplicateOrder) {
        await supabase
          .from('orders')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('orderid', orderId);

        const successRedirectUrl = `${baseUrl}/${body.locale || 'tr'}/payment-success?free=true&orderId=${duplicateOrder.orderid}`;
        return NextResponse.json({
          success: true,
          redirectToDirect: true,
          redirectUrl: successRedirectUrl,
          orderId: duplicateOrder.orderid,
          userIdUsed: userIdForEnrollment,
        }, { status: 200 });
      }

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
            const { data: existingPurchase, error: existingPurchaseError } = await supabase
              .from('myuni_products_purchases')
              .select('id')
              .eq('user_id', userIdForEnrollment)
              .eq('product_id', item.id)
              .maybeSingle();

            if (existingPurchaseError) {
              console.error('Existing purchase lookup error:', item.id, existingPurchaseError);
            }

            if (!existingPurchase) {
              const paidShare =
                orderSnapshot.items.find((line) => line.id === item.id)?.paidPrice ?? 0;
              await supabase.from('myuni_products_purchases').insert({
                user_id: userIdForEnrollment,
                product_id: item.id,
                purchased_at: new Date().toISOString(),
                price_paid: paidShare
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
            const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
              .from('myuni_enrollments')
              .select('id, is_active')
              .eq('user_id', userIdForEnrollment)
              .eq('course_id', item.id)
              .maybeSingle();

            if (existingEnrollmentError) {
              console.error('Existing enrollment lookup error:', item.id, existingEnrollmentError);
            }

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

        // İndirim kodu tüketimi + Affiliate / Referral Ödül ve Limitleri Tetikle
        try {
          const { consumeDiscountCodeForOrder, createRewardCodeAfterPayment } = await import('../../../lib/referralService');
          await consumeDiscountCodeForOrder(orderId);
          await createRewardCodeAfterPayment(userIdForEnrollment);
        } catch (e) {
          console.error('Free order discount/referral consumption error:', e);
        }
        
        // E-posta: sepet / paket / ürün / tier dahil tüm ücretsiz siparişler
        try {
          await sendOrderConfirmationEmail({
            userName: body.name,
            email: buyerEmail,
            orderId,
            locale: body.locale || 'tr',
            snapshot: orderSnapshot,
            cartMode: isCartMode,
            isFree: true,
            paidAmount: '0.00',
          });
        } catch (e) {
          console.error('Free order confirmation email error:', e);
        }

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
        identityNumber: buyerIdentityNumber,
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

    return new Promise<NextResponse>((resolve) => {
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
