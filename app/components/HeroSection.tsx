'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import PersonalizedEducationRecommendation from './PersonalizedEducationRecommendation';

interface HeroSectionProps {
  locale: string;
  activeCourseCount?: number;
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

const HERO_IMAGES = [1, 2, 3, 4, 5];

function getHeroContent(locale: string) {
  if (locale === 'en') {
    return {
      badge: 'Learning paths built for real goals',
      headlines: [
        'Build the skills your next step actually needs.',
        'Learn with a clear path, not scattered content.',
        'Turn curiosity into progress you can see.',
      ],
      description:
        'Explore courses, mentorships, and guided learning paths created with experienced instructors. Choose a goal and move forward at your own pace.',
      primaryAction: 'Find my learning path',
      secondaryAction: 'Browse courses',
      coursePath: '/en/course',
      imageCaption: 'Learning designed around your pace and direction',
      countLabel: 'active courses and learning paths',
      previousImage: 'Previous image',
      nextImage: 'Next image',
      imageLabel: 'MyUNI learning experience',
    };
  }

  return {
    badge: 'Gerçek hedeflere göre tasarlanan öğrenme yolları',
    headlines: [
      'Bir sonraki adımınız için gerçekten gereken becerileri geliştirin.',
      'Dağınık içerikler yerine net bir öğrenme yolunda ilerleyin.',
      'Merakınızı görünür bir gelişime dönüştürün.',
    ],
    description:
      'Deneyimli eğitmenlerle hazırlanan kursları, mentörlükleri ve planlı öğrenme yollarını keşfedin. Hedefinizi seçin, kendi temponuzda ilerleyin.',
    primaryAction: 'Öğrenme yolumu bul',
    secondaryAction: 'Eğitimleri incele',
    coursePath: '/tr/kurs',
    imageCaption: 'Temponuza ve hedefinize göre şekillenen öğrenme deneyimi',
    countLabel: 'aktif eğitim ve öğrenme yolu',
    previousImage: 'Önceki görsel',
    nextImage: 'Sonraki görsel',
    imageLabel: 'MyUNI öğrenme deneyimi',
  };
}

export default function HeroSection({
  locale,
  activeCourseCount = 0,
}: HeroSectionProps) {
  const [showRecommendation, setShowRecommendation] = useState(false);
  const content = getHeroContent(locale);

  const handleRecommendationComplete = (
    recommendations: CourseRecommendation[]
  ) => {
    console.log('Recommendations received:', recommendations);
  };

  return (
    <>
      <section className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-10 sm:px-6 sm:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-sm font-medium text-[#990000] dark:text-[#e08b94]">
              <span className="h-px w-8 bg-current" aria-hidden="true" />
              <span>{content.badge}</span>
            </div>

            <TypewriterHeadline phrases={content.headlines} />

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg sm:leading-8 dark:text-neutral-300">
              {content.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowRecommendation(true)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#990000] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#780000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4 dark:bg-[#b41f2f] dark:hover:bg-[#c92b3c]"
              >
                {content.primaryAction}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <Link
                href={content.coursePath}
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-950 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4 dark:border-neutral-700 dark:text-white dark:hover:border-neutral-400 dark:hover:bg-neutral-900"
              >
                {content.secondaryAction}
              </Link>
            </div>

            {activeCourseCount > 0 ? (
              <div className="mt-10 flex items-baseline gap-3 border-t border-neutral-200 pt-5 dark:border-neutral-800">
                <span className="text-3xl font-semibold tracking-[-0.04em] text-neutral-950 dark:text-white">
                  {activeCourseCount}
                </span>
                <span className="max-w-48 text-sm leading-5 text-neutral-500 dark:text-neutral-400">
                  {content.countLabel}
                </span>
              </div>
            ) : null}
          </div>

          <RotatingHeroImage content={content} />
        </div>
      </section>

      {showRecommendation ? (
        <PersonalizedEducationRecommendation
          locale={locale}
          onClose={() => setShowRecommendation(false)}
          onRecommendation={handleRecommendationComplete}
        />
      ) : null}
    </>
  );
}

function TypewriterHeadline({ phrases }: { phrases: string[] }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [visibleCharacters, setVisibleCharacters] = useState(phrases[0].length);
  const [isDeleting, setIsDeleting] = useState(false);
  const phrase = phrases[currentPhrase];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let delay = isDeleting ? 30 : 50;
    let updateText = () => {
      setVisibleCharacters((length) => length + (isDeleting ? -1 : 1));
    };

    if (!isDeleting && visibleCharacters === phrase.length) {
      delay = 1600;
      updateText = () => setIsDeleting(true);
    } else if (isDeleting && visibleCharacters === 0) {
      delay = 250;
      updateText = () => {
        setCurrentPhrase((current) => (current + 1) % phrases.length);
        setIsDeleting(false);
      };
    }

    const timer = window.setTimeout(updateText, delay);
    return () => window.clearTimeout(timer);
  }, [isDeleting, phrase.length, phrases.length, visibleCharacters]);

  return (
    <div className="mt-7 min-h-[10.5rem] sm:min-h-[12rem] lg:min-h-[13.5rem]">
      <h1
        className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-neutral-950 sm:text-5xl lg:text-[3.55rem] dark:text-white"
        aria-label={phrase}
      >
        <span aria-hidden="true">{phrase.slice(0, visibleCharacters)}</span>
        <span
          className="ml-1 inline-block font-normal motion-safe:animate-pulse"
          aria-hidden="true"
        >
          |
        </span>
      </h1>
    </div>
  );
}

function RotatingHeroImage({
  content,
}: {
  content: ReturnType<typeof getHeroContent>;
}) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPaused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      setCurrentImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const showPrevious = () => {
    setCurrentImage((current) =>
      current === 0 ? HERO_IMAGES.length - 1 : current - 1
    );
  };

