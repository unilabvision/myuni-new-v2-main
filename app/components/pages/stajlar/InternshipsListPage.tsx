'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Filter,
  Handshake,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import type { OpportunityWithMatch } from '@/lib/types/opportunity';
import { UNILAB_VOLUNTEER_SLUG } from '@/lib/unilabVolunteer';

const UNILAB_VISION_BANNER = '/unilab-vision-banner.png';

interface InternshipsListPageProps {
  locale?: string;
}

type ListItemKind = 'volunteer' | 'internship';

interface ListItem {
  id: string;
  kind: ListItemKind;
  href: string;
  title: string;
  company?: string;
  description?: string;
  location?: string;
  workMode?: string;
  deadline?: string;
  isRecommended?: boolean;
  isFeatured?: boolean;
  matchReasons?: string[];
  logo?: string;
}

const texts = {
  tr: {
    badge: '🚀 Fırsatları keşfet!',
    title:
      'Tamamladığınız eğitimlere göre size özel staj ve gönüllü ekip fırsatlarını keşfedin.',
    subtitle:
      'Staj ilanları ve gönüllü ekip çağrıları tek yerde. Eğitim geçmişinize uyan ilanlar üstte listelenir.',
    viewAll: 'Tüm Fırsatları Görüntüle',
    exploreMore: 'Detayları İncele',
    featuredTitle: 'Öne Çıkanlar',
    featuredEmpty: 'Öne çıkan fırsat yakında eklenecek',
    allTitle: 'Tüm Fırsatlar',
    statOpen: 'Açık Fırsat',
    statVolunteer: 'Gönüllü',
    statMatch: 'Eşleşme',
    kindLabel: 'Fırsat Türü:',
    modeLabel: 'Çalışma Biçimi:',
    kinds: { all: 'Tümü', internship: 'Staj', volunteer: 'Gönüllü' },
    modes: {
      all: 'Tümü',
      remote: 'Uzaktan',
      hybrid: 'Hibrit',
      onsite: 'Yerinde',
    },
    activeFilters: 'Aktif filtreler:',
    loading: 'Fırsatlar yükleniyor...',
    noResults: 'Filtreye uygun fırsat bulunamadı',
    tryDifferent:
      'Farklı bir filtre seçeneğini deneyin veya tüm fırsatları görüntüleyin.',
    showAll: 'Tümünü Göster',
    recommended: 'Sana özel',
    matching: 'Eşleşen eğitim:',
    volunteerBadge: 'Gönüllü',
    internshipBadge: 'Staj',
    open: 'Başvuru Açık',
    deadlineLabel: 'Son başvuru:',
    companyLabel: 'Kurum:',
    modeShort: 'Çalışma:',
    locationLabel: 'Konum:',
    apply: 'Başvur',
  },
  en: {
    badge: '🚀 Explore opportunities!',
    title:
      'Discover internships and volunteer team openings matched to the courses you completed.',
    subtitle:
      'Internship listings and volunteer team calls in one place. Opportunities matching your learning history appear first.',
    viewAll: 'View All Opportunities',
    exploreMore: 'Explore Details',
    featuredTitle: 'Featured',
    featuredEmpty: 'Featured opportunities coming soon',
    allTitle: 'All Opportunities',
    statOpen: 'Open Roles',
    statVolunteer: 'Volunteer',
    statMatch: 'Match Rate',
    kindLabel: 'Opportunity Type:',
    modeLabel: 'Work Mode:',
    kinds: { all: 'All', internship: 'Internship', volunteer: 'Volunteer' },
    modes: {
      all: 'All',
      remote: 'Remote',
      hybrid: 'Hybrid',
      onsite: 'On-site',
    },
    activeFilters: 'Active filters:',
    loading: 'Loading opportunities...',
    noResults: 'No opportunities match this filter',
    tryDifferent: 'Try a different filter option or view all opportunities.',
    showAll: 'Show All',
    recommended: 'For you',
    matching: 'Matching course:',
    volunteerBadge: 'Volunteer',
    internshipBadge: 'Internship',
    open: 'Applications Open',
    deadlineLabel: 'Deadline:',
    companyLabel: 'Organization:',
    modeShort: 'Work mode:',
    locationLabel: 'Location:',
    apply: 'Apply',
  },
};

