'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X, Settings, Check } from 'lucide-react';

interface CookieBannerProps {
  locale?: string;
}

// Interface for individual cookie type (essential, analytics, etc.)
interface CookieType {
  title: string;
  description: string;
  required: boolean;
}

// Interface for language-specific cookie data
interface CookieData {
  title: string;
  description: string;
  acceptAll: string;
  acceptSelected: string;
  rejectAll: string;
  settings: string;
  close: string;
  privacyPolicy: string;
  termsConditions: string;
  privacyLink: string;
  termsLink: string;
  settingsTitle: string;
  settingsDescription: string;
  essential: CookieType;
  analytics: CookieType;
  marketing: CookieType;
  functional: CookieType;
}

const cookieData: Record<string, CookieData> = {
  tr: {
    title: 'Çerez Kullanımı',
    description:
      'Web sitemizde deneyiminizi geliştirmek için çerezler kullanıyoruz. Detaylı bilgi için gizlilik politikamızı inceleyebilirsiniz.',
    acceptAll: 'Tümünü Kabul Et',
    acceptSelected: 'Seçilenleri Kabul Et',
    rejectAll: 'Tümünü Reddet',
    settings: 'Ayarlar',
    close: 'Kapat',
    privacyPolicy: 'Gizlilik Politikası',
    termsConditions: 'Şartlar ve Koşullar',
    privacyLink: '/tr/gizlilik',
    termsLink: '/tr/sartlar-ve-kosullar',
    settingsTitle: 'Çerez Ayarları',
    settingsDescription: 'Hangi çerez türlerini kabul etmek istediğinizi seçebilirsiniz:',
    essential: {
      title: 'Zorunlu Çerezler',
      description: 'Web sitesinin temel işlevleri için gerekli çerezler. Bu çerezler devre dışı bırakılamaz.',
      required: true,
    },
    analytics: {
      title: 'Analitik Çerezler',
      description: 'Web sitesi kullanımını analiz etmek ve performansı iyileştirmek için kullanılır.',
      required: false,
    },
    marketing: {
      title: 'Pazarlama Çerezleri',
      description: 'Size daha uygun içerik ve reklamlar göstermek için kullanılır.',
      required: false,
    },
    functional: {
      title: 'İşlevsel Çerezler',
      description: 'Kişiselleştirilmiş deneyim sunmak ve tercihlerinizi hatırlamak için kullanılır.',
      required: false,
    },
  },
  en: {
    title: 'Cookie Usage',
    description:
      'We use cookies to improve your experience on our website. You can review our privacy policy for detailed information.',
    acceptAll: 'Accept All',
    acceptSelected: 'Accept Selected',
    rejectAll: 'Reject All',
    settings: 'Settings',
    close: 'Close',
    privacyPolicy: 'Privacy Policy',
    termsConditions: 'Terms & Conditions',
    privacyLink: '/en/privacy',
    termsLink: '/en/terms',
    settingsTitle: 'Cookie Settings',
    settingsDescription: 'You can choose which types of cookies you want to accept:',
    essential: {
      title: 'Essential Cookies',
      description: 'Cookies required for basic website functionality. These cookies cannot be disabled.',
      required: true,
    },
    analytics: {
      title: 'Analytics Cookies',
      description: 'Used to analyze website usage and improve performance.',
      required: false,
    },
    marketing: {
      title: 'Marketing Cookies',
      description: 'Used to show you more relevant content and advertisements.',
      required: false,
    },
    functional: {
      title: 'Functional Cookies',
      description: 'Used to provide personalized experience and remember your preferences.',
      required: false,
    },
  },
};

export default function CookieBanner({ locale = 'tr' }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  const content: CookieData = cookieData[locale] || cookieData.tr;

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(allPreferences));
    setIsVisible(false);
  };

  const handleAcceptSelected = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(cookiePreferences));
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    const minimalPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    localStorage.setItem('cookie-consent', JSON.stringify(minimalPreferences));
    setIsVisible(false);
  };

  const togglePreference = (key: keyof typeof cookiePreferences) => {
    if (key === 'essential') return; // Essential cookies cannot be toggled
    setCookiePreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 sm:right-auto z-50 max-w-md sm:max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        {!showSettings ? (
          // Main Banner
          <div className="p-4 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-[#990000]/10 dark:bg-[#990000]/20 flex-shrink-0">
                <Cookie className="w-4 h-4 sm:w-5 sm:h-5 text-[#990000] dark:text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {content.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {content.description}
                </p>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
              <a href={content.privacyLink} className="text-xs text-[#990000] dark:text-white hover:underline">
                {content.privacyPolicy}
              </a>
              <span className="text-xs text-neutral-400">•</span>
              <a href={content.termsLink} className="text-xs text-[#990000] dark:text-white hover:underline">
                {content.termsConditions}
              </a>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-[#990000] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#800000] transition-colors"
                >
                  {content.acceptAll}
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-10 h-10 flex items-center justify-center border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors sm:flex-shrink-0"
                >
                  <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" strokeWidth={1.5} />
                </button>
              </div>
              <button
                onClick={handleRejectAll}
                className="w-full border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {content.rejectAll}
              </button>
            </div>
          </div>
        ) : (
          // Settings Panel
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {content.settingsTitle}
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500 dark:text-neutral-400" strokeWidth={1.5} />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-6">
              {content.settingsDescription}
            </p>

            <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
              {Object.entries(content).map(([key, value]) => {
                if (typeof value === 'object' && 'title' in value && 'description' in value && 'required' in value) {
                  const cookieType: CookieType = value;
                  const isEnabled = cookiePreferences[key as keyof typeof cookiePreferences];

                  return (
                    <div key={key} className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            {cookieType.title}
                          </h4>
                          {cookieType.required && (
                            <span className="px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 text-xs text-neutral-600 dark:text-neutral-400 rounded">
                              {content.essential.required && locale === 'tr' ? 'Zorunlu' : 'Required'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">{cookieType.description}</p>
                      </div>
                      <button
                        onClick={() => !cookieType.required && togglePreference(key as keyof typeof cookiePreferences)}
                        disabled={cookieType.required}
                        className={`w-8 h-5 sm:w-10 sm:h-6 rounded-full transition-colors relative ${
                          isEnabled ? 'bg-[#990000]' : 'bg-neutral-200 dark:bg-neutral-600'
                        } ${cookieType.required ? 'opacity-50' : 'cursor-pointer'}`}
                      >
                        <div
                          className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full absolute top-1 transition-transform ${
                            isEnabled ? 'translate-x-3 sm:translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleAcceptSelected}
                className="flex-1 bg-[#990000] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-[#800000] transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" strokeWidth={1.5} />
                {content.acceptSelected}
              </button>
              <button
                onClick={handleRejectAll}
                className="flex-1 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
              >
                {content.rejectAll}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}