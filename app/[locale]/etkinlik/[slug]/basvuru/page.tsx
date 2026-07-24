import EventApplicationPage from '@/app/components/pages/applications/EventApplicationPage';
import type { RegistrationTier } from '@/lib/siteApplications/packages';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ tier?: string }>;
}

function parseRegistrationTier(tier?: string): RegistrationTier {
  return tier === 'certificate' ? 'certificate' : 'free';
}

export default async function EventApplicationRoute({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const { tier } = await searchParams;
  return (
    <EventApplicationPage
      locale={locale}
      eventSlug={slug}
      registrationTier={parseRegistrationTier(tier)}
    />
  );
}
