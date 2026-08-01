/** Staj & Kariyer altındaki UNILAB gönüllü ekip başvurusu sabit slug'ları */
export const UNILAB_VOLUNTEER_SLUG = {
  tr: 'gonullu-ekip-basvurusu',
  en: 'volunteer-team',
} as const;

export function isUnilabVolunteerSlug(slug: string): boolean {
  return (
    slug === UNILAB_VOLUNTEER_SLUG.tr || slug === UNILAB_VOLUNTEER_SLUG.en
  );
}

export function getUnilabVolunteerPath(locale: string): string {
  const base = locale === 'en' ? 'internships' : 'stajlar';
  const slug =
    locale === 'en' ? UNILAB_VOLUNTEER_SLUG.en : UNILAB_VOLUNTEER_SLUG.tr;
  return `/${locale}/${base}/${slug}`;
}

export function getUnilabApplyPath(locale: string): string {
  return locale === 'en'
    ? `/${locale}/team-application`
    : `/${locale}/ekip-basvuru`;
}

export function getUnilabVolunteerMetadata(locale: string) {
  const path = getUnilabVolunteerPath(locale);
  if (locale === 'en') {
    return {
      title: 'UNILAB Vision Volunteer Team Application | MyUNI',
      description:
        'Join the UNILAB Vision volunteer team through MyUNI.',
      path,
    };
  }
  return {
    title: 'UNILAB Vision Gönüllü Ekip Başvurusu | MyUNI',
    description:
      'UNILAB Vision gönüllü ekibine katılın — MyUNI üzerinden başvuru.',
    path,
  };
}
