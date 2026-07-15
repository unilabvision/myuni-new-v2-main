'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Percent, ArrowRight } from 'lucide-react';

interface CampaignItem {
  id: string;
  title: string;
  description?: string;
  campaign_slug?: string | null;
  is_active: boolean;
  discount_percentage?: number | null;
  code?: string;
}

export default function CampaignAuthPromo({ locale }: { locale: string }) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/campaigns?locale=${locale}`, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled || !json?.success) return;
        const items = ((json.data as CampaignItem[]) || []).filter((c) => c.is_active);
        setCampaigns(items.slice(0, 5));
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const t = useMemo(
    () => ({
      eyebrow: locale === 'tr' ? 'Güncel indirim kodları' : 'Current discount codes',
      cta: locale === 'tr' ? 'Kurslara git' : 'Browse courses',
      code: locale === 'tr' ? 'Kod' : 'Code',
    }),
    [locale]
  );

  if (!campaigns.length) return null;

  // Kampanya detay (404) yerine kurs listesine yönlendir — kod checkout’ta kullanılır
  const coursesPath =
    locale === 'tr' ? `/${locale}/kurs` : `/${locale}/course`;

  return (
    <div className="mt-6 mb-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800/60">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#990000]/10 text-[#990000]">
          <Percent className="h-3.5 w-3.5" />
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          {t.eyebrow}
        </p>
      </div>

      <ul className="mt-3 space-y-2">
        {campaigns.map((campaign) => {
          const href = campaign.code
            ? `${coursesPath}?code=${encodeURIComponent(campaign.code)}`
            : coursesPath;
          return (
            <li
              key={campaign.id}
              className="flex items-center gap-2 rounded-md bg-white px-3 py-2 dark:bg-neutral-900/50"
            >
              {campaign.code && (
                <span className="shrink-0 rounded border border-dashed border-neutral-300 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-800 dark:border-neutral-600 dark:text-neutral-200">
                  {campaign.code}
                </span>
              )}
              {campaign.discount_percentage != null && campaign.discount_percentage > 0 && (
                <span className="shrink-0 rounded bg-[#990000]/10 px-1.5 py-0.5 text-[11px] font-semibold text-[#990000]">
                  %{campaign.discount_percentage}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-xs text-neutral-700 dark:text-neutral-300">
                {campaign.title}
              </span>
              <Link
                href={href}
                onClick={() => {
                  if (!campaign.code) return;
                  try {
                    sessionStorage.setItem('pending_discount_code', campaign.code);
                  } catch {
                    // ignore
                  }
                }}
                className="shrink-0 text-[#990000] hover:opacity-80"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={coursesPath}
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#990000] hover:underline"
      >
        {t.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
