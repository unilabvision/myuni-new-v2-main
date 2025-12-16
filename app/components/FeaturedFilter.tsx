//app/components/FeaturedFilter.tsx
'use client';

import { Book, Clock, ArrowRight, Star, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name?: string;
  duration?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price?: number;
  original_price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  is_active?: boolean;
  is_registration_open?: boolean; // Added this field
  created_at?: string;
  updated_at?: string;
  // Early bird pricing fields
  early_bird_price?: number | null;
  early_bird_deadline?: string | null;
}

interface FeaturedListProps {
  locale?: string;
  limit?: number;
}

function FeaturedList({ locale = 'tr', limit = 3 }: FeaturedListProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();
  const [ratingMap, setRatingMap] = useState<Record<string, { avg: number; count: number }>>({});
  const [popularityMap, setPopularityMap] = useState<Record<string, number>>({});
  const [topSellerIds, setTopSellerIds] = useState<Set<string>>(new Set());

  // Rich text renderer function
  const renderRichText = (htmlContent: string | undefined, isCard: boolean = false) => {
    if (!htmlContent) return null;
    
    const isHtml = htmlContent.includes('<');
    let contentToRender = isHtml ? htmlContent : `<p>${htmlContent}</p>`;
    
    // Kart görünümü için içeriği kısalt
    if (isCard) {
      const textOnly = htmlContent.replace(/<[^>]*>/g, '').trim();
      if (textOnly.length > 120) {
        const truncatedText = textOnly.slice(0, 120) + '...';
        contentToRender = `<p>${truncatedText}</p>`;
      }
    }

    return (
      <div 
        className={`rich-text-content ${isCard ? 'card-description' : ''}`}
        dangerouslySetInnerHTML={{ __html: contentToRender }}
      />
    );
  };

  // Fetch courses from Supabase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('myuni_courses')
          .select('*, early_bird_price, early_bird_deadline')
          .eq('is_active', true)
          .eq('is_registration_open', true) // Added this filter
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Error fetching courses:', error);
          setError(error.message);
          return;
        }

        const fetched = data || [];
        setCourses(fetched);

        // Fetch ratings and popularity for these courses in parallel
        const courseIds = fetched.map(c => c.id);
        if (courseIds.length > 0) {
          const sinceDate = new Date();
          sinceDate.setDate(sinceDate.getDate() - 30);
          const [commentsRes, enrollmentsRes] = await Promise.all([
            supabase
              .from('myuni_comments')
              .select('course_id, rating, status')
              .in('course_id', courseIds)
              .eq('status', 'approved'),
            supabase
              .from('myuni_enrollments')
              .select('course_id, enrolled_at')
              .in('course_id', courseIds)
              .eq('is_active', true)
              .gte('enrolled_at', sinceDate.toISOString())
          ]);

          // Build rating map
          if (!commentsRes.error && Array.isArray(commentsRes.data)) {
            const map: Record<string, { sum: number; count: number }> = {};
            for (const row of commentsRes.data as Array<{ course_id: string; rating: number | null }>) {
              if (row.rating && row.rating > 0) {
                if (!map[row.course_id]) map[row.course_id] = { sum: 0, count: 0 };
                map[row.course_id].sum += row.rating;
                map[row.course_id].count += 1;
              }
            }
            const avgMap: Record<string, { avg: number; count: number }> = {};
            Object.entries(map).forEach(([k, v]) => {
              avgMap[k] = { avg: v.sum / v.count, count: v.count };
            });
            setRatingMap(avgMap);
          }

          // Build popularity map (enrollment counts)
          if (!enrollmentsRes.error && Array.isArray(enrollmentsRes.data)) {
            const pMap: Record<string, number> = {};
            for (const row of enrollmentsRes.data as Array<{ course_id: string }>) {
              if (!row.course_id) continue;
              pMap[row.course_id] = (pMap[row.course_id] || 0) + 1;
            }
            setPopularityMap(pMap);

            // Top sellers (last 30 days): pick top 3 by enrollments (same as course list)
            const sorted = Object.entries(pMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
            setTopSellerIds(new Set(sorted.map(([id]) => id)));
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [supabase, limit]);

  // Course Card Component - CourseListPage stilinde
  const CourseCard = ({ course }: { course: Course }) => {
    const levelLabels = {
      tr: {
        beginner: 'Başlangıç',
        intermediate: 'Orta',
        advanced: 'İleri'
      },
      en: {
        beginner: 'Beginner',
        intermediate: 'Intermediate', 
        advanced: 'Advanced'
      }
    };

    const currentLevelLabels = levelLabels[locale as keyof typeof levelLabels] || levelLabels.tr;

    // Early bird helper functions
    const isEarlyBirdActive = () => {
      if (!course.early_bird_price || !course.early_bird_deadline) return false;
      const deadline = new Date(course.early_bird_deadline);
      const now = new Date();
      return now < deadline;
    };

    const getActivePrice = () => {
      if (isEarlyBirdActive() && course.early_bird_price) {
        return course.early_bird_price;
      }
      return course.price;
    };

    const renderStars = (avg: number | undefined, count: number | undefined) => {
      if (!avg || avg <= 0) return null;
      return (
        <div className="inline-flex items-center text-sm">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="ml-1 text-neutral-700 dark:text-neutral-300">{avg.toFixed(1)}</span>
          {typeof count === 'number' && <span className="ml-1 text-neutral-500 dark:text-neutral-400">({count})</span>}
        </div>
      );
    };

    return (
      <Link 
        href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}/${course.slug}`}
        className="bg-white dark:bg-neutral-800 rounded-md border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group"
      >
        {/* Course Image */}
        <div className="relative w-full h-48 overflow-hidden">
          {course.thumbnail_url ? (
            <Image
              src={course.thumbnail_url}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-200 dark:bg-neutral-700">
              <Book className="w-12 h-12 text-neutral-400 dark:text-neutral-600" />
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <span className="inline-block bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 px-3 py-1 rounded-md text-sm">
              {course.level ? currentLevelLabels[course.level as keyof typeof currentLevelLabels] || course.level : 'Başlangıç'}
            </span>
            {ratingMap[course.id] && renderStars(ratingMap[course.id].avg, ratingMap[course.id].count)}
            {/* Katılımcı rozeti istenmediği için gösterilmiyor */}
          </div>

          <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 group-hover:text-[#990000] transition-colors">
            {course.title}
          </h3>
          
          {/* Rich Text Description */}
          {course.description && (
            <div className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
              {renderRichText(course.description, true)}
            </div>
          )}

          {/* Course Stats */}
          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <div className="flex items-center space-x-4">
              {course.duration && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {course.duration}
                </span>
              )}
              
            </div>
          </div>

          {/* Price Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {isEarlyBirdActive() ? (
                <div className="flex flex-col">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                    ₺{getActivePrice()}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                      Erken kayıt fiyatı
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {course.price ? `₺${course.price}` : (locale === 'tr' ? 'Ücretsiz' : 'Free')}
                </span>
              )}
              {course.original_price && getActivePrice() && course.original_price > (getActivePrice() || 0) && (
                <span className="text-lg text-neutral-400 line-through">
                  ₺{course.original_price}
                </span>
              )}
            </div>
          </div>

          {/* Best Seller Badge */}
          {topSellerIds.has(course.id) && (
            <div className="mt-3">
              <span className="inline-block bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-md text-sm font-medium">
                Son dönemde en çok satan
              </span>
            </div>
          )}

          {/* Instructor */}
          {course.instructor_name && (
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700">
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {locale === 'tr' ? 'Eğitmen:' : 'Instructor:'} <span className="font-medium text-neutral-900 dark:text-neutral-100">{course.instructor_name}</span>
              </span>
            </div>
          )}
        </div>
      </Link>
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
        {/* Level Badge Skeleton */}
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

        {/* Rating and Price Skeleton */}
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

        {/* Instructor Skeleton */}
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
        title: "Henüz kurs bulunamadı",
        description: "Son kurslar yakında eklenecek.",
        action: "Tüm kursları görüntüle"
      },
      en: {
        title: "No courses found yet",
        description: "Latest courses will be added soon.",
        action: "View all courses"
      }
    };

    const currentContent = content[locale as keyof typeof content] || content.tr;

    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Book className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {currentContent.title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {currentContent.description}
        </p>
        <Link 
          href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`}
          className="inline-block px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
        >
          {currentContent.action}
        </Link>
      </div>
    );
  };

  // Error State Component
  const ErrorState = () => {
    const content = {
      tr: {
        title: "Kurslar yüklenirken hata oluştu",
        description: "Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.",
        action: "Tekrar Dene"
      },
      en: {
        title: "Error loading courses",
        description: "Please refresh the page or try again later.",
        action: "Try Again"
      }
    };

    const currentContent = content[locale as keyof typeof content] || content.tr;

    return (
      <div className="col-span-full text-center py-12">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg mx-auto mb-4 flex items-center justify-center">
          <Book className="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          {currentContent.title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          {currentContent.description}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          {currentContent.action}
        </button>
      </div>
    );
  };

  return (
    <section className="py-16 ">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h2 className="text-2xl lg:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {locale === 'tr' ? 'Son Kurslar' : 'Latest Courses'} 
          </h2>
          <div className="w-16 h-px bg-[#990000]"></div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(limit)
              .fill(null)
              .map((_, index) => <SkeletonCard key={index} />)}
          </div>
        ) : error ? (
          <ErrorState />
        ) : courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            
            {/* View All Courses Button */}
            <div className="mt-12">
              <Link href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`} className="inline-block">
                <button className="bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white border-2 border-transparent hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-900 dark:hover:border-neutral-100 px-8 py-3 text-sm font-medium transition-all duration-300 focus:outline-none rounded-md shadow-sm flex items-center gap-2">
                  {locale === 'tr' ? 'Tüm Kursları Göster' : 'View All Courses'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
          </>
        ) : (
          <EmptyState />
        )}

        {/* Load More Button - Sadece 3 kurs olduğu için gizlendi */}
        {!loading && !error && courses.length > 0 && courses.length >= 6 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors border border-neutral-300 dark:border-neutral-700">
              {locale === 'tr' ? 'Daha Fazla Kurs Yükle' : 'Load More Courses'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedList;