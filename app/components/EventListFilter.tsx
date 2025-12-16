//app/components/EventListFilter.tsx
'use client';

import { Calendar, MapPin, Clock, Users, Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import ReactMarkdown from 'react-markdown';
import { getEventsForFilter } from '@/lib/eventService';

interface Event {
  id: string;
  slug?: string;
  tag: string[];
  tags?: string[];
  title: string;
  description?: string;
  organizer?: string;
  organizer_name?: string;
  isPaid?: boolean;
  is_paid?: boolean;
  price?: number;
  image?: string;
  thumbnail_url?: string;
  banner_url?: string;
  date?: string;
  start_date?: string;
  time?: string;
  duration?: string;
  duration_minutes?: number;
  location?: string;
  location_name?: string;
  attendees?: number;
  current_attendees?: number;
  maxAttendees?: number;
  max_attendees?: number;
  type?: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  event_type?: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  category?: string;
  isOnline?: boolean;
  is_online?: boolean;
  rating?: number;
}

interface EventListProps {
  events?: Event[];  // Made optional
  locale?: string;
  showFeaturedOnly?: boolean;
}

function EventList({ events, locale = 'tr', showFeaturedOnly = false }: EventListProps) {
  const [loading, setLoading] = useState(true);
  const [fetchedEvents, setFetchedEvents] = useState<Event[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Featured event tags to filter
  const featuredTags = useMemo(() => [
    'teknoloji', 
    'yazilim', 
    'veriScience', 
    'machineLearning', 
    'artificialIntelligence', 
    'webDevelopment',
    'startup',
    'blockchain',
    'mobil',
    'ai',
    'data-science',
    'web-development',
    'machine-learning',
    'artificial-intelligence',
    'software',
    'programming',
    'development'
  ], []);

  // Fetch events from database if not provided as props
  useEffect(() => {
    const fetchEvents = async () => {
      if (events && events.length > 0) {
        setFetchedEvents(events);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching events from database...');
        const dbEvents = await getEventsForFilter(locale);
        
        console.log('Fetched events:', dbEvents.length);
        setFetchedEvents(dbEvents);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
        setFetchedEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [events, locale]);

  // Filter events with featured tags - with safety check - wrapped in useMemo
  const filteredEvents = useMemo(() => {
    const eventsToFilter = fetchedEvents.length > 0 ? fetchedEvents : (events || []);
    
    if (!Array.isArray(eventsToFilter)) {
      return [];
    }

    const baseFiltered = eventsToFilter.filter(event => {
      if (!event) return false;
      
      // If showFeaturedOnly is true, only show events with featured tags
      if (showFeaturedOnly) {
        const eventTags = event.tag || event.tags || [];
        return Array.isArray(eventTags) && 
               eventTags.some(tag => featuredTags.includes(tag.toLowerCase()));
      }
      
      // Otherwise show all events
      return true;
    });

    return baseFiltered.slice(0, 3); // Limit to 3 events for performance
  }, [fetchedEvents, events, featuredTags, showFeaturedOnly]);

  // Event Card Component
  const EventCard = ({ event }: { event: Event }) => {
    const typeLabels = {
      tr: {
        workshop: 'Atölye',
        seminar: 'Seminer',
        conference: 'Konferans',
        meetup: 'Buluşma',
        webinar: 'Webinar'
      },
      en: {
        workshop: 'Workshop',
        seminar: 'Seminar', 
        conference: 'Conference',
        meetup: 'Meetup',
        webinar: 'Webinar'
      }
    };

    const currentTypeLabels = typeLabels[locale as keyof typeof typeLabels] || typeLabels.tr;

    // Render description with markdown support
    const renderDescription = (description?: string) => {
      if (!description) return null;
      
      // Check if content contains markdown patterns
      const isMarkdown = description.includes('##') || 
                        description.includes('**') || 
                        description.includes('*') || 
                        description.includes('- ') ||
                        description.includes('1. ') ||
                        description.includes('[') ||
                        description.includes('`');
      
      // Check if content contains HTML tags
      const isHtml = description.includes('<') && description.includes('>');
      
      // Truncate description for card view
      const truncatedDescription = description.length > 120 ? description.slice(0, 120) + '...' : description;
      
      if (isMarkdown) {
        return (
          <div className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed markdown-content">
            <ReactMarkdown>{truncatedDescription}</ReactMarkdown>
          </div>
        );
      }
      
      if (isHtml) {
        return (
          <div 
            className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: truncatedDescription }}
          />
        );
      }
      
      return (
        <div className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
          <p>{truncatedDescription}</p>
        </div>
      );
    };

    // Format date
    const formatDate = (dateString?: string) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        return locale === 'tr' 
          ? date.toLocaleDateString('tr-TR', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })
          : date.toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            });
      } catch {
        return dateString;
      }
    };

    // Get event type
    const eventType = event.type || event.event_type;
    
    // Get image URL
    const imageUrl = event.image || event.thumbnail_url || event.banner_url;
    
    // Get organizer name
    const organizerName = event.organizer || event.organizer_name;
    
    // Get payment status
    const isPaidEvent = event.isPaid || event.is_paid;
    
    // Get online status
    const isOnlineEvent = event.isOnline || event.is_online;
    
    // Get attendee counts
    const currentAttendees = event.attendees || event.current_attendees || 0;
    const maxAttendees = event.maxAttendees || event.max_attendees;
    
    // Get event date
    const eventDate = event.date || event.start_date;

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group">
        {/* Event Image */}
        <div className="relative w-full h-48 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
              <Calendar className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
            </div>
          )}
          
          {/* Event Type Badge */}
          {eventType && (
            <div className="absolute top-3 left-3">
              <span className="bg-white/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 px-2 py-1 rounded-full text-xs font-medium">
                {currentTypeLabels[eventType] || eventType}
              </span>
            </div>
          )}


        </div>

        {/* Event Content */}
        <div className="p-6">
          {/* Category */}
          {event.category && (
            <div className="mb-3">
              <span className="inline-block bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-md text-sm">
                {event.category}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
            {event.title}
          </h3>

          {/* Description */}
          {event.description && renderDescription(event.description)}

          {/* Event Details */}
          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <div className="flex items-center space-x-4">
              {/* Date */}
              {eventDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{formatDate(eventDate)}</span>
                </div>
              )}
              
              {/* Duration */}
              {event.duration && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{event.duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Price and Action Button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* Price */}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPaidEvent 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {isPaidEvent 
                  ? `${locale === 'tr' ? '₺' : '$'}${event.price || 0}` 
                  : (locale === 'tr' ? 'Ücretsiz' : 'Free')
                }
              </span>
              
              {/* Location */}
              {event.location && (
                <span className="flex items-center text-sm text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-4 h-4 mr-1" />
                  {event.location}
                </span>
              )}
            </div>
            
            <button className="text-[#990000] hover:text-[#cc0000] transition-colors text-sm font-medium flex items-center">
              {locale === 'tr' ? 'Detayları İncele' : 'Explore Details'}
              <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>

          {/* Organizer */}
          {organizerName && (
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {locale === 'tr' ? 'Düzenleyen:' : 'Organizer:'} <span className="font-medium text-neutral-900 dark:text-neutral-100">{organizerName}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="w-full bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton 
        height={192} 
        className="w-full"
        baseColor="#f3f4f6"
        highlightColor="#e5e7eb"
      />

      {/* Content Skeleton */}
      <div className="p-6">
        {/* Category Badge Skeleton */}
        <Skeleton 
          width={80}
          height={24}
          className="mb-3"
          baseColor="#f3f4f6"
          highlightColor="#e5e7eb"
        />

        {/* Title Skeleton */}
        <Skeleton 
          height={24} 
          width="90%" 
          className="mb-2"
          baseColor="#f3f4f6"
          highlightColor="#e5e7eb"
        />
        
        {/* Description Skeleton */}
        <Skeleton 
          count={2}
          height={16}
          className="mb-4"
          baseColor="#f3f4f6"
          highlightColor="#e5e7eb"
        />

        {/* Stats Skeleton */}
        <Skeleton 
          width="70%"
          height={16}
          className="mb-4"
          baseColor="#f3f4f6"
          highlightColor="#e5e7eb"
        />

        {/* Attendees and Button Skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton 
            width="40%"
            height={16}
            baseColor="#f3f4f6"
            highlightColor="#e5e7eb"
          />
          <Skeleton 
            width="30%"
            height={16}
            baseColor="#f3f4f6"
            highlightColor="#e5e7eb"
          />
        </div>

        {/* Organizer Skeleton */}
        <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <Skeleton 
            width="60%"
            height={16}
            baseColor="#f3f4f6"
            highlightColor="#e5e7eb"
          />
        </div>
      </div>
    </div>
  );

  // Empty State Component
  const EmptyState = () => {
    const content = {
      tr: {
        title: error ? "Etkinlikler yüklenirken hata oluştu" : "Henüz etkinlik bulunamadı",
        description: error ? "Lütfen daha sonra tekrar deneyin." : "Son etkinlikler yakında eklenecek.",
        action: "Tüm etkinlikleri görüntüle"
      },
      en: {
        title: error ? "Error loading events" : "No events found yet",
        description: error ? "Please try again later." : "Latest events will be added soon.",
        action: "View all events"
      }
    };

    const currentContent = content[locale as keyof typeof content] || content.tr;

    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {currentContent.title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {currentContent.description}
        </p>
        <Link 
          href={`/${locale}/etkinlik`}
          className="inline-block px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          {currentContent.action}
        </Link>
      </div>
    );
  };

  return (
    <section className="py-16">
      <style jsx>{`
        /* Markdown styles for event cards */
        .markdown-content h1,
        .markdown-content h2,
        .markdown-content h3 {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          margin: 0.25rem 0 !important;
          color: rgb(115 115 115) !important;
          border: none !important;
          padding: 0 !important;
        }
        .dark .markdown-content h1,
        .dark .markdown-content h2,
        .dark .markdown-content h3 {
          color: rgb(212 212 212) !important;
        }
        .markdown-content p {
          margin: 0 !important;
          line-height: 1.6 !important;
          color: rgb(115 115 115) !important;
          font-size: 0.875rem !important;
        }
        .dark .markdown-content p {
          color: rgb(212 212 212) !important;
        }
        .markdown-content strong {
          font-weight: 600 !important;
          color: rgb(82 82 82) !important;
        }
        .dark .markdown-content strong {
          color: rgb(163 163 163) !important;
        }
        .markdown-content em {
          font-style: italic !important;
          color: rgb(115 115 115) !important;
        }
        .dark .markdown-content em {
          color: rgb(212 212 212) !important;
        }
        .markdown-content ul,
        .markdown-content ol {
          margin: 0.25rem 0 !important;
          padding-left: 1rem !important;
        }
        .markdown-content li {
          margin: 0 !important;
          color: rgb(115 115 115) !important;
          font-size: 0.875rem !important;
          line-height: 1.6 !important;
        }
        .dark .markdown-content li {
          color: rgb(212 212 212) !important;
        }
        .markdown-content code {
          background-color: rgb(243 244 246) !important;
          color: rgb(220 38 127) !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.75rem !important;
        }
        .dark .markdown-content code {
          background-color: rgb(64 64 64) !important;
          color: rgb(251 146 60) !important;
        }
        .markdown-content a {
          color: rgb(59 130 246) !important;
          text-decoration: underline !important;
        }
        .dark .markdown-content a {
          color: rgb(96 165 250) !important;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Son Etkinlikler' : 'Latest Events'}
          </h2>
          <div className="w-16 h-px bg-[#990000]"></div>
        </div>

        {/* Event Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3)
              .fill(null)
              .map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : filteredEvents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents.map((event, index) => (
                <Link 
                  href={`/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}/${event.slug || event.id}`} 
                  key={event.id || index}
                  className="group block"
                >
                  <EventCard event={event} />
                </Link>
              ))}
            </div>
            
            {/* View All Events Button */}
            <div className="mt-12">
              <Link href={`/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}`} className="inline-block">
                <button className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-2 border-transparent hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-900 dark:hover:border-neutral-100 px-8 py-3 text-sm font-medium transition-all duration-300 focus:outline-none rounded-md shadow-sm flex items-center gap-2">
                  {locale === 'tr' ? 'Tüm Etkinlikleri Göster' : 'View All Events'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}

export default EventList;