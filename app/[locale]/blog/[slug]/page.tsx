// app/[locale]/blog/[slug]/page.tsx - Complete SEO Implementation
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Calendar, ArrowLeft, Tag } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Service functions for MyUNI Eğitim Platformu
import { 
  getUnilabBlogPostBySlug, 
  getUnilabRelatedBlogPosts,
  getUnilabBlogPostAlternateSlug,
  getCurrentSite
} from '@/app/services/unilabBlogService';

// Newsletter Form
import NewsletterForm from '@/app/components/pages/newsletter/NewsletterForm';

// Supported languages
type SupportedLocale = 'tr' | 'en';

// Page parameters type
interface PageParams {
  locale: string;
  slug: string;
}

// Function to format date in the desired format based on locale
function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  
  if (locale === 'tr') {
    // Turkish date format: 25 Temmuz, 2025
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } else {
    // English date format: July 25, 2025
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

// HTML'den düz metne çevirme fonksiyonu
const stripHtml = (html: string): string => {
  if (!html) return '';
  // HTML etiketlerini kaldır
  const withoutTags = html.replace(/<[^>]*>/g, '');
  // HTML entity'leri decode et
  const withoutEntities = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  // Fazla boşlukları temizle
  return withoutEntities.replace(/\s+/g, ' ').trim();
};

// Component props definition (params should be Promise)
export default async function BlogPostPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { locale, slug } = await params;

  // Language check
  if (locale !== 'tr' && locale !== 'en') {
    notFound();
  }

  // Get current site context
  const currentSite = getCurrentSite();

  // Get the post using service with site support
  const post = await getUnilabBlogPostBySlug(slug, locale as SupportedLocale, currentSite);
  if (!post) {
    notFound();
  }

  // Format the post date
  const formattedDate = formatDate(post.date, locale);

  // Get related posts
  const relatedPosts = await getUnilabRelatedBlogPosts(post, locale as SupportedLocale, 3, currentSite);

  // Format dates for related posts
  const relatedPostsWithFormattedDates = relatedPosts.map(relatedPost => ({
    ...relatedPost,
    formattedDate: formatDate(relatedPost.date, locale)
  }));

  // Get alternate language version slug
  const alternateLocale = locale === 'tr' ? 'en' : 'tr';
  const alternateSlug = await getUnilabBlogPostAlternateSlug(post.id, alternateLocale as SupportedLocale, currentSite);

  // Site-specific branding
  const siteBranding = {
    myuni_platform: {
      tr: {
        name: 'MyUNI Eğitim Platformu',
        description: 'MyUNI Eğitim Platformu hakkındaki en güncel gelişmeleri takip edin.',
        homeText: 'Ana Sayfa'
      },
      en: {
        name: 'MyUNI Education Platform',
        description: 'Keep up to date with the latest developments on MyUNI Education Platform.',
        homeText: 'Home'
      }
    },
    unilab_vision: {
      tr: {
        name: 'UNILAB Vision',
        description: 'UNILAB Vision hakkındaki en güncel gelişmeleri takip edin.',
        homeText: 'Ana Sayfa'
      },
      en: {
        name: 'UNILAB Vision',
        description: 'Keep up to date with the latest developments on UNILAB Vision.',
        homeText: 'Home'
      }
    }
  };

  const branding = siteBranding[currentSite][locale as SupportedLocale];

  return (
    <article className="bg-white dark:bg-neutral-900 min-h-screen">
      {/* Clean Header Section */}
      <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Breadcrumbs */}
          <nav className="flex mb-6" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-2 text-sm">
              <li className="inline-flex items-center">
                <Link 
                  href={`/${locale}`} 
                  className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                >
                  {branding.homeText}
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
                  <Link 
                    href={`/${locale}/blog`} 
                    className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
                  >
                    Blog
                  </Link>
                </div>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
                  <span className="text-neutral-500 dark:text-neutral-500 truncate max-w-[200px]">
                    {post.title}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          
          {/* Category Badge */}
          <div className="mb-4">
            <Link 
              href={`/${locale}/blog#${encodeURIComponent(post.category)}`}
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 transition-colors"
            >
              {post.category}
            </Link>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-neutral-100 mb-6 max-w-4xl leading-tight tracking-tight">
            {post.title}
          </h1>
          
          {/* Meta Information */}
          <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <time dateTime={post.date} className="text-sm">
                {formattedDate}
              </time>
            </div>
            {post.tags.length > 0 && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">•</span>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm">{post.tags.length} {locale === 'tr' ? 'etiket' : 'tags'}</span>
                </div>
              </>
            )}
          </div>
          
          {/* Alternate Language Link */}
          {alternateSlug && (
            <div className="inline-block">
              <Link 
                href={`/${alternateLocale}/blog/${alternateSlug}`}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors underline underline-offset-4"
              >
                {locale === 'tr' ? 'Read in English' : 'Türkçe Oku'}
              </Link>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column - Content */}
          <div className="lg:col-span-8">
            {post.image && (
              <div className="mb-12 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-800 aspect-video relative">
                <Image 
                  src={post.image} 
                  alt={post.title} 
                  fill
                  className="object-cover" 
                  priority
                />
              </div>
            )}
            
            {/* Excerpt */}
            {post.excerpt && (
              <div className="mb-10 p-6 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed font-light italic">
                  {post.excerpt}
                </p>
              </div>
            )}
            
            {/* Content */}
            <div className="rich-text-content prose prose-lg prose-neutral dark:prose-invert max-w-none">
              <div 
                dangerouslySetInnerHTML={{ __html: post.content }} 
                className="leading-relaxed"
              />
            </div>
            
            {/* Tags Section */}
            {post.tags.length > 0 && (
              <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  {locale === 'tr' ? 'Etiketler' : 'Tags'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <Link 
                      key={index}
                      href={`/${locale}/blog?search=${encodeURIComponent(tag)}`}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Newsletter Subscription Section */}
            <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <NewsletterForm locale={locale} />
            </div>
            
            {/* Navigation */}
            <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
              <Link 
                href={`/${locale}/blog`}
                className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">
                  {locale === 'tr' ? 'Tüm yazılara dön' : 'Back to all posts'}
                </span>
              </Link>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              
              {/* Related Posts */}
              {relatedPostsWithFormattedDates.length > 0 && (
                <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                    {locale === 'tr' ? 'İlgili Yazılar' : 'Related Posts'}
                  </h3>
                  <div className="space-y-6">
                    {relatedPostsWithFormattedDates.map((relatedPost) => (
                      <Link 
                        key={relatedPost.id}
                        href={`/${locale}/blog/${relatedPost.slug}`}
                        className="block group"
                      >
                        <div className="flex gap-4">
                          {relatedPost.image && (
                            <div className="flex-shrink-0 w-20 h-14 relative overflow-hidden rounded-lg">
                              <Image 
                                src={relatedPost.image} 
                                alt={relatedPost.title} 
                                fill 
                                className="object-cover transition-transform duration-300 group-hover:scale-110" 
                              />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2 leading-snug">
                              {relatedPost.title}
                            </h4>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                              {relatedPost.formattedDate}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Categories */}
              <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-6">
                  {locale === 'tr' ? 'Kategoriler' : 'Categories'}
                </h3>
                <div className="space-y-2">
                  {Array.from(new Set([post.category, ...relatedPostsWithFormattedDates.map(p => p.category)])).map((category, index) => (
                    <Link 
                      key={index}
                      href={`/${locale}/blog#${encodeURIComponent(category)}`}
                      className="flex items-center justify-between p-2 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
                    >
                      <span className="text-sm font-medium">{category}</span>
                      <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Quick Info */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">
                  {branding.name}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  {branding.description}
                </p>
                <Link 
                  href={`/${locale}/blog`}
                  className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                  <span>{locale === 'tr' ? 'Tüm yazılar' : 'All posts'}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// Metadata function should also be async - COMPLETE SEO IMPLEMENTATION
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { locale, slug } = await params;

  if (locale !== 'tr' && locale !== 'en') {
    return {
      title: 'Not Found',
      description: 'The page you are looking for does not exist.',
    };
  }

  // Get current site context
  const currentSite = getCurrentSite();

  const post = await getUnilabBlogPostBySlug(slug, locale as SupportedLocale, currentSite);
  if (!post) {
    return {
      title: locale === 'tr' ? '404 - Yazı Bulunamadı' : '404 - Post Not Found',
      description: locale === 'tr' 
        ? 'Aradığınız blog yazısı bulunamadı.' 
        : 'The blog post you are looking for does not exist.',
    };
  }

  // Site-specific metadata
  const siteMetadata = {
    myuni_platform: {
      tr: {
        siteName: 'MyUNI Eğitim Platformu Blog',
        baseUrl: 'https://myunilab.net',
        author: 'MyUNI Eğitim Platformu',
        publisherName: 'MyUNI',
        publisherLogo: 'https://myunilab.net/logo.png'
      },
      en: {
        siteName: 'MyUNI Education Platform Blog',
        baseUrl: 'https://myunilab.net',
        author: 'MyUNI Education Platform',
        publisherName: 'MyUNI',
        publisherLogo: 'https://myunilab.net/logo.png'
      }
    },
    unilab_vision: {
      tr: {
        siteName: 'UNILAB Vision Blog',
        baseUrl: 'https://unilabvision.com',
        author: 'UNILAB Vision',
        publisherName: 'UNILAB Vision',
        publisherLogo: 'https://unilabvision.com/logo.png'
      },
      en: {
        siteName: 'UNILAB Vision Blog',
        baseUrl: 'https://unilabvision.com',
        author: 'UNILAB Vision',
        publisherName: 'UNILAB Vision',
        publisherLogo: 'https://unilabvision.com/logo.png'
      }
    }
  };

  const metadata = siteMetadata[currentSite][locale as SupportedLocale];

  // Sayfanın tam URL'ini oluştur
  const canonicalUrl = `${metadata.baseUrl}/${locale}/blog/${slug}`;
  
  // Get alternate language version for metadata
  const alternateLocale = locale === 'tr' ? 'en' : 'tr';
  const alternateSlug = await getUnilabBlogPostAlternateSlug(post.id, alternateLocale as SupportedLocale, currentSite);
  
  // HTML'den temizlenmiş excerpt
  const cleanExcerpt = stripHtml(post.excerpt || '');
  const cleanContent = stripHtml(post.content || '');
  
  // Description oluşturma (önce excerpt, sonra content'ten)
  const description = cleanExcerpt 
    ? cleanExcerpt.length > 160 
      ? cleanExcerpt.substring(0, 157) + '...'
      : cleanExcerpt
    : cleanContent.length > 160
      ? cleanContent.substring(0, 157) + '...'
      : cleanContent;

  // Keywords oluşturma
  const keywords = [
    ...post.tags,
    post.category,
    'blog',
    currentSite === 'myuni_platform' ? 'MyUNI Eğitim Platformu' : 'UNILAB Vision',
    ...(locale === 'tr' 
      ? ['eğitim', 'teknoloji', 'blog yazısı', 'makale']
      : ['education', 'technology', 'blog post', 'article']
    )
  ];

  // Reading time calculation (approx 200 words per minute)
  const wordCount = cleanContent.split(' ').length;
  const readingTime = Math.ceil(wordCount / 200);

  // Fallback image
  const fallbackImage = currentSite === 'myuni_platform' 
    ? 'https://myunilab.net/og-blog-default.jpg'
    : 'https://unilabvision.com/og-blog-default.jpg';

  return {
    title: `${post.title} | ${metadata.siteName}`,
    description,
    keywords,
    authors: [{ name: metadata.author }],
    robots: "index, follow",
    
    // Canonical URL ve language alternates
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'tr': alternateSlug 
          ? `${siteMetadata.myuni_platform.tr.baseUrl}/tr/blog/${alternateSlug}` 
          : `${metadata.baseUrl}/tr/blog/${slug}`,
        'en': alternateSlug 
          ? `${siteMetadata.myuni_platform.en.baseUrl}/en/blog/${alternateSlug}` 
          : `${metadata.baseUrl}/en/blog/${slug}`,
      },
    },

    // OpenGraph metadata
    openGraph: {
      title: post.title,
      description,
      url: canonicalUrl,
      siteName: metadata.siteName,
      images: [
        {
          url: post.image || fallbackImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      locale: locale === 'tr' ? "tr_TR" : "en_US",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.date, // Blog posts don't have updated_at field
      authors: [metadata.author],
      section: post.category,
      tags: post.tags,
    },

    // Twitter metadata
    twitter: {
      card: "summary_large_image",
      title: post.title.length > 70 ? post.title.substring(0, 67) + '...' : post.title,
      description: description.length > 200 ? description.substring(0, 197) + '...' : description,
      images: [post.image || fallbackImage],
      creator: `@${currentSite === 'myuni_platform' ? 'myuniturkiye' : 'unilabvision'}`,
      site: `@${currentSite === 'myuni_platform' ? 'myuniturkiye' : 'unilabvision'}`,
    },

    // Additional metadata
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": description,
        "image": post.image || fallbackImage,
        "url": canonicalUrl,
        "datePublished": post.date,
        "dateModified": post.date, // Blog posts don't have updated_at field
        "author": {
          "@type": "Organization",
          "name": metadata.author,
          "url": metadata.baseUrl
        },
        "publisher": {
          "@type": "Organization",
          "name": metadata.publisherName,
          "logo": {
            "@type": "ImageObject",
            "url": metadata.publisherLogo
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl
        },
        "articleSection": post.category,
        "keywords": keywords.join(', '),
        "wordCount": wordCount,
        "timeRequired": `PT${readingTime}M`,
        "inLanguage": locale,
        "isPartOf": {
          "@type": "Blog",
          "name": metadata.siteName,
          "url": `${metadata.baseUrl}/${locale}/blog`
        },
        "about": {
          "@type": "Thing",
          "name": post.category
        },
        "mentions": post.tags.map(tag => ({
          "@type": "Thing",
          "name": tag
        }))
      }),
    },
  };
}