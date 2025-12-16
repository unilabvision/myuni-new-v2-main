// lib/certificateService.ts - Updated with separate Event Certificates table

import supabase from '../app/_services/supabaseClient';

export interface CertificateData {
  userId: string;
  itemId: string; // courseId veya eventId
  itemType: 'course' | 'event';
  itemName: string; // courseName veya eventName
  instructorName: string; // instructor veya organizer
  duration: string;
  organization: string;
  organizationDescription: string;
  instructorBio: string;
  userFullName?: string;
}

export interface CourseCertificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id: string;
  student_full_name: string;
  course_name: string;
  instructor_name: string;
  course_duration: string;
  organization_name: string;
  organization_description: string;
  instructor_bio: string;
  certificate_url: string;
  certificate_metadata: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCertificate {
  id: string;
  certificate_number: string;
  user_id: string;
  event_id: string;
  student_full_name: string;
  event_name: string;
  organizer_name: string;
  event_duration: string;
  organization_name: string;
  organization_description: string;
  organizer_bio: string;
  certificate_url: string;
  certificate_metadata: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EligibilityCheck {
  isEligible: boolean;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  averageQuizScore: number;
  missingRequirements: string[];
  existingCertificate?: CourseCertificate | EventCertificate;
  hasException?: boolean;
  completionPercentage?: number;
}

interface LessonData {
  id: string;
  lesson_type: string;
  is_active: boolean;
}

interface ProgressData {
  lesson_id?: string; // Course için
  section_id?: string; // Event için
  is_completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number | null;
}

/**
 * Benzersiz sertifika numarası oluşturur
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomNum1 = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  const randomNum2 = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  const randomStr1 = Math.random().toString(36).substring(2, 5).toUpperCase();
  const randomStr2 = Math.random().toString(36).substring(2, 7).toUpperCase();
  
  return `MUNI${year}-${randomNum1}-${randomNum2}-${randomStr1}-${randomStr2}`;
}

/**
 * Kullanıcının tam adını al
 */
async function getUserFullName(): Promise<string> {
  try {
    return 'Öğrenci';
  } catch {
    return 'Kullanıcı';
  }
}

/**
 * Kullanıcının sertifika istisnası var mı kontrol eder
 */
async function checkCertificateException(userId: string, itemId: string, itemType: 'course' | 'event'): Promise<boolean> {
  try {
    console.log('🔍 İstisna kontrolü yapılıyor:', { userId, itemId, itemType });
    
    const { data, error } = await supabase
      .from('myuni_certificate_exceptions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', itemId) // item_id yerine course_id kullanıyoruz
      .eq('is_active', true);

    console.log('📊 İstisna sorgu sonucu:', { data, error });

    const hasException = !error && data && data.length > 0;
    
    if (hasException) {
      console.log('🎯 Sertifika istisnası bulundu:', { userId, itemId, itemType, exception: data[0] });
    } else {
      console.log('❌ Sertifika istisnası bulunamadı:', { userId, itemId, itemType });
    }
    
    return hasException;
  } catch (catchError) {
    console.error('💥 İstisna kontrol hatası:', catchError);
    return false;
  }
}

/**
 * Event progress verilerini al
 */
async function getEventProgress(userId: string, eventId: string): Promise<{ 
  completedSections: number; 
  totalSections: number; 
  completionPercentage: number 
}> {
  try {
    console.log('📊 Event progress alınıyor:', { userId, eventId });

    // Event sections'ları al
    const { data: sections, error: sectionsError } = await supabase
      .from('myuni_event_sections')
      .select('id')
      .eq('event_id', eventId)
      .eq('is_active', true);

    if (sectionsError || !sections) {
      console.error('❌ Event sections alınamadı:', sectionsError);
      return { completedSections: 0, totalSections: 0, completionPercentage: 0 };
    }

    const totalSections = sections.length;
    
    if (totalSections === 0) {
      console.log('⚠️ Event\'te hiç section yok');
      return { completedSections: 0, totalSections: 0, completionPercentage: 0 };
    }

    const sectionIds = sections.map(s => s.id);

    // User progress'i al
    const { data: progressData, error: progressError } = await supabase
      .from('myuni_event_user_progress')
      .select('section_id, is_completed')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .in('section_id', sectionIds);

    if (progressError) {
      console.error('❌ Event progress alınamadı:', progressError);
      return { completedSections: 0, totalSections, completionPercentage: 0 };
    }

    const completedSections = progressData?.filter(p => p.is_completed).length || 0;
    const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

    console.log('✅ Event progress hesaplandı:', {
      completedSections,
      totalSections,
      completionPercentage
    });

    return { completedSections, totalSections, completionPercentage };

  } catch (error) {
    console.error('❌ Event progress hesaplama hatası:', error);
    return { completedSections: 0, totalSections: 0, completionPercentage: 0 };
  }
}

/**
 * Kullanıcının sertifika uygunluğunu kontrol eder (kurs için)
 */
export async function checkCertificateEligibility(userId: string, courseId: string): Promise<EligibilityCheck> {
  return checkItemCertificateEligibility(userId, courseId, 'course');
}

/**
 * Kullanıcının sertifika uygunluğunu kontrol eder (etkinlik için)
 */
export async function checkEventCertificateEligibility(userId: string, eventId: string): Promise<EligibilityCheck> {
  try {
    console.log('🎯 Event sertifika uygunluğu kontrol ediliyor:', { userId, eventId });

    // Önce istisna kontrolü yap
    const hasException = await checkCertificateException(userId, eventId, 'event');
    
    if (hasException) {
      console.log('✅ Event için sertifika istisnası bulundu, direkt uygun');
      
      // Mevcut sertifika var mı kontrol et
      try {
        const { data: existingCert, error: certError } = await supabase
          .from('myuni_event_certificates')
          .select('*')
          .eq('user_id', userId)
          .eq('event_id', eventId)
          .eq('is_active', true)
          .single();

        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 0,
          totalQuizzes: 0,
          averageQuizScore: 0,
          missingRequirements: [],
          existingCertificate: !certError && existingCert ? existingCert : undefined,
          hasException: true,
          completionPercentage: 100
        };
      } catch {
        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 0,
          totalQuizzes: 0,
          averageQuizScore: 0,
          missingRequirements: [],
          hasException: true,
          completionPercentage: 100
        };
      }
    }

    // Mevcut sertifika kontrolü
    try {
      const { data: existingCert, error: certError } = await supabase
        .from('myuni_event_certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('is_active', true)
        .single();

      if (!certError && existingCert) {
        console.log('✅ Event için mevcut sertifika bulundu');
        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 0,
          totalQuizzes: 0,
          averageQuizScore: 0,
          missingRequirements: [],
          existingCertificate: existingCert,
          hasException: false,
          completionPercentage: 100
        };
      }
    } catch {
      // Ignore certificate check errors
    }

    // Event progress'i al
    const progress = await getEventProgress(userId, eventId);
    
    // Event'ler için %70+ tamamlama oranı yeterli
    const isEligible = progress.completionPercentage >= 70;
    const missingRequirements: string[] = [];

    if (!isEligible) {
      const remainingPercentage = 70 - progress.completionPercentage;
      missingRequirements.push(`Etkinlik tamamlama oranı %70'e ulaşmalı (mevcut: %${progress.completionPercentage}, kalan: %${remainingPercentage})`);
    }

    console.log('📊 Event sertifika uygunluk sonucu:', {
      isEligible,
      completionPercentage: progress.completionPercentage,
      completedSections: progress.completedSections,
      totalSections: progress.totalSections,
      missingRequirements
    });

    return {
      isEligible,
      completedLessons: progress.completedSections,
      totalLessons: progress.totalSections,
      completedQuizzes: 0,
      totalQuizzes: 0,
      averageQuizScore: 0,
      missingRequirements,
      hasException: false,
      completionPercentage: progress.completionPercentage
    };

  } catch (error) {
    console.error('❌ Event sertifika uygunluk kontrolü hatası:', error);
    return {
      isEligible: false,
      completedLessons: 0,
      totalLessons: 0,
      completedQuizzes: 0,
      totalQuizzes: 0,
      averageQuizScore: 0,
      missingRequirements: ['Sistem hatası - lütfen daha sonra tekrar deneyin'],
      hasException: false,
      completionPercentage: 0
    };
  }
}

