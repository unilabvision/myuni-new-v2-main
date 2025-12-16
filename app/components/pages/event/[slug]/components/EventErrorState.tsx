// components/pages/event/[slug]/components/EventErrorState.tsx
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Home, Search, AlertTriangle, Wifi, Server, Bug } from 'lucide-react';

interface EventErrorStateTexts {
  eventNotFound?: string;
  eventNotFoundDesc?: string;
  backToEvents?: string;
  retry?: string;
  error?: string;
  [key: string]: string | undefined;
}

interface EventErrorStateProps {
  error: string | null;
  locale: string;
  eventType: string;
  onRetry: () => void;
  texts: EventErrorStateTexts;
}

const EventErrorState: React.FC<EventErrorStateProps> = ({ 
  error, 
  locale, 
  eventType, 
  onRetry, 
  texts 
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setIsRetrying(false), 1000);
    }
  };

  // Error type detection
  const getErrorType = (errorMessage: string | null) => {
    if (!errorMessage) return 'unknown';
    
    const lowerError = errorMessage.toLowerCase();
    
    if (lowerError.includes('not found') || lowerError.includes('404')) {
      return 'not_found';
    } else if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'network';
    } else if (lowerError.includes('server') || lowerError.includes('500')) {
      return 'server';
    } else if (lowerError.includes('timeout')) {
      return 'timeout';
    } else {
      return 'unknown';
    }
  };

  const errorType = getErrorType(error);

  // Error configurations
  const errorConfig = {
    not_found: {
      icon: Search,
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      title: error === 'Event not found' ? texts.eventNotFound : 'Etkinlik Bulunamadı',
      description: error === 'Event not found' 
        ? texts.eventNotFoundDesc 
        : 'Aradığınız etkinlik mevcut değil veya kaldırılmış olabilir.',
      suggestions: [
        'URL\'yi kontrol edin',
        'Ana sayfaya dönün',
        'Arama özelliğini kullanın',
        'Popüler etkinlikleri inceleyin'
      ]
    },
    network: {
      icon: Wifi,
      iconColor: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      title: 'Bağlantı Sorunu',
      description: 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
      suggestions: [
        'İnternet bağlantınızı kontrol edin',
        'Wi-Fi veya mobil veriye geçin',
        'Birkaç saniye bekleyip tekrar deneyin',
        'VPN kullanıyorsanız kapatmayı deneyin'
      ]
    },
    server: {
      icon: Server,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      title: 'Sunucu Hatası',
      description: 'Sistemimizde geçici bir sorun var. Kısa süre içinde düzelecek.',
      suggestions: [
        'Birkaç dakika bekleyin',
        'Sayfayı yenileyin',
        'Destek ekibiyle iletişime geçin',
        'Sosyal medya hesaplarımızı kontrol edin'
      ]
    },
    timeout: {
      icon: RefreshCw,
      iconColor: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      title: 'İstek Zaman Aşımı',
      description: 'İstek çok uzun sürdü. Lütfen tekrar deneyin.',
      suggestions: [
        'Sayfayı yenileyin',
        'İnternet hızınızı kontrol edin',
        'Birkaç saniye bekleyip tekrar deneyin',
        'Farklı bir tarayıcı deneyin'
      ]
    },
    unknown: {
      icon: Bug,
      iconColor: 'text-neutral-600 dark:text-neutral-400',
      bgColor: 'bg-neutral-100 dark:bg-neutral-800',
      title: texts.error || 'Beklenmeyen Hata',
      description: 'Bir şeyler yanlış gitti. Lütfen tekrar deneyin.',
      suggestions: [
        'Sayfayı yenileyin',
        'Tarayıcı önbelleğini temizleyin',
        'Farklı bir tarayıcı deneyin',
        'Destek ekibiyle iletişime geçin'
      ]
    }
  };

  const config = errorConfig[errorType];
  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        {/* Error Icon */}
        <div className={`w-24 h-24 ${config.bgColor} rounded-full mx-auto mb-8 flex items-center justify-center`}>
          <IconComponent className={`w-12 h-12 ${config.iconColor}`} />
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {config.title}
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
            {config.description}
          </p>
          
          {/* Error Details (for debugging) */}
          {error && errorType !== 'not_found' && (
            <details className="text-left bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 mb-6">
              <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Teknik Detaylar
              </summary>
              <code className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 p-2 rounded block overflow-x-auto">
                {error}
              </code>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link 
            href={`/${locale}/${eventType}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {texts.backToEvents}
          </Link>
          
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="inline-flex items-center justify-center px-6 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all duration-200 font-medium border border-neutral-300 dark:border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Deneniyor...' : texts.retry || 'Tekrar Dene'}
          </button>
          
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
          >
            <Home className="w-4 h-4 mr-2" />
            Ana Sayfa
          </Link>
        </div>

        {/* Suggestions */}
        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-6 border border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600 dark:text-yellow-400" />
            Deneyebilecekleriniz
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.suggestions.map((suggestion, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-white dark:bg-neutral-700 rounded-lg">
                <div className="w-2 h-2 bg-[#990000] rounded-full flex-shrink-0"></div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {suggestion}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
            Sorun devam ediyor mu?
          </h4>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Destek ekibimiz size yardımcı olmaya hazır. 7/24 canlı destek hattımızdan ulaşabilirsiniz.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span>Canlı Destek</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <span>E-posta Gönder</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Discord Topluluğu</span>
            </button>
          </div>
        </div>

        {/* Popular Alternatives */}
        {errorType === 'not_found' && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
              Popüler Etkinlikler
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Yapay Zeka Workshop',
                  type: 'Workshop',
                  participants: '125',
                  rating: 4.8,
                  slug: 'yapay-zeka-workshop'
                },
                {
                  title: 'React Fundamentals',
                  type: 'Webinar',
                  participants: '87',
                  rating: 4.9,
                  slug: 'react-fundamentals'
                },
                {
                  title: 'Data Science Bootcamp',
                  type: 'Conference',
                  participants: '152',
                  rating: 4.7,
                  slug: 'data-science-bootcamp'
                }
              ].map((event, index) => (
                <Link
                  key={index}
                  href={`/${locale}/${eventType}/${event.slug}`}
                  className="group p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {event.title.charAt(0)}
                    </span>
                  </div>
                  
                  <h5 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] dark:group-hover:text-[#ff4444] transition-colors">
                    {event.title}
                  </h5>
                  
                  <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{event.type}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                      </svg>
                      <span>{event.participants}</span>
                    </span>
                  </div>
                  
                  <div className="flex items-center mt-2">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(event.rating) ? 'text-yellow-400' : 'text-neutral-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs ml-1">{event.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="mt-8 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-neutral-600 dark:text-neutral-400">Sistem Durumu: Çevrimiçi</span>
            </div>
            
            <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-neutral-600 dark:text-neutral-400">Son güncelleme: 2 dk önce</span>
            </div>
          </div>
        </div>

        {/* Back to Event List (Mobile-friendly) */}
        <div className="mt-8 md:hidden">
          <Link 
            href={`/${locale}/${eventType}`}
            className="block w-full px-6 py-4 bg-[#990000] text-white rounded-lg hover:bg-[#770000] transition-colors font-medium text-center"
          >
            Tüm Etkinlikleri Görüntüle
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventErrorState;