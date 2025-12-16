// components/PricingSection.tsx
'use client';

import React, { useState } from "react";
import { 
  Check, 
  X, 
  Crown, 
  Zap, 
  BookOpen,
  Shield
} from "lucide-react";

interface PricingSectionProps {
  locale?: string;
}

const PricingSection: React.FC<PricingSectionProps> = ({ locale = 'tr' }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const content = {
    tr: {
      badge: "💰 Fiyatlandırma",
      title: "Size uygun planı seçin",
      description: "Hedeflerinize ve bütçenize uygun esnek fiyatlandırma seçenekleri ile öğrenme yolculuğunuza başlayın.",
      billingToggle: {
        monthly: "Aylık",
        yearly: "Yıllık",
        savings: "2 ay ücretsiz!"
      },
      plans: [
        {
          name: "Temel",
          icon: BookOpen,
          popular: false,
          monthlyPrice: 99,
          yearlyPrice: 990,
          description: "Bireysel öğrenciler için ideal başlangıç paketi",
          features: [
            { text: "20+ temel kurs erişimi", included: true },
            { text: "7/24 video içerik erişimi", included: true },
            { text: "Topluluk forumu", included: true },
            { text: "Temel sertifikalar", included: true },
            { text: "Mobil uygulama", included: true },
            { text: "Email destek", included: true },
            { text: "Canlı dersler", included: false },
            { text: "1:1 mentörlük", included: false },
            { text: "Proje inceleme", included: false },
            { text: "İş bulma desteği", included: false }
          ],
          cta: "Hemen Başla",
          mostPopular: false
        },
        {
          name: "Profesyonel",
          icon: Zap,
          popular: true,
          monthlyPrice: 199,
          yearlyPrice: 1990,
          description: "Kariyer geliştirmek isteyen profesyoneller için",
          features: [
            { text: "100+ kurs erişimi", included: true },
            { text: "7/24 video içerik erişimi", included: true },
            { text: "Topluluk forumu", included: true },
            { text: "Sektör sertifikaları", included: true },
            { text: "Mobil uygulama", included: true },
            { text: "Öncelikli destek", included: true },
            { text: "Haftalık canlı dersler", included: true },
            { text: "Aylık grup mentörlük", included: true },
            { text: "Proje inceleme", included: true },
            { text: "CV ve portfolio desteği", included: false }
          ],
          cta: "En Popüler",
          mostPopular: true
        },
        {
          name: "Premium",
          icon: Crown,
          popular: false,
          monthlyPrice: 399,
          yearlyPrice: 3990,
          description: "Maksimum destek ve özelleştirme isteyen uzmanlar için",
          features: [
            { text: "Tüm kurslar (500+)", included: true },
            { text: "7/24 video içerik erişimi", included: true },
            { text: "VIP topluluk erişimi", included: true },
            { text: "Uluslararası sertifikalar", included: true },
            { text: "Tüm platform özellikleri", included: true },
            { text: "7/24 premium destek", included: true },
            { text: "Günlük canlı dersler", included: true },
            { text: "Haftalık 1:1 mentörlük", included: true },
            { text: "Detaylı proje inceleme", included: true },
            { text: "Kapsamlı iş bulma desteği", included: true }
          ],
          cta: "Üst Düzey",
          mostPopular: false
        }
      ],
      guarantee: "30 gün koşulsuz para iade garantisi"
    },
    en: {
      badge: "💰 Pricing",
      title: "Choose the plan that suits you",
      description: "Start your learning journey with flexible pricing options that suit your goals and budget.",
      billingToggle: {
        monthly: "Monthly",
        yearly: "Yearly",
        savings: "2 months free!"
      },
      plans: [
        {
          name: "Basic",
          icon: BookOpen,
          popular: false,
          monthlyPrice: 29,
          yearlyPrice: 290,
          description: "Perfect starter package for individual students",
          features: [
            { text: "20+ basic course access", included: true },
            { text: "24/7 video content access", included: true },
            { text: "Community forum", included: true },
            { text: "Basic certificates", included: true },
            { text: "Mobile app", included: true },
            { text: "Email support", included: true },
            { text: "Live classes", included: false },
            { text: "1:1 mentoring", included: false },
            { text: "Project review", included: false },
            { text: "Job placement support", included: false }
          ],
          cta: "Get Started",
          mostPopular: false
        },
        {
          name: "Professional",
          icon: Zap,
          popular: true,
          monthlyPrice: 59,
          yearlyPrice: 590,
          description: "For professionals looking to advance their career",
          features: [
            { text: "100+ course access", included: true },
            { text: "24/7 video content access", included: true },
            { text: "Community forum", included: true },
            { text: "Industry certificates", included: true },
            { text: "Mobile app", included: true },
            { text: "Priority support", included: true },
            { text: "Weekly live classes", included: true },
            { text: "Monthly group mentoring", included: true },
            { text: "Project review", included: true },
            { text: "CV and portfolio support", included: false }
          ],
          cta: "Most Popular",
          mostPopular: true
        },
        {
          name: "Premium",
          icon: Crown,
          popular: false,
          monthlyPrice: 99,
          yearlyPrice: 990,
          description: "For experts who want maximum support and customization",
          features: [
            { text: "All courses (500+)", included: true },
            { text: "24/7 video content access", included: true },
            { text: "VIP community access", included: true },
            { text: "International certificates", included: true },
            { text: "All platform features", included: true },
            { text: "24/7 premium support", included: true },
            { text: "Daily live classes", included: true },
            { text: "Weekly 1:1 mentoring", included: true },
            { text: "Detailed project review", included: true },
            { text: "Comprehensive job placement support", included: true }
          ],
          cta: "Premium",
          mostPopular: false
        }
      ],
      guarantee: "30-day unconditional money back guarantee"
    }
  };

  const currentContent = content[locale as keyof typeof content] || content.tr;

  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50">
      <div className="container mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
            {currentContent.badge}
          </div>
          
          <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6 max-w-4xl mx-auto">
            {currentContent.title}
          </h2>
          
          <div className="w-16 h-px bg-[#990000] mx-auto mb-6" />
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl mx-auto mb-8">
            {currentContent.description}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-500'}`}>
              {currentContent.billingToggle.monthly}
            </span>
            
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-12 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full transition-colors duration-300 focus:outline-none"
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                billingCycle === 'yearly' ? 'translate-x-6 bg-[#990000]' : ''
              }`} />
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-500'}`}>
                {currentContent.billingToggle.yearly}
              </span>
              {billingCycle === 'yearly' && (
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs px-2 py-1 rounded-full font-medium">
                  {currentContent.billingToggle.savings}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {currentContent.plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
            const originalYearlyPrice = plan.monthlyPrice * 12;
            const yearlyDiscount = billingCycle === 'yearly' ? originalYearlyPrice - plan.yearlyPrice : 0;
            
            return (
              <div key={index} className={`relative ${plan.mostPopular ? 'lg:-mt-4 lg:mb-4' : ''}`}>
                {plan.mostPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#990000] text-white text-xs px-4 py-2 rounded-full font-medium z-10">
                    En Popüler
                  </div>
                )}
                
                <div className={`bg-white dark:bg-neutral-800 p-8 rounded-lg border-2 shadow-lg hover:shadow-xl transition-all duration-300 h-full ${
                  plan.mostPopular 
                    ? 'border-[#990000] dark:border-[#ff4444] scale-105' 
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                }`}>
                  {/* Plan Header */}
                  <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      plan.mostPopular 
                        ? 'bg-[#990000] text-white' 
                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                      {plan.name}
                    </h3>
                    
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                      {plan.description}
                    </p>
                    
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                          ₺{price}
                        </span>
                        <span className="text-sm text-neutral-500 dark:text-neutral-500">
                          /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                        </span>
                      </div>
                      
                      {billingCycle === 'yearly' && yearlyDiscount > 0 && (
                        <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                          ₺{yearlyDiscount} tasarruf
                        </div>
                      )}
                    </div>
                    
                    <button className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-300 ${
                      plan.mostPopular
                        ? 'bg-[#990000] hover:bg-[#cc0000] text-white shadow-lg hover:shadow-xl'
                        : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100'
                    }`}>
                      {plan.cta}
                    </button>
                  </div>
                  
                  {/* Features */}
                  <div className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? 'text-neutral-600 dark:text-neutral-400' 
                            : 'text-neutral-400 dark:text-neutral-600 line-through'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Guarantee */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-6 py-3 rounded-lg border border-green-200 dark:border-green-800">
            <Shield className="w-5 h-5" />
            <span className="font-medium">{currentContent.guarantee}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;