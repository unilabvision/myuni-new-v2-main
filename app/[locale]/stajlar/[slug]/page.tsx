import type { Metadata } from 'next';
import InternshipDetailPage from '@/app/components/pages/stajlar/InternshipDetailPage';
import UnilabVolunteerPage from '@/app/components/pages/stajlar/UnilabVolunteerPage';
import {
  getUnilabVolunteerMetadata,
  isUnilabVolunteerSlug,
} from '@/lib/unilabVolunteer';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (isUnilabVolunteerSlug(slug)) {
    const meta = getUnilabVolunteerMetadata(locale);
    return { title: meta.title, description: meta.description };
  }
  return {
    title:
      locale === 'tr'
        ? `${slug.replace(/-/g, ' ')} | Staj | MyUNI`
        : `${slug.replace(/-/g, ' ')} | Internship | MyUNI`,
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  if (isUnilabVolunteerSlug(slug)) {
    return <UnilabVolunteerPage locale={locale} />;
  }
  return <InternshipDetailPage slug={slug} locale={locale} />;
}
