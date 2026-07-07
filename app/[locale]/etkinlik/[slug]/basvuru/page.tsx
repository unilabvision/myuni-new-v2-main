import EventApplicationPage from '@/app/components/pages/applications/EventApplicationPage';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function EventApplicationRoute({ params }: PageProps) {
  const { locale, slug } = await params;
  return <EventApplicationPage locale={locale} eventSlug={slug} />;
}
