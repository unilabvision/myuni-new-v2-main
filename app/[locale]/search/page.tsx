//app/[locale]/search/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ArrowLeft, Clock, BookOpen, Newspaper, Calendar, Briefcase, ChevronRight, GraduationCap, Users } from 'lucide-react';

// Search result interface - kurs desteği eklendi
interface SearchResultItem {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  type: 'blog' | 'page' | 'event' | 'project' | 'course';
  image?: string;
  category?: string;
  date?: string;
  tags?: string[];
  // Course specific data
  courseData?: {
    price?: number;
    originalPrice?: number;
    instructor?: string;
    level?: string;
    duration?: string;
    courseType?: 'online' | 'live' | 'hybrid';
    liveStartDate?: string;
    liveEndDate?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    isRegistrationOpen?: boolean;
  };
}

interface SearchPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Helper function to format date in Turkish format (25 Temmuz, 2025)
const formatDateTurkish = (dateStr: string): string => {
  try {
    let date: Date;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateStr);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

// Helper function to format date in English format (July 25, 2025)
const formatDateEnglish = (dateStr: string): string => {
  try {
    let date: Date;
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date = new Date(dateStr);
    } else {
      date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

// Client Component to handle search logic
function SearchContent({ locale }: { locale: string }) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newQuery, setNewQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Filter states - kurs filtresi eklendi
  const [activeFilters] = useState<Record<string, boolean>>({
    blog: true,
    page: true,
    event: true, 
    project: true,
    course: true
  });
  
  const searchParams = useSearchParams();

  const performSearch = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Expected JSON response but got ${contentType}`);
      }
      
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    const query = searchParams?.get('q') || '';
    setSearchQuery(query);
    setNewQuery(query);

    if (query) {
      performSearch(query);
    } else {
      setResults([]);
      setLoading(false);
    }
  }, [searchParams, performSearch]);

  const handleNewSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuery.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', newQuery);
      window.history.pushState({}, '', url.toString());
      performSearch(newQuery);
      setSearchQuery(newQuery);
    }
  };

  // Filter results
  const filteredResults = results.filter(result => activeFilters[result.type]);

  // Translations based on locale - kurs çevirileri eklendi
  const t = {
    searchResults: locale === 'tr' ? 'Arama Sonuçları' : 'Search Results',
    searchFor: locale === 'tr' ? 'Arama' : 'Search',
    noResults: locale === 'tr' ? 'Aramanız için sonuç bulunamadı' : 'No results found for your search',
    tryAgain: locale === 'tr' ? 'Farklı anahtar kelimeler deneyebilir veya filtreleri değiştirebilirsiniz.' : 'You can try different keywords or change the filters.',
    searchPlaceholder: locale === 'tr' ? 'Ne aramak istiyorsunuz?' : 'What are you looking for?',
    searchButton: locale === 'tr' ? 'Ara' : 'Search',
    loading: locale === 'tr' ? 'Aranıyor...' : 'Searching...',
    backToHome: locale === 'tr' ? 'Ana Sayfaya Dön' : 'Back to Home',
    errorText: locale === 'tr' ? 'Arama sırasında bir hata oluştu' : 'An error occurred during search',
    tryLater: locale === 'tr' ? 'Lütfen daha sonra tekrar deneyin' : 'Please try again later',
    resultsCount: locale === 'tr'
      ? (count: number) => `${count} sonuç bulundu`
      : (count: number) => `${count} result${count !== 1 ? 's' : ''} found`,
    contentTypes: {
      blog: locale === 'tr' ? 'Blog Yazısı' : 'Blog Post',
      page: locale === 'tr' ? 'Sayfa' : 'Page',
      event: locale === 'tr' ? 'Etkinlik' : 'Event',
      project: locale === 'tr' ? 'Proje' : 'Project',
      course: locale === 'tr' ? 'Eğitim' : 'Course'
    },
    home: locale === 'tr' ? 'Ana Sayfa' : 'Home',
    enrollNow: locale === 'tr' ? 'Kayıt Ol' : 'Enroll Now',
    registrationClosed: locale === 'tr' ? 'Kayıt Kapalı' : 'Registration Closed',
    participants: locale === 'tr' ? 'Katılımcı' : 'Participants',
    liveTraining: locale === 'tr' ? 'Canlı Eğitim' : 'Live Training',
    onlineTraining: locale === 'tr' ? 'Online Eğitim' : 'Online Course',
    hybridTraining: locale === 'tr' ? 'Hibrit Eğitim' : 'Hybrid Training',
    free: locale === 'tr' ? 'Ücretsiz' : 'Free'
  };

  // Get icon by content type - kurs ikonu eklendi
  const getIconForType = (type: string) => {
    switch (type) {
      case 'blog':
        return <Newspaper className="w-4 h-4" />;
      case 'page':
        return <BookOpen className="w-4 h-4" />;
      case 'event':
        return <Calendar className="w-4 h-4" />;
      case 'project':
        return <Briefcase className="w-4 h-4" />;
      case 'course':
        return <GraduationCap className="w-4 h-4" />;
      default:
        return <Newspaper className="w-4 h-4" />;
    }
  };

  // Kurs kartı için özel render fonksiyonu
  const renderCourseCard = (result: SearchResultItem) => {
    const courseData = result.courseData;
    if (!courseData) return null;

    return (
      <Link
        key={result.id}
        href={result.url}
        className="block group"
      >
        <article className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {result.image && (
              <div className="lg:w-64 w-full h-48 lg:h-auto relative overflow-hidden lg:flex-shrink-0">
                <Image
                  src={result.image}
                  alt={result.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Kurs tipi badge */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    {courseData.courseType === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                    {courseData.courseType === 'live' ? t.liveTraining : 
                     courseData.courseType === 'hybrid' ? t.hybridTraining : t.onlineTraining}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 flex-1 min-h-0">
              {/* Meta Information */}
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20">
                  <GraduationCap className="w-4 h-4" />
                  {t.contentTypes.course}
                </span>

                {courseData.level && (
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-full">
                    {courseData.level}
                  </span>
                )}

                {courseData.liveStartDate && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center ml-auto">
                    <Clock className="w-3 h-3 mr-1" />
                    {locale === 'tr'
                      ? formatDateTurkish(courseData.liveStartDate)
                      : formatDateEnglish(courseData.liveStartDate)
                    }
                  </span>
                )}
              </div>

              {/* Title */}
              <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
                {result.title}
              </h2>

              {/* Instructor */}
              {courseData.instructor && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  {locale === 'tr' ? 'Eğitmen: ' : 'Instructor: '}
                  <span className="font-medium">{courseData.instructor}</span>
                </p>
              )}

              {/* Excerpt */}
              <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
                {result.excerpt}
              </p>

              {/* Course Info Row */}
              <div className="flex items-center justify-between mb-4 text-sm">
                <div className="flex items-center gap-4">
                  {courseData.duration && (
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {courseData.duration}
                    </span>
                  )}
                  
                  {courseData.courseType === 'live' && courseData.maxParticipants && (
                    <span className="text-neutral-500 dark:text-neutral-400 flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {courseData.currentParticipants || 0}/{courseData.maxParticipants} {t.participants}
                    </span>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center group">
                    {locale === 'tr' ? 'Detayları Gör' : 'View Details'}
                    <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  
                  {/* Course level badge */}
                  {courseData.level && (
                    <span className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                      {courseData.level}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  };

  // Regular content card render
  const renderRegularCard = (result: SearchResultItem) => (
    <Link
      key={result.id}
      href={result.url}
      className="block group"
    >
      <article className="bg-white dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {result.image && (
            <div className="lg:w-64 w-full h-48 lg:h-auto relative overflow-hidden lg:flex-shrink-0">
              <Image
                src={result.image}
                alt={result.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          )}

          <div className="p-6 flex-1 min-h-0">
            {/* Meta Information */}
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20">
                {getIconForType(result.type)}
                {t.contentTypes[result.type as keyof typeof t.contentTypes]}
              </span>

              {result.category && (
                <span className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-full">
                  {result.category}
                </span>
              )}

              {result.date && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center ml-auto">
                  <Clock className="w-3 h-3 mr-1" />
                  {locale === 'tr'
                    ? result.date.includes(',') ? result.date : formatDateTurkish(result.date)
                    : result.date.includes(',') ? result.date : formatDateEnglish(result.date)
                  }
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors leading-tight">
              {result.title}
            </h2>

            {/* Excerpt */}
            <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
              {result.excerpt}
            </p>

            {/* Tags */}
            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {result.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {result.tags.length > 3 && (
                  <span className="text-xs text-neutral-400 dark:text-neutral-500">
                    +{result.tags.length - 3} {locale === 'tr' ? 'daha' : 'more'}
                  </span>
                )}
              </div>
            )}

            {/* Read More */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-700">
              <span className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center group">
                {locale === 'tr' ? 'Devamını oku' : 'Read more'}
                <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );

  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen">
      {/* Clean Header Section - Blog sayfası stilinde */}
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
                  {t.home}
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 text-neutral-400 mx-2" />
                  <span className="text-neutral-500 dark:text-neutral-500">
                    {t.searchResults}
                  </span>
                </div>
              </li>
            </ol>
          </nav>

          {/* Search Query Badge */}
          {searchQuery && (
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <Search className="w-3 h-3 mr-1" />
                {searchQuery}
              </span>
            </div>
          )}
          
          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 dark:text-neutral-100 mb-6 max-w-4xl leading-tight tracking-tight">
            {t.searchResults}
          </h1>
          
          {/* Search Form */}
          <div className="max-w-2xl">
            <form onSubmit={handleNewSearch} className="flex items-center bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  type="text"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  className="py-3 pl-12 pr-4 block w-full bg-transparent border-0 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-0"
                  placeholder={t.searchPlaceholder}
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white py-3 px-6 font-medium transition-colors"
              >
                {t.searchButton}
              </button>
            </form>
          </div>

          {/* Results Count */}
          {!loading && !error && searchQuery && (
            <div className="mt-4">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                {t.resultsCount(filteredResults.length)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column - Results */}
          <div className="lg:col-span-8">
            {error && (
              <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto text-red-500 dark:text-red-400 mb-4">
                    <Search className="w-full h-full" />
                  </div>
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    {t.errorText}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    {error}
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500">
                    {t.tryLater}
                  </p>
                </div>
              </div>
            )}

            {loading ? (
              <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-12 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative mb-6">
                    <div className="h-12 w-12 rounded-full border-4 border-neutral-200 dark:border-neutral-700"></div>
                    <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-t-4 border-red-600 animate-spin"></div>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400">{t.loading}</p>
                </div>
              </div>
            ) : (
              <>
                {!error && filteredResults.length === 0 && searchQuery && (
                  <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4">
                        <Search className="w-full h-full" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                        {t.noResults}
                      </h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {t.tryAgain}
                      </p>
                    </div>
                  </div>
                )}

                {filteredResults.length > 0 && (
                  <div className="space-y-8">
                    {filteredResults.map((result) => (
                      result.type === 'course' ? renderCourseCard(result) : renderRegularCard(result)
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Back to Blog */}
            {filteredResults.length > 0 && (
              <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800">
                <Link 
                  href={`/${locale}`}
                  className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-medium">
                    {t.backToHome}
                  </span>
                </Link>
              </div>
            )}
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-8">
              
              {/* Search Tips */}
              <div className="bg-white dark:bg-neutral-800/50 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
                  {locale === 'tr' ? 'Arama İpuçları' : 'Search Tips'}
                </h3>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                  <p>
                    {locale === 'tr' 
                      ? '• Eğitim, kurs, blog ve proje aramalarında spesifik kelimeler kullanın'
                      : '• Use specific keywords for training, courses, blog and project searches'}
                  </p>
                  <p>
                    {locale === 'tr' 
                      ? '• Eğitmen adı veya konu başlığı ile arayabilirsiniz'
                      : '• Search by instructor name or topic title'}
                  </p>
                  <p>
                    {locale === 'tr' 
                      ? '• "Online", "Canlı" gibi eğitim türlerini belirtebilirsiniz'
                      : '• Specify training types like "Online", "Live"'}
                  </p>
                  <p>
                    {locale === 'tr' 
                      ? '• Seviye belirterek ("Başlangıç", "İleri") arama yapın'
                      : '• Search by level ("Beginner", "Advanced")'}
                  </p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
                <h3 className="text-lg font-medium text-red-900 dark:text-red-100 mb-4">
                  MyUNI Eğitim Platformu
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed mb-4">
                  {locale === 'tr' 
                    ? 'Aradığınızı bulamıyor musunuz? Kurslarımızı ve blog içeriklerimizi keşfedebilirsiniz.'
                    : "Can't find what you're looking for? Explore our courses and blog content."}
                </p>
                <div className="space-y-2">
                  <Link 
                    href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>{locale === 'tr' ? 'Tüm Kurslar' : 'All Courses'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  <br />
                  <Link 
                    href={`/${locale}/blog`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    <Newspaper className="w-4 h-4" />
                    <span>{locale === 'tr' ? 'Blog Yazıları' : 'Blog Posts'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function SearchPage({ params }: SearchPageProps) {
  const [locale, setLocale] = useState<string>('tr');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale || 'tr');
    };
    resolveParams();
  }, [params]);

  return (
    <Suspense fallback={
      <div className="bg-white dark:bg-neutral-900 min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-neutral-200 dark:border-neutral-700"></div>
          <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-t-4 border-red-600 animate-spin"></div>
        </div>
      </div>
    }>
      <SearchContent locale={locale} />
    </Suspense>
  );
}