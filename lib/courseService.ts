// lib/courseService.ts - Complete Fixed Version

import { supabase } from './supabase';
import { formatDurationMinutes, resolveLessonDurationMinutes } from './durationFormat';
import {
  getUserCourseProgress as apiGetUserCourseProgress,
  getUserLessonProgress as apiGetUserLessonProgress,
  getCourseCompletionStats as apiGetCourseCompletionStats,
  getLatestQuizResult as apiGetLatestQuizResult,
  updateUserProgress as apiUpdateUserProgress,
  markLessonCompleted as apiMarkLessonCompleted,
  updateVideoPosition as apiUpdateVideoPosition,
  saveQuizResult as apiSaveQuizResult,
  getCourseAnalytics as apiGetCourseAnalytics,
} from './progressApi';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface QuickContent {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  quick_type: 'quiz' | 'interactive' | 'game' | 'simulation';
  config: Record<string, unknown>;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface LessonContent {
  videos?: VideoData[];
  notes?: NoteData[];
  quicks?: QuickContent[];
  documents?: DocumentData[];
  resources?: ResourceData[];
}

export interface VideoData {
  id: string;
  lesson_id: string;
  title: string;
  vimeo_id?: string;
  duration_seconds?: number;
  order_index: number;
}

export interface NoteData {
  id: string;
  lesson_id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface DocumentData {
  id: string;
  lesson_id: string;
  title: string;
  file_url: string;
  order_index: number;
}

export interface ResourceData {
  id: string;
  lesson_id: string;
  title: string;
  url: string;
  order_index: number;
}

export interface AnalyticsData {
  watch_time_minutes?: number;
  videos_watched?: number;
  quizzes_attempted?: number;
  quizzes_passed?: number;
  quizzes_failed?: number;
  quiz_time_minutes?: number;
  quiz_score?: number;
  lessons_completed?: number;
  notes_created?: number;
}

interface LessonWithSection {
  id: string;
  title: string;
  lesson_type: string;
  duration_minutes: number;
  order_index: number;
  section_id: string;
  is_active: boolean;
  videos?: Array<{ duration_seconds?: number | null }>;
  myuni_course_sections: {
    course_id: string;
  };
}

// ========================================
// COURSE MANAGEMENT
// ========================================

export async function getAllCourses(
  locale: string = 'tr',
  options?: { programType?: string; excludeProgramTypes?: string[] }
) {
  try {
    let query = supabase
      .from('myuni_courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (options?.programType) {
      query = query.eq('program_type', options.programType);
    }

    const { data, error } = await query;

    // Column may not exist yet — treat as empty mentorship list rather than hard-fail
    if (error) {
      const msg = error.message || '';
      if (
        options?.programType &&
        (/program_type/i.test(msg) || error.code === '42703' || error.code === 'PGRST204')
      ) {
        console.warn(
          '[getAllCourses] program_type column missing; returning empty list. Apply SQL in docs/sql/add-program-type-mentorship.sql'
        );
        return [];
      }
      throw error;
    }

    let rows = data || [];
    if (options?.excludeProgramTypes?.length) {
      rows = rows.filter(
        (course) =>
          !course.program_type ||
          !options.excludeProgramTypes!.includes(String(course.program_type))
      );
    }

    const transformedCourses = rows.map(course => ({
      id: course.id,
      slug: course.slug,
      name: course.title, // name alanı title'dan gelir
      title: course.title, // title alanını da ekle
      description: course.description || '',
      price: course.price || 0,
      originalPrice: course.original_price || null,
      original_price: course.original_price || null, // Hem camelCase hem snake_case
      duration: course.duration || '',
      level: course.level || 'Beginner',
      students: Math.floor(Math.random() * 3000) + 500,
      rating: (Math.random() * 1.5 + 3.5),
      instructor: course.instructor_name || 'Instructor',
      instructor_name: course.instructor_name || 'Instructor',
      image: course.thumbnail_url || course.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
      thumbnail_url: course.thumbnail_url,
      banner_url: course.banner_url,
      featured: Boolean(course.featured ?? course.is_featured),
      banner: {
        url: course.banner_url || course.thumbnail_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=1200&h=600&fit=crop`
      },
      features: generateCourseFeatures(locale),
      sections: [],
      
      // Course type fields - YENİ ALANLAR
      course_type: course.course_type || 'online',
      live_start_date: course.live_start_date,
      live_end_date: course.live_end_date,
      live_timezone: course.live_timezone,
      max_participants: course.max_participants,
      current_participants: course.current_participants || 0,
      meeting_url: course.meeting_url,
      meeting_password: course.meeting_password,
      prerequisites: course.prerequisites,
      target_audience: course.target_audience,
      learning_outcomes: course.learning_outcomes,
      session_count: course.session_count,
      session_duration_minutes: course.session_duration_minutes,
      registration_deadline: course.registration_deadline,
      is_registration_open: course.is_registration_open ?? true,
      
      // Instructor fields
      instructor_description: course.instructor_description,
      instructor_email: course.instructor_email,
      instructor_linkedin: course.instructor_linkedin,
      instructor_image_url: course.instructor_image_url,
      
      // Status fields
      is_active: course.is_active,
      created_at: course.created_at,
      updated_at: course.updated_at,
      
      // Early bird pricing fields
      early_bird_price: course.early_bird_price || null,
      early_bird_deadline: course.early_bird_deadline || null,
      program_type: course.program_type || 'course',
    }));

    return transformedCourses || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function getUserAnalytics(userId: string, courseId: string) {
  try {
    const [progress, analytics] = await Promise.all([
      apiGetUserCourseProgress(userId, courseId),
      apiGetCourseAnalytics(userId, courseId),
    ]);

    let enrollment = null;
    try {
      const res = await fetch(`/api/enrollments/me?courseId=${encodeURIComponent(courseId)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        enrollment = json.enrollment || null;
      }
    } catch {
      enrollment = null;
    }

    return { analytics, progress, enrollment };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
}

export async function getCourseBySlug(slug: string, locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Debug veritabanından gelen veriyi konsola yazdır - Her zaman göster
    console.log('=== DATABASE COURSE DATA ===');
    console.log('Raw course data from database:', data);
    console.log('Course duration from DB:', data.duration);
    console.log('Course type from DB:', data.course_type);
    console.log('Course ID from DB:', data.id);
    console.log('Course title from DB:', data.title);
    console.log('Early bird price from DB:', data.early_bird_price);
    console.log('Early bird deadline from DB:', data.early_bird_deadline);
    console.log('All keys in data:', Object.keys(data));

    const sections = await getCourseSections(data.id);

    return {
      id: data.id,
      slug: data.slug,
      name: data.title,
      title: data.title,
      description: data.description || '',
      price: data.price || 0,
      originalPrice: data.original_price || null,
      original_price: data.original_price || null,
      early_bird_price: data.early_bird_price || null,
      early_bird_deadline: data.early_bird_deadline || null,
      duration: data.duration || '',
      level: data.level || 'Beginner',
      students: Math.floor(Math.random() * 3000) + 500,
      rating: (Math.random() * 1.5 + 3.5),
      instructor: data.instructor_name || 'Instructor',
      instructor_name: data.instructor_name || 'Instructor',
      
      // ✅ Eksik image alanlarını ekleyin
      image: data.thumbnail_url || data.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
      thumbnail_url: data.thumbnail_url,
      banner_url: data.banner_url,
      
      banner: {
        url: data.banner_url || data.thumbnail_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=1200&h=600&fit=crop`
      },
      features: generateCourseFeatures(locale),
      sections: sections,
      
      // Course type fields
      course_type: data.course_type || 'online',
      live_start_date: data.live_start_date,
      live_end_date: data.live_end_date,
      live_timezone: data.live_timezone,
      max_participants: data.max_participants,
      current_participants: data.current_participants || 0,
      meeting_url: data.meeting_url,
      meeting_password: data.meeting_password,
      prerequisites: data.prerequisites,
      target_audience: data.target_audience,
      learning_outcomes: data.learning_outcomes,
      session_count: data.session_count,
      session_duration_minutes: data.session_duration_minutes,
      registration_deadline: data.registration_deadline,
      is_registration_open: data.is_registration_open ?? true,
      
      // Instructor fields
      instructor_description: data.instructor_description,
      instructor_email: data.instructor_email,
      instructor_linkedin: data.instructor_linkedin,
      instructor_image_url: data.instructor_image_url,
      
      // Status fields
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,

      // Shopier link entegrasyonu (link ile satış)
      shopier_product_id: data.shopier_product_id || null,
      shopier_product_url: data.shopier_product_url || null
    };
  } catch (error) {
    console.error('Error fetching course by slug:', error);
    throw error;
  }
}

export async function getPackageBySlug(slug: string, locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_packages')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - package doesn't exist
        return null;
      }
      throw error;
    }
    if (!data) return null;

    // Fetch included courses
    const { data: packageCourses, error: pcError } = await supabase
      .from('myuni_package_courses')
      .select(`
        order_index,
        myuni_courses (*)
      `)
      .eq('package_id', data.id)
      .order('order_index', { ascending: true });
      
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coursesList: any[] = [];
    if (!pcError && packageCourses) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawCourses = packageCourses.map((pc: any) => pc.myuni_courses).filter(Boolean);
      
      // Her kurs için sections/lessons çekip süre hesapla
      for (const course of rawCourses) {
        let calculatedDuration = course.duration || '';
        
        // Eğer kurs online ise ve duration boşsa, sections/lessons'dan hesapla
        if ((!calculatedDuration || calculatedDuration.trim() === '') && course.course_type === 'online') {
          const { data: sections } = await supabase
            .from('myuni_sections')
            .select('id, myuni_lessons(duration)')
            .eq('course_id', course.id);
          
          if (sections && sections.length > 0) {
            let totalMinutes = 0;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sections.forEach((section: any) => {
              if (section.myuni_lessons) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                section.myuni_lessons.forEach((lesson: any) => {
                  const dur = String(lesson.duration || '0');
                  if (dur.includes('dk')) {
                    totalMinutes += parseInt(dur.replace('dk', '').trim()) || 0;
                  } else if (dur.includes('sa')) {
                    totalMinutes += (parseInt(dur.replace('sa', '').trim()) || 0) * 60;
                  } else {
                    totalMinutes += parseInt(dur) || 0;
                  }
                });
              }
            });
            
            if (totalMinutes > 0) {
              if (totalMinutes >= 60) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                calculatedDuration = `${hours}sa${mins > 0 ? ` ${mins}dk` : ''}`;
              } else {
                calculatedDuration = `${totalMinutes}dk`;
              }
            }
          }
        }
        
        coursesList.push({ ...course, duration: calculatedDuration || course.duration || '' });
      }
    }

    return {
      id: data.id,
      slug: data.slug,
      name: data.title,
      title: data.title,
      description: data.description || '',
      price: data.price || 0,
      originalPrice: data.original_price || null,
      original_price: data.original_price || null,
      duration: data.duration || '',
      level: data.level || 'Beginner',
      students: Math.floor(Math.random() * 3000) + 500,
      rating: (Math.random() * 1.5 + 3.5),
      instructor: data.instructor_name || 'Instructor',
      instructor_name: data.instructor_name || 'Instructor',
      image: data.thumbnail_url || data.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
      thumbnail_url: data.thumbnail_url,
      banner_url: data.banner_url,
      banner: {
        url: data.banner_url || data.thumbnail_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=1200&h=600&fit=crop`
      },
      features: generateCourseFeatures(locale),
      course_type: 'online',
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
      shopier_product_id: data.shopier_product_id || null,
      shopier_product_url: data.shopier_product_url || null,
      learning_outcomes: Array.isArray(data.objectives) ? data.objectives : [],
      prerequisites: Array.isArray(data.requirements) ? data.requirements : [],
      included_courses: coursesList
    };
  } catch (error) {
    console.error('Error fetching package by slug:', error);
    throw error;
  }
}

export async function getAllPackages(locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_packages')
      .select('id, slug, title, description, price, original_price, level, thumbnail_url, banner_url, is_active, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((pkg) => ({
      id: pkg.id,
      slug: pkg.slug,
      name: pkg.title,
      title: pkg.title,
      description: pkg.description || '',
      price: pkg.price || 0,
      original_price: pkg.original_price || null,
      level: pkg.level || 'Beginner',
      thumbnail_url: pkg.thumbnail_url,
      banner_url: pkg.banner_url,
      image: pkg.thumbnail_url || pkg.banner_url || '',
      is_active: pkg.is_active,
      created_at: pkg.created_at,
      updated_at: pkg.updated_at,
      locale,
    }));
  } catch (error) {
    console.error('Error fetching all packages:', error);
    throw error;
  }
}


export async function getLatestQuizResult(userId: string, quickId: string) {
  try {
    return await apiGetLatestQuizResult(userId, quickId);
  } catch (error) {
    console.error('Error fetching latest quiz result:', error);
    throw error;
  }
}

// Live courses için özel fonksiyon
export async function getLiveCourses() {
  try {
    const { data, error } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('is_active', true)
      .in('course_type', ['live', 'hybrid'])
      .order('live_start_date', { ascending: true });

    if (error) throw error;

    const transformedCourses = data?.map(course => ({
      id: course.id,
      slug: course.slug,
      name: course.title,
      title: course.title,
      description: course.description || '',
      price: course.price || 0,
      originalPrice: course.original_price || null,
      original_price: course.original_price || null,
      duration: course.duration || '',
      level: course.level || 'Beginner',
      students: Math.floor(Math.random() * 3000) + 500,
      rating: (Math.random() * 1.5 + 3.5),
      instructor: course.instructor_name || 'Instructor',
      instructor_name: course.instructor_name || 'Instructor',
      image: course.thumbnail_url || course.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
      thumbnail_url: course.thumbnail_url,
      banner_url: course.banner_url,
      featured: Boolean(course.featured ?? course.is_featured),
      course_type: course.course_type,
      live_start_date: course.live_start_date,
      live_end_date: course.live_end_date,
      max_participants: course.max_participants,
      current_participants: course.current_participants || 0,
      session_count: course.session_count,
      session_duration_minutes: course.session_duration_minutes,
      registration_deadline: course.registration_deadline,
      is_registration_open: course.is_registration_open ?? true,
      prerequisites: course.prerequisites,
      target_audience: course.target_audience,
      learning_outcomes: course.learning_outcomes
    }));

    return transformedCourses || [];
  } catch (error) {
    console.error('Error fetching live courses:', error);
    return [];
  }
}

// Live sessions için fonksiyon
export async function getLiveSessions(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_live_sessions')
      .select('*')
      .eq('course_id', courseId)
      .order('session_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching live sessions:', error);
    return [];
  }
}

/** Kursa ait satış paketlerini (tier) getirir */
export async function getCourseTiers(courseId: string) {
  try {
    const { data: tiers, error } = await supabase
      .from('myuni_course_tiers')
      .select('*')
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    if (!tiers?.length) return [];

    const tierIds = tiers.map((t) => t.id);
    let tierSessions: Array<{
      id: string;
      tier_id: string;
      session_id: string;
      order_index: number;
      myuni_live_sessions: unknown;
    }> = [];

    if (tierIds.length > 0) {
      const { data, error: sessionsError } = await supabase
        .from('myuni_tier_sessions')
        .select(`
          id,
          tier_id,
          session_id,
          order_index,
          myuni_live_sessions (
            id,
            title,
            session_number,
            start_time,
            end_time
          )
        `)
        .in('tier_id', tierIds)
        .order('order_index', { ascending: true });

      if (sessionsError) {
        console.warn('Tier sessions fetch skipped:', sessionsError.message);
      } else {
        tierSessions = data || [];
      }
    }

    return tiers.map((tier) => ({
      ...tier,
      price: Number(tier.price) || 0,
      original_price: tier.original_price != null ? Number(tier.original_price) : null,
      early_bird_price: tier.early_bird_price != null ? Number(tier.early_bird_price) : null,
      sessions: tierSessions
        .filter((ts) => ts.tier_id === tier.id)
        .map((ts) => ({
          id: ts.id,
          tier_id: ts.tier_id,
          session_id: ts.session_id,
          order_index: ts.order_index,
          session: ts.myuni_live_sessions,
        })),
    }));
  } catch (error) {
    console.error('Error fetching course tiers:', error);
    return [];
  }
}

/** Tek bir tier kaydını ID ile getirir */
export async function getCourseTierById(tierId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_course_tiers')
      .select('*')
      .eq('id', tierId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;

    return {
      ...data,
      price: Number(data.price) || 0,
      original_price: data.original_price != null ? Number(data.original_price) : null,
      early_bird_price: data.early_bird_price != null ? Number(data.early_bird_price) : null,
    };
  } catch (error) {
    console.error('Error fetching course tier:', error);
    return null;
  }
}

// Live course registration
export async function registerForLiveCourse(userId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_live_registrations')
      .insert({
        user_id: userId,
        course_id: courseId,
        status: 'registered',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error registering for live course:', error);
    return null;
  }
}

// User live registrations
export async function getUserLiveRegistrations(userId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_live_registrations')
      .select(`
        *,
        myuni_courses (
          title,
          live_start_date,
          live_end_date,
          course_type,
          slug
        )
      `)
      .eq('user_id', userId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user live registrations:', error);
    return [];
  }
}

// ========================================
// FIXED getCourseWithContent FUNCTION WITH BETTER DEBUGGING
// ========================================

export async function getCourseWithContent(courseSlug: string) {
  try {
    console.log('🔍 Fetching course with content for slug:', courseSlug);

    // First, let's check what courses exist with this slug (for debugging)
    const { data: allCoursesWithSlug, error: debugError } = await supabase
      .from('myuni_courses')
      .select('id, title, slug, is_active')
      .eq('slug', courseSlug);

    if (debugError) {
      console.error('❌ Debug query error:', debugError);
    } else {
      console.log('🔍 All courses with this slug:', allCoursesWithSlug);
      console.log('📊 Found', allCoursesWithSlug?.length || 0, 'courses with slug:', courseSlug);
    }

    // Now get the active course by slug
    const { data: courses, error: courseError } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('slug', courseSlug)
      .eq('is_active', true);

    if (courseError) {
      console.error('❌ Course fetch error:', {
        error: courseError,
        message: courseError.message,
        details: courseError.details,
        hint: courseError.hint,
        code: courseError.code
      });
      throw new Error(`Course fetch failed: ${courseError.message}`);
    }

    console.log('📋 Courses found:', courses?.length || 0);
    console.log('📝 Course data:', courses);

    if (!courses || courses.length === 0) {
      console.error('❌ No active course found for slug:', courseSlug);
      throw new Error(`No active course found with slug: ${courseSlug}`);
    }

    if (courses.length > 1) {
      console.warn('⚠️ Multiple active courses found for slug:', courseSlug, 'Using first one');
    }

    const course = courses[0];
    console.log('✅ Course selected:', {
      id: course.id,
      title: course.title,
      slug: course.slug,
      is_active: course.is_active
    });

    // Then get sections with lessons
    console.log('🔍 Fetching sections for course ID:', course.id);
    
    const { data: sections, error: sectionsError } = await supabase
      .from('myuni_course_sections')
      .select(`
        id,
        title,
        order_index,
        course_id,
        is_active,
        lessons:myuni_course_lessons(
          id,
          title,
          lesson_type,
          duration_minutes,
          order_index,
          section_id,
          is_active,
          videos:myuni_videos(duration_seconds)
        )
      `)
      .eq('course_id', course.id)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (sectionsError) {
      console.error('❌ Sections fetch error:', {
        error: sectionsError,
        message: sectionsError.message,
        details: sectionsError.details,
        hint: sectionsError.hint,
        code: sectionsError.code
      });
      throw new Error(`Sections fetch failed: ${sectionsError.message}`);
    }

    console.log('📋 Raw sections found:', sections?.length || 0);
    console.log('📝 Sections data:', sections);

    // Transform sections to filter active lessons and sort them
    const transformedSections = sections?.map(section => {
      const activeLessons = (section.lessons || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((lesson: any) => lesson.is_active)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort((a: any, b: any) => a.order_index - b.order_index)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          duration_minutes: resolveLessonDurationMinutes(lesson) || undefined,
          order_index: lesson.order_index
        }));

      console.log(`📝 Section "${section.title}": ${activeLessons.length} active lessons`);

      return {
        id: section.id,
        title: section.title,
        order_index: section.order_index,
        lessons: activeLessons
      };
    }) || [];

    const totalLessons = transformedSections.reduce((acc, s) => acc + s.lessons.length, 0);
    
    console.log('✅ Final result:', {
      sectionsCount: transformedSections.length,
      totalLessons: totalLessons,
      courseTitle: course.title
    });

    return {
      course: {
        id: course.id,
        title: course.title,
        instructor_name: course.instructor_name,
        course_type: course.course_type || 'online',
        live_start_date: course.live_start_date,
        live_end_date: course.live_end_date,
        live_timezone: course.live_timezone,
        duration: course.duration
      },
      sections: transformedSections
    };
  } catch (error) {
    console.error('❌ Error fetching course with content:', {
      slug: courseSlug,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
      fullError: error
    });
    throw error;
  }
}

