'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

type MentorshipDetail = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  mentor_name: string | null;
  mentor_title: string | null;
  mentor_bio: string;
  mentor_image_url: string | null;
  mentor_linkedin: string | null;
  mentorship_type: string;
  mode: string;
  location_name: string | null;
  is_application_open: boolean;
  banner_url: string | null;
  thumbnail_url: string | null;
  application_url: string;
};

const texts = {
  tr: {
    back: 'Mentörlüklere dön',
    apply: 'Başvur',
    closed: 'Başvurular kapalı',
    mentor: 'Mentör',
    loading: 'Yükleniyor...',
    notFound: 'Mentörlük bulunamadı',
    about: 'Program hakkında',
  },
  en: {
    back: 'Back to mentorships',
    apply: 'Apply',
    closed: 'Applications closed',
    mentor: 'Mentor',
    loading: 'Loading...',
    notFound: 'Mentorship not found',
    about: 'About the program',
  },
};

export default function MentorshipDetailPage({
  locale,
  slug,
}: {
  locale: string;
  slug: string;
}) {
  const [item, setItem] = useState<MentorshipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const t = texts[locale as keyof typeof texts] || texts.tr;
  const listHref = `/${locale}/${locale === 'en' ? 'mentorship' : 'mentorluk'}`;

  useEffect(() => {
    fetch(`/api/public/mentorships/${encodeURIComponent(slug)}?locale=${locale}`, {
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Not found');
        setItem(data.mentorship);
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#990000]" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="mb-4">{t.notFound}</p>
        <Link href={listHref} className="text-[#990000] hover:underline">
          {t.back}
        </Link>
      </div>
    );
  }

  const cover =
    item.banner_url || item.thumbnail_url || item.mentor_image_url || '/default-course.jpg';

  return (
    <div className="bg-neutral-50 dark:bg-neutral-950 min-h-screen pb-20">
      <div className="relative h-56 md:h-80 bg-neutral-800">
        <Image src={cover} alt={item.title} fill className="object-cover opacity-80" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 pb-8 text-white">
          <Link
            href={listHref}
            className="inline-flex items-center gap-1 text-sm text-white/80 hover:text-white mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
          <h1 className="text-3xl md:text-4xl font-semibold">{item.title}</h1>
          {item.summary && <p className="mt-2 text-white/85 max-w-2xl">{item.summary}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-[1fr_280px] gap-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">{t.about}</h2>
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
            {item.description || item.summary || '—'}
          </div>

          {(item.mentor_name || item.mentor_bio) && (
            <div className="mt-10 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h3 className="font-semibold mb-3">{t.mentor}</h3>
              <div className="flex gap-4">
                {item.mentor_image_url && (
                  <div className="relative w-20 h-20 rounded-full overflow-hidden shrink-0 bg-neutral-200">
                    <Image
                      src={item.mentor_image_url}
                      alt={item.mentor_name || 'Mentor'}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  {item.mentor_name && (
                    <div className="font-medium text-lg">{item.mentor_name}</div>
                  )}
                  {item.mentor_title && (
                    <div className="text-sm text-neutral-500">{item.mentor_title}</div>
                  )}
                  {item.mentor_bio && (
                    <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                      {item.mentor_bio}
                    </p>
                  )}
                  {item.mentor_linkedin && (
                    <a
                      href={item.mentor_linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 text-sm text-[#990000] hover:underline"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-24 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            {item.location_name && (
              <p className="text-sm text-neutral-500 mb-3">{item.location_name}</p>
            )}
            {item.is_application_open ? (
              <Link
                href={item.application_url}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#800000]"
              >
                {t.apply}
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="text-center text-sm text-neutral-500 py-3">{t.closed}</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
