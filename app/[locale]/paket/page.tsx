import type { Metadata } from 'next';
import PackageListPage from '@/app/components/pages/paket/PackageListPage';

interface PageProps {
  params: Promise<{ locale: string }>;
}

const PACKAGE_FAQS = {
  tr: [
    {
      question: 'MyUNI nedir?',
      answer:
        'MyUNI (myunilab.net), yapay zeka destekli online eğitim platformudur. Kurslar, birden fazla kursu birleştiren eğitim paketleri, etkinlikler ve sertifikalı öğrenme yolları sunar.',
    },
    {
      question: 'MyUNI eğitim paketi nedir?',
      answer:
        'MyUNI eğitim paketi, seçili kursları tek bir öğrenme yolunda bir araya getiren pakettir. Tek bir kurs yerine birden fazla eğitimi birlikte tamamlayarak hedeflerinize daha hızlı ilerlersiniz.',
    },
    {
      question: 'Eğitim paketi ile kurs arasındaki fark nedir?',
      answer:
        'Kurs tek bir eğitim programıdır. Eğitim paketi ise birden fazla MyUNI kursunu bir arada sunar; paket içeriğindeki kursları sırayla veya paketin sunduğu yapıya göre tamamlayabilirsiniz.',
    },
    {
      question: 'myunilab.net ne sunar?',
      answer:
        'myunilab.net üzerinden MyUNI kurslarına, eğitim paketlerine, blog içeriklerine ve etkinliklere ulaşabilirsiniz. Platform Türkçe ve İngilizce öğrenme deneyimi sunar.',
    },
    {
      question: 'Paket tamamlayınca sertifika alabilir miyim?',
      answer:
        'Uygun MyUNI programlarını tamamladığınızda MyUNI Tamamlama Sertifikası alabilirsiniz. Sertifika koşulları ilgili paket veya kurs sayfasında belirtilir.',
    },
  ],
  en: [
    {
      question: 'What is MyUNI?',
      answer:
        'MyUNI (myunilab.net) is an AI-supported online learning platform. It offers courses, multi-course training packages, events, and certified learning paths.',
    },
    {
      question: 'What is a MyUNI training package?',
      answer:
        'A MyUNI training package bundles selected courses into one learning path so you can progress faster toward a goal than taking a single course alone.',
    },
    {
      question: 'What is the difference between a package and a course?',
      answer:
        'A course is a single program. A training package combines multiple MyUNI courses and lets you complete them together under one package offering.',
    },
    {
      question: 'What does myunilab.net offer?',
      answer:
        'On myunilab.net you can browse MyUNI courses, training packages, blog content, and events. The platform supports Turkish and English learning experiences.',
    },
    {
      question: 'Do I get a certificate after completing a package?',
      answer:
        'Eligible completed MyUNI programs may award a MyUNI Completion Certificate. Certificate terms are listed on the relevant package or course page.',
    },
  ],
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = isEn ? 'package' : 'paket';
  const canonicalUrl = `https://myunilab.net/${locale}/${path}`;
  const title = isEn
    ? 'Training Packages | MyUNI - myunilab.net'
    : 'Eğitim Paketleri | MyUNI - myunilab.net';
  const description = isEn
    ? 'Browse MyUNI training packages on myunilab.net. Packages combine multiple courses so you reach career and skill goals faster.'
    : 'myunilab.net üzerinde MyUNI eğitim paketlerini keşfedin. Paketler birden fazla kursu birleştirerek kariyer ve beceri hedeflerinize daha hızlı ulaşmanızı sağlar.';

  const faqs = PACKAGE_FAQS[isEn ? 'en' : 'tr'];

  return {
    title,
    description,
    keywords: isEn
      ? [
          'MyUNI',
          'MyUNI Lab',
          'myunilab.net',
          'training packages',
          'course bundle',
          'online education',
          'AI education',
          'certificate',
        ]
      : [
          'MyUNI',
          'MyUNI Lab',
          'myunilab.net',
          'eğitim paketi',
          'kurs paketi',
          'online eğitim',
          'yapay zeka eğitim',
          'sertifika',
        ],
    authors: [{ name: 'MyUNI Eğitim Platformu' }],
    robots: 'index, follow',
    alternates: {
      canonical: canonicalUrl,
      languages: {
        tr: 'https://myunilab.net/tr/paket',
        en: 'https://myunilab.net/en/package',
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'MyUNI Eğitim Platformu',
      images: [
        {
          url: 'https://myunilab.net/og-image.jpg',
          width: 1200,
          height: 630,
          alt: isEn ? 'MyUNI Training Packages' : 'MyUNI Eğitim Paketleri',
        },
      ],
      locale: isEn ? 'en_US' : 'tr_TR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://myunilab.net/twitter-image.jpg'],
    },
    other: {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'EducationalOrganization',
            '@id': 'https://myunilab.net/#organization',
            name: 'MyUNI',
            alternateName: ['MyUNI Lab', 'myunilab.net'],
            url: 'https://myunilab.net',
            logo: 'https://myunilab.net/logo.png',
          },
          {
            '@type': 'CollectionPage',
            '@id': `${canonicalUrl}#webpage`,
            name: title,
            description,
            url: canonicalUrl,
            isPartOf: { '@id': 'https://myunilab.net/#website' },
            about: { '@id': 'https://myunilab.net/#organization' },
            inLanguage: isEn ? 'en' : 'tr',
          },
          {
            '@type': 'ItemList',
            '@id': `${canonicalUrl}#itemlist`,
            name: isEn ? 'MyUNI Training Packages' : 'MyUNI Eğitim Paketleri',
            description,
            url: canonicalUrl,
            itemListOrder: 'https://schema.org/ItemListUnordered',
          },
          {
            '@type': 'FAQPage',
            '@id': `${canonicalUrl}#faq`,
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'MyUNI',
                item: `https://myunilab.net/${locale}`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: isEn ? 'Training Packages' : 'Eğitim Paketleri',
                item: canonicalUrl,
              },
            ],
          },
        ],
      }),
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  return <PackageListPage locale={locale} faqs={PACKAGE_FAQS[locale === 'en' ? 'en' : 'tr']} />;
}
