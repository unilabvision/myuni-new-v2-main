import { getPageFromSlug, pageRoutes } from '@/app/lib/routes';
import PageHandler from '@/app/components/pages/PageHandler';
import type { Metadata } from 'next';
import { default as aboutContentModule } from '@/app/components/pages/about/content';
import { default as contactContentModule } from '@/app/components/pages/contact/content';
import { getUnilabBlogContent } from '@/app/services/unilabBlogService';

// Define the interface for the page props
interface PageParams {
  locale: string;
  slug: string[];
}

// ✅ Correct typing for App Router page component
type PageProps = {
  params: Promise<PageParams>;
};

const PageSlug = async ({ params }: PageProps) => {
  const { locale, slug } = await params;
  const slugString = slug?.[0] || '';

  const pageType = getPageFromSlug(locale, slugString);

  return <PageHandler pageType={pageType || 'not-found'} locale={locale} />;
};

export default PageSlug;

// Helper function to get page content (reusing PageHandler logic)
async function getPageContent(locale: string, pageType: string): Promise<{ title: string; description: string; seoDescription?: string } | null> {
  if (locale !== 'tr' && locale !== 'en') {
    return null;
  }

  const localeKey = locale as 'tr' | 'en';

  switch (pageType) {
    case 'about':
      return aboutContentModule[localeKey] || null;
    case 'contact':
      return contactContentModule[localeKey] || null;
    case 'blog': {
      const blogContent = await getUnilabBlogContent(locale);
      return blogContent || null;
    }
    case 'projects':
      return {
        title: locale === 'tr' ? 'Projeler' : 'Projects',
        description: locale === 'tr'
          ? 'Bilim ve teknolojiinin sınırlarını zorlayan yenilikçi projelerle geleceği şekillendiriyoruz. UNILAB Vision olarak, farklı disiplinlerdeki uzman ekiplerimizle sürdürülebilir çözümler geliştiriyor, bilimi topluma ulaştırıyor ve geleceğin teknolojilerini bugünden inşa ediyoruz.'
          : 'We shape the future with innovative projects that push the boundaries of science and technology. As UNILAB Vision, we develop sustainable solutions with our expert teams in different disciplines, bring science to society and build the technologies of the future today.'
      };
    case 'careers':
      return {
        title: locale === 'tr' ? 'Kariyer' : 'Careers',
        description: locale === 'tr'
          ? 'Ekibimize katılacak yaratıcı, meraklı ve çözüm odaklı bireylerle beraber, geleceğin dünyasını inşa ediyoruz.'
          : 'Join our team of creative, curious and solution-oriented individuals as we build the world of the future.'
      };
    case 'egitmen':
      return {
        title: locale === 'tr' ? 'Eğitmen Başvurusu' : 'Instructor Application',
        description: locale === 'tr'
          ? 'MyUNI eğitim ekibine katılın ve bilginizi paylaşarak geleceğin liderleri yetiştirin.'
          : 'Join the MyUNI education team and train future leaders by sharing your knowledge.'
      };
    case 'kulup':
      return {
        title: locale === 'tr' ? 'MyUNI Kulüp Ağı' : 'MyUNI Club Network',
        description: locale === 'tr'
          ? 'Okul topluluklarınızla birlikte güçlü bir ağ oluşturalım ve ortak projeler geliştirelim.'
          : 'Let\'s build a strong network with your school communities and develop joint projects.'
      };
    case 'newsletter':
      return {
        title: locale === 'tr' ? 'Bülten' : 'Newsletter',
        description: locale === 'tr'
          ? 'En son haberler, güncellemeler ve özel içerikler için bültenimize abone olun.'
          : 'Subscribe to our newsletter for the latest news, updates and exclusive content.'
      };
    case 'terms':
      return {
        title: locale === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service',
        description: locale === 'tr'
          ? 'MyUNI hizmetlerinin kullanım koşulları ve şartları.'
          : 'Terms and conditions for using MyUNI services.'
      };
    case 'privacy':
      return {
        title: locale === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy',
        description: locale === 'tr'
          ? 'Kişisel verilerinizin korunması ve gizlilik politikamız.'
          : 'Our privacy policy and protection of your personal data.'
      };
    default:
      return null;
  }
}

