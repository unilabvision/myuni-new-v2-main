'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Users,
} from 'lucide-react';

import {
  CatalogEmptyState,
  CatalogHero,
  CatalogLoading,
  CatalogSearch,
  CatalogSectionHeader,
  catalogCardClass,
  catalogFilterClass,
} from '@/app/components/pages/catalog/LearningCatalogUI';

interface MentorshipListPageProps {
  locale?: string;
}

interface MentorshipItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  mentorship_type: string;
  mode: 'online' | 'hybrid' | 'onsite';
  mentor_name: string | null;
  is_featured: boolean;
  thumbnail_url?: string | null;
  banner_url?: string | null;
  mentor_image_url?: string | null;
  is_application_open: boolean;
  url: string;
  application_url: string;
}

const texts = {
  tr: {
    badge: 'MyUNI Mentörlük',
    title: 'Doğru rehberlikle bir sonraki adımınızı netleştirin.',
    subtitle:
      'Deneyimli mentörlerle buluşun; kariyer, akademi ve girişimcilik hedefleriniz için size uygun programı seçin.',
    viewAll: 'Programları incele',
    allTitle: 'Mentörlük programları',
    featuredTitle: 'Öne çıkan programlar',
    featuredDescription:
      'Yeni dönem için öne çıkan mentörlük programlarına yakından bakın.',
    sectionDescription:
      'İhtiyacınıza uygun çalışma biçimini ve uzmanlık alanını seçin.',
    searchPlaceholder: 'Program veya mentör ara',
    typeLabel: 'Alan',
    modeLabel: 'Katılım',
    types: {
      all: 'Tüm alanlar',
      general: 'Genel',
      career: 'Kariyer',
      academic: 'Akademik',
      technical: 'Teknik',
      entrepreneurship: 'Girişimcilik',
    },
    modes: {
      all: 'Tüm katılım türleri',
      online: 'Online',
      hybrid: 'Hibrit',
      onsite: 'Yüz yüze',
    },
    noResults: 'Aramanızla eşleşen program bulunamadı',
    tryDifferent: 'Arama ifadenizi veya seçtiğiniz filtreleri değiştirin.',
    showAll: 'Filtreleri temizle',
    emptyTitle: 'Yeni mentörlük programları hazırlanıyor',
    emptySubtitle: 'Yayınlanan programlar burada yer alacak.',
    registrationOpen: 'Başvuru açık',
    registrationClosed: 'Başvuru kapalı',
    featured: 'Öne çıkan',
    exploreMore: 'Programı incele',
    countLabel: 'program',
    resultLabel: 'sonuç',
    previousProgram: 'Önceki program',
    nextProgram: 'Sonraki program',
    programSlide: 'program',
    asideTitle: 'Size uygun çalışma biçimini seçin',
    openSummary: (count: number) =>
      `${count} program şu anda başvuru kabul ediyor. Program detaylarında mentör, kapsam ve takvim bilgilerini görebilirsiniz.`,
  },
  en: {
    badge: 'MyUNI Mentorship',
    title: 'Clarify your next move with the right guidance.',
    subtitle:
      'Meet experienced mentors and choose a program suited to your career, academic, or entrepreneurial goals.',
    viewAll: 'Browse programs',
    allTitle: 'Mentorship programs',
    featuredTitle: 'Featured programs',
    featuredDescription:
      'Take a closer look at mentorship programs featured for the new term.',
    sectionDescription:
      'Choose the area of expertise and participation format that suits you.',
    searchPlaceholder: 'Search programs or mentors',
    typeLabel: 'Focus',
    modeLabel: 'Format',
    types: {
      all: 'All areas',
      general: 'General',
      career: 'Career',
      academic: 'Academic',
      technical: 'Technical',
      entrepreneurship: 'Entrepreneurship',
    },
    modes: {
      all: 'All formats',
      online: 'Online',
      hybrid: 'Hybrid',
      onsite: 'On-site',
    },
    noResults: 'No programs match your search',
    tryDifferent: 'Try changing your search or selected filters.',
    showAll: 'Clear filters',
    emptyTitle: 'New mentorship programs are in progress',
    emptySubtitle: 'Published programs will appear here.',
    registrationOpen: 'Applications open',
    registrationClosed: 'Applications closed',
    featured: 'Featured',
    exploreMore: 'View program',
    countLabel: 'programs',
    resultLabel: 'results',
    previousProgram: 'Previous program',
    nextProgram: 'Next program',
    programSlide: 'program',
    asideTitle: 'Choose a format that works for you',
    openSummary: (count: number) =>
      `${count} programs are currently accepting applications. View each program for mentor, scope, and schedule details.`,
  },
};

