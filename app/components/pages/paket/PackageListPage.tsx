'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package } from 'lucide-react';

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
}

const texts = {
  tr: {
    badge: 'Eğitim Paketleri',
    title: 'Birden fazla eğitimi bir arada sunan paketlerle ilerleyin.',
    subtitle:
      'Seçili kursları birleştiren eğitim paketlerini inceleyin ve hedeflerinize daha hızlı ulaşın.',
    geoIntroTitle: 'MyUNI eğitim paketleri nedir?',
    geoIntro:
      'MyUNI (myunilab.net) eğitim paketleri, birden fazla kursu tek bir öğrenme yolunda birleştirir. Tek kurs yerine paketlerle kariyer ve beceri hedeflerinize daha hızlı ilerleyebilirsiniz.',
    faqTitle: 'Sık sorulan sorular',
    viewAll: 'Tüm Paketleri Gör',
    exploreMore: 'Detayları İncele',
    allTitle: 'Eğitim Paketleri',
    loading: 'Paketler yükleniyor...',
    emptyTitle: 'Henüz eğitim paketi eklenmedi',
    emptySubtitle: 'Yakında yeni eğitim paketleri burada listelenecek.',
    packageBadge: 'Eğitim Paketi',
    free: 'Ücretsiz',
    currency: '₺',
    allLevels: 'Tüm Seviyeler',
  },
  en: {
    badge: 'Training Packages',
    title: 'Advance faster with packages that bundle multiple courses.',
    subtitle:
      'Browse training packages that combine selected courses and help you reach your goals sooner.',
    geoIntroTitle: 'What are MyUNI training packages?',
    geoIntro:
      'MyUNI (myunilab.net) training packages combine multiple courses into one learning path so you can reach career and skill goals faster than taking a single course alone.',
    faqTitle: 'Frequently asked questions',
    viewAll: 'View All Packages',
    exploreMore: 'Explore Details',
    allTitle: 'Training Packages',
    loading: 'Loading packages...',
    emptyTitle: 'No training packages yet',
    emptySubtitle: 'New training packages will be listed here soon.',
    packageBadge: 'Training Package',
    free: 'Free',
    currency: '₺',
    allLevels: 'All Levels',
  },
};

export default function PackageListPage({
  locale = 'tr',
  faqs = [],
}: PackageListPageProps) {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const detailSegment = locale === 'en' ? 'package' : 'paket';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/public/courses?locale=${encodeURIComponent(locale)}`,
          { cache: 'no-store' }
        );
        const payload = await res.json();
        if (res.ok && payload.success) {
          setPackages(Array.isArray(payload.packages) ? payload.packages : []);
        } else {
          setPackages([]);
        }
      } catch (err) {
        console.error(err);
        setPackages([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locale]);

  if (loading) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
            <div className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 bg-neutral-200 dark:bg-neutral-700 rounded-md"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl px-6 container mx-auto relative z-10">
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
              {t.badge}
            </div>
            <h1 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
              {t.title}
            </h1>
            <div className="w-16 h-px bg-[#990000] mb-6" />
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
              {t.subtitle}
            </p>
            <div className="rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 p-6">
              <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {t.geoIntroTitle}
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {t.geoIntro}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl px-6 mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.allTitle} ({packages.length})
            </h2>
            <div className="w-16 h-px bg-[#990000]" />
          </div>

          {packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {packages.map((pkg) => (
                <Link
                  href={`/${locale}/${detailSegment}/${pkg.slug}`}
                  key={pkg.id}
                  className="bg-white dark:bg-neutral-900 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group"
                >
                  <div className="relative w-full h-48 overflow-hidden">
                    <Image
                      src={
                        pkg.thumbnail_url ||
                        pkg.banner_url ||
                        '/default-course.jpg'
                      }
                      alt={pkg.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      quality={75}
                    />
                    <div className="absolute top-3 left-3 bg-[#990000] text-white px-2 py-1 rounded text-xs font-medium tracking-wide">
                      {t.packageBadge}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <span className="inline-block bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-lg text-sm">
                        {pkg.level || t.allLevels}
                      </span>
                    </div>

                    <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
                      {pkg.title}
                    </h3>

                    <div className="mb-4 leading-relaxed text-neutral-500 dark:text-neutral-400 text-sm line-clamp-2">
                      {pkg.description
                        ? pkg.description.replace(/<[^>]*>/g, '').slice(0, 120) +
                          (pkg.description.length > 120 ? '...' : '')
                        : ''}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                          {pkg.price === 0
                            ? t.free
                            : `${t.currency}${pkg.price}`}
                        </span>
                        {pkg.original_price ? (
                          <span className="text-lg text-neutral-400 line-through">
                            {t.currency}
                            {pkg.original_price}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[#990000] text-sm font-medium flex items-center">
                        {t.exploreMore}
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Package className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.emptyTitle}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t.emptySubtitle}
              </p>
            </div>
          )}
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="py-16 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800">
          <div className="max-w-3xl px-6 mx-auto">
            <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.faqTitle}
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-8" />
            <div className="space-y-6">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
