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

function stripHtml(html: string): string {
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
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  const isEn = locale === 'en';

  const courseType = isEn ? 'package' : 'paket';
  const canonicalUrl = `https://myunilab.net/${locale}/${courseType}/${slug}`;
  const trPath = `https://myunilab.net/tr/paket/${slug}`;
  const enPath = `https://myunilab.net/en/package/${slug}`;
  const listUrl = `https://myunilab.net/${locale}/${courseType}`;

  let courseData: Awaited<ReturnType<typeof getPackageBySlug>> = null;
  let courseTitle = '';
  let courseDescription = '';
  let courseLevel = '';
  let coursePrice = 0;
  let courseType_internal = 'online';

  try {
    courseData = await getPackageBySlug(slug, locale);
    if (courseData) {
      courseData = courseData as NonNullable<typeof courseData>;
      courseTitle = String(courseData.title || courseData.name || '');
      courseDescription = String(courseData.description || '');
      courseLevel = mapLevelToLocale(String(courseData.level || ''), locale);
      coursePrice = Number(courseData.price || 0);
      courseType_internal = (courseData.course_type as string) || 'online';
    }
  } catch (error) {
    console.error('Error fetching package data for metadata:', error);
  }

  const displayName = courseTitle || slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  const title = isEn
    ? `${displayName} | MyUNI Training Package`
    : `${displayName} | MyUNI Eğitim Paketi`;

  const cleanDescription = stripHtml(courseDescription);
  const description = cleanDescription
    ? cleanDescription.length > 160
      ? cleanDescription.substring(0, 157) + '...'
      : cleanDescription
    : isEn
      ? `${displayName} is a MyUNI training package on myunilab.net that bundles multiple courses to help you build skills faster.`
      : `${displayName}, myunilab.net üzerindeki MyUNI eğitim paketidir; birden fazla kursu birleştirerek becerilerinizi daha hızlı geliştirmenizi sağlar.`;

  const imageUrl =
    courseData?.image ||
    courseData?.thumbnail_url ||
    courseData?.banner?.url ||
    'https://myunilab.net/og-image.jpg';

  return {
    title,
    description,
    keywords: isEn
      ? [
          displayName,
          'MyUNI',
          'MyUNI Lab',
          'myunilab.net',
          'training package',
          'course bundle',
          'online education',
          courseLevel,
          'certificate',
        ]
      : [
          displayName,
          'MyUNI',
          'MyUNI Lab',
          'myunilab.net',
          'eğitim paketi',
          'kurs paketi',
          'online eğitim',
          courseLevel,
          'sertifika',
        ],
    authors: [{ name: 'MyUNI Eğitim Platformu' }],
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        tr: trPath,
        en: enPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'MyUNI',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName} ${isEn ? 'training package' : 'eğitim paketi'}`,
        },
      ],
      locale: isEn ? 'en_US' : 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      description:
        description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [imageUrl],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Course',
            '@id': `${canonicalUrl}#course`,
            name: displayName,
            description: cleanDescription || description,
            url: canonicalUrl,
            image: imageUrl,
            provider: {
              '@type': 'EducationalOrganization',
              '@id': 'https://myunilab.net/#organization',
              name: 'MyUNI',
              url: 'https://myunilab.net',
              logo: 'https://myunilab.net/logo.png',
              sameAs: [
                'https://x.com/myuniturkiye',
                'https://linkedin.com/company/myuniturkiye',
                'https://instagram.com/myuniturkiye',
                'https://youtube.com/@myuniturkiye',
              ],
            },
            educationalLevel: courseLevel || 'all-levels',
            courseMode:
              courseType_internal === 'online'
                ? 'online'
                : courseType_internal === 'live'
                  ? 'blended'
                  : 'mixed',
            teaches: displayName,
            offers: {
              '@type': 'Offer',
              price: coursePrice,
              priceCurrency: 'TRY',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            },
            ...(courseData?.duration ? { timeRequired: courseData.duration } : {}),
            educationalCredentialAwarded: isEn
              ? 'MyUNI Completion Certificate'
              : 'MyUNI Tamamlama Sertifikası',
            inLanguage: isEn ? 'en' : 'tr',
            availableLanguage: [
              { '@type': 'Language', name: 'Turkish', alternateName: 'tr' },
              { '@type': 'Language', name: 'English', alternateName: 'en' },
            ],
          },
          {
            '@type': 'Product',
            '@id': `${canonicalUrl}#product`,
            name: displayName,
            description: cleanDescription || description,
            url: canonicalUrl,
            image: imageUrl,
            brand: {
              '@type': 'Brand',
              name: 'MyUNI',
            },
            offers: {
              '@type': 'Offer',
              price: coursePrice,
              priceCurrency: 'TRY',
              availability: 'https://schema.org/InStock',
              url: canonicalUrl,
            },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'MyUNI',
                item: `https://myunilab.net/${locale}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: isEn ? 'Training Packages' : 'Eğitim Paketleri',
                item: listUrl,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: displayName,
                item: canonicalUrl,
              },
            ],
          },
        ],
      }),
    },
  };
}

export default async function Page({ params }: CourseDetailProps) {
  const resolvedParams = await params;

  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: resolvedParams.locale === 'tr' ? 'paket' : 'package',
    slug: resolvedParams.slug,
  });

  return <PackageDetailPage params={courseParams} />;
}