// ✅ Complete SEO metadata generation with canonical URLs
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const slugString = slug?.[0] || '';

  // Get page type from slug
  const pageType = getPageFromSlug(locale, slugString);

  // If page not found, return basic metadata
  if (!pageType) {
    return {
      title: locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
      description: locale === 'tr'
        ? 'Aradığınız sayfa bulunamadı.'
        : 'The page you are looking for could not be found.',
      robots: 'noindex, nofollow',
    };
  }

  // Get page content
  const pageContent = await getPageContent(locale, pageType);
  if (!pageContent) {
    return {
      title: locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
      description: locale === 'tr'
        ? 'Aradığınız sayfa bulunamadı.'
        : 'The page you are looking for could not be found.',
      robots: 'noindex, nofollow',
    };
  }

  // Build base URL - sonundaki slash'ı temizle
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://myunilab.net').replace(/\/+$/, '');

  // Get current page slug
  const currentSlug = pageRoutes[pageType as keyof typeof pageRoutes]?.[locale as 'tr' | 'en'] || slugString;
  const canonicalUrl = `${baseUrl}/${locale}/${currentSlug}`;

  // Get alternate language slug
  const alternateLocale = locale === 'tr' ? 'en' : 'tr';
  const alternateSlug = pageRoutes[pageType as keyof typeof pageRoutes]?.[alternateLocale as 'tr' | 'en'] || currentSlug;
  const alternateUrl = `${baseUrl}/${alternateLocale}/${alternateSlug}`;

  // Build full title
  const title = `${pageContent.title} | ${locale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform'}`;

  // SEO için description: seoDescription varsa onu kullan, yoksa description'u kısalt
  const seoDescription: string = pageContent.seoDescription && typeof pageContent.seoDescription === 'string'
    ? pageContent.seoDescription
    : pageContent.description.length > 160
      ? pageContent.description.substring(0, 157) + '...'
      : pageContent.description;

  // Generate keywords based on page type
  const baseKeywords = locale === 'tr'
    ? ['MyUNI', 'eğitim platformu', 'online eğitim', 'yapay zeka eğitim']
    : ['MyUNI', 'education platform', 'online learning', 'AI education'];

  const pageSpecificKeywords: Record<string, string[]> = {
    about: locale === 'tr'
      ? ['hakkımızda', 'misyon', 'vizyon', 'değerler', 'ekip']
      : ['about us', 'mission', 'vision', 'values', 'team'],
    contact: locale === 'tr'
      ? ['iletişim', 'bize ulaşın', 'iletişim formu', 'destek']
      : ['contact', 'get in touch', 'contact form', 'support'],
    careers: locale === 'tr'
      ? ['kariyer', 'iş ilanları', 'ekibe katıl', 'kariyer fırsatları']
      : ['careers', 'job openings', 'join our team', 'career opportunities'],
    projects: locale === 'tr'
      ? ['projeler', 'inovasyon', 'araştırma', 'geliştirme']
      : ['projects', 'innovation', 'research', 'development'],
    blog: locale === 'tr'
      ? ['blog', 'yazılar', 'makaleler', 'haberler']
      : ['blog', 'articles', 'posts', 'news'],
    egitmen: locale === 'tr'
      ? ['eğitmen', 'eğitmen başvurusu', 'öğretmen', 'eğitimci']
      : ['instructor', 'instructor application', 'teacher', 'educator'],
    kulup: locale === 'tr'
      ? ['kulüp', 'topluluk', 'öğrenci kulübü', 'ağ']
      : ['club', 'community', 'student club', 'network'],
    newsletter: locale === 'tr'
      ? ['bülten', 'haber bülteni', 'abone ol', 'güncellemeler']
      : ['newsletter', 'newsletter subscription', 'subscribe', 'updates'],
    terms: locale === 'tr'
      ? ['kullanım koşulları', 'şartlar', 'yasal', 'sözleşme']
      : ['terms of service', 'terms', 'legal', 'agreement'],
    privacy: locale === 'tr'
      ? ['gizlilik politikası', 'veri koruma', 'KVKK', 'gizlilik']
      : ['privacy policy', 'data protection', 'GDPR', 'privacy'],
  };

  const keywords = [
    ...baseKeywords,
    ...(pageSpecificKeywords[pageType] || []),
    pageContent.title,
  ];

  return {
    title,
    description: seoDescription,
    keywords,
    authors: [{ name: locale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform' }],
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': `${baseUrl}/tr/${pageRoutes[pageType as keyof typeof pageRoutes]?.tr || currentSlug}`,
        'en': `${baseUrl}/en/${pageRoutes[pageType as keyof typeof pageRoutes]?.en || currentSlug}`,
      },
    },
    openGraph: {
      title,
      description: seoDescription,
      url: canonicalUrl,
      siteName: locale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform',
      images: [
        {
          url: `${baseUrl}/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: pageContent.title,
        },
      ],
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      type: pageType === 'blog' ? 'article' : 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      description: seoDescription.length > 200
        ? seoDescription.substring(0, 197) + '...'
        : seoDescription,
      images: [`${baseUrl}/twitter-image.jpg`],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': pageType === 'blog' 
          ? 'Article' 
          : pageType === 'about' 
            ? 'AboutPage' 
            : pageType === 'contact' 
              ? 'ContactPage' 
              : 'WebPage',
        name: pageContent.title,
        headline: pageContent.title,
        description: seoDescription,
        url: canonicalUrl,
        inLanguage: locale === 'tr' ? 'tr-TR' : 'en-US',
        publisher: {
          '@type': 'Organization',
          name: locale === 'tr' ? 'MyUNI Eğitim Platformu' : 'MyUNI Education Platform',
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/logo.png`,
          },
        },
        ...(pageType === 'blog' ? {
          datePublished: new Date().toISOString(),
          dateModified: new Date().toISOString(),
        } : {}),
      }),
    },
  };
}