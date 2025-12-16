// app/[locale]/watch/event/[slug]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, use } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Play, FileText, Zap, StickyNote, PlusCircle, Bot, BarChart3, Award, ExternalLink, Calendar, MapPin } from 'lucide-react';

// Import services
import { 
  getEventWithContent, 
  getUserEventProgress,
  UserEventProgress
} from '../../../../../lib/eventService';

// Import updated enrollment service
import { 
  enrollUserInEvent, 
  checkUserEventEnrollmentStatus
} from '../../../../../lib/eventEnrollmentService';

// Import certificate service
import { 
  checkEventCertificateEligibility, 
  getUserEventCertificate 
} from '../../../../../lib/certificateService';

// Import all components
import EventSidebar from '../../../../components/event/EventSidebar';
import AIChatSidebar from '../../../../components/shared/AIChatSidebar';
import EventHeader from '../../../../components/event/EventHeader';
import MyUNIAnalytics from '../../../../components/shared/MyUNIAnalytics';
import { MyUNIVideo } from '../../../../components/shared/content/MyUNIVideo';
import { MyUNINotes } from '../../../../components/shared/content/MyUNINotes';
import { MyUNIQuick } from '../../../../components/shared/content/MyUNIQuick';
import { MixedContent } from '../../../../components/shared/content/MixedContent';

// Define proper types
interface Event {
  id: string;
  title: string;
  organizer: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  totalWatchTime: number;
  sections: Section[];
  event_type?: "workshop" | "seminar" | "conference" | "meetup" | "webinar";
  is_online?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  timezone?: string | null;
  duration?: string;
  location_name?: string | null;
  meeting_url?: string | null;
  is_paid?: boolean;
  price?: number | null;
  status?: "upcoming" | "ongoing" | "completed" | "cancelled";
}

// Helper function to convert a string to URL-friendly slug
const toUrlSlug = (text: string): string => {
  if (!text) return '';
  
  // Turkish character mapping
  const turkishChars: {[key: string]: string} = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'İ': 'I',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  
  // Replace Turkish characters with their English equivalents
  let normalizedText = text;
  for (const [turkishChar, englishChar] of Object.entries(turkishChars)) {
    normalizedText = normalizedText.replace(new RegExp(turkishChar, 'g'), englishChar);
  }
  
  return normalizedText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
};

interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  event_id: string;
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
  isCompleted: boolean;
  lastPosition: number;
  watchTime: number;
  order: number;
}

// Define the lesson type from your service
interface EventLesson {
  id: string;
  title: string;
  lesson_type: string;
  duration_minutes?: number;
  order_index: number;
}

// Define the section type from your service
interface EventSection {
  id: string;
  title: string;
  order_index: number;
  lessons?: EventLesson[];
}

// Define the event data structure from your service
interface EventWithContent {
  event: {
    id: string;
    title: string;
    organizer_name?: string;
    event_type?: string;
    start_date?: string;
    end_date?: string;
    timezone?: string;
    duration?: string;
    is_online?: boolean;
    location_name?: string;
    meeting_url?: string;
    is_paid?: boolean;
    price?: number;
    status?: string;
  };
  sections: EventSection[];
}