/**
 * Kullanıcının sertifika uygunluğunu kontrol eder (kurs için - detaylı kontroller)
 */
async function checkItemCertificateEligibility(userId: string, itemId: string, itemType: 'course' | 'event'): Promise<EligibilityCheck> {
  try {
    // Event'ler için özel fonksiyonu kullan
    if (itemType === 'event') {
      return checkEventCertificateEligibility(userId, itemId);
    }

    // Önce istisna kontrolü yap
    const hasException = await checkCertificateException(userId, itemId, itemType);
    
    if (hasException) {
      console.log('🎯 Kullanıcı için sertifika istisnası bulundu, direkt uygun');
      
      // Mevcut sertifika var mı kontrol et
      try {
        const { data: existingCert, error: certError } = await supabase
          .from('myuni_certificates')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', itemId)
          .eq('is_active', true)
          .single();

        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 1,
          totalQuizzes: 1,
          averageQuizScore: 100,
          missingRequirements: [],
          existingCertificate: !certError && existingCert ? existingCert : undefined,
          hasException: true
        };
      } catch {
        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 1,
          totalQuizzes: 1,
          averageQuizScore: 100,
          missingRequirements: [],
          hasException: true
        };
      }
    }

    // Mevcut sertifika kontrolü
    try {
      const { data: existingCert, error: certError } = await supabase
        .from('myuni_certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', itemId)
        .eq('is_active', true)
        .single();

      if (!certError && existingCert) {
        return {
          isEligible: true,
          completedLessons: 1,
          totalLessons: 1,
          completedQuizzes: 1,
          totalQuizzes: 1,
          averageQuizScore: 100,
          missingRequirements: [],
          existingCertificate: existingCert,
          hasException: false
        };
      }
    } catch {
      // Ignore certificate check errors
    }

    // Kurs derslerini ve kullanıcı ilerlemesini al
    try {
      // Kurs derslerini al
      const { data: lessons, error: lessonsError } = await supabase
        .from('myuni_course_lessons')
        .select(`
          id,
          title,
          lesson_type,
          section_id,
          myuni_course_sections!inner(
            course_id
          )
        `)
        .eq('myuni_course_sections.course_id', itemId)
        .eq('is_active', true);

      if (lessonsError || !lessons || lessons.length === 0) {
        return {
          isEligible: false,
          completedLessons: 0,
          totalLessons: 0,
          completedQuizzes: 0,
          totalQuizzes: 0,
          averageQuizScore: 0,
          missingRequirements: ['Kurs dersleri bulunamadı veya aktif değil'],
          hasException: false
        };
      }

      // Kullanıcı ilerlemesini al
      const { data: progressData, error: progressError } = await supabase
        .from('myuni_user_progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessons.map(l => l.id));

      if (progressError) {
        return {
          isEligible: false,
          completedLessons: 0,
          totalLessons: lessons.length,
          completedQuizzes: 0,
          totalQuizzes: 0,
          averageQuizScore: 0,
          missingRequirements: ['Kullanıcı ilerleme verileri alınamadı'],
          hasException: false
        };
      }

      // İlerleme verilerini analiz et
      const totalLessons = lessons.length;
      const completedLessons = progressData?.filter(p => p.is_completed).length || 0;
      const completionPercentage = totalLessons > 0 ? 
        Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

      // Quiz dersleri ve skorları
      const quizLessons = lessons.filter(l => l.lesson_type === 'quick' || l.lesson_type === 'quiz');
      const totalQuizzes = quizLessons.length;
      
      const quizProgress = progressData?.filter(p => 
        quizLessons.some(l => l.id === p.lesson_id)
      ) || [];
      
      const completedQuizzes = quizProgress.filter(p => p.is_completed).length;
      const quizScores = quizProgress.map(p => p.quiz_score || 0).filter(score => score > 0);
      const averageQuizScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) 
        : 0;

      // Sertifika almaya uygun mu kontrol et
      const isEligible = completionPercentage >= 100;
      const missingRequirements: string[] = [];

      if (completionPercentage < 100) {
        const remainingLessons = totalLessons - completedLessons;
        missingRequirements.push(`Tüm dersler tamamlanmalı (${completedLessons}/${totalLessons} tamamlandı, ${remainingLessons} ders kaldı)`);
      }

      console.log('📊 Kurs sertifika uygunluk sonucu:', {
        isEligible,
        completedLessons,
        totalLessons,
        completionPercentage,
        completedQuizzes,
        totalQuizzes,
        averageQuizScore,
        missingRequirements
      });

      return {
        isEligible,
        completedLessons,
        totalLessons,
        completedQuizzes,
        totalQuizzes,
        averageQuizScore,
        missingRequirements,
        hasException: false,
        completionPercentage
      };
    } catch (error) {
      console.error('❌ Kurs ilerleme kontrolü hatası:', error);
      return {
        isEligible: false,
        completedLessons: 0,
        totalLessons: 0,
        completedQuizzes: 0,
        totalQuizzes: 0,
        averageQuizScore: 0,
        missingRequirements: ['Kurs ilerleme kontrolü sırasında bir hata oluştu'],
        hasException: false
      };
    }

  } catch {
    return {
      isEligible: false,
      completedLessons: 0,
      totalLessons: 0,
      completedQuizzes: 0,
      totalQuizzes: 0,
      averageQuizScore: 0,
      missingRequirements: ['Sistem hatası - lütfen daha sonra tekrar deneyin'],
      hasException: false
    };
  }
}

