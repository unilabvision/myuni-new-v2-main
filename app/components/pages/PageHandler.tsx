// app/components/pages/PageHandler.tsx
import { pageRoutes } from '@/app/lib/routes';
import PageLayout from '@/app/components/layout/PageLayout';
import NotFound from '@/app/components/pages/errors/NotFound';

// İçerik sayfaları
import AboutPage from './about/AboutPage';
import CareersPage from './careers/CareersPage';
import TermsPage from './terms/TermsPage';
import PrivacyPage from './privacy/PrivacyPage';
import NewsletterPage from './newsletter/NewsletterPage';
import ProjectsPage from './projects/ProjectsPage';
import BlogPage from './blog/BlogPage';
import ContactPage from './contact/ContactPage';
import EgitmenPage from './egitmen/EgitmenPage';
import KulupPage from './kulup/KulupPage';

// İçerik türleri
import { AboutContent } from './about/content';
import { ContactContent } from './contact/content';
import { default as aboutContentModule } from './about/content';
import { default as contactContentModule } from './contact/content';

// UNILAB Vision blog servisi
import { getUnilabBlogContent } from '@/app/services/unilabBlogService';
import { MyUniBlogContent } from '@/app/types/myuniBlog';

// Desteklenen diller ve sayfalar için tip tanımları
type SupportedLocale = 'tr' | 'en';
type PageType = 'about' | 'projects' | 'blog' | 'services' | 'careers' | 'contact' | 'terms' | 'privacy' | 'newsletter' | 'egitmen' | 'kulup' | 'not-found';

// Generic content interface to avoid using `any`
interface PageContent {
  title: string;
  description: string;
}

// Sayfa içerik API'si - jenerik tip kullanarak her sayfa için doğru içerik tipini döndür
async function getPageContent<T extends PageContent>(locale: string, page: PageType): Promise<T | null> {
  try {
    if (locale !== 'tr' && locale !== 'en') {
      return null;
    }
    
    const localeKey = locale as SupportedLocale;
    
    switch(page) {
      case 'about':
        return aboutContentModule[localeKey] as unknown as T;
      case 'blog':
        // UNILAB Vision blog içeriğini veritabanından al
        return getUnilabBlogContent(locale) as unknown as T;
      case 'contact':
        return contactContentModule[localeKey] as unknown as T;
      default:
        return null;
    }
  } catch (error) {
    console.error(`Error loading content for page "${page}" in "${locale}" locale:`, error);
    return null;
  }
}

interface PageHandlerProps {
  pageType: string;
  locale: string;
}

