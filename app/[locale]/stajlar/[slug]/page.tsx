import type { Metadata } from 'next';
import InternshipDetailPage from '@/app/components/pages/stajlar/InternshipDetailPage';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return {
    title:
      locale === 'tr'
        ? `${slug.replace(/-/g, ' ')} | Staj | MyUNI`
        : `${slug.replace(/-/g, ' ')} | Internship | MyUNI`,
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  return <InternshipDetailPage slug={slug} locale={locale} />;
}
