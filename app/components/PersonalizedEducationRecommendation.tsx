"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, Check, Clock } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PersonalizedEducationRecommendationProps {
  locale: string;
  onClose: () => void;
  onRecommendation: (recommendations: CourseRecommendation[]) => void;
}

interface UserPreferences {
  background: string;
  interest: string;
  level: string;
  timeCommitment: string;
  goal: string;
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
  thumbnailUrl?: string;
  instructorName?: string;
  courseType: string;
  slug: string;
}

interface SupabaseCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructor_name: string;
  duration: string;
  level: string;
  price: number;
  original_price?: number;
  thumbnail_url?: string;
  course_type: string;
  is_active: boolean;
}

const texts = {
  tr: {
    welcome: "Hoş Geldiniz!",
    subtitle: "Size en uygun eğitimi bulalım",
    step: "Adım",
    next: "Devam",
    back: "Geri",
    finish: "Tamamla",
    close: "Kapat",
    loadingRecommendations: "Önerileriniz hazırlanıyor...",
    recommendationsTitle: "Size Özel Eğitim Önerileri",
    matchScore: "Uyumluluk",
    currency: "₺",
    startLearning: "Öğrenmeye Başla",
    whyRecommended: "Neden öneriliyor:",
    loadingCourses: "Eğitimler yükleniyor...",
    errorLoadingCourses: "Eğitimler yüklenirken bir hata oluştu",
    noCourses: "Şu anda uygun eğitim bulunamadı",
    questions: {
      background: {
        title: "Hangi alanda çalışıyorsunuz?",
        subtitle: "Mevcut mesleğiniz veya ilgi alanınız hangisi?",
        options: [
          { value: "healthcare", label: "Sağlık & Tıp", description: "Doktor, hemşire, eczacı, veteriner" },
          { value: "science", label: "Bilim & Araştırma", description: "Biyolog, kimyager, araştırmacı" },
          { value: "tech", label: "Teknoloji & Yazılım", description: "Yazılım geliştirici, veri analisti" },
          { value: "student", label: "Öğrenci", description: "Üniversite veya lisansüstü öğrencisi" },
          { value: "other", label: "Diğer", description: "Farklı bir alandan geliyorum" }
        ]
      },
      interest: {
        title: "Hangi konular ilginizi çekiyor?",
        subtitle: "Öğrenmek istediğiniz ana alan hangisi?",
        options: [
          { value: "genetics", label: "Genetik & Moleküler Biyoloji", description: "CRISPR, gen düzenleme, genomik" },
          { value: "pharma", label: "İlaç & Farmasötik", description: "İlaç geliştirme, farmasötik kimya" },
          { value: "programming", label: "Programlama & Veri Analizi", description: "R, Python, biyoinformatik" },
          { value: "research", label: "Araştırma Metodolojisi", description: "Bilimsel araştırma teknikleri" },
          { value: "all", label: "Hepsine Açığım", description: "Birden fazla alanda öğrenmeye ilgiliyim" }
        ]
      },
      level: {
        title: "Deneyim seviyeniz nedir?",
        subtitle: "Bu alandaki mevcut bilginizi değerlendirin",
        options: [
          { value: "beginner", label: "Yeni Başlayan", description: "Bu alanda hiç deneyimim yok" },
          { value: "some", label: "Temel Bilgili", description: "Az deneyimim var, temellerden başlamak istiyorum" },
          { value: "intermediate", label: "Orta Seviye", description: "Bazı bilgilerim var, derinlemesine öğrenmek istiyorum" },
          { value: "advanced", label: "İleri Seviye", description: "Uzmanlık alanı yapmak istiyorum" }
        ]
      },
      timeCommitment: {
        title: "Ne kadar zaman ayırabilirsiniz?",
        subtitle: "Haftada eğitime ayırabileceğiniz zaman",
        options: [
          { value: "limited", label: "2-4 Saat", description: "Boş zamanlarımda rahatça" },
          { value: "moderate", label: "5-8 Saat", description: "Düzenli olarak ilerlemek istiyorum" },
          { value: "intensive", label: "8+ Saat", description: "Yoğun ve hızlı şekilde öğrenmek istiyorum" },
          { value: "flexible", label: "Esnek", description: "Zamanım değişken, esnek bir program istiyorum" }
        ]
      },
      goal: {
        title: "Amacınız nedir?",
        subtitle: "Bu eğitimle neyi hedefliyorsunuz?",
        options: [
          { value: "career", label: "Kariyer Değişikliği", description: "Yeni bir alana geçmek istiyorum" },
          { value: "skill", label: "Mevcut Becerilerimi Geliştirmek", description: "İşimde daha iyi olmak istiyorum" },
          { value: "academic", label: "Akademik Gelişim", description: "Lisansüstü çalışmalarım için" },
          { value: "personal", label: "Kişisel İlgi", description: "Merakım var, öğrenmek istiyorum" },
          { value: "certification", label: "Sertifikasyon", description: "Resmi bir sertifika almak istiyorum" }
        ]
      }
    }
  }
};

