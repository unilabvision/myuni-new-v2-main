'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown, Layers3, RotateCcw } from 'lucide-react';

import {
  CatalogEmptyState,
  CatalogHero,
  CatalogLoading,
  CatalogSearch,
  CatalogSectionHeader,
  catalogCardClass,
  catalogFilterClass,
} from '@/app/components/pages/catalog/LearningCatalogUI';

interface PackageFaq {
  question: string;
  answer: string;
}

interface PackageListPageProps {
  locale?: string;
  faqs?: PackageFaq[];
}

interface PackageItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  original_price?: number | null;
  level?: string;
  thumbnail_url?: string;
  banner_url?: string;
  included_courses?: Array<{
    id: string;
    title: string;
    slug: string;
    level?: string;
  }>;
}

const texts = {
  tr: {
    badge: 'MyUNI Eğitim Paketleri',
    title: 'Bir hedefe giden eğitimleri tek bir öğrenme yolunda tamamlayın.',
    subtitle:
      'Birbiriyle ilişkili kursları bir araya getiren paketleri inceleyin; size uygun seviyeden başlayıp düzenli ilerleyin.',
    geoIntroTitle: 'Tek tek kurs seçmek yerine planlı ilerleyin',
    geoIntro:
      'Her paket, aynı beceri veya kariyer hedefini destekleyen eğitimleri bir araya getirir. Paket içeriğini, seviyesini ve ücretini karşılaştırarak size uygun yolu seçebilirsiniz.',
    faqTitle: 'Merak edilenler',
    viewAll: 'Paketleri incele',
    exploreMore: 'Paketi incele',
    allTitle: 'Eğitim paketleri',
    sectionDescription:
      'İçeriği, seviyeyi ve fiyatı karşılaştırarak öğrenme yolunuzu seçin.',
    searchPlaceholder: 'Eğitim paketi ara',
    emptyTitle: 'Yeni eğitim paketleri hazırlanıyor',
    emptySubtitle: 'Yayınlanan paketler burada yer alacak.',
    noResults: 'Aramanızla eşleşen paket bulunamadı',
    tryDifferent: 'Arama ifadenizi veya seviye filtresini değiştirin.',
    reset: 'Filtreleri temizle',
    packageBadge: 'Eğitim paketi',
    courseCount: 'eğitim içerir',
    free: 'Ücretsiz',
    allLevels: 'Tüm seviyeler',
    levelLabel: 'Seviye',
    countLabel: 'paket',
    resultLabel: 'sonuç',
  },
  en: {
    badge: 'MyUNI Training Packages',
    title: 'Complete the courses for one goal through a single learning path.',
    subtitle:
      'Explore packages that bring related courses together, start at the right level, and make steady progress.',
    geoIntroTitle: 'Follow a clear path instead of choosing courses one by one',
    geoIntro:
      'Each package combines courses that support the same skill or career goal. Compare the content, level, and price to choose the path that works for you.',
    faqTitle: 'Common questions',
    viewAll: 'Browse packages',
    exploreMore: 'View package',
    allTitle: 'Training packages',
    sectionDescription:
      'Compare content, level, and price to choose your learning path.',
    searchPlaceholder: 'Search training packages',
    emptyTitle: 'New training packages are in progress',
    emptySubtitle: 'Published packages will appear here.',
    noResults: 'No packages match your search',
    tryDifferent: 'Try changing your search or level filter.',
    reset: 'Clear filters',
    packageBadge: 'Training package',
    courseCount: 'courses included',
    free: 'Free',
    allLevels: 'All levels',
    levelLabel: 'Level',
    countLabel: 'packages',
    resultLabel: 'results',
  },
};

type PackageTexts = (typeof texts)[keyof typeof texts];

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, '').trim();
}

