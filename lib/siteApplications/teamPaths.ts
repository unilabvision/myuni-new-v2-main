import { getSiteApplicationPublicPath } from './config';

export const TEAM_FORM_LEGACY_SLUGS = {
  tr: 'ekip-basvuru',
  en: 'team-application',
} as const;

export function getTeamFormPublicPath(locale: string, slug: string): string {
  if (slug === TEAM_FORM_LEGACY_SLUGS.tr || slug === TEAM_FORM_LEGACY_SLUGS.en) {
    return `/${locale}/${slug}`;
  }
  return getSiteApplicationPublicPath(locale, slug);
}
