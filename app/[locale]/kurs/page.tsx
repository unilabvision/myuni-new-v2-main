import type { Metadata } from "next";
import CourseListPage from '../../components/pages/kurs/CourseListPage';

interface CoursePageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Page level metadata - bu layout metadata'sını override eder
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'tr';
  
  const courseType = locale === 'tr' ? 'kurs' : 'course';
  const canonicalUrl = `https://myunilab.net/${locale}/${courseType}`;
  const trPath = `https://myunilab.net/tr/kurs`;
  const enPath = `https://myunilab.net/en/course`;

  return {
    title: locale === 'tr'
      ? "Kurslar | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
      : "Courses | MyUNI - AI-Powered Learning Platform",
    description: locale === 'tr'
      ? "MyUNI'de uzman eğitmenler tarafından hazırlanmış kursları keşfedin. Online, canlı ve hibrit eğitim seçenekleri ile kariyerinizi ilerletin. Yapay zeka destekli kişiselleştirilmiş öğrenme deneyimi."
      : "Discover courses prepared by expert instructors at MyUNI. Advance your career with online, live and hybrid education options. AI-powered personalized learning experience.",
    keywords: locale === 'tr'
      ? [
          "MyUNI kurslar",
          "online eğitim",
          "yapay zeka eğitim",
          "kariyer geliştirme",
          "beceri geliştirme",
          "sertifikalı eğitim",
          "uzaktan eğitim",
          "canlı eğitim",
          "hibrit eğitim",
          "teknoloji kursları",
          "iş becerileri"
        ]
      : [
          "MyUNI courses",
          "online education",
          "AI education",
          "career development",
          "skill development",
          "certified education",
          "remote learning",
          "live training",
          "hybrid education",
          "technology courses",
          "business skills"
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
      title: locale === 'tr'
        ? "Kurslar | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
        : "Courses | MyUNI - AI-Powered Learning Platform",
      description: locale === 'tr'
        ? "MyUNI'de uzman eğitmenler tarafından hazırlanmış kursları keşfedin. Online, canlı ve hibrit eğitim seçenekleri ile kariyerinizi ilerletin."
        : "Discover courses prepared by expert instructors at MyUNI. Advance your career with online, live and hybrid education options.",
      url: canonicalUrl,
      siteName: "MyUNI Eğitim Platformu",
      images: [
        {
          url: "https://myunilab.net/og-courses.jpg",
          width: 1200,
          height: 630,
          alt: locale === 'tr' ? "MyUNI Kurslar Sayfası" : "MyUNI Courses Page",
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: locale === 'tr'
        ? "Kurslar | MyUNI - Yapay Zeka Destekli Eğitim"
        : "Courses | MyUNI - AI-Powered Learning",
      description: locale === 'tr'
        ? "Uzman eğitmenlerle kariyerinizi ilerletin. Online, canlı ve hibrit eğitim seçenekleri."
        : "Advance your career with expert instructors. Online, live and hybrid education options.",
      images: ["https://myunilab.net/twitter-courses.jpg"],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": locale === 'tr' ? "MyUNI Kurslar" : "MyUNI Courses",
        "description": locale === 'tr'
          ? "MyUNI'de sunulan tüm kursların listesi. Yapay zeka, teknoloji ve iş becerileri alanlarında uzman eğitmenlerle öğrenin."
          : "List of all courses offered at MyUNI. Learn with expert instructors in artificial intelligence, technology and business skills.",
        "url": canonicalUrl,
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
        "educationalLevel": "all-levels",
        "teaches": locale === 'tr' 
          ? ["Yapay Zeka", "Teknoloji", "İş Becerileri", "Kariyer Geliştirme"]
          : ["Artificial Intelligence", "Technology", "Business Skills", "Career Development"]
      }),
    },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const resolvedParams = await params;
  
  const courseParams = Promise.resolve({
    locale: resolvedParams.locale,
    courseType: resolvedParams.locale === 'tr' ? 'kurs' : 'course'
  });

  return <CourseListPage params={courseParams} />;
}