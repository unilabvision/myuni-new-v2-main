// components/WhyChooseSection.tsx
'use client';

import React from "react";
import { 
  GraduationCap, 
  Users, 
  Award, 
  Clock, 
  Shield, 
  Zap
} from "lucide-react";

interface WhyChooseSectionProps {
  locale?: string;
}

const WhyChooseSection: React.FC<WhyChooseSectionProps> = ({ locale = 'tr' }) => {
  const content = {
    tr: {
      badge: "✨ Neden MyUNI?",
      title: "Öğrenme deneyiminizi bir üst seviyeye taşıyan özellikler",
      description: "MyUNI'nin sunduğu benzersiz avantajlar ve özelliklerle eğitim yolculuğunuzda fark yaratın.",
      features: [
        {
          icon: GraduationCap,
          title: "Kişiselleştirilmiş Öğrenme",
          description: "AI destekli sistemimiz, öğrenme tarzınıza göre içerikleri özelleştirir ve ilerleme hızınızı optimize eder."
        },
        {
          icon: Users,
          title: "Topluluk Odaklı Yaklaşım",
          description: "Binlerce öğrenci ve uzmanla etkileşim kurarak ağınızı genişletin ve deneyimlerinizi paylaşın."
        },
        {
          icon: Award,
          title: "Sertifikalı Eğitimler",
          description: "Tamamladığınız kurslar için endüstri tarafından tanınan sertifikalar alın ve kariyerinize değer katın."
        },
        {
          icon: Clock,
          title: "Esnek Zamanlama",
          description: "7/24 erişim ile kendi tempınızda ilerleyin. İş, okul veya diğer sorumluluklarınızla uyumlu öğrenin."
        },
        {
          icon: Shield,
          title: "Güvenli Platform",
          description: "SSL şifreleme ve güvenli ödeme sistemleri ile verileriniz ve ödemeleriniz tamamen güvende."
        },
        {
          icon: Zap,
          title: "Hızlı Başlangıç",
          description: "Karmaşık kurulum süreçleri yok. 5 dakikada kaydolun ve hemen öğrenmeye başlayın."
        }
      ]
    },
    en: {
      badge: "✨ Why MyUNI?",
      title: "Features that take your learning experience to the next level",
      description: "Make a difference in your educational journey with the unique advantages and features offered by MyUNI.",
      features: [
        {
          icon: GraduationCap,
          title: "Personalized Learning",
          description: "Our AI-powered system customizes content according to your learning style and optimizes your progress speed."
        },
        {
          icon: Users,
          title: "Community-Focused Approach",
          description: "Expand your network and share your experiences by interacting with thousands of students and experts."
        },
        {
          icon: Award,
          title: "Certified Education",
          description: "Receive industry-recognized certificates for completed courses and add value to your career."
        },
        {
          icon: Clock,
          title: "Flexible Scheduling",
          description: "Progress at your own pace with 24/7 access. Learn in harmony with work, school or other responsibilities."
        },
        {
          icon: Shield,
          title: "Secure Platform",
          description: "Your data and payments are completely safe with SSL encryption and secure payment systems."
        },
        {
          icon: Zap,
          title: "Quick Start",
          description: "No complex setup processes. Register in 5 minutes and start learning immediately."
        }
      ]
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-left mb-16">
          <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
            {currentContent.badge}
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6 max-w-xl">
            {currentContent.title}
          </h2>
          
          <div className="w-16 h-px bg-[#990000] mb-6" />
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xl">
            {currentContent.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentContent.features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group">
                <div className="bg-white dark:bg-neutral-800 p-8 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 h-full">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#990000]/10 to-[#990000]/20 dark:from-[#990000]/20 dark:to-[#990000]/30 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-[#990000] dark:text-[#ff4444]" />
                  </div>
                  
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                    {feature.title}
                  </h3>
                  
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseSection;