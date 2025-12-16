'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Button from './ui/Button';
import styles from './HeroSection.module.css';
import PersonalizedEducationRecommendation from './PersonalizedEducationRecommendation';

interface HeroSectionProps {
  locale: string;
}

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  price: number;
  originalPrice?: number;
  matchScore: number;
  matchReasons: string[];
}

// Move content to a synchronous function since it's now client-side
function getHeroContent(locale: string) {
  return {
    badge: locale === 'tr' ? "🚀 Geleceğinizi şekillendirin!" : "🚀 Shape your future!",
    headlines: locale === 'tr' 
      ? [
          "Kariyerine yön ver, gerçek potansiyelini keşfet!",
          "Geleceğine yatırım yap, hayallerini gerçekleştir!",
          "Yeni beceriler kazan, güçlü kariyerinde ilerle!"
        ]
      : [
          "Shape your career, discover your true potential!",
          "Invest in your future, make your dreams come true!",
          "Gain new skills, advance in your strong career!"
        ],
    description: locale === 'tr'
      ? "Kendi öğrenme tarzınıza uygun bir şekilde ilerleyin ve gelişiminizi adım adım keşfedin. Yapay zeka desteği ile size en uygun öğrenme yolunu sunuyor, deneyimli eğitmenler tarafından hazırlanan kurslarımızla destekliyoruz!"
      : "Progress in a way that suits your learning style and discover your development step by step. We offer you the most suitable learning path with artificial intelligence support, supported by courses prepared by experienced instructors.",
    cta: locale === 'tr' ? "MyUNI'yi Keşfet" : "Discover MyUNI",
    ctaLink: locale === 'tr' ? '/tr/kurs' : '/en/course',
    servicesLink: locale === 'tr' ? '/tr/kurs' : '/en/course',
    secondaryCta: locale === 'tr' ? 'Eğitimlerimiz' : 'Courses',
    hoverText: locale === 'tr' 
      ? 'Bilim ve Teknolojiyle Geleceği Şekillendiriyoruz'
      : 'Shaping the Future with Science and Technology',
    stats: locale === 'tr' 
      ? [
          { value: "1000+", label: "Kursiyer" },
          { value: "5", label: "Aktif İçerik" },
          { value: "%92", label: "Memnuniyet" }
        ]
      : [
          { value: "1000+", label: "Trainee" },
          { value: "4", label: "Active Content" },
          { value: "92%", label: "Satisfaction" }
        ],
    discountCode: locale === 'tr' 
      ? { text: "İlk kayıtta %15 indirim:", code: "HOŞGELDİN15" }
      : { text: "15% discount on first registration:", code: "HOŞGELDİN15" },
    imageOverlays: locale === 'tr' 
      ? ["Eğitimde Kalite ve Yenilik", "Hedefinize Adım Adım Ulaşın"]
      : ["Quality and Innovation in Education", "Reach Your Goal Step by Step"]
  };
}

