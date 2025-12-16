"use client";

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, MapPin, Users, Clock, AlertCircle, Star } from 'lucide-react';
import { getEventBySlug, mapEventTypeToLocale } from '../../../../../lib/eventService';
import { getEventAttendeeCount } from '../../../../../lib/eventUtils'; // Import the function
import EventHeroSection from './components/EventHeroSection';
import EventMainContent from './components/EventMainContent';
import EventSidebar from './components/EventSidebar';
import EventFeatures from './components/EventFeatures';
import EventCertificate from './components/EventCertificate';
import EventFAQ from './components/EventFAQ';
import EventTestimonials from './components/EventTestimonials';
import EventLoadingSkeleton from './components/EventLoadingSkeleton';
import EventErrorState from './components/EventErrorState';
import { texts } from './data/eventTexts';

// Updated Event interface - add current_attendees back for compatibility with existing components
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
  current_attendees: number; // Keep for compatibility with existing components
  enrollment_count: number; // Primary source of truth from myuni_event_enrollments
  registration_deadline: string | null;
  is_registration_open: boolean;
  thumbnail_url: string | null;
  banner_url: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  original_price?: number;
}

// Define the type for EventErrorState texts
interface EventErrorStateTexts {
  eventNotFound: string;
  eventNotFoundDesc: string;
  backToEvents: string;
  [key: string]: string;
}

// Define specific component text interfaces to avoid conflicts
interface ComponentTexts {
  [key: string]: string;
}

// Updated API response interface - make enrollment_count optional for backward compatibility
interface APIEventResponse {
  id: unknown;
  slug: unknown;
  name?: unknown;
  title: unknown;
  description: unknown;
  organizer_name?: unknown;
  organizer_email?: unknown;
  organizer_linkedin?: unknown;
  organizer_image_url?: unknown;
  event_type?: unknown;
  category?: unknown;
  tags?: unknown[];
  start_date: unknown;
  end_date?: unknown;
  timezone?: unknown;
  duration?: unknown;
  duration_minutes?: unknown;
  is_online: unknown;
  location_name?: unknown;
  location_address?: unknown;
  meeting_url?: unknown;
  is_paid?: unknown;
  price: unknown;
  originalPrice?: unknown;
  original_price?: unknown;
  max_attendees?: unknown;
  current_attendees?: unknown; // Keep for backward compatibility
  enrollment_count?: unknown; // Optional - will be provided by updated API
  registration_deadline?: unknown;
  is_registration_open: unknown;
  thumbnail_url?: unknown;
  banner_url?: unknown;
  status?: unknown;
  is_active?: unknown;
  is_featured?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
  [key: string]: unknown;
}

