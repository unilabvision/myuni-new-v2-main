import { NextRequest, NextResponse } from 'next/server';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';

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

    const submission = (application.submission_data || {}) as Record<string, unknown>;
    const registrationTier = submission.registration_tier;
    const paymentStatus = submission.payment_status;
    const packagePrice = Number(submission.package_price) || 0;

    if (registrationTier !== 'certificate') {
      return NextResponse.json({ error: 'Not a certificate application' }, { status: 400 });
    }

    if (paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Already paid', paid: true }, { status: 409 });
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
