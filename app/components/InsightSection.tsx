import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface InsightSectionProps {
  locale: string;
}

// Gerçek uygulamada burada Supabase'den veri çekilecek
async function getInsightContent(locale: string) {
  return {
    title: locale === 'tr' 
      ? "UNILAB Vision'ı Keşfet"
      : "Discover UNILAB Vision",
    description: locale === 'tr'
      ? "UNILAB Vision’ın yenilikçi projeleri ve bilimsel çözümleriyle tanışın. Sağlık, teknoloji ve sürdürülebilirlik alanlarında geleceği nasıl şekillendirdiğimizi öğrenin."
      : "Explore UNILAB Vision’s innovative projects and scientific solutions. Learn how we shape the future in healthcare, technology, and sustainability.",
    primaryButtonText: locale === 'tr' ? "Portfolyomuzu Keşfet" : "Explore Our Portfolio",
    secondaryButtonText: locale === 'tr' ? "Bize Ulaş" : "Contact Us",
    primaryButtonLink: "https://postozen.com/unilab",
    secondaryButtonLink: locale === 'tr' ? "/tr/iletisim" : "/en/contact"
  };
}

export default async function InsightSection({ locale }: InsightSectionProps) {
  try {
    const content = await getInsightContent(locale);
    
    return (
      <section className="relative w-full py-16 overflow-hidden">
        {/* Gradient Background - Full Width */}
        
        {/* Content */}
        <div className="container relative z-10 mx-auto">
          <div className="max-w-xl">
            <h2 className="text-4xl font-light text-neutral-800 dark:text-white mb-6 leading-tight">
              {content.title}
            </h2>
            
            <p className="text-lg text-neutral-700 dark:text-neutral-200 mb-10 leading-relaxed font-light">
              {content.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link 
                href={content.primaryButtonLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center bg-[#990000] hover:bg-[#880000] text-white py-3 px-8 rounded-sm transition-all duration-300 text-base font-normal overflow-hidden"
              >
                <span className="transition-transform duration-300">{content.primaryButtonText}</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300" />
              </Link>
              
              <Link 
                href={content.secondaryButtonLink}
                className="inline-flex items-center justify-center bg-transparent text-neutral-800 dark:text-white border border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 py-3 px-8 rounded-sm transition-colors duration-300 text-base font-normal"
              >
                {content.secondaryButtonText}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Failed to load insight content:', error);
    return (
      <section className="py-16 lg:py-20 relative">
        <div className="container mx-auto">
          <p>İçerik yüklenirken bir hata oluştu. Detaylar için konsolu kontrol edin.</p>
        </div>
      </section>
    );
  }
}