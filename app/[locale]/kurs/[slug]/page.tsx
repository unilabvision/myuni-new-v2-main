// app/[locale]/kurs/[slug]/page.tsx
import type { Metadata } from "next";
import CourseDetailPage from '../../../components/pages/kurs/[slug]/page';
import { getCourseBySlug, mapLevelToLocale } from '../../../../lib/courseService';

interface CourseDetailProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Page level metadata - bu layout metadata'sını override eder
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  
  const courseType = locale === 'tr' ? 'kurs' : 'course';
  const canonicalUrl = `https://myunilab.net/${locale}/${courseType}/${slug}`;
  const trPath = `https://myunilab.net/tr/kurs/${slug}`;
  const enPath = `https://myunilab.net/en/course/${slug}`;

  // Kurs bilgilerini al
  let courseData = null;
  let courseTitle = '';
  let courseDescription = '';
  let courseLevel = '';
  let coursePrice = 0;
  let courseType_internal = 'online';

  try {
    courseData = await getCourseBySlug(slug, locale);
    console.log('🔍 COURSE PAGE METADATA - Course data fetched:', courseData);
    console.log('🔍 COURSE PAGE METADATA - Early bird price:', courseData?.early_bird_price);
    console.log('🔍 COURSE PAGE METADATA - Early bird deadline:', courseData?.early_bird_deadline);
    if (courseData) {
      courseTitle = String(courseData.title || courseData.name || '');
      courseDescription = String(courseData.description || '');
      courseLevel = mapLevelToLocale(String(courseData.level || ''), locale);
      coursePrice = Number(courseData.price || 0);
      courseType_internal = (courseData.course_type as string) || 'online';
    }
  } catch (error) {
    console.error('Error fetching course data for metadata:', error);
  }

  // HTML'den düz metne çevirme fonksiyonu
  const stripHtml = (html: string): string => {
    if (!html) return '';
    // HTML etiketlerini kaldır
    const withoutTags = html.replace(/<[^>]*>/g, '');
    // HTML entity'leri decode et
    const withoutEntities = withoutTags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    // Fazla boşlukları temizle
    return withoutEntities.replace(/\s+/g, ' ').trim();
  };

  // Fallback title ve description
  const title = courseTitle 
    ? `${courseTitle} | MyUNI ${locale === 'tr' ? 'Kursu' : 'Course'}`
    : locale === 'tr'
      ? `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Kursu | MyUNI`
      : `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Course | MyUNI`;

  // HTML'den temizlenmiş description
  const cleanDescription = stripHtml(courseDescription);
  const description = cleanDescription 
    ? cleanDescription.length > 160 
      ? cleanDescription.substring(0, 157) + '...'
      : cleanDescription
    : locale === 'tr'
      ? `${courseTitle || slug.replace(/-/g, ' ')} kursu ile becerilerinizi geliştirin. MyUNI'de uzman eğitmenlerle interaktif öğrenme deneyimi yaşayın.`
      : `Develop your skills with ${courseTitle || slug.replace(/-/g, ' ')} course. Experience interactive learning with expert instructors at MyUNI.`;

  // Course type için ek açıklama
  const courseTypeText = locale === 'tr' 
    ? {
        online: 'Online eğitim',
        live: 'Canlı eğitim',
        hybrid: 'Hibrit eğitim'
      }
    : {
        online: 'Online course',
        live: 'Live course', 
        hybrid: 'Hybrid course'
      };

  const typeDescription = courseTypeText[courseType_internal as keyof typeof courseTypeText] || courseTypeText.online;

  return {
    title,
    description,
    keywords: locale === 'tr'
      ? [
          courseTitle || slug,
          "MyUNI kurs",
          "online eğitim",
          "yapay zeka eğitim",
          "kariyer geliştirme",
          "beceri geliştirme",
          "sertifikalı eğitim",
          courseLevel,
          typeDescription,
          "uzman eğitmen",
          "interaktif öğrenme"
        ]
      : [
          courseTitle || slug,
          "MyUNI course",
          "online education",
          "AI education",
          "career development",
          "skill development",
          "certified education",
          courseLevel,
          typeDescription,
          "expert instructor",
          "interactive learning"
        ],
    authors: [{ name: "MyUNI Eğitim Platformu" }],
    robots: "index, follow",
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
      siteName: "MyUNI Eğitim Platformu",
      images: [
        {
          url: courseData?.image || courseData?.thumbnail_url || `https://myunilab.net/og-course-${slug}.jpg`,
          width: 1200,
          height: 630,
          alt: `${courseTitle || slug} ${locale === 'tr' ? 'kursu' : 'course'}`,
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [courseData?.image || courseData?.thumbnail_url || courseData?.banner?.url || `https://myunilab.net/twitter-course-${slug}.jpg`],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Course",
        "name": courseTitle || slug.replace(/-/g, ' '),
        "description": cleanDescription || description,
        "url": canonicalUrl,
        "image": courseData?.image || courseData?.thumbnail_url || courseData?.banner?.url,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "MyUNI",
          "url": "https://myunilab.net",
          "logo": "https://myunilab.net/logo.png",
          "sameAs": [
            "https://x.com/myuniturkiye",
            "https://linkedin.com/company/myuniturkiye",
            "https://instagram.com/myuniturkiye",
            "https://youtube.com/@myuniturkiye"
          ]
        },
        "educationalLevel": courseLevel || "all-levels",
        "courseMode": courseType_internal === 'online' ? "online" : courseType_internal === 'live' ? "blended" : "mixed",
        "teaches": courseTitle || slug.replace(/-/g, ' '),
        ...(coursePrice > 0 && {
          "offers": {
            "@type": "Offer",
            "price": coursePrice,
            "priceCurrency": locale === 'tr' ? "TRY" : "USD",
            "availability": "https://schema.org/InStock",
            "url": canonicalUrl
          }
        }),
        ...(courseData?.duration && {
          "timeRequired": courseData.duration
        }),
        ...(courseData?.learning_outcomes && {
          "coursePrerequisites": locale === 'tr' ? "Temel bilgisayar kullanımı" : "Basic computer skills",
          "educationalCredentialAwarded": locale === 'tr' ? "MyUNI Tamamlama Sertifikası" : "MyUNI Completion Certificate"
        }),
        "inLanguage": locale === 'tr' ? "tr" : "en",
        "availableLanguage": [
          { "@type": "Language", "name": "Turkish", "alternateName": "tr" },
          { "@type": "Language", "name": "English", "alternateName": "en" }
        ]
      }),
    },
  };
}

export default async function Page({ params }: CourseDetailProps) {
  const resolvedParams = await params;
  
  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: resolvedParams.locale === 'tr' ? 'kurs' : 'course',
    slug: resolvedParams.slug
  });

  return <CourseDetailPage params={courseParams} />;
}