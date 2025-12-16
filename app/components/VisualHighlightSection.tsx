import React from 'react';
import Image from 'next/image';
import styles from './VisualHighlightSection.module.css';

// Props interface for the section
interface VisualHighlightSectionProps {
  locale: string;
}

// Content interface for multilingual support
interface SectionContent {
  hoverText: string;
}

// Mock function to fetch content based on locale
async function getSectionContent(locale: string): Promise<SectionContent> {
  const content: { [key: string]: SectionContent } = {
    tr: {
      hoverText: 'Bilim ve Teknolojiyle Geleceği Şekillendiriyoruz',
    },
    en: {
      hoverText: 'Shaping the Future with Science and Technology',
    },
  };

  return content[locale] || content.tr;
}

export default async function VisualHighlightSection({ locale }: VisualHighlightSectionProps) {
  try {
    const content = await getSectionContent(locale);

    return (
      <section className={`relative w-full h-[400px] overflow-hidden group ${styles.visualSection}`}>
        {/* Background Pattern */}
        
        {/* Main Image */}
        <Image
          src="https://images.unsplash.com/photo-1731530357802-08d982917720?q=80&w=1935&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="UNILAB Vision Innovation"
          fill
          sizes="100vw"
          className={`object-cover transition-transform duration-1000 ease-in-out ${styles.imageHover}`}
          priority
        />
        {/* Primary Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#990000]/70 to-transparent opacity-0 transition-opacity duration-700 ease-in-out ${styles.overlay}`} />
        {/* Secondary Overlay for Depth */}
        <div className={`absolute inset-0 bg-[#990000]/10 opacity-0 transition-opacity duration-900 ease-in-out ${styles.secondaryOverlay}`} />
        {/* Hover Text */}
        <div className={`absolute bottom-8 left-8 max-w-lg ${styles.textContainer}`}>
          <p className={`text-white text-2xl font-medium tracking-wide ${styles.textAppear}`}>
            {content.hoverText}
          </p>
          <div className={`w-0 h-0.5 bg-white mt-2 transition-all duration-500 ease-in-out ${styles.underline}`} />
        </div>
      </section>
    );
  } catch (error) {
    console.error('Failed to load section content:', error);
    return (
      <section className="relative w-full h-[400px] bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <p className="text-neutral-600 dark:text-neutral-300 text-center">
          İçerik yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>
      </section>
    );
  }
}