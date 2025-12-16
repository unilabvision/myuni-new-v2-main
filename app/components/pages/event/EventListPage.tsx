// app/components/pages/event/EventListPage.tsx
"use client";

import React, { useState, useEffect, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, Users, Calendar, MapPin, Filter, Search, BookOpen, Globe, Video, Building } from 'lucide-react';
import { getAllEvents, mapEventTypeToLocale } from '../../../../lib/eventService';
import ReactMarkdown from 'react-markdown';

// Event interfaces
interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  organizer_name?: string;
  organizer_email?: string;
  organizer_linkedin?: string;
  organizer_image_url?: string;
  event_type: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  category?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
  timezone: string;
  duration_minutes?: number;
  is_online: boolean;
  location_name?: string;
  location_address?: string;
  meeting_url?: string;
  is_paid: boolean;
  price?: number;
  max_attendees?: number;
  current_attendees: number;
  registration_deadline?: string;
  is_registration_open: boolean;
  thumbnail_url?: string;
  banner_url?: string;
  image?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface EventListPageProps {
  params: Promise<{
    locale: string;
    eventType: string;
  }>;
}

// Language texts
const texts = {
  tr: {
    badge: "🎯 Etkinliklere katıl!",
    title: "Kariyerinizi ilerletmek için tasarlanmış uzman eğitmenler tarafından düzenlenen etkinliklerimizi keşfedin.",
    subtitle: "En güncel teknolojiler ve pratik deneyimlerle desteklenen etkinliklerimizle profesyonel hedeflerinize ulaşın.",
    filters: {
      all: "Tümü",
      workshop: "Workshop",
      seminar: "Seminer",
      conference: "Konferans",
      meetup: "Buluşma",
      webinar: "Webinar"
    },
    statusFilters: {
      all: "Tüm Etkinlikler",
      upcoming: "Yaklaşan",
      ongoing: "Devam Eden",
      completed: "Tamamlanmış"
    },
    locationFilters: {
      all: "Tüm Lokasyonlar",
      online: "Online",
      offline: "Yüz Yüze",
      hybrid: "Hibrit"
    },
    priceFilters: {
      all: "Tüm Fiyatlar",
      free: "Ücretsiz",
      paid: "Ücretli"
    },
    loadMore: "Daha Fazla Etkinlik Yükle",
    viewAll: "Tüm Etkinlikleri Görüntüle",
    exploreMore: "Detayları İncele",
    register: "Kayıt Ol",
    currency: "₺",
    stats: [
      { value: "50+", label: "Aktif Etkinlik" },
      { value: "500+", label: "Katılımcı" },
      { value: "%95", label: "Memnuniyet" }
    ],
    featuredTitle: "Öne Çıkan Etkinlikler",
    allEventsTitle: "Tüm Etkinlikler",
    loading: "Etkinlikler yükleniyor...",
    error: "Etkinlikler yüklenemedi",
    noEvents: "Henüz etkinlik bulunamadı",
    retry: "Tekrar Dene",
    noFilterResults: "Filtreye uygun etkinlik bulunamadı",
    showAll: "Tümünü Göster",
    tryDifferentFilter: "Farklı bir filtre seçeneğini deneyin veya tüm etkinlikleri görüntüleyin.",
    comingSoon: "Öne çıkan etkinlikler yakında eklenecek",
    registrationDeadline: "Son kayıt:",
    maxAttendees: "Maksimum katılımcı:",
    currentAttendees: "Mevcut katılımcı:",
    minutesShort: "dk",
    hoursShort: "saat",
    registrationOpen: "Kayıt Açık",
    registrationClosed: "Kayıt Kapalı",
    eventFull: "Etkinlik Dolu",
    daysLeft: "gün kaldı",
    hoursLeft: "saat kaldı",
    eventTypeLabel: "Etkinlik Türü:",
    statusLabel: "Durum:",
    locationLabel: "Lokasyon:",
    priceLabel: "Fiyat:",
    activeFilters: "Aktif filtreler:",
    free: "Ücretsiz",
    online: "Online",
    offline: "Yüz Yüze",
    hybrid: "Hibrit",
    organizer: "Organizatör:",
    duration: "Süre:",
    location: "Konum:",
    date: "Tarih:",
    time: "Saat:"
  },
  en: {
    badge: "🎯 Join events!",
    title: "Discover our events organized by expert instructors designed to advance your career.",
    subtitle: "Achieve your professional goals with our events supported by the latest technologies and practical experiences.",
    filters: {
      all: "All",
      workshop: "Workshop",
      seminar: "Seminar",
      conference: "Conference",
      meetup: "Meetup",
      webinar: "Webinar"
    },
    statusFilters: {
      all: "All Events",
      upcoming: "Upcoming",
      ongoing: "Ongoing",
      completed: "Completed"
    },
    locationFilters: {
      all: "All Locations",
      online: "Online",
      offline: "In-person",
      hybrid: "Hybrid"
    },
    priceFilters: {
      all: "All Prices",
      free: "Free",
      paid: "Paid"
    },
    loadMore: "Load More Events",
    viewAll: "View All Events", 
    exploreMore: "Explore Details",
    register: "Register",
    currency: "$",
    stats: [
      { value: "50+", label: "Active Events" },
      { value: "500+", label: "Participants" },
      { value: "95%", label: "Satisfaction" }
    ],
    featuredTitle: "Featured Events",
    allEventsTitle: "All Events",
    loading: "Loading events...",
    error: "Failed to load events",
    noEvents: "No events found yet",
    retry: "Retry",
    noFilterResults: "No events found for this filter",
    showAll: "Show All",
    tryDifferentFilter: "Try a different filter option or view all events.",
    comingSoon: "Featured events coming soon",
    registrationDeadline: "Registration deadline:",
    maxAttendees: "Max attendees:",
    currentAttendees: "Current attendees:",
    minutesShort: "min",
    hoursShort: "hours",
    registrationOpen: "Registration Open",
    registrationClosed: "Registration Closed",
    eventFull: "Event Full",
    daysLeft: "days left",
    hoursLeft: "hours left",
    eventTypeLabel: "Event Type:",
    statusLabel: "Status:",
    locationLabel: "Location:",
    priceLabel: "Price:",
    activeFilters: "Active filters:",
    free: "Free",
    online: "Online",
    offline: "In-person",
    hybrid: "Hybrid",
    organizer: "Organizer:",
    duration: "Duration:",
    location: "Location:",
    date: "Date:",
    time: "Time:"
  }
};

