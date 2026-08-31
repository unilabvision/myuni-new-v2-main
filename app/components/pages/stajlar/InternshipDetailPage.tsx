'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Handshake,
  MapPin,
} from 'lucide-react';
import {
  EVENT_BANNER_HEIGHT,
  EVENT_BANNER_WIDTH,
} from '@/lib/events/banner';

export type OpportunityDetailInitial = {
  slug: string;
  is_active: boolean;
  banner_url?: string | null;
  thumbnail_url?: string | null;
  company_name?: string | null;
  application_deadline?: string | null;
  work_mode?: string | null;
  location?: string | null;
  opportunity_type?: string | null;
  title?: string | null;
  description?: string | null;
  form_slug?: string | null;
};

interface InternshipDetailPageProps {
  slug: string;
  locale?: string;
  initialOpp?: OpportunityDetailInitial | null;
}

function typeLabel(type: string | null | undefined, locale: string) {
  const t = (type || 'staj').toLowerCase();
  if (locale === 'en') {
    if (t === 'gonullu' || t === 'volunteer') return 'Volunteer';
    if (t === 'is' || t === 'job') return 'Job';
    return 'Internship';
  }
  if (t === 'gonullu') return 'Gönüllü';
  if (t === 'is') return 'İş';
  return 'Staj';
}

function workModeLabel(mode: string | null | undefined, locale: string) {
  const m = (mode || '').toLowerCase();
  if (locale === 'en') {
    if (m === 'remote') return 'Remote';
    if (m === 'hybrid') return 'Hybrid';
    if (m === 'onsite' || m === 'office') return 'On-site';
    return mode || '—';
  }
  if (m === 'remote') return 'Uzaktan';
  if (m === 'hybrid') return 'Hibrit';
  if (m === 'onsite' || m === 'office') return 'Ofis';
  return mode || '—';
}

function applyHref(locale: string, formSlug: string) {
  return locale === 'en'
    ? `/${locale}/application/${formSlug}`
    : `/${locale}/basvuru/${formSlug}`;
}

