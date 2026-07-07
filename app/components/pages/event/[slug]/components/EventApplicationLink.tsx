'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';

interface EventApplicationLinkProps {
  eventSlug: string;
  locale: string;
}

export default function EventApplicationLink({
  eventSlug,
  locale,
}: EventApplicationLinkProps) {
  const [info, setInfo] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(
          `/api/site-applications/public/events/${encodeURIComponent(eventSlug)}?locale=${locale}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.available) {
          setInfo({ url: data.url, title: data.title });
        }
      } catch {
        if (!cancelled) setInfo(null);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [eventSlug, locale]);

  if (!info) return null;

  return (
    <Link
      href={info.url}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-[#990000] bg-[#990000]/5 px-4 py-3 text-sm font-semibold text-[#990000] transition-colors hover:bg-[#990000] hover:text-white dark:bg-[#990000]/10"
    >
      <FileText className="h-4 w-4" />
      {locale === 'tr' ? `${info.title} — Başvuru` : `Apply — ${info.title}`}
    </Link>
  );
}
