"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import { Clock, Users, Play, CheckCircle, Book, TrendingUp, Award, Download, Calendar, MapPin, Trophy, X, Copy, ChevronDown } from 'lucide-react';
import { getCourseCompletionStats } from '../../../lib/courseService';
import { supabase } from '../../../lib/supabase';
import { getUserEventEnrollments } from '../../../lib/eventEnrollmentService';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';

// Types
interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  progress_percentage: number;
  is_active: boolean;
  course?: Course;
}

interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  banner_url?: string;
  duration?: string;
  level?: string;
  price?: number;
  original_price?: number;
  slug: string;
  instructor_name?: string;
  is_active: boolean;
}

interface Certificate {
  id: string;
  certificate_number: string;
  user_id: string;
  course_id?: string;
  event_id?: string;
  student_full_name: string;
  course_name?: string;
  event_name?: string;
  instructor_name?: string;
  organizer_name?: string;
  course_duration?: string;
  event_duration?: string;
  organization_name: string;
  organization_description?: string;
  instructor_bio?: string;
  organizer_bio?: string;
  issue_date: string;
  certificate_url?: string;
  is_active: boolean;
  course?: Course;
  event?: Event;
  certificate_type?: 'course' | 'event';
}

interface EventEnrollment {
  id: string;
  user_id: string;
  event_id: string;
  enrolled_at: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
  welcome_shown?: boolean;
  notes?: string;
  event?: Event;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  organizer_name?: string;
  event_type?: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar';
  start_date?: string;
  end_date?: string;
  timezone?: string;
  is_online?: boolean;
  location_name?: string;
  meeting_url?: string;
  is_paid?: boolean;
  price?: number;
  max_attendees?: number;
  current_attendees?: number;
  thumbnail_url?: string;
  banner_url?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  is_registration_open?: boolean;
  registration_deadline?: string;
}

interface DiscountCode {
  id: string;
  code: string;
  discount_amount: number;
  discount_type: string;
  valid_until: string;
  has_balance_limit: boolean;
  remaining_balance: number | null;
  initial_balance: number | null;
  max_usage: number;
  usage_count: number;
  created_at: string;
  is_referral: boolean;
}


// Next.js sayfa props interface'i
interface DashboardPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Dil metinleri
const texts = {
  tr: {
    title: "Panelim",
    subtitle: "Kurslarınız ve başarılarınızı buradan takip edebilirsiniz.",
    tabs: {
      courses: "Kurslar",
      events: "Etkinliklerim",
      certificates: "Sertifikalarım",
      competitions: "Yarışmalarım",
      discountCodes: "İndirim Kodlarım"
    },
    competitionCard: {
      viewResult: "Sonucu Gör",
      averageScore: "Ortalama Genel Puan",
      rank: "Sıralama",
      rankSuffix: ". sırada"
    },
    stats: {
      enrolled: "Kayıtlı Kurs",
      inProgress: "Devam Eden",
      completed: "Tamamlanan",
      certificates: "Sertifika",
      events: "Etkinlik"
    },
    filters: {
      all: "Tümü",
      inProgress: "Devam Eden",
      completed: "Tamamlanan",
      notStarted: "Başlanmamış"
    },
    courseCard: {
      continue: "Devam Et",
      start: "Başla",
      completed: "Tamamlandı",
      progress: "İlerleme"
    },
    certificateCard: {
      download: "Sertifikayı İndir",
      issued: "Verilme Tarihi",
      certificateNumber: "Sertifika No",
      duration: "Kurs Süresi",
      instructor: "Eğitmen"
    },
    empty: {
      courses: {
        title: "Henüz kayıtlı kursunuz yok",
        subtitle: "Öğrenmeye başlamak için kurslarımıza göz atın",
        action: "Kurslara Göz At"
      },
      certificates: {
        title: "Henüz sertifikanız yok",
        subtitle: "Kursları tamamlayarak sertifika kazanın",
        action: "Kurslarıma Dön"
      },
      events: {
        title: "Henüz etkinlik kaydınız yok",
        subtitle: "İlgi alanınıza uygun etkinliklere katılın",
        action: "Etkinliklere Göz At"
      },
      competitions: {
        title: "Henüz bir yarışmaya kaydolmadınız"
      }
    },
    loading: "Yükleniyor...",
    error: "Veriler yüklenirken bir hata oluştu"
  },
  en: {
    title: "Dashboard",
    subtitle: "Track your courses and achievements here.",
    tabs: {
      courses: "My Courses",
      events: "My Events",
      certificates: "My Certificates",
      competitions: "My Competitions",
      discountCodes: "My Discount Codes",
    },
    competitionCard: {
      viewResult: "View Result",
      averageScore: "Average Overall Score",
      rank: "Ranking",
      rankSuffix: "th place"
    },
    stats: {
      enrolled: "Enrolled Courses",
      inProgress: "In Progress",
      completed: "Completed",
      certificates: "Certificates",
      events: "Events"
    },
    filters: {
      all: "All",
      inProgress: "In Progress",
      completed: "Completed",
      notStarted: "Not Started"
    },
    courseCard: {
      continue: "Continue",
      start: "Start",
      completed: "Completed",
      progress: "Progress"
    },
    certificateCard: {
      download: "Download Certificate",
      issued: "Issue Date",
      certificateNumber: "Certificate No",
      duration: "Course Duration",
      instructor: "Instructor"
    },
    empty: {
      courses: {
        title: "No enrolled courses yet",
        subtitle: "Browse our courses to start learning",
        action: "Browse Courses"
      },
      certificates: {
        title: "No certificates yet",
        subtitle: "Complete courses to earn certificates",
        action: "Back to Courses"
      },
      events: {
        title: "No event enrollments yet",
        subtitle: "Join events that match your interests",
        action: "Browse Events"
      },
      competitions: {
        title: "You haven't enrolled in any competitions yet"
      }
    },
    loading: "Loading...",
    error: "An error occurred while loading data"
  }
};

// Ana sayfa bileşeni
export default function DashboardPage({ params }: DashboardPageProps) {
  const [locale, setLocale] = React.useState<string>('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLocale(resolvedParams.locale);
      setMounted(true);
    };
    resolveParams();
  }, [params]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900 dark:border-neutral-100"></div>
      </div>
    );
  }

  return <DashboardContent locale={locale} />;
}

// İçerik bileşeni
function DashboardContent({ locale }: { locale: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eventEnrollments, setEventEnrollments] = useState<EventEnrollment[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('courses');
  const [hasCompetition, setHasCompetition] = useState<boolean | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  
  // Clerk hook'undan user bilgisini al
  const { user } = useUser();
  const params = useParams();
  
  // UserId ve locale'i hook'lardan al
  const userId = user?.id;

  // Dil metinlerini al
  const t = texts[locale as keyof typeof texts] || texts.tr;





  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== DASHBOARD DEBUG ===');
      console.log('1. User ID (clerk):', user?.id);
      console.log('2. Final User ID:', userId);
      console.log('3. Locale (params):', params?.locale);
      console.log('4. Final Locale:', locale);
      
      if (!userId) {
        console.log('No userId available, skipping fetch');
        setLoading(false);
        return;
      }
      
      // Paralel olarak hem enrollments hem certificates'ları çek
      const [enrollmentsResult, courseCertificatesResult, eventCertificatesResult, eventEnrollmentsResult, discountCodesResult] = await Promise.all([
        // Enrollments
        supabase
          .from('myuni_enrollments')
          .select(`
            *,
            course:myuni_courses(*)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('enrolled_at', { ascending: false }),
        
        // Course Certificates
        supabase
          .from('myuni_certificates')
          .select(`
            *,
            course:myuni_courses(*)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('issue_date', { ascending: false }),

        // Event Certificates
        supabase
          .from('myuni_event_certificates')
          .select(`
            *,
            event:myuni_events(*)
          `)
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('issue_date', { ascending: false }),

        // Event Enrollments
        getUserEventEnrollments(userId),

        // Discount Codes (kullanıcının sahip olduğu kodlar)
        supabase
          .from('discount_codes')
          .select('*')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false })
      ]);

      const { data: enrollmentsData, error: enrollmentsError } = enrollmentsResult;
      const { data: courseCertificatesData, error: courseCertificatesError } = courseCertificatesResult;
      const { data: eventCertificatesData, error: eventCertificatesError } = eventCertificatesResult;
      const eventEnrollmentsData = eventEnrollmentsResult;
      const { data: discountCodesData, error: discountCodesError } = discountCodesResult;

      if (enrollmentsError) {
        throw enrollmentsError;
      }

      if (courseCertificatesError) {
        throw courseCertificatesError;
      }

      if (eventCertificatesError) {
        throw eventCertificatesError;
      }

      if (discountCodesError) {
        console.error('Error fetching discount codes:', discountCodesError);
        // Discount codes hatası kritik değil, devam et
      } else {
        setDiscountCodes(discountCodesData || []);
      }

      console.log('5. Raw enrollments data:', enrollmentsData);
      console.log('6. Raw course certificates data:', courseCertificatesData);
      console.log('7. Raw event certificates data:', eventCertificatesData);
      console.log('8. Raw event enrollments data:', eventEnrollmentsData);
      
      // Course ve Event sertifikalarını birleştir
      const allCertificates: Certificate[] = [
        ...(courseCertificatesData || []).map((cert: Record<string, unknown>) => ({ 
          ...cert, 
          certificate_type: 'course' as const,
          course_name: cert.course_name,
          instructor_name: cert.instructor_name,
          course_duration: cert.course_duration
        } as Certificate)),
        ...(eventCertificatesData || []).map((cert: Record<string, unknown>) => ({ 
          ...cert, 
          certificate_type: 'event' as const,
          course_name: cert.event_name,
          instructor_name: cert.organizer_name,
          course_duration: cert.event_duration
        } as Certificate))
      ].sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
      
      // Certificates'ları set et
      setCertificates(allCertificates);
      
      // Event enrollments'ları set et
      setEventEnrollments(eventEnrollmentsData || []);
      
      // Yarışma durumunu kontrol et
      try {
        const competitionResponse = await fetch('/api/case-results');
        if (competitionResponse.ok) {
          const competitionData = await competitionResponse.json();
          setHasCompetition(competitionData.success && !!competitionData.data);
        } else if (competitionResponse.status === 404) {
          // Yarışma sonucu yok, ama email eşleştirmesi olabilir
          const matchResponse = await fetch('/api/case-results/match-email', {
            method: 'GET'
          });
          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            setHasCompetition(matchData.has_match || false);
          } else {
            setHasCompetition(false);
          }
        } else {
          setHasCompetition(false);
        }
      } catch (competitionError) {
        console.error('Error checking competition status:', competitionError);
        setHasCompetition(false);
      }
      
      if (!enrollmentsData || enrollmentsData.length === 0) {
        setEnrollments([]);
        console.log('No enrollments found');
      } else {
        // Her enrollment için progress hesapla
        const enrollmentsWithProgress = await Promise.all(
          enrollmentsData.map(async (enrollment) => {
            try {
              console.log(`Calculating progress for course: ${enrollment.course_id}`);
              
              // Course completion stats'ını al
              const completionStats = await getCourseCompletionStats(userId, enrollment.course_id);
              
              console.log(`Course ${enrollment.course_id} progress:`, completionStats);
              
              return {
                ...enrollment,
                progress_percentage: completionStats.completionPercentage || 0,
                completion_stats: completionStats
              };
            } catch (progressError) {
              console.error(`Error calculating progress for course ${enrollment.course_id}:`, progressError);
              return {
                ...enrollment,
                progress_percentage: 0
              };
            }
          })
        );
        
        console.log('7. Enrollments with calculated progress:', enrollmentsWithProgress);
        setEnrollments(enrollmentsWithProgress);
      }
      
    } catch (err) {
      console.error("Data fetch error:", err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const errorStack = err instanceof Error ? err.stack : undefined;
      
      console.error("Error details:", {
        message: errorMessage,
        stack: errorStack,
        type: typeof err
      });
      setError(t.error);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id, locale, params?.locale, t.error]);

  useEffect(() => {
    // User bilgileri yüklenene kadar bekle
    if (!userId || !user) {
      console.log('Waiting for user data...');
      setLoading(true);
      return;
    }
    
    fetchData();
  }, [userId, user, locale, fetchData]);

  // Gerçek veri varsa onu kullan, yoksa boş array
  const currentEnrollments = enrollments || [];
  const currentCertificates = certificates || [];
  const currentEventEnrollments = eventEnrollments || [];
  
  console.log('=== RENDER DEBUG ===');
  console.log('Current enrollments:', currentEnrollments);
  console.log('Current certificates:', currentCertificates);
  console.log('Current event enrollments:', currentEventEnrollments);
  console.log('Loading state:', loading);
  console.log('Error state:', error);

  // Filtreleme fonksiyonu
  const filteredEnrollments = currentEnrollments.filter(enrollment => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'completed') return enrollment.progress_percentage === 100;
    if (activeFilter === 'inProgress') return enrollment.progress_percentage > 0 && enrollment.progress_percentage < 100;
    if (activeFilter === 'notStarted') return enrollment.progress_percentage === 0;
    return true;
  });

  // İstatistik hesaplamaları
  const stats = {
    enrolled: currentEnrollments.length,
    inProgress: currentEnrollments.filter(e => e.progress_percentage > 0 && e.progress_percentage < 100).length,
    completed: currentEnrollments.filter(e => e.progress_percentage === 100).length,
    certificates: currentCertificates.length,
    events: currentEventEnrollments.length
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const CertificateCard = ({ certificate }: { certificate: Certificate }) => {
    const handleDownload = () => {
      if (certificate.certificate_url) {
        // Doğrudan certificate_url'deki linke yönlendir
        window.open(certificate.certificate_url, '_blank');
      } else {
        // Eğer certificate_url yoksa console'da uyarı ver
        console.warn('Certificate URL not found for certificate:', certificate.certificate_number);
        
        // Alternatif olarak certificate sayfasına yönlendir
        const certificateRoute = `/${locale}/certificate/${certificate.certificate_number}`;
        window.open(certificateRoute, '_blank');
      }
    };

    // Sertifika türüne göre başlık ve detayları belirle
    const certificateTitle = certificate.certificate_type === 'event' 
      ? certificate.event_name 
      : certificate.course_name;
    
    const instructorName = certificate.certificate_type === 'event' 
      ? certificate.organizer_name 
      : certificate.instructor_name;
    
    const duration = certificate.certificate_type === 'event' 
      ? certificate.event_duration 
      : certificate.course_duration;

    const certificateTypeLabel = certificate.certificate_type === 'event' 
      ? (locale === 'tr' ? 'Etkinlik Sertifikası' : 'Event Certificate')
      : (locale === 'tr' ? 'Kurs Sertifikası' : 'Course Certificate');

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
        {/* Certificate Header */}
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-700 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
              {certificate.certificate_type === 'event' ? (
                <Calendar className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              ) : (
                <Award className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-mono bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded">
              {certificate.certificate_number}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 leading-tight">
            {certificateTitle}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {certificate.organization_name}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full ${
              certificate.certificate_type === 'event' 
                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {certificateTypeLabel}
            </span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-4 sm:p-6">
          {/* Student Info */}
          <div className="mb-4">
            <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {certificate.student_full_name}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {certificate.certificate_type === 'event' 
                ? (locale === 'tr' ? 'Düzenleyici' : 'Organizer')
                : t.certificateCard.instructor
              }: {instructorName}
            </p>
          </div>

          {/* Certificate Details */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {t.certificateCard.issued}
              </span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {formatDate(certificate.issue_date)}
              </span>
            </div>

            {duration && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {certificate.certificate_type === 'event' 
                    ? (locale === 'tr' ? 'Etkinlik Süresi' : 'Event Duration')
                    : t.certificateCard.duration
                  }
                </span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {duration}
                </span>
              </div>
            )}
          </div>

          {/* Single Download Button */}
          <button
            onClick={handleDownload}
            disabled={!certificate.certificate_url}
            className={`w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium text-sm ${
              certificate.certificate_url
                ? 'bg-neutral-900 dark:bg-neutral-100 hover:bg-[#990000] dark:hover:bg-neutral-200 text-white dark:text-neutral-900 cursor-pointer'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            {certificate.certificate_url ? t.certificateCard.download : (locale === 'tr' ? 'Sertifika Hazırlanıyor' : 'Certificate Preparing')}
          </button>
        </div>
      </div>
    );
  };

  const EventCard = ({ eventEnrollment }: { eventEnrollment: EventEnrollment }) => {
    const event = eventEnrollment.event;
    if (!event) return null;

    const formatEventDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusColor = (status?: string) => {
      switch (status) {
        case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      }
    };

    const getAttendanceStatusColor = (status: string) => {
      switch (status) {
        case 'registered': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
        case 'attended': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'no_show': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      }
    };

    const getAttendanceStatusText = (status: string) => {
      switch (status) {
        case 'registered': return locale === 'tr' ? 'Kayıtlı' : 'Registered';
        case 'attended': return locale === 'tr' ? 'Katıldı' : 'Attended';
        case 'no_show': return locale === 'tr' ? 'Katılmadı' : 'No Show';
        default: return status;
      }
    };

    const getStatusText = (status?: string) => {
      switch (status) {
        case 'upcoming': return locale === 'tr' ? 'Yaklaşan' : 'Upcoming';
        case 'ongoing': return locale === 'tr' ? 'Devam Ediyor' : 'Ongoing';
        case 'completed': return locale === 'tr' ? 'Tamamlandı' : 'Completed';
        case 'cancelled': return locale === 'tr' ? 'İptal Edildi' : 'Cancelled';
        default: return status || '';
      }
    };

    // Resim URL'sini belirle
    const imageUrl = event.thumbnail_url || event.banner_url || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    const eventUrl = `/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}/${event.slug}`;
    const watchEventUrl = `/${locale}/watch/event/${event.slug}`;

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
        {/* Event Image */}
        <Link href={eventUrl} className="block">
          <div className="relative w-full h-32 sm:h-48 overflow-hidden group">
            <Image
              src={imageUrl}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex gap-2">
              <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(event.status)}`}>
                {getStatusText(event.status)}
              </span>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full p-2 sm:p-3">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-neutral-800 dark:text-neutral-200" />
              </div>
            </div>
          </div>
        </Link>

        {/* Event Info */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <Link href={eventUrl}>
              <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 leading-tight hover:text-[#990000] transition-colors cursor-pointer">
                {event.title}
              </h3>
            </Link>
            
            {/* Rich Text Description */}
            <div className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mb-3 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{event.description || ''}</ReactMarkdown>
            </div>

            {/* Markdown Styles */}
            <style jsx>{`
              .prose p {
                margin: 0;
                line-height: 1.4;
                color: rgb(115 115 115);
                font-size: 0.875rem;
              }
              .dark .prose p {
                color: rgb(163 163 163);
              }
              .prose strong {
                font-weight: 600;
                color: rgb(64 64 64);
              }
              .dark .prose strong {
                color: rgb(212 212 212);
              }
              .prose em {
                font-style: italic;
                color: rgb(115 115 115);
              }
              .dark .prose em {
                color: rgb(163 163 163);
              }
              .prose h3,
              .prose h4,
              .prose h5 {
                display: none;
              }
              .prose ul,
              .prose ol {
                display: none;
              }
            `}</style>

            {/* Event Details */}
            <div className="space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              {event.start_date && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatEventDate(event.start_date)}</span>
                </div>
              )}
              
              {event.organizer_name && (
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{event.organizer_name}</span>
                </div>
              )}

              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-neutral-500" />
                <span>{event.is_online ? (locale === 'tr' ? 'Online' : 'Online') : event.location_name || (locale === 'tr' ? 'Fiziksel Mekan' : 'Physical Location')}</span>
              </div>
            </div>
          </div>

          {/* Attendance Status */}
          <div className="mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAttendanceStatusColor(eventEnrollment.attendance_status)}`}>
              {getAttendanceStatusText(eventEnrollment.attendance_status)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2">
            {event.status === 'upcoming' && (
              <>
                <Link 
                  href={eventUrl}
                  className="w-full bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {locale === 'tr' ? 'Detayları Görüntüle' : 'View Details'}
                </Link>
                <Link 
                  href={watchEventUrl}
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {locale === 'tr' ? 'Etkinliğe Katıl' : 'Join Event'}
                </Link>
              </>
            )}
            
            {event.status === 'ongoing' && (
              <>
                <Link 
                  href={eventUrl}
                  className="w-full bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {locale === 'tr' ? 'Detayları Görüntüle' : 'View Details'}
                </Link>
                {event.is_online && (
                  <Link 
                    href={watchEventUrl}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {locale === 'tr' ? 'Etkinliğe Katıl' : 'Join Event'}
                  </Link>
                )}
              </>
            )}

            {event.status === 'completed' && (
              <div className="w-full text-center text-neutral-500 dark:text-neutral-400 py-2">
                {locale === 'tr' ? 'Etkinlik Tamamlandı' : 'Event Completed'}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Confetti efekti için fonksiyon
  const triggerConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confettiCount = 200;
    const duration = 3000;
    
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confetti: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];
    
    for (let i = 0; i < confettiCount; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      confetti.forEach((c, i) => {
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.rotationSpeed;
        c.vy += 0.1; // gravity
        
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
        ctx.restore();
        
        if (c.y > canvas.height + 20) {
          confetti.splice(i, 1);
        }
      });
      
      if (confetti.length > 0) {
        requestAnimationFrame(animate);
      } else {
        document.body.removeChild(canvas);
      }
    };
    
    animate();
    
    setTimeout(() => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
    }, duration);
  };

  // Competition Result Modal Component
  const ResultModal = ({ 
    isOpen, 
    onClose, 
    averageScore, 
    rank,
    comments,
    onNavigateToDiscountCodes
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    averageScore: number; 
    rank: number;
    comments?: string | null;
    onNavigateToDiscountCodes?: () => void;
  }) => {
    const hasTriggeredConfetti = useRef(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    
    useEffect(() => {
      if (isOpen && rank <= 3 && rank > 0 && !hasTriggeredConfetti.current) {
        triggerConfetti();
        hasTriggeredConfetti.current = true;
      }
      if (!isOpen) {
        hasTriggeredConfetti.current = false;
      }
    }, [isOpen, rank]);
    
    if (!isOpen) return null;
    
    const isTopThree = rank <= 3 && rank > 0;

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-5 sm:p-8 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 sm:top-4 right-3 sm:right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
            aria-label={locale === 'tr' ? 'Kapat' : 'Close'}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Modal Header */}
          <div className="mb-5 sm:mb-6 pt-1">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[#990000] to-[#770000] rounded-full flex items-center justify-center mb-3 sm:mb-4 mx-auto">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-neutral-100 text-center mb-1.5 sm:mb-2">
              {locale === 'tr' ? 'Vaka Çalışması Sonucu' : 'Case Study Result'}
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 text-center text-xs sm:text-sm">
              {locale === 'tr' ? 'Myuni Farmasötik Nanoteknoloji' : 'Myuni Pharmaceutical Nanotechnology'}
            </p>
          </div>

          {/* Results */}
          <div className="space-y-4 sm:space-y-6">
            {/* Average Score */}
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-5 sm:p-6 border border-neutral-200 dark:border-neutral-700">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {t.competitionCard.averageScore}
                </p>
                <div className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {averageScore.toFixed(1)}
                </div>
                <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1.5 sm:mt-2">
                  {locale === 'tr' ? '100 üzerinden' : 'out of 100'}
                </p>
              </div>
            </div>

            {/* Rank */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-5 sm:p-6 border border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  {locale === 'tr' ? 'Sıralamanız' : 'Your Ranking'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div className="text-2xl sm:text-3xl font-bold text-yellow-700 dark:text-yellow-400 break-words">
                    {rank}
                  </div>
                </div>
              </div>
            </div>

            {/* Participant Statistics - Accordion */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
              <button
                onClick={() => setIsStatsOpen(!isStatsOpen)}
                className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-300">
                    {locale === 'tr' ? 'Katılımcı İstatistikleri' : 'Participant Statistics'}
                  </h3>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
                    isStatsOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {isStatsOpen && (
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-3 border-t border-blue-200 dark:border-blue-800 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {locale === 'tr' ? 'Toplam Katılımcı' : 'Total Participants'}
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                      124
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {locale === 'tr' ? 'Bireysel Katılımcı' : 'Individual Participants'}
                    </span>
                    <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                      60
                    </span>
                  </div>
                  <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {locale === 'tr' ? 'Toplam Takım' : 'Total Teams'}
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">
                        24 {locale === 'tr' ? 'takım' : 'teams'}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-blue-200 dark:border-blue-800 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {locale === 'tr' ? 'Toplam Tekil Katılımcı/Takım' : 'Total Individual Participants/Teams'}
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-400 text-base">
                        84
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                      {locale === 'tr' ? '(24 takım + 60 bireysel)' : '(24 teams + 60 individual)'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Jury Comments */}
            {comments && (
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-5 sm:p-6 border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                  {locale === 'tr' ? 'Jürinin Yorumu' : 'Jury Comment'}
                </h3>
                <div className="text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {comments}
                </div>
              </div>
            )}

            {/* Top 3 Ödül Mesajı */}
            {isTopThree && (
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 rounded-lg p-5 sm:p-6 border-2 border-yellow-300 dark:border-yellow-700">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-2">
                      {locale === 'tr' ? '🎉 Tebrikler! Ödül Kazandınız!' : '🎉 Congratulations! You Won a Prize!'}
                    </h3>
                    <p className="text-sm sm:text-base text-yellow-700 dark:text-yellow-400 leading-relaxed">
                      {locale === 'tr' 
                        ? `Kazandığınız indirim kodunu görmek için "İndirim Kodlarım" sekmesine gidin.`
                        : `Go to the "My Discount Codes" tab to see your discount code.`}
                    </p>
                    <button
                      onClick={() => {
                        if (onNavigateToDiscountCodes) {
                          onNavigateToDiscountCodes();
                        }
                        onClose();
                      }}
                      className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base"
                    >
                      {locale === 'tr' ? 'İndirim Kodlarım\'a Git' : 'Go to My Discount Codes'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="mt-5 sm:mt-6 w-full bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:bg-neutral-700 dark:active:bg-neutral-300 text-white dark:text-neutral-900 px-4 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base"
          >
            {locale === 'tr' ? 'Kapat' : 'Close'}
          </button>
        </div>
      </div>
    );
  };

  // Competition Card Component
  const CompetitionCard = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [caseResult, setCaseResult] = useState<{
      average_score: number | null;
      rank: number | null;
      participant_name?: string;
      comments?: string | null;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasResult, setHasResult] = useState(false);
    const [matchingEmail, setMatchingEmail] = useState(false);

    // Component mount olduğunda email eşleştirmesi yap ve case result'ı kontrol et
    useEffect(() => {
      const checkAndMatchCaseResult = async () => {
        const currentUserId = user?.id;
        if (!currentUserId || !user) return;

        try {
          // Önce email eşleştirmesi yap
          setMatchingEmail(true);
          const matchResponse = await fetch('/api/case-results/match-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (matchResponse.ok) {
            const matchData = await matchResponse.json();
            console.log('Email matching result:', matchData);
          }

          // Sonra case result'ı getir
          const resultResponse = await fetch('/api/case-results');
          
          if (resultResponse.ok) {
            const resultData = await resultResponse.json();
            if (resultData.success && resultData.data) {
              setCaseResult({
                average_score: resultData.data.average_score || 0,
                rank: resultData.data.rank || null,
                participant_name: resultData.data.participant_name,
                comments: resultData.data.comments || null
              });
              setHasResult(true);
            } else {
              setHasResult(false);
            }
          } else if (resultResponse.status === 404) {
            // Sonuç bulunamadı
            setHasResult(false);
          } else {
            const errorData = await resultResponse.json();
            setError(errorData.error || 'Failed to fetch case result');
            setHasResult(false);
          }
        } catch (err) {
          console.error('Error checking case result:', err);
          setError(err instanceof Error ? err.message : 'Unknown error');
          setHasResult(false);
        } finally {
          setMatchingEmail(false);
        }
      };

      checkAndMatchCaseResult();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const handleViewResult = async () => {
      if (!hasResult || !caseResult) {
        // Sonuç yoksa uyarı göster
        alert(locale === 'tr' 
          ? 'Sonuç bulunamadı. Lütfen formda kullandığınız email adresi ile giriş yaptığınızdan emin olun.' 
          : 'Result not found. Please make sure you logged in with the email address you used in the form.');
        return;
      }

      setIsModalOpen(true);
    };

    return (
      <>
        <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-xl dark:hover:shadow-neutral-900/30 transition-all duration-300 group cursor-pointer transform hover:-translate-y-1">
          {/* Top Section - Header with Red Background */}
          <div className="relative h-44 sm:h-56 md:h-60 overflow-hidden bg-[#990000]">
            {/* Hover Overlay - Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-black/0 to-black/0 group-hover:from-black/20 group-hover:via-black/10 group-hover:to-black/20 transition-all duration-300 z-10"></div>
            
            {/* Shine effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
            </div>
            
            <div className="relative h-full p-4 sm:p-6 flex flex-col justify-between z-20">
              {/* Top Row - Icon and Badge */}
              <div className="flex items-start justify-between gap-2">
                {/* Trophy Icon in Light Red Square */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#cc0000] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                {/* Badge */}
                <span className="bg-[#cc0000] text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-sm font-medium whitespace-nowrap group-hover:scale-105 transition-transform duration-300">
                  {locale === 'tr' ? 'Vaka Çalışması' : 'Case Study'}
                </span>
              </div>
              
              {/* Title and Subtitle */}
              <div className="mt-auto">
                <h3 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight mb-1.5 sm:mb-2 group-hover:translate-y-[-2px] transition-transform duration-300">
                  {locale === 'tr' ? 'MyUNI Farmasötik Nanoteknoloji' : 'MyUNI Pharmaceutical Nanotechnology'}
                </h3>
                <p className="text-white/90 text-xs sm:text-base line-clamp-2 group-hover:text-white transition-colors duration-300">
                  {locale === 'tr' 
                    ? 'Farmasötik nanoteknoloji alanında uygulamalı vaka çalışması' 
                    : 'Applied case study in pharmaceutical nanotechnology'}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section - Details and Actions */}
          <div className="bg-neutral-100 dark:bg-neutral-800 p-4 sm:p-6 group-hover:bg-neutral-50 dark:group-hover:bg-neutral-700/50 transition-colors duration-300">
            {/* Description */}
            {matchingEmail ? (
              <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-xs sm:text-base group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors duration-300">
                {locale === 'tr' ? 'Eşleştirme yapılıyor...' : 'Matching email...'}
              </p>
            ) : error ? (
              <div className="mb-4 p-2.5 sm:p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs sm:text-sm text-red-600 dark:text-red-400 group-hover:border-red-300 dark:group-hover:border-red-700 transition-colors duration-300">
                {error}
              </div>
            ) : hasResult ? (
              <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-xs sm:text-base group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors duration-300">
                {locale === 'tr' 
                  ? 'Vaka çalışmasını tamamladınız. Sonuçlarınızı görmek için butona tıklayın.' 
                  : 'You have completed the case study. Click the button to view your results.'}
              </p>
            ) : (
              <p className="text-neutral-600 dark:text-neutral-400 mb-4 text-xs sm:text-base group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors duration-300">
                {locale === 'tr' 
                  ? 'Formda kullandığınız email adresi ile giriş yaptığınızdan emin olun. Sonuçlarınız email adresinizle eşleştirildikten sonra görünecektir.' 
                  : 'Make sure you logged in with the email address you used in the form. Your results will appear after matching your email address.'}
              </p>
            )}

            {/* View Result Button */}
            <button
              onClick={handleViewResult}
              disabled={matchingEmail || (!hasResult && !error)}
              className={`w-full px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-300 flex items-center justify-center font-semibold text-xs sm:text-base ${
                matchingEmail || (!hasResult && !error)
                  ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-500 cursor-not-allowed'
                  : 'bg-[#990000] hover:bg-[#880000] active:bg-[#770000] text-white group-hover:shadow-lg group-hover:shadow-[#990000]/30 group-hover:scale-[1.02]'
              }`}
            >
              <Trophy className="w-4 h-4 mr-2 flex-shrink-0 group-hover:rotate-12 transition-transform duration-300" />
              <span className="truncate">{t.competitionCard.viewResult}</span>
            </button>
          </div>
        </div>

        {/* Result Modal */}
        {caseResult && (
          <ResultModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            averageScore={caseResult.average_score || 0}
            rank={caseResult.rank || 0}
            comments={caseResult.comments}
            onNavigateToDiscountCodes={() => setActiveTab('discountCodes')}
          />
        )}
      </>
    );
  };

  const CourseCard = ({ enrollment }: { enrollment: Enrollment }) => {
    const course = enrollment.course;
    if (!course) return null;

    const getProgressColor = (progress: number) => {
      if (progress === 100) return 'bg-green-500';
      if (progress >= 50) return 'bg-blue-500';
      return 'bg-yellow-500';
    };

    const getActionButton = () => {
      // watch URL'i her zaman 'course' olmalı
      const watchUrl = `/${locale}/watch/course/${course.slug}`;
      
      if (enrollment.progress_percentage === 100) {
        return (
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <CheckCircle className="w-4 h-4 mr-2" />
            {t.courseCard.completed}
          </div>
        );
      }
      
      if (enrollment.progress_percentage === 0) {
        return (
          <Link 
            href={watchUrl}
            className="bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            {t.courseCard.start}
          </Link>
        );
      }

      return (
        <Link 
          href={watchUrl}
          className="bg-[#990000] hover:bg-[#770000] text-white px-4 py-2 rounded-md transition-colors flex items-center font-medium"
        >
          <Play className="w-4 h-4 mr-2" />
          {t.courseCard.continue}
        </Link>
      );
    };

    // Resim URL'sini belirle (thumbnail_url veya banner_url kullan)
    const imageUrl = course.thumbnail_url || course.banner_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
    
    // Locale'e göre courseType'ı belirle
    const courseType = locale === 'tr' ? 'kurs' : 'course';
    const courseUrl = `/${locale}/${courseType}/${course.slug}`;

    // Rich text renderer function
    const renderRichText = (htmlContent: string | undefined) => {
      if (!htmlContent) return 'Açıklama mevcut değil';
      
      const isHtml = htmlContent.includes('<');
      let contentToRender = isHtml ? htmlContent : htmlContent;
      
      // Kart görünümü için içeriği kısalt
      const textOnly = htmlContent.replace(/<[^>]*>/g, '').trim();
      if (textOnly.length > 120) {
        const truncatedText = textOnly.slice(0, 120) + '...';
        contentToRender = isHtml ? `<div>${htmlContent}</div>` : truncatedText;
      }

      if (isHtml) {
        return (
          <div 
            className="rich-text-content text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: contentToRender }}
          />
        );
      }
      
      return (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
          {contentToRender}
        </p>
      );
    };

    return (
      <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
        {/* Course Image - Tıklanabilir */}
        <Link href={courseUrl} className="block">
          <div className="relative w-full h-32 sm:h-48 overflow-hidden group">
            <Image
              src={imageUrl}
              alt={course.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4">
              <span className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm text-neutral-800 dark:text-neutral-200 px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                {course.level || 'Seviye belirtilmemiş'}
              </span>
            </div>
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm rounded-full p-2 sm:p-3">
                <Play className="w-4 h-4 sm:w-6 sm:h-6 text-neutral-800 dark:text-neutral-200" />
              </div>
            </div>
          </div>
        </Link>

        {/* Course Info */}
        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <Link href={courseUrl}>
              <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-2 leading-tight hover:text-[#990000] transition-colors cursor-pointer">
                {course.title}
              </h3>
            </Link>
            
            {/* Rich Text Description */}
            {renderRichText(course.description)}
            
            {/* Rich Text Styles */}
            <style jsx>{`
              .rich-text-content p {
                margin: 0;
                line-height: 1.4;
                color: rgb(115 115 115);
                font-size: 0.875rem;
              }
              .dark .rich-text-content p {
                color: rgb(163 163 163);
              }
              .rich-text-content strong {
                font-weight: 600;
                color: rgb(64 64 64);
              }
              .dark .rich-text-content strong {
                color: rgb(212 212 212);
              }
              .rich-text-content em {
                font-style: italic;
                color: rgb(115 115 115);
              }
              .dark .rich-text-content em {
                color: rgb(163 163 163);
              }
              .rich-text-content h3,
              .rich-text-content h4,
              .rich-text-content h5 {
                display: none;
              }
              .rich-text-content ul,
              .rich-text-content ol {
                display: none;
              }
            `}</style>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {t.courseCard.progress}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {enrollment.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(enrollment.progress_percentage)}`}
                style={{ width: `${enrollment.progress_percentage}%` }}
              />
            </div>
          </div>

          {/* Course Stats */}
          <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
            <div className="flex items-center space-x-4">
              {course.duration && (
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {course.duration}
                </span>
              )}
              {course.instructor_name && (
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {course.instructor_name}
                </span>
              )}
            </div>
          </div>

          {/* Continue Button - Moved to bottom */}
          <div className="mt-4">
            {getActionButton()}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-48 sm:w-64 mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-72 sm:w-96 mb-6 sm:mb-8"></div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <div className="h-6 sm:h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-8 sm:w-12 mb-2"></div>
                  <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-16 sm:w-20"></div>
                </div>
              ))}
            </div>
            
            {/* Content skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                  <div className="h-32 sm:h-48 bg-neutral-200 dark:bg-neutral-700"></div>
                  <div className="p-4 sm:p-6">
                    <div className="h-5 sm:h-6 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
                    <div className="h-3 sm:h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                    <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded mb-4"></div>
                    <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-red-600 text-lg sm:text-xl">!</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.error}
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 sm:mb-8">
              {error}
            </p>
            <button
              onClick={fetchData}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Boş durum kontrolü: Kurs, sertifika ve etkinlik yoksa ama yarışma varsa boş durum gösterme
  const hasAnyContent = currentEnrollments.length > 0 || currentCertificates.length > 0 || currentEventEnrollments.length > 0 || hasCompetition === true;
  
  if (!hasAnyContent && hasCompetition !== null) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {t.title}
            </h1>
            <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
              {t.subtitle}
            </p>
          </div>


          {/* Empty State Content */}
          <div className="max-w-4xl">
            {/* Icon */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-6 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
              <Book className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            
            {/* Main Content */}
            <h2 className="text-2xl sm:text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {t.empty.courses.title}
            </h2>
            
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed max-w-lg">
              {t.empty.courses.subtitle}
            </p>

            {/* Simple Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <div>
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-2 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <Users className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'tr' ? 'Uzman Eğitmenler' : 'Expert Instructors'}
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-2 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <Clock className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'tr' ? 'Esnek Tempo' : 'Flexible Pace'}
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-2 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <Award className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'tr' ? 'Sertifika' : 'Certificate'}
                </p>
              </div>

              <div>
                <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg mb-2 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
                  <Play className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {locale === 'tr' ? 'Anında Erişim' : 'Instant Access'}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`}
              className="inline-flex items-center px-6 py-3 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md"
            >
              <Book className="w-5 h-5 mr-2" />
              {t.empty.courses.action}
            </Link>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {t.title}
          </h1>
          <div className="w-12 sm:w-16 h-px bg-[#990000] mb-4"></div>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
            {t.subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.enrolled}
              </span>
              <Book className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {t.stats.enrolled}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.inProgress}
              </span>
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {t.stats.inProgress}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.completed}
              </span>
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {t.stats.completed}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.certificates}
              </span>
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {t.stats.certificates}
            </p>
          </div>

          <div className="bg-white dark:bg-neutral-800 p-4 sm:p-6 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {stats.events}
              </span>
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              {t.stats.events}
            </p>
          </div>
        </div>


        {/* Responsive Tabs */}
        <div className="mb-6 sm:mb-8">
          {/* Mobile: 2x2 Grid */}
          <div className="sm:hidden grid grid-cols-2 gap-2 bg-neutral-100 dark:bg-neutral-800 p-2 rounded-lg">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.courses}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.events}
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === 'certificates'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.certificates}
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === 'competitions'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.competitions}
            </button>
            <button
              onClick={() => setActiveTab('discountCodes')}
              className={`px-3 py-2 rounded-md font-medium transition-all duration-300 text-xs ${
                activeTab === 'discountCodes'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.discountCodes}
            </button>
          </div>

          {/* Desktop: Horizontal Flex */}
          <div className="hidden sm:flex space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg max-w-2xl">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm lg:text-base ${
                activeTab === 'courses'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.courses}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm lg:text-base ${
                activeTab === 'events'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.events}
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm lg:text-base ${
                activeTab === 'certificates'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.certificates}
            </button>
            <button
              onClick={() => setActiveTab('competitions')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm lg:text-base ${
                activeTab === 'competitions'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.competitions}
            </button>
            <button
              onClick={() => setActiveTab('discountCodes')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all duration-300 text-sm lg:text-base ${
                activeTab === 'discountCodes'
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              {t.tabs.discountCodes}
            </button>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'courses' && (
          <>
            {/* Filters for Courses */}
            {currentEnrollments.length > 0 && (
              <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
                {Object.entries(t.filters).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${
                      activeFilter === key
                        ? 'bg-neutral-900 dark:bg-neutral-700 text-white'
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Courses Grid */}
            {currentEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredEnrollments.map((enrollment) => (
                  <CourseCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Book className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {t.empty.courses.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  {t.empty.courses.subtitle}
                </p>
                <Link
                  href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`}
                  className="inline-flex items-center px-4 sm:px-6 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors font-medium"
                >
                  <Book className="w-4 h-4 mr-2" />
                  {t.empty.courses.action}
                </Link>
              </div>
            )}

            {/* Empty Filter Results for Courses */}
            {filteredEnrollments.length === 0 && currentEnrollments.length > 0 && (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🔍</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Bu filtreye uygun kurs bulunamadı
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  Farklı bir filtre deneyin veya tüm kursları görüntüleyin.
                </p>
                <button
                  onClick={() => setActiveFilter('all')}
                  className="px-4 sm:px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Tümünü Göster
                </button>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'events' && (
          <>
            {/* Events Grid */}
            {currentEventEnrollments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentEventEnrollments.map((eventEnrollment) => (
                  <EventCard key={eventEnrollment.id} eventEnrollment={eventEnrollment} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {t.empty.events.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  {t.empty.events.subtitle}
                </p>
                <Link
                  href={`/${locale}/${locale === 'tr' ? 'etkinlik' : 'event'}`}
                  className="inline-flex items-center px-4 sm:px-6 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors font-medium"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.empty.events.action}
                </Link>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'certificates' && (
          <>
            {/* Certificates Grid */}
            {currentCertificates.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {currentCertificates.map((certificate) => (
                  <CertificateCard key={certificate.id} certificate={certificate} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {t.empty.certificates.title}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  {t.empty.certificates.subtitle}
                </p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="inline-flex items-center px-4 sm:px-6 py-2 bg-[#990000] hover:bg-[#880000] text-white rounded-lg transition-colors font-medium"
                >
                  <Book className="w-4 h-4 mr-2" />
                  {t.empty.certificates.action}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'competitions' && (
          <>
            {/* Competition Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <CompetitionCard />
            </div>
          </>
        )}

        {activeTab === 'discountCodes' && (
          <>
            {/* Discount Codes Grid */}
            {discountCodes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {discountCodes.map((discountCode) => (
                  <div key={discountCode.id} className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-neutral-100 dark:bg-neutral-700 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">%</span>
                        </div>
                        {discountCode.has_balance_limit && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            discountCode.remaining_balance !== null && discountCode.remaining_balance > 0
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : discountCode.remaining_balance !== null && discountCode.remaining_balance <= 0
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {locale === 'tr' ? 'Bakiye Limiti' : 'Balance Limit'}
                          </span>
                        )}
                      </div>
                      
                      {/* İndirim Kodunuz Başlığı */}
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                        {locale === 'tr' ? 'İndirim Kodunuz:' : 'Your Discount Code:'}
                      </p>
                      
                      {/* Kod ve Kopyala Butonu */}
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg sm:text-xl font-medium text-neutral-900 dark:text-neutral-100 flex-1 select-all">
                          {discountCode.code}
                        </h3>
                        <button
                          onClick={() => copyToClipboard(discountCode.code)}
                          className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center justify-center"
                          title={locale === 'tr' ? 'Kopyalamak için tıklayın' : 'Click to copy'}
                        >
                          {copiedCode === discountCode.code ? (
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Copy className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                          )}
                        </button>
                      </div>
                      
                      {/* Kopyalandı Mesajı */}
                      {copiedCode === discountCode.code && (
                        <p className="text-xs text-green-600 dark:text-green-400 mb-3">
                          {locale === 'tr' ? '✓ Kopyalandı' : '✓ Copied'}
                        </p>
                      )}
                      
                      {/* Not */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                        <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                          {locale === 'tr' 
                            ? 'Bu kod, (eğer varsa) birden fazla takım üyesi tarafından ortak şekilde kullanılabilir ve tüm kullanıcıların bakiyelerinin toplamını görüntüler. Böylece ekip olarak mevcut toplam kaynakları kolayca takip edebilirsiniz.'
                            : 'This code can be shared among multiple team members (if applicable) and displays the total balance of all users. This allows the team to easily track the current total resources.'}
                        </p>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        {discountCode.has_balance_limit && discountCode.remaining_balance !== null && discountCode.remaining_balance !== undefined && (
                          <div className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 border border-neutral-200 dark:border-neutral-700">
                            {/* Total Bakiye */}
                            {discountCode.initial_balance !== null && discountCode.initial_balance !== undefined && (
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                  {locale === 'tr' ? 'Total Bakiye' : 'Total Balance'}
                                </span>
                                <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                  {typeof discountCode.initial_balance === 'number' ? discountCode.initial_balance.toFixed(2) : discountCode.initial_balance} {locale === 'tr' ? 'TL' : 'TL'}
                                </span>
                              </div>
                            )}
                            
                            {/* Kalan Bakiye */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {locale === 'tr' ? 'Kalan Bakiye' : 'Remaining Balance'}
                              </span>
                              <span className={`text-lg font-bold ${
                                discountCode.remaining_balance !== null && discountCode.remaining_balance !== undefined && discountCode.remaining_balance > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {typeof discountCode.remaining_balance === 'number' ? discountCode.remaining_balance.toFixed(2) : (discountCode.remaining_balance || '0.00')} {locale === 'tr' ? 'TL' : 'TL'}
                              </span>
                            </div>
                            {discountCode.remaining_balance !== null && discountCode.remaining_balance !== undefined && (
                              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    typeof discountCode.remaining_balance === 'number' && discountCode.remaining_balance > 0 
                                      ? 'bg-green-500' 
                                      : 'bg-red-500'
                                  }`}
                                  style={{ 
                                    // remaining_balance / initial_balance oranına göre progress bar
                                    width: typeof discountCode.initial_balance === 'number' && discountCode.initial_balance > 0 && typeof discountCode.remaining_balance === 'number'
                                      ? `${Math.min(100, Math.max(0, (discountCode.remaining_balance / discountCode.initial_balance) * 100))}%`
                                      : typeof discountCode.remaining_balance === 'number' && discountCode.remaining_balance > 0
                                      ? '100%' // Başlangıç bakiyesi yoksa, kalan bakiye varsa 100% göster
                                      : '0%'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {locale === 'tr' ? 'Kullanım' : 'Usage'}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {discountCode.has_balance_limit 
                              ? (locale === 'tr' ? '∞ Sınırsız' : '∞ Unlimited')
                              : `${discountCode.usage_count} / ${discountCode.max_usage}`
                            }
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-600 dark:text-neutral-400">
                            {locale === 'tr' ? 'Geçerlilik' : 'Valid Until'}
                          </span>
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {formatDate(discountCode.valid_until)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neutral-200 dark:bg-neutral-700 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <span className="text-xl sm:text-2xl">🎫</span>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  {locale === 'tr' ? 'Henüz indirim kodunuz yok' : 'No discount codes yet'}
                </h3>
                <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4">
                  {locale === 'tr' 
                    ? 'Size özel indirim kodları oluşturulduğunda burada görünecek' 
                    : 'Your discount codes will appear here when created'}
                </p>
              </div>
            )}
          </>
        )}
        
      </div>
    </div>
  );
}