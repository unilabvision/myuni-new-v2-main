import 'server-only';

import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import { siteApplicationsDb } from './config';
import type { ApplicationPaymentStatus } from './packages';
import { resolveUniboardAdminUrl } from '@/lib/publicBaseUrl';

type SubmissionData = Record<string, unknown>;

export async function markSiteApplicationPaid(
  applicationId: string,
  orderId: string,
  paymentMethod = 'iyzico'
): Promise<{ success: boolean; alreadyPaid?: boolean; error?: string }> {
  const supabase = getSiteApplicationsSupabase();

  const { data: application, error } = await supabase
    .from(siteApplicationsDb.applications)
    .select('submission_data')
    .eq('id', applicationId)
    .maybeSingle();

  if (error || !application) {
    return { success: false, error: 'Application not found' };
  }

  const submission = (application.submission_data || {}) as SubmissionData;
  if (submission.payment_status === 'paid') {
    return { success: true, alreadyPaid: true };
  }

  const updated: SubmissionData = {
    ...submission,
    payment_status: 'paid' satisfies ApplicationPaymentStatus,
    order_id: orderId,
    payment_method: paymentMethod,
    paid_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from(siteApplicationsDb.applications)
    .update({ submission_data: updated })
    .eq('id', applicationId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function notifyUniboardPaymentConfirm(
  applicationId: string,
  orderId: string
): Promise<void> {
  const adminUrl = resolveUniboardAdminUrl();
  const secret = process.env.SITE_APPLICATION_PAYMENT_SECRET;

  if (!adminUrl || !secret) {
    console.warn(
      '[siteApplications] uniboard payment confirm skipped: missing UNIBOARD_ADMIN_URL / SITE_APPLICATION_PAYMENT_SECRET',
      { applicationId, orderId }
    );
    return;
  }

  try {
    const base = adminUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/site-applications/payments/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-secret': secret,
      },
      body: JSON.stringify({
        applicationId,
        orderId,
        paymentMethod: 'iyzico',
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(
        '[siteApplications] uniboard payment confirm non-2xx:',
        res.status,
        body.slice(0, 500),
        { applicationId, orderId, base }
      );
    }
  } catch (err) {
    console.error('[siteApplications] uniboard payment confirm failed:', err, {
      applicationId,
      orderId,
    });
  }
}
