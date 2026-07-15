'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Percent, ChevronRight } from 'lucide-react';

interface CampaignItem {
  id: string;
  title: string;
  description?: string;
  campaign_slug?: string | null;
  is_active: boolean;
  discount_percentage?: number | null;
  code?: string;
}

function shouldShowOnPath(pathname: string | null, locale: string): boolean {
  if (!pathname) return false;

  const excluded = [
    `/${locale}/login`,
    `/${locale}/sign-in`,
    `/${locale}/sign-up`,
    `/${locale}/checkout`,
    `/${locale}/watch`,
    `/${locale}/payment-success`,
    `/${locale}/payment-failed`,
    `/${locale}/dashboard`,
    `/${locale}/cart`,
  ];

  if (excluded.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }

  return (
    pathname === `/${locale}` ||
    pathname === `/${locale}/` ||
    pathname.startsWith(`/${locale}/kurs`) ||
    pathname.startsWith(`/${locale}/course`) ||
    pathname.startsWith(`/${locale}/etkinlik`) ||
    pathname.startsWith(`/${locale}/event`) ||
    pathname.startsWith(`/${locale}/paket`) ||
    pathname.startsWith(`/${locale}/package`) ||
    pathname.startsWith(`/${locale}/kampanyalar`) ||
    pathname.startsWith(`/${locale}/campaigns`)
  );
}

export default function CampaignPromoBar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [index, setIndex] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/campaigns?locale=${locale}`, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled || !json?.success) return;
        const items = ((json.data as CampaignItem[]) || []).filter((c) => c.is_active);
        setCampaigns(items);
        setIndex(0);
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  useEffect(() => {
    if (campaigns.length <= 1) return;

    const id = setInterval(() => {
      setFadeIn(false);
      window.setTimeout(() => {
        setIndex((i) => (i + 1) % campaigns.length);
        setFadeIn(true);
      }, 320);
    }, 5000);

    return () => clearInterval(id);
  }, [campaigns.length]);

  const visible = shouldShowOnPath(pathname, locale) && campaigns.length > 0;
  const current = campaigns[index];

  if (!visible || !current) return null;

  const goNext = () => {
    if (campaigns.length <= 1) return;
    setFadeIn(false);
    window.setTimeout(() => {
      setIndex((i) => (i + 1) % campaigns.length);
      setFadeIn(true);
    }, 220);
  };

  return (
    <div className="sticky top-[75px] z-30 w-full border-b border-white/10 bg-[#990000]/75 text-white backdrop-blur-md supports-[backdrop-filter]:bg-[#990000]/55">
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <span className="hidden sm:inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Percent className="h-3.5 w-3.5" />
        </span>

        <div
          className={`min-w-0 flex-1 flex items-center gap-2 transition-opacity duration-300 ${
            fadeIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {current.discount_percentage != null && current.discount_percentage > 0 && (
            <span className="shrink-0 rounded bg-white/15 px-2 py-0.5 text-xs font-semibold tracking-wide">
              %{current.discount_percentage}
            </span>
          )}
          {current.code && (
            <span className="shrink-0 rounded border border-dashed border-white/50 bg-white/10 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide">
              {current.code}
            </span>
          )}
          <p className="truncate text-sm font-medium">{current.title}</p>
          {campaigns.length > 1 && (
            <span className="hidden sm:inline shrink-0 text-[11px] text-white/70">
              {index + 1}/{campaigns.length}
            </span>
          )}
        </div>

        {campaigns.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label={locale === 'tr' ? 'Sonraki' : 'Next'}
            className="shrink-0 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