export default function EventListPage({ params }: EventListPageProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeEventTypeFilter, setActiveEventTypeFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [activeLocationFilter, setActiveLocationFilter] = useState('all');
  const [activePriceFilter, setActivePriceFilter] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const allEventsRef = useRef<HTMLElement>(null);
  
  const resolvedParams = use(params);
  const { locale, eventType } = resolvedParams;

  const validEventTypes = {
    tr: 'etkinlik',
    en: 'event'
  };
  
  const t = texts[locale as keyof typeof texts] || texts.tr;

  const getEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const eventsData = await getAllEvents(locale);
      
      // Filter only active and open for registration events
      const filteredEventsData = eventsData.filter((event: Event) => 
        event.is_active && event.is_registration_open
      );
      
      setEvents(filteredEventsData);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    getEvents();
    setIsLoaded(true);
  }, [getEvents]);

  const scrollToAllEvents = () => {
    if (allEventsRef.current) {
      allEventsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const filteredEvents = events.filter(event => {
    let eventTypeMatch = true;
    if (activeEventTypeFilter !== 'all') {
      eventTypeMatch = event.event_type === activeEventTypeFilter;
    }

    let statusMatch = true;
    if (activeStatusFilter !== 'all') {
      statusMatch = event.status === activeStatusFilter;
    }

    let locationMatch = true;
    if (activeLocationFilter !== 'all') {
      if (activeLocationFilter === 'online') {
        locationMatch = event.is_online;
      } else if (activeLocationFilter === 'offline') {
        locationMatch = !event.is_online;
      }
      // hybrid could be determined by a separate field if you have it
    }

    let priceMatch = true;
    if (activePriceFilter !== 'all') {
      if (activePriceFilter === 'free') {
        priceMatch = !event.is_paid || event.price === 0;
      } else if (activePriceFilter === 'paid') {
        priceMatch = event.is_paid && (event.price || 0) > 0;
      }
    }

    return eventTypeMatch && statusMatch && locationMatch && priceMatch;
  });

  // Featured events are derived from events with is_featured = true
  const featuredEvents = events.filter(event => event.is_featured);

  useEffect(() => {
    if (featuredEvents.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [featuredEvents.length]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRegistrationOpen = (event: Event) => {
    if (!event.registration_deadline) return event.is_registration_open;
    const deadline = new Date(event.registration_deadline);
    const now = new Date();
    return event.is_registration_open && now < deadline;
  };

  const isEventFull = (event: Event) => {
    return event.max_attendees && event.current_attendees >= event.max_attendees;
  };

  const getTimeUntilStart = (event: Event) => {
    if (!event.start_date) return null;
    const startDate = new Date(event.start_date);
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffDays > 1) return { value: diffDays, unit: 'days' };
    if (diffHours > 0) return { value: diffHours, unit: 'hours' };
    return null;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} ${t.minutesShort}`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} ${t.hoursShort}`;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')} ${t.hoursShort}`;
  };

  const renderRichText = (content: string | undefined, isCard: boolean = false) => {
    if (!content) return null;
    
    // Check if content is HTML or markdown/plain text
    const isHtml = content.includes('<') && content.includes('>');
    let contentToRender = content;
    
    if (isCard) {
      // For card display, truncate content
      const textOnly = content.replace(/<[^>]*>/g, '').trim();
      if (textOnly.length > 120) {
        contentToRender = textOnly.slice(0, 120) + '...';
      } else {
        contentToRender = textOnly;
      }
    }

    if (isHtml && !isCard) {
      // For full display of HTML content, use dangerouslySetInnerHTML
      return (
        <div 
          className="rich-text-content prose prose-sm max-w-none dark:prose-invert prose-neutral"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
        />
      );
    } else {
      // For markdown or plain text content, use ReactMarkdown
      return (
        <div className={`rich-text-content ${isCard ? 'card-description' : 'prose prose-sm max-w-none dark:prose-invert prose-neutral'}`}>
          <ReactMarkdown
            components={{
              // Customize components for better styling
              p: ({ children }) => <p className={isCard ? 'text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2' : 'mb-3'}>{children}</p>,
              h1: ({ children }) => <h1 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold mb-1 text-neutral-900 dark:text-neutral-100">{children}</h3>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-neutral-700 dark:text-neutral-300">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-neutral-900 dark:text-neutral-100">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-neutral-300 dark:border-neutral-600 pl-4 italic text-neutral-700 dark:text-neutral-400 mb-3">{children}</blockquote>,
              code: ({ children }) => <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-sm">{children}</code>,
              pre: ({ children }) => <pre className="bg-neutral-100 dark:bg-neutral-800 p-3 rounded overflow-x-auto mb-3">{children}</pre>,
            }}
          >
            {contentToRender}
          </ReactMarkdown>
        </div>
      );
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'webinar': return <Video className="w-4 h-4" />;
      case 'workshop': return <BookOpen className="w-4 h-4" />;
      case 'conference': return <Building className="w-4 h-4" />;
      case 'meetup': return <Users className="w-4 h-4" />;
      case 'seminar': return <Globe className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const EventCard = ({ event, featured = false }: { event: Event, featured?: boolean }) => {
    const timeUntilStart = getTimeUntilStart(event);
    const registrationOpen = isRegistrationOpen(event);
    const eventFull = isEventFull(event);

    return (
      <Link 
        href={`/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}/${event.slug}`}
        className={`bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group ${
          featured ? 'col-span-1' : ''
        }`}
      >
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={event.image || event.thumbnail_url || event.banner_url || '/default-event.jpg'}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            {eventFull ? (
              <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                {t.eventFull}
              </div>
            ) : !registrationOpen ? (
              <div className="bg-neutral-900/80 text-white px-2 py-1 rounded text-xs font-medium">
                {t.registrationClosed}
              </div>
            ) : timeUntilStart && timeUntilStart.value <= 7 ? (
              <div className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium">
                {timeUntilStart.value} {timeUntilStart.unit === 'days' ? t.daysLeft : t.hoursLeft}
              </div>
            ) : (
              <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                {t.registrationOpen}
              </div>
            )}
          </div>

          {/* Event Type Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-white/90 text-neutral-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              {getEventTypeIcon(event.event_type)}
              {mapEventTypeToLocale(event.event_type, locale)}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-3 flex items-center gap-2">
            <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
              event.is_online 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              {event.is_online ? t.online : t.offline}
            </span>
            <span className={`inline-block px-3 py-1 rounded-lg text-sm ${
              event.is_paid 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
            }`}>
              {event.is_paid ? `${t.currency}${event.price || 0}` : t.free}
            </span>
          </div>

          <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
            {event.title}
          </h3>
          
          <div className="mb-4 leading-relaxed">
            {renderRichText(event.description, true)}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            {event.organizer_name && (
              <div>
                <span className="font-medium">{t.organizer}</span>
                <p className="text-neutral-700 dark:text-neutral-300">{event.organizer_name}</p>
              </div>
            )}
            
            {event.start_date && (
              <div>
                <span className="font-medium">{t.date}</span>
                <p className="text-neutral-700 dark:text-neutral-300">{formatDate(event.start_date)}</p>
              </div>
            )}
            
            {event.duration_minutes && (
              <div>
                <span className="font-medium">{t.duration}</span>
                <p className="text-neutral-700 dark:text-neutral-300">{formatDuration(event.duration_minutes)}</p>
              </div>
            )}
            
            {event.start_date && (
              <div>
                <span className="font-medium">{t.time}</span>
                <p className="text-neutral-700 dark:text-neutral-300">{formatTime(event.start_date)}</p>
              </div>
            )}
          </div>


          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!event.is_online && event.location_name && (
                <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location_name}
                </span>
              )}
            </div>
            <button className="text-[#990000] hover:text-[#cc0000] transition-colors text-sm font-medium flex items-center">
              {eventFull ? t.eventFull : registrationOpen ? t.register : t.exploreMore}
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </Link>
    );
  };

  if (loading || !isLoaded) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left order-2 lg:order-1">
              <div className="animate-pulse">
                <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-6"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="h-[400px] lg:h-[500px] bg-neutral-200 dark:bg-neutral-700 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.error}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              {error}
            </p>
            <button
              onClick={getEvents}
              className="px-6 py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              {t.retry}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-6 relative z-10">
          <div className="text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-neutral-400 text-xl">🎯</span>
            </div>
            <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.noEvents}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8">
              Yakında yeni etkinlikler eklenecek.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="max-w-7xl px-6 sm:px-6 md:px-6 lg:px-6 xl:px-6 2xl:px-6 container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="text-left order-2 lg:order-1">
              <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
                {t.badge}
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
                {t.title}
              </h1>

              <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6"></div>

              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-2xl">
                {t.subtitle}
              </p>

              <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {events.length}+
                  </span>
                  <span>Aktif Etkinlik</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    500+
                  </span>
                  <span>Katılımcı</span>
                </div>
                <div className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                  <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">
                    %92
                  </span>
                  <span>Memnuniyet</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={scrollToAllEvents}
                  className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-0 rounded-md py-3 px-8 text-md font-medium flex items-center justify-center transition-colors"
                >
                  {t.viewAll}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </button>

                <button className="bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-md py-3 px-8 text-md font-medium transition-colors">
                  {t.exploreMore}
                </button>
              </div>
            </div>

            {/* Right side - Featured Events Slider */}
            <div className="order-1 lg:order-2">
              {featuredEvents.length > 0 ? (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg">
                  <div className="p-6 lg:p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                      <h3 className="text-lg lg:text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                        {t.featuredTitle}
                      </h3>
                      {featuredEvents.length > 1 && (
                        <div className="flex space-x-2">
                          {featuredEvents.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide
                                  ? 'bg-[#990000] w-6'
                                  : 'bg-neutral-300 dark:bg-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 relative overflow-hidden min-h-0">
                      <div 
                        className="flex transition-transform duration-500 ease-out h-full"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                      >
                        {featuredEvents.map((event) => (
                          <div key={event.id} className="w-full flex-shrink-0 h-full">
                            <Link 
                              href={`/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}/${event.slug}`}
                              className="bg-white dark:bg-neutral-700 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-600 h-full flex flex-col overflow-hidden hover:shadow-lg transition-all duration-300 block cursor-pointer group"
                            >
                              <div className="relative h-32 lg:h-48 overflow-hidden flex-shrink-0">
                                <Image
                                  src={event.image || event.thumbnail_url || event.banner_url || '/default-event.jpg'}
                                  alt={event.title}
                                  fill
                                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                
                                {/* Event Type Badge */}
                                <div className="absolute top-3 left-3">
                                  <div className="bg-white/90 text-neutral-800 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                    {getEventTypeIcon(event.event_type)}
                                    {mapEventTypeToLocale(event.event_type, locale)}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="p-4 lg:p-6 flex-1 flex flex-col min-h-0">
                                <div className="mb-2 lg:mb-3 flex-shrink-0 flex gap-2">
                                  <span className={`inline-block px-2 py-1 lg:px-3 lg:py-1 rounded-lg text-xs lg:text-sm font-medium ${
                                    event.is_online 
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  }`}>
                                    {event.is_online ? t.online : t.offline}
                                  </span>
                                  <span className={`inline-block px-2 py-1 lg:px-3 lg:py-1 rounded-lg text-xs lg:text-sm font-medium ${
                                    event.is_paid 
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}>
                                    {event.is_paid ? `${t.currency}${event.price || 0}` : t.free}
                                  </span>
                                </div>
                                
                                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 text-base lg:text-lg mb-2 lg:mb-3 leading-tight group-hover:text-[#990000] transition-colors flex-shrink-0">
                                  {event.title}
                                </h4>
                                
                                <div className="text-xs lg:text-sm mb-3 lg:mb-4 flex-1 leading-relaxed overflow-hidden">
                                  {renderRichText(event.description, true)}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2 text-xs lg:text-sm text-neutral-500 dark:text-neutral-400 mb-3 lg:mb-4 flex-shrink-0">
                                  {event.organizer_name && (
                                    <div>
                                      <span className="font-medium block">{t.organizer}</span>
                                      <span className="text-neutral-700 dark:text-neutral-300">{event.organizer_name}</span>
                                    </div>
                                  )}
                                  
                                  {event.start_date && (
                                    <div>
                                      <span className="font-medium block">{t.date}</span>
                                      <span className="text-neutral-700 dark:text-neutral-300">{formatDate(event.start_date)}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex items-center justify-between flex-shrink-0 mt-auto">
                                  <div className="flex items-center gap-2">
                                    {event.duration_minutes && (
                                      <span className="flex items-center text-xs lg:text-sm text-neutral-600 dark:text-neutral-400">
                                        <Clock className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                        {formatDuration(event.duration_minutes)}
                                      </span>
                                    )}
                                  </div>
                                  <button className="text-[#990000] hover:text-[#cc0000] transition-colors text-xs lg:text-sm font-medium flex items-center flex-shrink-0">
                                    {t.register}
                                    <ArrowRight className="w-3 h-3 ml-1" />
                                  </button>
                                </div>
                              </div>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-[450px] lg:h-[550px] w-full bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 rounded-lg overflow-hidden shadow-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                    </div>
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                      {t.featuredTitle}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {t.comingSoon}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All Events Section */}
      <section ref={allEventsRef} className="py-16 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl px-6 sm:px-6 md:px-6 lg:px-6 xl:px-6 2xl:px-6 mx-auto">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100">
                {t.allEventsTitle} ({filteredEvents.length})
              </h2>
              
              {(activeEventTypeFilter !== 'all' || activeStatusFilter !== 'all' || activeLocationFilter !== 'all' || activePriceFilter !== 'all') && (
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">{t.activeFilters}</span>
                  {activeEventTypeFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.filters[activeEventTypeFilter as keyof typeof t.filters]}
                    </span>
                  )}
                  {activeStatusFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.statusFilters[activeStatusFilter as keyof typeof t.statusFilters]}
                    </span>
                  )}
                  {activeLocationFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.locationFilters[activeLocationFilter as keyof typeof t.locationFilters]}
                    </span>
                  )}
                  {activePriceFilter !== 'all' && (
                    <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded text-xs">
                      {t.priceFilters[activePriceFilter as keyof typeof t.priceFilters]}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="w-16 h-px bg-[#990000] mb-8"></div>

            {/* Filters Section */}
            {(() => {
              const availableEventTypes = [...new Set(events.map(event => event.event_type))];
              const availableEventTypeFilters = Object.entries(t.filters).filter(([key]) => 
                key === 'all' || availableEventTypes.includes(key as 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar')
              );
              
              const availableStatuses = [...new Set(events.map(event => event.status))];
              const availableStatusFilters = Object.entries(t.statusFilters).filter(([key]) => 
                key === 'all' || availableStatuses.includes(key as 'upcoming' | 'ongoing' | 'completed')
              );
              
              const showEventTypeFilter = availableEventTypeFilters.length > 2;
              const showStatusFilter = availableStatusFilters.length > 2;
              const showLocationFilter = true; // Always show location filter
              const showPriceFilter = events.some(event => event.is_paid) && events.some(event => !event.is_paid);
              
              // Don't show filters section if no filters are needed
              if (!showEventTypeFilter && !showStatusFilter && !showLocationFilter && !showPriceFilter) {
                return null;
              }
              
              return (
                <div className="mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Event Type Filter */}
                    {showEventTypeFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <Filter className="w-4 h-4 mr-2 text-neutral-600 dark:text-neutral-400" />
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.eventTypeLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableEventTypeFilters.map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActiveEventTypeFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activeEventTypeFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status Filter */}
                    {showStatusFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.statusLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {availableStatusFilters.map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActiveStatusFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activeStatusFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Location Filter */}
                    {showLocationFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.locationLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(t.locationFilters).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActiveLocationFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activeLocationFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Price Filter */}
                    {showPriceFilter && (
                      <div>
                        <div className="flex items-center mb-3">
                          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{t.priceLabel}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(t.priceFilters).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => setActivePriceFilter(key)}
                              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-sm ${
                                activePriceFilter === key
                                  ? 'bg-neutral-800 dark:bg-neutral-700 text-white'
                                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          {filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.noFilterResults}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                {t.tryDifferentFilter}
              </p>
              <button
                onClick={() => {
                  setActiveEventTypeFilter('all');
                  setActiveStatusFilter('all');
                  setActiveLocationFilter('all');
                  setActivePriceFilter('all');
                }}
                className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                {t.showAll}
              </button>
            </div>
          )}

          {filteredEvents.length > 0 && filteredEvents.length >= 9 && (
            <div className="text-center mt-12">
              <button 
                onClick={getEvents}
                className="px-8 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-300 dark:border-neutral-700"
              >
                {t.loadMore}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}