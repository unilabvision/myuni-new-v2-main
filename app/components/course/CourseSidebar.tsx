// components/course/CourseSidebar.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  FileText, 
  Zap, 
  ChevronRight, 
  ChevronDown, 
  Clock,
  CheckCircle,
  Circle,
  X,
  Filter,
  Search,
  RotateCcw,
  Award,
  ExternalLink,
  Target
} from 'lucide-react';

import { 
  checkCertificateEligibility, 
  getUserCertificate, 
  generateCertificateWithProgress 
} from '../../../lib/certificateService';

import { Course, Lesson } from '../../../lib/types/course';
import { getUserCourseProgress } from '../../../lib/courseService';

declare global {
  interface Window {
    Clerk?: {
      user?: {
        firstName?: string;
        lastName?: string;
        emailAddresses?: Array<{
          emailAddress: string;
        }>;
      };
    };
  }
}

interface CourseSidebarProps {
  course: Course;
  selectedLesson: Lesson | null;
  activeView: 'content' | 'analytics';
  sidebarOpen: boolean;
  expandedSections: { [key: string]: boolean };
  onLessonSelect: (lesson: Lesson) => void;
  onViewChange: (view: 'content' | 'analytics') => void;
  onSidebarClose: () => void;
  onSectionToggle: (sectionId: string) => void;
  userId?: string;
  texts: {
    instructor: string;
    progress: string;
    courseContent: string;
    analytics: string;
    myuniVideo: string;
    myuniNotes: string;
    myuniQuick: string;
    mixed: string;
  };
  onProgressUpdate?: () => void;
  progressUpdateTrigger?: number;
}

interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  status: 'active' | 'revoked';
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string;
}

type FilterType = 'all' | 'completed' | 'incomplete' | 'video' | 'notes' | 'quick' | 'mixed';

// Utility functions
const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[<>\"'&]/g, '').trim();
};

const isValidCertificateNumber = (certNumber: string): boolean => {
  if (!certNumber || typeof certNumber !== 'string') return false;
  
  const cleanNumber = certNumber.trim().toUpperCase();
  const patterns = [
    /^MUNI\d{4}-\d{6}-\d{4}-[A-Z]{3}-[A-Z0-9]{5}(-\d+)?$/,
    /^MUNI-\d{4}-\d{6}-\d{4}-[A-Z]{3}-[A-Z0-9]{5}(-\d+)?$/,
    /^MUNI_\d{9,12}$/,
    /^CERT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    /^[A-Z0-9\-_]{8,50}$/
  ];
  
  return patterns.some(pattern => pattern.test(cleanNumber));
};

const sendCertificateCompletionEmail = async (
  userEmail: string,
  userName: string,
  courseName: string,
  certificateNumber: string,
  certificateUrl: string,
  locale: string = 'tr'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/send-certificate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: userEmail.trim(),
        userName: userName.trim(),
        courseName: courseName.trim(),
        certificateNumber: certificateNumber.trim(),
        certificateUrl: certificateUrl,
        locale: locale,
        itemType: 'course'
      }),
    });

    const result = await response.json();
    return response.ok && result.success 
      ? { success: true } 
      : { success: false, error: result.error || 'Email gönderim hatası' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Email gönderilemedi' 
    };
  }
};

export default function CourseSidebar({
  course,
  selectedLesson,
  activeView,
  sidebarOpen,
  expandedSections,
  onLessonSelect,
  onViewChange,
  onSidebarClose,
  onSectionToggle,
  userId,
  texts,
  onProgressUpdate,
  progressUpdateTrigger
}: CourseSidebarProps) {
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Certificate states
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [existingCertificate, setExistingCertificate] = useState<Certificate | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [certificateSectionExpanded, setCertificateSectionExpanded] = useState(false);
  const [certificateChecked, setCertificateChecked] = useState(false);
  const [lastCheckProgress, setLastCheckProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Progress states
  const [lessonProgressMap, setLessonProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [progressLoading, setProgressLoading] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Mobile states
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load user progress
  const loadUserProgress = useCallback(async () => {
    if (!userId || !course?.id || progressLoading) return;

    try {
      setProgressLoading(true);
      console.log('🔄 Loading user progress for course:', course.id);

      const progressData = await getUserCourseProgress(userId, course.id);
      const progressMap = new Map<string, LessonProgress>();
      
      progressData.forEach(progress => {
        progressMap.set(progress.lesson_id, {
          lesson_id: progress.lesson_id,
          is_completed: progress.is_completed,
          watch_time_seconds: progress.watch_time_seconds,
          last_position_seconds: progress.last_position_seconds,
          completed_at: progress.completed_at
        });
      });

      setLessonProgressMap(progressMap);
      setLastProgressUpdate(Date.now());
      
      console.log('✅ Progress data loaded:', progressMap.size, 'lessons');
      
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('❌ Error loading user progress:', error);
    } finally {
      setProgressLoading(false);
    }
  }, [userId, course?.id, progressLoading, onProgressUpdate]);

  // Progress trigger effect
  useEffect(() => {
    if (progressUpdateTrigger && progressUpdateTrigger !== lastProgressUpdate) {
      console.log('🔄 Progress update triggered, reloading...');
      loadUserProgress();
    }
  }, [progressUpdateTrigger, lastProgressUpdate, loadUserProgress]);

  // Initial progress load
  useEffect(() => {
    if (userId && course?.id) {
      loadUserProgress();
    }
  }, [userId, course?.id, loadUserProgress]);

  // Course with progress
  const courseWithProgress = useMemo(() => {
    if (!course || lessonProgressMap.size === 0) return course;

    const updatedSections = course.sections.map(section => {
      const updatedLessons = section.lessons.map(lesson => {
        const progress = lessonProgressMap.get(lesson.id);
        return {
          ...lesson,
          isCompleted: progress?.is_completed || false,
          watchTimeSeconds: progress?.watch_time_seconds || 0,
          lastPositionSeconds: progress?.last_position_seconds || 0,
          completedAt: progress?.completed_at
        };
      });

      return { ...section, lessons: updatedLessons };
    });

    const allLessons = updatedSections.flatMap(section => section.lessons);
    const completedCount = allLessons.filter(lesson => lesson.isCompleted).length;
    const totalCount = allLessons.length;
    const progressPercentage = totalCount > 0 ? 
      Math.min(100, Math.round((completedCount / totalCount) * 100)) : 0;

    return {
      ...course,
      sections: updatedSections,
      progress: progressPercentage,
      completedLessons: completedCount,
      totalLessons: totalCount
    };
  }, [course, lessonProgressMap]);

  // Device detection
  useEffect(() => {
    const checkDevice = () => {
      setIsMobileDevice(window.innerWidth < 1024);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Mobile touch handling
  useEffect(() => {
    if (!isMobileDevice || !sidebarOpen) return;

    const sidebar = sidebarRef.current;
    const backdrop = backdropRef.current;
    if (!sidebar || !backdrop) return;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target && sidebar.contains(e.target as Node)) {
        setTouchStartY(e.touches[0].clientY);
        setIsDragging(false);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartY !== null && e.target && sidebar.contains(e.target as Node)) {
        const diff = Math.abs(e.touches[0].clientY - touchStartY);
        if (diff > 10) setIsDragging(true);
        e.stopPropagation();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging && touchStartY !== null) {
        const target = e.target as Node;
        if (backdrop.contains(target) && !sidebar.contains(target)) {
          onSidebarClose();
        }
      }
      setTouchStartY(null);
      setIsDragging(false);
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobileDevice, sidebarOpen, touchStartY, isDragging, onSidebarClose]);

  // Certificate status check
  const checkCertificateStatus = useCallback(async () => {
    if (!userId || !courseWithProgress) return;
    
    if (typeof userId !== 'string' || userId.length === 0) {
      console.error('Invalid userId provided');
      return;
    }
    
    if (!courseWithProgress.id || typeof courseWithProgress.id !== 'string') {
      console.error('Invalid course ID provided');
      return;
    }
    
    if (certificateChecked && lastCheckProgress === courseWithProgress.progress && !generating) {
      return;
    }
    
    try {
      setCertificateLoading(true);
      
      const eligibility = await checkCertificateEligibility(userId, courseWithProgress.id);
      setCertificateEligible(Boolean(eligibility?.isEligible));
      
      if (eligibility?.isEligible || eligibility?.existingCertificate) {
        const certificate = await getUserCertificate(userId, courseWithProgress.id);
        if (certificate?.certificate_number) {
          if (isValidCertificateNumber(certificate.certificate_number)) {
            setExistingCertificate(certificate);
          } else {
            console.warn('⚠️ Certificate number format unusual but proceeding:', certificate.certificate_number);
            setExistingCertificate(certificate);
          }
        }
      }
      
      setCertificateChecked(true);
      setLastCheckProgress(courseWithProgress.progress);
      
    } catch (error) {
      console.error('Certificate status check error:', error);
      setError('Sertifika durumu kontrol edilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setCertificateLoading(false);
    }
  }, [userId, courseWithProgress, certificateChecked, lastCheckProgress, generating]);

  // Check certificate when needed
  useEffect(() => {
    if (userId && courseWithProgress && !certificateChecked) {
      checkCertificateStatus();
    }
  }, [userId, courseWithProgress, certificateChecked, checkCertificateStatus]);

  // Auto-expand certificate section
  useEffect(() => {
    if (existingCertificate) {
      setCertificateSectionExpanded(true);
    } else if (certificateEligible || courseWithProgress?.progress === 100) {
      setCertificateSectionExpanded(true);
    } else if (courseWithProgress?.progress >= 80 && !certificateSectionExpanded) {
      setCertificateSectionExpanded(true);
    }
  }, [existingCertificate, certificateEligible, courseWithProgress?.progress, certificateSectionExpanded]);

  // Generate certificate
  const handleGenerateCertificate = async () => {
    if (!userId || !courseWithProgress || generating) return;

    if (typeof userId !== 'string' || userId.length === 0) {
      setError('Geçersiz kullanıcı bilgisi');
      return;
    }

    if (!courseWithProgress.id || typeof courseWithProgress.id !== 'string') {
      setError('Geçersiz kurs bilgisi');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setCertificateEligible(false);
      
      const eligibility = await checkCertificateEligibility(userId, courseWithProgress.id);
      
      if (!eligibility?.isEligible) {
        if (!eligibility?.missingRequirements || !Array.isArray(eligibility.missingRequirements)) {
          throw new Error('Sertifika gereksinimleri tamamlanmamış');
        }
        
        const sanitizedRequirements = eligibility.missingRequirements
          .map(req => sanitizeText(req))
          .filter(req => req.length > 0)
          .slice(0, 10);
        
        throw new Error('Sertifika almak için gerekli koşullar tamamlanmamış:\n• ' + sanitizedRequirements.join('\n• '));
      }
      
      // Get user info
      let userFullName = 'Değerli Öğrenci';
      let userEmail = '';
      
      try {
        if (typeof window !== 'undefined' && window.Clerk?.user) {
          const user = window.Clerk.user;
          
          if (user.emailAddresses?.[0]?.emailAddress) {
            const email = user.emailAddresses[0].emailAddress;
            if (email && typeof email === 'string' && email.includes('@')) {
              userEmail = sanitizeText(email);
            }
          }
          
          const firstName = user.firstName ? sanitizeText(user.firstName) : '';
          const lastName = user.lastName ? sanitizeText(user.lastName) : '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          if (fullName && fullName.length >= 2 && fullName.length <= 100) {
            userFullName = fullName;
          } else if (userEmail) {
            const nameFromEmail = sanitizeText(userEmail.split('@')[0].replace(/[._-]/g, ' '));
            if (nameFromEmail.length >= 2 && nameFromEmail.length <= 50) {
              userFullName = nameFromEmail;
            }
          }
        }
      } catch (clerkError) {
        console.log('Client-side Clerk error (using fallback):', clerkError);
      }
      
      // Create certificate data with the correct structure expected by generateCertificateWithProgress
      const certificateData = {
        userId: sanitizeText(userId),
        itemId: sanitizeText(courseWithProgress.id),
        itemType: 'course' as const,
        itemName: sanitizeText(courseWithProgress.title || ''),
        instructorName: sanitizeText(courseWithProgress.instructor || ''),
        duration: sanitizeText(courseWithProgress.duration || '4 hafta'),
        organization: 'MyUNI Eğitim Platformu',
        organizationDescription: 'Dijital eğitim platformu ile kaliteli ve erişilebilir online eğitim hizmetleri sunan öncü eğitim kurumu.',
        instructorBio: `${sanitizeText(courseWithProgress.instructor || '')} - Alanında uzman eğitmen ve sektör profesyoneli.`,
        userFullName: sanitizeText(userFullName)
      };

      if (!certificateData.userId || !certificateData.itemId || !certificateData.itemName || !certificateData.instructorName) {
        throw new Error('Gerekli kurs bilgileri eksik');
      }

      const newCertificate = await generateCertificateWithProgress(certificateData);

      if (!newCertificate?.certificate_number?.trim()) {
        throw new Error('Sertifika oluşturuldu ancak sertifika numarası geçersiz');
      }

      const cleanCertNumber = newCertificate.certificate_number.trim();
      
      if (!isValidCertificateNumber(cleanCertNumber)) {
        console.warn('⚠️ Certificate number has unexpected format but proceeding:', cleanCertNumber);
      }

      const finalCertificate = { ...newCertificate, certificate_number: cleanCertNumber };
      
      // Send email
      if (userEmail) {
        try {
          const certificateUrl = `https://certificates.myunilab.net/${encodeURIComponent(cleanCertNumber)}`;
          const emailResult = await sendCertificateCompletionEmail(
            userEmail, userFullName, certificateData.itemName, cleanCertNumber, certificateUrl, 'tr'
          );

          if (!emailResult.success) {
            setError(`Sertifika oluşturuldu ancak email gönderilemedi: ${emailResult.error}`);
          }
        } catch (emailError) {
          console.warn('⚠️ Email gönderme hatası:', emailError);
          setError('Sertifika oluşturuldu ancak email gönderilemedi.');
        }
      }
      
      setExistingCertificate(finalCertificate);
      setCertificateEligible(false);
      setCertificateChecked(false);
      
    } catch (error) {
      console.error('❌ Sertifika oluşturma hatası:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      setCertificateEligible(true);
      
      if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
        setError('Sertifika oluşturmak için yetki hatası.');
      } else if (errorMessage.includes('gerekli koşullar')) {
        // Check if the user has 100% completion before showing the error
        const progress = courseWithProgress?.progress || 0;
        if (progress >= 100) {
          // For 100% completion, show a more specific error
          setError('Sertifika sistemi şu anda geçici bir sorun yaşıyor. Lütfen daha sonra tekrar deneyin.');
        } else {
          setError('Sertifika alabilmek için tüm dersler tamamlanmalıdır.');
        }
      } else if (errorMessage.includes('Gerekli kurs bilgileri eksik')) {
        setError('Kurs bilgileri eksik. Lütfen sayfayı yenileyin.');
      } else {
        const sanitizedError = sanitizeText(errorMessage).substring(0, 200);
        setError('Sertifika oluşturulamadı: ' + sanitizedError);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate certificate when progress reaches 100%
  useEffect(() => {
    if (courseWithProgress?.progress === 100 && userId && !existingCertificate && !generating && certificateChecked) {
      console.log('🎯 Auto-generating certificate for 100% completion');
      
      // Small delay to ensure all state is properly updated before generating
      const timer = setTimeout(() => {
        handleGenerateCertificate();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [courseWithProgress?.progress, userId, existingCertificate, generating, certificateChecked]);

  // View certificate
  const handleViewCertificate = (certificateNumber: string) => {
    if (!certificateNumber?.trim()) {
      setError('Geçersiz sertifika numarası');
      return;
    }
    
    const cleanNumber = certificateNumber.trim();
    const certificateUrl = `https://certificates.myunilab.net/${encodeURIComponent(cleanNumber)}`;
    
    try {
      const url = new URL(certificateUrl);
      if (url.protocol === 'https:' && url.hostname === 'certificates.myunilab.net') {
        window.open(certificateUrl, '_blank', 'noopener,noreferrer');
      } else {
        setError('Sertifika URL\'si doğrulanamadı');
      }
    } catch {
      setError('Sertifika URL\'si oluşturulamadı');
    }
  };

  // Helper functions
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />;
      case 'notes': return <FileText className="w-4 h-4" />;
      case 'quick': return <Zap className="w-4 h-4" />;
      case 'mixed': return <div className="flex space-x-1"><Play className="w-3 h-3" /><FileText className="w-3 h-3" /></div>;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return texts.myuniVideo;
      case 'notes': return texts.myuniNotes;
      case 'quick': return texts.myuniQuick;
      case 'mixed': return texts.mixed;
      default: return type;
    }
  };

  const getCertificateStatus = () => {
    if (existingCertificate) {
      return {
        status: 'completed',
        icon: Award,
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeText: 'Hazır',
        badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30'
      };
    }
    
    if (certificateEligible || courseWithProgress?.progress === 100) {
      return {
        status: 'eligible',
        icon: Award,
        iconColor: 'text-green-600 dark:text-green-400',
        badgeText: 'Uygun',
        badgeColor: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      };
    }
    
    if (courseWithProgress?.progress >= 70) {
      return {
        status: 'close',
        icon: Target,
        iconColor: 'text-orange-600 dark:text-orange-400',
        badgeText: 'Yakın',
        badgeColor: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30'
      };
    }
    
    return {
      status: 'in_progress',
      icon: Circle,
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeText: `%${Math.min(100, Math.max(0, courseWithProgress?.progress || 0))}`,
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeText(e.target.value).substring(0, 100);
    setSearchTerm(sanitizedValue);
  };

  // Filter sections
  const filteredSections = useMemo(() => {
    if (!courseWithProgress) return [];

    return courseWithProgress.sections.map(section => {
      const filteredLessons = section.lessons.filter(lesson => {
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const lessonTitle = (lesson.title || '').toLowerCase();
          if (!lessonTitle.includes(searchLower)) return false;
        }

        switch (activeFilter) {
          case 'completed': return Boolean(lesson.isCompleted);
          case 'incomplete': return !lesson.isCompleted;
          case 'video': return lesson.type === 'video';
          case 'notes': return lesson.type === 'notes';
          case 'quick': return lesson.type === 'quick';
          case 'mixed': return lesson.type === 'mixed';
          case 'all':
          default: return true;
        }
      });

      return { ...section, lessons: filteredLessons };
    }).filter(section => section.lessons.length > 0);
  }, [courseWithProgress, activeFilter, searchTerm]);

  // Filter stats
  const filterStats = useMemo(() => {
    if (!courseWithProgress) return {
      all: 0, completed: 0, incomplete: 0, video: 0, notes: 0, quick: 0, mixed: 0
    };

    const allLessons = courseWithProgress.sections.flatMap(section => section.lessons);
    return {
      all: allLessons.length,
      completed: allLessons.filter(lesson => lesson.isCompleted).length,
      incomplete: allLessons.filter(lesson => !lesson.isCompleted).length,
      video: allLessons.filter(lesson => lesson.type === 'video').length,
      notes: allLessons.filter(lesson => lesson.type === 'notes').length,
      quick: allLessons.filter(lesson => lesson.type === 'quick').length,
      mixed: allLessons.filter(lesson => lesson.type === 'mixed').length,
    };
  }, [courseWithProgress]);

  const filters = [
    { key: 'all', label: 'Tümü', count: filterStats.all, icon: null },
    { key: 'incomplete', label: 'Devam Eden', count: filterStats.incomplete, icon: <Circle className="w-3 h-3" /> },
    { key: 'completed', label: 'Tamamlanan', count: filterStats.completed, icon: <CheckCircle className="w-3 h-3" /> },
    { key: 'video', label: 'Video', count: filterStats.video, icon: <Play className="w-3 h-3" /> },
    { key: 'notes', label: 'Notlar', count: filterStats.notes, icon: <FileText className="w-3 h-3" /> },
    { key: 'quick', label: 'Quiz', count: filterStats.quick, icon: <Zap className="w-3 h-3" /> },
  ];

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setActiveFilter('all');
    setSearchTerm('');
    setShowFilters(false);
  };

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (!isMobileDevice && e.target === e.currentTarget) {
      onSidebarClose();
    }
  }, [isMobileDevice, onSidebarClose]);

  const certificateStatus = getCertificateStatus();
  const displayCourse = courseWithProgress || course;

  // Certificate section render
  const renderCertificateSection = () => {
    if (certificateLoading && !certificateChecked) {
      return (
        <div className="flex items-center space-x-3 animate-pulse">
          <div className="w-5 h-5 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="flex-1">
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-1"></div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded w-2/3"></div>
          </div>
        </div>
      );
    }

    if (generating) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="flex-1">
              <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                Sertifikanız Oluşturuluyor... ⚡
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                Bu işlem birkaç saniye sürebilir
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (existingCertificate) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-900 dark:text-amber-100 text-sm">
                Sertifikanız Hazır! 🎉
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                Email olarak da gönderildi
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-amber-950/50 rounded p-3 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                  Sertifika No:
                </p>
                <p className="text-xs font-mono text-amber-700 dark:text-amber-300">
                  {existingCertificate.certificate_number}
                </p>
              </div>
              <button
                onClick={() => handleViewCertificate(existingCertificate.certificate_number)}
                className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Görüntüle</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (certificateEligible || courseWithProgress?.progress === 100) {
      // Different UI for 100% progress - will auto-generate
      if (courseWithProgress?.progress === 100) {
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                  Sertifikanız Hazırlanıyor! 🎯
                </p>
                <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                  %100 tamamlandı - Sertifikanız otomatik olarak oluşturulacak
                </p>
              </div>
            </div>
            <div className="w-full flex items-center justify-center p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-xs text-blue-800 dark:text-blue-200">Sertifika oluşturuluyor...</span>
              </div>
            </div>
          </div>
        );
      }
      
      // Regular UI for eligible but not 100%
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                Sertifika Almaya Hazırsınız! 🎯
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                Tüm gereksinimleri tamamladınız
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateCertificate}
            disabled={generating}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded transition-colors disabled:cursor-not-allowed text-sm"
          >
            <Award className="w-4 h-4" />
            <span>Sertifikamı Al</span>
          </button>
        </div>
      );
    }

    if (courseWithProgress?.progress >= 70) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div className="flex-1">
              <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                Sertifikaya Çok Yakınsınız! 🔥
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
                Kalan dersleri tamamlayın
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-orange-950/50 rounded p-3 border border-orange-200 dark:border-orange-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-900 dark:text-orange-100">İlerleme</span>
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  {Math.min(100, Math.max(0, courseWithProgress?.progress || 0))}%
                </span>
              </div>
              <div className="w-full bg-orange-100 dark:bg-orange-800/30 rounded-full h-1.5">
                <div 
                  className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, courseWithProgress?.progress || 0))}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <Circle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
              Sertifika Yolunda İlerleyin! 🚀
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
              Ders videolarını ve sınavları tamamlayın
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-blue-950/50 rounded p-3 border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-900 dark:text-blue-100">İlerleme</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {Math.min(100, Math.max(0, courseWithProgress?.progress || 0))}%
              </span>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, courseWithProgress?.progress || 0))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300">
                {courseWithProgress?.completedLessons || 0} / {courseWithProgress?.totalLessons || 0} ders
              </span>
              <span className="text-blue-700 dark:text-blue-300">Hedef: %100</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgb(209 213 219) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(209 213 219);
          border-radius: 3px;
        }
        .dark .custom-scrollbar {
          scrollbar-color: rgb(75 85 99) transparent;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgb(75 85 99);
        }
      `}</style>
      
      {/* Backdrop */}
      {sidebarOpen && (
        <div 
          ref={backdropRef}
          className="fixed inset-0 bg-black/20 z-40 lg:hidden transition-opacity duration-300"
          onClick={handleBackdropClick}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget && !isDragging) {
              onSidebarClose();
            }
          }}
        />
      )}
      
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed left-0 top-0 h-screen w-80 z-50 lg:relative lg:z-auto lg:h-full transition-transform duration-300 ease-out bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden`}
      >
      
        {/* Header */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-medium text-neutral-900 dark:text-neutral-100 text-lg truncate pr-2">
              {sanitizeText(displayCourse.title || '')}
            </h1>
            <button 
              onClick={onSidebarClose}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors lg:hidden flex-shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <p className="text-neutral-600 dark:text-neutral-400 truncate">
              {texts.instructor}: {sanitizeText(displayCourse.instructor || '')}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">{texts.progress}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                %{Math.min(100, Math.max(0, displayCourse.progress || 0))}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, displayCourse.progress || 0))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-shrink-0 flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <button
            onClick={() => onViewChange('content')}
            className={`flex-1 px-3 lg:px-4 py-3 text-sm font-medium transition-colors ${
              activeView === 'content'
                ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <span className="truncate">{texts.courseContent}</span>
          </button>
          <button
            onClick={() => onViewChange('analytics')}
            className={`flex-1 px-3 lg:px-4 py-3 text-sm font-medium transition-colors ${
              activeView === 'analytics'
                ? 'text-neutral-900 dark:text-neutral-100 border-b-2 border-neutral-900 dark:border-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <span className="truncate">{texts.analytics}</span>
          </button>
        </div>

        {/* Filters and Search */}
        {activeView === 'content' && (
          <div className="flex-shrink-0 p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Ders ara..."
                value={searchTerm}
                onChange={handleSearchChange}
                maxLength={100}
                className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  activeFilter !== 'all' || showFilters
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>Filtrele</span>
                {activeFilter !== 'all' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </button>

              {(activeFilter !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="p-2 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  title="Filtreleri temizle"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-2">
                {filters.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => handleFilterChange(filter.key as FilterType)}
                    className={`flex items-center justify-between p-2 text-xs rounded transition-colors ${
                      activeFilter === filter.key
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-600'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 flex-1">
                      {filter.icon}
                      <span className="truncate font-medium">{filter.label}</span>
                    </div>
                    <span className="text-xs font-bold ml-1">{filter.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content List */}
        {activeView === 'content' && (
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
            {filteredSections.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Ders bulunamadı
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {searchTerm 
                    ? `"${searchTerm}" araması için sonuç bulunamadı`
                    : 'Bu filtre için ders bulunamadı'
                  }
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-3 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <div className="pb-6">
                {/* Course Sections */}
                {filteredSections.map((section) => (
                  <div key={section.id} className="border-b border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => onSectionToggle(section.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-2">
                          {sanitizeText(section.title || '')}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded">
                          {section.lessons.length}
                        </span>
                      </div>
                      {expandedSections[section.id] ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedSections[section.id] && (
                      <div className="bg-neutral-50 dark:bg-neutral-800">
                        {section.lessons.map((lesson) => (
                          <button
                            key={lesson.id}
                            onClick={() => onLessonSelect(lesson)}
                            className={`w-full flex items-center space-x-3 p-4 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                              selectedLesson?.id === lesson.id ? 'bg-neutral-100 dark:bg-neutral-700 border-l-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex-shrink-0">
                              {lesson.isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                {getContentIcon(lesson.type)}
                                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                  {getContentTypeLabel(lesson.type)}
                                </span>
                              </div>
                              <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm truncate">
                                {sanitizeText(lesson.title || '')}
                              </p>
                              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span>{sanitizeText(lesson.duration || '')}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Certificate Section */}
                {userId && (
                  <div className="border-b border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => setCertificateSectionExpanded(!certificateSectionExpanded)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          <certificateStatus.icon className={`w-4 h-4 ${certificateStatus.iconColor}`} />
                          <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-2">
                            Sertifika
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${certificateStatus.badgeColor}`}>
                          {certificateStatus.badgeText}
                        </span>
                      </div>
                      {certificateSectionExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {certificateSectionExpanded && (
                      <div className="bg-neutral-50 dark:bg-neutral-800 p-4">
                        {error && (
                          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                          </div>
                        )}
                        {renderCertificateSection()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <div className="w-6 h-6 bg-neutral-400 dark:bg-neutral-500 rounded"></div>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Analitik veriler sağ panelde gösterilecektir.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}