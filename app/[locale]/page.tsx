// app/[locale]/page.tsx
import HeroSection from '../components/HeroSection';
import FeaturedFilter from '../components/FeaturedFilter';
import StudySection from '../components/StudySection';
import BlogSection from '../components/BlogSection';
import EventListFilter from '../components/EventListFilter';

// Yeni section'ları import edin
import WhyChooseSection from '../components/WhyChooseSection';


// Type definition for better type safety
interface HomePageProps {
  params: Promise<{ locale: string }>;
}

// Supported locales for validation
const SUPPORTED_LOCALES = ['tr', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Locale validation function
function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export default async function HomePage({ params }: HomePageProps) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams.locale;
  
  // Validate locale and fallback to 'tr' if invalid
  const locale: SupportedLocale = isValidLocale(rawLocale) ? rawLocale : 'tr';

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Hero Section with full width container */}
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        <HeroSection locale={locale} />
      </div>


      <div className="max-w-7xl mx-auto px-6 lg:px-6 space-y-0">
        <FeaturedFilter locale={locale} />
        <StudySection locale={locale} />
      </div>


      {/* Why Choose MyUNI Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        <WhyChooseSection locale={locale} />
      </div>




      {/* Blog and Events */}
      <div className="max-w-7xl mx-auto px-6 lg:px-6 space-y-0">
        <BlogSection locale={locale} /> 
        <EventListFilter locale={locale} />
      </div>


    </main>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map(locale => ({ locale }));
}

// Add metadata generation for better SEO
export async function generateMetadata({ params }: HomePageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const validLocale: SupportedLocale = isValidLocale(locale) ? locale : 'tr';

  // Build base URL - sonundaki slash'ı temizle
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net').replace(/\/+$/, '');
  
  // Canonical URLs
  const canonicalUrl = `${baseUrl}/${validLocale}`;
  const trUrl = `${baseUrl}/tr`;
  const enUrl = `${baseUrl}/en`;

  const metadata = {
    tr: {
      title: 'MyUNI - Kariyerine Yön Ver, Potansiyelini Keşfet!',
      description: 'Yapay zeka destekli MyUNI eğitim platformu ile kendi öğrenme tarzınıza uygun şekilde ilerleyin. Deneyimli eğitmenler ve esnek öğrenme seçenekleriyle kariyerinizi geliştirin.',
      keywords: [
        'MyUNI',
        'eğitim platformu',
        'online eğitim',
        'yapay zeka eğitim',
        'kariyer geliştirme',
        'kişiselleştirilmiş öğrenme',
        'esnek eğitim',
        'beceri geliştirme',
        'uzaktan eğitim',
        'sertifikalı eğitim',
        'uzman eğitmen',
        'interaktif öğrenme'
      ]
    },
    en: {
      title: 'MyUNI - Shape Your Career, Discover Your Potential!',
      description: 'Progress according to your learning style with AI-powered MyUNI education platform. Develop your career with experienced instructors and flexible learning options.',
      keywords: [
        'MyUNI',
        'education platform',
        'online learning',
        'AI education',
        'career development',
        'personalized learning',
        'flexible education',
        'skill development',
        'remote learning',
        'certified education',
        'expert instructor',
        'interactive learning'
      ]
    }
  };

  const content = metadata[validLocale];

  return {
    title: content.title,
    description: content.description,
    keywords: content.keywords,
    authors: [{ name: validLocale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform' }],
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': trUrl,
        'en': enUrl,
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: canonicalUrl,
      siteName: validLocale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: content.title,
        },
      ],
      locale: validLocale === 'tr' ? 'tr_TR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: [`${baseUrl}/twitter-image.jpg`],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'EducationalOrganization',
        name: validLocale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform',
        alternateName: 'MyUNI',
        url: canonicalUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`,
        },
        description: content.description,
        sameAs: [
          'https://x.com/myuniturkiye',
          'https://linkedin.com/company/myuniturkiye',
          'https://instagram.com/myuniturkiye',
          'https://youtube.com/@myuniturkiye'
        ],
        educationalCredentialAwarded: validLocale === 'tr' ? 'Sertifika' : 'Certificate',
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          name: validLocale === 'tr' ? 'MyUNI Tamamlama Sertifikası' : 'MyUNI Completion Certificate'
        },
        inLanguage: validLocale === 'tr' ? 'tr-TR' : 'en-US',
      }),
    },
  };
}