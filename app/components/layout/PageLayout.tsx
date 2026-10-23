import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import ApplicationFormHero from './ApplicationFormHero';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  locale: string;
  breadcrumbs?: BreadcrumbItem[];
  variant?: 'default' | 'minimal' | 'application';
  bgImage?: string; // Added to accept the background image prop
}

export default function PageLayout({
  children,
  title,
  description,
  locale,
  breadcrumbs,
  variant = 'default',
  bgImage
}: PageLayoutProps) {
  
  const homeText = useMemo(() => locale === 'tr' ? 'Ana Sayfa' : 'Home', [locale]);

  // Compute only the first sentence (or first paragraph if no punctuation)
  const headerDescription = useMemo(() => {
    if (!description) return '';
    // Take first paragraph
    const firstParagraph = description.split(/\n\s*\n/)[0]?.trim() || '';
    // Take first sentence ending with . ! or ?
    const sentenceMatch = firstParagraph.match(/^[\s\S]*?[\.\!\?](?:\s|$)/);
    return (sentenceMatch ? sentenceMatch[0] : firstParagraph).trim();
  }, [description]);

  // Style for the hero section, applying the background image if it exists
  const heroStyle = bgImage ? {
    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${bgImage})`,
  } : {};

  const headerClasses = bgImage 
    ? "relative bg-cover bg-center bg-no-repeat"
    : "border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950";


  return (
    <div className="min-h-screen bg-white text-neutral-950 dark:bg-neutral-950 dark:text-white">
      {variant === 'application' ? (
        <ApplicationFormHero
          title={title}
          description={description}
          locale={locale}
          breadcrumbs={breadcrumbs}
        />
      ) : (
      <div className={`${headerClasses} py-10 sm:py-14 lg:py-20`} style={heroStyle}>
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs */}
          {breadcrumbs && (
            <nav className="mb-7 overflow-x-auto" aria-label={locale === 'tr' ? 'Sayfa yolu' : 'Breadcrumb'}>
              <div className={`flex min-w-max items-center gap-1 text-sm ${bgImage ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'}`}>
                <Link href={`/${locale}`} className="flex min-h-10 items-center transition-colors hover:text-[#990000]">
                  <Home className="w-4 h-4 mr-1" />
                  {homeText}
                </Link>
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <div key={item.href} className="flex items-center">
                      <ChevronRight className={`h-4 w-4 ${bgImage ? 'text-white/50' : 'text-neutral-300 dark:text-neutral-600'}`} />
                      {isLast ? (
                        <span className={`ml-1 font-medium ${bgImage ? 'text-white' : 'text-neutral-900 dark:text-white'}`}>{item.name}</span>
                      ) : (
                        <Link href={item.href} className="ml-1 transition-colors hover:text-[#990000]">
                          {item.name}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            </nav>
          )}

          {/* Title */}
          <div className="max-w-4xl">
            <div className={`mb-5 h-px w-10 ${bgImage ? 'bg-white' : 'bg-[#990000]'}`} aria-hidden="true" />
            <h1 className={`text-4xl font-semibold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl ${bgImage ? 'text-white' : 'text-neutral-950 dark:text-white'}`}>
              {title}
            </h1>
            
            {headerDescription && (
              <div className={`prose prose-neutral mt-6 max-w-2xl text-base leading-7 sm:text-lg sm:leading-8 dark:prose-invert ${bgImage ? 'prose-invert text-white/85' : 'text-neutral-600 dark:text-neutral-300'}`}>
                <ReactMarkdown>
                  {headerDescription}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Main Content */}
      <main
        className={
          variant === 'application'
            ? 'bg-gradient-to-b from-white to-rose-50/30 dark:from-neutral-900 dark:to-neutral-900 -mt-1'
            : 'bg-white dark:bg-neutral-950'
        }
      >
        {children}
      </main>

      {/* Simple Contact Section (conditionally rendered) */}
      {variant === 'default' && (
        <section className="mt-12 border-y border-neutral-200 bg-neutral-50 py-12 dark:border-neutral-800 dark:bg-neutral-900 sm:py-14">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:px-6 md:flex-row md:items-center lg:px-8">
            <div>
            <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em] text-neutral-950 dark:text-white">
              {locale === 'tr' ? 'Bizimle İletişime Geçin' : 'Get in Touch'}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-neutral-600 dark:text-neutral-300 sm:text-base">
              {locale === 'tr' 
                ? 'Sorularınız için bizimle iletişime geçebilirsiniz.'
                : 'Contact us for any questions you may have.'
              }
            </p>
            </div>
            <Link
              href={`/${locale}/${locale === 'tr' ? 'iletisim' : 'contact'}`}
              className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md bg-[#990000] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#780000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#990000] focus-visible:ring-offset-4"
            >
              {locale === 'tr' ? 'İletişim' : 'Contact'}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