export async function getCourseSections(courseId: string) {
  try {
    const { data: sections, error } = await supabase
      .from('myuni_course_sections')
      .select(`
        *,
        lessons:myuni_course_lessons(
          *,
          videos:myuni_videos(duration_seconds)
        )
      `)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;

    return sections?.map(section => ({
      id: section.id,
      title: section.title,
      order: section.order_index,
      lessons: section.lessons
        ?.filter((lesson: LessonWithSection) => lesson.is_active)
        ?.map((lesson: LessonWithSection) => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.lesson_type,
          duration: formatDurationMinutes(resolveLessonDurationMinutes(lesson)),
          isCompleted: false,
          isLocked: false, // Default olarak unlocked
          order: lesson.order_index
        }))
        ?.sort((a: { order: number }, b: { order: number }) => a.order - b.order) || []
    })).sort((a, b) => a.order - b.order) || [];
  } catch (error) {
    console.error('Error fetching course sections:', error);
    throw error;
  }
}

// ========================================
// LESSON CONTENT
// ========================================

export async function getLessonContent(lessonId: string) {
  try {
    const [lessonResult, videosResult, notesResult, quicksResult] = await Promise.all([
      supabase
        .from('myuni_course_lessons')
        .select('id, title, duration_minutes, lesson_type')
        .eq('id', lessonId)
        .single(),
      
      supabase
        .from('myuni_videos')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true }),
      
      supabase
        .from('myuni_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true }),
      
      supabase
        .from('myuni_quicks')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true })
    ]);

    return {
      lesson: lessonResult.data,
      videos: videosResult.data || [],
      notes: notesResult.data || [],
      quicks: quicksResult.data || []
    };
  } catch (error) {
    console.error('Error fetching lesson content:', error);
    throw error;
  }
}

