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
  getSiteApplicationPublicPath,
  siteApplicationsDb,
} from './config';
import { getTeamFormPublicPath } from './teamPaths';
import {
  getPublicRegistrationPackages,
  parsePackageSettings,
} from './packages';
import type { PublicRegistrationPackage } from '@/app/types/siteApplicationForms';

type FormWithEvent = {
  id: string;
  slug_tr: string;
  slug_en: string;
  title_tr: string;
  title_en: string;
  subtitle_tr: string | null;
  subtitle_en: string | null;
  event_id: string | null;
  myuni_events: {
    slug: string;
    title: string;
    is_active: boolean;
  } | null;
};

export async function getVisibleSiteApplicationForms(
  locale: string
): Promise<PublicSiteApplicationNavForm[]> {
  try {
    const supabase = getSiteApplicationsSupabase();
    const isEn = locale === 'en';

    const { data, error } = await supabase
      .from(siteApplicationsDb.forms)
      .select(
        'id, slug_tr, slug_en, title_tr, title_en, subtitle_tr, subtitle_en, event_id, myuni_events ( slug, title, is_active )'
      )
      .eq('is_active', true)
      .eq('show_on_website', true)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[siteApplications] visible forms fetch error:', error?.message);
      return [];
    }

    const results: PublicSiteApplicationNavForm[] = [];

    for (const row of data as FormWithEvent[]) {
      const slug = isEn ? row.slug_en : row.slug_tr;

      if (row.event_id) {
        continue;
      }

      results.push({
        id: row.id,
        slug,
        title: isEn ? row.title_en : row.title_tr,
        subtitle: isEn ? row.subtitle_en : row.subtitle_tr,
        url: getTeamFormPublicPath(locale, slug),
        navSection: 'about',
      });
    }

    return results;
  } catch (err) {
    console.error('[siteApplications] visible forms error:', err);
    return [];
  }
}

export async function getPublicFormByEventSlug(eventSlug: string, locale: string) {
  const supabase = getSiteApplicationsSupabase();

  const { data: event, error: eventError } = await supabase
    .from('myuni_events')
    .select('id, slug, title, is_active')
    .eq('slug', eventSlug)
    .eq('is_active', true)
    .single();

  if (eventError || !event) {
    return null;
  }

  const { data: forms, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('*')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (formError) {
    return null;
  }
  const form = forms?.[0];
  if (!form) {
    return null;
  }

  const { data: fields, error: fieldsError } = await supabase
    .from(siteApplicationsDb.formFields)
    .select('*')
    .eq('form_id', form.id)
    .order('order_index', { ascending: true });

  if (fieldsError) {
    return null;
  }

  const publicForm = toPublicForm(
    form as SiteApplicationForm,
    (fields ?? []) as SiteApplicationFormField[],
    locale
  );

  return {
    form: {
      ...publicForm,
      event_id: event.id,
      event_slug: event.slug,
      event_title: event.title,
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

  const { data: forms, error: formError } = await supabase
    .from(siteApplicationsDb.forms)
    .select('id, title_tr, title_en, package_settings')
    .eq('event_id', event.id)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (formError) {
    return null;
  }
  const form = forms?.[0];
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