// Güvenlik: Input validation
const isValidLocale = (locale: string): locale is keyof typeof texts => {
  return locale in texts;
};

const isValidPreferenceValue = (value: string): boolean => {
  const validValues = [
    'healthcare', 'science', 'tech', 'student', 'other',
    'genetics', 'pharma', 'programming', 'research', 'all',
    'beginner', 'some', 'intermediate', 'advanced',
    'limited', 'moderate', 'intensive', 'flexible',
    'career', 'skill', 'academic', 'personal', 'certification'
  ];
  return validValues.includes(value);
};

export default function PersonalizedEducationRecommendation({ 
  locale, 
  onClose, 
  onRecommendation 
}: PersonalizedEducationRecommendationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    background: '',
    interest: '',
    level: '',
    timeCommitment: '',
    goal: ''
  });
  const [isAnimating, setIsAnimating] = useState(true);
  const [showQuestions, setShowQuestions] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [courses, setCourses] = useState<SupabaseCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // Güvenlik: Locale validation
  const safeLocale = isValidLocale(locale) ? locale : 'tr';
  const t = texts[safeLocale];
  const steps = Object.keys(t.questions);

  // Supabase'den kursları çek
  const fetchCourses = useCallback(async () => {
    setLoadingCourses(true);
    setCoursesError(null);
    
    try {
      const { data, error } = await supabase
        .from('myuni_courses')
        .select(`
          id,
          slug,
          title,
          description,
          instructor_name,
          duration,
          level,
          price,
          original_price,
          thumbnail_url,
          course_type,
          is_active
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        setCoursesError(t.errorLoadingCourses);
        return;
      }

      if (data) {
        setCourses(data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCoursesError(t.errorLoadingCourses);
    } finally {
      setLoadingCourses(false);
    }
  }, [t.errorLoadingCourses]);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsAnimating(false);
    }, 3000);

    const timer2 = setTimeout(() => {
      setShowQuestions(true);
      // Kursları yükle
      fetchCourses();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [fetchCourses]);

  // Güvenlik: Memoized option select handler
  const handleOptionSelect = useCallback((stepKey: string, value: string) => {
    // Input validation
    if (!isValidPreferenceValue(value) || !steps.includes(stepKey)) {
      console.warn('Invalid preference value or step key');
      return;
    }

    setPreferences(prev => ({
      ...prev,
      [stepKey]: value
    }));
  }, [steps]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  }, [currentStep, steps.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const canProceed = useCallback(() => {
    const currentStepKey = steps[currentStep];
    return preferences[currentStepKey as keyof UserPreferences] !== '';
  }, [currentStep, preferences, steps]);

  // Rich text içeriğini güvenli şekilde temizle
  const sanitizeDescription = useCallback((htmlContent: string): string => {
    if (!htmlContent) return '';
    
    // Basit HTML tag'leri kaldır ve sadece text içeriği al
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Karakteri sınırla
    return textContent.length > 150 ? textContent.substring(0, 150) + '...' : textContent;
  }, []);
  const calculateRecommendations = useCallback((userPreferences: UserPreferences): CourseRecommendation[] => {
    if (courses.length === 0) {
      return [];
    }
    
    return courses.map(course => {
      let score = 0;
      const reasons: string[] = [];

      // Kurs başlığı ve açıklamasında anahtar kelime arama
      const courseText = `${course.title} ${course.description}`.toLowerCase();
      
      // Background matching
      if (userPreferences.background === 'science' && 
          (courseText.includes('biyoloji') || courseText.includes('araştırma') || courseText.includes('bilim'))) {
        score += 25;
        reasons.push('Bilim geçmişinizle uyumlu');
      }
      if (userPreferences.background === 'tech' && 
          (courseText.includes('programlama') || courseText.includes('python') || courseText.includes('r ') || courseText.includes('veri'))) {
        score += 25;
        reasons.push('Teknoloji geçmişinizle uyumlu');
      }
      if (userPreferences.background === 'healthcare' && 
          (courseText.includes('ilaç') || courseText.includes('genetik') || courseText.includes('tıp') || courseText.includes('sağlık'))) {
        score += 25;
        reasons.push('Sağlık alanı geçmişinizle uyumlu');
      }
      if (userPreferences.background === 'student') {
        score += 15;
        reasons.push('Öğrenci dostu içerik');
      }

      // Interest matching
      if (userPreferences.interest === 'genetics' && 
          (courseText.includes('genetik') || courseText.includes('crispr') || courseText.includes('dna') || courseText.includes('genomik'))) {
        score += 30;
        reasons.push('Genetik ilginizle tam uyumlu');
      }
      if (userPreferences.interest === 'pharma' && 
          (courseText.includes('ilaç') || courseText.includes('farmasötik') || courseText.includes('kimya'))) {
        score += 30;
        reasons.push('Farmasötik ilginizle uyumlu');
      }
      if (userPreferences.interest === 'programming' && 
          (courseText.includes('programlama') || courseText.includes('python') || courseText.includes('r ') || 
           courseText.includes('veri') || courseText.includes('analiz') || courseText.includes('biyoinformatik'))) {
        score += 30;
        reasons.push('Programlama ilginizle uyumlu');
      }
      if (userPreferences.interest === 'research' && 
          (courseText.includes('araştırma') || courseText.includes('metodoloji') || courseText.includes('bilimsel'))) {
        score += 30;
        reasons.push('Araştırma ilginizle uyumlu');
      }
      if (userPreferences.interest === 'all') {
        score += 15;
        reasons.push('Çok yönlü öğrenme isteğinizle uyumlu');
      }

      // Level matching - Türkçe seviye karşılaştırması
      const courseLevelLower = course.level?.toLowerCase() || '';
      if (userPreferences.level === 'beginner' && 
          (courseLevelLower.includes('başlangıç') || courseLevelLower.includes('temel') || courseLevelLower.includes('giriş'))) {
        score += 20;
        reasons.push('Başlangıç seviyenize uygun');
      }
      if (userPreferences.level === 'some' && 
          (courseLevelLower.includes('başlangıç') || courseLevelLower.includes('temel'))) {
        score += 20;
        reasons.push('Temel seviyenize uygun');
      }
      if (userPreferences.level === 'intermediate' && 
          (courseLevelLower.includes('orta') || courseLevelLower.includes('ileri'))) {
        score += 20;
        reasons.push('Orta seviye bilginize uygun');
      }
      if (userPreferences.level === 'advanced' && 
          (courseLevelLower.includes('ileri') || courseLevelLower.includes('uzman'))) {
        score += 20;
        reasons.push('İleri seviye bilginize uygun');
      }

      // Time commitment matching
      if (userPreferences.timeCommitment === 'limited' && course.duration) {
        const durationText = course.duration.toLowerCase();
        if (durationText.includes('hafta') && !durationText.includes('ay')) {
          score += 10;
          reasons.push('Zaman kısıtınıza uygun');
        }
      }

      // Goal matching
      if (userPreferences.goal === 'career' && 
          (courseText.includes('kariyer') || courseText.includes('profesyonel') || courseText.includes('endüstri'))) {
        score += 15;
        reasons.push('Kariyer hedeflerinizi destekler');
      }
      if (userPreferences.goal === 'academic' && 
          (courseText.includes('araştırma') || courseText.includes('akademik') || courseText.includes('bilimsel'))) {
        score += 15;
        reasons.push('Akademik çalışmalarınızı destekler');
      }
      if (userPreferences.goal === 'skill') {
        score += 10;
        reasons.push('Beceri gelişiminizi destekler');
      }

      // Course type bonus
      if (course.course_type === 'live') {
        score += 5;
        reasons.push('Canlı eğitim avantajı');
      }

      return {
        id: course.id,
        slug: course.slug,
        title: course.title,
        description: sanitizeDescription(course.description || ''),
        level: course.level || '',
        duration: course.duration || '',
        price: course.price || 0,
        originalPrice: course.original_price || undefined,
        thumbnailUrl: course.thumbnail_url || undefined,
        instructorName: course.instructor_name || undefined,
        courseType: course.course_type,
        matchScore: Math.min(Math.max(score, 0), 100), // Güvenlik: Skor sınırlaması
        matchReasons: reasons.slice(0, 3) // En fazla 3 sebep göster
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [courses, sanitizeDescription]);

  const handleComplete = useCallback(async () => {
    if (loadingCourses) {
      // Kurslar henüz yükleniyorsa bekle
      return;
    }

    if (coursesError) {
      // Hata varsa kullanıcıyı bilgilendir
      alert(t.errorLoadingCourses);
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const recs = calculateRecommendations(preferences);
      setRecommendations(recs);
      setIsCalculating(false);
      setShowRecommendations(true);
      onRecommendation(recs);
    } catch (error) {
      console.error('Error calculating recommendations:', error);
      setIsCalculating(false);
      alert(t.errorLoadingCourses);
    }
  }, [preferences, calculateRecommendations, onRecommendation, loadingCourses, coursesError, t.errorLoadingCourses]);

  // Güvenlik: Keyboard event handler
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (isAnimating || !showQuestions) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center overflow-hidden" onKeyDown={handleKeyDown}>
        {/* Enhanced animated background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/60 via-rose-50/40 to-pink-50/60 dark:from-red-950/20 dark:via-rose-950/15 dark:to-pink-950/20 animate-pulse duration-4000"></div>
          <div className="absolute top-1/4 left-1/3 w-48 h-48 sm:w-96 sm:h-96 bg-gradient-to-br from-red-100/40 to-rose-100/40 dark:from-red-900/15 dark:to-rose-900/15 rounded-full blur-3xl animate-pulse duration-6000"></div>
          <div className="absolute bottom-1/3 right-1/3 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-br from-rose-100/40 to-pink-100/40 dark:from-rose-900/15 dark:to-pink-900/15 rounded-full blur-2xl animate-pulse duration-8000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-pink-100/30 to-red-100/30 dark:from-pink-900/10 dark:to-red-900/10 rounded-full blur-xl animate-pulse duration-5000"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-manipulation"
          aria-label={t.close}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Welcome content with enhanced animations */}
        <div className="text-center z-10 px-4 sm:px-8 max-w-sm sm:max-w-lg">
          {/* MyUNI Logo with minimal loading indicator */}
          <div className={`mb-6 sm:mb-8 transition-all duration-1000 ease-out ${isAnimating ? 'scale-100 opacity-100' : 'scale-75 opacity-90 -translate-y-4'}`}>
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto flex items-center justify-center relative">
              {/* Simple rotating arc */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
                <svg className="w-16 h-16 sm:w-20 sm:h-20" viewBox="0 0 80 80" fill="none">
                  <circle
                    cx="40"
                    cy="40"
                    r="38"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeDasharray="15 225"
                    className="text-gray-500/60 dark:text-gray-400/50"
                  />
                </svg>
              </div>
              
              {/* Logo */}
              <div className="relative z-10 w-12 h-12 sm:w-16 sm:h-16">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI Logo"
                  width={64}
                  height={64}
                  className="block dark:hidden object-contain"
                  priority
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI Logo"
                  width={64}
                  height={64}
                  className="hidden dark:block object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          
          {/* Welcome text with stagger animation */}
          <div className={`transition-all duration-1000 ease-out delay-300 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-95 -translate-y-2'}`}>
            <h1 className="text-2xl sm:text-4xl font-medium text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 tracking-tight">
              {t.welcome}
            </h1>
          </div>
          
          <div className={`transition-all duration-1000 ease-out delay-500 ${isAnimating ? 'opacity-100 translate-y-0' : 'opacity-90 -translate-y-1'}`}>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 leading-relaxed">
              {t.subtitle}
            </p>
          </div>
          
          {/* Enhanced loading animation */}
          <div className={`flex justify-center space-x-2 transition-all duration-1000 ease-out delay-700 ${isAnimating ? 'opacity-100' : 'opacity-60'}`}>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse duration-1000" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isCalculating || loadingCourses) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center overflow-hidden" onKeyDown={handleKeyDown}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-manipulation"
          aria-label={t.close}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="text-center z-10 px-4 sm:px-8 max-w-sm sm:max-w-lg">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 relative">
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s' }}>
              <svg className="w-20 h-20 sm:w-24 sm:h-24" viewBox="0 0 96 96" fill="none">
                <circle
                  cx="48"
                  cy="48"
                  r="46"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="20 270"
                  className="text-gray-500/60"
                />
              </svg>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI"
                  width={64}
                  height={64}
                  className="block dark:hidden object-contain"
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI"
                  width={64}
                  height={64}
                  className="hidden dark:block object-contain"
                />
              </div>
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-4">
            {loadingCourses ? t.loadingCourses : t.loadingRecommendations}
          </h2>
          
          <div className="flex justify-center space-x-1">
            <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full animate-pulse duration-1000"></div>
            <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full animate-pulse duration-1000" style={{ animationDelay: '100ms' }}></div>
            <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full animate-pulse duration-1000" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full animate-pulse duration-1000" style={{ animationDelay: '300ms' }}></div>
            <div className="w-1 h-6 sm:h-8 bg-gray-500 rounded-full animate-pulse duration-1000" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (showRecommendations) {
    if (recommendations.length === 0) {
      return (
        <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 overflow-auto" onKeyDown={handleKeyDown}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-manipulation"
            aria-label={t.close}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="max-w-sm sm:max-w-4xl mx-auto p-4 sm:p-8 pt-16 sm:pt-20 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI"
                  width={48}
                  height={48}
                  className="block dark:hidden object-contain brightness-0 invert"
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI"
                  width={48}
                  height={48}
                  className="hidden dark:block object-contain brightness-0 invert"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t.noCourses}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Tercihlerinize uygun eğitim bulunamadı. Lütfen daha sonra tekrar deneyin.
            </p>
            <button
              onClick={onClose}
              className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 px-6 py-3 rounded-lg font-medium transition-all duration-300"
            >
              {t.close}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 overflow-auto" onKeyDown={handleKeyDown}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-manipulation"
          aria-label={t.close}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <div className="max-w-sm sm:max-w-4xl mx-auto p-4 sm:p-8 pt-16 sm:pt-20">
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 rounded-full mx-auto mb-4 sm:mb-6 flex items-center justify-center">
              <div className="w-8 h-8 sm:w-12 sm:h-12">
                <Image
                  src="/myuni-icon.png"
                  alt="MyUNI"
                  width={48}
                  height={48}
                  className="block dark:hidden object-contain brightness-0 invert"
                />
                <Image
                  src="/myuni-icon2.png"
                  alt="MyUNI"
                  width={48}
                  height={48}
                  className="hidden dark:block object-contain brightness-0 invert"
                />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-4">
              {t.recommendationsTitle}
            </h1>
          </div>

          <div className="grid gap-4 sm:gap-6">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={rec.id}
                className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-4 sm:p-6 hover:shadow-lg transition-all duration-300 animate-in fade-in-50 slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center mb-2 gap-2">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-medium self-start">
                        {t.matchScore}: {rec.matchScore}%
                      </span>
                      <span className="bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-full text-sm self-start">
                        {rec.level}
                      </span>
                      {rec.courseType === 'live' && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-sm self-start">
                          Canlı Eğitim
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {rec.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed text-sm sm:text-base">
                      {rec.description}
                    </p>
                    {rec.instructorName && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Eğitmen: {rec.instructorName}
                      </p>
                    )}
                  </div>
                  {rec.thumbnailUrl && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 ml-0 sm:ml-4 mb-4 sm:mb-0 flex-shrink-0">
                      <Image
                        src={rec.thumbnailUrl}
                        alt={rec.title}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {rec.duration}
                  </div>
                </div>

                {rec.matchReasons.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.whyRecommended}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rec.matchReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400 px-2 py-1 rounded-md"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {t.currency}{rec.price}
                    </span>
                    {rec.originalPrice && (
                      <span className="text-base sm:text-lg text-gray-400 line-through">
                        {t.currency}{rec.originalPrice}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      // Kurs detay sayfasına yönlendir
                      const baseUrl = process.env.NODE_ENV === 'production' 
                        ? 'https://myunilab.net/' // Production URL'ini buraya koy
                        : 'http://localhost:3000';
                      window.location.href = `${baseUrl}/${safeLocale}/kurs/${rec.slug}`;
                    }}
                    className="bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center transform hover:scale-105 touch-manipulation text-sm sm:text-base"
                  >
                    {t.startLearning}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStepKey = steps[currentStep];
  const currentStepData = t.questions[currentStepKey as keyof typeof t.questions];

  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Enhanced background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-rose-50/30 to-pink-50/50 dark:from-red-950/15 dark:via-rose-950/10 dark:to-pink-950/15"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-red-100/30 to-rose-100/30 dark:from-red-900/10 dark:to-rose-900/10 rounded-full blur-2xl animate-pulse duration-8000"></div>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors touch-manipulation"
        aria-label={t.close}
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>

      {/* Content with slide-up animation */}
      <div className="w-full max-w-sm sm:max-w-xl mx-auto p-4 sm:p-8 z-10 animate-in slide-in-from-bottom-4 duration-700 max-h-screen overflow-y-auto">
        {/* MyUNI Logo - smaller, top positioned */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center transition-all duration-300 hover:scale-105 relative group">
            {/* Subtle background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/3 to-gray-500/3 dark:from-gray-400/2 dark:to-gray-400/2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Logo */}
            <div className="relative z-10 w-8 h-8 sm:w-10 sm:h-10">
              <Image
                src="/myuni-icon.png"
                alt="MyUNI"
                width={40}
                height={40}
                className="block dark:hidden object-contain"
              />
              <Image
                src="/myuni-icon2.png"
                alt="MyUNI"
                width={40}
                height={40}
                className="hidden dark:block object-contain"
              />
            </div>
          </div>
        </div>

        {/* Progress with enhanced animation */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <span className="text-sm text-gray-500 dark:text-gray-400 transition-all duration-300">
              {t.step} {currentStep + 1} / {steps.length}
            </span>
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-neutral-800 h-0.5 overflow-hidden">
            <div 
              className="h-0.5 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question with slide animation */}
        <div className="text-center mb-8 sm:mb-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500" key={currentStep}>
          <h2 className="text-xl sm:text-2xl font-medium text-gray-900 dark:text-gray-100 mb-3 transition-all duration-300">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm sm:text-base">
            {currentStepData.subtitle}
          </p>
        </div>

        {/* Options with stagger animation */}
        <div className="space-y-3 mb-8 sm:mb-10">
          {currentStepData.options.map((option, index) => {
            const isSelected = preferences[currentStepKey as keyof UserPreferences] === option.value;

            return (
              <div
                key={option.value}
                className="animate-in fade-in-50 slide-in-from-bottom-1 duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <button
                  onClick={() => handleOptionSelect(currentStepKey, option.value)}
                  className={`w-full p-3 sm:p-4 text-left border transition-all duration-300 group transform hover:scale-[1.01] touch-manipulation ${
                    isSelected
                      ? 'border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-neutral-800 shadow-sm'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-gray-300 dark:hover:border-neutral-600 hover:bg-gray-25 dark:hover:bg-neutral-850 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-4 h-4 mt-0.5 border rounded-full transition-all duration-300 flex-shrink-0 ${
                      isSelected
                        ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 scale-110'
                        : 'border-gray-300 dark:border-neutral-600 group-hover:border-gray-400 dark:group-hover:border-neutral-500'
                    }`}>
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-white dark:text-gray-900 m-0.5 animate-in zoom-in-50 duration-200" strokeWidth={3} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1 transition-all duration-200 text-sm sm:text-base">
                        {option.label}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-all duration-200">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Navigation with enhanced animations */}
        <div className="flex items-center justify-between">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-300 hover:-translate-x-1 touch-manipulation text-sm sm:text-base"
            >
              {t.back}
            </button>
          ) : (
            <div></div>
          )}

          <button
            onClick={handleNext}
            disabled={!canProceed() || loadingCourses}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center space-x-2 hover:translate-x-1 transform hover:scale-105 disabled:hover:scale-100 disabled:hover:translate-x-0 touch-manipulation text-sm sm:text-base"
          >
            <span>{currentStep === steps.length - 1 ? t.finish : t.next}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Step indicators with pulse animation */}
        <div className="flex justify-center space-x-2 mt-8 sm:mt-10">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 transition-all duration-500 ${
                index <= currentStep 
                  ? 'bg-gray-900 dark:bg-gray-100 scale-125' 
                  : 'bg-gray-300 dark:bg-neutral-600'
              } ${index === currentStep ? 'animate-pulse' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}