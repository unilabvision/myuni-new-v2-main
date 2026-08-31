'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Filter,
  Search,
  Users,
} from 'lucide-react';
import { mapLevelToLocale } from '@/lib/courseService';

interface MentorshipListPageProps {
  locale?: string;
}

interface MentorshipItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  course_type: 'online' | 'live' | 'hybrid';
  featured: boolean;
  image?: string;
  thumbnail_url?: string;
  banner_url?: string;
  price: number;
  duration?: string;
  is_registration_open: boolean;
}

const texts = {
  tr: {
    badge: 'Mentörlük',
    title:
      'Alanında uzman mentörlerle birebir gelişim programlarını keşfedin.',
    subtitle:
      'Kariyer hedeflerinize özel mentörlük programlarıyla rehberlik alın. Yakında burada listelenecek.',
    viewAll: 'Tüm Mentörlükleri Görüntüle',
    exploreMore: 'Detayları İncele',
    featuredTitle: 'Öne Çıkanlar',
    featuredEmpty: 'Öne çıkan mentörlük yakında eklenecek',
    allTitle: 'Tüm Mentörlükler',
    statOpen: 'Program',
    statFeatured: 'Öne Çıkan',
    statOpenReg: 'Kayıt Açık',
    levelLabel: 'Seviye:',
    typeLabel: 'Program Tipi:',
    levels: {
      all: 'Tümü',
      beginner: 'Başlangıç',
      intermediate: 'Orta Seviye',
      advanced: 'İleri Seviye',
      mixed: 'Karma',
    },
    types: {
      all: 'Tümü',
      online: 'Online',
      live: 'Canlı',
      hybrid: 'Hibrit',
    },
    activeFilters: 'Aktif filtreler:',
    loading: 'Mentörlükler yükleniyor...',
    noResults: 'Filtreye uygun mentörlük bulunamadı',
    tryDifferent:
      'Farklı bir filtre seçeneğini deneyin veya tüm mentörlükleri görüntüleyin.',
    showAll: 'Tümünü Göster',
    emptyTitle: 'Yakında mentörlükler listelenecektir',
    emptySubtitle:
      'Mentörlük programlarımız hazırlanıyor; yakında burada yer alacak.',
    registrationOpen: 'Kayıt Açık',
    registrationClosed: 'Kayıt Kapalı',
    free: 'Ücretsiz',
    currency: '₺',
  },
  en: {
    badge: 'Mentorship',
    title: 'Discover one-to-one development programs with expert mentors.',
    subtitle:
      'Get guided support with mentorship programs tailored to your career goals. They will be listed here soon.',
    viewAll: 'View All Mentorships',
    exploreMore: 'Explore Details',
    featuredTitle: 'Featured',
    featuredEmpty: 'Featured mentorships coming soon',
    allTitle: 'All Mentorships',
    statOpen: 'Programs',
    statFeatured: 'Featured',
    statOpenReg: 'Open',
    levelLabel: 'Level:',
    typeLabel: 'Program Type:',
    levels: {
      all: 'All',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      mixed: 'Mixed',
    },
    types: {
      all: 'All',
      online: 'Online',
      live: 'Live',
      hybrid: 'Hybrid',
    },
    activeFilters: 'Active filters:',
    loading: 'Loading mentorships...',
    noResults: 'No mentorships match this filter',
    tryDifferent: 'Try a different filter or view all mentorships.',
    showAll: 'Show All',
    emptyTitle: 'Mentorships will be listed soon',
    emptySubtitle:
      'Our mentorship programs are being prepared and will appear here soon.',
    registrationOpen: 'Registration Open',
    registrationClosed: 'Registration Closed',
    free: 'Free',
    currency: '₺',
  },
};

export default function MentorshipListPage({
  locale = 'tr',
}: MentorshipListPageProps) {
  const [items, setItems] = useState<MentorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const allItemsRef = useRef<HTMLElement>(null);

  const t = texts[locale as keyof typeof texts] || texts.tr;
  const detailPath = locale === 'en' ? 'course' : 'kurs';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/courses?locale=${encodeURIComponent(locale)}&program_type=mentorship`,
        { cache: 'no-store' }
      );
      const payload = await res.json();
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to load mentorships');
      }

      const mapped: MentorshipItem[] = (payload.courses || []).map(
        (course: Record<string, unknown>) => {
          const title = String(course.title || course.name || '');
          return {
            id: String(course.id),
            slug: String(course.slug || ''),
            title,
            description: String(course.description || ''),
            level: mapLevelToLocale(String(course.level || ''), locale),
            course_type: (course.course_type as MentorshipItem['course_type']) || 'online',
            featured: Boolean(course.featured),
            image: (course.image as string) || undefined,
            thumbnail_url: (course.thumbnail_url as string) || undefined,
            banner_url: (course.banner_url as string) || undefined,
            price: Number(course.price || 0),
            duration: (course.duration as string) || undefined,
            is_registration_open: course.is_registration_open !== false,
          };
        }
      );
      setItems(mapped);
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  const featuredItems = useMemo(() => {
    const featured = items.filter((i) => i.featured);
    if (featured.length > 0) return featured;
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
    let levelMatch = true;
    if (activeLevel !== 'all') {
      const levelKey = item.level.toLowerCase();
      const map: Record<string, string[]> = {
        beginner: ['başlangıç', 'beginner'],
        intermediate: ['orta', 'intermediate'],
        advanced: ['ileri', 'advanced'],
        mixed: ['karma', 'mixed'],
      };
      levelMatch = (map[activeLevel] || []).some((k) => levelKey.includes(k));
    }
    const typeMatch = activeType === 'all' || item.course_type === activeType;
    return levelMatch && typeMatch;
  });

  const openRegCount = items.filter((i) => i.is_registration_open).length;

  const scrollToAll = () => {
    allItemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const coverOf = (item: MentorshipItem) =>
    item.image || item.thumbnail_url || item.banner_url || '/default-course.jpg';

  const MentorshipCard = ({ item }: { item: MentorshipItem }) => (
    <Link
      href={`/${locale}/${detailPath}/${item.slug}`}
      className="bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group flex flex-col"
    >
      <div className="relative w-full h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-700">
        <Image
          src={coverOf(item)}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute top-3 left-3">
          <div className="bg-white/90 text-neutral-800 px-2 py-1 rounded text-xs font-medium">
            {item.level}
          </div>
        </div>
        <div className="absolute top-3 right-3">
          <div
            className={`px-2 py-1 rounded text-xs font-medium text-white ${
              item.is_registration_open ? 'bg-green-600' : 'bg-neutral-500'
            }`}
          >
            {item.is_registration_open
              ? t.registrationOpen
              : t.registrationClosed}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3">
          <span className="inline-block px-3 py-1 rounded-lg text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {t.types[item.course_type]}
          </span>
        </div>
        <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
            {item.description.replace(/<[^>]+>/g, '')}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {item.price > 0
              ? `${t.currency}${item.price}`
              : t.free}
          </span>
          <span className="text-[#990000] text-sm font-medium flex items-center">
            {t.exploreMore}
            <ArrowRight className="w-3 h-3 ml-1" />
          </span>
        </div>
      </div>
    </Link>
  );

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
      {/* Hero — same structure as Staj & Kariyer */}
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
                    {featuredItems.length}
                  </span>
                  <span>{t.statFeatured}</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {openRegCount}
                  </span>
                  <span>{t.statOpenReg}</span>
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
                    href={`/${locale}/${detailPath}/${featuredItems[0].slug}`}
                    className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-md py-3 px-8 text-md font-medium transition-colors text-center"
                  >
                    {t.exploreMore}
                  </Link>
                )}
              </div>
            </div>

            {/* Featured panel */}
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
                        {featuredItems.map((item) => (
                          <div
                            key={item.id}
                            className="w-full flex-shrink-0 h-full"
                          >
                            <Link
                              href={`/${locale}/${detailPath}/${item.slug}`}
                              className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 block cursor-pointer group"
                            >
                              <div className="relative h-32 lg:h-48 overflow-hidden flex-shrink-0">
                                <Image
                                  src={coverOf(item)}
                                  alt={item.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                  sizes="(max-width: 1024px) 100vw, 33vw"
                                  priority
                                />
                              </div>
                              <div className="p-4 lg:p-6 flex-1 flex flex-col min-h-0">
                                <div className="mb-2 lg:mb-3 flex-shrink-0">
                                  <span className="inline-block bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-2 py-1 lg:px-3 rounded-lg text-xs lg:text-sm font-medium">
                                    {item.level}
                                  </span>
                                </div>
                                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base lg:text-lg mb-2 lg:mb-3 leading-tight group-hover:text-[#990000] transition-colors flex-shrink-0">
                                  {item.title}
                                </h4>
                                {item.description && (
                                  <p className="text-xs lg:text-sm text-neutral-600 dark:text-neutral-300 mb-3 lg:mb-4 flex-1 leading-relaxed overflow-hidden line-clamp-3">
                                    {item.description.replace(/<[^>]+>/g, '')}
                                  </p>
                                )}
                                <div className="flex items-center justify-between flex-shrink-0 mt-auto">
                                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                    {item.price > 0
                                      ? `${t.currency}${item.price}`
                                      : t.free}
                                  </span>
                                  <span className="text-[#990000] text-xs lg:text-sm font-medium flex items-center">
                                    {t.exploreMore}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </span>
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg flex flex-col items-center justify-center px-8 text-center">
                  <BookOpen className="w-12 h-12 text-neutral-400 mb-4" />
                  <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {t.emptyTitle}
                  </p>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                    {t.featuredEmpty}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All mentorships */}
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
              {(activeLevel !== 'all' || activeType !== 'all') && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    {t.activeFilters}
                  </span>
                  {activeLevel !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.levels[activeLevel as keyof typeof t.levels]}
                    </span>
                  )}
                  {activeType !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.types[activeType as keyof typeof t.types]}
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
                    {t.levelLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(t.levels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveLevel(key)}
                      className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                        activeLevel === key
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
                    {t.typeLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(t.types).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveType(key)}
                      className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                        activeType === key
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

          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.emptyTitle}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t.emptySubtitle}
              </p>
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <MentorshipCard key={item.id} item={item} />
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
                  setActiveLevel('all');
                  setActiveType('all');
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
