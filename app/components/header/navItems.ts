import type { PublicSiteApplicationNavForm } from '@/app/types/siteApplicationForms';

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
        { href: '/{locale}/paket', label: 'Eğitim Paketleri' },
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
        { href: '/{locale}/package', label: 'Training Packages' },
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
  _locale: string,
  _siteForms: PublicSiteApplicationNavForm[]
): NavItem[] {
  // Kurs / etkinlik / staj başvuru formları ilgili sayfadaki katılma & satın al
  // butonlarından açılır. Hakkımızda menüsüne dinamik form eklenmez.
  return items;
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
