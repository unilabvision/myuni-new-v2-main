import type { Metadata } from 'next';
import InternshipDetailPage from '@/app/components/pages/stajlar/InternshipDetailPage';
import UnilabVolunteerPage from '@/app/components/pages/stajlar/UnilabVolunteerPage';
import {
  getOpportunityBySlug,
  localizeText,
} from '@/lib/opportunityService';
import { getSiteApplicationsSupabase } from '@/lib/supabaseSiteApplications';
import {
  getUnilabVolunteerMetadata,
  isUnilabVolunteerSlug,
} from '@/lib/unilabVolunteer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function resolveFormSlug(
  siteFormId: string | null | undefined,
  fallbackSlug: string
): Promise<string> {
  if (!siteFormId) return fallbackSlug;
  try {
    const supabase = getSiteApplicationsSupabase();
    const { data } = await supabase
      .from('myuni_site_application_forms')
      .select('slug_tr, slug_en')
      .eq('id', siteFormId)
      .maybeSingle();
    return (
      (data?.slug_tr as string | undefined)?.trim() ||
      (data?.slug_en as string | undefined)?.trim() ||
      fallbackSlug
    );
  } catch {
    return fallbackSlug;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (isUnilabVolunteerSlug(slug)) {
    const meta = getUnilabVolunteerMetadata(locale);
    return { title: meta.title, description: meta.description };
  }
  const opportunity = await getOpportunityBySlug(slug, { requireActive: false });
  const title = opportunity
    ? localizeText(opportunity.title, locale)
    : slug.replace(/-/g, ' ');
  const description = opportunity
    ? localizeText(opportunity.description, locale)
    : undefined;
  return {
    title:
      locale === 'tr'
        ? `${title} | Staj | MyUNI`
        : `${title} | Internship | MyUNI`,
    description: description || undefined,
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

  const opportunity = await getOpportunityBySlug(slug, {
    requireActive: false,
  });

  if (!opportunity) {
    return <InternshipDetailPage slug={slug} locale={locale} initialOpp={null} />;
  }

  const formSlug = await resolveFormSlug(opportunity.site_form_id, opportunity.slug);

  return (
    <InternshipDetailPage
      slug={slug}
      locale={locale}
      initialOpp={{
        slug: opportunity.slug,
        is_active: opportunity.is_active,
        banner_url: opportunity.banner_url,
        thumbnail_url: opportunity.thumbnail_url,
        company_name: opportunity.company_name,
        application_deadline: opportunity.application_deadline,
        work_mode: opportunity.work_mode,
        location: opportunity.location,
        opportunity_type: opportunity.opportunity_type,
        title: localizeText(opportunity.title, locale),
        description: localizeText(opportunity.description, locale),
        form_slug: formSlug,
      }}
    />
  );
}
