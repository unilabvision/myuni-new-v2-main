"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, Clock, AlertCircle, GraduationCap, BookOpen, Target, Award, Star } from 'lucide-react';
import { getCourseBySlug, mapLevelToLocale } from '../../../../../lib/courseService';
import CourseHeroSection from './components/CourseHeroSection';
import CourseMainContent from './components/CourseMainContent';
import CourseSidebar from './components/CourseSidebar';
import CourseSections from './components/CourseSections';
import CourseFeatures from './components/CourseFeatures';
import CourseCertificate from './components/CourseCertificate';
import CourseFAQ from './components/CourseFAQ';
import CourseTestimonials from './components/CourseTestimonials';
import CourseLoadingSkeleton from './components/CourseLoadingSkeleton';
import CourseErrorState from './components/CourseErrorState';
import { texts } from './data/courseTexts';

// Unified interfaces that match what components expect
interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  order_index: number;
  isCompleted: boolean; // Make required to match component expectations
  isLocked: boolean; // Make required to match component expectations
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  order_index: number;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  level: string;
  slug: string;
  price: number;
  original_price?: number;
  early_bird_price?: number;
  early_bird_deadline?: string;
  course_type: 'online' | 'live' | 'hybrid';
  sections?: Section[];
  live_start_date?: string;
  live_end_date?: string;
  registration_deadline?: string;
  is_registration_open?: boolean;
  session_count?: number;
  session_duration_minutes?: number;
  max_participants?: number;
  learning_outcomes?: string[];
  banner_url?: string;
  thumbnail_url?: string;
  /** Shopier link ile satış: ürün ID (webhook eşleşmesi) */
  shopier_product_id?: string | null;
  /** Shopier satın alma sayfası URL (Shopier'da satın al butonu) */
  shopier_product_url?: string | null;
  [key: string]: unknown;
}

// Define the type for CourseErrorState texts
interface CourseErrorStateTexts {
  courseNotFound: string;
  courseNotFoundDesc: string;
  backToCourses: string;
  [key: string]: string;
}

// Define specific component text interfaces to avoid conflicts
interface ComponentTexts {
  [key: string]: string; // Remove undefined to match component expectations
}

// Define the structure of the texts object to avoid using 'any'
interface TextsObject {
  courseNotFound: string;
  courseNotFoundDesc: string;
  backToCourses: string;
  [key: string]: string | number | boolean | object | undefined;
}

// Define API response types to handle the transformation
interface APILesson {
  id: unknown;
  title: unknown;
  name?: unknown;
  duration: unknown;
  type?: unknown;
  order_index?: unknown;
  order?: unknown;
  isCompleted?: unknown;
  isLocked?: unknown;
  [key: string]: unknown;
}

interface APISection {
  id: unknown;
  title: unknown;
  name?: unknown;
  lessons?: APILesson[];
  order_index?: unknown;
  order?: unknown;
  [key: string]: unknown;
}

interface APICourseResponse {
  id: unknown;
  slug: unknown;
  name: unknown;
  title: unknown;
  description: unknown;
  price: unknown;
  originalPrice: unknown;
  original_price: unknown;
  early_bird_price?: unknown;
  early_bird_deadline?: unknown;
  duration: unknown;
  level: unknown;
  students: unknown;
  rating: unknown;
  instructor: unknown;
  instructor_name: unknown;
  course_type?: unknown;
  sections?: APISection[];
  live_start_date?: unknown;
  live_end_date?: unknown;
  registration_deadline?: unknown;
  is_registration_open?: unknown;
  session_count?: unknown;
  session_duration_minutes?: unknown;
  max_participants?: unknown;
  learning_outcomes?: unknown[];
  banner_url?: unknown;
  thumbnail_url?: unknown;
  shopier_product_id?: unknown;
  shopier_product_url?: unknown;
  [key: string]: unknown;
}

// Course Type Indicator Component
const CourseTypeIndicator = ({ courseType, size = 'md' }: {
  courseType: 'online' | 'live' | 'hybrid';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const getTypeConfig = () => {
    switch (courseType) {
      case 'live':
        return {
          label: 'Canlı Eğitim',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-700'
        };
      case 'hybrid':
        return {
          label: 'Hibrit Eğitim',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          textColor: 'text-purple-700 dark:text-purple-300',
          borderColor: 'border-purple-200 dark:border-purple-700'
        };
      case 'online':
      default:
        return {
          label: 'Online Eğitim',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
    }
  };

  const config = getTypeConfig();
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`
      inline-flex items-center rounded-full border font-medium w-fit
      ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}
    `}>
      <span>{config.label}</span>
    </div>
  );
};