export default async function PageHandler({ pageType, locale }: PageHandlerProps) {
  // Geçerli bir sayfa türü olup olmadığını kontrol et - egitmen ve kulup eklendi
  const validPageType = ['about', 'projects', 'blog', 'services', 'careers', 'contact', 'terms', 'privacy', 'newsletter', 'egitmen', 'kulup'].includes(pageType) 
    ? pageType as PageType 
    : 'not-found';
  
  // Her sayfa için kendi içerik tipini kullanarak verileri al
  let content: PageContent | null = null;
  let pageContent: React.ReactNode = null;
  
  if (validPageType === 'about') {
    const aboutContent = await getPageContent<AboutContent>(locale, validPageType);
    if (aboutContent) {
      content = aboutContent;
      // AboutPage sadece locale prop'unu alır, content'i içeride yükler
      pageContent = <AboutPage locale={locale} />;
    }
  } else if (validPageType === 'projects') {
    // ProjectsPage artık content prop'una ihtiyaç duymaz, sadece locale alır
    pageContent = <ProjectsPage locale={locale} />;
    // Projects için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Projeler' : 'Projects',
      description: locale === 'tr' 
        ? 'Bilim ve teknolojinin sınırlarını zorlayan yenilikçi projelerle geleceği şekillendiriyoruz. UNILAB Vision olarak, farklı disiplinlerdeki uzman ekiplerimizle sürdürülebilir çözümler geliştiriyor, bilimi topluma ulaştırıyor ve geleceğin teknolojilerini bugünden inşa ediyoruz.'
        : 'We shape the future with innovative projects that push the boundaries of science and technology. As UNILAB Vision, we develop sustainable solutions with our expert teams in different disciplines, bring science to society and build the technologies of the future today.'
    };
  } else if (validPageType === 'blog') {
    const blogContent = await getPageContent<MyUniBlogContent>(locale, validPageType);
    if (blogContent) {
      content = blogContent;
      // BlogPage'i UNILAB blog content'i ile uyumlu hale getir
      // Not: BlogPage component'ını da güncellemen gerekebilir
      pageContent = <BlogPage content={blogContent} locale={locale} />;
    }
  } else if (validPageType === 'careers') {
    // Careers page doesn't need content loading
    pageContent = <CareersPage locale={locale} />;
    // Careers için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Kariyer' : 'Careers',
      description: locale === 'tr' 
        ? 'Ekibimize katılacak yaratıcı, meraklı ve çözüm odaklı bireylerle beraber, geleceğin dünyasını inşa ediyoruz.'
        : 'Join our team of creative, curious and solution-oriented individuals as we build the world of the future.'
    };
  } else if (validPageType === 'egitmen') {
    // Egitmen page doesn't need content loading
    pageContent = <EgitmenPage locale={locale} />;
    // Egitmen için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Eğitmen Başvurusu' : 'Instructor Application',
      description: locale === 'tr' 
        ? 'MyUNI eğitim ekibine katılın ve bilginizi paylaşarak geleceğin liderleri yetiştirin.'
        : 'Join the MyUNI education team and train future leaders by sharing your knowledge.'
    };
  } else if (validPageType === 'kulup') {
    // Kulup page doesn't need content loading
    pageContent = <KulupPage locale={locale} />;
    // Kulup için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'MyUNI Kulüp Ağı' : 'MyUNI Club Network',
      description: locale === 'tr' 
        ? 'Okul topluluklarınızla birlikte güçlü bir ağ oluşturalım ve ortak projeler geliştirelim.'
        : 'Let\'s build a strong network with your school communities and develop joint projects.'
    };
  } else if (validPageType === 'newsletter') {
    // Newsletter page doesn't need content loading
    pageContent = <NewsletterPage locale={locale} />;
    // Newsletter için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Bülten' : 'Newsletter',
      description: locale === 'tr' 
        ? 'En son haberler, güncellemeler ve özel içerikler için bültenimize abone olun.'
        : 'Subscribe to our newsletter for the latest news, updates and exclusive content.'
    };
  } else if (validPageType === 'terms') {
    // Terms page doesn't need content loading
    pageContent = <TermsPage locale={locale} />;
    // Terms için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service',
      description: locale === 'tr' 
        ? 'MyUNI hizmetlerinin kullanım koşulları ve şartları.'
        : 'Terms and conditions for using MyUNI services.'
    };
  } else if (validPageType === 'privacy') {
    // Privacy page doesn't need content loading
    pageContent = <PrivacyPage locale={locale} />;
    // Privacy için varsayılan content oluştur
    content = {
      title: locale === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy',
      description: locale === 'tr' 
        ? 'Kişisel verilerinizin korunması ve gizlilik politikamız.'
        : 'Our privacy policy and protection of your personal data.'
    };
  } else if (validPageType === 'contact') {
    const contactContent = await getPageContent<ContactContent>(locale, validPageType);
    if (contactContent) {
      content = contactContent;
    }
    // ContactPage sadece locale prop'unu alır
    pageContent = <ContactPage locale={locale} />;
    
    // Eğer content yüklenemezse varsayılan content oluştur
    if (!content) {
      content = {
        title: locale === 'tr' ? 'İletişim' : 'Contact',
        description: locale === 'tr' 
          ? 'Bizimle iletişime geçin.'
          : 'Get in touch with us.'
      };
    }
  }
  
  // İçerik bulunamazsa veya sayfa içeriği tanımlı değilse, NotFound bileşenini göster
  if (!pageContent) {
    return <NotFound locale={locale} />;
  }
  
  // Breadcrumbs için sayfa adını al
  let pageName = pageType;
  if (validPageType !== 'not-found' && locale in pageRoutes[validPageType as keyof typeof pageRoutes]) {
    pageName = pageRoutes[validPageType as keyof typeof pageRoutes][locale as 'tr' | 'en'];
  }
  
  // Content yoksa varsayılan içerik
  const defaultContent: PageContent = content || {
    title: locale === 'tr' ? 'Sayfa Bulunamadı' : 'Page Not Found',
    description: locale === 'tr' ? 'Aradığınız sayfa bulunamadı.' : 'The page you are looking for could not be found.',
  };
  
  const breadcrumbs = [
    {
      name: defaultContent.title,
      href: `/${locale}/${pageName}`
    }
  ];

  return (
    <PageLayout 
      title={defaultContent.title} 
      description={defaultContent.description} 
      locale={locale}
      breadcrumbs={breadcrumbs}
    >
      {/* Sayfa içeriğini göster */}
      {pageContent}
      
      {/* Henüz bileşeni eklenmemiş sayfalar için geçici içerik */}
      {!pageContent && validPageType !== 'not-found' && (
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-medium mb-6">{defaultContent.title}</h2>
          <p className="mb-8">{defaultContent.description}</p>
          <p className="text-neutral-500">Bu sayfa yapım aşamasındadır - {pageType} / {locale}</p>
        </div>
      )}
    </PageLayout>
  );
}