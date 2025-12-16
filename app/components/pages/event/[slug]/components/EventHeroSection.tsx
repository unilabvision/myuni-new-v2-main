//myuni-new-v2.1/app/components/pages/event/[slug]/components/EventHeroSection.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  User, 
  Play, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Award,
  Share2,
  Bookmark,
  BookmarkPlus,
  Linkedin,
  Globe,
  Video,
  Target,
  MessageCircle
} from 'lucide-react';

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

interface EventHeroSectionProps {
  event?: Event;
  texts?: {
    registerNow?: string;
    registrationClosed?: string;
    eventFull?: string;
    joinEvent?: string;
    watchRecording?: string;
    upcoming?: string;
    ongoing?: string;
    completed?: string;
    cancelled?: string;
    free?: string;
    paid?: string;
    attendees?: string;
    registrationDeadline?: string;
    eventDate?: string;
    eventTime?: string;
    eventDuration?: string;
    eventLocation?: string;
    onlineEvent?: string;
    inPersonEvent?: string;
    organizer?: string;
    category?: string;
    tags?: string;
    description?: string;
    shareEvent?: string;
    bookmarkEvent?: string;
    contactOrganizer?: string;
    viewProfile?: string;
    joinMeeting?: string;
    watchLive?: string;
    viewRecording?: string;
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
    [key: string]: string | undefined;
  };
  eventId?: string;
  eventSlug?: string;
  userId?: string;
  locale?: string;
}