/**
 * Sertifika oluşturma (genel - kurs/etkinlik)
 */
export async function generateCertificate(data: CertificateData, forceGenerate: boolean = false) {
  try {
    // İstisna kontrolü
    const hasException = await checkCertificateException(data.userId, data.itemId, data.itemType);
    
    if (hasException) {
      console.log('🎯 İstisna nedeniyle sertifika oluşturuluyor');
    } else if (!forceGenerate) {
      // Normal kontroller
      const eligibility = data.itemType === 'event' 
        ? await checkEventCertificateEligibility(data.userId, data.itemId)
        : await checkItemCertificateEligibility(data.userId, data.itemId, data.itemType);
        
      if (!eligibility.isEligible) {
        throw new Error('Sertifika almak için gerekli koşullar tamamlanmamış: ' + eligibility.missingRequirements.join(', '));
      }
    }

    // Kullanıcı adını al
    let fullName = data.userFullName || '';
    
    if (!fullName || fullName.trim() === '') {
      fullName = await getUserFullName();
    }
    
    // Benzersiz sertifika numarası oluştur
    let certificateNumber: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      certificateNumber = generateCertificateNumber();
      attempts++;
      
      // Benzersizlik kontrolü
      try {
        let myuniCheck = null;
        let eventCheck = null;
        let publicCheck = null;
        
        try {
          const myuniResult = await supabase
            .from('myuni_certificates')
            .select('certificate_number')
            .eq('certificate_number', certificateNumber)
            .single();
          myuniCheck = myuniResult.data;
        } catch {
          // Ignore check errors
        }

        try {
          const eventResult = await supabase
            .from('myuni_event_certificates')
            .select('certificate_number')
            .eq('certificate_number', certificateNumber)
            .single();
          eventCheck = eventResult.data;
        } catch {
          // Ignore check errors
        }
        
        try {
          const publicResult = await supabase
            .from('certificates')
            .select('certificatenumber')
            .eq('certificatenumber', certificateNumber)
            .single();
          publicCheck = publicResult.data;
        } catch {
          // Ignore check errors
        }
          
        if (!myuniCheck && !eventCheck && !publicCheck) break;
        
      } catch {
        break;
      }
      
      if (attempts >= maxAttempts) {
        certificateNumber = generateCertificateNumber() + '-' + Date.now();
        break;
      }
    } while (attempts < maxAttempts);

    const certificateUrl = `https://certificates.myunilab.net/${certificateNumber}`;
    const now = new Date().toISOString();

    const metadata = {
      completion_score: hasException ? 'Exception' : 100,
      total_lessons: data.itemType === 'event' ? 5 : 10,
      completed_lessons: data.itemType === 'event' ? 5 : 10,
      total_quizzes: data.itemType === 'event' ? 0 : 3,
      completed_quizzes: data.itemType === 'event' ? 0 : 3,
      completion_date: now.split('T')[0],
      generation_timestamp: now,
      has_exception: hasException,
      item_type: data.itemType
    };

    let myuniResult = null;

    // MyUNI Certificates tablosuna kaydet (Course/Event'e göre)
    if (data.itemType === 'event') {
      // Event Certificates tablosuna kaydet
      const eventCertificateData = {
        certificate_number: certificateNumber,
        user_id: data.userId,
        event_id: data.itemId,
        student_full_name: fullName,
        event_name: data.itemName,
        organizer_name: data.instructorName,
        event_duration: data.duration,
        organization_name: data.organization,
        organization_description: data.organizationDescription,
        organizer_bio: data.instructorBio,
        certificate_url: certificateUrl,
        certificate_metadata: metadata,
        is_active: true
      };

      try {
        const eventResponse = await supabase
          .from('myuni_event_certificates')
          .insert(eventCertificateData)
          .select()
          .single();

        if (eventResponse.error) {
          throw new Error(`Event certificates hatası: ${eventResponse.error.message}`);
        }

        myuniResult = eventResponse.data;

      } catch (eventError) {
        throw new Error(`Event certificates tablosuna kayıt hatası: ${eventError}`);
      }
    } else {
      // Course Certificates tablosuna kaydet
      const courseCertificateData = {
        certificate_number: certificateNumber,
        user_id: data.userId,
        course_id: data.itemId,
        student_full_name: fullName,
        course_name: data.itemName,
        instructor_name: data.instructorName,
        course_duration: data.duration,
        organization_name: data.organization,
        organization_description: data.organizationDescription,
        instructor_bio: data.instructorBio,
        certificate_url: certificateUrl,
        certificate_metadata: metadata,
        is_active: true
      };

      try {
        const courseResponse = await supabase
          .from('myuni_certificates')
          .insert(courseCertificateData)
          .select()
          .single();

        if (courseResponse.error) {
          throw new Error(`Course certificates hatası: ${courseResponse.error.message}`);
        }

        myuniResult = courseResponse.data;

      } catch (courseError) {
        throw new Error(`Course certificates tablosuna kayıt hatası: ${courseError}`);
      }
    }

    // Public Certificates tablosuna kaydet
    const certificateTypeText = data.itemType === 'course' ? 'Kurs' : 'Etkinlik';
    let templateId = '2';
    let descriptionText = data.itemType === 'course' 
      ? 'Eğitim videolarını tamamlayarak ve sınavdan geçerli notu alarak bu sertifikayı almaya hak kazanmıştır.'
      : 'Etkinlik kapsamında yer alarak, alandaki yenilikçi yaklaşımlar hakkında bilgi edinmiş ve bu sertifikayı almaya hak kazanmıştır.';

    // Etkinlik için template_id ve description'ı myuni_events tablosundan çek
    if (data.itemType === 'event') {
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('myuni_events')
          .select('template_id, certificate_description')
          .eq('id', data.itemId)
          .single();

        if (!eventError && eventData) {
          templateId = eventData.template_id || '2';
          descriptionText = eventData.certificate_description || descriptionText;
        }
      } catch (error) {
        console.log('⚠️ Etkinlik sertifika bilgileri alınamadı, default değerler kullanılıyor:', error);
      }
    }

    const publicCertificateData = {
      certificatenumber: certificateNumber,
      fullname: fullName,
      coursename: data.itemName,
      issuedate: now,
      certificateurl: certificateUrl,
      organization: 'MyUNI Eğitim Platformu',
      instructor: data.instructorName,
      duration: data.duration,
      instructor_bio: data.instructorBio,
      organization_description: data.organizationDescription,
      course_images: null,
      created_at: now,
      updated_at: now,
      course_logo: 'https://emfvwpztyuykqtepnsfp.supabase.co/storage/v1/object/public/myunilab/Logo/myuni-logo.png',
      language: 'tr',
      certificate_title: `${certificateTypeText} Başarı Sertifikası`,
      template_id: templateId,
      description: descriptionText,
      organization_slug: 'myuni'
    };

    try {
      const publicResponse = await supabase
        .from('certificates')
        .insert(publicCertificateData)
        .select()
        .single();

      if (publicResponse.error) {
        // Rollback: MyUNI tablosundaki kaydı sil
        try {
          if (data.itemType === 'event') {
            await supabase
              .from('myuni_event_certificates')
              .delete()
              .eq('id', myuniResult.id);
          } else {
            await supabase
              .from('myuni_certificates')
              .delete()
              .eq('id', myuniResult.id);
          }
        } catch {
          // Ignore rollback errors
        }
        
        throw new Error(`Public certificates hatası: ${publicResponse.error.message}`);
      }

    } catch (publicError) {
      // Rollback: MyUNI tablosundaki kaydı sil
      if (myuniResult) {
        try {
          if (data.itemType === 'event') {
            await supabase
              .from('myuni_event_certificates')
              .delete()
              .eq('id', myuniResult.id);
          } else {
            await supabase
              .from('myuni_certificates')
              .delete()
              .eq('id', myuniResult.id);
          }
        } catch {
          // Ignore rollback errors
        }
      }
      
      throw new Error(`Public certificates tablosuna kayıt hatası: ${publicError}`);
    }
    
    return myuniResult;

  } catch (error) {
    throw error;
  }
}

