// components/event/EventSidebar.tsx
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
  Target,
  Calendar,
  MapPin
} from 'lucide-react';

import { 
  checkEventCertificateEligibility, 
  getUserEventCertificate, 
  generateCertificateWithProgress 
} from '../../../lib/certificateService';

import { getUserEventProgress } from '../../../lib/eventService';

// Updated types to match EventWatchPage
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'notes' | 'quick' | 'mixed';
  duration: string;
  isCompleted: boolean;
  lastPosition: number;
  watchTime: number;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Event {
  id: string;
  title: string;
  organizer: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  sections: Section[];
  event_type?: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  is_online?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  location_name?: string | null;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  duration?: string;
}

interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  event_id: string; // Updated to event_id for event certificates
  item_type?: string;
}

// Updated interface to match new table structure
interface LessonProgress {
  section_id: string; // Changed from lesson_id to section_id
  is_completed: boolean;
  watch_time_seconds: number;
  last_position_seconds: number;
  completed_at?: string | null; // Allow null for completed_at
}

interface EventSidebarProps {
  event: Event;
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
    organizer: string;
    progress: string;
    eventContent: string;
    analytics: string;
    myuniVideo: string;
    myuniNotes: string;
    myuniQuick: string;
    mixed: string;
    workshop: string;
    seminar: string;
    conference: string;
    meetup: string;
    webinar: string;
    online: string;
    inPerson: string;
    upcoming: string;
    ongoing: string;
    completed: string;
    cancelled: string;
  };
  onProgressUpdate?: () => void;
  progressUpdateTrigger?: number;
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
  eventName: string,
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
        eventName: eventName.trim(),
        certificateNumber: certificateNumber.trim(),
        certificateUrl: certificateUrl,
        locale: locale,
        itemType: 'event'
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

export default function EventSidebar({
  event,
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
}: EventSidebarProps) {
  
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

  // Progress states - updated to use section_id mapping
  const [sectionProgressMap, setSectionProgressMap] = useState<Map<string, LessonProgress>>(new Map());
  const [progressLoading, setProgressLoading] = useState(false);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  // Mobile states
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Load user progress - updated for new table structure
  const loadUserProgress = useCallback(async () => {
    if (!userId || !event?.id || progressLoading) return;

    try {
      setProgressLoading(true);

      const progressData = await getUserEventProgress(userId, event.id);
      const progressMap = new Map<string, LessonProgress>();
      
      // Map progress data using section_id
      progressData.forEach(progress => {
        progressMap.set(progress.section_id, {
          section_id: progress.section_id,
          is_completed: progress.is_completed,
          watch_time_seconds: progress.watch_time_seconds,
          last_position_seconds: progress.last_position_seconds,
          completed_at: progress.completed_at || null
        });
      });

      setSectionProgressMap(progressMap);
      setLastProgressUpdate(Date.now());
      
      if (onProgressUpdate) {
        onProgressUpdate();
      }
    } catch (error) {
      console.error('❌ Error loading user event progress:', error);
    } finally {
      setProgressLoading(false);
    }
  }, [userId, event?.id, progressLoading, onProgressUpdate]);

  // Progress trigger effect
  useEffect(() => {
    if (progressUpdateTrigger && progressUpdateTrigger !== lastProgressUpdate) {
      loadUserProgress();
    }
  }, [progressUpdateTrigger, lastProgressUpdate, loadUserProgress]);

  // Initial progress load
  useEffect(() => {
    if (userId && event?.id) {
      loadUserProgress();
    }
  }, [userId, event?.id, loadUserProgress]);

  // Event with progress - updated to use section progress mapping
  const eventWithProgress = useMemo(() => {
    if (!event || sectionProgressMap.size === 0) return event;

    const updatedSections = event.sections.map(section => {
      // For events, section.id maps to section_id in progress table
      const progress = sectionProgressMap.get(section.id);
      
      // For events, each section typically has one lesson that represents the section content
      const updatedLessons = section.lessons.map(lesson => {
        // Use the section progress for the lesson since in events, lessons are really just section representations
        return {
          ...lesson,
          isCompleted: progress?.is_completed || false,
          watchTime: progress?.watch_time_seconds || 0,
          lastPosition: progress?.last_position_seconds || 0,
          completedAt: progress?.completed_at || null
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
      ...event,
      sections: updatedSections,
      progress: progressPercentage,
      completedLessons: completedCount,
      totalLessons: totalCount
    };
  }, [event, sectionProgressMap]);

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

    // Otomatik scroll özelliği kaldırıldı - sorun çözülmesi için

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
  }, [isMobileDevice, sidebarOpen, touchStartY, isDragging, onSidebarClose, certificateSectionExpanded]);

  // Certificate status check
  const checkCertificateStatus = useCallback(async () => {
    if (!userId || !eventWithProgress) return;
    
    if (typeof userId !== 'string' || userId.length === 0) {
      console.error('Invalid userId provided');
      return;
    }
    
    if (!eventWithProgress.id || typeof eventWithProgress.id !== 'string') {
      console.error('Invalid event ID provided');
      return;
    }
    
    if (certificateChecked && lastCheckProgress === eventWithProgress.progress && !generating) {
      return;
    }
    
    try {
      setCertificateLoading(true);
      
      const eligibility = await checkEventCertificateEligibility(userId, eventWithProgress.id);
      setCertificateEligible(Boolean(eligibility?.isEligible));
      
      if (eligibility?.isEligible || eligibility?.existingCertificate) {
        const certificate = await getUserEventCertificate(userId, eventWithProgress.id);
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
      setLastCheckProgress(eventWithProgress.progress);
      
    } catch (error) {
      console.error('Certificate status check error:', error);
      setError('Sertifika durumu kontrol edilemedi. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setCertificateLoading(false);
    }
  }, [userId, eventWithProgress, certificateChecked, lastCheckProgress, generating]);

  // Check certificate when needed
  useEffect(() => {
    if (userId && eventWithProgress && !certificateChecked) {
      checkCertificateStatus();
    }
  }, [userId, eventWithProgress, certificateChecked, checkCertificateStatus]);

  // Auto-expand certificate section
  useEffect(() => {
    if (existingCertificate) {
      setCertificateSectionExpanded(true);
    } else if (certificateEligible || eventWithProgress?.progress >= 70) {
      setCertificateSectionExpanded(true);
    } else if (eventWithProgress?.progress >= 50 && !certificateSectionExpanded) {
      setCertificateSectionExpanded(true);
    }
    
    // Otomatik scroll özelliğini kaldırdık - sorun çözülmesi için
  }, [existingCertificate, certificateEligible, eventWithProgress?.progress, certificateSectionExpanded, isMobileDevice]);

  // Generate certificate
  const handleGenerateCertificate = async () => {
    if (!userId || !eventWithProgress || generating) return;

    if (typeof userId !== 'string' || userId.length === 0) {
      setError('Geçersiz kullanıcı bilgisi');
      return;
    }

    if (!eventWithProgress.id || typeof eventWithProgress.id !== 'string') {
      setError('Geçersiz etkinlik bilgisi');
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      setCertificateEligible(false);
      
      const eligibility = await checkEventCertificateEligibility(userId, eventWithProgress.id);
      
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
      let userFullName = 'Değerli Katılımcı';
      let userEmail = '';
      
      try {
        if (typeof window !== 'undefined' && (window as any).Clerk?.user) {
          const user = (window as any).Clerk.user;
          
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
      
      const eventData = {
        userId: sanitizeText(userId),
        itemId: sanitizeText(eventWithProgress.id),
        itemType: 'event' as const,
        itemName: sanitizeText(eventWithProgress.title || ''),
        instructorName: sanitizeText(eventWithProgress.organizer || ''),
        duration: sanitizeText(eventWithProgress.duration || '2 saat'),
        organization: 'MyUNI Eğitim Platformu',
        organizationDescription: 'Dijital eğitim platformu ile kaliteli ve erişilebilir online eğitim hizmetleri sunan öncü eğitim kurumu.',
        instructorBio: `${sanitizeText(eventWithProgress.organizer || '')} - Alanında uzman organizatör ve sektör profesyoneli.`,
        userFullName: sanitizeText(userFullName)
      };

      if (!eventData.userId || !eventData.itemId || !eventData.itemName || !eventData.instructorName) {
        throw new Error('Gerekli etkinlik bilgileri eksik');
      }

      const newCertificate = await generateCertificateWithProgress(eventData);

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
            userEmail, userFullName, eventData.itemName, cleanCertNumber, certificateUrl, 'tr'
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
        setError('Sertifika alabilmek için tüm içerikler tamamlanmalıdır.');
      } else if (errorMessage.includes('Gerekli etkinlik bilgileri eksik')) {
        setError('Etkinlik bilgileri eksik. Lütfen sayfayı yenileyin.');
      } else {
        const sanitizedError = sanitizeText(errorMessage).substring(0, 200);
        setError('Sertifika oluşturulamadı: ' + sanitizedError);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Auto-generate certificate when progress reaches 70%
  useEffect(() => {
    if (eventWithProgress?.progress >= 70 && userId && !existingCertificate && !generating && certificateChecked) {
      console.log('🎯 Auto-generating certificate for 70% event completion');
      
      // Small delay to ensure all state is properly updated before generating
      const timer = setTimeout(() => {
        handleGenerateCertificate();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [eventWithProgress?.progress, userId, existingCertificate, generating, certificateChecked]);

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
    
    // Event'ler için %70+ tamamlama oranı yeterli
    if (certificateEligible || eventWithProgress?.progress >= 70) {
      return {
        status: 'eligible',
        icon: Award,
        iconColor: 'text-green-600 dark:text-green-400',
        badgeText: 'Uygun',
        badgeColor: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      };
    }
    
    if (eventWithProgress?.progress >= 50) {
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
      badgeText: `%${Math.min(100, Math.max(0, eventWithProgress?.progress || 0))}`,
      badgeColor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    };
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeText(e.target.value).substring(0, 100);
    setSearchTerm(sanitizedValue);
  };

  // Format event date
  const formatEventDate = (dateString?: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Filter sections
  const filteredSections = useMemo(() => {
    if (!eventWithProgress) return [];

    return eventWithProgress.sections.map(section => {
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
  }, [eventWithProgress, activeFilter, searchTerm]);

  // Filter stats
  const filterStats = useMemo(() => {
    if (!eventWithProgress) return {
      all: 0, completed: 0, incomplete: 0, video: 0, notes: 0, quick: 0, mixed: 0
    };

    const allLessons = eventWithProgress.sections.flatMap(section => section.lessons);
    return {
      all: allLessons.length,
      completed: allLessons.filter(lesson => lesson.isCompleted).length,
      incomplete: allLessons.filter(lesson => !lesson.isCompleted).length,
      video: allLessons.filter(lesson => lesson.type === 'video').length,
      notes: allLessons.filter(lesson => lesson.type === 'notes').length,
      quick: allLessons.filter(lesson => lesson.type === 'quick').length,
      mixed: allLessons.filter(lesson => lesson.type === 'mixed').length,
    };
  }, [eventWithProgress]);

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
  const displayEvent = eventWithProgress || event;

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

    if (certificateEligible || eventWithProgress?.progress >= 70) {
      // Different UI for >=70% progress - will auto-generate
      if (eventWithProgress?.progress >= 70) {
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                  Sertifikanız Hazırlanıyor! 🎯
                </p>
                <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                  %{eventWithProgress.progress} tamamlandı - Sertifikanız otomatik olarak oluşturulacak
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
      
      // Regular UI for eligible but not at 70% yet
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100 text-sm">
                Sertifika Almaya Hazırsınız! 🎯
              </p>
              <p className="text-xs text-green-800 dark:text-green-200 mt-1">
                {eventWithProgress?.progress >= 70 ? 'Tamamlama oranınız %70\'e ulaştı' : 'Tüm gereksinimleri tamamladınız'}
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

    if (eventWithProgress?.progress >= 50) {
      return (
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div className="flex-1">
              <p className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                Sertifikaya Çok Yakınsınız! 🔥
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
                %70 tamamlama oranına ulaşın
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-orange-950/50 rounded p-3 border border-orange-200 dark:border-orange-800">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-900 dark:text-orange-100">İlerleme</span>
                <span className="font-medium text-orange-900 dark:text-orange-100">
                  {Math.min(100, Math.max(0, eventWithProgress?.progress || 0))}%
                </span>
              </div>
              <div className="w-full bg-orange-100 dark:bg-orange-800/30 rounded-full h-1.5">
                <div 
                  className="bg-orange-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, eventWithProgress?.progress || 0))}%` }}
                />
              </div>
              <div className="text-xs text-orange-700 dark:text-orange-300">
                Sertifika için %70 gerekli (kalan: %{Math.max(0, 70 - (eventWithProgress?.progress || 0))})
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
              Etkinlik içeriklerini tamamlayın
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-blue-950/50 rounded p-3 border border-blue-200 dark:border-blue-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-900 dark:text-blue-100">İlerleme</span>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {Math.min(100, Math.max(0, eventWithProgress?.progress || 0))}%
              </span>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-1.5">
              <div 
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, eventWithProgress?.progress || 0))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700 dark:text-blue-300">
                {eventWithProgress?.completedLessons || 0} / {eventWithProgress?.totalLessons || 0} içerik
              </span>
              <span className="text-blue-700 dark:text-blue-300">Hedef: %70</span>
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

        /* Mobil özel stiller */
        @media (max-width: 1024px) {
          .mobile-safe-area {
            padding-bottom: calc(env(safe-area-inset-bottom) + 120px) !important;
          }
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
        } fixed left-0 top-0 h-screen w-80 z-50 lg:relative lg:z-auto lg:h-full transition-transform duration-300 ease-out bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden
        ${isMobileDevice ? 'rounded-t-2xl max-h-[92vh] h-[92vh] top-[8vh]' : ''}`}
      >
      
        {/* Header */}
        <div className="flex-shrink-0 p-4 lg:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-medium text-neutral-900 dark:text-neutral-100 text-lg truncate pr-2">
              {sanitizeText(displayEvent.title || '')}
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
              {texts.organizer}: {sanitizeText(displayEvent.organizer || '')}
            </p>
            
            {/* Event Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-neutral-500" />
                <span className="text-neutral-600 dark:text-neutral-400 truncate">
                  {formatEventDate(displayEvent.start_date)}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-neutral-500" />
                <span className="text-neutral-600 dark:text-neutral-400 truncate">
                  {displayEvent.is_online ? texts.online : (displayEvent.location_name || texts.inPerson)}
                </span>
              </div>
            </div>

            {/* Event Type & Status */}
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {displayEvent.event_type ? texts[displayEvent.event_type] || displayEvent.event_type : texts.workshop}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded ${
                displayEvent.status === 'upcoming' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                displayEvent.status === 'ongoing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                displayEvent.status === 'completed' ? 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                {displayEvent.status ? texts[displayEvent.status] || displayEvent.status : texts.upcoming}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-400">{texts.progress}</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                %{Math.min(100, Math.max(0, displayEvent.progress || 0))}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, displayEvent.progress || 0))}%` }}
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
            <span className="truncate">{texts.eventContent}</span>
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
                placeholder="İçerik ara..."
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
                  İçerik bulunamadı
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {searchTerm 
                    ? `"${searchTerm}" araması için sonuç bulunamadı`
                    : 'Bu filtre için içerik bulunamadı'
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
                {/* Event Sections */}
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
                      onClick={() => {
                        setCertificateSectionExpanded(!certificateSectionExpanded);
                        // Otomatik scroll özelliğini kaldırdık - sorun çözülmesi için
                      }}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      id="certificate-section-button"
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
                
                {/* Mobil cihazlar için ekstra boşluk */}
                {isMobileDevice && (
                  <div className="pb-40 lg:pb-0 mobile-safe-area">
                    {/* Bu div mobil cihazlarda en alttaki içeriğin görünmesini sağlar */}
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