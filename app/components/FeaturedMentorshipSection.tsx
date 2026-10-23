// app/components/FeaturedMentorshipSection.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Users, MapPin, Monitor, Blend } from 'lucide-react';
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
      className="group flex h-full min-w-[84vw] snap-start flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-colors hover:border-[#990000]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4 sm:min-w-[360px] md:min-w-0 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-[#c6535f]"
    >
      <div className="relative aspect-[16/10] w-full flex-shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {mentorship.thumbnail_url ? (
          <Image
            src={mentorship.thumbnail_url}
            alt={mentorship.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950/75 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
            <ModeIcon mode={mentorship.mode} />
            <ModeLabel mode={mentorship.mode} locale={locale} />
          </span>
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
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

      <div className="flex flex-1 flex-col p-6">
        <h3 className="line-clamp-2 text-xl font-semibold leading-7 tracking-[-0.02em] text-neutral-950 transition-colors group-hover:text-[#990000] dark:text-white dark:group-hover:text-[#e08b94]">
          {mentorship.title}
        </h3>

        {mentorship.summary && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
            {mentorship.summary}
          </p>
        )}

        {/* Mentor info */}
        {mentorship.mentor_name && (
          <div className="mt-5 flex items-center gap-3">
            {mentorship.mentor_image_url ? (
              <Image
                src={mentorship.mentor_image_url}
                alt={mentorship.mentor_name}
                width={28}
                height={28}
                sizes="28px"
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

        {mentorship.max_mentees != null && (
          <div className="mt-5 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
            <Users className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {mentorship.current_mentees}/{mentorship.max_mentees}{' '}
              {locale === 'tr' ? 'mentor' : 'mentees'}
            </span>
          </div>
        )}

        <div className="mt-auto border-t border-neutral-100 pt-5 dark:border-neutral-800">
          <span
            className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
              isOpen
                ? 'text-[#990000] hover:text-[#770000]'
                : 'text-neutral-400 dark:text-neutral-500'
            }`}
          >
            {isOpen
              ? locale === 'tr' ? 'Başvur' : 'Apply'
              : locale === 'tr' ? 'Detayları Gör' : 'View Details'}
            <ArrowUpRight className="h-4 w-4" />
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
    <section className="border-b border-neutral-200 bg-white py-14 sm:py-16 lg:py-20 dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-6 sm:mb-10">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-neutral-950 sm:text-3xl dark:text-white">
            {locale === 'tr' ? 'Mentörlük Programları' : 'Mentorship Programs'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-400">
              {locale === 'tr'
                ? 'Deneyimli mentörlerle hedefinize uygun, odaklı bir çalışma yolu oluşturun.'
                : 'Build a focused path toward your goal with experienced mentors.'}
            </p>
          </div>
          <Link
            href={`/${locale}/${mentorSlug}`}
            className="hidden shrink-0 items-center gap-2 text-sm font-semibold text-[#990000] hover:text-[#760000] sm:inline-flex dark:text-[#e08b94]"
          >
            {locale === 'tr' ? 'Tümünü gör' : 'View all'}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3 lg:gap-6">
          {mentorships.map((m) => (
            <MentorshipCard key={m.id} mentorship={m} locale={locale} />
          ))}
        </div>

        <div className="mt-7 sm:hidden">
          <Link
            href={`/${locale}/${mentorSlug}`}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#990000] dark:text-[#e08b94]"
          >
            {locale === 'tr' ? 'Tüm mentörlükleri gör' : 'View all mentorships'}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
