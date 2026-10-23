import type { Metadata } from 'next';
import MembershipLandingPage from '@/app/components/pages/membership/MembershipLandingPage';
import { getPublishedMembershipPlans } from '@/lib/membershipPlans';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Üyelik Paketleri | MyUNI',
  description: 'MyUNI süreli üyelik paketlerini, fiyatlarını ve dahil edilen hizmetleri inceleyin.',
  alternates: {
    canonical: 'https://myunilab.net/tr/uyelik',
    languages: {
      tr: 'https://myunilab.net/tr/uyelik',
      en: 'https://myunilab.net/en/membership',
    },
  },
};

export default async function MembershipPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  try {
    const plans = await getPublishedMembershipPlans();
    return <MembershipLandingPage locale={locale} plans={plans} />;
  } catch (error) {
    console.error('[membership page] plans could not be loaded', error);
    return <MembershipLandingPage locale={locale} plans={[]} unavailable />;
  }
}
