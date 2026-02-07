// lib/courseService.ts - Complete Fixed Version

import { supabase } from './supabase';

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
  myuni_course_sections: {
    course_id: string;
  };
}

// ========================================
// COURSE MANAGEMENT
// ========================================

export async function getAllCourses(locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedCourses = data?.map(course => ({
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
      featured: Math.random() > 0.7,
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
      early_bird_deadline: course.early_bird_deadline || null
    }));

    return transformedCourses || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
}

export async function getUserAnalytics(userId: string, courseId: string) {
  try {
    console.log('=== FETCHING USER ANALYTICS ===');
    console.log({ userId, courseId });

    // Get user's course progress
    const progress = await getUserCourseProgress(userId, courseId);
    
    // Get user's enrollment info
    const enrollment = await getUserEnrollment(userId, courseId);
    
    // Generate analytics data for the last 30 days
    const analytics = await generateUserAnalytics(userId, courseId);

    return {
      analytics,
      progress,
      enrollment
    };
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    throw error;
  }
}

async function generateUserAnalytics(userId: string, courseId: string) {
  try {
    // Get all lessons for the course to calculate daily analytics
    const { data: lessons, error: lessonsError } = await supabase
      .from('myuni_course_lessons')
      .select(`
        id,
        myuni_course_sections!inner(
          course_id
        )
      `)
      .eq('myuni_course_sections.course_id', courseId)
      .eq('is_active', true);

    if (lessonsError) throw lessonsError;
    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(lesson => lesson.id);

    // Get user progress data with timestamps
    const { data: progressData, error: progressError } = await supabase
      .from('myuni_user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)
      .order('updated_at', { ascending: false });

    if (progressError) throw progressError;

    // Generate daily analytics for the last 30 days
    const analytics = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Find progress updates for this day
      const dayProgress = progressData?.filter(p => {
        const progressDate = new Date(p.updated_at || p.created_at).toISOString().split('T')[0];
        return progressDate === dateString;
      }) || [];

      // Calculate daily metrics
      const totalWatchTimeMinutes = dayProgress.reduce((acc, p) => 
        acc + Math.floor((p.watch_time_seconds || 0) / 60), 0
      );
      
      const lessonsCompleted = dayProgress.filter(p => 
        p.is_completed && p.completed_at && 
        new Date(p.completed_at).toISOString().split('T')[0] === dateString
      ).length;

      const videosWatched = dayProgress.filter(p => 
        p.watch_time_seconds && p.watch_time_seconds > 0
      ).length;

      const quizzesAttempted = dayProgress.filter(p => 
        p.quiz_attempts && p.quiz_attempts > 0 &&
        p.last_quiz_attempt_at &&
        new Date(p.last_quiz_attempt_at).toISOString().split('T')[0] === dateString
      ).length;

      const quizzesPassed = dayProgress.filter(p => 
        p.quiz_score && p.quiz_score >= 70 && // Assuming 70 is passing score
        p.last_quiz_attempt_at &&
        new Date(p.last_quiz_attempt_at).toISOString().split('T')[0] === dateString
      ).length;

      const notesCreated = dayProgress.filter(p => 
        p.notes && p.notes.trim().length > 0
      ).length;

      analytics.push({
        session_date: dateString,
        user_id: userId,
        course_id: courseId,
        total_watch_time_minutes: totalWatchTimeMinutes,
        lessons_completed: lessonsCompleted,
        videos_watched: videosWatched,
        quizzes_attempted: quizzesAttempted,
        quizzes_passed: quizzesPassed,
        quizzes_failed: quizzesAttempted - quizzesPassed,
        quiz_time_minutes: Math.floor(totalWatchTimeMinutes * 0.2), // Estimate
        notes_created: notesCreated,
        session_count: dayProgress.length > 0 ? 1 : 0,
        avg_quiz_score: dayProgress.length > 0 
          ? dayProgress.reduce((acc, p) => acc + (p.quiz_score || 0), 0) / dayProgress.length 
          : 0
      });
    }

    return analytics.filter(a => a.session_count > 0); // Only return days with activity
  } catch (error) {
    console.error('Error generating user analytics:', error);
    return [];
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

export async function getLatestQuizResult(userId: string, quickId: string) {
  try {
    console.log('=== FETCHING LATEST QUIZ RESULT ===');
    console.log({ userId, quickId });

    // Fetch the lesson_id associated with the quickId
    const { data: quickData, error: quickError } = await supabase
      .from('myuni_quicks')
      .select('lesson_id')
      .eq('id', quickId)
      .single();

    if (quickError) throw quickError;
    if (!quickData?.lesson_id) throw new Error('Lesson not found for the given quick ID');

    // Fetch the latest progress entry for the user and lesson
    const { data, error } = await supabase
      .from('myuni_user_progress')
      .select('quiz_score, quiz_attempts, last_quiz_attempt_at, is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', quickData.lesson_id)
      .order('last_quiz_attempt_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return null; // No quiz result found
    }

    return {
      score: data.quiz_score || 0,
      attempts: data.quiz_attempts || 0,
      lastAttemptAt: data.last_quiz_attempt_at,
      isPassed: data.is_completed || false,
    };
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
      featured: Math.random() > 0.7,
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
          is_active
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
        .filter((lesson: any) => lesson.is_active)
        .sort((a: any, b: any) => a.order_index - b.order_index)
        .map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          lesson_type: lesson.lesson_type,
          duration_minutes: lesson.duration_minutes,
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
        lessons:myuni_course_lessons(*)
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
          duration: lesson.duration_minutes ? `${lesson.duration_minutes} dk` : '0 dk',
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
// USER PROGRESS
// ========================================

export async function getUserCourseProgress(userId: string, courseId: string) {
  try {
    console.log('=== FETCHING USER COURSE PROGRESS ===');
    console.log('userId:', userId, 'courseId:', courseId);

    const { data: lessons, error: lessonsError } = await supabase
      .from('myuni_course_lessons')
      .select(`
        id,
        title,
        lesson_type,
        duration_minutes,
        order_index,
        section_id,
        myuni_course_sections!inner(
          course_id
        )
      `)
      .eq('myuni_course_sections.course_id', courseId)
      .eq('is_active', true);

    if (lessonsError) throw lessonsError;
    if (!lessons || lessons.length === 0) return [];

    const lessonIds = lessons.map(lesson => lesson.id);

    const { data: progressData, error: progressError } = await supabase
      .from('myuni_user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);

    if (progressError) throw progressError;

    const progressMap = new Map(progressData?.map(p => [p.lesson_id, p]) || []);

    const result = lessons.map(lesson => {
      const progress = progressMap.get(lesson.id);
      return {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        lesson_type: lesson.lesson_type,
        duration_minutes: lesson.duration_minutes,
        order_index: lesson.order_index,
        section_id: lesson.section_id,
        is_completed: progress?.is_completed || false,
        watch_time_seconds: progress?.watch_time_seconds || 0,
        last_position_seconds: progress?.last_position_seconds || 0,
        completed_at: progress?.completed_at,
        notes: progress?.notes || '',
        quiz_score: progress?.quiz_score || null,
        progress_created_at: progress?.created_at,
        progress_updated_at: progress?.updated_at
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching user course progress:', error);
    throw error;
  }
}

export async function getUserLessonProgress(userId: string, lessonId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data || {
      user_id: userId,
      lesson_id: lessonId,
      watch_time_seconds: 0,
      is_completed: false,
      last_position_seconds: 0,
      notes: '',
      quiz_score: null
    };
  } catch (error) {
    console.error('Error fetching user lesson progress:', error);
    throw error;
  }
}

export async function markLessonCompleted(userId: string, lessonId: string, watchTimeSeconds?: number) {
  try {
    const progressData: Record<string, unknown> = { is_completed: true };
    if (watchTimeSeconds !== undefined) {
      progressData.watch_time_seconds = watchTimeSeconds;
    }
    return await updateUserProgress(userId, lessonId, progressData);
  } catch (error) {
    console.error('Error marking lesson completed:', error);
    throw error;
  }
}

export async function updateVideoPosition(userId: string, lessonId: string, positionSeconds: number, totalWatchTime?: number) {
  try {
    const progressData: Record<string, unknown> = { last_position_seconds: positionSeconds };
    if (totalWatchTime !== undefined) {
      progressData.watch_time_seconds = totalWatchTime;
    }
    return await updateUserProgress(userId, lessonId, progressData);
  } catch (error) {
    console.error('Error updating video position:', error);
    throw error;
  }
}

export async function getCourseCompletionStats(userId: string, courseId: string) {
  try {
    const progressData = await getUserCourseProgress(userId, courseId);
    
    const totalLessons = progressData.length;
    const completedLessons = progressData.filter(p => p.is_completed).length;
    const totalWatchTime = progressData.reduce((acc, p) => acc + (p.watch_time_seconds || 0), 0);
    
    // ✅ Progress hesaplamasını düzelttik - Math.min ile maksimum %100 garantisi
    const completionPercentage = totalLessons > 0 ? 
      Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    return {
      totalLessons,
      completedLessons,
      completionPercentage,
      totalWatchTimeSeconds: totalWatchTime,
      totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
      lastActiveDate: progressData.length > 0 ? 
        Math.max(...progressData.map(p => p.progress_updated_at ? new Date(p.progress_updated_at).getTime() : 0)) : null
    };
  } catch (error) {
    console.error('Error getting course completion stats:', error);
    throw error;
  }
}

export const saveQuizResult = async (
  userId: string,
  lessonId: string,
  quickId: string,
  score: number
) => {
  try {
    console.log('=== SAVING QUIZ RESULT ===');
    console.log({ userId, lessonId, quickId, score });

    // Adım 1: Quiz yapılandırmasını al
    const { data: quickData, error: quickError } = await supabase
      .from('myuni_quicks')
      .select('config, lesson_id')
      .eq('id', quickId)
      .single();

    if (quickError) throw quickError;

    const configData = quickData?.config as Record<string, unknown> || {};
    const passingScore = (configData.passing_score as number) || 70;
    const isPassed = score >= passingScore;

    // Adım 2: Mevcut ilerlemeyi kontrol et
    const { data: currentProgress, error: progressError } = await supabase
      .from('myuni_user_progress')
      .select('quiz_attempts, quiz_score, is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();

    // Hata PGRST116 (sonuç bulunamadı) değilse gerçek bir hatadır
    if (progressError && progressError.code !== 'PGRST116') throw progressError;

    const currentAttempts = currentProgress?.quiz_attempts || 0;
    const newAttempts = currentAttempts + 1;
    const wasCompletedBefore = currentProgress?.is_completed || false;

    // Şu durumlarda skoru güncelle:
    // 1. Daha önce hiç quiz skoru yoksa
    // 2. Yeni skor daha yüksekse
    // 3. Bu denemede geçtiyse
    const shouldUpdateScore = !currentProgress?.quiz_score || 
                             score > currentProgress.quiz_score || 
                             isPassed;

    // Adım 3: İlerlemeyi güncelle
    console.log('Updating user progress with:', {
      is_completed: isPassed,
      quiz_score: shouldUpdateScore ? score : currentProgress?.quiz_score,
      quiz_attempts: newAttempts
    });

    const progressData = await updateUserProgress(userId, lessonId, {
      is_completed: isPassed,
      quiz_score: shouldUpdateScore ? score : currentProgress?.quiz_score,
      quiz_attempts: newAttempts,
      last_quiz_attempt_at: new Date().toISOString()
    });

    // Eğer kurs bölümünde çoklu içerik varsa, onları da kontrol et
    // Bu içeriklerin hepsinin tamamlanıp tamamlanmadığını kontrol etmek için
    // Şu an bunu yapmıyoruz, gerekirse ileride eklenir

    console.log('Quiz result saved successfully', {
      attempts: newAttempts,
      score: shouldUpdateScore ? score : currentProgress?.quiz_score,
      passed: isPassed,
      wasCompletedBefore
    });

    return { 
      success: true, 
      progressData,
      isPassed,
      passingScore,
      attempts: newAttempts,
      isNewBestScore: shouldUpdateScore && score > (currentProgress?.quiz_score || 0),
      wasCompletedBefore
    };
  } catch (error) {
    console.error('saveQuizResult error:', error);
    throw error;
  }
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
  try {
    console.log('=== UPDATING USER PROGRESS ===');
    console.log('userId:', userId, 'lessonId:', lessonId);
    console.log('progressData:', progressData);

    const updateData: Record<string, unknown> = {
      user_id: userId,
      lesson_id: lessonId,
      updated_at: new Date().toISOString()
    };

    if (progressData.watch_time_seconds !== undefined) {
      updateData.watch_time_seconds = progressData.watch_time_seconds;
    }
    if (progressData.is_completed !== undefined) {
      updateData.is_completed = progressData.is_completed;
      
      // Eğer is_completed true olarak ayarlandıysa ve completed_at daha önce ayarlanmadıysa,
      // şimdi ayarla
      if (progressData.is_completed === true) {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (progressData.last_position_seconds !== undefined) {
      updateData.last_position_seconds = progressData.last_position_seconds;
    }
    if (progressData.notes !== undefined) {
      updateData.notes = progressData.notes;
    }
    if (progressData.quiz_score !== undefined) {
      updateData.quiz_score = progressData.quiz_score;
    }
    if (progressData.quiz_attempts !== undefined) {
      updateData.quiz_attempts = progressData.quiz_attempts;
    }
    if (progressData.last_quiz_attempt_at !== undefined) {
      updateData.last_quiz_attempt_at = progressData.last_quiz_attempt_at;
    }
    if (progressData.video_watch_count !== undefined) {
      updateData.video_watch_count = progressData.video_watch_count;
    }
    if (progressData.last_video_watch_at !== undefined) {
      updateData.last_video_watch_at = progressData.last_video_watch_at;
    }

    // Daha önce veritabanında kayıt var mı kontrol et
    const { data: existingRecord } = await supabase
      .from('myuni_user_progress')
      .select('completed_at, is_completed')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    // Eğer kayıt varsa ve daha önce tamamlanmışsa, completed_at'i koruyalım
    if (existingRecord && existingRecord.is_completed && existingRecord.completed_at) {
      console.log('Existing record already completed at:', existingRecord.completed_at);
      // Sadece ilk kez tamamlandığında completed_at'i güncelle
      if (updateData.is_completed === true && !updateData.completed_at) {
        updateData.completed_at = existingRecord.completed_at;
      }
    }

    console.log('Final update data:', updateData);

    const { data, error } = await supabase
      .from('myuni_user_progress')
      .upsert(updateData, {
        onConflict: 'user_id,lesson_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
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