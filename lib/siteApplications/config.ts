export const siteApplicationsDb = {
  applications: 'myuni_site_applications',
  statusHistory: 'myuni_site_application_status_history',
  forms: 'myuni_site_application_forms',
  formFields: 'myuni_site_application_form_fields',
} as const;

export type SiteApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export const SITE_APPLICATION_MAX_FILE_BYTES = 50 * 1024 * 1024;
export const SITE_APPLICATION_FILE_RETENTION_DAYS = 20;

export const SITE_APPLICATION_STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SITE_APPLICATIONS_BUCKET ||
  process.env.NEXT_PUBLIC_INTERNSHIP_CV_BUCKET ||
  'myunilab';

export const SITE_APPLICATION_STORAGE_FOLDER = 'site-applications';

/** Ekip formları (event_id olmayan) */
export const TEAM_FORM_SLUGS = new Set(['ekip-basvuru', 'team-application']);

export function getEventApplicationPath(locale: string, eventSlug: string): string {
  const segment = locale === 'en' ? 'event' : 'etkinlik';
  return `/${locale}/${segment}/${eventSlug}/basvuru`;
}

export function getSiteApplicationPublicPath(locale: string, slug: string): string {
  return `/${locale}/${slug}`;
}