// ========================================
// USER ENROLLMENT
// ========================================

export async function getUserEnrollment(userId: string, courseId: string) {
  try {
    console.log('Checking user enrollment:', { userId, courseId });

    const { data, error } = await supabase
      .from('myuni_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user enrollment:', error);
    throw error;
  }
}

export async function enrollUserToCourse(userId: string, courseId: string) {
  try {
    console.log('Enrolling user to course:', { userId, courseId });

    const { data, error } = await supabase
      .from('myuni_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        progress_percentage: 0,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error enrolling user to course:', error);
    throw error;
  }
}

// ========================================
// USER PROGRESS (via authenticated APIs)
// ========================================

export async function getUserCourseProgress(userId: string, courseId: string) {
  return apiGetUserCourseProgress(userId, courseId);
}

export async function getUserLessonProgress(userId: string, lessonId: string) {
  return apiGetUserLessonProgress(userId, lessonId);
}

export async function markLessonCompleted(userId: string, lessonId: string, watchTimeSeconds?: number) {
  return apiMarkLessonCompleted(userId, lessonId, watchTimeSeconds);
}

export async function updateVideoPosition(userId: string, lessonId: string, positionSeconds: number, totalWatchTime?: number) {
  return apiUpdateVideoPosition(userId, lessonId, positionSeconds, totalWatchTime);
}

