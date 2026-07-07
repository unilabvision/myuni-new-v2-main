import InternshipDetailPage from '@/app/components/pages/stajlar/InternshipDetailPage';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  return <InternshipDetailPage slug={slug} locale={locale} />;
}