function opportunityKind(opp: OpportunityWithMatch): ListItemKind {
  const t = (opp.opportunity_type || '').toLowerCase();
  if (t === 'gonullu' || t === 'volunteer') return 'volunteer';
  // Legacy UNILAB slug without type still counts as volunteer
  if (
    opp.slug === UNILAB_VOLUNTEER_SLUG.tr ||
    opp.slug === UNILAB_VOLUNTEER_SLUG.en
  ) {
    return 'volunteer';
  }
  return 'internship';
}

export default function InternshipsListPage({
  locale = 'tr',
}: InternshipsListPageProps) {
  const { isSignedIn } = useUser();
  const [opportunities, setOpportunities] = useState<OpportunityWithMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeKind, setActiveKind] = useState<'all' | ListItemKind>('all');
  const [activeMode, setActiveMode] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  const allItemsRef = useRef<HTMLElement>(null);
  const basePath = locale === 'tr' ? 'stajlar' : 'internships';
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/opportunities?locale=${locale}`);
        const json = await res.json();
        setOpportunities(json.opportunities || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locale, isSignedIn]);

  const items = useMemo<ListItem[]>(() => {
    const mapped = opportunities.map<ListItem>((opp) => {
      const title =
        typeof opp.title === 'object'
          ? opp.title[locale] || opp.title.tr || ''
          : String(opp.title);
      const description =
        opp.description != null && typeof opp.description === 'object'
          ? opp.description[locale] || opp.description.tr || ''
          : String(opp.description ?? '');
      const logo =
        opp.thumbnail_url?.trim() ||
        opp.banner_url?.trim() ||
        undefined;

      return {
        id: opp.id,
        kind: opportunityKind(opp),
        href: `/${locale}/${basePath}/${opp.slug}`,
        title,
        company: opp.company_name || undefined,
        description,
        location: opp.location || undefined,
        workMode: opp.work_mode || undefined,
        deadline: opp.application_deadline || undefined,
        isRecommended: opp.is_recommended,
        isFeatured: Boolean(opp.is_featured),
        matchReasons: opp.match_reasons,
        logo,
      };
    });

    return [
      ...mapped.filter((i) => i.isRecommended),
      ...mapped.filter((i) => !i.isRecommended),
    ];
  }, [opportunities, locale, basePath]);

  const featuredItems = useMemo(() => {
    const featured = items.filter((i) => i.isFeatured);
    if (featured.length > 0) return featured;
    const recommended = items.filter((i) => i.isRecommended);
    if (recommended.length > 0) return recommended.slice(0, 3);
    return items.slice(0, 1);
  }, [items]);

  useEffect(() => {
    if (featuredItems.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  const filteredItems = items.filter((item) => {
    const kindMatch = activeKind === 'all' || item.kind === activeKind;
    const modeMatch = activeMode === 'all' || item.workMode === activeMode;
    return kindMatch && modeMatch;
  });

  const volunteerCount = items.filter((i) => i.kind === 'volunteer').length;
  const recommendedCount = items.filter((i) => i.isRecommended).length;

  const scrollToAll = () => {
    allItemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const modeText = (mode?: string) =>
    mode
      ? t.modes[mode as keyof typeof t.modes] || mode
      : undefined;

  const OpportunityCard = ({ item }: { item: ListItem }) => {
    const isVolunteer = item.kind === 'volunteer';

    return (
      <Link
        href={item.href}
        className="bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group flex flex-col"
      >
        {/* Media header — event card ile aynı oran */}
        <div
          className={`relative w-full h-48 overflow-hidden flex items-center justify-center ${
            item.logo
              ? 'bg-white'
              : 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800'
          }`}
        >
          {item.logo ? (
            <Image
              src={item.logo}
              alt={item.company || item.title}
              width={1024}
              height={300}
              className="w-[78%] max-h-[52%] object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Briefcase className="w-14 h-14 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 group-hover:scale-105" />
          )}

          <div className="absolute top-3 left-3">
            <div className="bg-white/90 text-neutral-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              {isVolunteer ? (
                <Handshake className="w-4 h-4" />
              ) : (
                <Briefcase className="w-4 h-4" />
              )}
              {isVolunteer ? t.volunteerBadge : t.internshipBadge}
            </div>
          </div>

          <div className="absolute top-3 right-3">
            {item.isRecommended ? (
              <div className="bg-[#990000] text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t.recommended}
              </div>
            ) : (
              <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                {t.open}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {modeText(item.workMode) && (
              <span className="inline-block px-3 py-1 rounded-lg text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {modeText(item.workMode)}
              </span>
            )}
          </div>

          <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
              {item.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {item.company && (
              <div>
                <span className="font-medium">{t.companyLabel}</span>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {item.company}
                </p>
              </div>
            )}
            {item.location && (
              <div>
                <span className="font-medium">{t.locationLabel}</span>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {item.location}
                </p>
              </div>
            )}
            {item.deadline && (
              <div>
                <span className="font-medium">{t.deadlineLabel}</span>
                <p className="text-neutral-700 dark:text-neutral-300">
                  {formatDate(item.deadline)}
                </p>
              </div>
            )}
          </div>

          {item.matchReasons && item.matchReasons.length > 0 && (
            <p className="text-xs text-[#990000] mb-4">
              {t.matching} {item.matchReasons.join(', ')}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              {item.location && (
                <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {item.location}
                </span>
              )}
            </div>
            <button className="text-[#990000] hover:text-[#cc0000] transition-colors text-sm font-medium flex items-center">
              {isVolunteer ? t.exploreMore : t.apply}
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-6" />
              <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6" />
            </div>
            <div className="order-1 lg:order-2">
              <div className="h-[400px] lg:h-[500px] bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl px-6 container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left order-2 lg:order-1">
              <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
                {t.badge}
              </div>

              <h1 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
                {t.title}
              </h1>

              <div className="w-16 h-px bg-[#990000] mb-6" />

              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
                {t.subtitle}
              </p>

              <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {items.length}
                  </span>
                  <span>{t.statOpen}</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {volunteerCount}
                  </span>
                  <span>{t.statVolunteer}</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {recommendedCount}
                  </span>
                  <span>{t.statMatch}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={scrollToAll}
                  className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-md py-3 px-8 text-md font-medium flex items-center justify-center transition-colors"
                >
                  {t.viewAll}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>

                {featuredItems[0] && (
                  <Link
                    href={featuredItems[0].href}
                    className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-md py-3 px-8 text-md font-medium transition-colors text-center"
                  >
                    {t.exploreMore}
                  </Link>
                )}
              </div>
            </div>

            {/* Featured carousel */}
            <div className="order-1 lg:order-2">
              {featuredItems.length > 0 ? (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg">
                  <div className="p-6 lg:p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                      <h3 className="text-lg lg:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.featuredTitle}
                      </h3>
                      {featuredItems.length > 1 && (
                        <div className="flex space-x-2">
                          {featuredItems.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              aria-label={`Slide ${index + 1}`}
                              onClick={() => setCurrentSlide(index)}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide
                                  ? 'bg-[#990000] w-6'
                                  : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 relative overflow-hidden min-h-0">
                      <div
                        className="flex transition-transform duration-500 ease-out h-full"
                        style={{
                          transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                      >
                        {featuredItems.map((item) => {
                          const isVolunteer = item.kind === 'volunteer';
                          return (
                            <div
                              key={item.id}
                              className="w-full flex-shrink-0 h-full"
                            >
                              <Link
                                href={item.href}
                                className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 block cursor-pointer group"
                              >
                                <div
                                  className={`relative h-32 lg:h-48 overflow-hidden flex-shrink-0 flex items-center justify-center ${
                                    item.logo
                                      ? 'bg-white'
                                      : 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-600 dark:to-neutral-700'
                                  }`}
                                >
                                  {item.logo ? (
                                    <Image
                                      src={
                                        item.kind === 'volunteer' &&
                                        item.href.includes(
                                          locale === 'en'
                                            ? UNILAB_VOLUNTEER_SLUG.en
                                            : UNILAB_VOLUNTEER_SLUG.tr
                                        )
                                          ? UNILAB_VISION_BANNER
                                          : item.logo
                                      }
                                      alt={item.company || item.title}
                                      width={1024}
                                      height={300}
                                      className="w-[78%] max-h-[55%] object-contain transition-transform duration-300 group-hover:scale-105"
                                      priority
                                    />
                                  ) : (
                                    <Briefcase className="w-14 h-14 text-neutral-400" />
                                  )}
                                  <div className="absolute top-3 left-3">
                                    <div className="bg-white/90 text-neutral-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                      {isVolunteer ? (
                                        <Handshake className="w-4 h-4" />
                                      ) : (
                                        <Briefcase className="w-4 h-4" />
                                      )}
                                      {isVolunteer
                                        ? t.volunteerBadge
                                        : t.internshipBadge}
                                    </div>
                                  </div>
                                  <div className="absolute top-3 right-3">
                                    {item.isRecommended ? (
                                      <div className="bg-[#990000] text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" />
                                        {t.recommended}
                                      </div>
                                    ) : (
                                      <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                        {t.open}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="p-4 lg:p-6 flex-1 flex flex-col min-h-0">
                                  {modeText(item.workMode) && (
                                    <div className="mb-2 lg:mb-3 flex-shrink-0">
                                      <span className="inline-block px-2 py-1 lg:px-3 rounded-lg text-xs lg:text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {modeText(item.workMode)}
                                      </span>
                                    </div>
                                  )}

                                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base lg:text-lg mb-2 lg:mb-3 leading-tight group-hover:text-[#990000] transition-colors flex-shrink-0">
                                    {item.title}
                                  </h4>

                                  {item.description && (
                                    <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-300 mb-3 lg:mb-4 flex-1 leading-relaxed overflow-hidden line-clamp-3">
                                      {item.description}
                                    </p>
                                  )}

                                  <div className="grid grid-cols-2 gap-2 text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mb-3 lg:mb-4 flex-shrink-0">
                                    {item.company && (
                                      <div>
                                        <span className="font-medium block">
                                          {t.companyLabel}
                                        </span>
                                        <span className="text-neutral-700 dark:text-neutral-200">
                                          {item.company}
                                        </span>
                                      </div>
                                    )}
                                    {item.location && (
                                      <div>
                                        <span className="font-medium block">
                                          {t.locationLabel}
                                        </span>
                                        <span className="text-neutral-700 dark:text-neutral-200">
                                          {item.location}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between flex-shrink-0 mt-auto">
                                    <span className="flex items-center text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                                      {item.location ? (
                                        <>
                                          <MapPin className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                          {item.location}
                                        </>
                                      ) : item.company ? (
                                        <>
                                          <Building2 className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                          {item.company}
                                        </>
                                      ) : null}
                                    </span>
                                    <span className="text-[#990000] hover:text-[#cc0000] transition-colors text-xs lg:text-sm font-medium flex items-center flex-shrink-0">
                                      {isVolunteer ? t.exploreMore : t.apply}
                                      <ArrowRight className="w-3 h-3 ml-1" />
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                  <p className="text-neutral-500 dark:text-neutral-400 px-6 text-center">
                    {t.featuredEmpty}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All opportunities */}
      <section
        ref={allItemsRef}
        className="py-16 bg-white dark:bg-neutral-900"
      >
        <div className="max-w-7xl px-6 mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.allTitle} ({filteredItems.length})
              </h2>

              {(activeKind !== 'all' || activeMode !== 'all') && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {t.activeFilters}
                  </span>
                  {activeKind !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.kinds[activeKind]}
                    </span>
                  )}
                  {activeMode !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.modes[activeMode as keyof typeof t.modes]}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="w-16 h-px bg-[#990000] mb-8" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <Filter className="w-4 h-4 mr-2 text-neutral-600 dark:text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t.kindLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    Object.entries(t.kinds) as [
                      'all' | ListItemKind,
                      string,
                    ][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveKind(key)}
                      className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                        activeKind === key
                          ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center mb-3">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {t.modeLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(t.modes).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveMode(key)}
                      className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                        activeMode === key
                          ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.noResults}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t.tryDifferent}
              </p>
              <button
                onClick={() => {
                  setActiveKind('all');
                  setActiveMode('all');
                }}
                className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                {t.showAll}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