export async function getCourseCompletionStats(userId: string, courseId: string) {
  return apiGetCourseCompletionStats(userId, courseId);
}

export const saveQuizResult = async (
  userId: string,
  lessonId: string,
  quickId: string,
  score: number
) => {
  return apiSaveQuizResult(userId, lessonId, quickId, score);
};

export async function updateUserProgress(userId: string, lessonId: string, progressData: {
  watch_time_seconds?: number;
  is_completed?: boolean;
  last_position_seconds?: number;
  notes?: string;
  quiz_score?: number;
  quiz_attempts?: number;
  last_quiz_attempt_at?: string;
  video_watch_count?: number;
  last_video_watch_at?: string;
}) {
  return apiUpdateUserProgress(userId, lessonId, progressData);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateCourseFeatures(locale: string) {
  const features = {
    tr: [
      "Kapsamlı video eğitim",
      "Pratik projeler",
      "Sertifika desteği",
      "Canlı soru-cevap seansları",
      "Yaşam boyu erişim",
      "Mobil uyumlu platform"
    ],
    en: [
      "Comprehensive video training",
      "Practical projects", 
      "Certificate support",
      "Live Q&A sessions",
      "Lifetime access",
      "Mobile compatible platform"
    ]
  };

  const localeFeatures = features[locale as keyof typeof features] || features.tr;
  return localeFeatures.sort(() => 0.5 - Math.random()).slice(0, 4);
}

export function mapLevelToLocale(level: string, locale: string) {
  const levelMappings = {
    tr: {
      'Beginner': 'Başlangıç',
      'Intermediate': 'Orta Seviye', 
      'Advanced': 'İleri Seviye',
      'Expert': 'Uzman'
    },
    en: {
      'Başlangıç': 'Beginner',
      'Orta Seviye': 'Intermediate',
      'İleri Seviye': 'Advanced', 
      'Uzman': 'Expert'
    }
  };

  const mapping = levelMappings[locale as keyof typeof levelMappings];
  return mapping?.[level as keyof typeof mapping] || level;
}