import type { Metadata } from 'next';
import MembershipLandingPage from '@/app/components/pages/membership/MembershipLandingPage';
import { getPublishedMembershipPlans } from '@/lib/membershipPlans';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Membership Plans | MyUNI',
  description: 'Explore MyUNI fixed-term membership plans, pricing and included services.',
  alternates: {
    canonical: 'https://myunilab.net/en/membership',
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