export default function InternshipDetailPage({
  slug,
  locale = 'tr',
  initialOpp = null,
}: InternshipDetailPageProps) {
  const listPath = locale === 'en' ? `/${locale}/internships` : `/${locale}/stajlar`;
  const opp = initialOpp;
  const isTr = locale !== 'en';

  if (!opp) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-neutral-600 dark:text-neutral-400">
          {isTr ? 'İlan bulunamadı.' : 'Opportunity not found.'}
        </p>
        <Link
          href={listPath}
          className="text-[#990000] text-sm mt-4 inline-block"
        >
          ← {isTr ? 'Listeye dön' : 'Back to list'}
        </Link>
      </div>
    );
  }

  const title =
    opp.title?.trim() ||
    slug.replace(/-/g, ' ');
  const description = opp.description?.trim() || '';
  const company =
    opp.company_name?.trim() || (isTr ? 'MyUNI' : 'MyUNI');
  const bannerSrc =
    opp.banner_url?.trim() ||
    opp.thumbnail_url?.trim() ||
    '';
  const type = typeLabel(opp.opportunity_type, locale);
  const mode = workModeLabel(opp.work_mode, locale);
  const location = opp.location?.trim() || mode;
  const isOpen = Boolean(opp.is_active);
  const formSlug = (opp.form_slug || slug).trim();
  const applyPath = applyHref(locale, formSlug);
  const deadlineLabel = opp.application_deadline
    ? new Date(opp.application_deadline).toLocaleDateString(
        isTr ? 'tr-TR' : 'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' }
      )
    : null;
  const statusLabel = isOpen
    ? isTr
      ? 'Başvuru açık'
      : 'Applications open'
    : isTr
      ? 'Başvuru kapalı'
      : 'Applications closed';
  const statusDetail = isOpen
    ? isTr
      ? 'Açık'
      : 'Open'
    : isTr
      ? 'Kapalı'
      : 'Closed';

  const copy = {
    back: isTr ? 'Staj & Kariyer’e dön' : 'Back to Internships & Career',
    detailsTitle: isTr ? 'Fırsat detayları' : 'Opportunity details',
    detailOrg: isTr ? 'Kurum' : 'Organization',
    detailType: isTr ? 'Tür' : 'Type',
    detailMode: isTr ? 'Çalışma biçimi' : 'Work mode',
    detailStatus: isTr ? 'Durum' : 'Status',
    detailDeadline: isTr ? 'Son başvuru' : 'Deadline',
    aboutTitle: isTr ? 'Hakkında' : 'About',
    sidebarTitle: isTr ? 'Başvuru' : 'Apply',
    sidebarPrice: isTr ? 'Ücretsiz' : 'Free',
    sidebarNote: isTr
      ? 'MyUNI’de yayınlanır'
      : 'Published on MyUNI',
    sidebarCta: isTr ? 'Başvuru formuna git' : 'Go to application form',
    sidebarHint: isTr
      ? 'Başvuru formuna yönlendirileceksiniz.'
      : 'You will continue to the application form.',
    mobileCta: isTr ? 'Başvur' : 'Apply',
  };

  const TypeIcon =
    (opp.opportunity_type || '').toLowerCase() === 'gonullu'
      ? Handshake
      : Briefcase;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 pb-24 lg:pb-0">
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 sm:py-4">
          <Link
            href={listPath}
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span>{copy.back}</span>
          </Link>
        </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 lg:gap-6">
              <span className="inline-flex items-center gap-1.5 bg-[#990000]/10 text-[#990000] px-2.5 py-1 rounded-full text-xs font-medium border border-[#990000]/20">
                <TypeIcon className="w-3.5 h-3.5" />
                {type}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {company}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {mode}
              </span>
              {location && location !== mode && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4" />
                  {location}
                </span>
              )}
              {deadlineLabel && (
                <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {isTr ? 'Son başvuru: ' : 'Deadline: '}
                  {deadlineLabel}
                </span>
              )}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium w-fit ${
                isOpen
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {statusLabel}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
        {bannerSrc ? (
          <div className="mb-8 sm:mb-10">
            <div className="relative w-full overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-100">
              <Image
                key={bannerSrc}
                src={bannerSrc}
                alt={title}
                width={EVENT_BANNER_WIDTH}
                height={EVENT_BANNER_HEIGHT}
                className="block w-full h-auto max-w-full"
                sizes="(max-width: 1280px) 90vw, 1100px"
                priority
                unoptimized
              />
              <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-10">
                <span className="inline-flex items-center gap-1.5 bg-neutral-900/85 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                  <Building2 className="w-3.5 h-3.5" />
                  {company}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
            {copy.detailsTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: copy.detailOrg, value: company },
              { label: copy.detailType, value: type },
              { label: copy.detailMode, value: mode },
              { label: copy.detailStatus, value: statusDetail },
              ...(deadlineLabel
                ? [{ label: copy.detailDeadline, value: deadlineLabel }]
                : []),
            ].map((item) => (
              <div
                key={item.label}
                className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-8 sm:space-y-10">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </h1>
              <div className="w-16 h-px bg-[#990000] mt-3 mb-4" />
              {company && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  {company}
                </p>
              )}
            </div>

            {description ? (
              <section>
                <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  {copy.aboutTitle}
                </h2>
                <div
                  className="prose prose-neutral dark:prose-invert max-w-none text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      description.includes('<')
                        ? description
                        : description
                            .split(/\n+/)
                            .filter(Boolean)
                            .map((p) => `<p>${p}</p>`)
                            .join(''),
                  }}
                />
              </section>
            ) : null}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
                <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
                  {copy.sidebarTitle}
                </p>
                <p className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">
                  {copy.sidebarPrice}
                </p>
                <div className="w-12 h-px bg-[#990000] my-4" />
                <div className="space-y-2.5 text-sm text-neutral-600 dark:text-neutral-400 mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 shrink-0" />
                    {company}
                  </div>
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-4 h-4 shrink-0" />
                    {type}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    {mode}
                  </div>
                </div>
                <p className="text-xs text-neutral-500 mb-4">
                  {copy.sidebarNote}
                  {company ? ` · ${company}` : ''}
                </p>
                {isOpen ? (
                  <>
                    <Link
                      href={applyPath}
                      className="flex items-center justify-center gap-2 w-full bg-[#990000] hover:bg-[#7a0000] text-white text-sm font-medium py-3 px-4 rounded-sm transition-colors"
                    >
                      {copy.sidebarCta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-[11px] text-neutral-500 mt-3 text-center">
                      {copy.sidebarHint}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-center text-amber-700 dark:text-amber-300 font-medium py-2">
                    {statusLabel}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-neutral-200 dark:border-neutral-700 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm p-3">
          <Link
            href={applyPath}
            className="flex items-center justify-center gap-2 w-full bg-[#990000] hover:bg-[#7a0000] text-white text-sm font-medium py-3 px-4 rounded-sm"
          >
            {copy.mobileCta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
