'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ChevronDown } from 'lucide-react';
import { UnilabBlogPost } from '@/app/services/unilabBlogService';

// Slide content type definition - now derived from blog posts
interface SlideContent {
  id: string;
  title: string;
  subtitle: string | null;
  description: string;
  button_text: string;
  button_link: string;
  secondary_button_text: string | null;
  secondary_button_link: string | null;
  image_url: string;
  category: string;
  date: string;
}

const TRANSITION_DURATION = 800;
const AUTOPLAY_INTERVAL = 5000;

interface HeroSliderProps {
  locale: string;
}

const HeroSlider: React.FC<HeroSliderProps> = ({ locale = 'tr' }) => {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [autoplayActive, setAutoplayActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Convert blog post to slide content
  const convertBlogPostToSlide = useCallback((post: UnilabBlogPost): SlideContent => {
    const baseUrl = `/${locale}/blog`;
    
    // Extract first sentence from excerpt
    const getFirstSentence = (text: string): string => {
      const sentences = text.split(/[.!?]+/);
      return sentences[0] + (sentences[0] ? '.' : '');
    };
    
    return {
      id: post.id,
      title: post.title,
      subtitle: post.category,
      description: getFirstSentence(post.excerpt),
      button_text: locale === 'tr' ? 'Daha Fazla' : 'Read More',
      button_link: `${baseUrl}/${post.slug}`,
      secondary_button_text: locale === 'tr' ? 'Tüm Haberlerimiz' : 'All Blog',
      secondary_button_link: `${baseUrl}`,
      image_url: post.image,
      category: post.category,
      date: post.date
    };
  }, [locale]);

  // Fetch slides from Supabase
  const fetchSlides = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get latest 5 blog posts
      const { getUnilabBlogPosts } = await import('@/app/services/unilabBlogService');
      const allPosts = await getUnilabBlogPosts(locale);
      
      if (allPosts && allPosts.length > 0) {
        // Take latest 5 posts as slides
        const slideData = allPosts.slice(0, 5).map(convertBlogPostToSlide);
        setSlides(slideData);
      } else {
        // Ultimate fallback: Default slides
        setSlides(getDefaultSlides(locale));
      }
    } catch (error) {
      console.error('Error fetching slides from Supabase:', error);
      setError('Failed to load content');
      // Use default slides as fallback
      setSlides(getDefaultSlides(locale));
    } finally {
      // Simulate loading time for smooth UX
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => {
          setIsVisible(true);
        }, 100);
      }, 1500);
    }
  }, [locale, convertBlogPostToSlide]);

  // Default slides as fallback
  const getDefaultSlides = (locale: string): SlideContent[] => {
    const baseSlides = [
      {
        id: 'default-1',
        title: locale === 'tr' ? 'UNILAB Vision' : 'UNILAB Vision',
        subtitle: locale === 'tr' ? 'Geleceği Şekillendir' : 'Shape the Future',
        description: locale === 'tr' 
          ? 'Sürdürülebilirlik adımları atmaya devam ediyoruz.'
          : 'Leading digital transformation with innovative software solutions.',
        button_text: locale === 'tr' ? 'Keşfet' : 'Explore',
        button_link: `/${locale}/blog`,
        secondary_button_text: locale === 'tr' ? 'Demo' : 'Demo',
        secondary_button_link: '/demo',
        image_url: '/tr/images/unilab-vision-hero-3.webp',
        category: locale === 'tr' ? 'İnovasyon' : 'Innovation',
        date: new Date().toISOString().split('T')[0]
      },
      {
        id: 'default-2',
        title: locale === 'tr' ? 'Dijital İnovasyon' : 'Digital Innovation',
        subtitle: locale === 'tr' ? 'UNILAB ile Gerçekleşiyor' : 'Realized with UNILAB',
        description: locale === 'tr' 
          ? 'Gelecek trendlerini yakalayarak inovasyonun öncüsü olmayı hedefliyoruz.'
          : 'Optimize your business processes with modern technologies.',
        button_text: locale === 'tr' ? 'Projeler' : 'Projects',
        button_link: '/projects',
        secondary_button_text: locale === 'tr' ? 'Nasıl Çalışırız' : 'How We Work',
        secondary_button_link: '/methodology',
        image_url: '/tr/images/unilab-vision-hero-2.webp',
        category: locale === 'tr' ? 'Teknoloji' : 'Technology',
        date: new Date().toISOString().split('T')[0]
      }
    ];
    
    return baseSlides;
  };

  // Fetch slides on component mount and locale change
  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // Set constrained height
  useEffect(() => {
    const setConstrainedHeight = () => {
      if (sliderRef.current) {
        sliderRef.current.style.height = '80vh';
        sliderRef.current.style.maxHeight = '600px';
      }
    };

    if (!isLoading) {
      setConstrainedHeight();
      window.addEventListener('resize', setConstrainedHeight);
      return () => window.removeEventListener('resize', setConstrainedHeight);
    }
  }, [isLoading]);

  // Progress bar animation
  useEffect(() => {
    if (!progressRef.current || !autoplayActive || isLoading || slides.length === 0) return;

    progressRef.current.style.transition = 'none';
    progressRef.current.style.width = '0%';
    void progressRef.current.offsetWidth; // Trigger reflow
    progressRef.current.style.transition = `width ${AUTOPLAY_INTERVAL}ms linear`;
    progressRef.current.style.width = '100%';
  }, [activeIndex, autoplayActive, isLoading, slides.length]);

  // Transition to next slide
  const handleTransition = useCallback(
    (index: number) => {
      if (isTransitioning || index === activeIndex || !slides.length || isLoading) return;

      setIsTransitioning(true);
      setActiveIndex(index);

      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);

      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION);

      if (progressRef.current && autoplayActive) {
        progressRef.current.style.transition = 'none';
        progressRef.current.style.width = '0%';
        void progressRef.current.offsetWidth;
        progressRef.current.style.transition = `width ${AUTOPLAY_INTERVAL}ms linear`;
        progressRef.current.style.width = '100%';
      }

      if (autoplayActive) {
        autoplayTimerRef.current = setTimeout(() => {
          const nextIndex = index === slides.length - 1 ? 0 : index + 1;
          handleTransition(nextIndex);
        }, AUTOPLAY_INTERVAL);
      }
    },
    [isTransitioning, activeIndex, slides.length, autoplayActive, isLoading]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!slides.length || isLoading) return;
    const nextIndex = activeIndex === slides.length - 1 ? 0 : activeIndex + 1;
    handleTransition(nextIndex);
  }, [activeIndex, slides.length, handleTransition, isLoading]);

  const handlePrev = useCallback(() => {
    if (!slides.length || isLoading) return;
    const prevIndex = activeIndex === 0 ? slides.length - 1 : activeIndex - 1;
    handleTransition(prevIndex);
  }, [activeIndex, slides.length, handleTransition, isLoading]);

  // Autoplay
  useEffect(() => {
    if (!slides.length || !autoplayActive || isLoading) {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
      return;
    }

    autoplayTimerRef.current = setTimeout(handleNext, AUTOPLAY_INTERVAL);

    return () => {
      if (autoplayTimerRef.current) clearTimeout(autoplayTimerRef.current);
    };
  }, [handleNext, slides.length, autoplayActive, isLoading]);

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    if (isLoading) return;
    setAutoplayActive((prev) => !prev);
  }, [isLoading]);

  // Touch navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isLoading) return;
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (isLoading) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!slides.length || isLoading) return;
    if (touchStart - touchEnd > 75) handleNext();
    if (touchStart - touchEnd < -75) handlePrev();
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggleAutoplay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, toggleAutoplay, isLoading]);

  // Scroll down handler
  const handleScrollDown = () => {
    if (isLoading) return;
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  // Format date for display (removed as no longer needed)
  // const formatDate = (dateString: string) => {
  //   try {
  //     const date = new Date(dateString);
  //     return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
  //       year: 'numeric',
  //       month: 'long',
  //       day: 'numeric'
  //     });
  //   } catch {
  //     return dateString;
  //   }
  // };

  // Loading Screen Component
  const LoadingScreen = () => (
    <div 
      className="relative w-full bg-neutral-950 flex items-center justify-center"
      style={{ height: '80vh', maxHeight: '600px' }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900" />
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
        {/* UNILAB Vision logo/text */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-light text-neutral-100 mb-2 animate-pulse-slow">
            UNILAB Vision
          </h1>
          <p className="text-sm uppercase tracking-widest text-neutral-400">
            {locale === 'tr' ? 'Geleceği Şekillendir' : 'Shape the Future'}
          </p>
        </div>

        {/* Loading spinner */}
        <div className="relative">
          <div className="w-12 h-12 border-2 border-neutral-700 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-12 h-12 border-2 border-transparent border-t-neutral-100 rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-sm text-neutral-400 animate-pulse">
          {locale === 'tr' ? 'İçerik yükleniyor...' : 'Loading content...'}
        </p>
      </div>

      {/* Subtle animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-neutral-800/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-neutral-700/20 rounded-full blur-xl animate-float-delayed"></div>
    </div>
  );

  // Error Screen Component
  const ErrorScreen = () => (
    <div 
      className="relative w-full bg-neutral-950 flex items-center justify-center"
      style={{ height: '80vh', maxHeight: '600px' }}
    >
      <div className="text-center text-neutral-400">
        <p className="mb-4">{locale === 'tr' ? 'İçerik yüklenirken hata oluştu' : 'Error loading content'}</p>
        <button 
          onClick={fetchSlides}
          className="px-4 py-2 bg-neutral-800 text-neutral-100 rounded hover:bg-neutral-700 transition-colors"
        >
          {locale === 'tr' ? 'Tekrar Dene' : 'Try Again'}
        </button>
      </div>
    </div>
  );

  // Show loading screen while loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show error screen if error and no slides
  if (error && !slides.length) {
    return <ErrorScreen />;
  }

  // Show fallback if no slides
  if (!slides.length) {
    return (
      <div
        ref={sliderRef}
        className="relative w-full overflow-hidden bg-neutral-950 flex items-center justify-center"
        style={{ height: '80vh', maxHeight: '600px' }}
      >
        <p className="text-neutral-400">
          {locale === 'tr' ? 'İçerik bulunamadı' : 'No content found'}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={sliderRef}
      className={`relative w-full overflow-hidden bg-neutral-950 transition-opacity duration-1000 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ height: '80vh', maxHeight: '600px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label={locale === 'tr' ? 'Ana Slayt Gösterisi' : 'Main Slideshow'}
    >
      {/* Slider container */}
      <div className="relative w-full h-full">
        {slides.map((slide, index) => (
          <div
            key={`slide-${slide.id}`}
            className={`absolute inset-0 w-full h-full transition-opacity duration-${TRANSITION_DURATION} ease-in-out ${
              index === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            aria-hidden={index !== activeIndex}
            role="group"
            aria-label={`${locale === 'tr' ? 'Slayt' : 'Slide'} ${index + 1}`}
          >
            {/* Image */}
            <Image
              src={slide.image_url}
              alt={slide.title}
              fill
              priority={index === 0}
              loading={index === 0 ? 'eager' : 'lazy'}
              className="object-cover brightness-75 w-full h-full"
              unoptimized
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-950/50 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center p-6 md:p-8 lg:p-8 max-w-7xl mx-auto">
              <div className="max-w-md">
                {/* Category */}
                {slide.subtitle && (
                  <p className="text-xs uppercase tracking-widest font-medium text-neutral-300 mb-2 animate-slide-in">
                    {slide.subtitle}
                  </p>
                )}

                {/* Title */}
                <h2 className="text-2xl md:text-4xl font-light text-neutral-100 mb-3 leading-tight animate-slide-in delay-100">
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="text-sm md:text-base text-neutral-200 mb-5 leading-relaxed animate-slide-in delay-200">
                  {slide.description}
                </p>

                {/* Buttons */}
                <div className="flex gap-3 animate-slide-in delay-300">
                  <a
                    href={slide.button_link}
                    className="group inline-flex items-center bg-transparent border border-neutral-100 text-neutral-100 py-1.5 px-5 text-sm font-medium hover:bg-neutral-100 hover:text-neutral-900 transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950"
                  >
                    {slide.button_text}
                    <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </a>
                  {slide.secondary_button_text && slide.secondary_button_link && (
                    <a
                      href={slide.secondary_button_link}
                      className="inline-flex items-center bg-transparent border border-neutral-400 text-neutral-400 py-1.5 px-5 text-sm font-medium hover:border-neutral-100 hover:text-neutral-100 transition-all duration-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950"
                    >
                      {slide.secondary_button_text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation controls */}
        <div className="absolute bottom-4 left-6 md:left-8 flex items-center gap-3 z-20 max-w-7xl mx-auto">
          <button
            onClick={handlePrev}
            className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950"
            aria-label={locale === 'tr' ? 'Önceki slayt' : 'Previous slide'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950"
            aria-label={locale === 'tr' ? 'Sonraki slayt' : 'Next slide'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Slide indicator */}
        <div className="absolute bottom-4 right-6 md:right-8 text-neutral-300 text-xs z-20 max-w-7xl mx-auto">
          <span className="font-medium">{activeIndex + 1}</span>
          <span className="mx-1">/</span>
          <span>{slides.length}</span>
        </div>

        {/* Navigation dots */}
        <div className="absolute top-4 right-6 flex gap-1 z-20 max-w-7xl mx-auto">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              onClick={() => handleTransition(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950 ${
                index === activeIndex ? 'bg-neutral-100 w-5' : 'bg-neutral-500 hover:bg-neutral-400'
              }`}
              aria-label={`${locale === 'tr' ? 'Slayt' : 'Slide'} ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : 'false'}
            />
          ))}
        </div>

        {/* Autoplay toggle */}
        <button
          onClick={toggleAutoplay}
          className="absolute top-4 left-4 md:left-8 flex items-center gap-1 text-xs uppercase tracking-wide text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/50 rounded-full px-2 py-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950 z-20 max-w-7xl mx-auto"
        >
          {autoplayActive ? (
            <>
              <Pause className="w-3 h-3" />
              {locale === 'tr' ? 'Durdur' : 'Pause'}
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              {locale === 'tr' ? 'Oynat' : 'Play'}
            </>
          )}
        </button>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neutral-900/20">
          <div
            ref={progressRef}
            className="h-full bg-neutral-100/80 transition-all duration-[5000ms] ease-linear"
            style={{ width: '0%' }}
          />
        </div>

        {/* Scroll down button */}
        <button
          onClick={handleScrollDown}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-1 text-neutral-300 hover:text-neutral-100 text-xs uppercase tracking-wide transition-colors duration-300 animate-bounce focus:outline-none focus:ring-2 focus:ring-neutral-100 focus:ring-offset-2 focus:ring-offset-neutral-950 z-20"
          aria-label={locale === 'tr' ? 'Aşağı kaydır' : 'Scroll down'}
        >
          <ChevronDown className="w-5 h-5" />
          {locale === 'tr' ? 'Aşağı İnin' : 'Scroll Down'}
        </button>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.8s ease-out forwards;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .animate-bounce {
          animation: bounce 2s infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 3s;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-15px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translate(-50%, 0);
          }
          50% {
            transform: translate(-50%, -8px);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;