// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';

import {
  getFormsSupabaseClient,
  getLearningSupabaseClient,
} from '@/lib/supabase/databases';

const blogSupabase = getFormsSupabaseClient();
const learningSupabase = getLearningSupabaseClient();

// Define proper types for database entities
interface BlogPostDb {
  id: string;
  post_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  date: string;
  image: string | null;
  content?: string;
}

// Course interface based on your table structure
interface CourseDb {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  instructor_name: string | null;
  duration: string | null;
  level: string | null;
  price: number | null;
  original_price: number | null;
  thumbnail_url: string | null;
  course_type: 'online' | 'live' | 'hybrid';
  live_start_date: string | null;
  live_end_date: string | null;
  max_participants: number | null;
  current_participants: number | null;
  is_active: boolean | null;
  is_registration_open: boolean | null;
  created_at: string;
}

// Define result types - course eklendi
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

// Static page definition
interface StaticPage {
  path: string;
  name: string;
}

// Helper function to format date in Turkish format
const formatDateTurkish = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } catch {
    return dateStr; // Return original if any error
  }
};

// Helper function to format date in English format
const formatDateEnglish = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateStr; // Return original if any error
  }
};


function formatSearchDate(date: string, locale: string): string {
  return locale === 'tr' ? formatDateTurkish(date) : formatDateEnglish(date);
}

function getPlainTextFromRichText(richText: string | null, locale: string): string {
  const fallback =
    locale === 'tr' ? 'Eğitim açıklaması mevcut değil.' : 'Course description not available.';
  if (!richText) return fallback;

  const plainText = richText
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, '...')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) return fallback;
  return plainText.length > 200 ? `${plainText.slice(0, 200)}...` : plainText;
}

function mapBlogResult(post: BlogPostDb, locale: string): SearchResultItem {
  return {
    id: post.post_id,
    title: post.title,
    excerpt: post.excerpt || '',
    url: `/${locale}/blog/${post.slug}`,
    type: 'blog',
    image: post.image ? getFullStorageUrl(post.image) : undefined,
    category: post.category,
    date: formatSearchDate(post.date, locale),
  };
}

function getCourseCategory(courseType: CourseDb['course_type'], locale: string): string {
  const labels = {
    live: locale === 'tr' ? 'Canlı Eğitim' : 'Live Training',
    hybrid: locale === 'tr' ? 'Hibrit Eğitim' : 'Hybrid Training',
    online: locale === 'tr' ? 'Online Eğitim' : 'Online Course',
  };
  return labels[courseType] || labels.online;
}

function getCourseTags(course: CourseDb, locale: string): string[] {
  const tags: string[] = [];
  if (course.level) tags.push(locale === 'tr' ? `Seviye: ${course.level}` : `Level: ${course.level}`);
  if (course.duration) tags.push(locale === 'tr' ? `Süre: ${course.duration}` : `Duration: ${course.duration}`);
  if (course.instructor_name) {
    tags.push(
      locale === 'tr'
        ? `Eğitmen: ${course.instructor_name}`
        : `Instructor: ${course.instructor_name}`
    );
  }
  return tags;
}

function mapCourseResult(course: CourseDb, locale: string): SearchResultItem {
  const displayDate = course.live_start_date || course.created_at;
  return {
    id: course.id,
    title: course.title,
    excerpt: getPlainTextFromRichText(course.description, locale),
    url: `/${locale}/${locale === 'tr' ? 'kurs' : 'course'}/${course.slug}`,
    type: 'course',
    image: course.thumbnail_url ? getFullStorageUrl(course.thumbnail_url) : undefined,
    category: getCourseCategory(course.course_type, locale),
    date: displayDate ? formatSearchDate(displayDate, locale) : '',
    tags: getCourseTags(course, locale),
    courseData: {
      price: course.price ?? undefined,
      originalPrice: course.original_price ?? undefined,
      instructor: course.instructor_name ?? undefined,
      level: course.level ?? undefined,
      duration: course.duration ?? undefined,
      courseType: course.course_type,
      liveStartDate: course.live_start_date ?? undefined,
      liveEndDate: course.live_end_date ?? undefined,
      maxParticipants: course.max_participants ?? undefined,
      currentParticipants: course.current_participants ?? undefined,
      isRegistrationOpen: course.is_registration_open ?? true,
    },
  };
}

async function searchBlogPosts(query: string, locale: string): Promise<SearchResultItem[]> {
  const { data, error } = await blogSupabase
    .from('unilab_vision_blog_posts')
    .select('id, post_id, title, slug, excerpt, category, date, image')
    .eq('locale', locale)
    .eq('site', 'myuni_platform')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .order('date', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[search] Blog query failed:', error.message);
    return [];
  }
  return (data || []).map((post) => mapBlogResult(post as BlogPostDb, locale));
}

async function searchCourses(query: string, locale: string): Promise<SearchResultItem[]> {
  const { data, error } = await learningSupabase
    .from('myuni_courses')
    .select(
      'id, slug, title, description, instructor_name, duration, level, price, original_price, thumbnail_url, course_type, live_start_date, live_end_date, max_participants, current_participants, is_active, is_registration_open, created_at'
    )
    .eq('is_active', true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,instructor_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(15);

  if (error) {
    console.error('[search] Course query failed:', error.message);
    return [];
  }
  return (data || []).map((course) => mapCourseResult(course as CourseDb, locale));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const locale = searchParams.get('locale') || 'tr';

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    // Sanitize and normalize search query
    const sanitizedQuery = query.trim().toLowerCase();
    
    if (sanitizedQuery.length < 2) {
      return NextResponse.json({ 
        results: [],
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Create an array to store all search results
    const allResults: SearchResultItem[] = [];
    
    const [blogResults, courseResults] = await Promise.all([
      searchBlogPosts(sanitizedQuery, locale),
      searchCourses(sanitizedQuery, locale),
    ]);
    allResults.push(...blogResults, ...courseResults);

    // Add static pages (this doesn't require database)
    try {
      const staticPages: StaticPage[] = [];
      
      // Define pages based on locale
      if (locale === 'tr') {
        staticPages.push(
          { path: '', name: 'Ana Sayfa' },
          { path: 'hakkimizda', name: 'Hakkımızda' },
          { path: 'kariyer', name: 'Kariyer' },
          { path: 'gizlilik', name: 'Gizlilik' },
          { path: 'sartlar-ve-kosullar', name: 'Şartlar ve Koşullar' },
          { path: 'blog', name: 'Blog' },
          { path: 'iletisim', name: 'İletişim' },
          { path: 'projelerimiz', name: 'Projelerimiz' },
          { path: 'hizmetlerimiz', name: 'Hizmetlerimiz' },
          { path: 'kurslar', name: 'Kurslar' }, // Yeni eklendi
          { path: 'egitimler', name: 'Eğitimler' } // Yeni eklendi
        );
      } else if (locale === 'en') {
        staticPages.push(
          { path: '', name: 'Home' },
          { path: 'about', name: 'About' },
          { path: 'careers', name: 'Careers' },
          { path: 'blog', name: 'Blog' },
          { path: 'contact', name: 'Contact' },
          { path: 'projects', name: 'Projects' },
          { path: 'services', name: 'Services' },
          { path: 'courses', name: 'Courses' }, // Yeni eklendi
          { path: 'training', name: 'Training' } // Yeni eklendi
        );
      }
      
      const pageResults = staticPages
        .filter(page => {
          const pageName = page.name.toLowerCase();
          const pagePath = page.path.toLowerCase();
          return pageName.includes(sanitizedQuery) || pagePath.includes(sanitizedQuery);
        })
        .map(page => ({
          id: `page-${page.path || 'home'}`,
          title: page.name,
          excerpt: locale === 'tr' 
            ? `${page.name} sayfasına git` 
            : `Go to ${page.name} page`,
          url: `/${locale}${page.path ? `/${page.path}` : ''}`,
          type: 'page' as const,
          date: locale === 'tr'
            ? formatDateTurkish(new Date().toISOString())
            : formatDateEnglish(new Date().toISOString())
        }));
      
      if (pageResults.length > 0) {
        allResults.push(...pageResults);
      }
    } catch (pagesError) {
      console.error('Error processing static pages:', pagesError);
      // Continue with whatever results we have
    }

    // Sort results by relevance and date
    const sortedResults = allResults.sort((a, b) => {
      // First, prioritize exact title matches
      const aExactMatch = a.title.toLowerCase().includes(sanitizedQuery);
      const bExactMatch = b.title.toLowerCase().includes(sanitizedQuery);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then prioritize courses (if searching for education-related terms)
      const educationTerms = ['kurs', 'course', 'eğitim', 'training', 'learn'];
      const isEducationQuery = educationTerms.some(term => sanitizedQuery.includes(term));
      
      if (isEducationQuery) {
        if (a.type === 'course' && b.type !== 'course') return -1;
        if (a.type !== 'course' && b.type === 'course') return 1;
      }
      
      // Finally, sort by date (newest first)
      const aDate = new Date(a.date || 0);
      const bDate = new Date(b.date || 0);
      return bDate.getTime() - aDate.getTime();
    });

    // Set proper headers explicitly
    const response = NextResponse.json({ 
      results: sortedResults,
      query: sanitizedQuery,
      total: sortedResults.length
    });
    
    // Explicitly set content-type
    response.headers.set('Content-Type', 'application/json');
    
    return response;

  } catch (error) {
    console.error('Search API error:', error);
    
    // Create a response with proper JSON format and content-type
    const response = NextResponse.json({ 
      results: [],
      error: 'Failed to perform search',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Explicitly set content-type
    response.headers.set('Content-Type', 'application/json');
    
    return response;
  }
}

// Helper function to get full storage URL for images
function getFullStorageUrl(path: string | null): string {
  if (!path) return '/blog/default-image.webp'; // Default image
  
  // If URL is already complete, don't modify it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If path starts with /blog/ or /courses/, it's likely a static file path
  if (path.startsWith('/blog/') || path.startsWith('/courses/')) {
    return path;
  }
  
  // Add leading slash if missing
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  
  // Supabase storage URL - you might need to adjust this for course images
  // If you have a separate bucket for course images, update accordingly
  const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_FORMS_URL}/storage/v1/object/public/blog-images`;
  
  return baseUrl + normalizedPath;
}
