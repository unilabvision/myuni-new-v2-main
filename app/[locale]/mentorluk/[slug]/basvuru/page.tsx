import type { Metadata } from 'next';
import MentorshipApplyForm from '@/app/components/pages/mentorluk/MentorshipApplyForm';
import { getPublicMentorshipBySlug } from '@/lib/mentorshipService';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  return {
    title:
      locale === 'en'
        ? 'Mentorship Application | MyUNI'
        : 'Mentörlük Başvurusu | MyUNI',
    alternates: {
      canonical: `https://www.myunilab.net/${locale}/${locale === 'en' ? 'mentorship' : 'mentorluk'}/${slug}/basvuru`,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params;
  const item = await getPublicMentorshipBySlug(slug, locale);
  if (!item || !item.is_application_open) {
    notFound();
  }
  return (
    <MentorshipApplyForm locale={locale} slug={slug} title={item.title} />
  );
}
