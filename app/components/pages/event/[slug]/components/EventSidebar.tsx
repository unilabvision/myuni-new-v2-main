// components/pages/event/[slug]/components/EventSidebar.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Info, AlertCircle, MapPin, Users, ExternalLink, User, Mail, Linkedin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { getAllEvents } from '../../../../../../lib/eventService';
import { getEventAttendeeCount } from '../../../../../../lib/eventUtils';
import { supabase } from '../../../../../../lib/supabase';
import EventForm from './EventForm';

// Event interface matching myuni_events database schema
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
  current_attendees: number; // Bu artık dinamik olarak hesaplanacak
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

interface EventSidebarProps {
  event?: Event;
  slug?: string;
  locale?: string;
}

interface SimilarEvent {
  id: string;
  title: string;
  price: number | null;
  is_paid: boolean;
  thumbnail_url: string | null;
  slug: string;
  event_type: string;
  start_date: string;
  end_date: string | null;
  is_online: boolean;
  current_attendees: number;
  max_attendees: number | null;
}

const EventSidebar: React.FC<EventSidebarProps> = ({ 
  event = {} as Event, 
  slug = 'event-slug', 
  locale = 'tr'
}) => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [showDateTooltip, setShowDateTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState('center');
  const [latestEvents, setLatestEvents] = useState<SimilarEvent[]>([]);
  const [loadingLatestEvents, setLoadingLatestEvents] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  // Dinamik katılımcı sayısı için state
  const [attendeeCountLocal, setAttendeeCountLocal] = useState<number>(event.current_attendees || 0);
  
  // Mobil sabit buton için state
  const [showMobileSticky, setShowMobileSticky] = useState(true);
  
  // Scroll pozisyonunu izlemek için effect
  useEffect(() => {
    const handleScroll = () => {
      // Her durumda sticky butonu göster (en üstteyken de)
      if (window.innerWidth < 768) {
        setShowMobileSticky(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Katılımcı sayısını dinamik olarak getir
  const updateAttendeeCount = useCallback(async () => {
    if (!event.id) return;
    
    try {
      const realCount = await getEventAttendeeCount(event.id);
      setAttendeeCountLocal(realCount);
    } catch (error) {
      console.error('Error updating attendee count:', error);
      // Hata durumunda mevcut değeri koru
      setAttendeeCountLocal(event.current_attendees || 0);
    }
  }, [event.id, event.current_attendees]);

  // Component mount olduğunda ve event.id değiştiğinde katılımcı sayısını güncelle
  useEffect(() => {
    updateAttendeeCount();
  }, [updateAttendeeCount]);

  // Check if user is already registered when component mounts
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (!isSignedIn || !user?.id || !event.id) {
        setIsUserRegistered(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('myuni_event_enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', event.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
          console.error('Error checking registration:', error);
        }
        
        setIsUserRegistered(!!data);
      } catch (error) {
        console.error('Error checking user registration status:', error);
        setIsUserRegistered(false);
      }
    };
    
    checkUserRegistration();
  }, [isSignedIn, user, event.id]);

  // Tooltip pozisyonunu hesaplayan fonksiyon
  const calculateTooltipPosition = useCallback(() => {
    if (!tooltipRef.current || !iconRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const padding = 16;

    const iconCenter = iconRect.left + iconRect.width / 2;
    const tooltipWidth = 288;
    
    const leftPosition = iconCenter - tooltipWidth / 2;
    const rightPosition = leftPosition + tooltipWidth;

    if (leftPosition < padding) {
      setTooltipPosition('left');
    } else if (rightPosition > viewportWidth - padding) {
      setTooltipPosition('right');
    } else {
      setTooltipPosition('center');
    }
  }, []);

  useEffect(() => {
    if (showDateTooltip) {
      setTimeout(() => {
        calculateTooltipPosition();
      }, 0);
    }
  }, [showDateTooltip, calculateTooltipPosition]);

  useEffect(() => {
    const handleResize = () => {
      if (showDateTooltip) {
        calculateTooltipPosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showDateTooltip, calculateTooltipPosition]);

  // Son etkinlikleri getir
  const fetchLatestEvents = useCallback(async () => {
    try {
      setLoadingLatestEvents(true);
      
      const events = await getAllEvents(locale);
      
      // Mevcut etkinlik hariç, aktif ve kayıt açık etkinlikleri filtrele
      const validEvents = events
        .filter((eventItem: Event) => 
          eventItem.id !== event.id && 
          eventItem.is_active && 
          eventItem.is_registration_open &&
          eventItem.slug && 
          eventItem.slug.trim() !== ''
        )
        .slice(0, 3);

      // Her etkinlik için dinamik katılımcı sayısını hesapla
      const eventsWithDynamicCount = await Promise.all(
        validEvents.map(async (eventItem: Event) => {
          try {
            const attendeeCount = await getEventAttendeeCount(eventItem.id);
            return {
              ...eventItem,
              current_attendees: attendeeCount
            };
          } catch (error) {
            console.error(`Error getting attendee count for event ${eventItem.id}:`, error);
            return eventItem; // Hata durumunda orijinal değeri kullan
          }
        })
      );
      
      setLatestEvents(eventsWithDynamicCount as SimilarEvent[]);
    } catch (error) {
      console.error('Error fetching latest events:', error);
      setLatestEvents([]);
    } finally {
      setLoadingLatestEvents(false);
    }
  }, [event.id, locale]);

  useEffect(() => {
    if (event.id) {
      fetchLatestEvents();
    }
  }, [event.id, fetchLatestEvents]);

  const handleLatestEventClick = (eventSlug: string) => {
    if (!eventSlug) return;
    
    const eventRoute = locale === 'tr' ? 'etkinlik' : 'event';
    const url = `/${locale}/${eventRoute}/${eventSlug}`;
    router.push(url);
  };

  // State to track if user is registered
  const [isUserRegistered, setIsUserRegistered] = useState(false);

  // Utility functions
  const formatPrice = (price: number | null, isPaid: boolean) => {
    if (!isPaid || price === 0 || price === null) return locale === 'tr' ? 'Ücretsiz' : 'Free';
    return `₺${price}`;
  };

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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return locale === 'tr' ? '2 saat' : '2 hours';
    
    if (minutes < 60) {
      return `${minutes} ${locale === 'tr' ? 'dakika' : 'minutes'}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ${locale === 'tr' ? 'saat' : 'hours'}`;
    }
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ${locale === 'tr' ? 'saat' : 'hours'}`;
  };

  const getEventTypeText = (eventType: string) => {
    if (locale === 'tr') {
      switch (eventType) {
        case 'workshop': return 'Workshop';
        case 'seminar': return 'Seminer';
        case 'conference': return 'Konferans';
        case 'meetup': return 'Buluşma';
        case 'webinar': return 'Webinar';
        default: return eventType;
      }
    }
    return eventType;
  };

  // Check registration conditions
  const isRegistrationOpen = () => {
    if (!event.registration_deadline) return event.is_registration_open;
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return event.is_registration_open && now < deadline;
  };

  const isEventFull = () => {
    return event.max_attendees && attendeeCountLocal >= event.max_attendees;
  };

  // Tooltip classes
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

  const handleImageError = () => {
    setImageError(true);
  };

  // Handle form success and error callbacks
  const handleRegistrationSuccess = () => {
    // Katılımcı sayısını güncelle
    updateAttendeeCount();
    // Mark user as registered
    setIsUserRegistered(true);
  };

  const handleRegistrationError = (error: string) => {
    // You can show a toast notification here
    console.error('Registration error:', error);
    alert(error);
  };

  // onAttendeesChange callback'i için
  const handleAttendeesChange = (newCount: number) => {
    setAttendeeCountLocal(newCount);
  };

  return (
    <>
      <div className="sticky top-24 space-y-6">
        {/* Ana Registration Card */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
          {/* Fiyat */}
          <div className="mb-6">
            <div className="flex items-baseline space-x-3 mb-2">
              <span className="text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {formatPrice(event.price, event.is_paid)}
              </span>
            </div>
            
            <div className="w-16 h-px bg-[#990000] mb-3"></div>
            
            <div className="inline-block bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-sm text-sm">
              {getEventTypeText(event.event_type)}
            </div>
          </div>

          {/* Etkinlik Bilgileri */}
          <div className="space-y-4 mb-6">
            {/* Tarih & Saat - Güncellenmiş */}
            <div className="flex justify-between items-start py-2 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{locale === 'tr' ? 'Tarih' : 'Date'}</span>
                <div className="relative" ref={iconRef}>
                  <Info 
                    className="w-3 h-3 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 cursor-help transition-colors"
                    onMouseEnter={() => setShowDateTooltip(true)}
                    onMouseLeave={() => setShowDateTooltip(false)}
                    onClick={() => setShowDateTooltip(!showDateTooltip)}
                  />
                  
                  {showDateTooltip && (
                    <>
                      <div 
                        ref={tooltipRef}
                        className={getTooltipClasses()}
                      >
                        <div className="text-left leading-relaxed">
                          <div className="font-medium mb-1">
                            {locale === 'tr' ? 'Etkinlik Detayları' : 'Event Details'}
                          </div>
                          <div className="text-white/90">
                            {locale === 'tr' ? 'Saat Dilimi:' : 'Timezone:'} {event.timezone}
                          </div>
                          {event.start_date && (
                            <div className="text-white/90 mt-1">
                              <div className="font-medium">
                                {locale === 'tr' ? 'Başlangıç:' : 'Start:'}
                              </div>
                              {formatDate(event.start_date)} - {formatTime(event.start_date)}
                            </div>
                          )}
                          {event.end_date && (
                            <div className="text-white/90 mt-1">
                              <div className="font-medium">
                                {locale === 'tr' ? 'Bitiş:' : 'End:'}
                              </div>
                              {formatDate(event.end_date)} - {formatTime(event.end_date)}
                            </div>
                          )}
                          {event.duration_minutes && (
                            <div className="text-white/90 mt-1">
                              {locale === 'tr' ? 'Süre:' : 'Duration:'} {formatDuration(event.duration_minutes)}
                            </div>
                          )}
                        </div>
                        <div className={getArrowClasses()}></div>
                      </div>
                      
                      <div 
                        className="fixed inset-0 z-40 md:hidden" 
                        onClick={() => setShowDateTooltip(false)}
                      />
                    </>
                  )}
                </div>
              </span>
              <div className="text-right">
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 block">
                  {event.start_date ? formatDateRange(event.start_date, event.end_date) : 'TBA'}
                </span>
              </div>
            </div>

            {/* Konum */}
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{locale === 'tr' ? 'Konum' : 'Location'}</span>
              </span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {event.is_online ? 
                  (locale === 'tr' ? 'Online' : 'Online') : 
                  (event.location_name || (locale === 'tr' ? 'Yüz Yüze' : 'In-person'))
                }
              </span>
            </div>

          </div>


          {/* EventForm - Mobil görünümde gizlenecek */}
          <div className="md:block hidden">
            <EventForm 
              event={{
                ...event,
                current_attendees: attendeeCountLocal // Dinamik değeri geç
              }}
              locale={locale}
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
              onAttendeesChange={handleAttendeesChange}
            />
          </div>
        </div>

        {/* Son Etkinlikler */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-sm">
          <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Diğer Etkinlikler' : 'Other Events'}
          </h3>
          
          {loadingLatestEvents ? (
            <div className="space-y-3">
              {[1, 2, 3].map((index) => (
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
          ) : latestEvents.length > 0 ? (
            <div className="space-y-3">
              {latestEvents.map((latestEvent) => (
                <div 
                  key={`latest-${latestEvent.id}`}
                  onClick={() => handleLatestEventClick(latestEvent.slug)}
                  className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-8 bg-neutral-200 dark:bg-neutral-600 rounded-sm flex-shrink-0 overflow-hidden relative">
                    {latestEvent.thumbnail_url ? (
                      <Image 
                        src={latestEvent.thumbnail_url} 
                        alt={latestEvent.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {latestEvent.title}
                    </h4>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-400">
                          {getEventTypeText(latestEvent.event_type)}
                        </span>
                        {latestEvent.is_online ? (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {locale === 'tr' ? 'Online' : 'Online'}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {locale === 'tr' ? 'Yüz Yüze' : 'In-person'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {formatPrice(latestEvent.price, latestEvent.is_paid)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatDateRange(latestEvent.start_date, latestEvent.end_date)}
                        </span>
                      </div>
                      {latestEvent.max_attendees && (
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 text-neutral-400" />
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {latestEvent.current_attendees}/{latestEvent.max_attendees}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {locale === 'tr' ? 'Henüz etkinlik bulunamadı.' : 'No events found yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Mobil ekranlarda en altta sabit duracak kayıt butonu */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-4 md:hidden transition-transform duration-300 z-40">
        <EventForm 
          event={{
            ...event,
            current_attendees: attendeeCountLocal
          }}
          locale={locale}
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
          onAttendeesChange={handleAttendeesChange}
        />
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-2">
          {isUserRegistered 
            ? (locale === 'tr' 
                ? 'Etkinlik sayfasına gitmek için butona tıklayın' 
                : 'Click the button to go to the event page')
            : (locale === 'tr' 
                ? 'Kayıt işleminizi tamamlamak için yukarıdaki butona tıklayın' 
                : 'Click the button above to complete your registration')
          }
        </p>
      </div>
    </>
  );
};

export default EventSidebar;
