"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'; // Next.js 13+ için
import { BookOpen, FileText, Download, Zap, Award } from 'lucide-react';

interface CourseFeaturesTexts {
  myuniEbook?: string;
  myuniEbookDesc?: string;
  myuniNotes?: string;
  myuniNotesDesc?: string;
  discoverButton?: string;
  [key: string]: string | undefined;
}

interface CourseFeaturesProps {
  texts?: CourseFeaturesTexts;
}

const CourseFeatures: React.FC<CourseFeaturesProps> = ({ 
  texts = {
    myuniEbook: 'MyUNI eBook',
    myuniEbookDesc: 'Kurs ile birlikte interaktif eBook erişimi',
    myuniNotes: 'MyUNI Notes', 
    myuniNotesDesc: 'Akıllı not alma sistemi ile öğrenmenizi güçlendirin',
    discoverButton: 'Keşfet'
  }
}) => {
  const router = useRouter();

  const handleDiscoverClick = () => {
    router.push('/'); // Ana sayfaya yönlendir
  };

  const features = [
    {
      icon: BookOpen,
      title: texts.myuniEbook || 'MyUNI eBook',
      description: texts.myuniEbookDesc || 'Kurs ile birlikte interaktif eBook erişimi',
      details: [
        'İnteraktif içerik',
        'Arama ve not alma',
        'Offline erişim',
        'Çoklu cihaz senkronizasyonu'
      ],
      backgroundImage: '/tr/images/MyUNI-eBook.webp'
    },
    {
      icon: FileText,
      title: texts.myuniNotes || 'MyUNI Notes',
      description: texts.myuniNotesDesc || 'Akıllı not alma sistemi ile öğrenmenizi güçlendirin',
      details: [
        'AI destekli not özetleme',
        'Görsel not alma',
        'Paylaşım özelliği',
        'Kategorilenmiş notlar'
      ],
      backgroundImage: '/tr/images/myuni-notes.webp'
    }
  ];

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div className="text-left">
        <h2 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          MyUNI Ekosistemi
        </h2>
        <div className="w-16 h-px bg-[#990000] mb-6"></div>
        <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Sadece video izlemekle kalmayın, MyUNI&apos;nin güçlü araçları ile öğrenme deneyiminizi bir üst seviyeye taşıyın
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {features.map((feature, index) => (
          <div 
            key={index}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
          >
            {/* Background Image */}
            <div className="relative h-48 bg-neutral-100 dark:bg-neutral-700">
              <Image
                src={feature.backgroundImage}
                alt={feature.title}
                fill
                className="object-cover"
              />
              
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Feature Header */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>

              {/* Feature Details */}
              <div className="space-y-3 mb-6">
                {feature.details.map((detail, detailIndex) => (
                  <div 
                    key={detailIndex}
                    className="flex items-center space-x-3"
                  >
                    <div className="w-1 h-1 bg-neutral-400 rounded-full"></div>
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">{detail}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <button 
                onClick={handleDiscoverClick}
                className="w-full py-3 px-6 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-sm font-medium transition-colors text-sm"
              >
                {texts.discoverButton || 'Keşfet'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bonus Features Section */}
      <div className="p-8 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
        <div className="text-left mb-8">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            Kursa Kayıt Olduğunuzda Ücretsiz Dahil
          </h3>
          <div className="w-16 h-px bg-[#990000] mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Bu araçlar sizin için tamamen ücretsiz!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Download, label: 'Kaynak Kodları' },
            { icon: Award, label: 'Sertifika' },
            { icon: Zap, label: 'Ömür Boyu Erişim' }
          ].map((bonus, index) => (
            <div key={index} className="text-left">
              <div className="w-12 h-12 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-sm flex items-center justify-center mb-3">
                <bonus.icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm mb-1">
                {bonus.label}
              </h4>
              <div className="text-sm font-medium text-[#990000]">
                ÜCRETSİZ
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="inline-flex items-center space-x-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-sm text-sm font-medium">
            <Award className="w-4 h-4" />
            <span>Tüm araçlar sizin için ÜCRETSİZ!</span>
          </div>
        </div>
      </div>

      {/* Integration Preview */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-left mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3 sm:mb-4">
              Tüm Araçlar Tek Platformda
            </h3>
            <div className="w-12 sm:w-16 h-px bg-[#990000] mb-3 sm:mb-4"></div>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
              MyUNI ekosistemi, öğrenme sürecinizin her aşamasında yanınızda
            </p>
          </div>

          {/* Mock Interface Preview */}
          <div className="relative">
            <div className="bg-neutral-100 dark:bg-neutral-700 rounded-sm p-3 sm:p-4 lg:p-6 border border-neutral-200 dark:border-neutral-600">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 rounded-full"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-neutral-400 rounded-full"></div>
                <div className="ml-3 sm:ml-4 text-xs text-neutral-500 dark:text-neutral-400">
                  MyUNI Eğitim Platformu
                </div>
              </div>
              
              {/* Mobile Layout - Stack vertically */}
              <div className="block sm:hidden space-y-3">
                {/* Mobile Header */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3">
                  <div className="h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm mb-2"></div>
                  <div className="h-2 bg-[#990000] rounded-sm w-3/4"></div>
                </div>
                
                {/* Mobile Video Section */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3">
                  <div className="h-20 bg-neutral-200 dark:bg-neutral-600 rounded-sm mb-3 flex items-center justify-center">
                    <div className="w-6 h-6 bg-neutral-400 rounded-sm flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-2/3"></div>
                  </div>
                </div>
                
                {/* Mobile AI Section */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3">
                  <div className="space-y-1.5">
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-3/4"></div>
                    <div className="h-1.5 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-1/2"></div>
                  </div>
                </div>
              </div>
              
              {/* Tablet and Desktop Layout - Grid */}
              <div className="hidden sm:grid grid-cols-12 gap-3 sm:gap-4 h-40 sm:h-48">
                {/* Left Sidebar */}
                <div className="col-span-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  <div className="h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                  <div className="h-1.5 sm:h-2 bg-[#990000] rounded-sm w-3/4"></div>
                  <div className="h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-1/2"></div>
                  <div className="h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                </div>
                
                {/* Main Content */}
                <div className="col-span-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3 sm:p-4">
                  <div className="h-20 sm:h-24 bg-neutral-200 dark:bg-neutral-600 rounded-sm mb-3 sm:mb-4 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-400 rounded-sm flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-2/3"></div>
                  </div>
                </div>
                
                {/* Right Sidebar */}
                <div className="col-span-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="space-y-1">
                    <div className="h-1 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="h-1 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-3/4"></div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="h-1 bg-neutral-200 dark:bg-neutral-600 rounded-sm w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Feature Badges - Responsive positioning */}
            <div className="absolute -top-1 -left-1 sm:-top-2 sm:-left-2 bg-neutral-800 dark:bg-neutral-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm text-xs font-medium">
              <span className="hidden sm:inline">MyUNI Sections</span>
              <span className="sm:hidden">Sections</span>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 bg-neutral-800 dark:bg-neutral-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm text-xs font-medium">
              <span className="hidden sm:inline">MyUNI Video</span>
              <span className="sm:hidden">Video</span>
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-neutral-800 dark:bg-neutral-600 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-sm text-xs font-medium">
              <span className="hidden sm:inline">MyUNI AI</span>
              <span className="sm:hidden">AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseFeatures;