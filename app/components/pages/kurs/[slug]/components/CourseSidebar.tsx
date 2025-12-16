"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Play, Info, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import supabase from '../../../../../_services/supabaseClient';

interface Course {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  early_bird_price?: number;
  early_bird_deadline?: string;
  duration?: string;
  level?: string;
  thumbnail_url?: string;
  slug: string;
  is_registration_open?: boolean;
  course_type?: 'online' | 'live' | 'hybrid';
  session_count?: number;
  session_duration_minutes?: number;
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: string;
  description?: string;
  order_index: number;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseSidebarProps {
  course?: Course;
  slug?: string;
  locale?: string;
  sections?: Section[];
}

interface SimilarCourse {
  id: string;
  title: string;
  price: number;
  original_price?: number;
  early_bird_price?: number;
  early_bird_deadline?: string;
  thumbnail_url?: string;
  slug: string;
  level: string;
  duration: string;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ 
  course = {} as Course, 
  slug = 'course-slug', 
  locale = 'tr', 
  sections = []
}) => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [showDurationTooltip, setShowDurationTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState('center'); // 'left', 'center', 'right'
  const [latestCourses, setLatestCourses] = useState<SimilarCourse[]>([]);
  const [loadingLatestCourses, setLoadingLatestCourses] = useState(true);
  const [countdown, setCountdown] = useState<{days: number; hours: number; minutes: number; seconds: number; total: number} | null>(null);
  
  // Ref parametresini yakala
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setRefCode(ref);
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
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // Erken kayıt indirimi kontrolü
  const isEarlyBirdActive = () => {
    if (!course.early_bird_price || !course.early_bird_deadline) {
      return false;
    }
    
    const now = new Date();
    const deadline = new Date(course.early_bird_deadline);
    return now <= deadline;
  };

  // Aktif fiyatı hesapla (erken kayıt veya normal)
  const getActivePrice = () => {
    if (isEarlyBirdActive() && course.early_bird_price !== undefined) {
      return course.early_bird_price;
    }
    return course.price || 0;
  };

  // Kalan süreyi hesapla
  const getTimeRemaining = () => {
    if (!course.early_bird_deadline) return null;
    
    const now = new Date();
    const deadline = new Date(course.early_bird_deadline);
    const diff = deadline.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, total: diff };
  };

  // Fiyat hesaplamaları
  const activePrice = getActivePrice();
  const isEarlyBird = isEarlyBirdActive();
  const timeRemaining = getTimeRemaining();
  
  // Countdown için timer
  useEffect(() => {
    if (isEarlyBird && timeRemaining) {
      setCountdown(timeRemaining);
      
      const timer = setInterval(() => {
        const newTimeRemaining = getTimeRemaining();
        if (newTimeRemaining) {
          setCountdown(newTimeRemaining);
        } else {
          setCountdown(null);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setCountdown(null);
    }
  }, [isEarlyBird, course.early_bird_deadline]);
  
  // Debug - Course object'i kontrol edelim
  console.log('=== COURSE SIDEBAR COURSE DATA ===');
  console.log('Full course object:', course);
  console.log('Course keys:', Object.keys(course));
  console.log('Early bird price type:', typeof course.early_bird_price);
  console.log('Early bird deadline type:', typeof course.early_bird_deadline);
  
  // Original price belirleme - erken kayıt aktifse original_price, değilse original_price
  const displayOriginalPrice = isEarlyBird 
    ? course.original_price 
    : (course.original_price && course.original_price > activePrice ? course.original_price : null);
  
  const discountPercentage = displayOriginalPrice && activePrice !== undefined && displayOriginalPrice > activePrice
    ? Math.round(((displayOriginalPrice - activePrice) / displayOriginalPrice) * 100)
    : 0;

  // Scroll pozisyonunu izlemek için effect
  useEffect(() => {
    // Her durumda sticky butonu göster (en üstteyken de)
    // Mobile buton her zaman görünür
  }, []);



  // Tooltip pozisyonunu hesaplayan fonksiyon
  const calculateTooltipPosition = useCallback(() => {
    if (!tooltipRef.current || !iconRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16; // Minimum kenar boşluğu

    // İkon merkezi
    const iconCenter = iconRect.left + iconRect.width / 2;
    
    // Tooltip genişliği
    const tooltipWidth = 288; // w-72 = 18rem = 288px
    
    // Sol pozisyon hesaplama
    const leftPosition = iconCenter - tooltipWidth / 2;
    const rightPosition = leftPosition + tooltipWidth;

    if (leftPosition < padding) {
      // Sol taraf ekran dışında, sola hizala
      setTooltipPosition('left');
    } else if (rightPosition > viewportWidth - padding) {
      // Sağ taraf ekran dışında, sağa hizala
      setTooltipPosition('right');
    } else {
      // Merkeze hizala
      setTooltipPosition('center');
    }
  }, []);

  // Tooltip gösterildiğinde pozisyonu hesapla
  useEffect(() => {
    if (showDurationTooltip) {
      // DOM güncellemesini bekle
      setTimeout(() => {
        calculateTooltipPosition();
      }, 0);
    }
  }, [showDurationTooltip, calculateTooltipPosition]);

  // Pencere boyutu değiştiğinde pozisyonu yeniden hesapla
  useEffect(() => {
    const handleResize = () => {
      if (showDurationTooltip) {
        calculateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showDurationTooltip, calculateTooltipPosition]);

  // CourseSections ile aynı süre hesaplama mantığı
  const calculateSectionDuration = (lessons: Lesson[]) => {
    if (!lessons || lessons.length === 0) return '0 dk';
    
    let totalMinutes = 0;
    lessons.forEach(lesson => {
      const duration = lesson.duration;
      if (duration.includes('dk')) {
        totalMinutes += parseInt(duration.replace('dk', '').trim()) || 0;
      } else if (duration.includes('sa')) {
        totalMinutes += (parseInt(duration.replace('sa', '').trim()) || 0) * 60;
      }
    });

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}sa${minutes > 0 ? ` ${minutes}dk` : ''}`;
    }
    
    return `${totalMinutes}dk`;
  };

  const getTotalDuration = () => {
    
    // Live/hybrid kurslar için session verilerinden hesapla
    if ((course.course_type === 'live' || course.course_type === 'hybrid') && 
        course.session_count && course.session_duration_minutes) {
      const totalMinutes = course.session_count * course.session_duration_minutes;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const calculatedDuration = hours > 0 
        ? `${hours} saat${minutes > 0 ? ` ${minutes} dk` : ''}` 
        : `${minutes} dk`;
      
      return calculatedDuration;
    }
    
    // Online kurslar için öncelikle veritabanındaki duration alanını kullan
    if (course.course_type === 'online' && course.duration) {
      return course.duration;
    }
    
    // Sections/lessons varsa otomatik hesapla
    if (sections && sections.length > 0) {
      
      const totalMinutes = sections.reduce((total, section) => {
        const duration = calculateSectionDuration(section.lessons);
        let minutes = 0;
        
        if (duration.includes('sa')) {
          const parts = duration.split('sa');
          minutes += parseInt(parts[0]) * 60;
          if (parts[1] && parts[1].includes('dk')) {
            minutes += parseInt(parts[1].replace('dk', '').trim()) || 0;
          }
        } else if (duration.includes('dk')) {
          minutes += parseInt(duration.replace('dk', '').trim()) || 0;
        }
        
        return total + minutes;
      }, 0);

      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const calculatedDuration = `${hours}sa${minutes > 0 ? ` ${minutes}dk` : ''}`;
        
        return calculatedDuration;
      }
      
      const calculatedDuration = `${totalMinutes}dk`;
      
      return calculatedDuration;
    }
    
    // Fallback: course.duration veya varsayılan değer
    const fallbackDuration = course.duration || '6 saat';
    
    return fallbackDuration;
  };

  // Son kursları getir
  const fetchLatestCourses = useCallback(async () => {
    try {
      setLoadingLatestCourses(true);
      
      // En son eklenen kursları getir (mevcut kurs hariç)
      const { data: courses, error } = await supabase
        .from('myuni_courses')
        .select('id, title, price, original_price, early_bird_price, early_bird_deadline, thumbnail_url, slug, level, duration')
        .eq('is_active', true)
        .eq('is_registration_open', true) // Added this filter
        .neq('id', course.id)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) {
        console.error('Error fetching latest courses:', error);
        setLatestCourses([]);
      } else {
        // Benzersiz kursları kontrol et ve slug kontrolü yap
        const validCourses = courses ? courses.filter((courseItem, index, self) => {
          const isUnique = index === self.findIndex(c => c.id === courseItem.id);
          const hasValidSlug = courseItem.slug && courseItem.slug.trim() !== '';
          
          return isUnique && hasValidSlug;
        }) : [];
        
        setLatestCourses(validCourses);
      }
    } catch (error) {
      console.error('Error fetching latest courses:', error);
      setLatestCourses([]);
    } finally {
      setLoadingLatestCourses(false);
    }
  }, [course.id]);

  // Kayıt durumunu kontrol et
  const checkEnrollmentStatus = useCallback(async () => {
    try {
      setCheckingEnrollment(true);
      
      const { data: enrollmentData, error } = await supabase
        .from('myuni_enrollments')
        .select('id, is_active')
        .eq('user_id', user?.id)
        .eq('course_id', course.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Enrollment check error:', error);
        return;
      }

      setIsEnrolled(!!enrollmentData);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [user?.id, course.id]);

  useEffect(() => {
    if (isSignedIn && user && course.id) {
      checkEnrollmentStatus();
    } else {
      setCheckingEnrollment(false);
    }
  }, [isSignedIn, user, course.id, checkEnrollmentStatus]);

  // Son kursları yükle
  useEffect(() => {
    if (course.id) {
      fetchLatestCourses();
    }
  }, [course.id, fetchLatestCourses]);

  const handleEnrollment = () => {
    if (!isSignedIn) {
      const currentPath = window.location.pathname;
      const redirectUrl = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Eğer kullanıcı kursa kayıtlıysa, kayıt durumu ne olursa olsun kursa devam edebilsin
    if (isEnrolled) {
      router.push(`/${locale}/watch/course/${slug}`);
      return;
    }

    // Kayıt kapalıysa ve kullanıcı kursa kayıtlı değilse işlem yapma
    if (course.is_registration_open === false) {
      return;
    }

    if (course.price === 0) {
      // Free course logic here
    } else {
      // Build checkout URL with referral code if present
      let checkoutUrl = `/${locale}/checkout?id=${encodeURIComponent(course.id)}`;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        
        if (refCode) {
          checkoutUrl += `&ref=${encodeURIComponent(refCode)}`;
        }
      }
      
      router.push(checkoutUrl);
    }
  };

  const handleLatestCourseClick = (courseSlug: string) => {
    if (!courseSlug) {
      return;
    }
    
    // Dil bazlı URL formatı
    const courseRoute = locale === 'tr' ? 'kurs' : 'course';
    let url = `/${locale}/${courseRoute}/${courseSlug}`;
    
    // Ref parametresini ekle
    if (refCode) {
      url = addRefToUrl(url);
    }
    
    router.push(url);
  };

  const formatPrice = (course: SimilarCourse) => {
    // Erken kayıt indirimi kontrolü
    const isEarlyBirdActive = course.early_bird_price && 
                             course.early_bird_deadline && 
                             new Date() <= new Date(course.early_bird_deadline);
    
    const activePrice = isEarlyBirdActive ? course.early_bird_price : course.price;
    
    if (activePrice === 0) return 'Ücretsiz';
    return `₺${activePrice}`;
  };

  const getOriginalPriceForLatest = (course: SimilarCourse) => {
    const isEarlyBirdActive = course.early_bird_price && 
                             course.early_bird_deadline && 
                             new Date() <= new Date(course.early_bird_deadline);
    
    if (isEarlyBirdActive) {
      return course.price; // Erken kayıt aktifse normal fiyatı çizgili göster
    } else {
      return course.original_price && course.original_price > course.price 
        ? course.original_price 
        : null;
    }
  };

  // Tooltip pozisyon class'ları
  const getTooltipClasses = () => {
    const baseClasses = "absolute bottom-full mb-2 w-72 p-3 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded-sm shadow-lg z-50 border border-neutral-700 dark:border-neutral-600";
    
    switch (tooltipPosition) {
      case 'left':
        return `${baseClasses} left-0`;
      case 'right':
        return `${baseClasses} right-0`;
      default:
        return `${baseClasses} left-1/2 transform -translate-x-1/2`;
    }
  };

  // Arrow pozisyon class'ları
  const getArrowClasses = () => {
    const baseClasses = "absolute top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-700";
    
    switch (tooltipPosition) {
      case 'left':
        return `${baseClasses} left-4`;
      case 'right':
        return `${baseClasses} right-4`;
      default:
        return `${baseClasses} left-1/2 transform -translate-x-1/2`;
    }
  };

  const EnrollmentButton = () => {
    if (checkingEnrollment) {
      return (
        <button 
          disabled
          className="w-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-sm font-medium flex items-center justify-center"
        >
          <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          Kontrol ediliyor...
        </button>
      );
    }

    // Kullanıcı giriş yapmış ve kursa kayıtlıysa - kayıt durumu ne olursa olsun kursa devam edebilsin
    if (isSignedIn && isEnrolled) {
      return (
        <button 
          onClick={handleEnrollment}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-sm font-medium transition-colors flex items-center justify-center"
        >
          <Play className="w-4 h-4 mr-2" fill="currentColor" />
          Kursa Git
        </button>
      );
    }

    // Kayıt kapalıysa ve kullanıcı kursa kayıtlı değilse buton inaktif olsun
    if (course.is_registration_open === false) {
      return (
        <div className="space-y-2">
          <button 
            disabled
            className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-sm font-medium cursor-not-allowed flex items-center justify-center"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Kayıt Kapalı
          </button>
          <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
            Bu kurs için kayıt alımı şu anda kapalıdır.
          </p>
        </div>
      );
    }

    return (
      <button 
        onClick={handleEnrollment}
        className="w-full bg-neutral-800 hover:bg-[#990000] dark:bg-neutral-700 dark:hover:bg-[#990000] text-white py-3 px-6 rounded-sm font-medium transition-colors"
      >
        {!isSignedIn ? 'Satın Al/Giriş Yap' : (course.price === 0 ? 'Ücretsiz Kayıt Ol' : 'Kursa Kayıt Ol')}
      </button>
    );
  };

  return (
    <>
      {/* Mobil cihazlar için altta sabit buton - Her zaman görünür */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 lg:hidden z-50">
        <EnrollmentButton />
        <p className="text-xs text-center mt-2 text-neutral-500 dark:text-neutral-400">
          Hemen başla, hızlıca öğren
        </p>
      </div>
      
      <div className="sticky top-24 space-y-6">
        {/* Ana Purchase Card */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-4 md:p-6 rounded-sm">
          {/* Fiyat */}
          <div className="mb-6">
            <div className="flex items-baseline space-x-3 mb-2">
              <div className="flex flex-col">
                <span className="text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                  {activePrice === 0 ? 'Ücretsiz' : `₺${activePrice || '299'}`}
                </span>
                {/* Erken kayıt fiyatı işareti */}
                {isEarlyBird && (
                  <span className="text-xs text-orange-600 dark:text-orange-400 font-medium mt-0.5 flex items-center">
                    <div className="w-1 h-1 bg-orange-400 rounded-full mr-1"></div>
                    Erken kayıt fiyatı
                  </span>
                )}
              </div>
              {/* Original price gösterimi */}
              {displayOriginalPrice && (
                <span className="text-lg text-neutral-400 line-through">
                  ₺{displayOriginalPrice}
                </span>
              )}
            </div>
            
            <div className="w-16 h-px bg-[#990000] mb-3"></div>
            
            {/* Erken kayıt indirimi gösterimi */}
            {isEarlyBird && countdown && (
              <div className="space-y-3">
                {/* Ana indirim badge'i */}
                <div className="relative overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-red-900/20 border border-amber-200/60 dark:border-amber-800/60 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                          Erken Kayıt İndirimi
                        </span>
                      </div>
                      <div className="bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                        %{discountPercentage} KAZANÇ
                      </div>
                    </div>
                    
                    {/* Countdown */}
                    <div className="mt-3">
                      <div className="flex items-center space-x-1 text-xs text-amber-600 dark:text-amber-400 mb-2">
                        <Clock className="w-3 h-3" />
                        <span>Bu fırsatı kaçırmayın!</span>
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        {/* Gün */}
                        <div className="text-center">
                          <div className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 rounded-md py-2 px-1">
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">
                              {countdown.days.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Gün
                            </div>
                          </div>
                        </div>
                        
                        {/* Saat */}
                        <div className="text-center">
                          <div className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 rounded-md py-2 px-1">
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">
                              {countdown.hours.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Saat
                            </div>
                          </div>
                        </div>
                        
                        {/* Dakika */}
                        <div className="text-center">
                          <div className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 rounded-md py-2 px-1">
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-400 leading-none">
                              {countdown.minutes.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Dk
                            </div>
                          </div>
                        </div>
                        
                        {/* Saniye */}
                        <div className="text-center">
                          <div className="bg-white dark:bg-neutral-800 border border-amber-200 dark:border-amber-800 rounded-md py-2 px-1">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400 leading-none animate-pulse">
                              {countdown.seconds.toString().padStart(2, '0')}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Sn
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Aciliyet mesajı */}
                      {countdown.total < 24 * 60 * 60 * 1000 && (
                        <div className="mt-3 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-medium rounded-full border border-red-200 dark:border-red-800">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1 animate-ping"></div>
                            24 saatten az kaldı!
                          </span>
                        </div>
                      )}
                      
                      {countdown.total < 60 * 60 * 1000 && (
                        <div className="mt-2 text-center">
                          <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-bounce">
                            ⚡ SON 1 SAAT ⚡
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Normal indirim gösterimi (erken kayıt yoksa) */}
            {!isEarlyBird && discountPercentage > 0 && (
              <div className="inline-block bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-sm text-sm font-medium border border-green-200/50 dark:border-green-800/50">
                %{discountPercentage} indirim
              </div>
            )}
          </div>

          {/* Kurs Bilgileri */}
          <div className="space-y-3 mb-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Süre</span>
                <div className="relative" ref={iconRef}>
                  <Info 
                    className="w-3 h-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help transition-colors"
                    onMouseEnter={() => setShowDurationTooltip(true)}
                    onMouseLeave={() => setShowDurationTooltip(false)}
                    onClick={() => setShowDurationTooltip(!showDurationTooltip)} // Mobil için touch desteği
                  />
                  
                  {showDurationTooltip && (
                    <>
                      <div 
                        ref={tooltipRef}
                        className={getTooltipClasses()}
                      >
                        <div className="text-left leading-relaxed">
                          Bu eğitimin daha etkili ve sindirilebilir bir öğrenme deneyimi sunması için{' '}
                          <span className="font-medium">{getTotalDuration()}</span>ya yayılmıştır. 
                          Her hafta 1,5–2 saatlik bir çalışma ile videoları izleyip uygulamaları tamamlayabilir, 
                          bilgiyi kalıcı hale getirebilirsiniz. Dilerseniz kendi temponuza göre daha hızlı veya yavaş ilerleyebilirsiniz.
                        </div>
                        <div className={getArrowClasses()}></div>
                      </div>
                      
                      {/* Mobil için overlay - tooltip'i kapatmak için */}
                      <div 
                        className="fixed inset-0 z-40 md:hidden" 
                        onClick={() => setShowDurationTooltip(false)}
                      />
                    </>
                  )}
                </div>
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {getTotalDuration()}
              </span>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">Seviye</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {course.level || 'Başlangıç'}
              </span>
            </div>
          </div>

          <div className="hidden lg:block">
            <EnrollmentButton />
          </div>
        </div>

        {/* Son Kurslar */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            Son kurslar
          </h3>
          
          {loadingLatestCourses ? (
            <div className="space-y-3">
              {[1, 2].map((index) => (
                <div key={`skeleton-${index}`} className="animate-pulse">
                  <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-sm">
                    <div className="w-12 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-sm"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded mb-2"></div>
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : latestCourses.length > 0 ? (
            <div className="space-y-3">
              {latestCourses.map((latestCourse) => (
                <div 
                  key={`latest-${latestCourse.id}`}
                  onClick={() => handleLatestCourseClick(latestCourse.slug)}
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-sm flex-shrink-0 overflow-hidden relative">
                    {latestCourse.thumbnail_url ? (
                      <Image 
                        src={latestCourse.thumbnail_url} 
                        alt={latestCourse.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200 dark:bg-neutral-600"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {latestCourse.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {latestCourse.duration || '2 saat'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {formatPrice(latestCourse)}
                        </span>
                        {getOriginalPriceForLatest(latestCourse) && (
                          <span className="text-xs text-neutral-400 line-through">
                            ₺{getOriginalPriceForLatest(latestCourse)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Henüz kurs bulunamadı.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseSidebar;
