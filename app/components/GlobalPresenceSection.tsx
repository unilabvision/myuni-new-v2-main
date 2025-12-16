'use client'; // DottedMap istemci tarafında çalışır, bu yüzden use client ekliyoruz

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, Globe, Truck, LucideIcon } from 'lucide-react';
import Button from './ui/Button';
import DottedMap from 'dotted-map';

interface GlobalPresenceSectionProps {
  locale: string;
}

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface GlobalPresenceContent {
  headline: string;
  description: string;
  features: Feature[];
  cta: string;
  ctaLink: string;
}

// Statik veri (gerçek uygulamada Supabase gibi bir kaynaktan çekilebilir)
async function getGlobalPresenceContent(locale: string): Promise<GlobalPresenceContent> {
  return {
    headline: locale === 'tr'
      ? 'UNILAB Vision ile Küresel Vizyon'
      : 'Global Vision with UNILAB Vision',
    description: locale === 'tr'
      ? 'UNILAB Vision olarak, bilim ve teknoloji alanında sektörel uzmanlık ve yenilikçi projelerle küresel bir etki yaratıyoruz. Amacımız, farklı sektörlerden paydaşları bir araya getirerek global sorunlara kapsamlı ve yenilikçi çözümler sunmaktır. Yerel uzmanlığımızı, sektörel bilgi birikimimizle birleştirerek sınırları aşan bir vizyon benimsiyoruz.'
      : 'As UNILAB Vision, we create a global impact through sectoral expertise and innovative projects in science and technology. Our goal is to bring together stakeholders from various sectors, offering comprehensive and innovative solutions to global challenges. We combine our local expertise with sectoral knowledge, embracing a vision that transcends borders.',
    features: locale === 'tr' ? [
      {
        icon: Clock,
        title: 'Küresel Erişim Hedefi',
        description: 'Projelerimiz, dünya çapındaki üniversiteler, araştırma merkezleri, teknoloji toplulukları ve sektör liderleriyle iş birliği yaparak bilgi ve deneyim paylaşımını teşvik etmeyi amaçlıyor.'
      },
      {
        icon: Globe,
        title: 'Global Sorunlara Sektörel Çözümler',
        description: 'Farklı sektörlerden paydaşları bir araya getiren projelerimiz, global sorunlara yenilikçi ve sektörel odaklı çözümler sunmayı hedefliyor.'
      },
      {
        icon: Truck,
        title: 'Kültürel ve Sektörel Katılım Vizyonu',
        description: 'Farklı kültürlerden ve sektörlerden paydaşların bilim ve teknoloji projelerimize katılımını sağlayarak küresel bir öğrenme ve gelişim platformu oluşturmayı hedefliyoruz.'
      }
    ] : [
      {
        icon: Clock,
        title: 'Global Reach Objective',
        description: 'Our projects aim to collaborate with universities, research centers, technology communities, and industry leaders worldwide, promoting knowledge and experience sharing.'
      },
      {
        icon: Globe,
        title: 'Sectoral Solutions for Global Challenges',
        description: 'Bringing together stakeholders from various sectors, our projects aim to provide innovative, industry-focused solutions to global issues.'
      },
      {
        icon: Truck,
        title: 'Vision for Cultural and Sectoral Engagement',
        description: 'We aim to create a global platform for learning and development by engaging stakeholders from diverse cultures and sectors in our science and technology projects.'
      }
    ],
    cta: locale === 'tr' ? 'Global Vizyonumuzu Keşfedin' : 'Discover Our Global Vision',
    ctaLink: locale === 'tr' ? '/tr/hakkimizda' : '/en/about',
  };
}

