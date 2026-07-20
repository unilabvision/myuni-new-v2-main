import { NextRequest, NextResponse } from 'next/server';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';
import { markSiteApplicationPaid } from '@/lib/siteApplications/applicationPayments';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

function isPaidOrderStatus(status: string | null | undefined) {
  const s = String(status || '').toLowerCase();
  return s === 'completed' || s === 'success' || s === 'paid';
}

/**
 * Checkout açılmadan önce: completed order varsa application'ı paid yap.
 * Böylece ödeme alınmış kullanıcı tekrar Iyzico ekranına düşmez.
 */
async function healPaidFromOrders(applicationId: string): Promise<boolean> {
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('orderid, status, paymentmethod, custom_data, courseid')
    .eq('courseid', applicationId)
    .order('created_at', { ascending: false })
    .limit(10);

  const paid = (orders || []).find((o) => isPaidOrderStatus(o.status));
  if (!paid) return false;

  const result = await markSiteApplicationPaid(
    applicationId,
    paid.orderid,
    paid.paymentmethod || 'iyzico'
  );
  return result.success || Boolean(result.alreadyPaid);
}

/** Checkout için bekleyen sertifika başvurusu özeti */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const eventSlug = request.nextUrl.searchParams.get('eventSlug')?.trim() || '';

    const supabase = getSiteApplicationsSupabase();
    const { data: application, error } = await supabase
      .from(siteApplicationsDb.applications)
      .select(
        'id, email, first_name, last_name, event_name, event_id, submission_data, myuni_events ( slug, title, is_active )'
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const eventInfo = application.myuni_events as
      | { slug: string; title: string; is_active: boolean }
      | { slug: string; title: string; is_active: boolean }[]
      | null;
    const event = Array.isArray(eventInfo) ? eventInfo[0] : eventInfo;

    if (eventSlug && event?.slug && event.slug !== eventSlug) {
      return NextResponse.json({ error: 'Event mismatch' }, { status: 400 });
    }

    let submission = (application.submission_data || {}) as Record<string, unknown>;
    let paymentStatus = String(submission.payment_status || 'none');
    const registrationTier = submission.registration_tier;
    const packagePrice = Number(submission.package_price) || 0;

    if (registrationTier !== 'certificate') {
      return NextResponse.json({ error: 'Not a certificate application' }, { status: 400 });
    }

    // Pending görünüyorsa orders ile iyileştir
    if (paymentStatus === 'pending') {
      const healed = await healPaidFromOrders(id);
      if (healed) {
        paymentStatus = 'paid';
      }
    }

    if (paymentStatus === 'paid') {
      return NextResponse.json(
        {
          error: 'Already paid',
          paid: true,
          applicationId: id,
          eventSlug: event?.slug || eventSlug,
        },
        { status: 409 }
      );
    }

    // Mükerrer: aynı e-posta + etkinlikte paid kardeş varsa tekrar ödeme yok
    if (paymentStatus === 'superseded') {
      const siblingId =
        typeof submission.payment_superseded_by === 'string'
          ? submission.payment_superseded_by
          : null;
      return NextResponse.json(
        {
          error: 'Duplicate application — payment already completed on another registration',
          superseded: true,
          paid: true,
          applicationId: id,
          paidApplicationId: siblingId,
          eventSlug: event?.slug || eventSlug,
        },
        { status: 409 }
      );
    }

    // Sibling paid (henüz superseded işaretlenmemiş olabilir)
    if (application.email && application.event_id) {
      const { data: siblings } = await supabase
        .from(siteApplicationsDb.applications)
        .select('id, submission_data')
        .eq('event_id', application.event_id)
        .ilike('email', String(application.email).trim())
        .neq('id', id)
        .limit(20);

      const paidSibling = (siblings || []).find((row) => {
        const s = (row.submission_data || {}) as Record<string, unknown>;
        return s.registration_tier === 'certificate' && s.payment_status === 'paid';
      });

      if (paidSibling) {
        return NextResponse.json(
          {
            error: 'Certificate already paid for this email and event',
            superseded: true,
            paid: true,
            applicationId: id,
            paidApplicationId: paidSibling.id,
            eventSlug: event?.slug || eventSlug,
          },
          { status: 409 }
        );
      }
    }

    if (paymentStatus !== 'pending' || packagePrice <= 0) {
      return NextResponse.json({ error: 'Payment not required' }, { status: 400 });
    }

    const eventTitle = event?.title || application.event_name || 'Etkinlik';

    return NextResponse.json({
      application: {
        id: application.id,
        email: application.email,
        name: `${application.first_name || ''} ${application.last_name || ''}`.trim(),
        eventTitle,
        eventSlug: event?.slug || eventSlug,
        eventId: application.event_id,
        amount: packagePrice,
        paymentStatus,
      },
    });
  } catch (err) {
    console.error('Application checkout fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
