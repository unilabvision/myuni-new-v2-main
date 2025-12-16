// app/[locale]/etkinlik/[slug]/page.tsx
import type { Metadata } from "next";
import EventDetailPage from '../../../components/pages/event/[slug]/page';
import { getEventBySlug, mapEventTypeToLocale } from '../../../../lib/eventService';

interface EventDetailProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

// Page level metadata - bu layout metadata'sını override eder
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const { locale, slug } = resolvedParams;
  
  const eventType = locale === 'tr' ? 'etkinlik' : 'event';
  const canonicalUrl = `https://myunilab.net/${locale}/${eventType}/${slug}`;
  const trPath = `https://myunilab.net/tr/etkinlik/${slug}`;
  const enPath = `https://myunilab.net/en/event/${slug}`;

  // Etkinlik bilgilerini al
  let eventData = null;
  let eventTitle = '';
  let eventDescription = '';
  let eventTypeCategory = '';
  let eventPrice = 0;
  let eventFormat = 'online';
  let eventDate = '';
  let eventDuration = '';
  let eventImage = '';
  let eventLocation = '';
  let eventOrganizer = '';

  try {
    eventData = await getEventBySlug(slug, locale);
    if (eventData) {
      eventTitle = String(eventData.title || '');
      eventDescription = String(eventData.description || '');
      eventTypeCategory = mapEventTypeToLocale(String(eventData.event_type || ''), locale);
      eventPrice = Number(eventData.price || 0);
      
      // Format based on is_online property
      eventFormat = eventData.is_online ? 'online' : 'inperson';
      
      // Date information
      eventDate = String(eventData.start_date || '');
      
      // Duration in ISO 8601 format
      eventDuration = eventData.duration_minutes 
        ? `PT${eventData.duration_minutes}M`
        : eventData.duration || '';
      
      // Image - prioritize banner_url over thumbnail_url
      eventImage = eventData.banner_url || eventData.thumbnail_url || eventData.image || '';
      
      // Location information
      eventLocation = eventData.is_online 
        ? (locale === 'tr' ? 'Online Etkinlik' : 'Online Event')
        : eventData.location_name || '';
        
      // Organizer information
      eventOrganizer = eventData.organizer_name || 'MyUNI';
    }
  } catch (error) {
    console.error('Error fetching event data for metadata:', error);
  }

  // HTML'den düz metne çevirme fonksiyonu - Rich text'i işlemek için geliştirildi
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    // HTML etiketlerini kaldır ve önemli içerikleri koru
    let text = html
      // Paragraph breaks'i boşlukla değiştir
      .replace(/<\/p>/gi, ' ')
      .replace(/<p[^>]*>/gi, ' ')
      // Line breaks'i boşlukla değiştir
      .replace(/<br\s*\/?>/gi, ' ')
      // Div'leri boşlukla değiştir
      .replace(/<\/div>/gi, ' ')
      .replace(/<div[^>]*>/gi, ' ')
      // Diğer HTML etiketlerini kaldır
      .replace(/<[^>]*>/g, '');
    
    // HTML entity'leri decode et
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&hellip;/g, '...')
      .replace(/&mdash;/g, '—')
      .replace(/&ndash;/g, '–')
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"');
    
    // Fazla boşlukları temizle ve trim
    return text.replace(/\s+/g, ' ').trim();
  };

  // Fallback title ve description - SEO optimize edilmiş
  const title = eventTitle 
    ? `${eventTitle} | MyUNI ${locale === 'tr' ? 'Etkinliği' : 'Event'}`
    : locale === 'tr'
      ? `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Etkinliği | MyUNI`
      : `${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Event | MyUNI`;

  // Rich text description'ı temizle ve SEO için optimize et
  const cleanDescription = stripHtml(eventDescription);
  
  // SEO için description oluştur
  const generateSEODescription = () => {
    if (cleanDescription && cleanDescription.length > 50) {
      // Rich text'ten temizlenmiş açıklamayı kullan
      const truncated = cleanDescription.length > 155 
        ? cleanDescription.substring(0, 152) + '...'
        : cleanDescription;
      return truncated;
    }
    
    // Fallback description with event details
    const eventInfo = [];
    if (eventDate) {
      const date = new Date(eventDate).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US');
      eventInfo.push(date);
    }
    if (eventLocation) {
      eventInfo.push(eventLocation);
    }
    if (eventPrice === 0) {
      eventInfo.push(locale === 'tr' ? 'Ücretsiz' : 'Free');
    }
    
    const eventInfoText = eventInfo.length > 0 ? ` (${eventInfo.join(', ')})` : '';
    
    return locale === 'tr'
      ? `${eventTitle || slug.replace(/-/g, ' ')} etkinliğine katılın${eventInfoText}. MyUNI'de uzmanlarla buluşun, networking yapın ve yeni beceriler edinin.`
      : `Join ${eventTitle || slug.replace(/-/g, ' ')} event${eventInfoText}. Meet with experts at MyUNI, network and gain new skills.`;
  };

  const description = generateSEODescription();

  // Event format için ek açıklama
  const eventFormatText = locale === 'tr' 
    ? {
        online: 'Online etkinlik',
        live: 'Canlı etkinlik',
        hybrid: 'Hibrit etkinlik',
        inperson: 'Yüz yüze etkinlik'
      }
    : {
        online: 'Online event',
        live: 'Live event', 
        hybrid: 'Hybrid event',
        inperson: 'In-person event'
      };

  const formatDescription = eventFormatText[eventFormat as keyof typeof eventFormatText] || eventFormatText.online;

  // Event type kategorileri
  const eventTypeText = locale === 'tr' 
    ? {
        webinar: 'Webinar',
        workshop: 'Workshop',
        seminar: 'Seminer',
        conference: 'Konferans',
        meetup: 'Buluşma',
        networking: 'Networking'
      }
    : {
        webinar: 'Webinar',
        workshop: 'Workshop',
        seminar: 'Seminar',
        conference: 'Conference',
        meetup: 'Meetup',
        networking: 'Networking'
      };

  const categoryDescription = eventTypeText[eventTypeCategory as keyof typeof eventTypeText] || eventTypeText.webinar;

  // Optimize edilmiş görsel URL'leri
  const getOptimizedImageUrl = () => {
    if (eventImage) {
      // Banner URL'yi öncelikle kullan, yüksek çözünürlüklü olması için
      if (eventImage.includes('supabase') || eventImage.includes('amazonaws')) {
        return eventImage;
      }
      return eventImage;
    }
    
    // Fallback image - etkinlik tipine göre
    const fallbackImages = {
      tr: {
        workshop: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=630&fit=crop',
        seminar: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=630&fit=crop',
        conference: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=630&fit=crop',
        webinar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop',
        meetup: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=630&fit=crop'
      },
      en: {
        workshop: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=630&fit=crop',
        seminar: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1200&h=630&fit=crop',
        conference: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=630&fit=crop',
        webinar: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop',
        meetup: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=630&fit=crop'
      }
    };
    
    const localeImages = fallbackImages[locale as keyof typeof fallbackImages] || fallbackImages.tr;
    return localeImages[eventTypeCategory as keyof typeof localeImages] || localeImages.workshop;
  };

  const optimizedImageUrl = getOptimizedImageUrl();

  return {
    title,
    description,
    keywords: locale === 'tr'
      ? [
          eventTitle || slug,
          "MyUNI etkinlik",
          categoryDescription,
          formatDescription,
          eventOrganizer,
          "online etkinlik",
          "yapay zeka etkinliği",
          "teknoloji etkinliği",
          "networking",
          "uzman buluşması",
          ...(eventPrice === 0 ? ["ücretsiz etkinlik"] : ["ücretli etkinlik"]),
          ...(eventLocation ? [eventLocation] : [])
        ]
      : [
          eventTitle || slug,
          "MyUNI event",
          categoryDescription,
          formatDescription,
          eventOrganizer,
          "online event",
          "AI event",
          "technology event",
          "networking",
          "expert meetup",
          ...(eventPrice === 0 ? ["free event"] : ["paid event"]),
          ...(eventLocation ? [eventLocation] : [])
        ],
    authors: [{ name: eventOrganizer || "MyUNI Eğitim Platformu" }],
    robots: "index, follow",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': trPath,
        'en': enPath,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "MyUNI Eğitim Platformu",
      images: [
        {
          url: optimizedImageUrl,
          width: 1200,
          height: 630,
          alt: `${eventTitle || slug} ${locale === 'tr' ? 'etkinliği kapak görseli' : 'event cover image'}`,
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title.length > 70 ? title.substring(0, 67) + '...' : title,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [optimizedImageUrl],
      creator: "@myuniturkiye",
      site: "@myuniturkiye",
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        "name": eventTitle || slug.replace(/-/g, ' '),
        "description": cleanDescription || description,
        "url": canonicalUrl,
        "image": [optimizedImageUrl],
        "organizer": {
          "@type": "EducationalOrganization",
          "name": eventOrganizer || "MyUNI",
          "url": "https://myunilab.net",
          "logo": "https://myunilab.net/logo.png",
          "sameAs": [
            "https://x.com/myuniturkiye",
            "https://linkedin.com/company/myuniturkiye",
            "https://instagram.com/myuniturkiye",
            "https://youtube.com/@myuniturkiye"
          ]
        },
        "eventAttendanceMode": eventFormat === 'online' 
          ? "https://schema.org/OnlineEventAttendanceMode"
          : eventFormat === 'inperson'
          ? "https://schema.org/OfflineEventAttendanceMode" 
          : "https://schema.org/MixedEventAttendanceMode",
        "eventStatus": "https://schema.org/EventScheduled",
        ...(eventDate && {
          "startDate": eventDate,
        }),
        ...(eventDuration && {
          "duration": eventDuration,
        }),
        ...(eventFormat === 'online' ? {
          "location": {
            "@type": "VirtualLocation",
            "url": canonicalUrl
          }
        } : eventLocation && {
          "location": {
            "@type": "Place",
            "name": eventLocation,
            "address": eventLocation
          }
        }),
        ...(eventPrice > 0 ? {
          "offers": {
            "@type": "Offer",
            "price": eventPrice,
            "priceCurrency": locale === 'tr' ? "TRY" : "USD",
            "availability": "https://schema.org/InStock",
            "url": canonicalUrl,
            "validFrom": new Date().toISOString()
          }
        } : {
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": locale === 'tr' ? "TRY" : "USD",
            "availability": "https://schema.org/InStock",
            "url": canonicalUrl
          }
        }),
        "inLanguage": locale === 'tr' ? "tr" : "en",
        "audience": {
          "@type": "EducationalAudience",
          "audienceType": locale === 'tr' ? "Tüm seviyeler" : "All levels"
        },
        "about": [eventTypeCategory || categoryDescription, formatDescription].filter(Boolean),
        "educationalLevel": "all-levels",
        "keywords": locale === 'tr' 
          ? `${eventTitle}, webinar, workshop, MyUNI, ${categoryDescription}, ${formatDescription}`
          : `${eventTitle}, webinar, workshop, MyUNI, ${categoryDescription}, ${formatDescription}`,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        }
      }),
    },
  };
}

export default async function Page({ params }: EventDetailProps) {
  const resolvedParams = await params;
  
  const eventParams = Promise.resolve({
    locale: resolvedParams.locale,
    eventType: resolvedParams.locale === 'tr' ? 'etkinlik' : 'event',
    slug: resolvedParams.slug
  });

  return <EventDetailPage params={eventParams} />;
}
