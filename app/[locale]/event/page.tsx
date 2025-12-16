// app/[locale]/event/page.tsx
import type { Metadata } from "next";
import EventListPage from '../../components/pages/event/EventListPage';

interface EventPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Page level metadata - bu layout metadata'sını override eder
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'tr';
  
  const eventType = locale === 'tr' ? 'etkinlik' : 'event';
  const canonicalUrl = `https://myunilab.net/${locale}/${eventType}`;
  const trPath = `https://myunilab.net/tr/etkinlik`;
  const enPath = `https://myunilab.net/en/event`;

  return {
    title: locale === 'tr'
      ? "Etkinlikler | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
      : "Events | MyUNI - AI-Powered Learning Platform",
    description: locale === 'tr'
      ? "MyUNI'de düzenlenen webinarlar, workshoplar ve özel etkinlikleri keşfedin. Uzmanlarla buluşun, networking yapın ve yeni beceriler edinin. Ücretsiz ve ücretli etkinlik seçenekleri."
      : "Discover webinars, workshops and special events organized at MyUNI. Meet with experts, network and gain new skills. Free and paid event options.",
    keywords: locale === 'tr'
      ? [
          "MyUNI etkinlikler",
          "webinar",
          "workshop",
          "online etkinlik",
          "yapay zeka etkinlikleri",
          "teknoloji etkinlikleri",
          "networking",
          "uzman buluşması",
          "ücretsiz etkinlik",
          "eğitim semineri",
          "canlı etkinlik"
        ]
      : [
          "MyUNI events",
          "webinar",
          "workshop",
          "online event",
          "AI events",
          "technology events",
          "networking",
          "expert meetup",
          "free event",
          "educational seminar",
          "live event"
        ],
    authors: [{ name: "MyUNI Eğitim Platformu" }],
    robots: "index, follow",
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': trPath,
        'en': enPath,
      },
    },
    openGraph: {
      title: locale === 'tr'
        ? "Etkinlikler | MyUNI - Yapay Zeka Destekli Eğitim Platformu"
        : "Events | MyUNI - AI-Powered Learning Platform",
      description: locale === 'tr'
        ? "MyUNI'de düzenlenen webinarlar, workshoplar ve özel etkinlikleri keşfedin. Uzmanlarla buluşun ve yeni beceriler edinin."
        : "Discover webinars, workshops and special events organized at MyUNI. Meet with experts and gain new skills.",
      url: canonicalUrl,
      siteName: "MyUNI Eğitim Platformu",
      images: [
        {
          url: "https://myunilab.net/og-events.jpg",
          width: 1200,
          height: 630,
          alt: locale === 'tr' ? "MyUNI Etkinlikler Sayfası" : "MyUNI Events Page",
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: locale === 'tr'
        ? "Etkinlikler | MyUNI - Yapay Zeka Destekli Eğitim"
        : "Events | MyUNI - AI-Powered Learning",
      description: locale === 'tr'
        ? "Webinar, workshop ve uzman buluşmalarına katılın. Networking yapın ve yeni beceriler edinin."
        : "Join webinars, workshops and expert meetups. Network and gain new skills.",
      images: ["https://myunilab.net/twitter-events.jpg"],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ItemList",
        "name": locale === 'tr' ? "MyUNI Etkinlikler" : "MyUNI Events",
        "description": locale === 'tr'
          ? "MyUNI'de düzenlenen tüm etkinliklerin listesi. Webinar, workshop ve özel etkinliklerle uzmanlardan öğrenin, networking yapın."
          : "List of all events organized at MyUNI. Learn from experts and network through webinars, workshops and special events.",
        "url": canonicalUrl,
        "provider": {
          "@type": "EducationalOrganization",
          "name": "MyUNI",
          "url": "https://myunilab.net",
          "logo": "https://myunilab.net/logo.png",
          "sameAs": [
            "https://x.com/myuniturkiye",
            "https://linkedin.com/company/myuniturkiye",
            "https://instagram.com/myuniturkiye",
            "https://youtube.com/@myuniturkiye"
          ]
        },
        "educationalLevel": "all-levels",
        "eventType": locale === 'tr' 
          ? ["Webinar", "Workshop", "Networking Etkinliği", "Özel Seminer"]
          : ["Webinar", "Workshop", "Networking Event", "Special Seminar"]
      }),
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const resolvedParams = await params;
  
  const eventParams = Promise.resolve({
    locale: resolvedParams.locale,
    eventType: 'event'  // Bu sayfa için sabit 'event' değerini kullan
  });

  return <EventListPage params={eventParams} />;
}