interface EventWatchPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Text translations
const texts = {
  tr: {
    eventContent: "Etkinlik İçeriği",
    analytics: "Analitik",
    progress: "İlerleme",
    organizer: "Düzenleyen",
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
    enrolling: "Etkinliğe kaydolunuyor...",
    enrollSuccess: "Etkinliğe başarıyla kaydoldunuz!",
    notes: "AI Asistan",
    showNotes: "AI Asistanı Göster",
    hideNotes: "AI Asistanı Gizle",
    notEnrolled: "Bu etkinliğe kayıtlı değilsiniz",
    enrollmentRequired: "Bu etkinliği izlemek için kayıt olmanız gerekiyor",
    goToEvent: "Etkinlik Sayfasına Git",
    enrollToEvent: "Etkinliğe Kayıt Ol",
    workshop: "Atölye",
    seminar: "Seminer",
    conference: "Konferans",
    meetup: "Buluşma",
    webinar: "Webinar",
    online: "Online",
    inPerson: "Yüz Yüze",
    free: "Ücretsiz",
    paid: "Ücretli",
    upcoming: "Yaklaşan",
    ongoing: "Devam Eden",
    completedEvent: "Tamamlanmış",
    cancelled: "İptal Edilmiş",
    dataLoadError: "Veri yükleme hatası",
    invalidEventData: "Geçersiz etkinlik verisi"
  },
  en: {
    eventContent: "Event Content",
    analytics: "Analytics", 
    progress: "Progress",
    organizer: "Organizer",
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
    enrolling: "Enrolling to event...",
    enrollSuccess: "Successfully enrolled to event!",
    notes: "AI Assistant",
    showNotes: "Show AI Assistant",
    hideNotes: "Hide AI Assistant",
    notEnrolled: "You are not enrolled in this event",
    enrollmentRequired: "You need to enroll to watch this event",
    goToEvent: "Go to Event Page",
    enrollToEvent: "Enroll to Event",
    workshop: "Workshop",
    seminar: "Seminar",
    conference: "Conference",
    meetup: "Meetup",
    webinar: "Webinar",
    online: "Online",
    inPerson: "In-Person",
    free: "Free",
    paid: "Paid",
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completedEvent: "Completed",
    cancelled: "Cancelled",
    dataLoadError: "Data loading error",
    invalidEventData: "Invalid event data"
  }
};

