'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mail, ArrowRight, Network, Globe, Target, Share2, Heart, Trophy, Zap, Building } from 'lucide-react';
import KulupForm from './KulupForm';

interface KulupPageProps {
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

interface KulupContent {
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  whyJoinTitle: string;
  whyJoinSubtitle: string;
  benefits: Benefit[];
  requirementsTitle: string;
  requirements: Requirement[];
  contactTitle: string;
  contactDescription: string;
  joinButtonText: string;
  contactButtonText: string;
  joinLink: string;
}


// Icon mapping for benefits - updated for club network theme
const iconMap: { [key: string]: React.ReactNode } = {
  target: <Target className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  collaboration: <Share2 className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  network: <Network className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  growth: <Trophy className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  community: <Heart className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  innovation: <Zap className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  global: <Globe className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />,
  resources: <Building className="w-5 h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />
};

// Club network page data
const kulupData: { [key: string]: KulupContent } = {
  tr: {
    heroTitle: "MyUNI Kulüp Ağı'na Katılın",
    heroSubtitle: "Türkiye'nin dört bir yanındaki öğrenci kulüplerini ve platformlarını tek bir çatı altında buluşturarak güçlü bir paylaşım, destek ve gelişim ağı oluşturuyoruz.",
    heroDescription: "Eğer siz de kulübünüzle bu büyüyen ağın bir parçası olmak istiyorsanız, haydi başlayalım! 🌿",
    whyJoinTitle: "Neden MyUNI Kulüp Ağı'na Katılmalısınız?",
    whyJoinSubtitle: "BİRLİKTE GÜÇLÜYÜZ!",
    benefits: [
      {
        id: "priority",
        title: "Öncelikli MyUNI Fırsatları",
        description: "MyUNI iş birlikleri, eğitim ve etkinliklerinden öncelikli olarak yararlanarak kulübünüzün gelişimine katkı sağlayın.",
        icon: "target"
      },
      {
        id: "collaboration",
        title: "Üniversiteler Arası İşbirliği",
        description: "Diğer üniversitelerdeki kulüplerle iletişim kurarak ortak projeler geliştirin ve deneyimlerinizi paylaşın.",
        icon: "collaboration"
      },
      {
        id: "network",
        title: "Profesyonel Ağ Erişimi",
        description: "MyUNI'nin geniş profesyonel ağı üzerinden sektör bağlantılarına erişim sağlayarak kariyer fırsatlarını artırın.",
        icon: "network"
      },
      {
        id: "mentorship",
        title: "Mentorluk ve İçerik Üretimi",
        description: "MyUNI'nin düzenleyeceği mentorluk, içerik üretimi ve proje çağrılarında yer alarak gelişim fırsatlarını yakalayın.",
        icon: "growth"
      },
      {
        id: "events",
        title: "Özel Network Buluşmaları",
        description: "Yıl boyunca gerçekleştirilen özel network buluşmalarına dahil olun.",
        icon: "community"
      }
    ],
    requirementsTitle: "Ağa Katılım Kriterleri",
    requirements: [
      {
        id: "commitment",
        title: "İşbirliği Taahhüdü",
        description: "Ağ içindeki diğer topluluklar ile aktif işbirliği yapmaya ve bilgi paylaşımına açık olmak."
      },
      {
        id: "communication",
        title: "İletişim Kanalı",
        description: "Aktif sosyal medya hesapları ile üyelerle düzenli iletişim kurabilen bir yapıya sahip olmak."
      }
    ],
    contactTitle: "Bize Ulaşın",
    contactDescription: "Topluluk başvurunuz veya sorularınız için info@myunilab.net adresinden bizimle iletişime geçin.",
    joinButtonText: "Ağa Katıl",
    contactButtonText: "İletişime Geç",
    joinLink: "https://forms.gle/myuni-clubs-network"
  },
  en: {
    heroTitle: "Join MyUNI Club Network",
    heroSubtitle: "We bring together student clubs and platforms from all over Turkey under one roof to create a strong network of sharing, support and development.",
    heroDescription: "Being part of the network is not just a registration — it's an opportunity to be part of student solidarity, productivity and collaboration. If you want to be part of this growing network with your club, let's get started! 🌿",
    whyJoinTitle: "Why Should You Join MyUNI Clubs Network?",
    whyJoinSubtitle: "STRONGER TOGETHER!",
    benefits: [
      {
        id: "priority",
        title: "Priority MyUNI Opportunities",
        description: "Benefit prioritarily from MyUNI collaborations, training and events to contribute to your club's development.",
        icon: "target"
      },
      {
        id: "collaboration",
        title: "Inter-University Collaboration",
        description: "Communicate with clubs at other universities to develop joint projects and share your experiences.",
        icon: "collaboration"
      },
      {
        id: "network",
        title: "Professional Network Access",
        description: "Access industry connections through MyUNI's extensive professional network to increase career opportunities.",
        icon: "network"
      },
      {
        id: "mentorship",
        title: "Mentorship and Content Creation",
        description: "Seize development opportunities by participating in mentorship, content creation and project calls organized by MyUNI.",
        icon: "growth"
      },
      {
        id: "events",
        title: "Special Network Meetings",
        description: "Experience special experiences by participating in special network meetings held throughout the year.",
        icon: "community"
      }
    ],
    requirementsTitle: "Network Participation Criteria",
    requirements: [
      {
        id: "commitment",
        title: "Collaboration Commitment",
        description: "Being open to active collaboration and knowledge sharing with other communities in the network."
      },
      {
        id: "communication",
        title: "Communication Channel",
        description: "Having a structure that can communicate regularly with members through active social media accounts."
      }
    ],
    contactTitle: "Contact Us",
    contactDescription: "For your club application or questions, please contact us at info@myunilab.net.",
    joinButtonText: "Join Network",
    contactButtonText: "Contact Us",
    joinLink: "https://forms.gle/myuni-clubs-network"
  }
};


// Hero Section Component
interface HeroSectionProps {
  content: KulupContent;
  onJoinClick: () => void;
}

function HeroSection({ content, onJoinClick }: HeroSectionProps) {
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
            <button 
              onClick={onJoinClick}
              className="px-6 py-3 bg-[#990000] dark:bg-white text-white dark:text-neutral-900 rounded-md hover:bg-[#800000] dark:hover:bg-neutral-200 transition-all duration-300 flex items-center gap-2 group text-sm font-medium"
            >
              <Network className="w-4 h-4" />
              <span>{content.joinButtonText}</span>
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
        
       
      </div>
    </section>
  );
}

// Benefits Section Component
interface BenefitsSectionProps {
  content: KulupContent;
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
              {content.whyJoinSubtitle}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 dark:text-neutral-100 mb-4 text-left">
            {content.whyJoinTitle}
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
  content: KulupContent;
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
        <div className="flex flex-col md:flex-row gap-8 max-w-4xl justify-center">
          {content.requirements.map((requirement: Requirement, index: number) => (
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

// Main Club Page Component
export default function KulupPage({ locale = 'tr' }: KulupPageProps) {
  const [content, setContent] = useState<KulupContent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  
  const handleJoinClick = () => {
    setShowForm(true);
    // Scroll to form after a brief delay to ensure it's rendered
    setTimeout(() => {
      formRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };
  
  useEffect(() => {
    try {
      const currentContent = kulupData[locale as keyof typeof kulupData] || kulupData.tr;
      setContent(currentContent);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }, [locale]);
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      <HeroSection content={content || kulupData.tr} onJoinClick={handleJoinClick} />
      <BenefitsSection content={content || kulupData.tr} />
      <RequirementsSection content={content || kulupData.tr} />
      {showForm && (
        <div ref={formRef}>
          <KulupForm locale={locale} />
        </div>
      )}
    </div>
  );
}