// Shopier link entegrasyonu - Otomatik Sipariş Bildirimi (OSB) webhook
// Ödeme link ile Shopier'da yapıldığında Shopier bu URL'ye POST atar; sipariş kaydedilir ve kullanıcı kursa yazılır.
// Link formatı: https://www.shopier.com/MyUNI/43968703 → shopier_product_id = "43968703"

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { supabaseAdmin as supabase } from '../../../lib/supabaseAdmin';

type ShopierWebhookPayload = {
  order_id?: string;
  platform_order_id?: string;
  siparis_no?: string;
  payment_id?: string;
  product_id?: string;
  product_sku?: string;
  sku?: string;
  urun_id?: string;
  product_url?: string;
  link?: string;
  page_id?: string;
  buyer_email?: string;
  email?: string;
  alici_email?: string;
  buyer_name?: string;
  name?: string;
  amount?: string | number;
  total_order_value?: string | number;
  tutar?: string | number;
  status?: string;
  durum?: string;
  [key: string]: string | number | undefined;
};

/** URL'den Shopier ürün ID'sini çıkar (örn. .../MyUNI/43968703 → 43968703) */
function extractProductIdFromUrl(url: string): string | null {
  try {
    const s = String(url).trim();
    if (!s) return null;
    const path = s.startsWith('http') ? new URL(s).pathname : s;
    const segment = path.split('/').filter(Boolean).pop();
    return segment && /^\d+$/.test(segment) ? segment : null;
  } catch {
    return null;
  }
}