/**
 * Kullanıcının sertifikasını getirir (kurs için)
 */
export async function getUserCertificate(userId: string, courseId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Kullanıcının sertifikasını getirir (etkinlik için)
 */
export async function getUserEventCertificate(userId: string, eventId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_event_certificates')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Progress-aware certificate generation (kurs/etkinlik için)
 */
export async function generateCertificateWithProgress(data: CertificateData) {
  const eligibility = data.itemType === 'event' 
    ? await checkEventCertificateEligibility(data.userId, data.itemId)
    : await checkItemCertificateEligibility(data.userId, data.itemId, data.itemType);
  
  if (!eligibility.isEligible) {
    throw new Error('Sertifika almak için gerekli koşullar tamamlanmamış: ' + eligibility.missingRequirements.join(', '));
  }
  
  return generateCertificate(data, true);
}

/**
 * Public sertifika getir
 */
export async function getCertificateByNumber(certificateNumber: string) {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificatenumber', certificateNumber)
      .single();

    if (error) {
      throw new Error('Sertifika bulunamadı: ' + error.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * MyUNI sertifika getir (kurs için)
 */
export async function getMyUNICertificateByNumber(certificateNumber: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_certificates')
      .select('*')
      .eq('certificate_number', certificateNumber)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error('MyUNI kurs sertifikası bulunamadı: ' + error.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * MyUNI event sertifika getir
 */
export async function getMyUNIEventCertificateByNumber(certificateNumber: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_event_certificates')
      .select('*')
      .eq('certificate_number', certificateNumber)
      .eq('is_active', true)
      .single();

    if (error) {
      throw new Error('MyUNI etkinlik sertifikası bulunamadı: ' + error.message);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Sertifika istatistikleri (kurs için)
 */
export async function getCertificateStats(courseId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_certificates')
      .select('id, created_at')
      .eq('course_id', courseId)
      .eq('is_active', true);

    if (error) {
      return {
        item_id: courseId,
        item_type: 'course',
        total_certificates: 0,
        recent_certificates: 0,
        certificates_this_month: 0
      };
    }

    const totalCertificates = data?.length || 0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentCertificates = data?.filter(cert => {
      const createdDate = new Date(cert.created_at);
      return createdDate >= oneMonthAgo;
    }).length || 0;

    return {
      item_id: courseId,
      item_type: 'course',
      total_certificates: totalCertificates,
      recent_certificates: recentCertificates,
      certificates_this_month: recentCertificates
    };
  } catch {
    return {
      item_id: courseId,
      item_type: 'course',
      total_certificates: 0,
      recent_certificates: 0,
      certificates_this_month: 0
    };
  }
}

/**
 * Sertifika istatistikleri (etkinlik için)
 */
export async function getEventCertificateStats(eventId: string) {
  try {
    const { data, error } = await supabase
      .from('myuni_event_certificates')
      .select('id, created_at')
      .eq('event_id', eventId)
      .eq('is_active', true);

    if (error) {
      return {
        item_id: eventId,
        item_type: 'event',
        total_certificates: 0,
        recent_certificates: 0,
        certificates_this_month: 0
      };
    }

    const totalCertificates = data?.length || 0;
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const recentCertificates = data?.filter(cert => {
      const createdDate = new Date(cert.created_at);
      return createdDate >= oneMonthAgo;
    }).length || 0;

    return {
      item_id: eventId,
      item_type: 'event',
      total_certificates: totalCertificates,
      recent_certificates: recentCertificates,
      certificates_this_month: recentCertificates
    };
  } catch {
    return {
      item_id: eventId,
      item_type: 'event',
      total_certificates: 0,
      recent_certificates: 0,
      certificates_this_month: 0
    };
  }
}

/**
 * Kullanıcının istisna durumunu getir (kurs için)
 */
export async function getUserCertificateException(userId: string, courseId: string) {
  return getUserItemCertificateException(userId, courseId, 'course');
}

/**
 * Kullanıcının istisna durumunu getir (etkinlik için)
 */
export async function getUserEventCertificateException(userId: string, eventId: string) {
  return getUserItemCertificateException(userId, eventId, 'event');
}

/**
 * Kullanıcının istisna durumunu getir (genel)
 */
async function getUserItemCertificateException(userId: string, itemId: string, itemType: 'course' | 'event') {
  try {
    console.log('🔍 İstisna durumu getiriliyor:', { userId, itemId, itemType });
    
    const { data, error } = await supabase
      .from('myuni_certificate_exceptions')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', itemId) // item_id yerine course_id kullanıyoruz
      .eq('is_active', true);

    console.log('📊 İstisna getirme sonucu:', { data, error });

    const result = error || !data || data.length === 0 ? null : data[0];
    
    if (result) {
      console.log('✅ İstisna durumu bulundu:', result);
    } else {
      console.log('❌ İstisna durumu bulunamadı');
    }
    
    return result;
  } catch (catchError) {
    console.error('💥 İstisna durumu getirme hatası:', catchError);
    return null;
  }
}