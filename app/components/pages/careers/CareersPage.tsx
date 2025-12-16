'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Code, Lightbulb, Share2, CalendarDays, Users, TrendingUp, Mail, ArrowRight } from 'lucide-react';
import CareersForm from './CareersForm';

interface CareerPageProps {
  locale?: string;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface Position {
  id: string;
  title: string;
  department: string;
  description: string;
  icon: string;
  skills: string[];
}

interface CareerContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  whyUsTitle: string;
  whyUsSubtitle: string;
  benefits: Benefit[];
  positionsTitle: string;
  positions: Position[];
  contactTitle: string;
  contactDescription: string;
  applyButtonText: string;
  contactButtonText: string;
}

interface Statistic {
  number: string;
  label: string;
  labelEn: string;
}

// Icon mapping for benefits and positions - updated for dark theme
const iconMap: { [key: string]: React.ReactNode } = {
  innovation: <Lightbulb className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  career: <TrendingUp className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  environment: <Users className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  unicom: <CalendarDays className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  unidev: <Code className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  darkpost: <Share2 className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

// Career page data
const careerData: { [key: string]: CareerContent } = {
  tr: {
    heroTitle: "UNILAB Vision'da Kariyer",
    heroSubtitle: "UNILAB Vision olarak, bilimsel keşiflerin ve teknolojik yeniliklerin sınırlarını zorlayan projeler yürütüyoruz. Ekibimize katılacak yaratıcı, meraklı ve çözüm odaklı bireylerle beraber, geleceğin dünyasını inşa ediyoruz.",
    heroDescription: "Eğer bilim ve teknolojiye tutkuluysanız, yenilikçi bir çalışma ortamında kendinizi geliştirmek istiyorsanız, doğru yerdesiniz!",
    whyUsTitle: "Neden UNILAB Vision?",
    whyUsSubtitle: "BİR SEBEBİ VAR!",
    benefits: [
      {
        id: "innovation",
        title: "Bilimsel ve Teknolojik İnovasyon",
        description: "Bilim, teknoloji ve yapay zeka alanındaki projelerimizle, dünyayı daha yaşanabilir bir yer haline getirmeyi hedefliyoruz. Siz de bu yenilikçi çalışmalarda yer alabilirsiniz.",
        icon: "innovation"
      },
      {
        id: "career",
        title: "Kariyer Gelişimi",
        description: "Ekibimizin her üyesinin kişisel ve profesyonel gelişimini önemsiyoruz. UNILAB Vision'da uzmanlık alanınızı genişletebilir, yetkinliklerinizi daha da ileriye taşıyabilirsiniz.",
        icon: "career"
      },
      {
        id: "environment",
        title: "İlham Veren Çalışma Ortamı",
        description: "Yenilikçi düşünceleri destekleyen, iş birliğini teşvik eden bir atmosferde çalışın. Fikirlerinizi paylaşabileceğiniz, yaratıcı çözümler üretebileceğiniz bir ekibe katılın.",
        icon: "environment"
      }
    ],
    positionsTitle: "Açık Pozisyonlar",
    positions: [
      {
        id: "unicom",
        title: "UNICOM Ekip Başvurusu",
        department: "Etkinlik Yönetimi",
        description: "Etkili ve ilham verici etkinlikler düzenleyerek toplulukla güçlü bağlar kurmaya odaklanan ekibimize katılın.",
        icon: "unicom",
        skills: ["Etkinlik Planlama", "Proje Yönetimi", "İletişim", "Organizasyon"]
      },
      {
        id: "unidev",
        title: "UNIDEV Yazılım Ekibi Başvurusu",
        department: "Yazılım Geliştirme",
        description: "Yenilikçi teknolojilerle geleceğin çözümlerini geliştiren yazılım ekibimizin bir parçası olun.",
        icon: "unidev",
        skills: ["Yazılım Geliştirme", "Web Teknolojileri", "Mobil Uygulama", "AI/ML"]
      },
      {
        id: "darkpost",
        title: "Darkpost Media Ekip Başvurusu",
        department: "Medya ve İçerik",
        description: "Medya stratejileri ve içerik üretimi ile toplulukla etkili iletişim kurulmasını sağlayan ekibimize katılın.",
        icon: "darkpost",
        skills: ["İçerik Üretimi", "Sosyal Medya", "Grafik Tasarım", "Video Prodüksiyon"]
      }
    ],
    contactTitle: "Bizimle İletişime Geçin",
    contactDescription: "Sorularınız için bize info@myunilab.net mail adresi üzerinden ulaşabilirsiniz.",
    applyButtonText: "Başvuru Yap",
    contactButtonText: "İletişime Geç"
  },
  en: {
    heroTitle: "Career at UNILAB Vision",
    heroSubtitle: "As UNILAB Vision, we carry out projects that push the boundaries of scientific discoveries and technological innovations. Together with creative, curious and solution-oriented individuals who will join our team, we are building the world of the future.",
    heroDescription: "If you are passionate about science and technology and want to develop yourself in an innovative work environment, you are in the right place!",
    whyUsTitle: "Why UNILAB Vision?",
    whyUsSubtitle: "THERE'S A REASON!",
    benefits: [
      {
        id: "innovation",
        title: "Scientific and Technological Innovation",
        description: "With our projects in science, technology and artificial intelligence, we aim to make the world a more livable place. You can also take part in these innovative studies.",
        icon: "innovation"
      },
      {
        id: "career",
        title: "Career Development",
        description: "We care about the personal and professional development of each member of our team. At UNILAB Vision, you can expand your field of expertise and take your competencies even further.",
        icon: "career"
      },
      {
        id: "environment",
        title: "Inspiring Work Environment",
        description: "Work in an atmosphere that supports innovative thinking and encourages collaboration. Join a team where you can share your ideas and produce creative solutions.",
        icon: "environment"
      }
    ],
    positionsTitle: "Open Positions",
    positions: [
      {
        id: "unicom",
        title: "UNICOM Team Application",
        department: "Event Management",
        description: "Join our team focused on building strong connections with the community by organizing effective and inspiring events.",
        icon: "unicom",
        skills: ["Event Planning", "Project Management", "Communication", "Organization"]
      },
      {
        id: "unidev",
        title: "UNIDEV Software Team Application",
        department: "Software Development",
        description: "Be part of our software team that develops future solutions with innovative technologies.",
        icon: "unidev",
        skills: ["Software Development", "Web Technologies", "Mobile App", "AI/ML"]
      },
      {
        id: "darkpost",
        title: "Darkpost Media Team Application",
        department: "Media and Content",
        description: "Join our team that ensures effective communication with the community through media strategies and content production.",
        icon: "darkpost",
        skills: ["Content Creation", "Social Media", "Graphic Design", "Video Production"]
      }
    ],
    contactTitle: "Get in Touch",
    contactDescription: "For your questions, you can reach us via info@myunilab.net.",
    applyButtonText: "Apply Now",
    contactButtonText: "Contact Us"
  }
};

// Statistics for visual appeal
const stats: Statistic[] = [
  { number: "50K+", label: "Takipçi Kitlesi", labelEn: "Follower Audience" },
  { number: "10+", label: "Proje", labelEn: "Projects" },
  { number: "5+", label: "Yıllık Deneyim", labelEn: "Years Experience" },
  { number: "50+", label: "Ekip Üyesi", labelEn: "Team Members" }
];

// Hero Section Component
interface HeroSectionProps {
  content: CareerContent;
  locale: string;
  onApplyClick: () => void;
}

function HeroSection({ content, locale, onApplyClick }: HeroSectionProps) {
  return (
    <section className="py-20 bg-white dark:bg-neutral-900">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light text-neutral-900 dark:text-neutral-100 mb-4 tracking-tight">
            {content.heroTitle}
          </h1>
          
          {/* Accent Line - updated for dark theme */}
          <div className="w-16 h-px bg-[#990000] dark:bg-white mb-8"></div>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            {content.heroSubtitle}
          </p>
          
          {/* Description */}
          <p className="text-base text-neutral-500 dark:text-neutral-500 mb-12 leading-relaxed">
            {content.heroDescription}
          </p>
          
          {/* CTA Buttons - updated for dark theme */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onApplyClick}
              className="px-6 py-3 bg-[#990000] dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-[#800000] dark:hover:bg-neutral-200 transition-all duration-300 flex items-center gap-2 group text-sm font-medium"
            >
              <span>{content.applyButtonText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
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
  content: CareerContent;
}

function BenefitsSection({ content }: BenefitsSectionProps) {
  return (
    <section className="py-20 bg-neutral-50 dark:bg-neutral-800/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 max-w-3xl">
          {/* Badge - updated for dark theme */}
          <div className="inline-block px-3 py-1 bg-[#990000]/10 dark:bg-white/10 rounded-full mb-6">
            <span className="text-xs font-medium text-[#990000] dark:text-white uppercase tracking-wide">
              {content.whyUsSubtitle}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4">
            {content.whyUsTitle}
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

// Main Career Page Component
export default function CareerPage({ locale = 'tr' }: CareerPageProps) {
  const [content, setContent] = useState<CareerContent | null>(null);
  const careersFormRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    try {
      const currentContent = careerData[locale as keyof typeof careerData] || careerData.tr;
      setContent(currentContent);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }, [locale]);

  const scrollToCareersForm = () => {
    if (careersFormRef.current) {
      careersFormRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  if (!content) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-400">İçerik yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <HeroSection content={content} locale={locale} onApplyClick={scrollToCareersForm} />
      <BenefitsSection content={content} />
      <div ref={careersFormRef}>
        <CareersForm formName="unilab_vision_apply" locale={locale} />
      </div>
    </div>
  );
}