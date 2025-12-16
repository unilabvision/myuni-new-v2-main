'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, ChevronUp, ChevronDown, Percent } from 'lucide-react';

interface CampaignItem {
  id: string;
  title: string;
  description: string;
  image: string;
  campaign_slug?: string | null;
  is_active: boolean;
  discount_percentage?: number | null;
  discount_amount?: number | null;
  discount_type?: string;
}

function stripMarkdown(input: string | null | undefined, maxLength: number = 140): string {
  if (!input || typeof input !== 'string') return '';
  const plain = input
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`+/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return plain.substring(0, maxLength) + (plain.length > maxLength ? '...' : '');
}

export default function CampaignsAssistant({ locale }: { locale: string }) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState<boolean>(true);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('campaigns_assistant_collapsed') === 'true';
  });
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setHydrated(true);
    // Always open on every refresh by default and expanded on homepage
    setOpen(true);
    setCollapsed(false);
    localStorage.setItem('campaigns_assistant_open', 'true');
    localStorage.setItem('campaigns_assistant_collapsed', 'false');
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('campaigns_assistant_open', String(open));
  }, [open, hydrated]);

  useEffect(() => {
    localStorage.setItem('campaigns_assistant_collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/campaigns?locale=${locale}`, { cache: 'no-store' });
        const json = await res.json();
        if (!ignore && json?.success) {
          const items = (json.data as CampaignItem[]) || [];
          const active = items.filter(c => c.is_active);
          setCampaigns(active.length ? active : items.slice(0, 5));
        }
      } catch (_) {}
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { ignore = true; clearInterval(id); };
  }, [locale]);

  useEffect(() => {
    if (!campaigns.length) return;
    const id = setInterval(() => setIndex(i => (i + 1) % campaigns.length), 8000);
    return () => clearInterval(id);
  }, [campaigns]);

  const t = useMemo(() => ({
    title: locale === 'tr' ? 'Güncel Kampanyalar' : 'Current Campaigns',
    learnMore: locale === 'tr' ? 'Detay' : 'Learn More',
    discount: locale === 'tr' ? 'İndirim' : 'Discount',
    minimize: locale === 'tr' ? 'Küçült' : 'Minimize',
    expand: locale === 'tr' ? 'Genişlet' : 'Expand',
  }), [locale]);

  if (!hydrated) return null;

  // Show on homepage, courses and events (both TR and EN paths)
  const showPopup = (
    pathname === `/${locale}` ||
    pathname === `/${locale}/` ||
    pathname.startsWith(`/${locale}/etkinlik`) ||
    pathname.startsWith(`/${locale}/event`)
  );
  if (!showPopup) return null;

  // Always render; no close button per requirement (only minimize)

  const current = campaigns[index];

  return (
    <div className="fixed left-3 bottom-3 z-50">
      <div
        className={`${collapsed ? 'rounded-full' : 'rounded-xl'} bg-white/95 dark:bg-neutral-800/95 backdrop-blur border border-neutral-200 dark:border-neutral-700 shadow-lg overflow-hidden max-w-[90vw]`}
        style={{ width: collapsed ? 56 : 'min(320px, calc(100vw - 88px))' }}
      >
        <div className={`flex items-center justify-between ${collapsed ? 'px-1.5 py-1.5' : 'px-3 py-2 border-b border-neutral-200 dark:border-neutral-700'}`}>
          <button
            type="button"
            aria-label={collapsed ? t.expand : t.minimize}
            onClick={() => setCollapsed(v => !v)}
            className={`flex items-center ${collapsed ? 'gap-1 w-full justify-center' : 'gap-2'} hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded px-1 py-1`}
          >
            <span className={`inline-flex items-center justify-center ${collapsed ? 'w-7 h-7' : 'w-6 h-6'} rounded-full bg-green-100 dark:bg-green-900/30`}>
              <Percent className={`${collapsed ? 'w-4 h-4' : 'w-3.5 h-3.5'} text-green-700 dark:text-green-300`} />
            </span>
            {collapsed ? (
              <ChevronUp className="w-4 h-4 text-neutral-500" />
            ) : (
              <>
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{t.title}</span>
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              </>
            )}
          </button>
        </div>

        {!collapsed && current && (
          <div className="p-2 sm:p-3">
            <div className="relative w-full h-28 sm:h-36 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
              <Image
                src={current.image}
                alt={current.title}
                fill
                className="object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="mt-2">
              <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2">{current.title}</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1">{stripMarkdown(current.description, 140)}</div>
            </div>
            <div className="mt-2 sm:mt-3 flex items-center justify-between">
              {current.discount_percentage && (
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  %{current.discount_percentage} {t.discount}
                </span>
              )}
              <Link
                href={`/${locale}/${locale === 'tr' ? 'kampanyalar' : 'campaigns'}/${current.campaign_slug ?? ''}`}
                onClick={() => setCollapsed(true)}
                className="ml-auto text-xs px-2.5 py-1 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90"
              >
                {t.learnMore}
              </Link>
            </div>
            {campaigns.length > 1 && (
              <div className="mt-2 flex items-center justify-between text-neutral-400">
                <button
                  aria-label="prev"
                  onClick={() => setIndex(i => (i - 1 + campaigns.length) % campaigns.length)}
                  className="text-xs px-2 py-1 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  ◀
                </button>
                <div className="flex items-center gap-1">
                  {campaigns.map((_, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-neutral-700 dark:bg-neutral-200' : 'bg-neutral-300 dark:bg-neutral-600'}`}></span>
                  ))}
                </div>
                <button
                  aria-label="next"
                  onClick={() => setIndex(i => (i + 1) % campaigns.length)}
                  className="text-xs px-2 py-1 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