const EventHeroSection: React.FC<EventHeroSectionProps> = ({ 
  event, 
  texts = {},
  eventId,
  eventSlug,
  userId,
  locale = 'tr'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventData, setEventData] = useState<Event | null>(event || null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Default texts
  const defaultTexts = {
    registerNow: locale === 'en' ? 'Register Now' : 'Şimdi Kayıt Ol',
    registrationClosed: locale === 'en' ? 'Registration Closed' : 'Kayıt Kapandı',
    eventFull: locale === 'en' ? 'Event Full' : 'Etkinlik Dolu',
    joinEvent: locale === 'en' ? 'Join Event' : 'Etkinliğe Katıl',
    watchRecording: locale === 'en' ? 'Watch Recording' : 'Kaydı İzle',
    upcoming: locale === 'en' ? 'Upcoming' : 'Yaklaşan',
    ongoing: locale === 'en' ? 'Ongoing' : 'Devam Ediyor',
    completed: locale === 'en' ? 'Completed' : 'Tamamlandı',
    cancelled: locale === 'en' ? 'Cancelled' : 'İptal Edildi',
    eventExpired: locale === 'en' ? 'Event Ended' : 'Etkinlik Sona Erdi',
    free: locale === 'en' ? 'Free' : 'Ücretsiz',
    paid: locale === 'en' ? 'Paid' : 'Ücretli',
    attendees: locale === 'en' ? 'Attendees' : 'Katılımcılar',
    registrationDeadline: locale === 'en' ? 'Registration Deadline' : 'Kayıt Son Tarihi',
    eventDate: locale === 'en' ? 'Event Date' : 'Etkinlik Tarihi',
    eventTime: locale === 'en' ? 'Event Time' : 'Etkinlik Saati',
    eventDuration: locale === 'en' ? 'Duration' : 'Süre',
    eventLocation: locale === 'en' ? 'Location' : 'Konum',
    onlineEvent: locale === 'en' ? 'Online Event' : 'Çevrimiçi Etkinlik',
    inPersonEvent: locale === 'en' ? 'In-Person Event' : 'Yüz Yüze Etkinlik',
    organizer: locale === 'en' ? 'Organizer' : 'Organizatör',
    category: locale === 'en' ? 'Category' : 'Kategori',
    tags: locale === 'en' ? 'Tags' : 'Etiketler',
    description: locale === 'en' ? 'Description' : 'Açıklama',
    shareEvent: locale === 'en' ? 'Share Event' : 'Etkinliği Paylaş',
    bookmarkEvent: locale === 'en' ? 'Bookmark Event' : 'Etkinliği Kaydet',
    contactOrganizer: locale === 'en' ? 'Contact Organizer' : 'Organizatörle İletişim',
    viewProfile: locale === 'en' ? 'View Profile' : 'Profili Görüntüle',
    joinMeeting: locale === 'en' ? 'Join Meeting' : 'Toplantıya Katıl',
    watchLive: locale === 'en' ? 'Watch Live' : 'Canlı İzle',
    viewRecording: locale === 'en' ? 'View Recording' : 'Kaydı Görüntüle',
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
    ...texts
  };

  // Helper functions
  const getBannerUrl = (eventData: Event | null): string => {
    if (!eventData) return '/default-event-banner.jpg';
    return eventData.banner_url || eventData.thumbnail_url || '/default-event-banner.jpg';
  };

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

  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getEventStatusText = (status: string): string => {
    switch (status) {
      case 'upcoming': return defaultTexts.upcoming;
      case 'ongoing': return defaultTexts.ongoing;
      case 'completed': return defaultTexts.completed;
      case 'cancelled': return defaultTexts.cancelled;
      default: return status;
    }
  };

  const getEventStatusColor = (status: string): string => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
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

  const isRegistrationOpen = (eventData: Event): boolean => {
    if (!eventData.is_registration_open) return false;
    if (eventData.registration_deadline) {
      return new Date() < new Date(eventData.registration_deadline);
    }
    return true;
  };

  const isEventFull = (eventData: Event): boolean => {
    return eventData.max_attendees ? eventData.current_attendees >= eventData.max_attendees : false;
  };

  const canJoinEvent = (eventData: Event): boolean => {
    return eventData.status === 'ongoing' && eventData.is_online && !!eventData.meeting_url;
  };

  const canWatchRecording = (eventData: Event): boolean => {
    return eventData.status === 'completed' && eventData.is_online;
  };

  // Check if event is live
  const checkLiveStatus = (eventData: Event) => {
    if (eventData.status !== 'ongoing') return false;
    
    const now = new Date();
    const startDate = new Date(eventData.start_date);
    const endDate = eventData.end_date ? new Date(eventData.end_date) : null;
    
    if (endDate) {
      return now >= startDate && now <= endDate;
    }
    
    // If no end date, consider it live for 2 hours after start
    const twoHoursAfterStart = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    return now >= startDate && now <= twoHoursAfterStart;
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

  // Handle registration
  const handleRegister = () => {
    // Placeholder for registration logic
    console.log('Register for event:', eventData?.id);
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
  };

  // Handle share
  const handleShare = () => {
    if (navigator.share && eventData) {
      navigator.share({
        title: eventData.title,
        text: eventData.description || '',
        url: window.location.href
      }).catch(console.error);
    }
  };

  // Effects
  useEffect(() => {
    if (event) {
      setEventData(event);
      setIsLive(checkLiveStatus(event));
    }
  }, [event]);

  // Loading state
  if (loading) {
    return (
      <div className="mb-8">
        <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="w-full pb-[31.25%] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-neutral-500 font-medium">{defaultTexts.loading}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !eventData) {
    return (
      <div className="mb-8">
        <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
          <div className="w-full pb-[31.25%] relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                    {defaultTexts.error}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 space-y-6">
      {/* Hero Banner - Exact aspect ratio for 1920x600 image (3.2:1) */}
      <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
        <div className="w-full pb-[31.25%] relative">
          <Image
            src={getBannerUrl(eventData)}
            alt={eventData.title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 1200px"
            priority
            quality={90}
          />
          
          {/* Live indicator for ongoing events */}
          {isLive && (
            <div className="absolute top-3 right-3 z-10 flex items-center space-x-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              <span>{locale === 'en' ? 'LIVE' : 'CANLI'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Event Details - Now with a cleaner grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
        </div>
      </div>
    </div>
  );
};

export default EventHeroSection;