export default function EventWatchPage({ params }: EventWatchPageProps) {
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeView, setActiveView] = useState<'content' | 'analytics'>('content');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false); // Start with AI panel closed by default
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Certificate states
  const [certificateEligible, setCertificateEligible] = useState(false);
  const [existingCertificate, setExistingCertificate] = useState<Certificate | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);

  const resolvedParams = use(params);
  const { locale, slug } = resolvedParams;
  const eventSlug = slug;
  const searchParams = useSearchParams();
  
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const { user, isLoaded } = useUser();

  // Helper functions to validate and cast types
  const validateEventType = (type: string | undefined): "workshop" | "seminar" | "conference" | "meetup" | "webinar" => {
    if (type === 'workshop' || type === 'seminar' || type === 'conference' || type === 'meetup' || type === 'webinar') {
      return type;
    }
    return 'workshop';
  };

  const validateEventStatus = (status: string | undefined): "upcoming" | "ongoing" | "completed" | "cancelled" => {
    if (status === 'upcoming' || status === 'ongoing' || status === 'completed' || status === 'cancelled') {
      return status;
    }
    return 'upcoming';
  };

  const validateLessonType = (type: string): "video" | "notes" | "quick" | "mixed" => {
    if (type === 'video' || type === 'notes' || type === 'quick' || type === 'mixed') {
      return type;
    }
    return 'video';
  };

  // Helper function to validate event data structure
  const validateEventData = (eventData: any): eventData is EventWithContent => {
    if (!eventData || !eventData.event || !eventData.sections || !Array.isArray(eventData.sections)) {
      return false;
    }

    for (const section of eventData.sections) {
      if (!section || (section.lessons !== undefined && !Array.isArray(section.lessons))) {
        return false;
      }
    }

    return true;
  };

  const transformEventData = useCallback((eventData: EventWithContent, progressData: UserEventProgress[]): Event => {
    if (!validateEventData(eventData)) {
      throw new Error('Invalid event data structure');
    }

    // Create progress map - adjust property name based on actual UserEventProgress structure
    const progressMap = new Map(progressData.map(p => [
      // Replace this with the actual property name from UserEventProgress
      // Common variations: p.lesson_id, p.id, p.content_id, p.lessonId
      (p as any).lesson_id || (p as any).id || (p as any).content_id || (p as any).lessonId, 
      p
    ]));
    
    const sections: Section[] = eventData.sections.map((section) => {
      const lessons = section.lessons || [];
      
      if (!Array.isArray(lessons)) {
        return {
          id: section.id,
          title: section.title,
          order: section.order_index,
          lessons: []
        };
      }

      return {
        id: section.id,
        title: section.title,
        order: section.order_index,
        lessons: lessons.map((lesson) => {
          const progress = progressMap.get(lesson.id);
          return {
            id: lesson.id,
            title: lesson.title,
            type: validateLessonType(lesson.lesson_type),
            duration: lesson.duration_minutes ? `${lesson.duration_minutes} dk` : '0 dk',
            isCompleted: progress?.is_completed || false,
            lastPosition: progress?.last_position_seconds || 0,
            watchTime: progress?.watch_time_seconds || 0,
            order: lesson.order_index
          };
        })
      };
    });

    const totalLessons = sections.reduce((acc: number, section: Section) => acc + section.lessons.length, 0);
    const completedLessons = sections.reduce((acc: number, section: Section) => 
      acc + section.lessons.filter((lesson: Lesson) => lesson.isCompleted).length, 0
    );
    const totalWatchTime = sections.reduce((acc: number, section: Section) => 
      acc + section.lessons.reduce((lessonAcc: number, lesson: Lesson) => lessonAcc + lesson.watchTime, 0), 0
    );
    
    const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    const eventType = validateEventType(eventData.event.event_type);
    const eventStatus = validateEventStatus(eventData.event.status);

    return {
      id: eventData.event.id,
      title: eventData.event.title,
      organizer: eventData.event.organizer_name || 'Düzenleyen',
      progress,
      totalLessons,
      completedLessons,
      totalWatchTime,
      sections,
      event_type: eventType,
      is_online: eventData.event.is_online || false,
      start_date: eventData.event.start_date || null,
      end_date: eventData.event.end_date || null,
      timezone: eventData.event.timezone || null,
      duration: eventData.event.duration || '2 saat',
      location_name: eventData.event.location_name || null,
      meeting_url: eventData.event.meeting_url || null,
      is_paid: eventData.event.is_paid || false,
      price: eventData.event.price || null,
      status: eventStatus
    };
  }, []);

  // Check certificate status
  const checkCertificateStatus = useCallback(async () => {
    if (!user || !event) return;
    
    try {
      setCertificateLoading(true);
      
      const eligibility = await checkEventCertificateEligibility(user.id, event.id);
      setCertificateEligible(eligibility.isEligible);
      
      if (eligibility.isEligible || eligibility.existingCertificate) {
        const certificate = await getUserEventCertificate(user.id, event.id);
        setExistingCertificate(certificate);
      }
      
    } catch (error) {
      console.error('Certificate status check error:', error);
    } finally {
      setCertificateLoading(false);
    }
  }, [user, event]);

  const fetchEventData = useCallback(async () => {
    if (!user || loading) return;

    try {
      setLoading(true);
      setError(null);

      const eventData = await getEventWithContent(eventSlug);
      
      if (!eventData?.event) {
        setError('Event not found');
        return;
      }

      if (!validateEventData(eventData)) {
        setError(t.invalidEventData);
        return;
      }

      const enrollmentStatus = await checkUserEventEnrollmentStatus(user.id, eventData.event.id);
      setIsEnrolled(enrollmentStatus.isEnrolled);

      if (!enrollmentStatus.isEnrolled) {
        setError(t.enrollmentRequired);
        return;
      }

      const progressData = await getUserEventProgress(user.id, eventData.event.id);
      const transformedEvent = transformEventData(eventData, progressData);
      setEvent(transformedEvent);

      // Set initial expanded sections based on URL parameters or default to first section
      if (eventData.sections.length > 0) {
        // Create the initial expanded sections state
        const initialExpandedSections: { [key: string]: boolean } = {};
        
        // Check URL parameters (support both short and long versions)
        const expandedSectionSlug = searchParams.get('e') || searchParams.get('expandedSection');
        const sectionSlug = searchParams.get('s') || searchParams.get('section');
        
        let foundSection = false;
        
        // Check for expanded section by slug
        if (expandedSectionSlug) {
          for (const section of transformedEvent.sections) {
            if (toUrlSlug(section.title) === expandedSectionSlug) {
              initialExpandedSections[section.id] = true;
              foundSection = true;
              break;
            }
          }
        }
        
        // Check for section by slug
        if (sectionSlug) {
          for (const section of transformedEvent.sections) {
            const lesson = section.lessons.find(l => toUrlSlug(l.title) === sectionSlug);
            if (lesson) {
              initialExpandedSections[section.id] = true;
              setSelectedLesson(lesson);
              foundSection = true;
              break;
            }
          }
        }
        
        // If no sections are expanded yet, expand the first one
        if (!foundSection) {
          initialExpandedSections[eventData.sections[0].id] = true;
        }
        
        setExpandedSections(initialExpandedSections);
      }

      // Set active view based on URL parameter or default to 'content'
      const viewParam = searchParams.get('v') || searchParams.get('view');
      if (viewParam === 'analytics') {
        setActiveView('analytics');
      }
      
      // Set sidebar state based on URL parameter
      const sidebarParam = searchParams.get('sb') || searchParams.get('sidebar');
      if (sidebarParam === '1' || sidebarParam === 'open') {
        setRightSidebarOpen(true);
      }

    } catch (err) {
      console.error('Event fetch error:', err);
      if (err instanceof Error && err.message === 'Invalid event data structure') {
        setError(t.invalidEventData);
      } else {
        setError(t.dataLoadError);
      }
    } finally {
      setLoading(false);
    }
  }, [eventSlug, user, loading, t.enrollmentRequired, t.invalidEventData, t.dataLoadError, transformEventData]);

  useEffect(() => {
    if (isLoaded && user && !dataFetched) {
      fetchEventData().then(() => {
        setDataFetched(true);
      });
    } else if (isLoaded && !user) {
      setError('Please sign in to access this event');
    }
  }, [eventSlug, isLoaded, user, dataFetched, fetchEventData]);

  // Effect to handle URL parameters
  useEffect(() => {
    if (!searchParams || !event) return;

    // Check for view parameter (v)
    const viewParam = searchParams.get('v') || searchParams.get('view');
    if (viewParam && (viewParam === 'content' || viewParam === 'analytics')) {
      setActiveView(viewParam);
    }

    // Check for sidebar parameter (sb) - only open if explicitly requested
    const sidebarParam = searchParams.get('sb') || searchParams.get('sidebar');
    if (sidebarParam === '1' || sidebarParam === 'open') {
      setRightSidebarOpen(true);
    }

    // Check for expandedSection parameter (e)
    const expandedSectionSlug = searchParams.get('e') || searchParams.get('expandedSection');
    
    if (expandedSectionSlug) {
      // Try to find section by slug
      for (const section of event.sections) {
        if (toUrlSlug(section.title) === expandedSectionSlug) {
          setExpandedSections(prev => ({
            ...prev,
            [section.id]: true
          }));
          break;
        }
      }
    }

    // Check for section parameter (s)
    const sectionSlug = searchParams.get('s') || searchParams.get('section');
    
    if (sectionSlug) {
      // Try to find lesson by slug
      for (const section of event.sections) {
        const lesson = section.lessons.find(l => toUrlSlug(l.title) === sectionSlug);
        if (lesson) {
          setSelectedLesson(lesson);
          setExpandedSections(prev => ({
            ...prev,
            [section.id]: true
          }));
          break;
        }
      }
    }
    
    // Check for secret key parameter (sk)
    const secretKeyParam = searchParams.get('sk');
    if (secretKeyParam) {
      // Find the section and expand it if it's not already expanded
      if (sectionSlug) {
        for (const section of event.sections) {
          const lesson = section.lessons.find(l => toUrlSlug(l.title) === sectionSlug);
          if (lesson) {
            // Make sure this section is expanded
            setExpandedSections(prev => ({
              ...prev,
              [section.id]: true
            }));
            // Select this lesson - the MyUNINotes component will handle finding the secret key note
            setSelectedLesson(lesson);
            break;
          }
        }
      } else if (expandedSectionSlug) {
        // If no specific lesson is specified but a section is, expand that section
        for (const section of event.sections) {
          if (toUrlSlug(section.title) === expandedSectionSlug) {
            setExpandedSections(prev => ({
              ...prev,
              [section.id]: true
            }));
            
            // Select the first lesson from this section
            if (section.lessons && section.lessons.length > 0) {
              setSelectedLesson(section.lessons[0]);
            }
            break;
          }
        }
      } else {
        // If no section or lesson is specified, find the first section with a notes lesson
        for (const section of event.sections) {
          const notesLesson = section.lessons.find(l => l.type === 'notes');
          if (notesLesson) {
            setExpandedSections(prev => ({
              ...prev,
              [section.id]: true
            }));
            setSelectedLesson(notesLesson);
            break;
          }
        }
      }
    }
  }, [searchParams, event]);

  useEffect(() => {
    if (event && user) {
      checkCertificateStatus();
    }
  }, [event, user, checkCertificateStatus]);

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
    if (!event || !user) return;

    try {
      setEvent(prevEvent => {
        if (!prevEvent) return prevEvent;
        
        const updatedEvent = {
          ...prevEvent,
          sections: prevEvent.sections.map(section => ({
            ...section,
            lessons: section.lessons.map(lesson => 
              lesson.id === lessonId 
                ? { ...lesson, isCompleted: true }
                : lesson
            )
          }))
        };

        const totalLessons = updatedEvent.sections.reduce((acc, section) => acc + section.lessons.length, 0);
        const completedLessons = updatedEvent.sections.reduce((acc, section) => 
          acc + section.lessons.filter(lesson => lesson.isCompleted).length, 0
        );
        const progress = totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;
        
        return {
          ...updatedEvent,
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

    } catch (error) {
      console.error('Error updating lesson completion in UI:', error);
    }
  };

  const handleEnrollNow = async () => {
    if (!user || !event) return;

    try {
      setEnrollmentLoading(true);
      
      const result = await enrollUserInEvent(user.id, event.id);

      if (result.success) {
        setIsEnrolled(true);
        setError(null);
        await fetchEventData();
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      setError('Failed to enroll in event');
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const handleLessonSelect = (lesson: any) => {
    setSelectedLesson(lesson);
    setActiveView('content');
    
    // Find the section this lesson belongs to
    let sectionTitle = '';
    if (event) {
      for (const section of event.sections) {
        if (section.lessons.some(l => l.id === lesson.id)) {
          sectionTitle = section.title;
          break;
        }
      }
    }
    
    // Update the URL with user-friendly section names instead of IDs
    try {
      const url = new URL(window.location.href);
      
      // Use the section title as a slug in the URL
      const lessonSlug = toUrlSlug(lesson.title);
      
      // Use shorter parameter names: s for section
      url.searchParams.set('s', lessonSlug);
      
      // Store section ID in a hidden data field for internal reference
      lesson._sectionId = lesson.id;
      
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error updating URL:', error);
    }
    
    // Don't automatically open the right sidebar on mobile/desktop
    if (window.innerWidth < 1024) {
      setLeftSidebarOpen(false);
    }
  };

  const handleViewChange = (view: 'content' | 'analytics') => {
    setActiveView(view);
    
    // Update the URL with view parameter
    try {
      const url = new URL(window.location.href);
      // Use shorter parameter name: v for view
      url.searchParams.set('v', view);
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error updating URL:', error);
    }
    
    if (view === 'analytics') {
      setRightSidebarOpen(false);
    }
  };

  const handleSectionToggle = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));

    // If expanding a section, update the URL with the section title
    if (!expandedSections[sectionId] && event) {
      const section = event.sections.find(s => s.id === sectionId);
      if (section) {
        try {
          const url = new URL(window.location.href);
          const sectionSlug = toUrlSlug(section.title);
          
          // Use shorter parameter name: e for expandedSection
          url.searchParams.set('e', sectionSlug);
          
          window.history.pushState({}, '', url.toString());
        } catch (error) {
          console.error('Error updating URL:', error);
        }
      }
    }
  };

  const handleLeftSidebarToggle = () => {
    setLeftSidebarOpen(!leftSidebarOpen);
  };

  const handleRightSidebarToggle = () => {
    const newState = !rightSidebarOpen;
    setRightSidebarOpen(newState);
    
    // Update the URL with sidebar parameter
    try {
      const url = new URL(window.location.href);
      if (newState) {
        // Use shorter parameter name: sb for sidebar
        url.searchParams.set('sb', '1');
      } else {
        url.searchParams.delete('sb');
      }
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('Error updating URL:', error);
    }
    
    if (!rightSidebarOpen) {
      setActiveView('content');
    }
  };

  const handleProgress = (progress: number) => {
    // Handle progress updates
  };

  const handleNoteCreate = (note: string) => {
    // Handle note creation
  };

  const formatEventDate = (dateString?: string | null) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return locale === 'tr' 
        ? date.toLocaleDateString('tr-TR', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : date.toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
    } catch {
      return dateString;
    }
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
                  Etkinliği başarıyla tamamladınız ve sertifikanızı aldınız
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

    if (certificateEligible || (event && event.progress === 100)) {
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
                    ✅ Etkinlik başarıyla tamamlandı
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

    if (event && event.progress > 70) {
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
                  Etkinliği tamamladığınızda dijital sertifikanızı alabileceksiniz
                </p>
              </div>
            </div>
            
            <div className="bg-white dark:bg-blue-950/50 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-900 dark:text-blue-100">Genel İlerleme</span>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">{event.progress}%</span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-800/30 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${event.progress}%` }}
                  />
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  {event.totalLessons - event.completedLessons} ders daha kaldı
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
      // Function to handle redirection to event page
      const handleRedirectToEvent = () => {
        // Use the same slug pattern but redirect to etkinlik/[slug] instead of watch/event/[slug]
        const eventUrl = `/${locale}/etkinlik/${eventSlug}`;
        window.location.href = eventUrl;
      };

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
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleRedirectToEvent}
                  className="px-6 py-2 bg-[#990000] dark:bg-white text-white dark:text-black rounded-lg hover:bg-[#770000] dark:hover:bg-neutral-200 transition-colors"
                >
                  {t.goToEvent}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeView === 'analytics') {
      return (
        <MyUNIAnalytics 
          contentId={event?.id || ''} 
          userId={user?.id || ''}
          texts={t}
          type="event"
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
                    <span>🎯</span>
                    <span>Etkinlik Deneyimine Hoş Geldiniz</span>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-100 leading-tight">
                      {t.welcomeBack}
                    </h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
                      Etkinliğe hoş geldiniz! Öğrenme yolculuğunuza başlamak için sol menüden bir içerik seçin ve sağ panelden AI asistanı ile konuşun.
                    </p>
                  </div>

                  <div className="w-12 h-px bg-[#990000] dark:bg-white"></div>
                </div>

                {event && (
                  <>
                    {/* Event Info Card */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        Etkinlik Bilgileri
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <div>
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">Başlangıç</div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {formatEventDate(event.start_date)}
                              </div>
                            </div>
                          </div>
                          
                          {event.end_date && (
                            <div className="flex items-center space-x-3">
                              <Calendar className="w-4 h-4 text-neutral-500" />
                              <div>
                                <div className="text-sm text-neutral-600 dark:text-neutral-400">Bitiş</div>
                                <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                  {formatEventDate(event.end_date)}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-3">
                            <MapPin className="w-4 h-4 text-neutral-500" />
                            <div>
                              <div className="text-sm text-neutral-600 dark:text-neutral-400">Lokasyon</div>
                              <div className="font-medium text-neutral-900 dark:text-neutral-100">
                                {event.is_online ? t.online : (event.location_name || t.inPerson)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">Etkinlik Türü</div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {t[event.event_type || 'workshop']}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">Durum</div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {t[event.status || 'upcoming']}
                            </div>
                          </div>

                          <div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-400">Ücret</div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {event.is_paid ? (event.price ? `${event.price} TL` : t.paid) : t.free}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Card */}
                    <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                        İçerik İlerlemesi
                      </h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-[#990000] dark:text-white">
                            {event.progress}%
                          </div>
                          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Tamamlandı
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {event.completedLessons}
                          </div>
                          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Tamamlanan İçerik
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                            {event.totalLessons}
                          </div>
                          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Toplam İçerik
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                        <div 
                          className="bg-[#990000] dark:bg-white h-2 rounded-full transition-all duration-500"
                          style={{ width: `${event.progress}%` }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {renderCertificateCard()}

                {event?.meeting_url && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center mt-1">
                        <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          {event.is_online ? 'Online Etkinlik Erişim Bilgileri' : 'Etkinlik Erişim Bilgileri'}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {event.is_online 
                            ? 'Online etkinliğe katılım bilgileriniz e-posta adresinize gönderilecektir.'
                            : 'Etkinliğe katılım bilgileriniz e-posta adresinize gönderilecektir.'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                      Sol Menüden İçerik Seçin
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
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Video İçerikler</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">İnteraktif video materyalleri</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#990000] dark:text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Etkinlik Notları</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">Detaylı materyaller ve dökümanlar</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-white dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors">
                      <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-[#990000] dark:text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">Hızlı Testler</div>
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
                            Etkinlik sırasında aklınıza gelen soruları AI asistanına sorun.
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
                        İçerikler otomatik olarak tamamlandı işaretlenir
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
            contentId={selectedLesson.id}
            userId={user?.id || ''}
            type="event"
            onProgress={handleProgress}
            onComplete={async () => {
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'notes':
        return (
          <MyUNINotes 
            contentId={selectedLesson.id}
            userId={user?.id || ''}
            type="event"
            onNoteCreate={handleNoteCreate}
            onComplete={async () => {
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'quick':
        return (
          <MyUNIQuick 
            contentId={selectedLesson.id}
            userId={user?.id || ''}
            type="event"
            onComplete={async (score) => {
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      case 'mixed':
        return (
          <MixedContent 
            contentId={selectedLesson.id}
            userId={user?.id || ''}
            type="event"
            onProgress={handleProgress}
            onComplete={async () => {
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
      default:
        return (
          <MyUNIVideo 
            contentId={selectedLesson.id}
            userId={user?.id || ''}
            type="event"
            onProgress={handleProgress}
            onComplete={async () => {
              await handleLessonCompletion(selectedLesson.id);
            }}
          />
        );
    }
  };

  if (!isLoaded) {
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
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-12 h-12 border-4 border-neutral-200 dark:border-neutral-700 rounded-full animate-spin border-t-[#990000]"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Etkinlik içeriği yükleniyor
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Materyaller hazırlanıyor...
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
      {event && (
        <EventSidebar
          event={event}
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
        <EventHeader
          selectedSession={selectedLesson as any}
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
          type="event"
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