'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Filter,
  Search,
  Users,
} from 'lucide-react';

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
    badge: 'Mentörlük',
    title:
      'Alanında uzman mentörlerle birebir gelişim programlarını keşfedin.',
    subtitle:
      'Kariyer hedeflerinize özel mentörlük programlarıyla rehberlik alın.',
    viewAll: 'Tüm Mentörlükleri Görüntüle',
    exploreMore: 'Detayları İncele',
    featuredTitle: 'Öne Çıkanlar',
    featuredEmpty: 'Öne çıkan mentörlük yakında eklenecek',
    allTitle: 'Tüm Mentörlükler',
    statOpen: 'Program',
    statFeatured: 'Öne Çıkan',
    statOpenReg: 'Başvuru Açık',
    typeLabel: 'Tür:',
    modeLabel: 'Mod:',
    types: {
      all: 'Tümü',
      general: 'Genel',
      career: 'Kariyer',
      academic: 'Akademik',
      technical: 'Teknik',
      entrepreneurship: 'Girişimcilik',
    },
    modes: {
      all: 'Tümü',
      online: 'Online',
      hybrid: 'Hibrit',
      onsite: 'Yüz yüze',
    },
    activeFilters: 'Aktif filtreler:',
    loading: 'Mentörlükler yükleniyor...',
    noResults: 'Filtreye uygun mentörlük bulunamadı',
    tryDifferent:
      'Farklı bir filtre seçeneğini deneyin veya tüm mentörlükleri görüntüleyin.',
    showAll: 'Tümünü Göster',
    emptyTitle: 'Yakında mentörlükler listelenecektir',
    emptySubtitle:
      'Dashboard’dan yayınlanan mentörlük duyuruları burada görünür.',
    registrationOpen: 'Başvuru Açık',
    registrationClosed: 'Başvuru Kapalı',
    apply: 'Başvur',
  },
  en: {
    badge: 'Mentorship',
    title: 'Discover one-to-one development programs with expert mentors.',
    subtitle:
      'Get guided support with mentorship programs tailored to your career goals.',
    viewAll: 'View All Mentorships',
    exploreMore: 'Explore Details',
    featuredTitle: 'Featured',
    featuredEmpty: 'Featured mentorships coming soon',
    allTitle: 'All Mentorships',
    statOpen: 'Programs',
    statFeatured: 'Featured',
    statOpenReg: 'Open',
    typeLabel: 'Type:',
    modeLabel: 'Mode:',
    types: {
      all: 'All',
      general: 'General',
      career: 'Career',
      academic: 'Academic',
      technical: 'Technical',
      entrepreneurship: 'Entrepreneurship',
    },
    modes: {
      all: 'All',
      online: 'Online',
      hybrid: 'Hybrid',
      onsite: 'On-site',
    },
    activeFilters: 'Active filters:',
    loading: 'Loading mentorships...',
    noResults: 'No mentorships match this filter',
    tryDifferent: 'Try a different filter or view all mentorships.',
    showAll: 'Show All',
    emptyTitle: 'Mentorships will be listed soon',
    emptySubtitle:
      'Announcements published from the dashboard appear here.',
    registrationOpen: 'Applications Open',
    registrationClosed: 'Applications Closed',
    apply: 'Apply',
  },
};

