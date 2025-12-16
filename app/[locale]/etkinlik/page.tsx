// app/[locale]/etkinlik/page.tsx
import type { Metadata } from "next";
import EventListPage from '../../components/pages/event/EventListPage'; 

interface EventsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  
  const title = locale === 'tr' 
    ? 'Etkinlikler | MyUNI Eğitim Platformu'
    : 'Events | MyUNI Educational Platform';
    
  const description = locale === 'tr'
    ? 'MyUNI\'de düzenlenen tüm etkinlikleri keşfedin. Webinarlar, workshoplar, seminerler ve daha fazlası.'
    : 'Discover all events organized at MyUNI. Webinars, workshops, seminars and more.';

  return {
    title,
    description,
    keywords: locale === 'tr'
      ? [
          "MyUNI etkinlik",
          "webinar",
          "workshop",
          "seminer",
          "konferans",
          "online etkinlik",
          "yapay zeka etkinliği",
          "teknoloji etkinliği",
          "networking",
          "uzman buluşması",
          "ücretsiz etkinlik",
          "eğitim etkinliği"
        ]
      : [
          "MyUNI event",
          "webinar",
          "workshop",
          "seminar",
          "conference",
          "online event",
          "AI event",
          "technology event",
          "networking",
          "expert meetup",
          "free event",
          "educational event"
        ],
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      images: [
        {
          url: 'https://myunilab.net/og-events.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://myunilab.net/twitter-events.jpg'],
    },
    alternates: {
      canonical: `https://myunilab.net/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}`,
      languages: {
        'tr': 'https://myunilab.net/tr/etkinlik',
        'en': 'https://myunilab.net/en/event',
      },
    },
  };
}

export default async function EventsPage({ params }: EventsPageProps) {
  const resolvedParams = await params;
  
  // EventListPage component'ine doğru props'ları geçiriyoruz
  const eventParams = Promise.resolve({
    locale: resolvedParams.locale,
    eventType: 'etkinlik'  // Bu sayfa için sabit 'etkinlik' değerini kullan
  });

  return <EventListPage params={eventParams} />;
}