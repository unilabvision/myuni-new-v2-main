'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, MapPin, Calendar, Briefcase } from 'lucide-react';
import type { OpportunityWithMatch } from '@/lib/types/opportunity';
import OpportunityApplySection from './OpportunityApplySection';

interface InternshipDetailPageProps {
  slug: string;
  locale?: string;
}

export default function InternshipDetailPage({
  slug,
  locale = 'tr',
}: InternshipDetailPageProps) {
  const [opportunity, setOpportunity] = useState<OpportunityWithMatch | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const basePath = locale === 'tr' ? 'stajlar' : 'internships';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/opportunities/${slug}?locale=${locale}`);
        const json = await res.json();
        setOpportunity(json.opportunity || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-neutral-500">
        Yükleniyor...
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600">İlan bulunamadı.</p>
        <Link
          href={`/${locale}/${basePath}`}
          className="text-[#990000] text-sm mt-4 inline-block"
        >
          ← Listeye dön
        </Link>
      </div>
    );
  }

  const title =
    opportunity.display_title ||
    (typeof opportunity.title === 'object'
      ? opportunity.title[locale] || opportunity.title.tr
      : opportunity.title);
  const description =
    opportunity.display_description ||
    (opportunity.description != null &&
    typeof opportunity.description === 'object'
      ? opportunity.description[locale] || opportunity.description.tr
      : opportunity.description);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href={`/${locale}/${basePath}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {locale === 'tr' ? 'Tüm stajlar' : 'All internships'}
      </Link>

      <header className="mb-8">
        {opportunity.is_recommended && (
          <span className="text-xs font-semibold text-[#990000] uppercase tracking-wide">
            {locale === 'tr' ? 'Eğitimine uygun' : 'Matches your courses'}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-neutral-100 mt-1">
          {title}
        </h1>
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          {opportunity.company_name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {opportunity.company_name}
            </span>
          )}
          {opportunity.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {opportunity.location}
            </span>
          )}
          {opportunity.work_mode && (
            <span className="inline-flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {opportunity.work_mode}
            </span>
          )}
          {opportunity.application_deadline && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {locale === 'tr' ? 'Son başvuru: ' : 'Deadline: '}
              {new Date(opportunity.application_deadline).toLocaleDateString(
                locale === 'tr' ? 'tr-TR' : 'en-US'
              )}
            </span>
          )}
        </div>
      </header>

      {description && (
        <div
          className="prose prose-neutral dark:prose-invert max-w-none mb-10 text-sm sm:text-base"
          dangerouslySetInnerHTML={{
            __html:
              typeof description === 'string' && description.includes('<')
                ? description
                : `<p>${description}</p>`,
          }}
        />
      )}

      <section className="border-t border-neutral-200 dark:border-neutral-700 pt-8">
        <h2 className="text-lg font-medium mb-4">
          {locale === 'tr' ? 'Başvuru' : 'Apply'}
        </h2>
        <OpportunityApplySection
          opportunitySlug={slug}
          formConfigId={opportunity.form_config_id}
          canApply={opportunity.can_apply}
          hasApplied={!!opportunity.user_application_status}
          matchReasons={opportunity.match_reasons || []}
          locale={locale}
          loginRedirectPath={`/${locale}/${basePath}/${slug}`}
        />
      </section>
    </div>
  );
}
