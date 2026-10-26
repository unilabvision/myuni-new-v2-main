import { auth, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getEventCertificateProgress } from '@/lib/certificateService';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from '@/lib/siteApplications/config';
import {
  getCertificatePrice,
  getEventApplicationCheckoutPath,
  parsePackageSettings,
} from '@/lib/siteApplications/packages';

const CERTIFICATE_PROGRESS_THRESHOLD = 70;

function readSubmission(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const [{ userId }, user, { eventId }] = await Promise.all([
      auth(),
      currentUser(),
      context.params,
    ]);
    if (!userId || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const primaryEmail = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
    if (
      !primaryEmail ||
      user.primaryEmailAddress?.verification?.status !== 'verified'
    ) {
      return NextResponse.json({ error: 'Verified email required' }, { status: 403 });
    }

    const progress = await getEventCertificateProgress(userId, eventId);
    if (progress.completionPercentage < CERTIFICATE_PROGRESS_THRESHOLD) {
      return NextResponse.json(
        { error: 'Certificate requires at least 70% completion' },
        { status: 403 }
      );
    }

    const supabase = getSiteApplicationsSupabase();
    const { data: event } = await supabase
      .from('myuni_events')
      .select('id, slug, title, is_active')
      .eq('id', eventId)
      .eq('is_active', true)
      .maybeSingle();
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const { data: form } = await supabase
      .from(siteApplicationsDb.forms)
      .select('id, package_settings')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const certificatePrice = getCertificatePrice(parsePackageSettings(form?.package_settings));
    if (!form || certificatePrice <= 0) {
      return NextResponse.json({ error: 'Certificate package is unavailable' }, { status: 422 });
    }

    const { data: applications, error: applicationsError } = await supabase
      .from(siteApplicationsDb.applications)
      .select('id, locale, submission_data, created_at')
      .eq('event_id', eventId)
      .ilike('email', primaryEmail)
      .order('created_at', { ascending: false })
      .limit(20);
    if (applicationsError) throw applicationsError;

    const applicationList = applications || [];
    const paidApplication = applicationList.find((application) => {
      const submission = readSubmission(application.submission_data);
      return submission.registration_tier === 'certificate' && submission.payment_status === 'paid';
    });
    const pendingApplication = applicationList.find((application) => {
      const submission = readSubmission(application.submission_data);
      return submission.registration_tier === 'certificate' && submission.payment_status === 'pending';
    });
    const freeApplication = applicationList.find((application) => {
      const submission = readSubmission(application.submission_data);
      return submission.payment_status !== 'superseded';
    });
    const application = paidApplication || pendingApplication || freeApplication;
    if (!application) {
      return NextResponse.json({ error: 'Event registration not found' }, { status: 404 });
    }

    const paymentStatus = paidApplication ? 'paid' : 'pending';
    const currentSubmission = readSubmission(application.submission_data);
    const submissionData = {
      ...currentSubmission,
      registration_tier: 'certificate',
      payment_status: paymentStatus,
      package_price:
        paymentStatus === 'paid'
          ? currentSubmission.package_price
          : certificatePrice,
      certificate_user_id: userId,
    };
    const { error: updateError } = await supabase
      .from(siteApplicationsDb.applications)
      .update({ submission_data: submissionData })
      .eq('id', application.id);
    if (updateError) throw updateError;

    if (paymentStatus === 'paid') {
      return NextResponse.json({ state: 'paid', applicationId: application.id });
    }

    const locale = application.locale === 'en' ? 'en' : 'tr';
    return NextResponse.json({
      state: 'payment_required',
      applicationId: application.id,
      checkoutUrl: getEventApplicationCheckoutPath(locale, application.id, event.slug),
    });
  } catch (error) {
    console.error('Certificate checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
