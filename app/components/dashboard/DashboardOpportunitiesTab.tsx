'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Sparkles, ArrowRight, FileText } from 'lucide-react';
import type { OpportunityWithMatch } from '@/lib/types/opportunity';

interface DashboardOpportunitiesTabProps {
  locale: string;
}

const statusLabel: Record<string, string> = {
  pending: 'Beklemede',
  under_review: 'Değerlendiriliyor',
  accepted: 'Kabul',
  rejected: 'Reddedildi',
};

const statusBadge: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  under_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function DashboardOpportunitiesTab({
  locale,
}: DashboardOpportunitiesTabProps) {
  const [recommended, setRecommended] = useState<OpportunityWithMatch[]>([]);
  const [allOpportunities, setAllOpportunities] = useState<
    OpportunityWithMatch[]
  >([]);
  const [applications, setApplications] = useState<
    Array<{
      id: string;
      status: string;
      created_at: string;
      opportunity?: { slug?: string; title?: Record<string, string> };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const listPath = locale === 'tr' ? 'stajlar' : 'internships';
  const others = allOpportunities.filter((o) => !o.is_recommended);

  const renderCard = (opp: OpportunityWithMatch, highlighted?: boolean) => {
    const title = opp.title?.[locale] || opp.title?.tr || opp.slug;
    return (
      <Link
        key={opp.id}
        href={`/${locale}/${listPath}/${opp.slug}`}
        className={`rounded-lg border p-4 hover:shadow-sm transition-shadow ${
          highlighted
            ? 'border-[#990000]/30 bg-[#990000]/5'
            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/50'
        }`}
      >
        {highlighted && (
          <span className="text-[10px] font-semibold text-[#990000] uppercase flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Önerilen
          </span>
        )}
        <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mt-1">
          {title}
        </h3>
        {opp.company_name && (
          <p className="text-xs text-neutral-500 mt-0.5">{opp.company_name}</p>
        )}
        {opp.can_apply ? (
          <span className="text-xs text-green-600 mt-2 inline-block">
            Başvurabilirsiniz
          </span>
        ) : (
          <span className="text-xs text-amber-600 mt-2 inline-block">
            Eğitimi tamamlayınca başvurabilirsiniz
          </span>
        )}
        {highlighted && opp.match_reasons?.length > 0 && (
          <p className="text-xs text-[#990000] mt-2">
            {locale === 'tr' ? 'Eşleşen eğitim:' : 'Matching course:'}{' '}
            {opp.match_reasons.join(', ')}
          </p>
        )}
      </Link>
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/opportunities/my?locale=${locale}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setRecommended(json.recommended || []);
      setAllOpportunities(json.all || []);
      setApplications(json.applications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-12 text-center text-neutral-500 text-sm">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            Staj & Kariyer
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {locale === 'tr'
              ? 'Staj fırsatlarını inceleyin; tamamladığınız eğitimlere göre öneriler üstte listelenir.'
              : 'Browse internships; matches based on your completed courses appear first.'}
          </p>
        </div>
        <Link
          href={`/${locale}/${listPath}`}
          className="text-sm text-[#990000] hover:underline shrink-0"
        >
          Tüm ilanlar →
        </Link>
      </div>

      {allOpportunities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 p-8 text-center">
          <Briefcase className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {locale === 'tr'
              ? 'Henüz yayınlanmış staj ilanı yok.'
              : 'No internship listings yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {recommended.length > 0 && (
            <section>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2 text-[#990000]">
                <Sparkles className="w-4 h-4" />
                {locale === 'tr' ? 'Sana özel öneriler' : 'Recommended for you'}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {recommended.map((opp) => renderCard(opp, true))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h3 className="text-sm font-medium mb-3 text-neutral-700 dark:text-neutral-300">
                {recommended.length > 0
                  ? locale === 'tr'
                    ? 'Diğer staj ilanları'
                    : 'Other internships'
                  : locale === 'tr'
                    ? 'Staj ilanları'
                    : 'Internships'}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {others.map((opp) => renderCard(opp))}
              </div>
            </section>
          )}
        </div>
      )}

      <section>
        <h3 className="text-base font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Başvurularım
        </h3>
        {applications.length === 0 ? (
          <p className="text-sm text-neutral-500">Henüz başvurunuz yok.</p>
        ) : (
          <ul className="space-y-2">
            {applications.map((app) => {
              const title =
                app.opportunity?.title?.[locale] ||
                app.opportunity?.title?.tr ||
                'Staj başvurusu';
              return (
                <li
                  key={app.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 dark:border-neutral-700 px-4 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                      {title}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {new Date(app.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${statusBadge[app.status] || 'bg-neutral-100 dark:bg-neutral-700'}`}
                    >
                      {statusLabel[app.status] || app.status}
                    </span>
                    {app.opportunity?.slug && (
                      <Link
                        href={`/${locale}/${listPath}/${app.opportunity.slug}`}
                        className="text-[#990000] hover:underline"
                        aria-label="İlanı görüntüle"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
