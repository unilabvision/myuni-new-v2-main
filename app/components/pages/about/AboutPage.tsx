'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lightbulb, Target, Award, Globe, Brain, Settings, TrendingUp, Users, Zap } from 'lucide-react';

interface ServicesSectionProps {
  locale: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
}

interface Value {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ServicesData {
  servicesTitle: string;
  servicesSubtitle: string;
  services: Service[];
  valuesTitle: string;
  valuesSubtitle: string;
  values: Value[];
}

// Icon mapping for services and values
const iconMap: { [key: string]: React.ReactNode } = {
  // Core platform features
  ai_learning: <Brain className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  personalized: <Target className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  adaptive: <Settings className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  analytics: <TrendingUp className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  collaboration: <Users className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  // Values
  innovation: <Lightbulb className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  excellence: <Award className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  accessibility: <Globe className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  transformation: <Zap className="w-6 h-6 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

// Services data for MyUNI platform
const servicesData: { [key: string]: ServicesData } = {
  tr: {
    servicesTitle: "MyUNI Nedir?",
    servicesSubtitle: "MyUNI, yapay zeka destekli, yenilikçi bir eğitim platformudur. Bireylere ve kurumlara yönelik dönüştürücü öğrenme deneyimleri sunar. Disiplinler arası yaklaşımı, en son teknolojileri ve yapay zeka destekli altyapısı sayesinde hem bireysel gelişim hem de kurumsal eğitim alanında yüksek etkili çözümler sunuyoruz.",
    services: [
      {
        id: "ai_learning",
        title: "Yapay Zeka Destekli Öğrenme",
        description: "Gelişmiş AI algoritmaları ile kişiselleştirilmiş öğrenme yolları oluşturuyor, her bireyin öğrenme tarzına göre optimize edilmiş içerikler sunuyoruz."
      },
      {
        id: "personalized",
        title: "Kişiselleştirilmiş Deneyim",
        description: "Her öğrencinin benzersiz ihtiyaçlarını anlayarak, bireysel hedeflere yönelik özel eğitim programları ve öğrenme rotaları tasarlıyoruz."
      },
      {
        id: "adaptive",
        title: "Adaptif Eğitim Sistemi",
        description: "Gerçek zamanlı performans analizi ile eğitim içeriğini dinamik olarak ayarlayan, sürekli gelişen ve öğrenen bir platform sunuyoruz."
      },
      {
        id: "analytics",
        title: "Gelişmiş Analitik",
        description: "Öğrenme süreçlerini detaylı analiz ederek, hem bireysel hem de kurumsal düzeyde veri odaklı öngörüler ve raporlar sağlıyoruz."
      },
      {
        id: "collaboration",
        title: "İşbirlikçi Öğrenme",
        description: "Disiplinler arası yaklaşımla, öğrenciler, eğitmenler ve kurumlar arasında etkili işbirliği ortamları oluşturuyoruz."
      }
    ],
    valuesTitle: "Değerlerimiz",
    valuesSubtitle: "MyUNI olarak benimsediğimiz temel değerler ve eğitim vizyonumuz.",
    values: [
      {
        id: "innovation",
        title: "İnovasyon",
        description: "Eğitim teknolojisinde öncü çözümler geliştirerek, öğrenmenin geleceğini şekillendiren yenilikçi yaklaşımlar benimseriz.",
        icon: "innovation"
      },
      {
        id: "excellence",
        title: "Mükemmellik",
        description: "En yüksek kalite standartlarında eğitim deneyimleri sunarak, öğrencilerin potansiyellerini maksimuma çıkarmayı hedefleriz.",
        icon: "excellence"
      },
      {
        id: "accessibility",
        title: "Erişilebilirlik",
        description: "Kaliteli eğitimi herkese ulaştırma misyonuyla, coğrafi ve sosyal bariyerleri ortadan kaldıran çözümler geliştiririz.",
        icon: "accessibility"
      },
      {
        id: "transformation",
        title: "Dönüşüm",
        description: "Bireylerin ve kurumların eğitim süreçlerinde köklü değişimler yaratarak, sürdürülebilir gelişimi destekleriz.",
        icon: "transformation"
      }
    ]
  },
  en: {
    servicesTitle: "What is MyUNI?",
    servicesSubtitle: "MyUNI is an innovative, AI-powered educational platform that provides transformative learning experiences for individuals and institutions. Through our interdisciplinary approach, cutting-edge technologies, and AI-powered infrastructure, we offer highly effective solutions for both personal development and corporate education.",
    services: [
      {
        id: "ai_learning",
        title: "AI-Powered Learning",
        description: "We create personalized learning paths with advanced AI algorithms, offering optimized content tailored to each individual's learning style."
      },
      {
        id: "personalized",
        title: "Personalized Experience",
        description: "Understanding each student's unique needs, we design custom educational programs and learning routes tailored to individual goals."
      },
      {
        id: "adaptive",
        title: "Adaptive Education System",
        description: "We offer a continuously evolving and learning platform that dynamically adjusts educational content through real-time performance analysis."
      },
      {
        id: "analytics",
        title: "Advanced Analytics",
        description: "By analyzing learning processes in detail, we provide data-driven insights and reports at both individual and institutional levels."
      },
      {
        id: "collaboration",
        title: "Collaborative Learning",
        description: "Through interdisciplinary approaches, we create effective collaboration environments between students, instructors, and institutions."
      }
    ],
    valuesTitle: "Our Values",
    valuesSubtitle: "The core values we embrace as MyUNI and our educational vision.",
    values: [
      {
        id: "innovation",
        title: "Innovation",
        description: "We embrace innovative approaches that shape the future of learning by developing pioneering solutions in educational technology.",
        icon: "innovation"
      },
      {
        id: "excellence",
        title: "Excellence",
        description: "We aim to maximize students' potential by providing educational experiences at the highest quality standards.",
        icon: "excellence"
      },
      {
        id: "accessibility",
        title: "Accessibility",
        description: "With the mission of bringing quality education to everyone, we develop solutions that eliminate geographical and social barriers.",
        icon: "accessibility"
      },
      {
        id: "transformation",
        title: "Transformation",
        description: "We support sustainable development by creating fundamental changes in the educational processes of individuals and institutions.",
        icon: "transformation"
      }
    ]
  }
};

export default function ServicesSection({ locale }: ServicesSectionProps) {
  const router = useRouter();

  // Memoize content calculation
  const content = useMemo(() => {
    return servicesData[locale as keyof typeof servicesData] || servicesData.tr;
  }, [locale]);

  // Handle button click for navigation
  const handleExploreClick = () => {
    const route = locale === 'tr' ? '/tr/kurs' : '/en/course';
    router.push(route);
  };

  return (
    <div className="bg-white dark:bg-neutral-900">
      {/* Main Services Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {content.servicesTitle}
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-6"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-4xl leading-relaxed">
              {content.servicesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.services.map((service: Service) => (
              <div
                key={service.id}
                className="group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-8 transition-all duration-300 hover:shadow-lg hover:border-[#990000]/30 hover:-translate-y-1"
              >
                <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#990000]/5 dark:bg-[#990000]/10 mb-6 transition-all duration-300 group-hover:bg-[#990000]/10 group-hover:scale-110">
                  {iconMap[service.id]}
                </div>

                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 group-hover:text-[#990000] dark:group-hover:text-white transition-colors duration-300">
                  {service.title}
                </h3>

                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {service.description}
                </p>

                {/* Hover effect gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#990000]/0 via-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-800/30 dark:to-neutral-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {content.valuesTitle}
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-6"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl">
              {content.valuesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.values.map((value: Value, index: number) => (
              <div
                key={`value-${index}`}
                className="group bg-white dark:bg-neutral-800 p-8 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all duration-300 hover:shadow-lg hover:border-[#990000]/30 hover:-translate-y-1"
              >
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#990000]/5 dark:bg-[#990000]/10 mb-6 transition-all duration-300 group-hover:bg-[#990000]/10 group-hover:scale-110">
                  {iconMap[value.icon] || iconMap.innovation}
                </div>

                <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 group-hover:text-[#990000] dark:group-hover:text-white transition-colors duration-300">
                  {value.title}
                </h3>

                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {value.description}
                </p>

                {/* Hover effect gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#990000]/0 via-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 rounded-xl transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-[#990000]/80 to-[#990000]/60 dark:from-[#990000]/80 dark:to-[#990000]/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-medium text-white mb-4">
            {locale === 'tr' ? 'Eğitimde Yapay Zeka Devrimini Deneyimleyin' : 'Experience the AI Revolution in Education'}
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl">
            {locale === 'tr' 
              ? 'MyUNI ile öğrenmenin geleceğini keşfedin. Kişiselleştirilmiş, adaptif ve etkili eğitim deneyimleri için hemen başlayın.'
              : 'Discover the future of learning with MyUNI. Start now for personalized, adaptive, and effective educational experiences.'
            }
          </p>
          <button 
            onClick={handleExploreClick}
            className="bg-white text-[#990000] px-8 py-3 rounded-lg font-medium hover:bg-neutral-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            {locale === 'tr' ? 'Platformu Keşfet' : 'Explore Platform'}
          </button>
        </div>
      </section>
    </div>
  );
}