async function enrollUserToCourse(userId: string, courseId: string) {
  const { data: existing } = await supabase
    .from('myuni_enrollments')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (existing?.is_active) {
    return { success: true, enrollmentId: existing.id, alreadyEnrolled: true };
  }

  if (existing && !existing.is_active) {
    await supabase
      .from('myuni_enrollments')
      .update({ is_active: true, enrolled_at: new Date().toISOString(), progress_percentage: 0 })
      .eq('id', existing.id);
    return { success: true, enrollmentId: existing.id, reactivated: true };
  }

  const { data: newEnrollment, error } = await supabase
    .from('myuni_enrollments')
    .insert({
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, enrollmentId: newEnrollment.id, newEnrollment: true };
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: ShopierWebhookPayload = {};

    if (contentType.includes('application/json')) {
      body = (await request.json()) as ShopierWebhookPayload;
    } else if (contentType.includes('form') || contentType.includes('urlencoded')) {
      const form = await request.formData();
      for (const [k, v] of form.entries()) {
        body[k] = typeof v === 'string' ? v : undefined;
      }
    } else {
      const text = await request.text();
      try {
        body = JSON.parse(text) as ShopierWebhookPayload;
      } catch {
        const params = new URLSearchParams(text);
        for (const [k, v] of params.entries()) body[k] = v;
      }
    }

    const orderId =
      String(
        body.order_id ??
          body.platform_order_id ??
          body.siparis_no ??
          ''
      ).trim() || `SHOPIER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const buyerEmail = [body.buyer_email, body.email, body.alici_email].find((v) => v != null);
    const emailStr = buyerEmail ? String(buyerEmail).trim().toLowerCase() : null;
    const buyerName = [body.buyer_name, body.name].find((v) => v != null) || emailStr?.split('@')[0] || 'Alıcı';
    const amount = Number(body.amount ?? body.total_order_value ?? body.tutar ?? 0) || 0;
    const status = String(body.status ?? body.durum ?? '').toLowerCase();

    // Ürün ID: doğrudan alanlar veya URL'den (https://www.shopier.com/MyUNI/43968703 → 43968703)
    let productKey: string | null = null;
    const directId = [body.product_id, body.product_sku, body.sku, body.urun_id, body.page_id].find((v) => v != null);
    if (directId) productKey = String(directId).trim();
    if (!productKey && (body.product_url || body.link)) {
      const fromUrl = extractProductIdFromUrl(String(body.product_url ?? body.link));
      if (fromUrl) productKey = fromUrl;
    }
    if (!productKey) {
      console.error('[shopier-webhook] Missing product identifier');
      return NextResponse.json({ success: false, message: 'Missing product identifier' }, { status: 400 });
    }

    if (!emailStr) {
      console.error('[shopier-webhook] Missing buyer email');
      return NextResponse.json({ success: false, message: 'Missing buyer email' }, { status: 400 });
    }

    // Idempotency: aynı sipariş tekrar gelirse tekrar insert etme, varsa sadece enrollment tamamla
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('orderid, courseid, status, enrolled')
      .eq('orderid', orderId)
      .maybeSingle();

    if (existingOrder) {
      const courseIdForEnroll = existingOrder.courseid;
      const alreadyEnrolled = existingOrder.enrolled === true;
      const clerk = await clerkClient();
      const list = await clerk.users.getUserList({ emailAddress: [emailStr], limit: 1 });
      const clerkUserId = list.data?.[0]?.id ?? null;
      if (clerkUserId && !alreadyEnrolled && (status === 'success' || status === 'completed')) {
        const enrollResult = await enrollUserToCourse(clerkUserId, courseIdForEnroll);
        if (enrollResult.success && enrollResult.enrollmentId) {
          await supabase
            .from('orders')
            .update({
              enrolled: true,
              enrollmentid: enrollResult.enrollmentId,
              updated_at: new Date().toISOString(),
            })
            .eq('orderid', orderId);
        }
      }
      return NextResponse.json({ success: true, orderId, courseId: courseIdForEnroll, duplicate: true });
    }

    const { data: courseData, error: courseError } = await supabase
      .from('myuni_courses')
      .select('id, title, slug, course_type')
      .eq('shopier_product_id', productKey)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (courseError || !courseData) {
      console.error('[shopier-webhook] No course found for shopier_product_id:', productKey);
      return NextResponse.json(
        { success: false, message: 'No course mapped for this product' },
        { status: 404 }
      );
    }

    // Siparişi kaydet (ödeme tamamlandı kabul ediyoruz; status kontrolü isteğe bağlı)
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const clerk = await clerkClient();
    const list = await clerk.users.getUserList({
      emailAddress: [emailStr],
      limit: 1,
    });
    const clerkUserId = list.data?.[0]?.id ?? null;

    const userIdForEnrollment = clerkUserId || emailStr;

    const orderRecord = {
      orderid: orderId,
      courseid: courseData.id,
      useremail: emailStr,
      coursename: courseData.title,
      amount,
      status: status === 'success' || status === 'completed' ? 'completed' : 'pending',
      paymentmethod: 'shopier_link',
      custom_data: {
        clerkUserId: clerkUserId ?? undefined,
        userId: userIdForEnrollment,
        locale: 'tr',
        userName: buyerName,
        source: 'shopier_webhook',
      },
      ip_address: ipAddress,
      user_agent: userAgent,
    };

    const { error: orderInsertError } = await supabase.from('orders').insert({
      orderid: orderRecord.orderid,
      courseid: orderRecord.courseid,
      useremail: orderRecord.useremail,
      coursename: orderRecord.coursename,
      amount: orderRecord.amount,
      status: orderRecord.status,
      paymentmethod: orderRecord.paymentmethod,
      custom_data: orderRecord.custom_data,
      ip_address: orderRecord.ip_address,
      user_agent: orderRecord.user_agent,
    });

    if (orderInsertError) {
      console.error('[shopier-webhook] Order insert error:', orderInsertError);
      return NextResponse.json(
        { success: false, message: 'Failed to save order' },
        { status: 500 }
      );
    }

    // Sadece Clerk kullanıcısı varsa sitede enrollment yapıyoruz (user_id Clerk ID olmalı)
    if (clerkUserId && (status === 'success' || status === 'completed')) {
      const enrollResult = await enrollUserToCourse(clerkUserId, courseData.id);
      if (enrollResult.success && enrollResult.enrollmentId) {
        await supabase
          .from('orders')
          .update({
            enrolled: true,
            enrollmentid: enrollResult.enrollmentId,
            updated_at: new Date().toISOString(),
          })
          .eq('orderid', orderId);

        try {
          const { sendPurchaseConfirmationEmail } = await import('../../_services/emailService');
          await sendPurchaseConfirmationEmail(
            { name: buyerName, email: emailStr },
            { title: courseData.title, description: '', slug: courseData.slug },
            { orderId, amount: String(amount), isFree: false },
            'tr',
            (courseData as { course_type?: string }).course_type || 'online'
          );
        } catch (e) {
          console.error('[shopier-webhook] Email send error:', e);
        }
      }
    }
    // Kullanıcı sitede yoksa (clerkUserId yok) sipariş kayıtlı; siteye üye olup giriş yaptığında
    // ileride "email ile eşleşen bekleyen siparişleri kaydet" gibi bir akış eklenebilir.

    return NextResponse.json({ success: true, orderId, courseId: courseData.id });
  } catch (error) {
    console.error('[shopier-webhook] Error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
