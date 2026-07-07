import type { Metadata } from 'next';
import InternshipsListPage from '@/app/components/pages/stajlar/InternshipsListPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    title:
      locale === 'tr'
        ? 'Internship Opportunities | MyUNI'
        : 'Internship Opportunities | MyUNI',
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  return <InternshipsListPage locale={locale} />;
}
