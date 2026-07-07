import { NextRequest, NextResponse } from 'next/server';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import {
  computeAttachmentExpiresAt,
  extractContactFromSubmission,
  siteApplicationsDb,
  validateSubmissionFields,
} from '@/lib/siteApplications';
import { requireCaptchaInProduction, verifyHCaptcha } from '@/lib/siteApplications/captcha';
import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';

async function resolveForm(
  supabase: ReturnType<typeof getSiteApplicationsSupabase>,
  locale: string,
  formSlug: string,
  eventSlug?: string
) {
  if (eventSlug) {
    const { data: event } = await supabase
      .from('myuni_events')
      .select('id, slug, title, is_active')
      .eq('slug', eventSlug)
      .eq('is_active', true)
      .single();

    if (!event) return { error: 'Event not found', status: 404 as const };

    const { data: form, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .eq('show_on_website', true)
      .single();

    if (error || !form) {
      return { error: 'Form not found or inactive', status: 404 as const };
    }

    return { form, event };
  }

  const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';
  const { data: form, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq(slugColumn, formSlug)
    .eq('is_active', true)
    .single();

  if (formError || !form) {
    return { error: 'Form not found or inactive', status: 404 as const };
  }

  return { form, event: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.honeypot?.trim()) {
      return NextResponse.json({ success: true, submissionId: 'ok' });
    }

    const formSlug = String(body.formSlug || '').trim();
    const eventSlug = String(body.eventSlug || '').trim() || undefined;
    const locale = body.locale === 'en' ? 'en' : 'tr';
    const fieldValues = (body.fields || {}) as Record<string, unknown>;

    if (!formSlug && !eventSlug) {
      return NextResponse.json({ error: 'Form slug or event slug required' }, { status: 400 });
    }

    const captchaToken = body.hCaptchaToken as string | undefined;
    if (!requireCaptchaInProduction(captchaToken)) {
      return NextResponse.json({ error: 'Captcha required' }, { status: 400 });
    }
    if (captchaToken) {
      const valid = await verifyHCaptcha(captchaToken);
      if (!valid) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 400 });
      }
    }

    const supabase = getSiteApplicationsSupabase();
    const resolved = await resolveForm(supabase, locale, formSlug, eventSlug);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { form, event } = resolved;

    const { data: fields, error: fieldsError } = await supabase
      .from(siteApplicationsDb.formFields)
      .select('*')
      .eq('form_id', form.id)
      .order('order_index', { ascending: true });

    if (fieldsError || !fields?.length) {
      return NextResponse.json({ error: 'Form configuration incomplete' }, { status: 400 });
    }

    const typedFields = fields as SiteApplicationFormField[];
    const { valid, errors, normalized } = validateSubmissionFields(typedFields, fieldValues);

    if (!valid) {
      return NextResponse.json({ error: 'Validation failed', fieldErrors: errors }, { status: 400 });
    }

    if (event?.title && !normalized.event_name) {
      normalized.event_name = event.title;
    }

    const attachmentStoragePath = body.attachmentStoragePath?.trim() || null;
    const attachmentFileName = body.attachmentFileName?.trim() || null;
    const attachmentMimeType = body.attachmentMimeType?.trim() || null;
    const attachmentFileSize = body.attachmentFileSize ? Number(body.attachmentFileSize) : null;

    if (attachmentStoragePath && !form.allows_attachment) {
      return NextResponse.json({ error: 'Attachments not allowed' }, { status: 400 });
    }

    if (attachmentStoragePath && (!attachmentFileName || !attachmentFileSize)) {
      return NextResponse.json({ error: 'Incomplete attachment metadata' }, { status: 400 });
    }

    const contact = extractContactFromSubmission(typedFields, normalized);
    const effectiveSlug = locale === 'en' ? form.slug_en : form.slug_tr;

    const row = {
      form_id: form.id,
      event_id: event?.id || form.event_id || null,
      application_type: effectiveSlug,
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      event_name:
        (typeof normalized.event_name === 'string' ? normalized.event_name : null) ||
        event?.title ||
        null,
      event_date: typeof normalized.event_date === 'string' ? normalized.event_date : null,
      participant_count:
        typeof normalized.participant_count === 'number' ? normalized.participant_count : null,
      organization: typeof normalized.organization === 'string' ? normalized.organization : null,
      role_interest: typeof normalized.role_interest === 'string' ? normalized.role_interest : null,
      experience: typeof normalized.experience === 'string' ? normalized.experience : null,
      portfolio_url: typeof normalized.portfolio_url === 'string' ? normalized.portfolio_url : null,
      message: typeof normalized.message === 'string' ? normalized.message : null,
      motivation: typeof normalized.motivation === 'string' ? normalized.motivation : null,
      locale,
      source: 'website',
      user_agent: request.headers.get('user-agent'),
      status: 'pending',
      submission_data: normalized,
      attachment_file_name: attachmentFileName,
      attachment_storage_path: attachmentStoragePath,
      attachment_mime_type: attachmentMimeType,
      attachment_file_size: attachmentFileSize,
      attachment_expires_at: attachmentStoragePath ? computeAttachmentExpiresAt() : null,
    };

    const { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .insert(row)
      .select('id')
      .single();

    if (error) {
      console.error('Site application insert error:', error);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
    });
  } catch (err) {
    console.error('Form submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