interface CourseDetailPageProps {
  params: Promise<{
    slug: string;
    locale: string;
    courseType: string;
  }>;
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  const [courseDetail, setCourseDetails] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);
  
  const resolvedParams = use(params);
  const { locale, courseType, slug } = resolvedParams;

  // Geçerli courseType kontrolü
  const validCourseTypes = {
    tr: 'kurs',
    en: 'course'
  };

  // Eğer courseType geçerli değilse 404 göster
  if (validCourseTypes[locale as keyof typeof validCourseTypes] !== courseType) {
    notFound();
  }
  
  // Dil metinlerini al
  const t = texts[locale as keyof typeof texts] || texts.tr;

  useEffect(() => {
    if (slug) {
      getCourse(slug, locale);
    }
    
    // Get discount code from URL hash if present
    if (typeof window !== 'undefined') {
      console.log('Checking for affiliate code in URL hash...');
      const hashValue = window.location.hash;
      console.log('Current URL hash:', hashValue);
      
      if (hashValue && hashValue.length > 1) {
        // Remove the # character and store the discount code
        const discountCode = hashValue.substring(1);
        console.log('Extracted discount code:', discountCode);
        
        if (discountCode) {
          // Store the discount code in localStorage for use in checkout
          localStorage.setItem('myuni_affiliate_code', discountCode);
          console.log('Affiliate discount code stored in localStorage:', discountCode);
          
          // Verify the code was stored correctly
          const storedCode = localStorage.getItem('myuni_affiliate_code');
          console.log('Verified code in localStorage:', storedCode);
        }
      } else {
        console.log('No hash found in URL or hash is empty');
      }
    }
  }, [slug, locale]);

  // Fetch average rating when course is loaded
  useEffect(() => {
    const fetchAverageRating = async () => {
      if (!courseDetail?.id) return;
      
      try {
        setRatingLoading(true);
        const response = await fetch(`/api/course-comments?courseId=${courseDetail.id}&action=rating`);
        if (response.ok) {
          const data = await response.json();
          setAverageRating(data.averageRating);
          setTotalRatings(data.totalRatings);
        }
      } catch (error) {
        console.error('Error fetching average rating:', error);
      } finally {
        setRatingLoading(false);
      }
    };

    fetchAverageRating();
  }, [courseDetail?.id]);

  const getCourse = async (courseSlug: string, courseLocale: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData: APICourseResponse | null = await getCourseBySlug(courseSlug, courseLocale);
      
      console.log('🔍 COURSE DETAIL PAGE - Raw API Response:', courseData);
      console.log('🔍 COURSE DETAIL PAGE - Early bird price from API:', courseData?.early_bird_price);
      console.log('🔍 COURSE DETAIL PAGE - Early bird deadline from API:', courseData?.early_bird_deadline);
      
      if (!courseData) {
        setError('Course not found');
        return;
      }

      // Transform API response to our internal format with proper type conversion
      const mappedCourse: Course = {
        id: String(courseData.id || ''),
        title: String(courseData.title || courseData.name || ''),
        description: String(courseData.description || ''),
        level: mapLevelToLocale(String(courseData.level || ''), courseLocale),
        slug: String(courseData.slug || courseSlug),
        price: Number(courseData.price || 0),
        original_price: Number(courseData.original_price || courseData.originalPrice || undefined),
        early_bird_price: courseData.early_bird_price ? Number(courseData.early_bird_price) : undefined,
        early_bird_deadline: courseData.early_bird_deadline ? String(courseData.early_bird_deadline) : undefined,
        course_type: (courseData.course_type as 'online' | 'live' | 'hybrid') || 'online',
        live_start_date: courseData.live_start_date ? String(courseData.live_start_date) : undefined,
        live_end_date: courseData.live_end_date ? String(courseData.live_end_date) : undefined,
        registration_deadline: courseData.registration_deadline ? String(courseData.registration_deadline) : undefined,
        is_registration_open: Boolean(courseData.is_registration_open),
        session_count: courseData.session_count ? Number(courseData.session_count) : undefined,
        session_duration_minutes: courseData.session_duration_minutes ? Number(courseData.session_duration_minutes) : undefined,
        max_participants: courseData.max_participants ? Number(courseData.max_participants) : undefined,
        learning_outcomes: Array.isArray(courseData.learning_outcomes) 
          ? courseData.learning_outcomes.map(outcome => String(outcome))
          : undefined,
        banner_url: courseData.banner_url ? String(courseData.banner_url) : undefined,
        thumbnail_url: courseData.thumbnail_url ? String(courseData.thumbnail_url) : undefined,
        shopier_product_id: courseData.shopier_product_id ? String(courseData.shopier_product_id) : undefined,
        shopier_product_url: courseData.shopier_product_url ? String(courseData.shopier_product_url) : undefined,
        // Transform sections with proper defaults for required fields
        sections: courseData.sections?.map((section: APISection, index: number) => ({
          id: String(section.id || ''),
          title: String(section.title || section.name || ''),
          order_index: Number(section.order_index ?? section.order ?? index),
          lessons: section.lessons?.map((lesson: APILesson, lessonIndex: number) => ({
            id: String(lesson.id || ''),
            title: String(lesson.title || lesson.name || ''),
            duration: String(lesson.duration || '0'),
            type: (lesson.type as 'video' | 'text' | 'quiz' | 'assignment') || 'video',
            order_index: Number(lesson.order_index ?? lesson.order ?? lessonIndex),
            isCompleted: Boolean(lesson.isCompleted || false), // Default to false
            isLocked: Boolean(lesson.isLocked || false), // Default to false
          })) || []
        })) || []
      };

      console.log('🔍 COURSE DETAIL PAGE - Mapped Course:', mappedCourse);
      console.log('🔍 COURSE DETAIL PAGE - Mapped early_bird_price:', mappedCourse.early_bird_price);
      console.log('🔍 COURSE DETAIL PAGE - Mapped early_bird_deadline:', mappedCourse.early_bird_deadline);

      setCourseDetails(mappedCourse);

    } catch (error) {
      console.error("Kurs detayları alınırken hata:", error);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  // Total lessons hesaplama
  const totalLessons = courseDetail?.sections?.reduce((total: number, section: Section) => {
    return total + (section.lessons?.length || 0);
  }, 0) || 0;

  // Tarih formatlama fonksiyonları
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Check URL hash for affiliate code on client-side render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Client-side render detected, checking hash again...');
      const hashValue = window.location.hash;
      console.log('Current URL hash on client-side render:', hashValue);
      
      if (hashValue && hashValue.length > 1) {
        const discountCode = hashValue.substring(1);
        console.log('Extracted discount code on client-side render:', discountCode);
        
        if (discountCode) {
          localStorage.setItem('myuni_affiliate_code', discountCode);
          console.log('Affiliate code stored on client-side render:', discountCode);
        }
      }
    }
  }, []);

  const isRegistrationOpen = () => {
    if (courseDetail?.course_type === 'online') return true;
    if (!courseDetail?.registration_deadline) return courseDetail?.is_registration_open;
    const deadline = new Date(courseDetail.registration_deadline);
    const now = new Date();
    return courseDetail.is_registration_open && now < deadline;
  };

  const getDaysUntilStart = () => {
    if (!courseDetail?.live_start_date) return null;
    const startDate = new Date(courseDetail.live_start_date);
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : null;
  };

  // Convert texts to ComponentTexts format
  const componentTexts: ComponentTexts = Object.keys(t).reduce((acc, key) => {
    const textsObj = t as TextsObject;
    const value = textsObj[key];
    // Convert any value to string, handling nested objects by stringifying them
    acc[key] = typeof value === 'string' ? value : 
               typeof value === 'object' ? JSON.stringify(value) : 
               String(value || '');
    return acc;
  }, {} as ComponentTexts);

  if (loading) {
    return <CourseLoadingSkeleton />;
  }

  if (error || !courseDetail) {
    // Create a subset of texts that matches CourseErrorStateTexts interface
    const textsObj = t as TextsObject;
    const errorTexts: CourseErrorStateTexts = {
      courseNotFound: String(textsObj.courseNotFound || 'Course not found'),
      courseNotFoundDesc: String(textsObj.courseNotFoundDesc || 'The course you are looking for could not be found.'),
      backToCourses: String(textsObj.backToCourses || 'Back to courses'),
    };

    return (
      <CourseErrorState 
        error={error}
        locale={locale}
        courseType={courseType}
        onRetry={() => getCourse(slug, locale)}
        texts={errorTexts}
      />
    );
  }

  const daysUntilStart = getDaysUntilStart();
  const registrationOpen = isRegistrationOpen();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 sm:py-4">
          <Link 
            href={`/${locale}/${courseType}`}
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="truncate">{componentTexts.backToCourses}</span>
          </Link>
        </div>
      </div>

      {/* Course Type Header */}
      {courseDetail.course_type !== 'online' && (
        <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
            {/* Mobile Layout - İmproved */}
            <div className="flex flex-col gap-3 lg:hidden">
              {/* Course Type ve Registration Status yan yana sola yaslı */}
              <div className="flex items-center gap-3">
                <CourseTypeIndicator courseType={courseDetail.course_type} size="sm" />
                
                {/* Registration Status - Kompakt */}
                {!registrationOpen ? (
                  <div className="flex items-center space-x-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Kayıt Kapalı</span>
                  </div>
                ) : daysUntilStart && daysUntilStart <= 7 ? (
                  <div className="flex items-center space-x-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{daysUntilStart} gün kaldı</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Kayıt Açık</span>
                  </div>
                )}
              </div>
              
              {/* Live Course Info - Horizontal scroll for mobile */}
              <div className="flex items-center gap-4 overflow-x-auto pb-1">
                {courseDetail.live_start_date && (
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{formatDate(courseDetail.live_start_date)}</span>
                  </div>
                )}
                
                {courseDetail.session_count && (
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{courseDetail.session_count} oturum</span>
                  </div>
                )}
                
                {courseDetail.max_participants && (
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                    <Users className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Maks. {courseDetail.max_participants} kişi</span>
                  </div>
                )}
              </div>
            </div>

           
            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
              <div className="flex items-center gap-6">
                {/* Course Type Indicator */}
                <div className="w-fit">
                  <CourseTypeIndicator courseType={courseDetail.course_type} size="sm" />
                </div>
                
                {/* Live Course Info - Desktop horizontal */}
                <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                  {courseDetail.live_start_date && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>{formatDate(courseDetail.live_start_date)}</span>
                    </div>
                  )}
                  
                  {courseDetail.session_count && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{courseDetail.session_count} oturum</span>
                    </div>
                  )}
                  
                  {courseDetail.max_participants && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>Maks. {courseDetail.max_participants} kişi</span>
                    </div>
                  )}
                </div>
              </div>

              
              <div className="flex items-center">
                {!registrationOpen ? (
                  <div className="flex items-center space-x-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Kayıt Kapalı</span>
                  </div>
                ) : daysUntilStart && daysUntilStart <= 7 ? (
                  <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{daysUntilStart} gün kaldı</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Kayıt Açık</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile-only Header Section */}
      <div className="block lg:hidden bg-gradient-to-r from-red-50 via-rose-50 to-red-50 dark:from-red-900/20 dark:via-rose-900/20 dark:to-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8 py-4">
          {/* Mobile: Title and basic info */}
          <div>
            {/* Mobile Course Preview - All course types */}
            <div className="mb-4">
              <CourseHeroSection 
                courseId={courseDetail?.id}
                texts={componentTexts}
                locale={locale}
              />
            </div>
            
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 leading-tight">
              {courseDetail.title}
            </h1>
            
            {/* Meta Information - Mobile */}
            <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400 mb-4">
              {courseDetail.level && (
                <span className="text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-full">
                  {courseDetail.level}
                </span>
              )}
              {totalLessons > 0 && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    <span className="text-xs">{totalLessons} ders</span>
                  </div>
                </>
              )}
              {!ratingLoading && averageRating !== null && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      ({totalRatings})
                    </span>
                  </div>
                </>
              )}
            </div>
            {/* Feature Pills - Mobile */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                <GraduationCap className="w-3 h-3 mr-1" />
                Uzman Eğitmenler
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                <BookOpen className="w-3 h-3 mr-1" />
                Kapsamlı İçerik
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                <Target className="w-3 h-3 mr-1" />
                Pratik Uygulamalar
              </span>
              <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                <Award className="w-3 h-3 mr-1" />
                Sertifika
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">

        {/* Live Course Additional Info */}
        {courseDetail.course_type !== 'online' && (
          <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
              {courseDetail.course_type === 'live' ? 'Canlı Eğitim Detayları' : 'Hibrit Eğitim Detayları'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {courseDetail.live_start_date && courseDetail.live_end_date && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Eğitim Tarihleri</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {formatDate(courseDetail.live_start_date)} - {formatDate(courseDetail.live_end_date)}
                  </p>
                  {courseDetail.live_start_date && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Gün içerisinde yapılacaktır.
                    </p>
                  )}
                </div>
              )}

              {courseDetail.session_count && courseDetail.session_duration_minutes && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Oturum Bilgileri</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {courseDetail.session_count} oturum × {courseDetail.session_duration_minutes} dakika
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Toplam: {Math.round((courseDetail.session_count * courseDetail.session_duration_minutes) / 60)} saat
                  </p>
                </div>
              )}

              {courseDetail.registration_deadline && registrationOpen && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">Son Kayıt</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {formatDate(courseDetail.registration_deadline)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Kayıt için acele edin!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Layout - Sidebar content first */}
        <div className="block lg:hidden space-y-6">
          {/* Course Sidebar - Mobile version without sticky purchase button */}
          <div className="space-y-6">
            <CourseSidebar 
              course={courseDetail}
              slug={slug}
              locale={locale}
              sections={courseDetail.sections}
            />
          </div>
        </div>

        {/* Desktop Layout - YouTube style */}
        <div className="hidden lg:grid grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content - Left side with video preview */}
          <div className="col-span-2 space-y-8 sm:space-y-12">
            {/* Video Preview - Only for online courses */}
            {courseDetail.course_type === 'online' && (
              <div>
                <CourseHeroSection 
                  courseId={courseDetail?.id}
                  texts={componentTexts}
                  locale={locale}
                />
              </div>
            )}

            {/* Course Info */}
            <CourseMainContent 
              courseSlug={slug}
              texts={componentTexts}
              course={courseDetail}
            />

            {/* Course Sections - Only show for online courses */}
            {courseDetail.course_type === 'online' && courseDetail.sections && (
              <CourseSections 
                courseSlug={slug}
                courseId={courseDetail.id}
                sections={courseDetail.sections}
                totalLessons={totalLessons}
                locale={locale}
                texts={componentTexts}
              />
            )}

            {/* Live Course Sessions - Show for live/hybrid courses */}
            {courseDetail.course_type !== 'online' && courseDetail.learning_outcomes && (
              <div className="space-y-6">
                
              </div>
            )}

            {/* MyUNI Products Features */}
            <CourseFeatures texts={componentTexts} /> 

            {/* Certificate Section */}
            <CourseCertificate texts={componentTexts} /> 
          </div>

          {/* Sidebar - Right side with course info */}
          <div className="col-span-1 space-y-6">
            {/* Course Info Card */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-6">
              {/* Course Title */}
              <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-4 leading-tight">
                {courseDetail.title}
              </h1>
              
              {/* Meta Information */}
              <div className="space-y-3 mb-6">
                {courseDetail.level && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full">
                      {courseDetail.level}
                    </span>
                  </div>
                )}
                
                {totalLessons > 0 && (
                  <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-sm">{totalLessons} ders</span>
                  </div>
                )}
                
                {!ratingLoading && averageRating !== null && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        ({totalRatings})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                  <GraduationCap className="w-3 h-3 mr-1" />
                  Uzman Eğitmenler
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                  <BookOpen className="w-3 h-3 mr-1" />
                  Kapsamlı İçerik
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                  <Target className="w-3 h-3 mr-1" />
                  Pratik Uygulamalar
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded-full text-xs font-normal">
                  <Award className="w-3 h-3 mr-1" />
                  Sertifika
                </span>
              </div>
            </div>

            {/* Course Sidebar */}
            <CourseSidebar 
              course={courseDetail}
              slug={slug}
              locale={locale}
              sections={courseDetail.sections}
            />
          </div>
        </div>

        {/* Mobile Main Content - Below sidebar content */}
        <div className="block lg:hidden space-y-8 sm:space-y-12 mt-8 pb-24">
          {/* Course Info */}
          <CourseMainContent 
            courseSlug={slug}
            texts={componentTexts}
            course={courseDetail}
          />

          {/* Course Sections - Only show for online courses */}
          {courseDetail.course_type === 'online' && courseDetail.sections && (
            <CourseSections 
              courseSlug={slug}
              courseId={courseDetail.id}
              sections={courseDetail.sections}
              totalLessons={totalLessons}
              locale={locale}
              texts={componentTexts}
            />
          )}

          {/* Live Course Sessions - Show for live/hybrid courses */}
          {courseDetail.course_type !== 'online' && courseDetail.learning_outcomes && (
            <div className="space-y-6">
              
            </div>
          )}

          {/* MyUNI Products Features */}
          <CourseFeatures texts={componentTexts} /> 

          {/* Certificate Section */}
          <CourseCertificate texts={componentTexts} /> 
        </div>

        {/* FAQ Section */}
        <div className="mt-12 sm:mt-16">
          <CourseFAQ texts={componentTexts} /> 
        </div>

        {/* Testimonials */}
        <div className="mt-12 sm:mt-16">
          <CourseTestimonials texts={componentTexts} locale={locale} /> 
        </div>
      </div>
    </div>
  );
}