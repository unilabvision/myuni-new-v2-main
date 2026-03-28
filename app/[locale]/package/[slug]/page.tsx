// app/[locale]/package/[slug]/page.tsx
import type { Metadata } from "next";
import PackageDetailPage from '../../../components/pages/paket/[slug]/page';
import { getPackageBySlug, mapLevelToLocale } from '../../../../lib/courseService';

interface CourseDetailProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  
  const courseType = locale === 'tr' ? 'paket' : 'package';
  const canonicalUrl = `https://myunilab.net/${locale}/${courseType}/${slug}`;
  const trPath = `https://myunilab.net/tr/paket/${slug}`;
  const enPath = `https://myunilab.net/en/package/${slug}`;

  let courseData = null;
  let courseTitle = '';
  let courseDescription = '';
  let courseLevel = '';
  let coursePrice = 0;
  let courseType_internal = 'online';

  try {
    courseData = await getPackageBySlug(slug, locale);
    if (courseData) {
      courseTitle = String(courseData.title || courseData.name || '');
      courseDescription = String(courseData.description || '');
      courseLevel = mapLevelToLocale(String(courseData.level || ''), locale);
      coursePrice = Number(courseData.price || 0);
      courseType_internal = (courseData.course_type as string) || 'online';
    }
  } catch (error) {
    console.error('Error fetching package data for metadata:', error);
  }

  const stripHtml = (html: string): string => {
    if (!html) return '';
    const withoutTags = html.replace(/<[^>]*>/g, '');
    const withoutEntities = withoutTags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return withoutEntities.replace(/\s+/g, ' ').trim();
  };

  const title = courseTitle 
    ? `${courseTitle} | MyUNI ${locale === 'tr' ? 'Eğitim Paketi' : 'Course Bundle'}`
    : locale === 'tr'
      ? `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Paketi | MyUNI`
      : `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Bundle | MyUNI`;

  const cleanDescription = stripHtml(courseDescription);
  const description = cleanDescription 
    ? cleanDescription.length > 160 
      ? cleanDescription.substring(0, 157) + '...'
      : cleanDescription
    : locale === 'tr'
      ? `${courseTitle || slug.replace(/-/g, ' ')} eğitim paketi ile becerilerinizi geliştirin.`
      : `Develop your skills with the ${courseTitle || slug.replace(/-/g, ' ')} course bundle.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': trPath,
        'en': enPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "MyUNI",
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "website",
    },
  };
}

export default async function Page({ params }: CourseDetailProps) {
  const resolvedParams = await params;
  
  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: resolvedParams.locale === 'tr' ? 'paket' : 'package',
    slug: resolvedParams.slug
  });

  return <PackageDetailPage params={courseParams} />;
}
