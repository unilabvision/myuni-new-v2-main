import type { Metadata } from 'next';
import InternshipDetailPage from '@/app/components/pages/stajlar/InternshipDetailPage';
import UnilabVolunteerPage from '@/app/components/pages/stajlar/UnilabVolunteerPage';
import { getOpportunityBySlug } from '@/lib/opportunityService';
import {
  getUnilabVolunteerMetadata,
  isUnilabVolunteerSlug,
} from '@/lib/unilabVolunteer';

/** Panelden banner güncellenince cache'te eski görsel kalmasın */
export const dynamic = 'force-dynamic';

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
    title: `${slug.replace(/-/g, ' ')} | Internship | MyUNI`,
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  if (isUnilabVolunteerSlug(slug)) {
    const opportunity = await getOpportunityBySlug(slug, {
      requireActive: false,
    });
    return (
      <UnilabVolunteerPage
        locale={locale}
        initialOpp={
          opportunity
            ? {
                is_active: opportunity.is_active,
                banner_url: opportunity.banner_url,
                thumbnail_url: opportunity.thumbnail_url,
                company_name: opportunity.company_name,
                application_deadline: opportunity.application_deadline,
                work_mode: opportunity.work_mode,
                location: opportunity.location,
              }
            : null
        }
      />
    );
  }
  return <InternshipDetailPage slug={slug} locale={locale} />;
}
