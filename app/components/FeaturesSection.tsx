import React from 'react';
import { Code, Database, Cpu, Globe, Lock, BarChart, ArrowRight, Download, Cloud, Users, Layers, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

// Feature arayüzü
interface Feature {
  title: string;
  description: string;
  icon: string;
  details: string[];
  cta: string;
  cta_link: string;
  image: string;
  imageAlt: string;
}

// AdditionalFeature arayüzü
interface AdditionalFeature {
  title: string;
  icon: string;
  description: string;
}

// FeatureSectionContent arayüzü
interface FeatureSectionContent {
  section_title: string;
  section_description: string;
  features: Feature[];
  additional_features: AdditionalFeature[];
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  cta_button_link: string;
}

// Locale parametresi ekliyoruz
interface FeaturesSectionProps {
  locale: string;
}

// Desteklenen dil tipleri
type SupportedLocale = 'tr' | 'en';

async function getFeaturesContent(locale: string) {
  try {
    // Database sorgusu
    const { data, error } = await supabase
      .from('features_content')
      .select('*')
      .eq('locale', locale)
      .single();

    if (error) {
      console.error('Error fetching features content:', error);
      // Varsayılan içeriğe geçiş yap, hata fırlatma
      return getDefaultFeaturesContent(locale);
    }
    
    // JSONB veri tiplerini işle
    let parsedFeatures = data.features;
    let parsedAdditionalFeatures = data.additional_features;
    
    // Eğer features bir string ise, parse et
    if (typeof data.features === 'string') {
      try {
        parsedFeatures = JSON.parse(data.features);
      } catch (e) {
        console.error('Error parsing features JSON:', e);
        parsedFeatures = getDefaultFeaturesContent(locale).features;
      }
    }
    
    // Eğer additional_features bir string ise, parse et
    if (typeof data.additional_features === 'string') {
      try {
        parsedAdditionalFeatures = JSON.parse(data.additional_features);
      } catch (e) {
        console.error('Error parsing additional_features JSON:', e);
        parsedAdditionalFeatures = getDefaultFeaturesContent(locale).additional_features;
      }
    }

    // Database verilerini dön
    return {
      section_title: data.section_title,
      section_description: data.section_description,
      features: parsedFeatures,
      additional_features: parsedAdditionalFeatures,
      cta_title: data.cta_title,
      cta_description: data.cta_description,
      cta_button_text: data.cta_button_text,
      cta_button_link: data.cta_button_link
    };
  } catch (error) {
    console.error('Failed to fetch features content:', error);
    // Hata durumunda varsayılan içerik dön
    return getDefaultFeaturesContent(locale);
  }
}

// Varsayılan içerik sağlayan fonksiyon
function getDefaultFeaturesContent(locale: string): FeatureSectionContent {
  // Farklı diller için varsayılan içerik
  const defaultContent: Record<SupportedLocale, FeatureSectionContent> = {
    tr: {
      section_title: 'Kurumsal Çözümlerimiz',
      section_description: 'UNIDEV Software platformu ile işletmenizin teknolojik dönüşümünü optimize ediyor, rekabet avantajı sağlıyoruz.',
      features: [
        {
          title: "Gelişmiş Yazılım Çözümleri",
          description: "Özel ihtiyaçlarınız için tasarlanmış, yüksek performanslı yazılım çözümleri.",
          icon: "Code",
          details: ["Mikroservis mimarisi", "RESTful API entegrasyonu", "Ölçeklendirilebilir altyapı"],
          cta: "Teknik detayları inceleyin",
          cta_link: "/tr/cozumler/yazilim",
          image: "/unidev-software-features-1.webp", // Added leading slash
          imageAlt: "Gelişmiş yazılım çözümleri görselleştirmesi"
        },
        {
          title: "Veri Yönetimi",
          description: "Karmaşık verilerinizi yapılandırma, analiz ve değerli içgörüler elde etme.",
          icon: "Database",
          details: ["NoSQL & SQL desteği", "Gerçek zamanlı veri işleme", "Veri güvenliği standartları"],
          cta: "Veri çözümlerimiz",
          cta_link: "/tr/cozumler/veri",
          image: "/unidev-software-features-2.webp", // Added leading slash
          imageAlt: "Veri yönetimi ve analizi görselleştirmesi"
        },
        {
          title: "Yapay Zeka Entegrasyonu",
          description: "İş süreçlerinizi optimize etmek için son teknoloji AI çözümleri.",
          icon: "Cpu",
          details: ["Makine öğrenimi algoritmaları", "Doğal dil işleme", "Tahmine dayalı analitik"],
          cta: "AI yeteneklerimiz",
          cta_link: "/tr/cozumler/yapay-zeka",
          image: "/unidev-software-features-3.webp", // Added leading slash
          imageAlt: "Yapay zeka ve makine öğrenimi görselleştirmesi"
        },
        {
          title: "Global Entegrasyon",
          description: "Uluslararası standartlara uygun, çoklu dil desteği ve bölgesel çözümler.",
          icon: "Globe",
          details: ["ISO 27001 sertifikasyonu", "GDPR uyumlu sistemler", "Çoklu bölge desteği"],
          cta: "Global standartlarımız",
          cta_link: "/tr/cozumler/global-entegrasyon",
          image: "/unidev-software-features-4.webp", // Added leading slash
          imageAlt: "Global entegrasyon ve uluslararası standartlar görselleştirmesi"
        },
        {
          title: "Güvenlik Odaklı",
          description: "En yüksek güvenlik standartlarıyla verilerinizin korunması.",
          icon: "Lock",
          details: ["Uçtan uca şifreleme", "Çok faktörlü kimlik doğrulama", "Penetrasyon testleri"],
          cta: "Güvenlik protokollerimiz",
          cta_link: "/tr/cozumler/guvenlik",
          image: "/unidev-software-features-5.webp", // Added leading slash
          imageAlt: "Siber güvenlik ve veri koruma görselleştirmesi"
        },
        {
          title: "Performans Analitiği",
          description: "Gerçek zamanlı veri analitiği ile sürekli sistem optimizasyonu.",
          icon: "BarChart",
          details: ["KPI izleme araçları", "Özelleştirilebilir gösterge panelleri", "Anomali tespiti"],
          cta: "Analitik çözümlerimiz",
          cta_link: "/tr/cozumler/analitik",
          image: "/unidev-software-features-6.webp", // Added leading slash
          imageAlt: "Performans analitiği ve gösterge panelleri görselleştirmesi"
        }
      ],
      additional_features: [
        {
          title: "Bulut Mimarisi",
          icon: "Cloud",
          description: "Hibrit ve çoklu bulut desteği"
        },
        {
          title: "İş Otomasyonu",
          icon: "Zap",
          description: "Tekrarlayan süreçlerin otomatizasyonu"
        },
        {
          title: "Kurumsal Entegrasyon",
          icon: "Layers",
          description: "ERP ve CRM sistemleriyle entegrasyon"
        },
        {
          title: "Kullanıcı Deneyimi",
          icon: "Users",
          description: "Sezgisel arayüz tasarımı"
        }
      ],
      cta_title: "Daha fazla teknolojik çözüm için",
      cta_description: "Detaylı teknik dökümanlarımıza göz atın ve UNIDEV Software çözümlerinin işletmenize nasıl değer katabileceğini keşfedin.",
      cta_button_text: "Teknik dökümanlarımızı indirin",
      cta_button_link: "/tr/dokumanlar/teknik"
    },
    en: {
      section_title: "Our Enterprise Solutions",
      section_description: "With UNIDEV Software platform, we optimize your business's technological transformation and provide a competitive advantage.",
      features: [
        {
          title: "Advanced Software Solutions",
          description: "High-performance software solutions designed for your specific needs.",
          icon: "Code",
          details: ["Microservice architecture", "RESTful API integration", "Scalable infrastructure"],
          cta: "Explore technical details",
          cta_link: "/en/solutions/software",
          image: "/unidev-software-features-1.webp", // Added leading slash
          imageAlt: "Advanced software solutions visualization"
        },
        {
          title: "Data Management",
          description: "Structure, analyze and gain valuable insights from your complex data.",
          icon: "Database",
          details: ["NoSQL & SQL support", "Real-time data processing", "Data security standards"],
          cta: "Our data solutions",
          cta_link: "/en/solutions/data",
          image: "/unidev-software-features-2.webp", // Added leading slash
          imageAlt: "Data management and analysis visualization"
        },
        {
          title: "AI Integration",
          description: "Cutting-edge AI solutions to optimize your business processes.",
          icon: "Cpu",
          details: ["Machine learning algorithms", "Natural language processing", "Predictive analytics"],
          cta: "Our AI capabilities",
          cta_link: "/en/solutions/artificial-intelligence",
          image: "/unidev-software-features-3.webp", // Added leading slash
          imageAlt: "Artificial intelligence and machine learning visualization"
        },
        {
          title: "Global Integration",
          description: "Multi-language support and regional solutions compliant with international standards.",
          icon: "Globe",
          details: ["ISO 27001 certification", "GDPR compliant systems", "Multi-region support"],
          cta: "Our global standards",
          cta_link: "/en/solutions/global-integration",
          image: "/unidev-software-features-4.webp", // Added leading slash
          imageAlt: "Global integration and international standards visualization"
        },
        {
          title: "Security Focused",
          description: "Protection of your data with the highest security standards.",
          icon: "Lock",
          details: ["End-to-end encryption", "Multi-factor authentication", "Penetration testing"],
          cta: "Our security protocols",
          cta_link: "/en/solutions/security",
          image: "/unidev-software-features-5.webp", // Added leading slash
          imageAlt: "Cyber security and data protection visualization"
        },
        {
          title: "Performance Analytics",
          description: "Continuous system optimization with real-time data analytics.",
          icon: "BarChart",
          details: ["KPI monitoring tools", "Customizable dashboards", "Anomaly detection"],
          cta: "Our analytics solutions",
          cta_link: "/en/solutions/analytics",
          image: "/unidev-software-features-6.webp", // Added leading slash
          imageAlt: "Performance analytics and dashboards visualization"
        }
      ],
      additional_features: [
        {
          title: "Cloud Architecture",
          icon: "Cloud",
          description: "Hybrid and multi-cloud support"
        },
        {
          title: "Business Automation",
          icon: "Zap",
          description: "Automation of repetitive processes"
        },
        {
          title: "Enterprise Integration",
          icon: "Layers",
          description: "Integration with ERP and CRM systems"
        },
        {
          title: "User Experience",
          icon: "Users",
          description: "Intuitive interface design"
        }
      ],
      cta_title: "For more technological solutions",
      cta_description: "Check out our detailed technical documentation and discover how UNIDEV Software solutions can add value to your business.",
      cta_button_text: "Download our technical documents",
      cta_button_link: "/en/documents/technical"
    }
  };

  // Check if the provided locale is supported, otherwise default to 'tr'
  const safeLocale = (locale in defaultContent) ? locale as SupportedLocale : 'tr';
  return defaultContent[safeLocale];
}

export default async function FeaturesSection({ locale }: FeaturesSectionProps) {
  try {
    // Default locale to 'tr' if not provided
    const safeLocale = locale || 'tr';
    const content = await getFeaturesContent(safeLocale);

    return (
      <section className="py-16">
        <div className="container mx-auto">
          {/* Header Section with Background Image */}
          <div className="text-left mb-16 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mt-2 mb-3">
                {content.section_title}
              </h2>
              <div className="w-16 h-px bg-neutral-300 dark:bg-neutral-700 mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400 text-base max-w-2xl">
                {content.section_description}
              </p>
            </div>
          </div>
          
          {/* Main Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {content.features.map((feature: Feature, index: number) => (
              <div 
                key={index}
                className="bg-neutral-50 dark:bg-neutral-800 border-l-2 border-neutral-200 dark:border-neutral-700 hover:border-l-2 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all duration-300 flex flex-col h-full group overflow-hidden"
              >
                {/* Görsel Katmanı */}
                <div className="h-48 overflow-hidden relative">
                  <Image 
                    src={feature.image.startsWith('/') ? feature.image : `/${feature.image}`} 
                    alt={feature.imageAlt} 
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-neutral-900 opacity-10"></div>
                  <div className="absolute top-4 left-4 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-sm">
                    {(() => {
                      switch (feature.icon) {
                        case 'Code':
                          return <Code className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        case 'Database':
                          return <Database className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        case 'Cpu':
                          return <Cpu className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        case 'Globe':
                          return <Globe className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        case 'Lock':
                          return <Lock className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        case 'BarChart':
                          return <BarChart className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                        default:
                          return <Code className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                      }
                    })()}
                  </div>
                </div>
                
                {/* İçerik Katmanı */}
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{feature.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400 text-md mb-4">{feature.description}</p>
                  
                  {/* Feature Details */}
                  <ul className="mt-4 mb-6 space-y-2 flex-grow">
                    {feature.details.map((detail, i) => (
                      <li key={i} className="flex items-start">
                        <div className="mr-2 mt-1 bg-neutral-200 dark:bg-neutral-700 h-1 w-1 rounded-full"></div>
                        <span className="text-md text-neutral-600 dark:text-neutral-400">{detail}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {/* CTA Link */}
                  <div className="mt-auto">
                    <a href={feature.cta_link} className="inline-flex items-center text-md text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 group-hover:translate-x-1 transition-all duration-300">
                      {feature.cta}
                      <ArrowRight className="ml-1 w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Additional Features Strip with Icons */}
          <div className="bg-neutral-100 dark:bg-neutral-800 p-8 rounded-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {content.additional_features.map((feature: AdditionalFeature, index: number) => (
                <div key={index} className="flex items-center space-x-3 p-2 group">
                  <div className="bg-white dark:bg-neutral-700 p-2 rounded-sm">
                    {(() => {
                      switch (feature.icon) {
                        case 'Cloud':
                          return <Cloud className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />;
                        case 'Zap':
                          return <Zap className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />;
                        case 'Layers':
                          return <Layers className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />;
                        case 'Users':
                          return <Users className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />;
                        default:
                          return <Cloud className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />;
                      }
                    })()}
                  </div>
                  <div>
                    <h4 className="text-md font-medium text-neutral-800 dark:text-neutral-200">{feature.title}</h4>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* CTA Section with Visual Element */}
          <div className="mt-8 ">
            <div className="flex-1">
              <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">{content.cta_title}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">{content.cta_description}</p>
              <a href={content.cta_button_link} className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white py-3 px-8 rounded-sm text-md font-medium transition-all duration-300 flex items-center inline-flex">
                <Download className="mr-2 w-4 h-4" />
                {content.cta_button_text}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    // Hata durumunda sadece error mesajını göster
    console.error('Error rendering FeaturesSection:', error);
    return (
      <section className="py-16">
        <div className="container mx-auto">
          <p>An error occurred while loading content. Please check the console for details.</p>
        </div>
      </section>
    );
  }
}