function formatPrice(value: number, locale: string) {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export default function PackageListPage({
  locale = 'tr',
  faqs = [],
}: PackageListPageProps) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeLevel, setActiveLevel] = useState('all');
  const catalogRef = useRef<HTMLElement>(null);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const detailSegment = locale === 'en' ? 'package' : 'paket';

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/public/courses?locale=${encodeURIComponent(locale)}`
        );
        const payload = await response.json();
        setPackages(
          response.ok && payload.success && Array.isArray(payload.packages)
            ? payload.packages
            : []
        );
      } catch (error) {
        console.error(error);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };

    loadPackages();
  }, [locale]);

  const levels = useMemo(
    () =>
      Array.from(
        new Set(packages.map((item) => item.level).filter(Boolean) as string[])
      ),
    [packages]
  );

  const filteredPackages = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return packages.filter((item) => {
      const matchesLevel = activeLevel === 'all' || item.level === activeLevel;
      const searchableText = `${item.title} ${stripHtml(item.description)}`.toLocaleLowerCase(
        locale
      );
      return matchesLevel && searchableText.includes(normalizedQuery);
    });
  }, [activeLevel, locale, packages, query]);

  const resetFilters = () => {
    setQuery('');
    setActiveLevel('all');
  };

  if (loading) return <CatalogLoading />;

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <CatalogHero
        badge={t.badge}
        title={t.title}
        description={t.subtitle}
        actionLabel={t.viewAll}
        onAction={() =>
          catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
        asideTitle={t.geoIntroTitle}
        asideDescription={t.geoIntro}
        count={packages.length}
        countLabel={t.countLabel}
      />

      <section
        ref={catalogRef}
        className="scroll-mt-20 py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CatalogSectionHeader
            title={t.allTitle}
            description={t.sectionDescription}
            count={filteredPackages.length}
            resultLabel={t.resultLabel}
          />

          <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end">
            <CatalogSearch
              value={query}
              onChange={setQuery}
              placeholder={t.searchPlaceholder}
            />
            {levels.length > 0 ? (
              <div className="lg:max-w-[55%]">
                <p className="mb-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                  {t.levelLabel}
                </p>
                <div className="flex flex-wrap gap-2">
                  {['all', ...levels].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setActiveLevel(level)}
                      aria-pressed={activeLevel === level}
                      className={`${catalogFilterClass} ${
                        activeLevel === level
                          ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300'
                      }`}
                    >
                      {level === 'all' ? t.allLevels : level}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-10">
            {packages.length === 0 ? (
              <CatalogEmptyState
                icon={<Layers3 className="h-5 w-5" aria-hidden="true" />}
                title={t.emptyTitle}
                description={t.emptySubtitle}
              />
            ) : filteredPackages.length === 0 ? (
              <CatalogEmptyState
                icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
                title={t.noResults}
                description={t.tryDifferent}
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm font-semibold text-[#990000] underline decoration-[#990000]/30 underline-offset-4 hover:decoration-[#990000] dark:text-[#e08b94]"
                  >
                    {t.reset}
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredPackages.map((item) => (
                  <PackageCard
                    key={item.id}
                    item={item}
                    href={`/${locale}/${detailSegment}/${item.slug}`}
                    locale={locale}
                    texts={t}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="border-t border-neutral-200 bg-neutral-50 py-16 sm:py-20 dark:border-neutral-800 dark:bg-neutral-900/40">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-neutral-950 dark:text-white">
              {t.faqTitle}
            </h2>
            <div className="divide-y divide-neutral-200 border-y border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base font-semibold text-neutral-950 marker:hidden dark:text-white">
                    <span>{faq.question}</span>
                    <ChevronDown
                      className="h-5 w-5 shrink-0 text-neutral-400 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="max-w-2xl pt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-400">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function PackageCard({
  item,
  href,
  locale,
  texts: t,
}: {
  item: PackageItem;
  href: string;
  locale: string;
  texts: PackageTexts;
}) {
  const description = stripHtml(item.description);

  return (
    <Link href={href} className={catalogCardClass}>
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={item.thumbnail_url || item.banner_url || '/default-course.jpg'}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={80}
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur dark:bg-neutral-950/90 dark:text-white">
          {t.packageBadge}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {item.level || t.allLevels}
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-7 tracking-[-0.02em] text-neutral-950 group-hover:text-[#990000] dark:text-white dark:group-hover:text-[#e08b94]">
          {item.title}
        </h3>
        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        ) : null}

        {item.included_courses?.length ? (
          <div className="mt-4 rounded-lg bg-neutral-50 px-3 py-3 dark:bg-neutral-800/70">
            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-200">
              {item.included_courses.length} {t.courseCount}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-500 dark:text-neutral-400">
              {item.included_courses.map((course) => course.title).join(' · ')}
            </p>
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <div>
            <p className="text-lg font-semibold text-neutral-950 dark:text-white">
              {Number(item.price) === 0
                ? t.free
                : formatPrice(item.price, locale)}
            </p>
            {item.original_price ? (
              <p className="mt-0.5 text-xs text-neutral-400 line-through">
                {formatPrice(item.original_price, locale)}
              </p>
            ) : null}
          </div>
          <span className="flex items-center gap-2 text-sm font-semibold text-[#990000] dark:text-[#e08b94]">
            {t.exploreMore}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
