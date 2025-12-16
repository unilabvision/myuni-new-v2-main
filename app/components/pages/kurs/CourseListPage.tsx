//app/components/pages/kurs/CourseListPage.tsx
"use client";

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, Users, Calendar, MapPin, Filter, Search, BookOpen } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getAllCourses, mapLevelToLocale } from '../../../../lib/courseService';

// Define a type for the course object to avoid using 'any'
interface Course {
  id: number | string;
  slug: string;
  title: string;
  name: string; // Keep for backward compatibility
  description: string;
  level: string;
  course_type: 'online' | 'live' | 'hybrid';
  featured: boolean;
  image?: string;
  thumbnail_url?: string;
  banner_url?: string;
  price: number;
  originalPrice?: number;
  original_price?: number; // Keep for backward compatibility
  duration?: string; // For online courses
  live_start_date?: string; // For live/hybrid courses
  session_count?: number; // For live/hybrid courses
  is_registration_open: boolean;
  registration_deadline?: string; // For live/hybrid courses
  max_participants?: number; // For live/hybrid courses
  // Early bird pricing fields
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}

// Define a type for the raw course data from the API
interface RawCourse {
  id: number | string;
  slug: string;
  title?: string;
  name?: string;
  description: string;
  level: string;
  course_type?: 'online' | 'live' | 'hybrid';
  featured: boolean;
  image?: string;
  thumbnail_url?: string;
  banner_url?: string;
  price: number;
  originalPrice?: number;
  original_price?: number;
  duration?: string;
  live_start_date?: string;
  session_count?: number;
  is_registration_open: boolean;
  registration_deadline?: string;
  max_participants?: number;
  // Early bird pricing fields
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}

interface CourseListPageProps {
  params: Promise<{
    locale: string;
    courseType: string;
  }>;
}

// Language texts
const texts = {
  tr: {
    badge: "🎓 Öğrenmeye başla!",
    title: "Kariyerinizi ilerletmek için tasarlanmış uzman eğitmenler tarafından hazırlanmış kurslarımızı keşfedin.",
    subtitle: "En güncel teknolojiler ve pratik projelerle desteklenen eğitimlerimizle profesyonel hedeflerinize ulaşın.",
    filters: {
      all: "Tümü",
      beginner: "Başlangıç",
      intermediate: "Orta Seviye", 
      advanced: "İleri Seviye",
      mixed: "Karma"
    },
    courseTypeFilters: {
      all: "Tüm Eğitimler",
      online: "Online Eğitimler",
      live: "Canlı Eğitimler",
      hybrid: "Hibrit Eğitimler"
    },
    loadMore: "Daha Fazla Kurs Yükle",
    viewAll: "Tüm Kursları Görüntüle",
    exploreMore: "Detayları İncele",
    currency: "₺",
    discount: "indirim",
    stats: [
      { value: "150+", label: "Aktif Kurs" },
      { value: "1000+", label: "Kursiyer" },
      { value: "%92", label: "Memnuniyet" }
    ],
    featuredTitle: "Öne Çıkan Kurslar",
    allCoursesTitle: "Tüm Kurslar",
    loading: "Kurslar yükleniyor...",
    error: "Kurslar yüklenemedi",
    noCourses: "Henüz kurs bulunamadı",
    retry: "Tekrar Dene",
    noFilterResults: "Filtreye uygun kurs bulunamadı",
    showAll: "Tümünü Göster",
    tryDifferentFilter: "Farklı bir filtre seçeneğini deneyin veya tüm kursları görüntüleyin.",
    comingSoon: "Öne çıkan kurslar yakında eklenecek",
    registrationDeadline: "Son kayıt:",
    maxParticipants: "Maksimum katılımcı:",
    sessionsInfo: "oturum",
    minutesShort: "dk",
    registrationOpen: "Kayıt Açık",
    registrationClosed: "Kayıt Kapalı",
    daysLeft: "gün kaldı",
    courseTypeLabel: "Eğitim Tipi:",
    levelLabel: "Seviye:",
    activeFilters: "Aktif filtreler:",
    free: "Ücretsiz"
  },
  en: {
    badge: "🎓 Start learning!",
    title: "Discover our courses prepared by expert instructors designed to advance your career.",
    subtitle: "Achieve your professional goals with our training supported by the latest technologies and practical projects.",
    filters: {
      all: "All",
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
      mixed: "Mixed"
    },
    courseTypeFilters: {
      all: "All Courses",
      online: "Online Courses",
      live: "Live Courses",
      hybrid: "Hybrid Courses"
    },
    loadMore: "Load More Courses",
    viewAll: "View All Courses", 
    exploreMore: "Explore Details",
    currency: "₺",
    discount: "off",
    stats: [
      { value: "150+", label: "Active Courses" },
      { value: "1000+", label: "Trainee" },
      { value: "92%", label: "Satisfaction" }
    ],
    featuredTitle: "Featured Courses",
    allCoursesTitle: "All Courses",
    loading: "Loading courses...",
    error: "Failed to load courses",
    noCourses: "No courses found yet",
    retry: "Retry",
    noFilterResults: "No courses found for this filter",
    showAll: "Show All",
    tryDifferentFilter: "Try a different filter option or view all courses.",
    comingSoon: "Featured courses coming soon",
    registrationDeadline: "Registration deadline:",
    maxParticipants: "Max participants:",
    sessionsInfo: "sessions",
    minutesShort: "min",
    registrationOpen: "Registration Open",
    registrationClosed: "Registration Closed",
    daysLeft: "days left",
    courseTypeLabel: "Course Type:",
    levelLabel: "Level:",
    activeFilters: "Active filters:",
    free: "Free"
  }
};

