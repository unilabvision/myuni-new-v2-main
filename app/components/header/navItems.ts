import type { PublicSiteApplicationNavForm } from '@/app/types/siteApplicationForms';
import { TEAM_FORM_SLUGS } from '@/lib/siteApplications/config';

export interface NavItem {
  href: string;
  label: string;
  children?: NavItem[];
}

const baseNavItems: Record<string, NavItem[]> = {
  tr: [
    { href: '/{locale}', label: 'Ana Sayfa' },
    {
      href: '/{locale}/kurs',
      label: 'Kurslar',
      children: [
        { href: '/{locale}/kurs', label: 'Tüm Kurslar' },
        { href: '/{locale}/mentorluk', label: 'Mentörlükler' },
      ],
    },
    { href: '/{locale}/etkinlik', label: 'Etkinlikler', navKey: 'events' } as NavItem & { navKey?: string },
    { href: '/{locale}/collection', label: 'Koleksiyon' },
    { href: '/{locale}/stajlar', label: 'Staj & Kariyer' },
    {
      href: '/{locale}/hakkimizda',
      label: 'Hakkımızda',
      navKey: 'about',
      children: [
        { href: '/{locale}/hakkimizda', label: 'Biz Kimiz' },
        { href: '/{locale}/egitmen-ol', label: 'Eğitmen Ol' },
        { href: '/{locale}/bultenimiz', label: 'Bültenimiz' },
        { href: '/{locale}/gizlilik', label: 'Gizlilik Politikası' },
        {
          href: '/{locale}/sartlar-ve-kosullar',
          label: 'Kullanım Koşulları',
        },
        {
          href: '/{locale}/iptal-iade',
          label: 'İptal ve İade Politikası',
        },
        { href: '/{locale}/sss', label: 'Sık Sorulan Sorular' },
      ],
    } as NavItem & { navKey?: string },
    { href: '/{locale}/blog', label: 'Blog' },
    { href: '/{locale}/iletisim', label: 'İletişim' },
  ],
  en: [
    { href: '/{locale}', label: 'Home' },
    {
      href: '/{locale}/course',
      label: 'Courses',
      children: [
        { href: '/{locale}/course', label: 'All Courses' },
        { href: '/{locale}/mentorship', label: 'Mentorships' },
      ],
    },
    { href: '/{locale}/event', label: 'Events', navKey: 'events' } as NavItem & { navKey?: string },
    { href: '/{locale}/collection', label: 'Collection' },
    { href: '/{locale}/internships', label: 'Internships & Career' },
    {
      href: '/{locale}/about',
      label: 'About Us',
      navKey: 'about',
      children: [
        { href: '/{locale}/about', label: 'Who We Are' },
        { href: '/{locale}/egitmen-ol', label: 'Become an Instructor' },
        { href: '/{locale}/newsletter', label: 'Newsletter' },
        { href: '/{locale}/privacy', label: 'Privacy Policy' },
        { href: '/{locale}/terms', label: 'Terms of Use' },
        { href: '/{locale}/iptal-iade', label: 'Cancellation & Refund' },
        { href: '/{locale}/sss', label: 'FAQ' },
      ],
    } as NavItem & { navKey?: string },
    { href: '/{locale}/projects', label: 'Projects' },
    { href: '/{locale}/blog', label: 'Blog' },
    { href: '/{locale}/contact', label: 'Contact' },
  ],
};

function localizeHref(href: string, locale: string): string {
  return href.replace(/\{locale\}/g, locale);
}

function localizeItems(items: NavItem[], locale: string): NavItem[] {
  return items.map((item) => ({
    ...item,
    href: localizeHref(item.href, locale),
    children: item.children?.map((child) => ({
      ...child,
      href: localizeHref(child.href, locale),
    })),
  }));
}

function injectSiteForms(
  items: NavItem[],
  locale: string,
  siteForms: PublicSiteApplicationNavForm[]
): NavItem[] {
  // Team forms (UNILAB vb.) Staj Fırsatları'nda iş ortaklığı olarak gösterilir; Hakkımızda'ya eklenmez
  const aboutForms = siteForms.filter(
    (f) => f.navSection === 'about' && !TEAM_FORM_SLUGS.has(f.slug)
  );

  return items.map((item) => {
    const navKey = (item as NavItem & { navKey?: string }).navKey;

    if (navKey === 'about' && aboutForms.length > 0 && item.children) {
      const staticHrefs = new Set(item.children.map((child) => child.href));
      const dynamicTeamForms = aboutForms
        .filter((form) => !staticHrefs.has(form.url))
        .map((form) => ({
          href: form.url,
          label: form.title,
        }));

      return {
        ...item,
        children: [...item.children, ...dynamicTeamForms],
      };
    }

    return item;
  });
}

export function getNavItems(
  locale: string,
  siteForms: PublicSiteApplicationNavForm[] = []
): NavItem[] {
  const template = baseNavItems[locale] || baseNavItems.tr;
  const localized = localizeItems(template, locale);
  return injectSiteForms(localized, locale, siteForms);
}

export const navLinkClassName =
  'text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors duration-200';
