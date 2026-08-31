import 'server-only';

import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import type {
  PublicSiteApplicationNavForm,
  SiteApplicationForm,
  SiteApplicationFormField,
} from '@/app/types/siteApplicationForms';
import { toPublicForm } from './forms';
import {
  getEventApplicationPath,
  siteApplicationsDb,
} from './config';
import {
  getPublicRegistrationPackages,
  parsePackageSettings,
} from './packages';
import type { PublicRegistrationPackage } from '@/app/types/siteApplicationForms';

export async function getVisibleSiteApplicationForms(
  _locale: string
): Promise<PublicSiteApplicationNavForm[]> {
  // Başvuru formları Hakkımızda menüsünde listelenmez; kurs/etkinlik
  // sayfalarındaki katılma & satın al butonlarından açılır.
  return [];
}

export async function getPublicFormByEventSlug(eventSlug: string, locale: string) {
  const supabase = getSiteApplicationsSupabase();

  const { data: event, error: eventError } = await supabase
    .from('myuni_events')
    .select('id, slug, title, is_active, is_registration_open, registration_deadline')
    .eq('slug', eventSlug)
    .eq('is_active', true)
    .single();

  if (eventError || !event) {
    return null;
  }

  let form: Record<string, unknown> | null = null;

  const { data: forms, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!formError && forms?.[0]) {
    form = forms[0] as Record<string, unknown>;
  }

  // Hakkımızda'dan taşınan formlar: event_id yoksa slug/başlık ile eşle
  if (!form) {
    const { data: candidates } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(50);

    const match = (candidates as Record<string, unknown>[] | null)?.find(
      (row) =>
        !row.event_id &&
        formMatchesEntity(row, { slug: event.slug, title: event.title })
    );
    if (match) form = match;
  }

  if (!form) {
    return null;
  }

  const fields = await loadFormFields(form.id);
  if (!fields) return null;

  const publicForm = toPublicForm(
    form as unknown as SiteApplicationForm,
    fields,
    locale
  );

  return {
    form: {
      ...publicForm,
      event_id: event.id,
      event_slug: event.slug,
      event_title: event.title,
    },
    event: {
      id: event.id,
      slug: event.slug,
      title: event.title,
      is_registration_open: event.is_registration_open ?? true,
      registration_deadline: event.registration_deadline ?? null,
    },
    locale,
  };
}

function buildCourseFormSlugs(courseSlug: string) {
  const normalized = courseSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return {
    slug_tr: `kurs-${normalized}`,
    slug_en: `course-${normalized}`,
  };
}