// Event Type Indicator Component - Updated without emojis
const EventTypeIndicator = ({ eventType, size = 'md' }: {
  eventType: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const getTypeConfig = () => {
    switch (eventType) {
      case 'workshop':
        return {
          label: 'Workshop',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          textColor: 'text-blue-700 dark:text-blue-300',
          borderColor: 'border-blue-200 dark:border-blue-700'
        };
      case 'seminar':
        return {
          label: 'Seminer',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          textColor: 'text-green-700 dark:text-green-300',
          borderColor: 'border-green-200 dark:border-green-700'
        };
      case 'conference':
        return {
          label: 'Konferans',
          bgColor: 'bg-purple-100 dark:bg-purple-900/20',
          textColor: 'text-purple-700 dark:text-purple-300',
          borderColor: 'border-purple-200 dark:border-purple-700'
        };
      case 'meetup':
        return {
          label: 'Buluşma',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          textColor: 'text-orange-700 dark:text-orange-300',
          borderColor: 'border-orange-200 dark:border-orange-700'
        };
      case 'webinar':
      default:
        return {
          label: 'Webinar',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          textColor: 'text-red-700 dark:text-red-300',
          borderColor: 'border-red-200 dark:border-red-700'
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

interface EventDetailPageProps {
  params: Promise<{
    slug: string;
    locale: string;
    eventType: string;
  }>;
}

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [eventDetail, setEventDetails] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realAttendeeCount, setRealAttendeeCount] = useState<number>(0); // Add real attendee count state
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  
  const resolvedParams = use(params);
  const { locale, eventType, slug } = resolvedParams;

  // Geçerli eventType kontrolü
  const validEventTypes = {
    tr: 'etkinlik',
    en: 'event'
  };

  // Eğer eventType geçerli değilse 404 göster
  if (validEventTypes[locale as keyof typeof validEventTypes] !== eventType) {
    notFound();
  }
  
  // Dil metinlerini al - safer approach
  const t = texts[locale as keyof typeof texts] || texts.tr;

  // Utility function to safely get text values
  const getTextValue = (key: string): string => {
    const value = (t as any)[key];
    return typeof value === 'string' ? value : 
           typeof value === 'object' ? JSON.stringify(value) : 
           String(value || '');
  };

  useEffect(() => {
    if (slug) {
      getEvent(slug, locale);
    }
  }, [slug, locale]);

  // Fetch real attendee count when event is loaded
  useEffect(() => {
    const fetchRealAttendeeCount = async () => {
      if (eventDetail?.id) {
        try {
          const realCount = await getEventAttendeeCount(eventDetail.id);
          setRealAttendeeCount(realCount);
          
          // Update eventDetail with real count
          setEventDetails(prev => prev ? {
            ...prev,
            enrollment_count: realCount,
            current_attendees: realCount
          } : null);
        } catch (error) {
          console.error('Error fetching real attendee count:', error);
          setRealAttendeeCount(0);
        }
      }
    };

    fetchRealAttendeeCount();
  }, [eventDetail?.id]);

  // Fetch average rating when event is loaded
  useEffect(() => {
    const fetchAverageRating = async () => {
      if (eventDetail?.id) {
        try {
          const response = await fetch(`/api/event-comments?eventId=${eventDetail.id}&action=rating`);
          if (response.ok) {
            const data = await response.json();
            setAverageRating(data.averageRating);
            setTotalRatings(data.totalRatings);
          }
        } catch (error) {
          console.error('Error fetching average rating:', error);
          setAverageRating(null);
          setTotalRatings(0);
        }
      }
    };

    fetchAverageRating();
  }, [eventDetail?.id]);

  const getEvent = async (eventSlug: string, eventLocale: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const eventData: APIEventResponse | null = await getEventBySlug(eventSlug, eventLocale);
      
      if (!eventData) {
        setError('Event not found');
        return;
      }

      // Map enrollment_count to both current_attendees and enrollment_count for compatibility
      // We'll get the real count from getEventAttendeeCount function later
      const enrollmentCount = eventData.enrollment_count !== undefined ? 
        Number(eventData.enrollment_count) : 0; // Use 0 if enrollment_count not provided
      
      const mappedEvent: Event = {
        id: String(eventData.id || ''),
        slug: String(eventData.slug || eventSlug),
        title: String(eventData.title || eventData.name || ''),
        description: eventData.description ? String(eventData.description) : null,
        organizer_name: eventData.organizer_name ? String(eventData.organizer_name) : null,
        organizer_email: eventData.organizer_email ? String(eventData.organizer_email) : null,
        organizer_linkedin: eventData.organizer_linkedin ? String(eventData.organizer_linkedin) : null,
        organizer_image_url: eventData.organizer_image_url ? String(eventData.organizer_image_url) : null,
        event_type: (eventData.event_type as 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar') || 'webinar',
        category: eventData.category ? String(eventData.category) : null,
        tags: Array.isArray(eventData.tags) ? eventData.tags.map(tag => String(tag)) : null,
        start_date: String(eventData.start_date || ''),
        end_date: eventData.end_date ? String(eventData.end_date) : null,
        timezone: eventData.timezone ? String(eventData.timezone) : 'UTC',
        duration_minutes: eventData.duration_minutes ? Number(eventData.duration_minutes) : null,
        is_online: Boolean(eventData.is_online),
        location_name: eventData.location_name ? String(eventData.location_name) : null,
        location_address: eventData.location_address ? String(eventData.location_address) : null,
        meeting_url: eventData.meeting_url ? String(eventData.meeting_url) : null,
        is_paid: Boolean(eventData.is_paid),
        price: eventData.price ? Number(eventData.price) : null,
        max_attendees: eventData.max_attendees ? Number(eventData.max_attendees) : null,
        current_attendees: enrollmentCount, // For compatibility with existing components
        enrollment_count: enrollmentCount, // Primary source of truth from myuni_event_enrollments
        registration_deadline: eventData.registration_deadline ? String(eventData.registration_deadline) : null,
        is_registration_open: Boolean(eventData.is_registration_open),
        thumbnail_url: eventData.thumbnail_url ? String(eventData.thumbnail_url) : null,
        banner_url: eventData.banner_url ? String(eventData.banner_url) : null,
        status: (eventData.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled') || 'upcoming',
        is_active: Boolean(eventData.is_active ?? true),
        is_featured: Boolean(eventData.is_featured),
        created_at: eventData.created_at ? String(eventData.created_at) : new Date().toISOString(),
        updated_at: eventData.updated_at ? String(eventData.updated_at) : new Date().toISOString(),
        original_price: Number(eventData.original_price || eventData.originalPrice || 0) || undefined,
      };

      setEventDetails(mappedEvent);

    } catch (error) {
      console.error("Etkinlik detayları alınırken hata:", error);
      setError('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  // Geliştirilmiş tarih formatlama fonksiyonları
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Tarih aralığını formatlayan yeni fonksiyon
  const formatDateRange = (startDate: string, endDate?: string | null) => {
    const start = new Date(startDate);
    
    if (!endDate) {
      return formatDate(startDate);
    }
    
    const end = new Date(endDate);
    
    // Aynı gün mü kontrol et
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return formatDate(startDate);
    }
    
    // Aynı ay mı kontrol et
    const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
    
    if (sameMonth) {
      const startDay = start.getDate();
      const endFormatted = formatDate(endDate);
      return locale === 'tr' 
        ? `${startDay} - ${endFormatted}`
        : `${startDay} - ${endFormatted}`;
    }
    
    // Farklı aylar
    const startFormatted = formatDate(startDate);
    const endFormatted = formatDate(endDate);
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      dayName: date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        weekday: 'long'
      })
    };
  };

  const isRegistrationOpen = () => {
    if (!eventDetail?.registration_deadline) return eventDetail?.is_registration_open;
    const deadline = new Date(eventDetail.registration_deadline);
    const now = new Date();
    return eventDetail.is_registration_open && now < deadline;
  };

  const getTimeUntilEvent = () => {
    if (!eventDetail?.start_date) return null;
    const eventDate = new Date(eventDetail.start_date);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 1) {
      return `${diffDays} ${locale === 'tr' ? 'gün kaldı' : 'days left'}`;
    } else if (diffHours > 0) {
      return `${diffHours} ${locale === 'tr' ? 'saat kaldı' : 'hours left'}`;
    }
    return null;
  };

  const getSpotsLeft = () => {
    if (!eventDetail?.max_attendees) return null;
    const spotsLeft = eventDetail.max_attendees - realAttendeeCount; // Use real count
    return spotsLeft > 0 ? spotsLeft : 0;
  };

  // Check if event has expired
  const isEventExpired = (): boolean => {
    if (!eventDetail) return false;
    
    const now = new Date();
    
    // If event status is completed or cancelled, it's expired
    if (eventDetail.status === 'completed' || eventDetail.status === 'cancelled') {
      return true;
    }
    
    // Check if event has ended based on end_date
    if (eventDetail.end_date) {
      const endDate = new Date(eventDetail.end_date);
      return now > endDate;
    }
    
    // If no end_date but has duration_minutes, calculate end time from start_date
    if (eventDetail.duration_minutes) {
      const startDate = new Date(eventDetail.start_date);
      const calculatedEndTime = new Date(startDate.getTime() + eventDetail.duration_minutes * 60 * 1000);
      return now > calculatedEndTime;
    }
    
    // If no end_date and no duration, consider expired 2 hours after start for ongoing events
    if (eventDetail.status === 'ongoing') {
      const startDate = new Date(eventDetail.start_date);
      const twoHoursAfterStart = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
      return now > twoHoursAfterStart;
    }
    
    return false;
  };

  // Convert texts to ComponentTexts format safely
  const componentTexts: ComponentTexts = Object.keys(t).reduce((acc, key) => {
    acc[key] = getTextValue(key);
    return acc;
  }, {} as ComponentTexts);

  if (loading) {
    return <EventLoadingSkeleton />;
  }

  if (error || !eventDetail) {
    // Create error texts safely
    const errorTexts: EventErrorStateTexts = {
      eventNotFound: getTextValue('eventNotFound') || 'Event not found',
      eventNotFoundDesc: getTextValue('eventNotFoundDesc') || 'The event you are looking for could not be found.',
      backToEvents: getTextValue('backToEvents') || 'Back to events',
    };

    return (
      <EventErrorState 
        error={error}
        locale={locale}
        eventType={eventType}
        onRetry={() => getEvent(slug, locale)}
        texts={errorTexts}
      />
    );
  }

  const timeUntilEvent = getTimeUntilEvent();
  const registrationOpen = isRegistrationOpen();
  const spotsLeft = getSpotsLeft();
  const eventDateTime = formatDateTime(eventDetail.start_date);
  const eventDateRange = formatDateRange(eventDetail.start_date, eventDetail.end_date);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900">
      {/* Navigation */}
      <div className="border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-3 sm:py-4">
          <Link 
            href={`/${locale}/${eventType}`}
            className="inline-flex items-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="truncate">{componentTexts.backToEvents}</span>
          </Link>
        </div>
      </div>

      {/* Event Type Header */}
      <div className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col gap-3 lg:hidden">
            {/* Event Type ve Registration Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <EventTypeIndicator eventType={eventDetail.event_type} size="sm" />
              
              {/* Registration Status */}
              {isEventExpired() ? (
                <>
                  <div className="flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{locale === 'tr' ? 'Etkinlik Sona Erdi' : 'Event Ended'}</span>
                  </div>
                  {averageRating !== null && totalRatings > 0 && (
                    <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-200 dark:border-yellow-800">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-xs opacity-75">({totalRatings})</span>
                    </div>
                  )}
                </>
              ) : !registrationOpen ? (
                <div className="flex items-center space-x-1.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{locale === 'tr' ? 'Kayıt Kapalı' : 'Registration Closed'}</span>
                </div>
              ) : spotsLeft === 0 ? (
                <div className="flex items-center space-x-1.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>{locale === 'tr' ? 'Tükendi' : 'Sold Out'}</span>
                </div>
              ) : timeUntilEvent ? (
                <div className="flex items-center space-x-1.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeUntilEvent}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{locale === 'tr' ? 'Kayıt Açık' : 'Registration Open'}</span>
                </div>
              )}
            </div>
            
            {/* Event Info */}
            <div className="flex items-center gap-4 overflow-x-auto pb-1">
              <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{eventDateRange}</span>
              </div>
              
              <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{eventDateTime.time}</span>
              </div>
              
              {!eventDetail.is_online && eventDetail.location_name && (
                <div className="flex items-center space-x-1.5 text-xs text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{eventDetail.location_name}</span>
                </div>
              )}
              
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-6">
            <div className="flex items-center gap-6">
              <div className="w-fit">
                <EventTypeIndicator eventType={eventDetail.event_type} size="sm" />
              </div>
              
              <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{eventDateRange}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{eventDateTime.time}</span>
                </div>
                
                {!eventDetail.is_online && eventDetail.location_name && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{eventDetail.location_name}</span>
                  </div>
                )}
                
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isEventExpired() ? (
                <>
                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full text-sm border border-gray-200 dark:border-gray-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>{locale === 'tr' ? 'Etkinlik Sona Erdi' : 'Event Ended'}</span>
                  </div>
                  {averageRating !== null && totalRatings > 0 && (
                    <div className="flex items-center space-x-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-3 py-1.5 rounded-full text-sm border border-yellow-200 dark:border-yellow-800">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{averageRating.toFixed(1)}</span>
                      <span className="text-xs opacity-75">({totalRatings})</span>
                    </div>
                  )}
                </>
              ) : !registrationOpen ? (
                <div className="flex items-center space-x-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-full text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{locale === 'tr' ? 'Kayıt Kapalı' : 'Registration Closed'}</span>
                </div>
              ) : spotsLeft === 0 ? (
                <div className="flex items-center space-x-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-full text-sm">
                  <Users className="w-4 h-4" />
                  <span>{locale === 'tr' ? 'Tükendi' : 'Sold Out'}</span>
                </div>
              ) : timeUntilEvent ? (
                <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-3 py-1.5 rounded-full text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{timeUntilEvent}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{locale === 'tr' ? 'Kayıt Açık' : 'Registration Open'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6 py-8 sm:py-12">
        {/* Hero Section */}
        <EventHeroSection 
          event={eventDetail}
          eventId={eventDetail?.id}
          texts={componentTexts}
          locale={locale}
        />

        <div className="block lg:hidden mb-8">
          <EventSidebar 
            event={eventDetail}
            slug={slug}
            locale={locale}
          />
        </div>

        {/* Event Additional Info */}
        {(eventDetail.registration_deadline || eventDetail.location_address || eventDetail.organizer_name) && (
          <div className="mb-8 sm:mb-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-4 sm:mb-6">
              {locale === 'tr' ? 'Etkinlik Detayları' : 'Event Details'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Etkinlik Tarihi - Her zaman göster */}
              <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {locale === 'tr' ? 'Etkinlik Tarihi' : 'Event Date'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  {eventDateRange}
                </p>
                {eventDetail.end_date && (
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {eventDateTime.time} {locale === 'tr' ? 'başlangıç' : 'start time'}
                  </p>
                )}
              </div>

              {eventDetail.registration_deadline && registrationOpen && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {locale === 'tr' ? 'Son Kayıt' : 'Registration Deadline'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {formatDate(eventDetail.registration_deadline)}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {locale === 'tr' ? 'Kayıt için acele edin!' : 'Hurry up to register!'}
                  </p>
                </div>
              )}

              {!eventDetail.is_online && eventDetail.location_address && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {locale === 'tr' ? 'Adres' : 'Address'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {eventDetail.location_address}
                  </p>
                </div>
              )}

              {eventDetail.organizer_name && (
                <div className="bg-white dark:bg-neutral-800 p-3 sm:p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {locale === 'tr' ? 'Organizatör' : 'Organizer'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {eventDetail.organizer_name}
                  </p>
                  {eventDetail.category && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {eventDetail.category}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            {/* Event Info */}
            <EventMainContent 
              event={eventDetail}
              eventSlug={slug}
              texts={componentTexts}
              locale={locale}
            />

            {/* Event Features */}
            <EventFeatures texts={componentTexts} /> 

            {/* Certificate Section */}
            <EventCertificate 
              event={eventDetail}
              texts={componentTexts} 
            /> 
          </div>

          {/* Sidebar - Desktop only */}
          <div className="hidden lg:block space-y-6 sm:space-y-8">
            <EventSidebar 
              event={eventDetail}
              slug={slug}
              locale={locale}
            />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 sm:mt-16">
          <EventFAQ texts={componentTexts} /> 
        </div>

        {/* Testimonials */}
        <div className="mt-12 sm:mt-16">
          <EventTestimonials texts={componentTexts} locale={locale} /> 
        </div>
      </div>
    </div>
  );
}