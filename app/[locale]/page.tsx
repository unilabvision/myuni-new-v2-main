// app/[locale]/page.tsx
import HeroSection from '../components/HeroSection';
import FeaturedFilter from '../components/FeaturedFilter';
import FeaturedMentorshipSection from '../components/FeaturedMentorshipSection';
import DynamicTestimonialSection from '../components/DynamicTestimonialSection';
import BlogSection from '../components/BlogSection';
import EventListFilter from '../components/EventListFilter';

import WhyChooseSection from '../components/WhyChooseSection';
import { supabase } from '@/lib/supabase';
import { getPublicMentorships, type PublicMentorship } from '@/lib/mentorshipService';
import { resolvePublicBaseUrl } from '@/lib/publicBaseUrl';


interface HomePageProps {
  params: Promise<{ locale: string }>;
}

const SUPPORTED_LOCALES = ['tr', 'en'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

function isValidLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}

export default async function HomePage({ params }: HomePageProps) {
  const resolvedParams = await params;
  const rawLocale = resolvedParams.locale;

  const locale: SupportedLocale = isValidLocale(rawLocale) ? rawLocale : 'tr';

  let activeCourseCount = 5;
  try {
    const { count, error } = await supabase
      .from('myuni_courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (!error && count !== null) {
      activeCourseCount = count;
    }
  } catch (err) {
    console.error("Error fetching active courses for SSR:", err);
  }

  let featuredMentorships: PublicMentorship[] = [];
  try {
    featuredMentorships = await getPublicMentorships(locale, { limit: 3 });
  } catch (err) {
    console.error('Error fetching mentorships for home page:', err);
  }

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <HeroSection locale={locale} activeCourseCount={activeCourseCount} />

      <div className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/45">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <FeaturedFilter locale={locale} />
        </div>
      </div>

      <FeaturedMentorshipSection
        mentorships={featuredMentorships}
        locale={locale}
      />

      <DynamicTestimonialSection locale={locale} />

      <WhyChooseSection locale={locale} />

      <div className="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <BlogSection locale={locale} />
        </div>
      </div>

      <div className="border-t border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/45">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <EventListFilter locale={locale} />
        </div>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map(locale => ({ locale }));
}

export async function generateMetadata({ params }: HomePageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const validLocale: SupportedLocale = isValidLocale(locale) ? locale : 'tr';

  const baseUrl = resolvePublicBaseUrl();

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
