import React from 'react';
import Image from 'next/image';

// Define locale type
type Locale = 'tr' | 'en';

interface DepartmentsSectionProps {
  locale: string;
}

interface DepartmentItem {
  id: string;
  logo: string;
  link: string;
}

interface DepartmentsContent {
  title: string;
  subtitle: string;
  departments: DepartmentItem[];
}

// Type guard to check if locale is valid
function isValidLocale(locale: string): locale is Locale {
  return locale === 'tr' || locale === 'en';
}

// Helper function to get safe locale
function getSafeLocale(locale: string): Locale {
  return isValidLocale(locale) ? locale : 'tr';
}

async function getDepartmentsContent(locale: string): Promise<DepartmentsContent> {
  const departments: Record<Locale, DepartmentsContent> = {
    tr: {
      title: "Birimlerimiz",
      subtitle: "UNILAB Vision bünyesinde faaliyet gösteren 5 uzmanlık birimimiz, bilim ve teknoloji alanlarında öncü çalışmalar yürütmektedir.",
      departments: [
        {
          id: "research",
          logo: "/tr/images/departments/unird.png",
          link: "https://research.unilabvision.com",
        },
        {
          id: "development",
          logo: "/tr/images/departments/unidev.png",
          link: "https://unidevsoftware.com/",
        },
        {
          id: "media",
          logo: "/tr/images/departments/darkpost.png",
          link: "https://darkpost.net/",
        },
        {
          id: "event",
          logo: "/tr/images/departments/unicom.png",
          link: "https://unicom.net.tr/",
        },
        {
          id: "community",
          logo: "/tr/images/departments/unidc.png",
          link: "https://unidc.org",
        },
      ],
    },
    en: {
      title: "Our Departments",
      subtitle: "Our 5 specialized departments at UNILAB Vision conduct pioneering work in the fields of science and technology.",
      departments: [
        {
          id: "research",
          logo: "/tr/images/departments/unird.png",
          link: "https://research.unilabvision.com",
        },
        {
          id: "development",
          logo: "/tr/images/departments/unidev.png",
          link: "https://unidevsoftware.com/",
        },
        {
          id: "media",
          logo: "/tr/images/departments/darkpost.png",
          link: "https://darkpost.net/",
        },
        {
          id: "event",
          logo: "/tr/images/departments/unicom.png",
          link: "https://unicom.net.tr/",
        },
        {
          id: "community",
          logo: "/tr/images/departments/unidc.png",
          link: "https://unidc.org",
        },
      ],
    },
  };

  // Use safe locale to ensure type safety
  const safeLocale = getSafeLocale(locale);
  return departments[safeLocale];
}

export default async function DepartmentsSection({ locale }: DepartmentsSectionProps) {
  try {
    const content = await getDepartmentsContent(locale);

    return (
      <section className="py-24 bg-white dark:bg-neutral-900">
        <div className="container mx-auto">
          <div className="max-w-4xl mb-16">
            <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {content.title}
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-6"></div>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 max-w-3xl">
              {content.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {content.departments.map((department) => (
              <a
                key={department.id}
                href={department.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden transition-all duration-500 ease-in-out hover:shadow-lg hover:border-[#990000]/50 aspect-square"
              >
                <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-white/50 dark:via-white/100 dark:to-white/100 dark:opacity-98"></div>
                <div className="absolute inset-0 bg-gradient-to-br from-[#990000]/0 via-[#990000]/10 to-[#990000]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none"></div>
                
                <div className="relative p-8 flex items-center justify-center w-full h-full">
                  <Image 
                    src={department.logo}
                    alt={`${department.id} logo`}
                    width={500}
                    height={500}
                    className="object-contain transition-all duration-500 ease-in-out"
                  />
                </div>
                
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#990000]/50 rounded-md transition-all duration-500 ease-in-out pointer-events-none"></div>
              </a>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Failed to load departments content:', error);
    return (
      <section className="py-16 lg:py-20">
        <div className="container mx-auto">
          <p>İçerik yüklenirken bir hata oluştu. Detaylar için konsolu kontrol edin.</p>
        </div>
      </section>
    );
  }
}