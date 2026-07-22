// app/_services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Supabase bağlantısı için gerekli bilgiler
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

// Supabase istemcisi
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database helper functions
export const dbHelpers = {
  // Kurs bilgilerini al
  async getCourse(courseId) {
    const { data, error } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('id', courseId)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching course:', error);
      return null;
    }
    
    return data;
  },

  // YENİ: Kurs bilgilerini objectives ve requirements ile birlikte al
  async getCourseWithDetails(courseSlug) {
    const { data: courseData, error } = await supabase
      .from('myuni_courses')
      .select(`
        id,
        slug,
        title,
        description,
        instructor_name,
        instructor_description,
        instructor_email,
        instructor_linkedin,
        duration,
        level,
        price,
        original_price,
        is_active,
        created_at,
        updated_at,
        myuni_course_objectives (
          id,
          objective_text,
          order_index
        ),
        myuni_course_requirements (
          id,
          requirement_text,
          order_index
        )
      `)
      .eq('slug', courseSlug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching course with details:', error);
      return null;
    }

    return courseData;
  },

  // YENİ: Supabase verisini React component formatına dönüştürme
  transformCourseData(supabaseData) {
    if (!supabaseData) return null;

    return {
      name: supabaseData.title,
      rating: 4.8, // Bu veriyi enrollment/review tablosundan çekebilirsiniz
      students: 1247, // Bu veriyi enrollment sayısından çekebilirsiniz
      duration: supabaseData.duration,
      level: supabaseData.level,
      description: supabaseData.description,
      instructor: {
        name: supabaseData.instructor_name,
        title: "Eğitmen", // Eğer instructor_title sütunu varsa onu kullanın
        bio: supabaseData.instructor_description,
        linkedin: supabaseData.instructor_linkedin,
        email: supabaseData.instructor_email
      },
      // Objectives'leri order_index'e göre sırala
      objectives: supabaseData.myuni_course_objectives
        ?.sort((a, b) => a.order_index - b.order_index) || [],
      // Requirements'ları order_index'e göre sırala  
      requirements: supabaseData.myuni_course_requirements
        ?.sort((a, b) => a.order_index - b.order_index) || []
    };
  },

  // YENİ: Slug ile kurs detaylarını al ve dönüştür (tek fonksiyon)
  async getCourseForComponent(courseSlug) {
    const supabaseData = await this.getCourseWithDetails(courseSlug);
    return this.transformCourseData(supabaseData);
  },

  // Tüm aktif kursları al
  async getAllCourses(limit = null) {
    let query = supabase
      .from('myuni_courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
    
    return data || [];
  },

  // Slug ile kurs al (eski versiyon - geriye uyumluluk için)
  async getCourseBySlug(slug) {
    const { data, error } = await supabase
      .from('myuni_courses')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (error) {
      console.error('Error fetching course by slug:', error);
      return null;
    }
    
    return data;
  },

  // Kullanıcının kayıtlı olduğu kursları al
  // DEPRECATED: use GET /api/enrollments/me
  async getUserEnrollments(_userId, _activeOnly = true) {
    console.warn('[supabaseClient.getUserEnrollments] Deprecated: use /api/enrollments/me');
    return [];
  },

  // Kullanıcının belirli bir kursa kayıtlı olup olmadığını kontrol et
  // DEPRECATED: use GET /api/enrollments/me?courseId=
  async checkEnrollment(_userId, _courseId) {
    console.warn('[supabaseClient.checkEnrollment] Deprecated: use /api/enrollments/me');
    return null;
  },

  // Kullanıcıyı kursa kaydet
  // DEPRECATED: use POST /api/enrollments
  async enrollUser(_userId, _courseId) {
    console.warn('[supabaseClient.enrollUser] Deprecated: use POST /api/enrollments');
    return { success: false, error: 'Use /api/enrollments' };
  },

  // Kullanıcının kurs progress'ini güncelle
  // DEPRECATED: use PATCH /api/enrollments
  async updateProgress(_userId, _courseId, _progressPercentage) {
    console.warn('[supabaseClient.updateProgress] Deprecated: use PATCH /api/enrollments');
    return { success: false, error: 'Use /api/enrollments' };
  },

  // İndirim kodlarını al
  // DEPRECATED: discount_codes is locked behind RLS. Use POST /api/discount-codes/validate
  // or GET /api/discount-codes/mine / GET /api/campaigns instead of anon client access.
  async getDiscountCodes(_activeOnly = true) {
    console.warn(
      '[supabaseClient.getDiscountCodes] Deprecated: do not query discount_codes with anon key. Use /api/discount-codes/*'
    );
    return [];
  },

  // İndirim kodu doğrula
  // DEPRECATED: use POST /api/discount-codes/validate
  async validateDiscountCode(_code, _courseId = null) {
    console.warn(
      '[supabaseClient.validateDiscountCode] Deprecated: use POST /api/discount-codes/validate'
    );
    return { valid: false, error: 'Use /api/discount-codes/validate' };
  },

  // Kurs istatistiklerini al
  // DEPRECATED under RLS: enrollment aggregates must go through server APIs
  async getCourseStats() {
    console.warn('[supabaseClient.getCourseStats] enrollment counts locked; returning course count only');
    const { count: totalCourses } = await supabase
      .from('myuni_courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    return {
      totalCourses: totalCourses || 0,
      totalEnrollments: 0,
      totalStudents: 0,
    };
  }
};

export default supabase;