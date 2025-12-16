'use client';

import React, { useState, useEffect } from 'react';
import { Users, Calendar, Mail, ArrowRight, Video, Clock, Award } from 'lucide-react';

interface EgitmenPageProps {
  locale?: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Requirement {
  id: string;
  title: string;
  description: string;
}

interface EgitmenContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  whyTeachTitle: string;
  whyTeachSubtitle: string;
  benefits: Benefit[];
  requirementsTitle: string;
  requirements: Requirement[];
  processTitle: string;
  processSubtitle: string;
  processSteps: {
    step: number;
    title: string;
    description: string;
  }[];
  contactTitle: string;
  contactDescription: string;
  scheduleButtonText: string;
  contactButtonText: string;
  scheduleLink: string;
}

interface Statistic {
  number: string;
  label: string;
  labelEn: string;
}

// Icon mapping for benefits - updated for dark theme
const iconMap: { [key: string]: React.ReactNode } = {
  impact: <Users className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  flexibility: <Clock className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  growth: <Award className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  platform: <Video className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

// Instructor page data
const egitmenData: { [key: string]: EgitmenContent } = {
  tr: {
    heroTitle: "MyUNI Eğitim Platformu'nda Eğitmen Olun",
    heroSubtitle: "MyUNI Eğitim Platformu olarak, bilgi paylaşımının gücüne inanıyoruz. Uzmanlık alanınızdaki deneyimlerinizi binlerce öğrenciyle paylaşarak, geleceğin liderlerini yetiştirmeye katkıda bulunun.",
    heroDescription: "Eğer alanınızda uzmanlaşmış bir profesyonelseniz ve bilginizi paylaşma tutkusu taşıyorsanız, sizinle çalışmaktan mutluluk duyarız!",
    whyTeachTitle: "Neden MyUNI'de Eğitmenlik Yapmalısınız?",
    whyTeachSubtitle: "FARK YARATIN!",
    benefits: [
      {
        id: "impact",
        title: "Toplumsal Etki Yaratın",
        description: "Binlerce öğrencinin hayatına dokunarak, onların kariyerlerini şekillendirin ve Türkiye'nin eğitim kalitesini artırmaya katkıda bulunun.",
        icon: "impact"
      },
      {
        id: "flexibility",
        title: "Esnek Çalışma Imkanı",
        description: "Kendi programınızı oluşturun, dilediğiniz zaman ve mekandan ders verin. Online platformumuz size tam özgürlük sunar.",
        icon: "flexibility"
      },
      {
        id: "growth",
        title: "Profesyonel Gelişim",
        description: "Eğitmenlik deneyimi kazanın, sunum becerilerinizi geliştirin ve alanınızdaki görünürlüğünüzü artırın.",
        icon: "growth"
      },
      {
        id: "platform",
        title: "Gelişmiş Platform Desteği",
        description: "Modern eğitim araçları, interaktif içerik oluşturma imkanları ve teknik destek ile eğitim verme deneyiminizi optimize edin.",
        icon: "platform"
      }
    ],
    requirementsTitle: "Eğitmen Olmak İçin Gereksinimler",
    requirements: [
      {
        id: "expertise",
        title: "Uzmanlık Alanı",
        description: "Eğitim vermek istediğiniz konuda en az 3 yıl profesyonel deneyim ve kanıtlanabilir uzmanlık."
      },
      {
        id: "communication",
        title: "İletişim Becerileri",
        description: "Etkili iletişim kurabilme, karmaşık konuları basit bir şekilde anlatabilme yeteneği."
      },
      {
        id: "commitment",
        title: "Kararlılık ve Bağlılık",
        description: "Öğrencilerin başarısı için gerekli zamanı ayırabilme ve kaliteli eğitim verme konusunda kararlılık."
      },
      {
        id: "technology",
        title: "Teknoloji Kullanımı",
        description: "Temel bilgisayar becerileri ve online eğitim araçlarını kullanabilme yeteneği."
      }
    ],
    processTitle: "Başvuru Süreci",
    processSubtitle: "Nasıl Başlarız?",
    processSteps: [
      {
        step: 1,
        title: "Toplantı Planlayın",
        description: "Aşağıdaki bağlantıdan uygun bir zaman seçerek bizimle tanışma toplantısı planlayın."
      },
      {
        step: 2,
        title: "Ön Görüşme",
        description: "Deneyimlerinizi, eğitim vermek istediğiniz konuları ve beklentilerinizi paylaştığınız 30 dakikalık görüşme."
      },
      {
        step: 3,
        title: "Karşılıklı Değerlendirme",
        description: "Toplantıda birlikte değerlendirme yapıyoruz: eğitim yöntemi, içerik ve uygunluğu konuşup ortak bir karar alıyoruz."
      },
      {
        step: 4,
        title: "İş Birliği Başlangıcı",
        description: "Onay ve planlama sonrası platform oryantasyonu, içerik hazırlığı ve ilk derslerin takvimlendirilmesi ile eğitmenliğe başlayın."
      }
    ],
    contactTitle: "Bizimle İletişime Geçin",
    contactDescription: "Sorularınız için bize info@myunilab.net mail adresi üzerinden ulaşabilirsiniz.",
    scheduleButtonText: "Toplantı Planla",
    contactButtonText: "İletişime Geç",
    scheduleLink: "https://calendar.app.google/wLMtbAer1YmgPDyr8"
  },
  en: {
    heroTitle: "Become an Instructor on MyUNI Education Platform",
    heroSubtitle: "As MyUNI Education Platform, we believe in the power of knowledge sharing. Share your expertise with thousands of students and contribute to training future leaders.",
    heroDescription: "If you are a professional specialized in your field and have a passion for sharing knowledge, we would be happy to work with you!",
    whyTeachTitle: "Why Should You Teach at MyUNI?",
    whyTeachSubtitle: "MAKE A DIFFERENCE!",
    benefits: [
      {
        id: "impact",
        title: "Create Social Impact",
        description: "Touch the lives of thousands of students, shape their careers and contribute to improving Turkey's education quality.",
        icon: "impact"
      },
      {
        id: "flexibility",
        title: "Flexible Working Opportunity",
        description: "Create your own schedule, teach whenever and wherever you want. Our online platform offers you complete freedom.",
        icon: "flexibility"
      },
      {
        id: "growth",
        title: "Professional Development",
        description: "Gain teaching experience, improve your presentation skills and increase your visibility in your field.",
        icon: "growth"
      },
      {
        id: "platform",
        title: "Advanced Platform Support",
        description: "Optimize your teaching experience with modern educational tools, interactive content creation opportunities and technical support.",
        icon: "platform"
      }
    ],
    requirementsTitle: "Requirements to Become an Instructor",
    requirements: [
      {
        id: "expertise",
        title: "Field of Expertise",
        description: "At least 3 years of professional experience and demonstrable expertise in the subject you want to teach."
      },
      {
        id: "communication",
        title: "Communication Skills",
        description: "Ability to communicate effectively and explain complex topics in a simple way."
      },
      {
        id: "commitment",
        title: "Determination and Commitment",
        description: "Determination to allocate the necessary time for student success and provide quality education."
      },
      {
        id: "technology",
        title: "Technology Usage",
        description: "Basic computer skills and ability to use online educational tools."
      }
    ],
    processTitle: "Application Process",
    processSubtitle: "How Do We Start?",
    processSteps: [
      {
        step: 1,
        title: "Schedule a Meeting",
        description: "Schedule an introduction meeting with us by selecting a suitable time from the link below."
      },
      {
        step: 2,
        title: "Initial Interview",
        description: "A 30-minute interview where you share your experiences, topics you want to teach, and expectations."
      },
      {
        step: 3,
        title: "Mutual Evaluation",
        description: "During the meeting we evaluate together—discuss the format, content, and fit."
      },
      {
        step: 4,
        title: "Collaboration Start",
        description: "After approval and planning, begin with platform onboarding, content preparation and scheduling your first sessions to start teaching."
      }
    ],
    contactTitle: "Get in Touch",
    contactDescription: "For your questions, you can reach us via info@myunilab.net.",
    scheduleButtonText: "Schedule Meeting",
    contactButtonText: "Contact Us",
    scheduleLink: "https://calendar.app.google/wLMtbAer1YmgPDyr8n"
  }
};

// Statistics for visual appeal
const stats: Statistic[] = [
  { number: "1000+", label: "Aktif Öğrenci", labelEn: "Active Students" },
  { number: "50+", label: "Kurs", labelEn: "Courses" },
  { number: "20+", label: "Eğitmen", labelEn: "Instructors" },
  { number: "95%", label: "Memnuniyet Oranı", labelEn: "Satisfaction Rate" }
];

// Hero Section Component
interface HeroSectionProps {
  content: EgitmenContent;
  locale: string;
}

function HeroSection({ content, locale }: HeroSectionProps) {
  return (
    <section className="py-20 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        <div className="max-w-4xl text-left">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 dark:text-neutral-100 mb-4 tracking-tight text-left">
            {content.heroTitle}
          </h1>
          
          {/* Accent Line - updated for dark theme */}
          <div className="w-16 h-px bg-[#990000] dark:bg-white mb-8"></div>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed text-left">
            {content.heroSubtitle}
          </p>
          
          {/* Description */}
          <p className="text-base text-neutral-500 dark:text-neutral-500 mb-12 leading-relaxed text-left">
            {content.heroDescription}
          </p>
          
          {/* CTA Buttons - updated for dark theme */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a 
              href={content.scheduleLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-[#990000] dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-[#800000] dark:hover:bg-neutral-200 transition-all duration-300 flex items-center gap-2 group text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>{content.scheduleButtonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </a>
            <a 
              href="mailto:info@myunilab.net"
              className="px-6 py-3 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-md hover:border-[#990000] hover:text-[#990000] dark:hover:text-white dark:hover:border-white transition-all duration-300 flex items-center gap-2 text-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              <span>{content.contactButtonText}</span>
            </a>
          </div>
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-2xl md:text-3xl font-light text-neutral-900 dark:text-neutral-100 mb-1">
                {stat.number}
              </div>
              <div className="text-xs text-neutral-500 dark:text-neutral-500 uppercase tracking-wide">
                {locale === 'en' ? stat.labelEn : stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Benefits Section Component
interface BenefitsSectionProps {
  content: EgitmenContent;
}

function BenefitsSection({ content }: BenefitsSectionProps) {
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        {/* Header */}
        <div className="mb-16 max-w-3xl text-left">
          {/* Badge - updated for dark theme */}
          <div className="inline-block px-3 py-1 bg-[#990000]/10 dark:bg-white/10 rounded-full mb-6">
            <span className="text-xs font-medium text-[#990000] dark:text-white uppercase tracking-wide">
              {content.whyTeachSubtitle}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4 text-left">
            {content.whyTeachTitle}
          </h2>
          {/* Accent Line - updated for dark theme */}
          <div className="w-16 h-px bg-[#990000] dark:bg-white"></div>
        </div>

        {/* Benefits List */}
        <div className="space-y-12">
          {content.benefits.map((benefit: Benefit) => (
            <div 
              key={benefit.id}
              className="flex gap-6 group max-w-4xl"
            >
              {/* Icon - updated hover effect for dark theme */}
              <div className="flex-shrink-0 w-12 h-12 bg-white dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 group-hover:border-[#990000]/30 dark:group-hover:border-white/30 transition-all duration-300">
                {iconMap[benefit.icon]}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  {benefit.title}
                </h3>
                
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Requirements Section Component
interface RequirementsSectionProps {
  content: EgitmenContent;
}

function RequirementsSection({ content }: RequirementsSectionProps) {
  return (
    <section className="py-20 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        {/* Header */}
        <div className="mb-16 max-w-3xl text-left">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4 text-left">
            {content.requirementsTitle}
          </h2>
          <div className="w-16 h-px bg-[#990000] dark:bg-white"></div>
        </div>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {content.requirements.map((requirement, index) => (
            <div 
              key={requirement.id}
              className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-[#990000]/30 dark:hover:border-white/30 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#990000]/10 dark:bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-[#990000] dark:text-white">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {requirement.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {requirement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Process Section Component
interface ProcessSectionProps {
  content: EgitmenContent;
}

function ProcessSection({ content }: ProcessSectionProps) {
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        {/* Header */}
        <div className="mb-16 max-w-3xl text-left">
          <div className="inline-block px-3 py-1 bg-[#990000]/10 dark:bg-white/10 rounded-full mb-6">
            <span className="text-xs font-medium text-[#990000] dark:text-white uppercase tracking-wide">
              {content.processSubtitle}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4 text-left">
            {content.processTitle}
          </h2>
          <div className="w-16 h-px bg-[#990000] dark:bg-white"></div>
        </div>

        {/* Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.processSteps.map((step) => (
            <div 
              key={step.step}
              className="text-center group"
            >
              <div className="w-16 h-16 bg-[#990000] dark:bg-white rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-xl font-bold text-white dark:text-neutral-900">
                  {step.step}
                </span>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {step.title}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA - Left aligned */}
        <div className="mt-16 text-left">
          <a 
            href={content.scheduleLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#990000] dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-[#800000] dark:hover:bg-neutral-200 transition-all duration-300 group text-sm font-medium"
          >
            <Calendar className="w-5 h-5" />
            <span>{content.scheduleButtonText}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>
    </section>
  );
}

// Main Instructor Page Component
export default function EgitmenPage({ locale = 'tr' }: EgitmenPageProps) {
  const [content, setContent] = useState<EgitmenContent | null>(null);
  
  useEffect(() => {
    try {
      const currentContent = egitmenData[locale as keyof typeof egitmenData] || egitmenData.tr;
      setContent(currentContent);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }, [locale]);
  
  if (!content) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">İçerik yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <HeroSection content={content} locale={locale} />
      <BenefitsSection content={content} />
      <RequirementsSection content={content} />
      <ProcessSection content={content} />
    </div>
  );
}