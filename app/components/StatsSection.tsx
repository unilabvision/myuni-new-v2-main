// components/StatsSection.tsx
import React from 'react';
import { Users, Code, Server, Award, ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// StatItem arayüzü
interface StatItem {
  icon: string;
  value: string;
  label: string;
  description: string;
}

// Locale parametresi ekleyin
interface StatsSectionProps {
  locale: string;
}

async function getStatsContent(locale: string) {
  try {
    // Database sorgusu
    const { data, error } = await supabase
      .from('stats_content')
      .select('*')
      .eq('locale', locale)
      .single();

    if (error) {
      console.error('Error fetching stats content:', error);
      throw error;
    }
    
    // JSONB veri tipini işle
    let parsedStats = data.stats;
    
    // Eğer stats bir string ise, parse et
    if (typeof data.stats === 'string') {
      try {
        parsedStats = JSON.parse(data.stats);
      } catch (e) {
        console.error('Error parsing stats JSON:', e);
        throw e;
      }
    }

    // Tam database verilerini dön, varsayılan değer ekleme
    // Önemli: Database'de sütun isimleri ctabutton ve ctalink (küçük harflerle) olarak geçiyor
    return {
      title: data.title,
      subtitle: data.subtitle,
      description: data.description,
      stats: parsedStats,
      ctaButton: data.ctabutton,  // ctabutton (küçük harflerle)
      ctaLink: data.ctalink        // ctalink (küçük harflerle)
    };
  } catch (error) {
    console.error('Failed to fetch stats content:', error);
    throw error; // Hatayı tekrar fırlat, varsayılan değer kullanma
  }
}

export default async function StatsSection({ locale }: StatsSectionProps) {
  try {
    const content = await getStatsContent(locale);
    
    return (
      <section className="py-16 lg:py-20 relative">
        <div className="container mx-auto">
          {/* Başlık Bölümü */}
          <div className="text-left mb-16">
            <span className="bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 px-4 py-1.5 text-xs font-medium tracking-wider inline-block">
              {content.title}
            </span>
            <h2 className="text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mt-4 mb-3">
              {content.subtitle}
            </h2>
            <div className="w-16 h-px bg-neutral-300 dark:bg-neutral-700 mb-4"></div>
            <p className="text-md text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
              {content.description}
            </p>
          </div>
          
          {/* İstatistik Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.stats.map((stat: StatItem, index: number) => (
              <div 
                key={index}
                className="p-8 bg-neutral-50 dark:bg-neutral-800 border-l-2 border-neutral-200 dark:border-neutral-700 hover:border-l-2 hover:border-neutral-400 dark:hover:border-neutral-500 transition-all duration-300"
              >
                <div className="mb-4 bg-neutral-100 dark:bg-neutral-700 p-3 rounded-sm w-fit">
                  {(() => {
                    switch (stat.icon) {
                      case 'Users':
                        return <Users className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                      case 'Code':
                        return <Code className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                      case 'Server':
                        return <Server className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                      case 'Award':
                        return <Award className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                      default:
                        return <Users className="w-8 h-8 text-neutral-700 dark:text-neutral-300" />;
                    }
                  })()}
                </div>
                <h3 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {stat.value}
                </h3>
                <h4 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                  {stat.label}
                </h4>
                <p className="text-neutral-600 dark:text-neutral-400 text-md">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
          
          {/* CTA Bölümü - Doğrudan database'den alınan değerleri kullan */}
          {content.ctaButton && content.ctaLink && (
            <div className="mt-16 text-left">
              <Link href={content.ctaLink}>
                <Button
                  variant="primary"
                  className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-sm py-3 px-8 text-md font-medium flex items-center"
                >
                  {content.ctaButton}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  } catch {
    // error parametresi kullanılmıyor, bu yüzden kaldırıldı
    return (
      <section className="py-16 lg:py-20 relative">
        <div className="container mx-auto">
          <p>An error occurred while loading content. Please check the console for details.</p>
        </div>
      </section>
    );
  }
}