import type { Metadata } from 'next';
import PackageListPage from '@/app/components/pages/paket/PackageListPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const path = locale === 'en' ? 'package' : 'paket';
  return {
    title:
      locale === 'en'
        ? 'Training Packages | MyUNI'
        : 'Eğitim Paketleri | MyUNI',
    description:
      locale === 'en'
        ? 'Browse MyUNI training packages that combine multiple courses.'
        : 'Birden fazla eğitimi birleştiren MyUNI eğitim paketlerini keşfedin.',
    alternates: {
      canonical: `https://myunilab.net/${locale}/${path}`,
      languages: {
        tr: 'https://myunilab.net/tr/paket',
        en: 'https://myunilab.net/en/package',
      },
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  return <PackageListPage locale={locale} />;
}