export default function CourseListPage({ params }: CourseListPageProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [ratingMap, setRatingMap] = useState<Record<string, { avg: number; count: number }>>({});
  const [topSellerIds, setTopSellerIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeCourseTypeFilter, setActiveCourseTypeFilter] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const supabase = createClientComponentClient();
  
  const allCoursesRef = useRef<HTMLElement>(null);
  
  const resolvedParams = use(params);
  const { locale, courseType } = resolvedParams;

  const validCourseTypes = {
    tr: 'kurs',
    en: 'course'
  };

  // Ref parametresini yakala
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setRefCode(ref);
        console.log('CourseListPage: Ref parameter found:', ref);
      }
    }
  }, []);

  // Ref parametresini URL'ye ekleyen helper fonksiyon
  const addRefToUrl = (url: string) => {
    if (refCode) {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}ref=${encodeURIComponent(refCode)}`;
    }
    return url;
  };

  if (validCourseTypes[locale as keyof typeof validCourseTypes] !== courseType) {
    notFound();
  }
  
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const getCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // getAllCourses fonksiyonu içinde is_registration_open filtresi eklenmeli
      // courseService.js/ts dosyasında bu filtreyi eklemeniz gerekir
      const coursesData = await getAllCourses(locale);
      
      // Client-side filtering for is_registration_open if not handled in getAllCourses
      const filteredCoursesData = coursesData.filter((course: RawCourse) => 
        course.is_registration_open !== false // Only exclude if explicitly false
      );
      
      const mappedCourses: Course[] = filteredCoursesData.map((course: RawCourse) => {
        const mappedLevel = mapLevelToLocale(course.level, locale);
        const courseName = course.title || course.name || '';
        
        return {
          ...course,
          title: courseName,
          name: courseName,
          level: mappedLevel,
          course_type: course.course_type || 'online'
        };
      });
      
      setCourses(mappedCourses);

      // Fetch ratings for all mapped courses
      const courseIds = mappedCourses.map((c) => String(c.id));
      if (courseIds.length > 0) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 30);
        const [commentsRes, enrollmentsRes] = await Promise.all([
          supabase
            .from('myuni_comments')
            .select('course_id, rating, status')
            .in('course_id', courseIds)
            .eq('status', 'approved'),
          supabase
            .from('myuni_enrollments')
            .select('course_id, enrolled_at')
            .in('course_id', courseIds)
            .eq('is_active', true)
            .gte('enrolled_at', sinceDate.toISOString())
        ]);

        if (!commentsRes.error && Array.isArray(commentsRes.data)) {
          const agg: Record<string, { sum: number; count: number }> = {};
          for (const row of commentsRes.data as Array<{ course_id: string; rating: number | null }>) {
            if (row.rating && row.rating > 0) {
              if (!agg[row.course_id]) agg[row.course_id] = { sum: 0, count: 0 };
              agg[row.course_id].sum += row.rating;
              agg[row.course_id].count += 1;
            }
          }
          const resultMap: Record<string, { avg: number; count: number }> = {};
          Object.entries(agg).forEach(([k, v]) => {
            resultMap[k] = { avg: v.sum / v.count, count: v.count };
          });
          setRatingMap(resultMap);
        }

        // compute top sellers by enrollment count in last 30 days (limit 3)
        if (!enrollmentsRes.error && Array.isArray(enrollmentsRes.data)) {
          const pMap: Record<string, number> = {};
          for (const row of enrollmentsRes.data as Array<{ course_id: string }>) {
            pMap[row.course_id] = (pMap[row.course_id] || 0) + 1;
          }
          const sorted = Object.entries(pMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
          setTopSellerIds(new Set(sorted.map(([id]) => id)));
        }
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    getCourses();
    setIsLoaded(true);
  }, [getCourses]);


  const scrollToAllCourses = () => {
    if (allCoursesRef.current) {
      allCoursesRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const filteredCourses = courses.filter(course => {
    let levelMatch = true;
    if (activeFilter !== 'all') {
      const levelMapping = {
        tr: {
          beginner: 'Başlangıç',
          intermediate: 'Orta Seviye',
          advanced: 'İleri Seviye',
          mixed: 'Karma'
        },
        en: {
          beginner: 'Beginner',
          intermediate: 'Intermediate', 
          advanced: 'Advanced',
          mixed: 'Mixed'
        }
      };
      
      const currentMapping = levelMapping[locale as keyof typeof levelMapping] || levelMapping.tr;
      levelMatch = course.level === currentMapping[activeFilter as keyof typeof currentMapping];
    }

    let courseTypeMatch = true;
    if (activeCourseTypeFilter !== 'all') {
      courseTypeMatch = course.course_type === activeCourseTypeFilter;
    }

    return levelMatch && courseTypeMatch;
  });

  const featuredCourses = courses.filter(course => course.featured);

  useEffect(() => {
    if (featuredCourses.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredCourses.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [featuredCourses.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isRegistrationOpen = (course: Course) => {
    if (course.course_type === 'online') return true;
    if (!course.registration_deadline) return course.is_registration_open;
    const deadline = new Date(course.registration_deadline);
    const now = new Date();
    return course.is_registration_open && now < deadline;
  };

  // Early bird helper functions
  const isEarlyBirdActive = (course: Course) => {
    if (!course.early_bird_price || !course.early_bird_deadline) return false;
    const deadline = new Date(course.early_bird_deadline);
    const now = new Date();
    return now < deadline;
  };

  const getActivePrice = (course: Course) => {
    if (isEarlyBirdActive(course) && course.early_bird_price) {
      return course.early_bird_price;
    }
    return course.price;
  };

  const getDaysUntilStart = (course: Course) => {
    if (!course.live_start_date) return null;
    const startDate = new Date(course.live_start_date);
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  const renderRichText = (htmlContent: string | undefined, isCard: boolean = false) => {
    if (!htmlContent) return null;
    
    const isHtml = htmlContent.includes('<');
    let contentToRender = isHtml ? htmlContent : `<p>${htmlContent}</p>`;
    
    if (isCard) {
      const textOnly = htmlContent.replace(/<[^>]*>/g, '').trim();
      if (textOnly.length > 120) {
        const truncatedText = textOnly.slice(0, 120) + '...';
        contentToRender = `<p>${truncatedText}</p>`;
      }
    }

    return (
      <div 
        className={`rich-text-content ${isCard ? 'card-description' : ''}`}
        dangerouslySetInnerHTML={{ __html: contentToRender }}
      />
    );
  };

  const CourseCard = ({ course, featured = false }: { course: Course, featured?: boolean }) => {
    const daysUntilStart = getDaysUntilStart(course);
    const registrationOpen = isRegistrationOpen(course);

    const renderStars = (avg?: number, count?: number) => {
      if (!avg || avg <= 0) return null;
      return (
        <div className="inline-flex items-center text-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden="true">
            <path d="M12 .587l3.668 7.431 8.204 1.193-5.936 5.787 1.402 8.168L12 18.896l-7.338 3.87 1.402-8.168L.128 9.211l8.204-1.193z"/>
          </svg>
          <span className="ml-1 text-neutral-700 dark:text-neutral-300">{avg.toFixed(1)}</span>
          {typeof count === 'number' && <span className="ml-1 text-neutral-500 dark:text-neutral-400">({count})</span>}
        </div>
      );
    };

    return (
      <Link 
        href={addRefToUrl(`/${locale}/${courseType}/${course.slug}`)}
        className={`bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group ${
          featured ? 'col-span-1' : ''
        }`}
      >
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={course.image || course.thumbnail_url || course.banner_url || '/default-course.jpg'}
            alt={course.name || course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {course.course_type !== 'online' && (
            <div className="absolute top-3 right-3">
              {!registrationOpen ? (
                <div className="bg-neutral-900/80 text-white px-2 py-1 rounded text-xs font-medium">
                  {t.registrationClosed}
                </div>
              ) : daysUntilStart && daysUntilStart <= 7 ? (
                <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {daysUntilStart} {t.daysLeft}
                </div>
              ) : (
                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                  {t.registrationOpen}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <style jsx>{`
            .rich-text-content.card-description p {
              margin: 0;
              line-height: 1.4;
              color: rgb(115 115 115);
              font-size: 0.875rem;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .dark .rich-text-content.card-description p {
              color: rgb(163 163 163);
            }
            .rich-text-content.card-description strong {
              font-weight: 600;
              color: rgb(64 64 64);
            }
            .dark .rich-text-content.card-description strong {
              color: rgb(212 212 212);
            }
            .rich-text-content.card-description em {
              font-style: italic;
              color: rgb(115 115 115);
            }
            .dark .rich-text-content.card-description em {
              color: rgb(163 163 163);
            }
            .rich-text-content.card-description h3,
            .rich-text-content.card-description h4,
            .rich-text-content.card-description h5 {
              display: none;
            }
            .rich-text-content.card-description ul,
            .rich-text-content.card-description ol {
              display: none;
            }
          `}</style>

          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="inline-block bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-lg text-sm">
              {course.level}
            </span>
            {ratingMap[String(course.id)] && renderStars(ratingMap[String(course.id)].avg, ratingMap[String(course.id)].count)}
          </div>

          <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
            {course.name || course.title}
          </h3>
          
          <div className="mb-4 leading-relaxed">
            {renderRichText(course.description, true)}
          </div>

          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <div className="flex items-center space-x-4">
              {course.course_type === 'online' ? (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {course.duration}
                </span>
              ) : (
                <>
                  {course.live_start_date && (
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(course.live_start_date)}
                    </span>
                  )}
                  {course.session_count && (
                    <span className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {course.session_count} {t.sessionsInfo}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>


          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {isEarlyBirdActive(course) ? (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    {t.currency}{getActivePrice(course)}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      Erken kayıt fiyatı
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {course.price === 0 ? t.free : `${t.currency}${course.price}`}
                </span>
              )}
              {(course.originalPrice || course.original_price) && (
                <span className="text-lg text-neutral-400 line-through">
                  {t.currency}{course.originalPrice || course.original_price}
                </span>
              )}
            </div>
          </div>

          {/* Best Seller Badge */}
          {topSellerIds.has(String(course.id)) && (
            <div className="mt-3">
              <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-md text-sm font-medium">
                Son dönemde en çok satan
              </span>
            </div>
          )}
        </div>
      </Link>
    );
  };

  if (loading || !isLoaded) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
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
              <div className="h-[400px] lg:h-[500px] bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.error}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              {error}
            </p>
            <button
              onClick={getCourses}
              className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-neutral-400 text-xl">📚</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.noCourses}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Yakında yeni kurslar eklenecek.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl px-6 sm:px-6 md:px-6 lg:px-6 xl:px-6 2xl:px-6 container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="text-left order-2 lg:order-1">
              <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
                {t.badge}
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
                {t.title}
              </h1>

              <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6"></div>

              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
                {t.subtitle}
              </p>

              <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {courses.length}+
                  </span>
                  <span>Aktif Kurs</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    1000+
                  </span>
                  <span>Kursiyer</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    %92
                  </span>
                  <span>Memnuniyet</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToAllCourses}
                  className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-md py-3 px-8 text-md font-medium flex items-center justify-center transition-colors"
                >
                  {t.viewAll}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right side - Featured Courses Slider */}
            <div className="order-1 lg:order-2">
              {featuredCourses.length > 0 ? (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg">
                  <div className="p-6 lg:p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                      <h3 className="text-lg lg:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.featuredTitle}
                      </h3>
                      {featuredCourses.length > 1 && (
                        <div className="flex space-x-2">
                          {featuredCourses.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide
                                  ? 'bg-[#990000] w-6'
                                  : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 relative overflow-hidden min-h-0">
                      <div 
                        className="flex transition-transform duration-500 ease-out h-full"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {featuredCourses.map((course) => (
                          <div key={course.id} className="w-full flex-shrink-0 h-full">
                            <Link 
                              href={addRefToUrl(`/${locale}/${courseType}/${course.slug}`)}
                              className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 block cursor-pointer group"
                            >
                              <div className="relative h-32 lg:h-48 overflow-hidden flex-shrink-0">
                                <Image
                                  src={course.image || course.thumbnail_url || course.banner_url || '/default-course.jpg'}
                                  alt={course.name || course.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              </div>
                              
                              <div className="p-4 lg:p-6 flex-1 flex flex-col min-h-0">
                                <div className="mb-2 lg:mb-3 flex-shrink-0">
                                  <span className="inline-block bg-neutral-100 dark:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-2 py-1 lg:px-3 lg:py-1 rounded-lg text-xs lg:text-sm font-medium">
                                    {course.level}
                                  </span>
                                </div>
                                
                                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base lg:text-lg mb-2 lg:mb-3 leading-tight group-hover:text-[#990000] transition-colors flex-shrink-0">
                                  {course.name || course.title}
                                </h4>
                                
                                <div className="text-xs lg:text-sm mb-3 lg:mb-4 flex-1 leading-relaxed line-clamp-2 lg:line-clamp-3 overflow-hidden">
                                  {renderRichText(course.description, true)}
                                </div>
                                
                                <div className="flex items-center justify-between text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mb-3 lg:mb-4 flex-shrink-0">
                                  <div className="flex items-center space-x-2 lg:space-x-4">
                                    {course.course_type === 'online' ? (
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                        <span className="text-xs lg:text-sm">{course.duration}</span>
                                      </span>
                                    ) : (
                                      <>
                                        {course.live_start_date && (
                                          <span className="flex items-center">
                                            <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                            <span className="text-xs lg:text-sm">{formatDate(course.live_start_date)}</span>
                                          </span>
                                        )}
                                        {course.session_count && (
                                          <span className="flex items-center">
                                            <Users className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                            <span className="text-xs lg:text-sm">{course.session_count} {t.sessionsInfo}</span>
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center justify-between flex-shrink-0 mt-auto">
                                  <div className="flex items-baseline gap-1 lg:gap-2">
                                    {isEarlyBirdActive(course) ? (
                                      <div className="flex flex-col">
                                        <span className="text-lg lg:text-xl font-bold text-amber-600 dark:text-amber-500">
                                          {t.currency}{getActivePrice(course)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                                          <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                                            Erken kayıt
                                          </span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-lg lg:text-xl font-bold text-neutral-900 dark:text-neutral-100">
                                        {course.price === 0 ? t.free : `${t.currency}${course.price}`}
                                      </span>
                                    )}
                                    {(course.originalPrice || course.original_price) && (
                                      <span className="text-xs lg:text-sm text-neutral-400 line-through">
                                        {t.currency}{course.originalPrice || course.original_price}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {t.featuredTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t.comingSoon}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All Courses Section */}
      <section ref={allCoursesRef} className="py-16 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl px-6 sm:px-6 md:px-6 lg:px-6 xl:px-6 2xl:px-6 mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.allCoursesTitle} ({filteredCourses.length})
              </h2>
              
              {(activeFilter !== 'all' || activeCourseTypeFilter !== 'all') && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t.activeFilters}</span>
                  {activeFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.filters[activeFilter as keyof typeof t.filters]}
                    </span>
                  )}
                  {activeCourseTypeFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.courseTypeFilters[activeCourseTypeFilter as keyof typeof t.courseTypeFilters]}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="w-16 h-px bg-[#990000] mb-8"></div>

            {/* Filters Section */}
            {(() => {
              const availableCourseTypes = [...new Set(courses.map(course => course.course_type))];
              const availableTypeFilters = Object.entries(t.courseTypeFilters).filter(([key]) => 
                key === 'all' || availableCourseTypes.includes(key as 'online' | 'live' | 'hybrid')
              );
              
              const availableLevels = [...new Set(courses.map(course => course.level))];
              const levelMapping = {
                tr: {
                  beginner: 'Başlangıç',
                  intermediate: 'Orta Seviye',
                  advanced: 'İleri Seviye',
                  mixed: 'Karma'
                },
                en: {
                  beginner: 'Beginner',
                  intermediate: 'Intermediate', 
                  advanced: 'Advanced',
                  mixed: 'Mixed'
                }
              };
              
              const currentMapping = levelMapping[locale as keyof typeof levelMapping] || levelMapping.tr;
              const availableLevelFilters = Object.entries(t.filters).filter(([key]) => 
                key === 'all' || availableLevels.includes(currentMapping[key as keyof typeof currentMapping])
              );
              
              const showCourseTypeFilter = availableTypeFilters.length > 2;
              const showLevelFilter = availableLevelFilters.length > 2;
              
              // Don't show filters section if no filters are needed
              if (!showCourseTypeFilter && !showLevelFilter) {
                return null;
              }
              
              return (
                <div className="mb-8">
                  <div className={`grid grid-cols-1 ${showCourseTypeFilter && showLevelFilter ? 'md:grid-cols-2' : ''} gap-6`}>
                    {/* Course Type Filter */}
                    {showCourseTypeFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Filter className="w-4 h-4 mr-2 text-neutral-600 dark:text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.courseTypeLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableTypeFilters.map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActiveCourseTypeFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activeCourseTypeFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Level Filter */}
                    {showLevelFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.levelLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableLevelFilters.map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActiveFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activeFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.noFilterResults}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t.tryDifferentFilter}
              </p>
              <button
                onClick={() => {
                  setActiveFilter('all');
                  setActiveCourseTypeFilter('all');
                }}
                className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                {t.showAll}
              </button>
            </div>
          )}

          {filteredCourses.length > 0 && filteredCourses.length >= 9 && (
            <div className="text-center mt-12">
              <button 
                onClick={getCourses}
                className="px-8 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-300 dark:border-neutral-700"
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}