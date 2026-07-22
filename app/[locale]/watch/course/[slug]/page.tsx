// app/[locale]/watch/course/[slug]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useUser } from '@clerk/nextjs';
import { Play, FileText, Zap, StickyNote, PlusCircle, Bot, BarChart3, Award, ExternalLink } from 'lucide-react';

// Import services
import { 
  getCourseWithContent, 
  getUserCourseProgress,
  markLessonCompleted
} from '../../../../../lib/courseService';

// Import certificate service
import { 
  checkCertificateEligibility, 
  getUserCertificate 
} from '../../../../../lib/certificateApi';

// Import all components
import CourseSidebar from '../../../../components/course/CourseSidebar';
import AIChatSidebar from '../../../../components/course/AIChatSidebar';
import PersonalizedWelcome from '../../../../components/course/PersonalizedWelcome';
import CourseHeader from '../../../../components/course/CourseHeader';
import MyUNIAnalytics from '../../../../components/course/MyUNIAnalytics';
import { MyUNIVideo } from '../../../../components/course/content/MyUNIVideo';
import { MyUNINotes } from '../../../../components/course/content/MyUNINotes';
import { MyUNIQuick } from '../../../../components/course/content/MyUNIQuick';
import { MixedContent } from '../../../../components/course/content/MixedContent';

// Define proper types
interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  totalWatchTime: number;
  sections: Section[];
  course_type?: "online" | "live" | "hybrid";
  isLive?: boolean;
  live_start_date?: string | null;
  live_end_date?: string | null;
  live_timezone?: string | null;
  duration?: string;
}

interface UserPreferences {
  experience: string;
  goals: string[];
  learningStyle: string;
  timeCommitment: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  status: 'active' | 'revoked';
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: "video" | "notes" | "quick" | "mixed";
  duration: string;
  duration_minutes?: number; // Yeni alan eklendi
  isCompleted: boolean;
  lastPosition: number;
  watchTime: number;
  order: number;
}

interface UserProgress {
  lesson_id: string;
  is_completed: boolean;
  completed_at: string;
  watch_time_seconds: number;
  last_position_seconds: number;
}

interface CourseWithContent {
  course: {
    id: string;
    title: string;
    instructor_name?: string;
    course_type?: string;
    live_start_date?: string;
    live_end_date?: string;
    live_timezone?: string;
    duration?: string;
  };
  sections: Array<{
    id: string;
    title: string;
    order_index: number;
    lessons: Array<{
      id: string;
      title: string;
      lesson_type: string;
      duration_minutes?: number;
      order_index: number;
    }>;
  }>;
}

interface CourseWatchPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Text translations
const texts = {
  tr: {
    courseContent: "Kurs İçeriği",
    analytics: "Analitik",
    progress: "İlerleme",
    instructor: "Eğitmen",
    completed: "Tamamlandı",
    inProgress: "Devam Ediyor",
    myuniVideo: "MyUNI Video",
    myuniNotes: "MyUNI Notes", 
    myuniQuick: "MyUNI Quick",
    myuniAnalytics: "MyUNI Analytics",
    mixed: "Video + Notlar",
    selectContent: "İçerik seçin",
    welcomeBack: "Hoş geldiniz!",
    continueWatching: "Kaldığınız yerden devam edin",
    overview: "Genel Bakış",
    totalWatchTime: "Toplam İzleme Süresi",
    completedLessons: "Tamamlanan Dersler",
    avgDailyTime: "Günlük Ortalama",
    currentStreak: "Güncel Seri",
    lastActive: "Son Aktivite",
    weeklyProgress: "Haftalık İlerleme",
    contentProgress: "İçerik İlerlemesi",
    performance: "Performans",
    minutes: "dakika",
    days: "gün",
    lessons: "ders",
    loading: "Yükleniyor...",
    error: "Hata oluştu",
    enrolling: "Kursa kaydolunuyor...",
    enrollSuccess: "Kursa başarıyla kaydoldunuz!",
    notes: "AI Asistan",
    showNotes: "AI Asistanı Göster",
    hideNotes: "AI Asistanı Gizle",
    notEnrolled: "Bu kursa kayıtlı değilsiniz",
    enrollmentRequired: "Bu kursu izlemek için kayıt olmanız gerekiyor"
  },
  en: {
    courseContent: "Course Content",
    analytics: "Analytics", 
    progress: "Progress",
    instructor: "Instructor",
    completed: "Completed",
    inProgress: "In Progress",
    myuniVideo: "MyUNI Video",
    myuniNotes: "MyUNI Notes",
    myuniQuick: "MyUNI Quick", 
    myuniAnalytics: "MyUNI Analytics",
    mixed: "Video + Notes",
    selectContent: "Select content",
    welcomeBack: "Welcome back!",
    continueWatching: "Continue where you left off",
    overview: "Overview",
    totalWatchTime: "Total Watch Time",
    completedLessons: "Completed Lessons",
    avgDailyTime: "Daily Average",
    currentStreak: "Current Streak",
    lastActive: "Last Active",
    weeklyProgress: "Weekly Progress",
    contentProgress: "Content Progress",
    performance: "Performance",
    minutes: "minutes",
    days: "days",
    lessons: "lessons",
    loading: "Loading...",
    error: "Error occurred",
    enrolling: "Enrolling to course...",
    enrollSuccess: "Successfully enrolled to course!",
    notes: "AI Assistant",
    showNotes: "Show AI Assistant",
    hideNotes: "Hide AI Assistant",
    notEnrolled: "You are not enrolled in this course",
    enrollmentRequired: "You need to enroll to watch this course"
  }
};