export default function GlobalPresenceSection({ locale }: GlobalPresenceSectionProps) {
  const [content, setContent] = useState<GlobalPresenceContent | null>(null);
  const [lightSvgMap, setLightSvgMap] = useState<string | null>(null);
  const [darkSvgMap, setDarkSvgMap] = useState<string | null>(null);

  useEffect(() => {
    // İçeriği yükle
    getGlobalPresenceContent(locale).then((data) => {
      setContent(data);
    });

    // DottedMap ile haritayı oluştur
    const map = new DottedMap({ height: 60, grid: 'diagonal' });

    // Öne çıkan şehirler için pin ekleme
    const keyLocations = [
      { lat: 41.0082, lng: 28.9784, svgOptions: { color: '#990000', radius: 0.5 } }, // Istanbul, Turkey
      { lat: 48.8566, lng: 2.3522, svgOptions: { color: '#990000', radius: 0.5 } }, // Paris, France
      { lat: 52.5200, lng: 13.4050, svgOptions: { color: '#990000', radius: 0.5 } }, // Berlin, Germany
      { lat: 39.9042, lng: 116.4074, svgOptions: { color: '#990000', radius: 0.5 } }, // Beijing, China
      { lat: 14.5995, lng: 120.9842, svgOptions: { color: '#990000', radius: 0.5 } }, // Manila, Philippines
      { lat: 28.6139, lng: 77.2090, svgOptions: { color: '#990000', radius: 0.5 } }, // New Delhi, India
      { lat: 37.5665, lng: 126.9780, svgOptions: { color: '#990000', radius: 0.5 } }, // Seoul, South Korea
      { lat: 40.7128, lng: -74.0060, svgOptions: { color: '#990000', radius: 0.5 } }, // New York, USA
      { lat: 43.6532, lng: -79.3832, svgOptions: { color: '#990000', radius: 0.5 } }, // Toronto, Canada
      { lat: 51.5074, lng: -0.1278, svgOptions: { color: '#990000', radius: 0.5 } }, // London, United Kingdom
      { lat: 55.6761, lng: 12.5683, svgOptions: { color: '#990000', radius: 0.5 } }, // Copenhagen, Denmark
    ];

    keyLocations.forEach((location) => {
      map.addPin(location);
    });

    // Light mode için harita
    const lightSvg = map.getSVG({
      radius: 0.22,
      color: '#4B5563', // Closed gray for default dots in light mode
      shape: 'hexagon', // Hexagon for a modern, techy vibe
      backgroundColor: 'transparent',
    });

    // Dark mode için harita
    const darkSvg = map.getSVG({
      radius: 0.22,
      color: '#9CA3AF', // Lighter gray for default dots in dark mode
      shape: 'hexagon',
      backgroundColor: 'transparent',
    });

    setLightSvgMap(lightSvg);
    setDarkSvgMap(darkSvg);
  }, [locale]);

  if (!content || !lightSvgMap || !darkSvgMap) {
    return (
      <section className="py-16 lg:py-20 relative bg-white dark:bg-neutral-900">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </section>
    );
  }

  const renderHighlightedHeadline = () => {
    if (locale === 'tr') {
      const parts = content.headline.split('Küresel Vizyon');
      return (
        <>
          {parts[0]}
          <span className="text-[#990000] dark:text-[#fff] border-b-2 border-[#990000]">Küresel Vizyon</span>
          {parts[1]}
        </>
      );
    } else {
      const parts = content.headline.split('Global Vision');
      return (
        <>
          {parts[0]}
          <span className="text-[#990000] dark:text-[#fff] ">Global Vision</span>
          {parts[1]}
        </>
      );
    }
  };

  return (
    <section className="relative py-10 lg:py-32 overflow-hidden bg-white dark:bg-neutral-900">
      <style jsx>{`
        .map-container img {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      <div className="container mx-auto relative z-10">
        {/* Üst kısım - Sol başlık, sağ açıklama */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
          {/* Sol taraf - Başlık */}
          <div>
            <h2 className="text-3xl lg:text-4xl xl:text-6xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
              {renderHighlightedHeadline()}
            </h2>
          </div>

          {/* Sağ taraf - Açıklama */}
          <div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
              {content.description}
            </p>
          </div>
        </div>

        {/* Özellikler - 3 sütun */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {content.features.map((feature: Feature, index: number) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="group relative bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden transition-all duration-500 ease-in-out hover:shadow-md hover:border-[#990000]/20 dark:hover:border-[#990000]/20">
                {/* Soft hover efekti için gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/0 to-[#990000]/0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ease-in-out pointer-events-none"></div>
                
                <div className="p-8">
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-neutral-50 dark:bg-neutral-700/50 mb-6 transition-all duration-500 ease-in-out group-hover:bg-[#990000]/5">
                    <IconComponent className="w-8 h-8 text-[#990000] dark:text-white" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 transition-all duration-500 ease-in-out group-hover:text-[#990000]">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Soft slide-in line effect */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#990000]/30 group-hover:w-full transition-all duration-700 ease-in-out"></div>
              </div>
            );
          })}
        </div>

        {/* CTA Butonları */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link href={content.ctaLink}>
            <Button
              variant="primary"
              className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-sm py-3 px-8 text-md font-medium flex items-center"
            >
              {content.cta}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>

          <Link href={locale === 'tr' ? '/tr/iletisim' : '/en/contact'}>
            <Button
              variant="secondary"
              className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-sm py-3 px-8 text-md font-medium"
            >
              {locale === 'tr' ? 'Bize Ulaşın' : 'Contact Us'}
            </Button>
          </Link>
        </div>

        {/* En altta dünya haritası (SVG) - Mobilde gizli */}
        <div className="mt-16 hidden sm:block">
          <h3 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-8">
            {locale === 'tr' ? 'Küresel Etkimiz' : 'Our Global Impact'}
          </h3>
          
          <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
            {locale === 'tr' 
              ? 'UNILAB Vision olarak birçok kıtada faaliyet gösteriyor, dünya çapında genç yetenekleri bilim ve teknoloji alanında bir araya getiriyoruz. Her noktada bir hikaye, her bağlantıda bir gelecek var.'
              : 'As UNILAB Vision, we operate in many continents and bring together young talents from around the world in science and technology. There is a story at every point, a future in every connection.'
            }
          </p>
          
          <div className="map-container relative h-[500px] w-full rounded-sm overflow-hidden">
            {/* Light mode haritası */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(lightSvgMap)}`}
              alt="World Map"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              className="block dark:hidden"
            />
            {/* Dark mode haritası */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/svg+xml;utf8,${encodeURIComponent(darkSvgMap)}`}
              alt="World Map"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              className="hidden dark:block"
            />
          </div>
        </div>
      </div>
    </section>
  );
}