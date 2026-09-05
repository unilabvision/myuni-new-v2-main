import type { Metadata } from 'next';
import MentorshipDetailPage from '@/app/components/pages/mentorluk/MentorshipDetailPage';
import { getPublicMentorshipBySlug } from '@/lib/mentorshipService';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const path = locale === 'en' ? 'mentorship' : 'mentorluk';
  let title =
    locale === 'en' ? 'Mentorship | MyUNI' : 'Mentörlük | MyUNI';
  let description =
    locale === 'en'
      ? 'Mentorship program details'
      : 'Mentörlük programı detayları';

  try {
    const item = await getPublicMentorshipBySlug(slug, locale);
    if (item) {
      title = `${item.title} | MyUNI`;
      description = item.summary || item.description || description;
    }
  } catch {
    // ignore metadata fetch errors
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.myunilab.net/${locale}/${path}/${slug}`,
      languages: {
        tr: `https://www.myunilab.net/tr/mentorluk/${slug}`,
        en: `https://www.myunilab.net/en/mentorship/${slug}`,
      },
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  return <MentorshipDetailPage locale={locale} slug={slug} />;
}
