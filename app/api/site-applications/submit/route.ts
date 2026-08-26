import { NextRequest, NextResponse } from 'next/server';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import {
  computeAttachmentExpiresAt,
  extractContactFromSubmission,
  siteApplicationsDb,
  validateSubmissionFields,
} from '@/lib/siteApplications';
import {
  getCertificatePrice,
  getEventApplicationCheckoutPath,
  isValidRegistrationTier,
  parsePackageSettings,
  type RegistrationTier,
} from '@/lib/siteApplications/packages';
import type { SiteApplicationFormField } from '@/app/types/siteApplicationForms';
import { sendSiteApplicationApprovalEmail } from '@/app/_services/siteApplicationApprovalEmail';
import { isEventRegistrationOpen } from '@/lib/events/eventRegistration';

async function resolveForm(
  supabase: ReturnType<typeof getSiteApplicationsSupabase>,
  locale: string,
  formSlug: string,
  eventSlug?: string,
  courseSlug?: string
) {
  if (courseSlug) {
    const { data: course } = await supabase
      .from('myuni_courses')
      .select('id, slug, title, is_active, is_registration_open, price')
      .eq('slug', courseSlug)
      .maybeSingle();

    if (!course) return { error: 'Course not found', status: 404 as const };

    let form: Record<string, unknown> | null = null;
    const byCourse = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('course_id', course.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (!byCourse.error && byCourse.data?.[0]) {
      form = byCourse.data[0] as Record<string, unknown>;
    } else {
      const normalized = courseSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
      const bySlug = await supabase
        .from(siteApplicationsDb.forms)
        .select('*')
        .or(`slug_tr.eq.kurs-${normalized},slug_en.eq.course-${normalized}`)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);
      form = (bySlug.data?.[0] as Record<string, unknown>) || null;
    }

    if (!form) {
      return { error: 'Form not found or inactive', status: 404 as const };
    }

    return { form, event: null, course };
  }

  if (eventSlug) {
    const { data: event } = await supabase
      .from('myuni_events')
      .select('id, slug, title, is_active, is_registration_open, registration_deadline')
      .eq('slug', eventSlug)
      .eq('is_active', true)
      .single();

    if (!event) return { error: 'Event not found', status: 404 as const };

    const { data: forms, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('event_id', event.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    const form = forms?.[0];
    if (error || !form) {
      return { error: 'Form not found or inactive', status: 404 as const };
    }

    return { form, event, course: null };
  }

  const slugColumn = locale === 'en' ? 'slug_en' : 'slug_tr';
  const { data: form, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq(slugColumn, formSlug)
    .eq('is_active', true)
    .eq('show_on_website', true)
    .maybeSingle();

  if (formError || !form) {
    return { error: 'Form not found or inactive', status: 404 as const };
  }

  return { form, event: null, course: null };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.honeypot?.trim()) {
      return NextResponse.json({ success: true, submissionId: 'ok' });
    }

    const formSlug = String(body.formSlug || '').trim();
    const eventSlug = String(body.eventSlug || '').trim() || undefined;
    const courseSlug = String(body.courseSlug || '').trim() || undefined;
    const locale = body.locale === 'en' ? 'en' : 'tr';
    const fieldValues = (body.fields || {}) as Record<string, unknown>;
    const registrationTierInput = String(body.registrationTier || 'free').trim() as RegistrationTier;
    const checkoutNext =
      body.checkoutNext && typeof body.checkoutNext === 'object'
        ? (body.checkoutNext as {
            courseId?: string;
            tierId?: string;
            type?: string;
            ref?: string;
            cartIds?: string;
            mode?: string;
          })
        : null;

    if (!formSlug && !eventSlug && !courseSlug) {
      return NextResponse.json(
        { error: 'Form slug, event slug, or course slug required' },
        { status: 400 }
      );
    }

    const supabase = getSiteApplicationsSupabase();
    const resolved = await resolveForm(supabase, locale, formSlug, eventSlug, courseSlug);
    if ('error' in resolved) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }

    const { form, event, course } = resolved;
    const packageSettings = parsePackageSettings(form.package_settings);

    if (
      event &&
      !isEventRegistrationOpen({
        is_registration_open: event.is_registration_open,
        registration_deadline: event.registration_deadline,
      })
    ) {
      return NextResponse.json(
        {
          error:
            locale === 'en'
              ? 'Registration is closed for this event'
              : 'Bu etkinlik için kayıt alımı kapalı',
        },
        { status: 403 }
      );
    }

    if (!isValidRegistrationTier(registrationTierInput, packageSettings)) {
      return NextResponse.json({ error: 'Invalid registration package' }, { status: 400 });
    }

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

    // Event if linked to an event — do not treat bare eventSlug / packages as enough
    // (team forms must stay source=website so they appear in Ekip Başvuruları).
    const isEventApplication =
      Boolean(event) ||
      Boolean(form.event_id) ||
      form.form_type === 'event';
    const isCourseApplication =
      Boolean(course) ||
      Boolean((form as { course_id?: string }).course_id) ||
      form.form_type === 'course' ||
      Boolean(courseSlug);

    const certificatePrice = getCertificatePrice(packageSettings);
    const requiresPayment =
      isEventApplication &&
      registrationTierInput === 'certificate' &&
      certificatePrice > 0;
    const paymentStatus = requiresPayment ? 'pending' : 'none';
    const packagePrice =
      isEventApplication && registrationTierInput === 'certificate' ? certificatePrice : 0;

    // Events: always auto-accept. Course applications stay pending until payment/admin.
    const initialStatus = isEventApplication ? 'accepted' : 'pending';

    const submissionData: Record<string, unknown> = {
      ...normalized,
      ...(isEventApplication
        ? {
            registration_tier: registrationTierInput,
            payment_status: paymentStatus,
            package_price: packagePrice,
          }
        : {}),
      ...(isCourseApplication && course
        ? {
            course_id: course.id,
            course_slug: course.slug,
            course_title: course.title,
            ...(checkoutNext?.tierId ? { tier_id: checkoutNext.tierId } : {}),
            ...(checkoutNext?.type ? { checkout_type: checkoutNext.type } : {}),
          }
        : {}),
    };

    const contact = extractContactFromSubmission(typedFields, normalized);
    const effectiveSlug = locale === 'en' ? form.slug_en : form.slug_tr;
    const eventName =
      (typeof normalized.event_name === 'string' ? normalized.event_name : null) ||
      event?.title ||
      null;

    const row: Record<string, unknown> = {
      form_id: form.id,
      event_id: event?.id || form.event_id || null,
      course_id: course?.id || (form as { course_id?: string }).course_id || null,
      application_type: effectiveSlug,
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      event_name: eventName,
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
      source: isEventApplication
        ? 'event_website'
        : isCourseApplication
          ? 'course_website'
          : 'website',
      user_agent: request.headers.get('user-agent'),
      status: initialStatus,
      submission_data: submissionData,
      attachment_file_name: attachmentFileName,
      attachment_storage_path: attachmentStoragePath,
      attachment_mime_type: attachmentMimeType,
      attachment_file_size: attachmentFileSize,
      attachment_expires_at: attachmentStoragePath ? computeAttachmentExpiresAt() : null,
    };

    let { data, error } = await supabase
      .from(siteApplicationsDb.applications)
      .insert(row)
      .select('id')
      .single();

    if (error && String(error.message || '').toLowerCase().includes('course_id')) {
      const { course_id: _omit, ...leanRow } = row;
      const retry = await supabase
        .from(siteApplicationsDb.applications)
        .insert(leanRow)
        .select('id')
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.error('Site application insert error:', error);
      return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
    }

    if (isEventApplication && initialStatus === 'accepted') {
      await supabase.from(siteApplicationsDb.statusHistory).insert({
        application_id: data.id,
        old_status: null,
        new_status: 'accepted',
        changed_by: null,
        changed_by_email: 'system:event-auto-accept',
      });

      const emailResult = await sendSiteApplicationApprovalEmail({
        to: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        locale,
        eventName,
        isEvent: true,
      });
      if (!emailResult.success) {
        console.error('Event registration email failed:', emailResult.error);
      }
    }

    const resolvedEventSlug = event?.slug || eventSlug || '';
    let checkoutUrl: string | null =
      requiresPayment && resolvedEventSlug
        ? getEventApplicationCheckoutPath(locale, data.id, resolvedEventSlug)
        : null;

    // Course purchase: after application → course checkout
    if (!checkoutUrl && isCourseApplication) {
      if (checkoutNext?.mode === 'cart' && checkoutNext?.cartIds) {
        const qs = new URLSearchParams();
        qs.set('cartIds', String(checkoutNext.cartIds));
        qs.set('mode', 'cart');
        qs.set('applicationId', String(data.id));
        if (checkoutNext?.ref) qs.set('ref', String(checkoutNext.ref));
        checkoutUrl = `/${locale}/checkout?${qs.toString()}`;
      } else {
        const courseId = checkoutNext?.courseId || course?.id;
        if (courseId) {
          const qs = new URLSearchParams();
          qs.set('id', String(courseId));
          if (checkoutNext?.tierId) qs.set('tierId', String(checkoutNext.tierId));
          if (checkoutNext?.type) qs.set('type', String(checkoutNext.type));
          else if (checkoutNext?.tierId) qs.set('type', 'tier');
          if (checkoutNext?.ref) qs.set('ref', String(checkoutNext.ref));
          qs.set('applicationId', String(data.id));
          checkoutUrl = `/${locale}/checkout?${qs.toString()}`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: data.id,
      applicationId: data.id,
      status: initialStatus,
      requiresPayment: Boolean(requiresPayment || (isCourseApplication && checkoutUrl)),
      registrationTier: registrationTierInput,
      paymentStatus,
      eventSlug: resolvedEventSlug || undefined,
      courseSlug: course?.slug || courseSlug || undefined,
      checkoutUrl,
    });
  } catch (err) {
    console.error('Form submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
