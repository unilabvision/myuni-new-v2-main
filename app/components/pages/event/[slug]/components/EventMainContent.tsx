"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Linkedin, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Target, 
  Award, 
  Video, 
  Mic, 
  Globe, 
  BookOpen,
  MessageCircle,
  Coffee,
  Star,
  Download,
  ExternalLink,
  Tag,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import EventComments from './EventComments';

// Event interface matching the myuni_events schema
interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  organizer_name: string | null;
  organizer_email: string | null;
  organizer_linkedin: string | null;
  organizer_image_url: string | null;
  event_type: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  category: string | null;
  tags: string[] | null;
  start_date: string;
  end_date: string | null;
  timezone: string;
  duration_minutes: number | null;
  is_online: boolean;
  location_name: string | null;
  location_address: string | null;
  meeting_url: string | null;
  is_paid: boolean;
  price: number | null;
  max_attendees: number | null;
  current_attendees: number;
  registration_deadline: string | null;
  is_registration_open: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

// Geliştirilmiş EventSection interface
interface EventSection {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  section_type: 'session' | 'presentation' | 'workshop' | 'panel' | 'networking' | 'break' | 'lunch' | 'keynote' | 'qa' | 'opening' | 'closing';
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_bio: string | null;
  speaker_image_url: string | null;
  speaker_linkedin_url: string | null;
  speaker_email: string | null;
  location_name: string | null;
  location_details: string | null;
  meeting_room: string | null;
  meeting_url: string | null;
  is_featured: boolean;
  is_mandatory: boolean;
  max_attendees: number | null;
  requires_registration: boolean;
  materials_url: string | null;
  slides_url: string | null;
  recording_url: string | null;
  additional_resources: any | null;
  tags: string[] | null;
  category: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  language: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EventMainContentProps {
  event?: Event;
  texts?: {
    overview?: string;
    agenda?: string;
    speakers?: string;
    details?: string;
    features?: string;
    organizer?: string;
    contactOrganizer?: string;
    viewProfile?: string;
    eventDetails?: string;
    eventDate?: string;
    eventTime?: string;
    eventDuration?: string;
    eventLocation?: string;
    onlineEvent?: string;
    inPersonEvent?: string;
    attendees?: string;
    maxAttendees?: string;
    registrationDeadline?: string;
    eventType?: string;
    category?: string;
    tags?: string;
    description?: string;
    eventFeatures?: string;
    networking?: string;
    qaSession?: string;
    materials?: string;
    certificate?: string;
    recording?: string;
    liveStream?: string;
    interactive?: string;
    expertSpeaker?: string;
    practicalWorkshop?: string;
    industryInsights?: string;
    networkingOpportunities?: string;
    certificateIncluded?: string;
    recordingAvailable?: string;
    materialsProvided?: string;
    qaIncluded?: string;
    liveStreaming?: string;
    interactiveSessions?: string;
    expertSpeakers?: string;
    practicalWorkshops?: string;
    loading?: string;
    error?: string;
    retry?: string;
    downloadMaterials?: string;
    viewSlides?: string;
    joinSession?: string;
    difficultyLevel?: string;
    [key: string]: string | undefined;
  };
  eventId?: string;
  eventSlug?: string;
  userId?: string;
  locale?: string;
}

const EventMainContent: React.FC<EventMainContentProps> = ({ 
  event, 
  texts = {},
  eventId,
  eventSlug,
  userId,
  locale = 'tr'
}) => {
  const router = useRouter();
  const [eventData, setEventData] = useState<Event | null>(event || null);
  const [sections, setSections] = useState<EventSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'speakers' | 'comments'>('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Default texts
  const defaultTexts = {
    overview: locale === 'en' ? 'Overview' : 'Genel Bakış',
    agenda: locale === 'en' ? 'Agenda' : 'Program',
    speakers: locale === 'en' ? 'Speakers' : 'Konuşmacılar',
    comments: locale === 'en' ? 'Comments' : 'Yorumlar',
    eventExpired: locale === 'en' ? 'Event Ended' : 'Etkinlik Sona Erdi',
    details: locale === 'en' ? 'Details' : 'Detaylar',
    features: locale === 'en' ? 'Features' : 'Özellikler',
    organizer: locale === 'en' ? 'Organizer' : 'Organizatör',
    contactOrganizer: locale === 'en' ? 'Contact Organizer' : 'Organizatörle İletişim',
    viewProfile: locale === 'en' ? 'View Profile' : 'Profili Görüntüle',
    eventDetails: locale === 'en' ? 'Event Details' : 'Etkinlik Detayları',
    eventDate: locale === 'en' ? 'Event Date' : 'Etkinlik Tarihi',
    eventTime: locale === 'en' ? 'Event Time' : 'Etkinlik Saati',
    eventDuration: locale === 'en' ? 'Duration' : 'Süre',
    eventLocation: locale === 'en' ? 'Location' : 'Konum',
    onlineEvent: locale === 'en' ? 'Online Event' : 'Çevrimiçi Etkinlik',
    inPersonEvent: locale === 'en' ? 'In-Person Event' : 'Yüz Yüze Etkinlik',
    attendees: locale === 'en' ? 'Attendees' : 'Katılımcılar',
    maxAttendees: locale === 'en' ? 'Max Attendees' : 'Maksimum Katılımcı',
    registrationDeadline: locale === 'en' ? 'Registration Deadline' : 'Kayıt Son Tarihi',
    eventType: locale === 'en' ? 'Event Type' : 'Etkinlik Türü',
    category: locale === 'en' ? 'Category' : 'Kategori',
    tags: locale === 'en' ? 'Tags' : 'Etiketler',
    description: locale === 'en' ? 'Description' : 'Açıklama',
    eventFeatures: locale === 'en' ? 'Event Features' : 'Etkinlik Özellikleri',
    networking: locale === 'en' ? 'Networking' : 'Ağ Kurma',
    qaSession: locale === 'en' ? 'Q&A Session' : 'Soru-Cevap',
    materials: locale === 'en' ? 'Materials' : 'Materyaller',
    certificate: locale === 'en' ? 'Certificate' : 'Sertifika',
    recording: locale === 'en' ? 'Recording' : 'Kayıt',
    liveStream: locale === 'en' ? 'Live Stream' : 'Canlı Yayın',
    interactive: locale === 'en' ? 'Interactive' : 'İnteraktif',
    expertSpeaker: locale === 'en' ? 'Expert Speaker' : 'Uzman Konuşmacı',
    practicalWorkshop: locale === 'en' ? 'Practical Workshop' : 'Pratik Atölye',
    industryInsights: locale === 'en' ? 'Industry Insights' : 'Sektör İçgörüleri',
    networkingOpportunities: locale === 'en' ? 'Networking Opportunities' : 'Ağ Kurma Fırsatları',
    certificateIncluded: locale === 'en' ? 'Certificate Included' : 'Sertifika Dahil',
    recordingAvailable: locale === 'en' ? 'Recording Available' : 'Kayıt Mevcut',
    materialsProvided: locale === 'en' ? 'Materials Provided' : 'Materyaller Sağlanır',
    qaIncluded: locale === 'en' ? 'Q&A Included' : 'Soru-Cevap Dahil',
    liveStreaming: locale === 'en' ? 'Live Streaming' : 'Canlı Yayın',
    interactiveSessions: locale === 'en' ? 'Interactive Sessions' : 'İnteraktif Oturumlar',
    expertSpeakers: locale === 'en' ? 'Expert Speakers' : 'Uzman Konuşmacılar',
    practicalWorkshops: locale === 'en' ? 'Practical Workshops' : 'Pratik Atölyeler',
    loading: locale === 'en' ? 'Loading event...' : 'Etkinlik yükleniyor...',
    error: locale === 'en' ? 'Error loading event' : 'Etkinlik yüklenirken hata oluştu',
    retry: locale === 'en' ? 'Retry' : 'Tekrar Dene',
    downloadMaterials: locale === 'en' ? 'Download Materials' : 'Materyalleri İndir',
    viewSlides: locale === 'en' ? 'View Slides' : 'Sunumu Görüntüle',
    joinSession: locale === 'en' ? 'Join Session' : 'Oturuma Katıl',
    difficultyLevel: locale === 'en' ? 'Difficulty Level' : 'Zorluk Seviyesi',
    ...texts
  };

  // Hash management functions
  const getHashFromUrl = (): string => {
    if (typeof window === 'undefined') return '';
    return window.location.hash.substring(1);
  };

  const updateUrlHash = (tabName: string) => {
    if (typeof window === 'undefined') return;
    const hash = tabName === 'overview' ? '' : tabName;
    const url = new URL(window.location.href);
    if (hash) {
      url.hash = hash;
    } else {
      url.hash = '';
    }
    window.history.replaceState({}, '', url.toString());
  };

  const getTabFromHash = (hash: string): 'overview' | 'agenda' | 'speakers' | 'comments' => {
    switch (hash) {
      case 'agenda':
        return 'agenda';
      case 'speakers':
        return 'speakers';
      case 'comments':
        return 'comments';
      default:
        return 'overview';
    }
  };

  const handleTabChange = (tabName: 'overview' | 'agenda' | 'speakers' | 'comments') => {
    setActiveTab(tabName);
    updateUrlHash(tabName);
  };

  const scrollToTabContent = () => {
    // Wait for tab content to render, then scroll to it
    setTimeout(() => {
      const tabsElement = document.getElementById('event-tabs');
      if (tabsElement) {
        const elementRect = tabsElement.getBoundingClientRect();
        const elementTop = elementRect.top + window.scrollY;
        
        // Mobile offset - scroll a bit higher on mobile devices
        const isMobile = window.innerWidth < 768;
        const offset = isMobile ? 80 : 20; // More offset for mobile
        
        window.scrollTo({
          top: elementTop - offset,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  // API function to fetch event sections
  const fetchEventSections = async (eventId: string) => {
    try {
      setLoading(true);
      console.log('Fetching sections for event:', eventId);
      
      const response = await fetch(`/api/events/${eventId}/sections`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received sections data:', data);
      
      // Data should be an array of EventSection objects
      if (Array.isArray(data)) {
        setSections(data);
      } else {
        console.warn('Expected array but received:', typeof data);
        setSections([]);
      }
    } catch (error) {
      console.error('Error fetching event sections:', error);
      setError('Failed to load event agenda');
      setSections([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString(locale === 'en' ? 'en-US' : 'tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateWithDay = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getEventTypeText = (type: string): string => {
    switch (type) {
      case 'workshop': return locale === 'en' ? 'Workshop' : 'Atölye';
      case 'seminar': return locale === 'en' ? 'Seminar' : 'Seminer';
      case 'conference': return locale === 'en' ? 'Conference' : 'Konferans';
      case 'meetup': return locale === 'en' ? 'Meetup' : 'Buluşma';
      case 'webinar': return locale === 'en' ? 'Webinar' : 'Webinar';
      default: return type;
    }
  };

  const getSectionTypeText = (type: string): string => {
    switch (type) {
      case 'session': return locale === 'en' ? 'Session' : 'Oturum';
      case 'presentation': return locale === 'en' ? 'Presentation' : 'Sunum';
      case 'workshop': return locale === 'en' ? 'Workshop' : 'Atölye';
      case 'panel': return locale === 'en' ? 'Panel' : 'Panel';
      case 'networking': return locale === 'en' ? 'Networking' : 'Ağ Kurma';
      case 'break': return locale === 'en' ? 'Break' : 'Ara';
      case 'lunch': return locale === 'en' ? 'Lunch' : 'Öğle Arası';
      case 'keynote': return locale === 'en' ? 'Keynote' : 'Ana Konuşma';
      case 'qa': return locale === 'en' ? 'Q&A' : 'Soru-Cevap';
      case 'opening': return locale === 'en' ? 'Opening' : 'Açılış';
      case 'closing': return locale === 'en' ? 'Closing' : 'Kapanış';
      default: return type;
    }
  };

  const getSectionTypeColor = (type: string): string => {
    switch (type) {
      case 'keynote': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'presentation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'workshop': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'panel': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'networking': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      case 'break': case 'lunch': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'qa': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'opening': case 'closing': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyLevelText = (level: string | null): string => {
    if (!level) return '';
    switch (level) {
      case 'beginner': return locale === 'en' ? 'Beginner' : 'Başlangıç';
      case 'intermediate': return locale === 'en' ? 'Intermediate' : 'Orta';
      case 'advanced': return locale === 'en' ? 'Advanced' : 'İleri';
      default: return level;
    }
  };

  const getDifficultyLevelColor = (level: string | null): string => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Check if event has expired
  const isEventExpired = (eventData: Event): boolean => {
    const now = new Date();
    
    // If event status is completed or cancelled, it's expired
    if (eventData.status === 'completed' || eventData.status === 'cancelled') {
      return true;
    }
    
    // Check if event has ended based on end_date
    if (eventData.end_date) {
      const endDate = new Date(eventData.end_date);
      return now > endDate;
    }
    
    // If no end_date but has duration_minutes, calculate end time from start_date
    if (eventData.duration_minutes) {
      const startDate = new Date(eventData.start_date);
      const calculatedEndTime = new Date(startDate.getTime() + eventData.duration_minutes * 60 * 1000);
      return now > calculatedEndTime;
    }
    
    // If no end_date and no duration, consider expired 2 hours after start for ongoing events
    if (eventData.status === 'ongoing') {
      const startDate = new Date(eventData.start_date);
      const twoHoursAfterStart = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      return now > twoHoursAfterStart;
    }
    
    return false;
  };

  const renderRichText = (htmlContent: string | null) => {
    if (!htmlContent) return <p>{locale === 'en' ? 'No description available.' : 'Açıklama mevcut değil.'}</p>;
    
    // Check if content contains HTML tags
    const isHtml = htmlContent.includes('<') && htmlContent.includes('>');
    
    // Check if content contains markdown patterns
    const isMarkdown = !isHtml && (
      htmlContent.includes('##') || 
      htmlContent.includes('**') || 
      htmlContent.includes('*') || 
      htmlContent.includes('- ') ||
      htmlContent.includes('1. ') ||
      htmlContent.includes('[') ||
      htmlContent.includes('`')
    );
    
    const textLength = htmlContent.replace(/<[^>]*>/g, '').trim().length;
    const isLong = textLength > 400;

    if (isLong && !showFullDescription) {
      const truncatedContent = isMarkdown ? 
        htmlContent.slice(0, 400) + '...' : 
        (isHtml ? htmlContent.slice(0, 400) + '...' : `<p>${htmlContent.slice(0, 400)}...</p>`);
      
      return (
        <div className="relative">
          {isMarkdown ? (
            <div className="rich-text-content markdown-content">
              <ReactMarkdown>{truncatedContent}</ReactMarkdown>
            </div>
          ) : (
            <div 
              className="rich-text-content"
              dangerouslySetInnerHTML={{ __html: isHtml ? truncatedContent : `<p>${truncatedContent}</p>` }}
            />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-neutral-900 dark:via-neutral-900/90 dark:to-transparent pointer-events-none"></div>
          
          <div className="relative pt-4">
            <button
              onClick={() => setShowFullDescription(true)}
              className="text-neutral-900 dark:text-neutral-100 text-sm hover:underline font-medium transition-all duration-200 relative z-10"
            >
              {locale === 'en' ? 'Read more' : 'Devamını oku'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        {isMarkdown ? (
          <div className="rich-text-content markdown-content">
            <ReactMarkdown>{htmlContent}</ReactMarkdown>
          </div>
        ) : (
          <div 
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: isHtml ? htmlContent : `<p>${htmlContent}</p>` }}
          />
        )}
        {isLong && (
          <button
            onClick={() => setShowFullDescription(false)}
            className="mt-4 text-neutral-900 dark:text-neutral-100 text-sm hover:underline font-medium transition-all duration-200"
          >
            {locale === 'en' ? 'Show less' : 'Daha az göster'}
          </button>
        )}
      </div>
    );
  };

  // Effects
  useEffect(() => {
    if (event) {
      setEventData(event);
    }
  }, [event]);

  useEffect(() => {
    if (eventData?.id) {
      fetchEventSections(eventData.id);
    }
  }, [eventData?.id]);

  useEffect(() => {
    setShowFullDescription(false);
  }, [activeTab]);

  // Initialize tab from URL hash on component mount
  useEffect(() => {
    const hash = getHashFromUrl();
    if (hash) {
      const tabFromHash = getTabFromHash(hash);
      setActiveTab(tabFromHash);
      // Scroll to content after tab is set and content is rendered
      scrollToTabContent();
    }
  }, []);

  // Listen for browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = getHashFromUrl();
      const tabFromHash = getTabFromHash(hash);
      setActiveTab(tabFromHash);
      // Scroll to content when navigating with browser buttons
      scrollToTabContent();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', handleHashChange);
      return () => {
        window.removeEventListener('hashchange', handleHashChange);
      };
    }
  }, []);

  // Loading state
  if (loading && !eventData) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="text-left">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
          <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !eventData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error || (locale === 'en' ? 'Event not found' : 'Etkinlik bulunamadı')}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-800 text-white rounded-sm hover:bg-neutral-900 transition-colors"
        >
          {defaultTexts.retry}
        </button>
      </div>
    );
  }

  if (!eventData) return null;

  return (
    <div className="space-y-12">
      <style jsx>{`
        .rich-text-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: rgb(115 115 115);
        }
        .dark .rich-text-content p {
          color: rgb(212 212 212);
        }
        .rich-text-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          color: rgb(23 23 23);
        }
        .dark .rich-text-content h3 {
          color: rgb(245 245 245);
        }
        .rich-text-content strong {
          font-weight: 600;
          color: rgb(23 23 23);
        }
        .dark .rich-text-content strong {
          color: rgb(245 245 245);
        }
        .rich-text-content em {
          font-style: italic;
          color: rgb(82 82 82);
        }
        .dark .rich-text-content em {
          color: rgb(163 163 163);
        }
        .rich-text-content ul {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .rich-text-content li {
          margin-bottom: 0.5rem;
          list-style-type: disc;
          color: rgb(115 115 115);
        }
        .dark .rich-text-content li {
          color: rgb(212 212 212);
        }
        
        /* Markdown-specific styles */
        .markdown-content h1 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          color: rgb(23 23 23);
          border-bottom: 1px solid rgb(229 229 229);
          padding-bottom: 0.25rem;
        }
        .dark .markdown-content h1 {
          color: rgb(245 245 245);
          border-bottom-color: rgb(64 64 64);
        }
        .markdown-content h2 {
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          margin: 1rem 0 0.5rem 0 !important;
          color: rgb(23 23 23) !important;
        }
        .dark .markdown-content h2 {
          color: rgb(245 245 245) !important;
        }
        .markdown-content h3 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0.75rem 0 0.25rem 0;
          color: rgb(23 23 23);
        }
        .dark .markdown-content h3 {
          color: rgb(245 245 245);
        }
        .markdown-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: rgb(115 115 115);
        }
        .dark .markdown-content p {
          color: rgb(212 212 212);
        }
        .markdown-content ul {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .markdown-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .markdown-content li {
          margin-bottom: 0.5rem;
          color: rgb(115 115 115);
          line-height: 1.6;
        }
        .dark .markdown-content li {
          color: rgb(212 212 212);
        }
        .markdown-content code {
          background-color: rgb(243 244 246);
          color: rgb(220 38 127);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }
        .dark .markdown-content code {
          background-color: rgb(64 64 64);
          color: rgb(251 146 60);
        }
        .markdown-content pre {
          background-color: rgb(243 244 246);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .dark .markdown-content pre {
          background-color: rgb(64 64 64);
        }
        .markdown-content pre code {
          background-color: transparent;
          color: rgb(55 65 81);
          padding: 0;
          border-radius: 0;
        }
        .dark .markdown-content pre code {
          color: rgb(229 231 235);
        }
        .markdown-content blockquote {
          border-left: 4px solid rgb(229 229 229);
          margin: 1rem 0;
          padding-left: 1rem;
          color: rgb(107 114 128);
          font-style: italic;
        }
        .dark .markdown-content blockquote {
          border-left-color: rgb(64 64 64);
          color: rgb(156 163 175);
        }
        .markdown-content a {
          color: rgb(59 130 246);
          text-decoration: underline;
          text-decoration-color: transparent;
          transition: text-decoration-color 0.2s;
        }
        .markdown-content a:hover {
          text-decoration-color: rgb(59 130 246);
        }
        .dark .markdown-content a {
          color: rgb(96 165 250);
        }
        .dark .markdown-content a:hover {
          text-decoration-color: rgb(96 165 250);
        }
        .markdown-content strong {
          font-weight: 600;
          color: rgb(23 23 23);
        }
        .dark .markdown-content strong {
          color: rgb(245 245 245);
        }
        .markdown-content em {
          font-style: italic;
          color: rgb(82 82 82);
        }
        .dark .markdown-content em {
          color: rgb(163 163 163);
        }
        
        .tab-content {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="text-left">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {eventData.title}
            </h1>
            <div className="w-16 h-px bg-[#990000]"></div>
          </div>
          
          {/* Expired event indicator for header */}
          {isEventExpired(eventData) && (
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm font-medium border border-gray-200 dark:border-gray-700">
              <AlertCircle className="w-4 h-4" />
              <span>{defaultTexts.eventExpired}</span>
            </div>
          )}
        </div>
      </div>

      <div id="event-tabs" className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => handleTabChange('overview')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {defaultTexts.overview}
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('agenda')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'agenda'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {defaultTexts.agenda}
            {activeTab === 'agenda' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('speakers')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'speakers'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {defaultTexts.speakers}
            {activeTab === 'speakers' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => handleTabChange('comments')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'comments'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {defaultTexts.comments}
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
        </nav>
      </div>

      <div className="tab-content" key={activeTab}>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              {renderRichText(eventData.description)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  {defaultTexts.interactiveSessions}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {locale === 'en' ? 'Engage with speakers and other participants through interactive sessions' : 'İnteraktif oturumlar aracılığıyla konuşmacılarla ve diğer katılımcılarla etkileşime geçin'}
                </p>
              </div>

              <div className="text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  {defaultTexts.networkingOpportunities}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {locale === 'en' ? 'Build valuable connections with industry professionals and peers' : 'Sektör profesyonelleri ve meslektaşlarınızla değerli bağlantılar kurun'}
                </p>
              </div>

              <div className="text-left sm:col-span-2 lg:col-span-1">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  {defaultTexts.certificateIncluded}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {locale === 'en' ? 'Receive a certificate upon successful completion of the event' : 'Etkinliği başarıyla tamamladığınızda sertifika alın'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              {locale === 'en' ? 'Event Agenda' : 'Etkinlik Programı'}
            </h3>
            
            {/* Loading state for sections */}
            {loading && (
              <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-lg"></div>
              </div>
            )}

            {/* Sections content */}
            {!loading && (
              <div className="space-y-6">
                {sections.length > 0 ? (
                  sections.map((section) => (
                    <div key={section.id} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3 flex-wrap gap-2">
                          {section.start_time && section.end_time && (
                            <div className="text-sm text-neutral-600 dark:text-neutral-400 flex flex-col">
                              <span className="font-medium">{formatTime(section.start_time)} - {formatTime(section.end_time)}</span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {formatDateWithDay(section.start_time)}
                              </span>
                              {section.duration_minutes && (
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  ({formatDuration(section.duration_minutes)})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {section.is_featured && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 rounded-full text-xs font-medium flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              {locale === 'en' ? 'Featured' : 'Öne Çıkan'}
                            </span>
                          )}
                          
                          {section.is_mandatory && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-medium flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {locale === 'en' ? 'Mandatory' : 'Zorunlu'}
                            </span>
                          )}
                          
                          {section.difficulty_level && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyLevelColor(section.difficulty_level)}`}>
                              {getDifficultyLevelText(section.difficulty_level)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        {section.title}
                      </h4>
                      
                      {section.description && (
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                          {section.description}
                        </p>
                      )}
                      
                      {/* Location and meeting info */}
                      {(section.location_name || section.meeting_room || section.meeting_url) && (
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          {section.location_name && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{section.location_name}</span>
                            </div>
                          )}
                          {section.meeting_room && (
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4" />
                              <span>{section.meeting_room}</span>
                            </div>
                          )}
                          {section.meeting_url && (
                            <a 
                              href={section.meeting_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>{defaultTexts.joinSession}</span>
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Speaker info */}
                      {section.speaker_name && (
                        <div className="flex items-start space-x-3 mb-4">
                          {section.speaker_image_url ? (
                            <Image
                              src={section.speaker_image_url}
                              alt={section.speaker_name}
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center border-2 border-neutral-300 dark:border-neutral-500">
                              <User className="w-6 h-6 text-neutral-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h5 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              {section.speaker_name}
                            </h5>
                            {section.speaker_title && (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                {section.speaker_title}
                              </p>
                            )}
                            {section.speaker_bio && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                                {section.speaker_bio}
                              </p>
                            )}
                            {section.speaker_linkedin_url && (
                              <a 
                                href={section.speaker_linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors mt-2"
                              >
                                <Linkedin className="w-3 h-3" />
                                <span>LinkedIn</span>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Resources and materials */}
                      {(section.materials_url || section.slides_url || section.recording_url) && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {section.materials_url && (
                            <a 
                              href={section.materials_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 rounded-md text-xs hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <Download className="w-3 h-3" />
                              <span>{defaultTexts.downloadMaterials}</span>
                            </a>
                          )}
                          {section.slides_url && (
                            <a 
                              href={section.slides_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 rounded-md text-xs hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{defaultTexts.viewSlides}</span>
                            </a>
                          )}
                          {section.recording_url && (
                            <a 
                              href={section.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 rounded-md text-xs hover:bg-purple-200 dark:hover:bg-purple-900/30 transition-colors"
                            >
                              <Video className="w-3 h-3" />
                              <span>{defaultTexts.recordingAvailable}</span>
                            </a>
                          )}
                        </div>
                      )}
                      
                      {/* Tags */}
                      {section.tags && section.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {section.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center space-x-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 rounded text-xs"
                            >
                              <Tag className="w-3 h-3" />
                              <span>{tag}</span>
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Attendance info */}
                      {section.max_attendees && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-600 dark:text-neutral-400">
                              {locale === 'en' ? 'Session Capacity' : 'Oturum Kapasitesi'}
                            </span>
                            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
                              {section.max_attendees} {locale === 'en' ? 'attendees' : 'katılımcı'}
                            </span>
                          </div>
                          {section.requires_registration && (
                            <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>{locale === 'en' ? 'Separate registration required' : 'Ayrı kayıt gerekli'}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">
                      {locale === 'en' ? 'Event agenda will be available soon.' : 'Etkinlik programı yakında yayınlanacak.'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'speakers' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              {defaultTexts.expertSpeakers}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(() => {
                // Create unique speakers list by filtering out duplicates
                const uniqueSpeakers = sections
                  .filter(s => s.speaker_name)
                  .reduce((acc, section) => {
                    const existingSpeaker = acc.find(s => s.speaker_name === section.speaker_name);
                    if (!existingSpeaker) {
                      acc.push(section);
                    }
                    return acc;
                  }, [] as typeof sections);

                return uniqueSpeakers.map((section) => (
                  <div key={`speaker-${section.speaker_name}`} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
                    <div className="text-center">
                      {section.speaker_image_url ? (
                        <Image
                          src={section.speaker_image_url}
                          alt={section.speaker_name!}
                          width={80}
                          height={80}
                          className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-2 border-neutral-200 dark:border-neutral-600 shadow-md"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 flex items-center justify-center border-2 border-neutral-300 dark:border-neutral-500">
                          <User className="w-10 h-10 text-neutral-400" />
                        </div>
                      )}
                      
                      <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        {section.speaker_name}
                      </h4>
                      
                      {section.speaker_title && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                          {section.speaker_title}
                        </p>
                      )}
                      
                      {section.speaker_bio && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 leading-relaxed">
                          {section.speaker_bio}
                        </p>
                      )}
                      
                      {section.speaker_linkedin_url && (
                        <a 
                          href={section.speaker_linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                ));
              })()}
              
              {(() => {
                const uniqueSpeakers = sections
                  .filter(s => s.speaker_name)
                  .reduce((acc, section) => {
                    const existingSpeaker = acc.find(s => s.speaker_name === section.speaker_name);
                    if (!existingSpeaker) {
                      acc.push(section);
                    }
                    return acc;
                  }, [] as typeof sections);
                
                return uniqueSpeakers.length === 0;
              })() && (
                <div className="col-span-full text-center py-12">
                  <Mic className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {locale === 'en' ? 'Speaker information will be available soon.' : 'Konuşmacı bilgileri yakında yayınlanacak.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && eventData && (
          <EventComments 
            event={eventData}
            eventSlug={eventSlug || ''}
            texts={defaultTexts}
            locale={locale}
          />
        )}
        
      </div>

      {eventData.organizer_name && (
        <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-8">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
            {defaultTexts.organizer}
          </h3>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
          
          <div className="flex flex-col sm:flex-row items-start space-y-6 sm:space-y-0 sm:space-x-6">
            <div className="flex-shrink-0">
              {eventData.organizer_image_url ? (
                <Image
                  src={eventData.organizer_image_url}
                  alt={eventData.organizer_name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-sm object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-sm flex items-center justify-center">
                  <User className="w-10 h-10 text-neutral-600 dark:text-neutral-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {eventData.organizer_name}
              </h4>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {eventData.organizer_linkedin && (
                  <a
                    href={eventData.organizer_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-sm font-medium transition-colors text-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>{defaultTexts.viewProfile}</span>
                  </a>
                )}
                
                {eventData.organizer_email && (
                  <a
                    href={`mailto:${eventData.organizer_email}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{defaultTexts.contactOrganizer}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventMainContent;