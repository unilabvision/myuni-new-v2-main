'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Briefcase,
  MapPin,
  Calendar,
  Sparkles,
  Building2,
  ArrowRight,
} from 'lucide-react';
import type { OpportunityWithMatch } from '@/lib/types/opportunity';

interface InternshipsListPageProps {
  locale?: string;
}

const workModeLabel: Record<string, { tr: string; en: string }> = {
  remote: { tr: 'Uzaktan', en: 'Remote' },
  hybrid: { tr: 'Hibrit', en: 'Hybrid' },
  onsite: { tr: 'Yerinde', en: 'On-site' },
};

export default function InternshipsListPage({
  locale = 'tr',
}: InternshipsListPageProps) {
  const { isSignedIn } = useUser();
  const [opportunities, setOpportunities] = useState<OpportunityWithMatch[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const basePath = locale === 'tr' ? 'stajlar' : 'internships';

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

  const recommended = opportunities.filter((o) => o.is_recommended);
  const others = opportunities.filter((o) => !o.is_recommended);

  const renderCard = (opp: OpportunityWithMatch, highlighted?: boolean) => {
    const title =
      typeof opp.title === 'object'
        ? opp.title[locale] || opp.title.tr || ''
        : String(opp.title);
    const desc =
      opp.description != null && typeof opp.description === 'object'
        ? opp.description[locale] || opp.description.tr || ''
        : String(opp.description ?? '');

    return (
      <Link
        key={opp.id}
        href={`/${locale}/${basePath}/${opp.slug}`}
        className={`block rounded-xl border p-5 transition-all hover:shadow-md ${
          highlighted
            ? 'border-[#990000]/40 bg-[#990000]/5 dark:bg-[#990000]/10'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {highlighted && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#990000] mb-1">
                <Sparkles className="w-3 h-3" />
                {locale === 'tr' ? 'Sana özel' : 'For you'}
              </span>
            )}
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
            {opp.company_name && (
              <p className="text-sm text-neutral-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                {opp.company_name}
              </p>
            )}
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0 mt-1" />
        </div>
        {desc && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 line-clamp-2">
            {desc}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3 text-xs text-neutral-500">
          {opp.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {opp.location}
            </span>
          )}
          {opp.work_mode && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {workModeLabel[opp.work_mode]?.[locale as 'tr' | 'en'] ||
                opp.work_mode}
            </span>
          )}
          {opp.application_deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(opp.application_deadline).toLocaleDateString(
                locale === 'tr' ? 'tr-TR' : 'en-US'
              )}
            </span>
          )}
        </div>
        {opp.match_reasons?.length > 0 && (
          <p className="text-xs text-[#990000] mt-2">
            {locale === 'tr' ? 'Eşleşen eğitim:' : 'Matching course:'}{' '}
            {opp.match_reasons.join(', ')}
          </p>
        )}
      </Link>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
          {locale === 'tr' ? 'Staj Fırsatları' : 'Internship Opportunities'}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-2xl">
          {locale === 'tr'
            ? 'Tamamladığınız eğitimlere göre size önerilen stajlar üstte listelenir. Tüm fırsatları inceleyebilirsiniz.'
            : 'Internships matching your completed courses appear first. Browse all opportunities.'}
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-500">Yükleniyor...</div>
      ) : opportunities.length === 0 ? (
        <div className="py-16 text-center text-neutral-500 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600">
          {locale === 'tr'
            ? 'Henüz yayınlanmış staj ilanı yok.'
            : 'No internship listings yet.'}
        </div>
      ) : (
        <div className="space-y-10">
          {recommended.length > 0 && (
            <section>
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#990000]" />
                {locale === 'tr' ? 'Önerilenler' : 'Recommended'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {recommended.map((o) => renderCard(o, true))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h2 className="text-lg font-medium mb-4 text-neutral-700 dark:text-neutral-300">
                {locale === 'tr' ? 'Tüm staj ilanları' : 'All internships'}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {others.map((o) => renderCard(o))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