export default function MentorshipListPage({
  locale = 'tr',
}: MentorshipListPageProps) {
  const [items, setItems] = useState<MentorshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('all');
  const [activeMode, setActiveMode] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const allItemsRef = useRef<HTMLElement>(null);

  const t = texts[locale as keyof typeof texts] || texts.tr;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/public/mentorships?locale=${encodeURIComponent(locale)}`,
        { cache: 'no-store' }
      );
      const payload = await res.json();
      if (!res.ok || payload.success === false) {
        throw new Error(payload.error || 'Failed to load mentorships');
      }

      const mapped: MentorshipItem[] = (payload.mentorships || []).map(
        (row: Record<string, unknown>) => ({
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
        })
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
    const featured = items.filter((i) => i.is_featured);
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
    const typeMatch =
      activeType === 'all' || item.mentorship_type === activeType;
    const modeMatch = activeMode === 'all' || item.mode === activeMode;
    return typeMatch && modeMatch;
  });

  const openRegCount = items.filter((i) => i.is_application_open).length;

  const scrollToAll = () => {
    allItemsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const coverOf = (item: MentorshipItem) =>
    item.banner_url ||
    item.thumbnail_url ||
    item.mentor_image_url ||
    '/default-course.jpg';

  const MentorshipCard = ({ item }: { item: MentorshipItem }) => (
    <Link
      href={item.url}
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
        <div className="absolute top-3 right-3">
          <div
            className={`px-2 py-1 rounded text-xs font-medium text-white ${
              item.is_application_open ? 'bg-green-600' : 'bg-neutral-500'
            }`}
          >
            {item.is_application_open
              ? t.registrationOpen
              : t.registrationClosed}
          </div>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-block px-3 py-1 rounded-lg text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {t.modes[item.mode] || item.mode}
          </span>
          <span className="inline-block px-3 py-1 rounded-lg text-sm bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
            {t.types[item.mentorship_type as keyof typeof t.types] ||
              item.mentorship_type}
          </span>
        </div>
        <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
          {item.title}
        </h3>
        {item.mentor_name && (
          <p className="text-sm text-neutral-500 mb-2">{item.mentor_name}</p>
        )}
        {(item.summary || item.description) && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-4 leading-relaxed">
            {(item.summary || item.description).replace(/<[^>]+>/g, '')}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-neutral-500">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-[#4a0000] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-block text-sm font-medium tracking-wide uppercase text-red-200 mb-4">
              {t.badge}
            </span>
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight mb-4">
              {t.title}
            </h1>
            <p className="text-neutral-300 text-lg mb-8">{t.subtitle}</p>
            <button
              type="button"
              onClick={scrollToAll}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-neutral-900 rounded-lg font-medium hover:bg-neutral-100 transition-colors"
            >
              {t.viewAll}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold">{items.length}</div>
              <div className="text-xs text-neutral-300">{t.statOpen}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold">
                {items.filter((i) => i.is_featured).length}
              </div>
              <div className="text-xs text-neutral-300">{t.statFeatured}</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-semibold">{openRegCount}</div>
              <div className="text-xs text-neutral-300">{t.statOpenReg}</div>
            </div>
          </div>
        </div>
      </section>

      {featuredItems.length > 0 && items.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100">
            {t.featuredTitle}
          </h2>
          <div className="relative overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            {featuredItems.map((item, idx) => (
              <div
                key={item.id}
                className={`${idx === currentSlide ? 'block' : 'hidden'}`}
              >
                <Link href={item.url} className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-56 md:h-80 bg-neutral-200">
                    <Image
                      src={coverOf(item)}
                      alt={item.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={idx === 0}
                    />
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <h3 className="text-2xl font-semibold mb-2">{item.title}</h3>
                    {item.mentor_name && (
                      <p className="text-neutral-500 mb-3">{item.mentor_name}</p>
                    )}
                    <p className="text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-6">
                      {(item.summary || item.description).replace(/<[^>]+>/g, '')}
                    </p>
                    <span className="inline-flex items-center text-[#990000] font-medium">
                      {t.exploreMore}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        ref={allItemsRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20"
      >
        <div className="flex items-center gap-2 mb-6">
          <Filter className="w-4 h-4 text-neutral-500" />
          <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {t.allTitle}
          </h2>
        </div>

        <div className="mb-8 space-y-4">
          <div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t.typeLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.types).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveType(key)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeType === key
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
              {t.modeLabel}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(t.modes).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveMode(key)}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    activeMode === key
                      ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.emptyTitle}</h3>
            <p className="text-neutral-500">{t.emptySubtitle}</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <MentorshipCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t.noResults}</h3>
            <p className="text-neutral-500 mb-4">{t.tryDifferent}</p>
            <button
              type="button"
              onClick={() => {
                setActiveType('all');
                setActiveMode('all');
              }}
              className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg"
            >
              {t.showAll}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
