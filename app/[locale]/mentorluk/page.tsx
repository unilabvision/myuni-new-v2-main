import type { Metadata } from 'next';
import MentorshipListPage from '@/app/components/pages/mentorluk/MentorshipListPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const path = locale === 'en' ? 'mentorship' : 'mentorluk';
  const canonicalUrl = `https://myunilab.net/${locale}/${path}`;

  return {
    title:
      locale === 'en'
        ? 'Mentorships | MyUNI'
        : 'Mentörlükler | MyUNI',
    description:
      locale === 'en'
        ? 'Discover mentorship programs with expert mentors at MyUNI.'
        : 'MyUNI uzman mentörleriyle mentörlük programlarını keşfedin.',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        tr: 'https://myunilab.net/tr/mentorluk',
        en: 'https://myunilab.net/en/mentorship',
      },
    },
  };
}

export default async function MentorlukPage({ params }: PageProps) {
  const { locale } = await params;
  return <MentorshipListPage locale={locale} />;
}
