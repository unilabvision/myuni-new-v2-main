// app/components/FeaturedMentorshipSection.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, MapPin, Monitor, Blend } from 'lucide-react';
import type { PublicMentorship } from '@/lib/mentorshipService';

interface Props {
  mentorships: PublicMentorship[];
  locale: string;
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === 'online') return <Monitor className="w-3.5 h-3.5" />;
  if (mode === 'onsite') return <MapPin className="w-3.5 h-3.5" />;
  return <Blend className="w-3.5 h-3.5" />;
}

function ModeLabel({ mode, locale }: { mode: string; locale: string }) {
  const labels: Record<string, Record<string, string>> = {
    online:  { tr: 'Online',    en: 'Online' },
    onsite:  { tr: 'Yüz Yüze', en: 'On-site' },
    hybrid:  { tr: 'Hibrit',   en: 'Hybrid' },
  };
  return <>{labels[mode]?.[locale] ?? mode}</>;
}

function MentorshipCard({
  mentorship,
  locale,
}: {
  mentorship: PublicMentorship;
  locale: string;
}) {
  const isOpen = mentorship.is_application_open;

  return (
    <Link
      href={mentorship.url}
      className="bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative w-full h-48 overflow-hidden bg-neutral-100 dark:bg-neutral-700 flex-shrink-0">
        {mentorship.thumbnail_url ? (
          <Image
            src={mentorship.thumbnail_url}
            alt={mentorship.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-black/60 text-white backdrop-blur-sm">
            <ModeIcon mode={mentorship.mode} />
            <ModeLabel mode={mentorship.mode} locale={locale} />
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm ${
              isOpen
                ? 'bg-green-600/80 text-white'
                : 'bg-neutral-500/80 text-white'
            }`}
          >
            {isOpen
              ? locale === 'tr' ? 'Başvuru Açık' : 'Open'
              : locale === 'tr' ? 'Başvuru Kapalı' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2 group-hover:text-[#990000] transition-colors">
          {mentorship.title}
        </h3>

        {mentorship.summary && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3">
            {mentorship.summary}
          </p>
        )}

        {/* Mentor info */}
        {mentorship.mentor_name && (
          <div className="flex items-center gap-2 mb-4">
            {mentorship.mentor_image_url ? (
              <Image
                src={mentorship.mentor_image_url}
                alt={mentorship.mentor_name}
                width={28}
                height={28}
                className="rounded-full object-cover border border-neutral-200 dark:border-neutral-600 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {mentorship.mentor_name}
              </p>
              {mentorship.mentor_title && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  {mentorship.mentor_title}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Capacity */}
        {mentorship.max_mentees != null && (
          <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 mt-auto mb-4">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {mentorship.current_mentees}/{mentorship.max_mentees}{' '}
              {locale === 'tr' ? 'mentor' : 'mentees'}
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <span
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
              isOpen
                ? 'text-[#990000] hover:text-[#770000]'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {isOpen
              ? locale === 'tr' ? 'Başvur' : 'Apply'
              : locale === 'tr' ? 'Detayları Gör' : 'View Details'}
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedMentorshipSection({ mentorships, locale }: Props) {
  if (!mentorships || mentorships.length === 0) return null;

  const mentorSlug = locale === 'en' ? 'mentorship' : 'mentorluk';

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto">
        {/* Başlık — FeaturedFilter ile aynı stil */}
        <div className="mb-12">
          <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Mentörlük Programları' : 'Mentorship Programs'}
          </h2>
          <div className="w-16 h-px bg-[#990000]" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentorships.map((m) => (
            <MentorshipCard key={m.id} mentorship={m} locale={locale} />
          ))}
        </div>

        {/* View All */}
        <div className="mt-12">
          <Link href={`/${locale}/${mentorSlug}`} className="inline-block">
            <button className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-2 border-transparent hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-900 dark:hover:border-neutral-100 px-8 py-3 text-sm font-medium transition-all duration-300 focus:outline-none rounded-md shadow-sm flex items-center gap-2">
              {locale === 'tr' ? 'Tüm Mentörlükleri Göster' : 'View All Mentorships'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