  const showNext = () => {
    setCurrentImage((current) => (current + 1) % HERO_IMAGES.length);
  };

  const handleTouchEnd = (clientX: number) => {
    if (touchStartRef.current === null) return;
    const distance = touchStartRef.current - clientX;
    if (distance > 50) showNext();
    if (distance < -50) showPrevious();
    touchStartRef.current = null;
  };

  return (
    <div
      className="relative aspect-[4/3] min-h-[320px] overflow-hidden rounded-2xl bg-neutral-100 sm:min-h-[420px] lg:aspect-auto lg:h-[570px] dark:bg-neutral-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      onTouchStart={(event) => {
        touchStartRef.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0].clientX)}
      role="region"
      aria-label={content.imageLabel}
    >
      {HERO_IMAGES.map((imageNumber, index) => (
        <Image
          key={imageNumber}
          src={`/tr/images/myuni-egitim-platformu-${imageNumber}.webp`}
          alt={`${content.imageLabel} ${index + 1}`}
          fill
          priority={index === 0}
          unoptimized
          className={`object-cover transition-opacity duration-700 ${
            currentImage === index ? 'opacity-100' : 'opacity-0'
          }`}
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-7">
        <div>
          <p className="max-w-sm text-sm font-medium leading-6 text-white sm:text-base">
            {content.imageCaption}
          </p>
          <div className="mt-4 flex gap-1.5">
            {HERO_IMAGES.map((imageNumber, index) => (
              <button
                key={imageNumber}
                type="button"
                onClick={() => setCurrentImage(index)}
                className={`h-1.5 rounded-full transition-[width,background-color] ${
                  currentImage === index ? 'w-8 bg-white' : 'w-2 bg-white/45'
                }`}
                aria-label={`${content.imageLabel} ${index + 1}`}
                aria-current={currentImage === index ? 'true' : undefined}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={showPrevious}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur transition-colors hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={content.previousImage}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={showNext}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur transition-colors hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={content.nextImage}
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