type MentorshipTexts = (typeof texts)[keyof typeof texts];

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, '').trim();
}

function getCover(item: MentorshipItem) {
  return (
    item.banner_url ||
    item.thumbnail_url ||
    item.mentor_image_url ||
    '/default-course.jpg'
  );
}

export default function MentorshipListPage({
  locale = 'tr',
}: MentorshipListPageProps) {
  const [items, setItems] = useState<MentorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeMode, setActiveMode] = useState('all');
  const [query, setQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSliderPaused, setIsSliderPaused] = useState(false);
  const catalogRef = useRef<HTMLElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const loadMentorships = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/public/mentorships?locale=${encodeURIComponent(locale)}`,
        { cache: 'no-store' }
      );
      const payload = await response.json();
      if (!response.ok || payload.success === false) {
        throw new Error(payload.error || 'Failed to load mentorships');
      }

      setItems(
        (payload.mentorships || []).map((row: Record<string, unknown>) => ({
          id: String(row.id),
          slug: String(row.slug || ''),
          title: String(row.title || ''),
          summary: String(row.summary || ''),
          description: String(row.description || ''),
          mentorship_type: String(row.mentorship_type || 'general'),
          mode: (row.mode as MentorshipItem['mode']) || 'online',
          mentor_name: (row.mentor_name as string) || null,
          is_featured: Boolean(row.is_featured),
          thumbnail_url: (row.thumbnail_url as string) || null,
          banner_url: (row.banner_url as string) || null,
          mentor_image_url: (row.mentor_image_url as string) || null,
          is_application_open: row.is_application_open !== false,
          url: String(row.url || ''),
          application_url: String(row.application_url || ''),
        }))
      );
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    loadMentorships();
  }, [loadMentorships]);

  const featuredItems = useMemo(() => {
    const featured = items.filter((item) => item.is_featured);
    return featured.length > 0 ? featured : items.slice(0, 3);
  }, [items]);

  useEffect(() => {
    if (featuredItems.length <= 1 || isSliderPaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % featuredItems.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [featuredItems.length, isSliderPaused]);

  useEffect(() => {
    if (currentSlide >= featuredItems.length) setCurrentSlide(0);
  }, [currentSlide, featuredItems.length]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return items.filter((item) => {
      const matchesType =
        activeType === 'all' || item.mentorship_type === activeType;
      const matchesMode = activeMode === 'all' || item.mode === activeMode;
      const searchableText = [
        item.title,
        item.mentor_name,
        item.summary,
        item.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase(locale);
      return matchesType && matchesMode && searchableText.includes(normalizedQuery);
    });
  }, [activeMode, activeType, items, locale, query]);

  const openApplicationCount = items.filter(
    (item) => item.is_application_open
  ).length;

  const resetFilters = () => {
    setActiveType('all');
    setActiveMode('all');
    setQuery('');
  };

  const showPreviousSlide = () => {
    setCurrentSlide((current) =>
      current === 0 ? featuredItems.length - 1 : current - 1
    );
  };

  const showNextSlide = () => {
    setCurrentSlide((current) => (current + 1) % featuredItems.length);
  };

  const handleSliderTouchEnd = (clientX: number) => {
    if (touchStartRef.current === null) return;
    const distance = touchStartRef.current - clientX;
    if (distance > 50) showNextSlide();
    if (distance < -50) showPreviousSlide();
    touchStartRef.current = null;
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
        asideTitle={t.asideTitle}
        asideDescription={t.openSummary(openApplicationCount)}
        count={items.length}
        countLabel={t.countLabel}
      />

      {featuredItems.length > 0 ? (
        <FeaturedMentorshipSlider
          items={featuredItems}
          currentSlide={currentSlide}
          texts={t}
          onPrevious={showPreviousSlide}
          onNext={showNextSlide}
          onSelect={setCurrentSlide}
          onPauseChange={setIsSliderPaused}
          onTouchStart={(clientX) => {
            touchStartRef.current = clientX;
          }}
          onTouchEnd={handleSliderTouchEnd}
        />
      ) : null}

      <section
        ref={catalogRef}
        className="scroll-mt-20 py-14 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <CatalogSectionHeader
            title={t.allTitle}
            description={t.sectionDescription}
            count={filteredItems.length}
            resultLabel={t.resultLabel}
          />

          <div className="mt-7 space-y-5">
            <CatalogSearch
              value={query}
              onChange={setQuery}
              placeholder={t.searchPlaceholder}
            />

            <div className="grid gap-5 lg:grid-cols-2">
              <FilterGroup
                label={t.typeLabel}
                options={t.types}
                activeValue={activeType}
                onChange={setActiveType}
              />
              <FilterGroup
                label={t.modeLabel}
                options={t.modes}
                activeValue={activeMode}
                onChange={setActiveMode}
              />
            </div>
          </div>

          <div className="mt-10">
            {items.length === 0 ? (
              <CatalogEmptyState
                icon={<Users className="h-5 w-5" aria-hidden="true" />}
                title={t.emptyTitle}
                description={t.emptySubtitle}
              />
            ) : filteredItems.length === 0 ? (
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
                    {t.showAll}
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <MentorshipCard key={item.id} item={item} texts={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function FeaturedMentorshipSlider({
  items,
  currentSlide,
  texts: t,
  onPrevious,
  onNext,
  onSelect,
  onPauseChange,
  onTouchStart,
  onTouchEnd,
}: {
  items: MentorshipItem[];
  currentSlide: number;
  texts: MentorshipTexts;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  onPauseChange: (isPaused: boolean) => void;
  onTouchStart: (clientX: number) => void;
  onTouchEnd: (clientX: number) => void;
}) {
  const item = items[currentSlide];
  if (!item) return null;

  return (
    <section className="border-b border-neutral-200 bg-white py-14 sm:py-16 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-3xl dark:text-white">
              {t.featuredTitle}
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {t.featuredDescription}
            </p>
          </div>
          {items.length > 1 ? (
            <SliderControls
              count={items.length}
              current={currentSlide}
              onPrevious={onPrevious}
              onNext={onNext}
              onSelect={onSelect}
              previousLabel={t.previousProgram}
              nextLabel={t.nextProgram}
              slideLabel={t.programSlide}
            />
          ) : null}
        </div>

        <div
          className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 dark:border-neutral-800"
          onMouseEnter={() => onPauseChange(true)}
          onMouseLeave={() => onPauseChange(false)}
          onFocus={() => onPauseChange(true)}
          onBlur={() => onPauseChange(false)}
          onTouchStart={(event) => onTouchStart(event.touches[0].clientX)}
          onTouchEnd={(event) => onTouchEnd(event.changedTouches[0].clientX)}
          aria-live="polite"
        >
          <Link
            href={item.url}
            className="grid min-h-[440px] md:grid-cols-[1.15fr_0.85fr]"
          >
            <div className="relative min-h-64 overflow-hidden md:min-h-[440px]">
              <Image
                key={item.id}
                src={getCover(item)}
                alt={item.title}
                fill
                priority={currentSlide === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/20" />
              <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-950 backdrop-blur sm:left-6 sm:top-6">
                {item.is_application_open
                  ? t.registrationOpen
                  : t.registrationClosed}
              </span>
            </div>

            <div className="flex flex-col justify-center px-6 py-8 text-white sm:px-9 sm:py-10 lg:px-12">
              <p className="text-sm text-neutral-400">
                {t.modes[item.mode] || item.mode}
              </p>
              <h3 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.025em] sm:text-3xl">
                {item.title}
              </h3>
              {item.mentor_name ? (
                <p className="mt-3 text-sm font-medium text-neutral-300">
                  {item.mentor_name}
                </p>
              ) : null}
              <p className="mt-5 line-clamp-4 text-sm leading-7 text-neutral-300 sm:text-base">
                {stripHtml(item.summary || item.description)}
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white">
                {t.exploreMore}
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function SliderControls({
  count,
  current,
  onPrevious,
  onNext,
  onSelect,
  previousLabel,
  nextLabel,
  slideLabel,
}: {
  count: number;
  current: number;
  onPrevious: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
  previousLabel: string;
  nextLabel: string;
  slideLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onPrevious}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-white dark:hover:text-white"
        aria-label={previousLabel}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: count }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => onSelect(index)}
            className={`h-2 rounded-full transition-[width,background-color] ${
              index === current
                ? 'w-7 bg-[#990000]'
                : 'w-2 bg-neutral-300 hover:bg-neutral-400 dark:bg-neutral-700'
            }`}
            aria-label={`${index + 1}. ${slideLabel}`}
            aria-current={index === current ? 'true' : undefined}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 text-neutral-700 transition-colors hover:border-neutral-950 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-white dark:hover:text-white"
        aria-label={nextLabel}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  activeValue,
  onChange,
}: {
  label: string;
  options: Record<string, string>;
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {Object.entries(options).map(([value, text]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            aria-pressed={activeValue === value}
            className={`${catalogFilterClass} ${
              activeValue === value
                ? 'border-neutral-950 bg-neutral-950 text-white dark:border-white dark:bg-white dark:text-neutral-950'
                : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300'
            }`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function MentorshipCard({
  item,
  texts: t,
}: {
  item: MentorshipItem;
  texts: MentorshipTexts;
}) {
  const description = stripHtml(item.summary || item.description);

  return (
    <Link href={item.url} className={catalogCardClass}>
      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        <Image
          src={getCover(item)}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
          {item.is_featured ? (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm backdrop-blur dark:bg-neutral-950/90 dark:text-white">
              {t.featured}
            </span>
          ) : (
            <span />
          )}
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm ${
              item.is_application_open ? 'bg-emerald-700' : 'bg-neutral-700'
            }`}
          >
            {item.is_application_open
              ? t.registrationOpen
              : t.registrationClosed}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">
          <span>{t.modes[item.mode] || item.mode}</span>
          <span className="h-1 w-1 rounded-full bg-[#990000]" aria-hidden="true" />
          <span>
            {t.types[item.mentorship_type as keyof typeof t.types] ||
              item.mentorship_type}
          </span>
        </div>
        <h3 className="mt-4 text-xl font-semibold leading-7 tracking-[-0.02em] text-neutral-950 group-hover:text-[#990000] dark:text-white dark:group-hover:text-[#e08b94]">
          {item.title}
        </h3>
        {item.mentor_name ? (
          <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {item.mentor_name}
          </p>
        ) : null}
        {description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <span className="text-sm font-semibold text-[#990000] dark:text-[#e08b94]">
            {t.exploreMore}
          </span>
          <ArrowUpRight
            className="h-4 w-4 text-[#990000] dark:text-[#e08b94]"
            aria-hidden="true"
          />
        </div>
      </div>
    </Link>
  );
}
