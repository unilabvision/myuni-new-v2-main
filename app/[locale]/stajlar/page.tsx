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
        ? 'Staj Fırsatları | MyUNI'
        : 'Internship Opportunities | MyUNI',
    description:
      locale === 'tr'
        ? 'Eğitimlerinize göre kişiselleştirilmiş staj fırsatlarını keşfedin.'
        : 'Discover internship opportunities personalized to your courses.',
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  return <InternshipsListPage locale={locale} />;
}
