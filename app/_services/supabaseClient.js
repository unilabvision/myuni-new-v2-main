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
  async getUserEnrollments(userId, activeOnly = true) {
    let query = supabase
      .from('myuni_enrollments')
      .select(`
        *,
        myuni_courses (
          id,
          title,
          slug,
          description,
          thumbnail_url,
          price,
          duration,
          level
        )
      `)
      .eq('user_id', userId);
    
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    
    const { data, error } = await query.order('enrolled_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }
    
    return data || [];
  },

  // Kullanıcının belirli bir kursa kayıtlı olup olmadığını kontrol et
  async checkEnrollment(userId, courseId) {
    const { data, error } = await supabase
      .from('myuni_enrollments')
      .select('id, progress_percentage, is_active')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking enrollment:', error);
      return null;
    }
    
    return data;
  },

  // Kullanıcıyı kursa kaydet
  async enrollUser(userId, courseId) {
    // Önce zaten kayıtlı olup olmadığını kontrol et
    const existingEnrollment = await this.checkEnrollment(userId, courseId);
    
    if (existingEnrollment) {
      return { 
        success: true, 
        data: existingEnrollment, 
        message: 'Already enrolled' 
      };
    }
    
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
    
    if (error) {
      console.error('Error enrolling user:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  // Kullanıcının kurs progress'ini güncelle
  async updateProgress(userId, courseId, progressPercentage) {
    const { data, error } = await supabase
      .from('myuni_enrollments')
      .update({ 
        progress_percentage: Math.min(100, Math.max(0, progressPercentage)),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating progress:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  },

  // İndirim kodlarını al
  async getDiscountCodes(activeOnly = true) {
    let query = supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (activeOnly) {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('valid_until', today);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching discount codes:', error);
      return [];
    }
    
    return data || [];
  },

  // İndirim kodu doğrula
  async validateDiscountCode(code, courseId = null) {
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .single();
    
    if (error) {
      console.error('Error validating discount code:', error);
      return { valid: false, error: 'Invalid discount code' };
    }
    
    // Kurs spesifik kontrol
    if (courseId && data.applicable_courses && data.applicable_courses.length > 0) {
      if (!data.applicable_courses.includes(courseId)) {
        return { valid: false, error: 'Discount code not applicable for this course' };
      }
    }
    
    return { valid: true, data };
  },

  // Kurs istatistiklerini al
  async getCourseStats() {
    // Toplam aktif kurs sayısı
    const { count: totalCourses } = await supabase
      .from('myuni_courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Toplam kayıt sayısı
    const { count: totalEnrollments } = await supabase
      .from('myuni_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Toplam öğrenci sayısı (unique users)
    const { data: uniqueStudents } = await supabase
      .from('myuni_enrollments')
      .select('user_id')
      .eq('is_active', true);
    
    const uniqueStudentCount = new Set(uniqueStudents?.map(e => e.user_id)).size;
    
    return {
      totalCourses: totalCourses || 0,
      totalEnrollments: totalEnrollments || 0,
      totalStudents: uniqueStudentCount || 0
    };
  }
};

export default supabase;