// lib/enrollmentService.ts
import { supabase } from './supabase';

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  is_active: boolean;
  welcome_shown?: boolean;  // Yeni alan
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  instructor_name?: string;
  duration?: string;
  level?: string;
  is_active: boolean;
}

export interface UserEnrollmentWithCourse {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  is_active: boolean;
  welcome_shown?: boolean;  // Yeni alan
  course: Course;
}

export interface EnrollmentResult {
  success: boolean;
  message: string;
  enrollment?: Enrollment;
  requiresAuth?: boolean;
  error?: unknown;
}

interface EnrollmentStatus {
  isEnrolled: boolean;
  welcomeShown: boolean;
  enrollmentId?: string;
}

// Kullanıcının kursa kayıtlı olup olmadığını ve welcome'u görup görmediğini kontrol et
export async function checkUserEnrollmentStatus(userId: string, courseId: string): Promise<EnrollmentStatus> {
  try {
    console.log('Checking enrollment status for:', { userId, courseId });
    
    const { data, error } = await supabase
      .from('myuni_enrollments')
      .select('id, welcome_shown, is_active')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No enrollment found
        console.log('No enrollment found');
        return { 
          isEnrolled: false, 
          welcomeShown: false 
        };
      }
      throw error;
    }

    console.log('Enrollment status found:', data);
    return {
      isEnrolled: true,
      welcomeShown: data.welcome_shown || false,
      enrollmentId: data.id
    };

  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return { 
      isEnrolled: false, 
      welcomeShown: false 
    };
  }
}

// Welcome'u gösterildi olarak işaretle
export async function markWelcomeAsShown(userId: string, courseId: string): Promise<boolean> {
  try {
    console.log('Marking welcome as shown for:', { userId, courseId });
    
    const { error } = await supabase
      .from('myuni_enrollments')
      .update({ welcome_shown: true })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true);

    if (error) {
      console.error('Error marking welcome as shown:', error);
      return false;
    }

    console.log('Welcome marked as shown successfully');
    return true;

  } catch (error) {
    console.error('Error marking welcome as shown:', error);
    return false;
  }
}

// Mevcut checkUserEnrollment fonksiyonu (geriye dönük uyumluluk için)
export async function checkUserEnrollment(userId: string, courseId: string): Promise<boolean> {
  const status = await checkUserEnrollmentStatus(userId, courseId);
  return status.isEnrolled;
}

export async function enrollUserInCourse(userId: string, courseId: string): Promise<EnrollmentResult> {
  try {
    console.log('Enrolling user:', { userId, courseId });

    // Validate inputs
    if (!userId || !courseId) {
      return {
        success: false,
        message: 'Missing user ID or course ID',
        error: 'MISSING_PARAMS'
      };
    }

    // Check if user is already enrolled using new function
    console.log('Checking existing enrollment...');
    const enrollmentStatus = await checkUserEnrollmentStatus(userId, courseId);
    
    if (enrollmentStatus.isEnrolled) {
      console.log('User already enrolled');
      return {
        success: true,
        message: 'Already enrolled'
      };
    }

    // Verify course exists
    console.log('Verifying course exists...');
    const { data: course, error: courseError } = await supabase
      .from('myuni_courses')
      .select('id, slug, title')
      .eq('id', courseId)
      .eq('is_active', true)
      .single();

    if (courseError || !course) {
      console.error('Course verification error:', courseError);
      return {
        success: false,
        message: 'Course not found or inactive',
        error: courseError
      };
    }

    console.log('Course found:', course);

    // Create new enrollment with welcome_shown = false
    console.log('Creating new enrollment...');
    const enrollmentData = {
      user_id: userId,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      progress_percentage: 0,
      is_active: true,
      welcome_shown: false  // Yeni kayıt için welcome henüz gösterilmedi
    };

    console.log('Enrollment data:', enrollmentData);

    const { data: enrollment, error: enrollError } = await supabase
      .from('myuni_enrollments')
      .insert(enrollmentData)
      .select('*')
      .single();

    console.log('Insert result:', { enrollment, enrollError });

    if (enrollError) {
      console.error('Enrollment insert error:', enrollError);
      return {
        success: false,
        message: 'Failed to create enrollment',
        error: enrollError
      };
    }

    console.log('Successfully enrolled user');
    return {
      success: true,
      message: 'Successfully enrolled',
      enrollment: enrollment as Enrollment
    };

  } catch (error) {
    console.error('Unexpected error enrolling user:', error);
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: error
    };
  }
}

// Kullanıcının kurs ilerlemesini güncelle
export async function updateCourseProgress(
  userId: string, 
  courseId: string, 
  progressPercentage: number
): Promise<boolean> {
  try {
    console.log('Updating course progress:', { userId, courseId, progressPercentage });
    
    const { error } = await supabase
      .from('myuni_enrollments')
      .update({ 
        progress_percentage: Math.min(100, Math.max(0, progressPercentage))
      })
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true);

    if (error) {
      console.error('Error updating course progress:', error);
      return false;
    }

    console.log('Course progress updated successfully');
    return true;

  } catch (error) {
    console.error('Error updating course progress:', error);
    return false;
  }
}

// Kullanıcının tüm kurslarını getir
export async function getUserEnrollments(userId: string): Promise<UserEnrollmentWithCourse[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('myuni_enrollments')
      .select(`
        *,
        course:myuni_courses(*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }

    return (data as UserEnrollmentWithCourse[]) || [];
  } catch (error) {
    console.error('Unexpected error fetching enrollments:', error);
    return [];
  }
}

// Kullanıcının pakete sahip olup olmadığını kontrol et
export async function checkUserPackageEnrollment(userId: string, packageId: string): Promise<boolean> {
  try {
    if (!userId || !packageId) return false;

    const { data, error } = await supabase
      .from('myuni_package_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error checking package enrollment:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Unexpected error checking package enrollment:', error);
    return false;
  }
}

// Kullanıcıyı pakete kaydet
export async function enrollUserInPackage(userId: string, packageId: string, orderId?: string): Promise<boolean> {
  try {
    if (!userId || !packageId) return false;

    // Önce zaten kayıtlı mı kontrol et
    const alreadyEnrolled = await checkUserPackageEnrollment(userId, packageId);
    if (alreadyEnrolled) return true;

    const { error } = await supabase
      .from('myuni_package_enrollments')
      .insert({
        user_id: userId,
        package_id: packageId,
        order_id: orderId || null,
        is_active: true
      });

    if (error) {
      console.error('Error enrolling user in package:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error enrolling user in package:', error);
    return false;
  }
}