export default function HeroSection({ locale }: HeroSectionProps) {
  const [content] = useState(() => getHeroContent(locale));
  const [isLoaded, setIsLoaded] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleDiscoverClick = () => {
    setShowRecommendation(true);
  };

  const handleRecommendationClose = () => {
    setShowRecommendation(false);
  };

  const handleRecommendationComplete = (recommendations: CourseRecommendation[]) => {
    console.log('Recommendations received:', recommendations);
    // Burada öneri sonuçlarını işleyebilirsiniz
    // Örneğin: kullanıcıyı kurs listesi sayfasına yönlendirme
  };

  const TypewriterText = () => {
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
      if (!isLoaded) return;

      const handleTyping = () => {
        const currentPhrase = content.headlines[loopNum % content.headlines.length];
        const shouldDelete = isDeleting;

        setDisplayText(
          shouldDelete
            ? currentPhrase.substring(0, displayText.length - 1)
            : currentPhrase.substring(0, displayText.length + 1)
        );

        setTypingSpeed(isDeleting ? 30 : 50);

        if (!isDeleting && displayText === currentPhrase) {
          setTimeout(() => setIsDeleting(true), 1500);
        } else if (isDeleting && displayText === "") {
          setIsDeleting(false);
          setLoopNum(loopNum + 1);
        }
      };

      const timer = setTimeout(handleTyping, typingSpeed);
      return () => clearTimeout(timer);
    }, [displayText, isDeleting, loopNum, typingSpeed]);

    return (
      <h1 className="text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6 h-24 lg:h-32">
        {displayText}
        <span className="text-neutral-900 dark:text-neutral-100 inline-block animate-pulse ml-1">|</span>
      </h1>
    );
  };

  const ImageRotation = () => {
    const [currentImage, setCurrentImage] = useState(1);

    useEffect(() => {
      if (!isLoaded) return;

      const imageInterval = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage >= 5 ? 1 : prevImage + 1));
      }, 7000);

      return () => clearInterval(imageInterval);
    }, []);

    return (
      <div className="relative h-[280px] sm:h-[320px] md:h-[380px] lg:h-[500px] w-full bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden group">
        {[1, 2, 3, 4, 5].map((imgNum) => (
          <div
            key={imgNum}
            className={`transition-opacity duration-1000 absolute inset-0 ${
              currentImage === imgNum ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={`/tr/images/myuni-egitim-platformu-${imgNum}.webp`}
              alt={`UNILAB Vision ${imgNum}`}
              fill
              className="object-cover transition-transform transform hover:scale-105 duration-300 ease-in-out"
              priority={imgNum === 1}
              sizes="(max-width: 640px) 95vw, (max-width: 768px) 90vw, (max-width: 1024px) 45vw, 50vw"
            />
          </div>
        ))}
        
        {/* Image Overlays - Hidden on mobile for better performance */}
        <div className="hidden sm:block absolute top-4 right-4 bg-white text-neutral-800 p-3 rounded-lg shadow-lg transition-transform transform hover:scale-110 duration-300 ease-in-out z-10 text-sm">
          {content.imageOverlays[0]}
        </div>

        <div className="hidden sm:block absolute bottom-4 left-4 bg-white text-neutral-800 p-3 rounded-lg shadow-lg transition-transform transform hover:scale-110 duration-300 ease-in-out z-10 text-sm">
          {content.imageOverlays[1]}
        </div>

        {/* Primary Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#990000]/70 to-transparent opacity-0 transition-opacity duration-700 ease-in-out ${styles.overlay}`} />
        
        {/* Secondary Overlay for Depth */}
        <div className={`absolute inset-0 bg-[#990000]/10 opacity-0 transition-opacity duration-900 ease-in-out ${styles.secondaryOverlay}`} />
        
        {/* Hover Text - Hidden on mobile for better performance */}
        <div className={`hidden sm:block absolute bottom-8 left-8 max-w-lg ${styles.textContainer}`}>
          <p className={`text-white text-xl font-medium tracking-wide ${styles.textAppear}`}>
            {content.hoverText}
          </p>
          <div className={`w-0 h-0.5 bg-white mt-2 transition-all duration-500 ease-in-out ${styles.underline}`} />
        </div>
      </div>
    );
  };

  const DiscountCode = () => {
    const [showCopied, setShowCopied] = useState(false);

    const handleCopyCode = () => {
      navigator.clipboard.writeText(content.discountCode.code);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    };

    return (
      <div className="mb-8 relative">
        <div 
          onClick={handleCopyCode}
          className="inline-flex items-center gap-2 border-b border-dashed border-neutral-300 dark:border-neutral-600 pb-1 cursor-pointer hover:border-neutral-600 dark:hover:border-neutral-400 transition-colors group"
        >
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{content.discountCode.text}</span>
          <span className="font-medium text-neutral-900 dark:text-neutral-100 tracking-wide">{content.discountCode.code}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Copy Notification */}
        {showCopied && (
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs px-2 py-1 rounded opacity-100 transition-opacity duration-300 pointer-events-none">
            {locale === 'tr' ? 'Kopyalandı' : 'Copied'}
          </div>
        )}
      </div>
    );
  };

  if (!isLoaded) {
    return (
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left order-2 lg:order-1">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-6"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="h-[280px] sm:h-[320px] md:h-[380px] lg:h-[500px] bg-neutral-200 dark:bg-neutral-700 rounded-sm animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative py-8 lg:py-18 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left side - Content */}
            <div className="text-left order-2 lg:order-1">
              {/* Badge */}
              <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
                {content.badge}
              </div>

              {/* Typewriter Headline */}
              <TypewriterText />

              <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6"></div>

              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
                {content.description}
              </p>

              {/* Statistics */}
              <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                {content.stats.map((stat, index) => (
                  <div key={index} className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                    <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</span>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Discount Code */}
              <DiscountCode />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  variant="primary"
                  onClick={handleDiscoverClick}
                  className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-md py-3 px-8 text-md font-medium flex items-center justify-center"
                >
                  {content.cta}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>

                <Link href={content.servicesLink}>
                  <Button
                    variant="secondary"
                    className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-md py-3 px-8 text-md font-medium w-full"
                  >
                    {content.secondaryCta}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Image with Rotation */}
            <div className="order-1 lg:order-2">
              <ImageRotation />
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Education Recommendation Modal */}
      {showRecommendation && (
        <PersonalizedEducationRecommendation
          locale={locale}
          onClose={handleRecommendationClose}
          onRecommendation={handleRecommendationComplete}
        />
      )}
    </>
  );
}