function normalizeMatchKey(value: string | null | undefined): string {
  return String(value || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function isInternshipOrTeamForm(form: Record<string, unknown>): boolean {
  const blob = [form.slug_tr, form.slug_en, form.title_tr, form.title_en, form.form_type]
    .map((v) => String(v || '').toLowerCase())
    .join(' ');
  return /(staj|internship|kariyer|career|ekip-basvuru|team-application)/i.test(blob);
}

function formMatchesEntity(
  form: Record<string, unknown>,
  entity: { slug: string; title?: string | null }
): boolean {
  if (isInternshipOrTeamForm(form)) return false;

  const entitySlug = normalizeMatchKey(entity.slug);
  const entityTitle = normalizeMatchKey(entity.title);
  if (!entitySlug && !entityTitle) return false;

  const candidates = [form.slug_tr, form.slug_en, form.title_tr, form.title_en].map((v) =>
    normalizeMatchKey(String(v || ''))
  );

  for (const candidate of candidates) {
    if (!candidate || candidate.length < 6) continue;
    if (entitySlug && (candidate.includes(entitySlug) || entitySlug.includes(candidate))) {
      return true;
    }
    if (
      entityTitle &&
      entityTitle.length >= 10 &&
      (candidate.includes(entityTitle) || entityTitle.includes(candidate))
    ) {
      return true;
    }
  }
  return false;
}

async function loadFormFields(formId: unknown) {
  const supabase = getSiteApplicationsSupabase();
  const { data: fields, error: fieldsError } = await supabase
    .from(siteApplicationsDb.formFields)
    .select('*')
    .eq('form_id', formId)
    .order('order_index', { ascending: true });

  if (fieldsError) return null;
  return (fields ?? []) as SiteApplicationFormField[];
}

/** Kurs başvuru formu — Uniboard LMS “Başvuru Formu” sekmesinden yayınlanır */
export async function getPublicFormByCourseSlug(courseSlug: string, locale: string) {
  const supabase = getSiteApplicationsSupabase();

  const { data: course, error: courseError } = await supabase
    .from('myuni_courses')
    .select('id, slug, title, is_active, is_registration_open, price')
    .eq('slug', courseSlug)
    .maybeSingle();

  if (courseError || !course) {
    return null;
  }

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
    const slugs = buildCourseFormSlugs(course.slug);
    const bySlug = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .or(`slug_tr.eq.${slugs.slug_tr},slug_en.eq.${slugs.slug_en}`)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1);
    if (!bySlug.error && bySlug.data?.[0]) {
      form = bySlug.data[0] as Record<string, unknown>;
    }
  }

  // Hakkımızda'dan taşınan formlar: slug/başlık ile kursa bağla
  if (!form) {
    const { data: candidates, error: candidatesError } = await supabase
      .from(siteApplicationsDb.forms)
      .select('*')
      .eq('is_active', true)
      .is('event_id', null)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (!candidatesError && candidates?.length) {
      const match = (candidates as Record<string, unknown>[]).find((row) =>
        formMatchesEntity(row, { slug: course.slug, title: course.title })
      );
      if (match) form = match;
    }
  }

  if (!form) {
    return null;
  }

  const fields = await loadFormFields(form.id);
  if (!fields) return null;

  const publicForm = toPublicForm(
    { ...(form as unknown as SiteApplicationForm), form_type: 'course' },
    fields,
    locale
  );

  return {
    form: {
      ...publicForm,
      course_id: course.id,
      course_slug: course.slug,
      course_title: course.title,
      form_type: 'course' as const,
    },
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      is_active: course.is_active,
      is_registration_open: course.is_registration_open ?? true,
      price: course.price,
    },
    locale,
  };
}

export async function getEventApplicationSummary(eventSlug: string, locale: string) {
  const supabase = getSiteApplicationsSupabase();
  const isEn = locale === 'en';

  const { data: event, error: eventError } = await supabase
    .from('myuni_events')
    .select('id, slug, title')
    .eq('slug', eventSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (eventError || !event) {
    return null;
  }

  let form: {
    id: string;
    title_tr: string;
    title_en: string;
    package_settings: unknown;
    slug_tr?: string;
    slug_en?: string;
    event_id?: string | null;
    form_type?: string | null;
  } | null = null;

  const { data: forms, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, title_tr, title_en, package_settings, slug_tr, slug_en, event_id, form_type')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!formError && forms?.[0]) {
    form = forms[0];
  }

  if (!form) {
    const { data: candidates } = await supabase
      .from(siteApplicationsDb.forms)
      .select('id, title_tr, title_en, package_settings, slug_tr, slug_en, event_id, form_type')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(50);

    const match = (candidates || []).find(
      (row) =>
        !row.event_id &&
        formMatchesEntity(row as Record<string, unknown>, {
          slug: event.slug,
          title: event.title,
        })
    );
    if (match) form = match;
  }

  if (!form) {
    return null;
  }

  const packages: PublicRegistrationPackage[] = getPublicRegistrationPackages(
    parsePackageSettings(form.package_settings),
    locale
  );

  return {
    url: getEventApplicationPath(locale, eventSlug),
    title: event.title,
    formTitle: isEn ? form.title_en : form.title_tr,
    packages,
  };
}