export default function CourseWatchPage({ params }: CourseWatchPageProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeView, setActiveView] = useState<'content' | 'analytics'>('content');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  // Certificate states
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [existingCertificate, setExistingCertificate] = useState<Certificate | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);

  const resolvedParams = use(params);
  const { locale, slug } = resolvedParams;
  const courseSlug = slug;
  
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Use Clerk user
  const { user, isLoaded } = useUser();

  // Helper functions to validate and cast types
  const validateCourseType = (type: string | undefined): "online" | "live" | "hybrid" => {
    if (type === 'live' || type === 'hybrid' || type === 'online') {
      return type;
    }
    return 'online'; // Default fallback
  };

  const validateLessonType = (type: string): "video" | "notes" | "quick" | "mixed" => {
    if (type === 'video' || type === 'notes' || type === 'quick' || type === 'mixed') {
      return type;
    }
    return 'video'; // Default fallback
  };

  const transformCourseData = useCallback((courseData: CourseWithContent, progressData: UserProgress[]): Course => {
    const progressMap = new Map(progressData.map(p => [p.lesson_id, p]));
    
    const sections: Section[] = courseData.sections.map((section) => ({
      id: section.id,
      title: section.title,
      order: section.order_index,
      lessons: section.lessons.map((lesson) => {
        const progress = progressMap.get(lesson.id);
        return {
          id: lesson.id,
          title: lesson.title,
          type: validateLessonType(lesson.lesson_type),
          duration: lesson.duration_minutes ? `${lesson.duration_minutes} dk` : '0 dk',
          duration_minutes: lesson.duration_minutes, // Veritabanından gelen değeri koru
          isCompleted: progress?.is_completed || false,
          lastPosition: progress?.last_position_seconds || 0,
          watchTime: progress?.watch_time_seconds || 0,
          order: lesson.order_index
        };
      })
    }));

    const totalLessons = sections.reduce((acc: number, section: Section) => acc + section.lessons.length, 0);
    const completedLessons = sections.reduce((acc: number, section: Section) => 
      acc + section.lessons.filter((lesson: Lesson) => lesson.isCompleted).length, 0
    );
    const totalWatchTime = sections.reduce((acc: number, section: Section) => 
      acc + section.lessons.reduce((lessonAcc: number, lesson: Lesson) => lessonAcc + lesson.watchTime, 0), 0
    );
    
    const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    const courseType = validateCourseType(courseData.course.course_type);

    return {
      id: courseData.course.id,
      title: courseData.course.title,
      instructor: courseData.course.instructor_name || 'Eğitmen',
      progress,
      totalLessons,
      completedLessons,
      totalWatchTime,
      sections,
      course_type: courseType,
      isLive: courseType === 'live' || courseType === 'hybrid',
      live_start_date: courseData.course.live_start_date || null,
      live_end_date: courseData.course.live_end_date || null,
      live_timezone: courseData.course.live_timezone || null,
      duration: courseData.course.duration || '4 hafta'
    };
  }, []);

  // Check certificate status
  const checkCertificateStatus = useCallback(async () => {
    if (!user || !course) return;
    
    try {
      setCertificateLoading(true);
      
      const eligibility = await checkCertificateEligibility(user.id, course.id);
      setCertificateEligible(eligibility.isEligible);
      
      if (eligibility.isEligible || eligibility.existingCertificate) {
        const certificate = await getUserCertificate(user.id, course.id);
        setExistingCertificate(certificate);
      }
      
    } catch (error) {
      console.error('Certificate status check error:', error);
    } finally {
      setCertificateLoading(false);
    }
  }, [user, course]);

  const fetchCourseData = useCallback(async () => {
    if (!user) {
      setError('Please sign in to access this course');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('Starting course data fetch for:', courseSlug);

      const courseData = await getCourseWithContent(courseSlug);
      
      if (!courseData.course) {
        console.log('No course found in data:', courseData);
        setError('Course not found');
        return;
      }

      console.log('Course data loaded:', courseData.course.id);

      console.log('Checking user enrollment status...');
      const enrollRes = await fetch(
        `/api/enrollments/me?courseId=${encodeURIComponent(courseData.course.id)}`
      );
      const enrollJson = await enrollRes.json();
      const enrollmentStatus = {
        isEnrolled: !!enrollJson.isEnrolled,
        welcomeShown: !!enrollJson.welcomeShown,
      };
      console.log('Enrollment status:', enrollmentStatus);

      setIsEnrolled(enrollmentStatus.isEnrolled);

      if (!enrollmentStatus.isEnrolled) {
        console.log('User not enrolled');
        setError(t.enrollmentRequired);
        return;
      }

      // Check if welcome should be shown
      if (!enrollmentStatus.welcomeShown) {
        console.log('Welcome not shown yet, will display welcome screen');
        // Set course data for welcome component
        const transformedCourse = transformCourseData(courseData, []);
        setCourse(transformedCourse);
        setShowWelcome(true);
        return; // Don't load progress data yet
      }

      console.log('Fetching user progress...');
      const progressData = await getUserCourseProgress(user.id, courseData.course.id);
      console.log('User progress data:', progressData);

      console.log('Transforming course data...');
      const transformedCourse = transformCourseData(courseData, progressData);
      console.log('Transformed course:', transformedCourse);
      
      setCourse(transformedCourse);

      if (courseData.sections.length > 0) {
        setExpandedSections({ [courseData.sections[0].id]: true });
      }

      console.log('Course data fetch completed successfully');

    } catch (err) {
      console.error('Course fetch error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseSlug, user, t.enrollmentRequired, transformCourseData]);

  useEffect(() => {
    console.log('Main useEffect triggered:', { isLoaded, user: !!user, courseSlug });
    
    if (isLoaded && user) {
      console.log('User loaded, starting course data fetch');
      fetchCourseData();
    } else if (isLoaded && !user) {
      console.log('No user found after load');
      setError('Please sign in to access this course');
    } else {
      console.log('Waiting for user load:', { isLoaded, hasUser: !!user });
    }
  }, [courseSlug, isLoaded, user, fetchCourseData]);

  useEffect(() => {
    if (course && user) {
      checkCertificateStatus();
    }
  }, [course, user, checkCertificateStatus]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLessonCompletion = async (lessonId: string) => {
    if (!course || !user) return;

    try {
      console.log(`Starting lesson completion process for lesson ${lessonId}`);

      // Önce veritabanında dersi tamamlandı olarak işaretle
      if (user?.id) {
        try {
          const result = await markLessonCompleted(user.id, lessonId);
          console.log('Lesson marked as completed in database:', result);
        } catch (err) {
          console.error('Error marking lesson as completed in database:', err);
        }
      }

      // Ardından UI'daki state'i güncelle
      setCourse(prevCourse => {
        if (!prevCourse) return prevCourse;
        
        const updatedCourse = {
          ...prevCourse,
          sections: prevCourse.sections.map(section => ({
            ...section,
            lessons: section.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, isCompleted: true }
                : lesson
            )
          }))
        };

        const totalLessons = updatedCourse.sections.reduce((acc, section) => acc + section.lessons.length, 0);
        const completedLessons = updatedCourse.sections.reduce((acc, section) => 
          acc + section.lessons.filter(lesson => lesson.isCompleted).length, 0
        );
        const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
        
        console.log(`Progress updated: ${completedLessons}/${totalLessons} lessons completed (${progress}%)`);
        
        // Kurs ilerleme yüzdesini veritabanında da güncelle
        if (user?.id && course?.id) {
          fetch('/api/enrollments', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: course.id, progressPercentage: progress }),
          })
            .then((r) => r.json())
            .then((result) => console.log('Course progress updated in database:', result))
            .catch((err) => console.error('Error updating course progress in database:', err));
        }
        
        return {
          ...updatedCourse,
          progress,
          completedLessons
        };
      });

      setSelectedLesson(prevLesson => 
        prevLesson && prevLesson.id === lessonId 
          ? { ...prevLesson, isCompleted: true }
          : prevLesson
      );

      setTimeout(() => {
        checkCertificateStatus();
      }, 1000);

      console.log(`Lesson ${lessonId} marked as completed in UI`);
    } catch (error) {
      console.error('Error updating lesson completion in UI:', error);
    }
  };

  const handleEnrollNow = async () => {
    if (!user || !course) return;

    try {
      setEnrollmentLoading(true);
      console.log('Starting enrollment process...');
      
      const resultRes = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      const result = await resultRes.json();
      console.log('Enrollment result:', result);

      if (result.success) {
        setIsEnrolled(true);
        setError(null);
        await fetchCourseData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to enroll in course');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleWelcomeComplete = async (preferences: UserPreferences) => {
    console.log('Welcome completed with preferences:', preferences);
    
    if (!user || !course) {
      console.error('Missing user or course data for welcome completion');
      return;
    }

    try {
      // Mark welcome as shown in database
      const welcomeRes = await fetch('/api/enrollments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, welcomeShown: true }),
      });
      const welcomeJson = await welcomeRes.json();
      const success = !!welcomeJson.success;
      
      if (success) {
        console.log('Welcome marked as shown in database');
        setShowWelcome(false);
        
        // Now load the full course data with progress
        console.log('Loading full course data after welcome...');
        const progressData = await getUserCourseProgress(user.id, course.id);
        const courseData = await getCourseWithContent(courseSlug);
        const transformedCourse = transformCourseData(courseData, progressData);
        setCourse(transformedCourse);
        
        if (courseData.sections.length > 0) {
          setExpandedSections({ [courseData.sections[0].id]: true });
        }
      } else {
        console.error('Failed to mark welcome as shown');
        // Still proceed to avoid blocking user
        setShowWelcome(false);
      }
    } catch (error) {
      console.error('Error completing welcome:', error);
      // Still proceed to avoid blocking user
      setShowWelcome(false);
    }
  };

  const handleLessonSelect = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setActiveView('content');
    
    if (window.innerWidth >= 1024) {
      setRightSidebarOpen(true);
    }
    
    if (window.innerWidth < 1024) {
      setLeftSidebarOpen(false);
    }
  };

  const handleViewChange = (view: 'content' | 'analytics') => {
    setActiveView(view);
    
    if (view === 'analytics') {
      setRightSidebarOpen(false);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const handleLeftSidebarToggle = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const handleRightSidebarToggle = () => {
    setRightSidebarOpen(!rightSidebarOpen);
    
    if (!rightSidebarOpen) {
      setActiveView('content');
    }
  };

  const handleProgress = (progress: number) => {
    console.log('Progress update:', progress);
  };

  const handleNoteCreate = (note: string) => {
    console.log('Note created:', note);
  };

  const renderCertificateCard = () => {
    if (certificateLoading) {
      return (
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm animate-pulse">
          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
        </div>
      );
    }

    if (existingCertificate) {
      return (
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  🎉 Tebrikler! Sertifikanız Hazır
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  Kursu başarıyla tamamladınız ve sertifikanızı aldınız
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-amber-950/50 rounded-lg p-4 border border-amber-200/50 dark:border-amber-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Sertifika Numarası
                  </p>
                  <p className="text-xs font-mono text-amber-700 dark:text-amber-300 mt-1">
                    {existingCertificate.certificate_number}
                  </p>
                </div>
                <button
                  onClick={() => {
                    const url = `https://certificates.myunilab.net/${existingCertificate.certificate_number}`;
                    if (url.startsWith('https://certificates.myunilab.net/')) {
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Sertifikayı Görüntüle</span>
                </button>
              </div>
            </div>
            
            <div className="text-xs text-amber-700 dark:text-amber-300">
              Sertifikanızı LinkedIn ve diğer platformlarda paylaşabilirsiniz
            </div>
          </div>
        </div>
      );
    }

    if (certificateEligible || (course && course.progress === 100)) {
      return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                  🎯 Sertifika Almaya Hazırsınız!
                </h3>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Tüm gereksinimleri tamamladınız. Sertifikanızı almak için bir ders seçin.
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-green-950/50 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✅ Tüm dersler tamamlandı
                  </p>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    ✅ Sınavlar başarıyla geçildi
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">100%</div>
                  <div className="text-xs text-green-700 dark:text-green-300">Tamamlandı</div>
                </div>
              </div>
            </div>
            
            <div className="text-xs text-green-700 dark:text-green-300">
              Sol bölümden sertifikanızı alabilirsiniz.
            </div>
          </div>
        </div>
      );
    }

    if (course && course.progress > 70) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  🚀 Sertifikaya Çok Yakınsınız!
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Kursu tamamladığınızda dijital sertifikanızı alabileceksiniz
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-900 dark:text-blue-100">Genel İlerleme</span>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{course.progress}%</span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {course.totalLessons - course.completedLessons} ders daha kaldı
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const renderMainContent = () => {
    if (!isEnrolled) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-xl">🔒</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-neutral-100 mb-2">
                {t.notEnrolled}
              </h3>
              <p className="text-slate-600 dark:text-neutral-400 mb-6">{t.enrollmentRequired}</p>
              <button
                onClick={handleEnrollNow}
                disabled={enrollmentLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enrollmentLoading ? t.enrolling : 'Kursa Kayıt Ol'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'analytics') {
      return (
        <MyUNIAnalytics 
          courseId={course?.id || ''} 
          userId={user?.id || ''}
          texts={t}
        />
      );
    }

    if (!selectedLesson) {
      return (
        <div className="h-full p-2 lg:p-2">
          <div className="mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700">
                    <span>🎓</span>
                    <span>Öğrenme Deneyimine Hoş Geldiniz</span>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {t.welcomeBack}
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
                      Kursunuza hoş geldiniz! Öğrenme yolculuğunuza başlamak için sol menüden bir ders seçin ve sağ panelden AI asistanı ile konuşun.
                    </p>
                  </div>

                  <div className="w-12 h-px bg-[#990000] dark:bg-white"></div>
                </div>

                {course && (
                  <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                      Kurs İlerlemesi
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-[#990000] dark:text-white">
                          {course.progress}%
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                          Tamamlandı
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                          {course.completedLessons}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                          Tamamlanan Ders
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                          {course.totalLessons}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                          Toplam Ders
                        </div>
                      </div>
                    </div>

                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                      <div 
                        className="bg-[#990000] dark:bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {renderCertificateCard()}

                {course?.isLive && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mt-1">
                        <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          Canlı Eğitim Erişim Bilgileri
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          Satın aldığınız canlı eğitime erişim bilgileriniz, e-posta adresinize gönderilecektir.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      Sol Menüden Ders Seçin
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Farklı içerik türlerini keşfedin ve öğrenme tarzınıza uygun olanı seçin.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-[#990000] dark:text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Video Dersler</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">İnteraktif video içerikleri</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#990000] dark:text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Ders Notları</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Detaylı materyaller ve dökümanlar</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#990000] dark:text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Quiz & Testler</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">İnteraktif testler ve değerlendirme</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      AI Asistan Sistemi
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Sağ panelden AI destekli öğrenme asistanını kullanın.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#990000]/10 dark:bg-white/10 rounded-lg flex items-center justify-center mt-1">
                          <Bot className="w-4 h-4 text-[#990000] dark:text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            Anlık Soru-Cevap
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Ders sırasında aklınıza gelen soruları AI asistanına sorun.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-[#990000]/10 dark:bg-white/10 rounded-lg flex items-center justify-center mt-1">
                          <PlusCircle className="w-4 h-4 text-[#990000] dark:text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            Kişiselleştirilmiş Öneriler
                          </div>
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            Size özel öneriler ve öğrenme stratejileri alın.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Platform Özellikleri
                  </h3>

                  <div className="space-y-3">
                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#990000] dark:bg-white rounded-full"></div>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-sm">Otomatik İlerleme Takibi</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 ml-5">
                        Dersler otomatik olarak tamamlandı işaretlenir
                      </p>
                    </div>

                    <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200/50 dark:border-neutral-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-[#990000] dark:bg-white rounded-full"></div>
                        <span className="text-neutral-900 dark:text-neutral-100 font-medium text-sm">AI Destekli Öğrenme</span>
                      </div>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 ml-5">
                        Kişisel asistan ile interaktif öğrenme deneyimi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 rounded-xl p-6 border border-neutral-200 dark:border-neutral-600">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#990000] dark:bg-white rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-white dark:text-black" />
                      </div>
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                        İlerleme Analizi
                      </h3>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-sm">
                      Detaylı analytics ile öğrenme performansınızı analiz edin.
                    </p>
                    <button
                      onClick={() => setActiveView('analytics')}
                      className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#990000] dark:bg-white hover:bg-[#770000] dark:hover:bg-neutral-200 text-white dark:text-black rounded-lg transition-colors font-medium text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics Görüntüle</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    switch (selectedLesson.type) {
      case 'video':
        return (
          <MyUNIVideo 
            lessonId={selectedLesson.id}
            userId={user?.id || ''}
            onProgress={handleProgress}
            onComplete={async () => {
              console.log('Video completed, updating sidebar...');
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'notes':
        return (
          <MyUNINotes 
            lessonId={selectedLesson.id}
            userId={user?.id || ''}
            lessonDurationMinutes={selectedLesson.duration_minutes}
            onNoteCreate={handleNoteCreate}
            onComplete={async () => {
              console.log('Notes completed, updating sidebar...');
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'quick':
        return (
          <MyUNIQuick 
            lessonId={selectedLesson.id}
            userId={user?.id || ''}
            onComplete={async (score) => {
              console.log(`Quick completed with score ${score}, updating sidebar...`);
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'mixed':
        return (
          <MixedContent 
            lessonId={selectedLesson.id}
            userId={user?.id || ''}
            onProgress={handleProgress}
            onComplete={async () => {
              console.log('Mixed content completed, updating sidebar...');
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      default:
        return (
          <MyUNIVideo 
            lessonId={selectedLesson.id}
            userId={user?.id || ''}
            onProgress={handleProgress}
            onComplete={async () => {
              console.log('Video completed, updating sidebar...');
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
    }
  };

  if (!isLoaded) {
    console.log('User not loaded yet');
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-neutral-200 dark:border-neutral-700 rounded-full animate-spin border-t-[#990000]"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Kullanıcı bilgileri alınıyor
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Lütfen bekleyiniz...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    console.log('Loading course data...');
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-neutral-200 dark:border-neutral-700 rounded-full animate-spin border-t-[#990000]"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Kurs içeriği yükleniyor
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Dersler ve materyaller hazırlanıyor...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && error !== t.enrollmentRequired) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white dark:bg-neutral-900 flex relative overflow-hidden">
      {showWelcome && user && (
        <PersonalizedWelcome
          userName={user.fullName || user.firstName || 'Öğrenci'}
          onComplete={handleWelcomeComplete}
        />
      )}

      {course && (
        <CourseSidebar
          course={course}
          selectedLesson={selectedLesson}
          activeView={activeView}
          sidebarOpen={leftSidebarOpen}
          expandedSections={expandedSections}
          onLessonSelect={handleLessonSelect}
          onViewChange={handleViewChange}
          onSidebarClose={() => setLeftSidebarOpen(false)}
          onSectionToggle={handleSectionToggle}
          userId={user?.id}
          texts={t}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <CourseHeader
          selectedLesson={selectedLesson}
          activeView={activeView}
          rightSidebarOpen={rightSidebarOpen}
          onLeftSidebarToggle={handleLeftSidebarToggle}
          onRightSidebarToggle={handleRightSidebarToggle}
          texts={t}
        />

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6">
            {renderMainContent()}
          </div>
        </div>
      </div>

      {isEnrolled && (
        <AIChatSidebar
          selectedLesson={selectedLesson}
          sidebarOpen={rightSidebarOpen}
          onSidebarClose={() => setRightSidebarOpen(false)}
          userId={user?.id || ''}
          texts={t}
        />
      )}

      {(leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}