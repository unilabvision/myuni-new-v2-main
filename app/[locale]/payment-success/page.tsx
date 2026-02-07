// app/[locale]/payment-success/page.tsx
"use client";

import React, { useEffect, useState, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Play, BookOpen } from 'lucide-react';
import supabase from '../../_services/supabaseClient';

interface PaymentSuccessPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Dil metinleri
const texts = {
  tr: {
    congratulations: "Tebrikler! Satın Alma İşlemi Başarılı!",
    courseAdded: "kursunuz hesabınıza tanımlanmıştır.",
    orderSummary: "Sipariş Özeti",
    freeDiscount: "%100 İndirim Uygulandı",
    startNow: "Kursunuza hemen başlayabilir veya dilediğiniz zaman hesabınızdan erişebilirsiniz.",
    support: "Sorularınız için destek ekibimizle iletişime geçebilirsiniz.",
    goToCourse: "Kursa Git",
    myCourses: "Kurslarım",
    needHelp: "Desteğe ihtiyacınız varsa",
    contactUs: "bizimle iletişime geçin",
    loading: "Yükleniyor...",
    thankYou: "Teşekkürler!",
    enjoyLearning: "İyi öğrenmeler dileriz!",
    courseAccess: "📚 Kursa Nasıl Erişirim?",
    courseAccessDesc: "Hesabınızdan \"Kurslarım\" bölümüne giderek tüm kurslarınızı görüntüleyebilir ve istediğiniz zaman eğitimlere devam edebilirsiniz.",
    certificate: "🏆 Sertifika Kazanma",
    certificateDesc: "Kursu %100 tamamladığınızda dijital sertifikanızı otomatik olarak kazanacak ve indirebileceksiniz.",
    errorFetchingCourse: "Kurs bilgileri alınırken hata oluştu",
    course: "Kurs"
  },
  en: {
    congratulations: "Congratulations! Purchase Successful",
    courseAdded: "course has been added to your account.",
    orderSummary: "Order Summary",
    freeDiscount: "100% Discount Applied",
    startNow: "You can start your course immediately or access it from your account anytime.",
    support: "You can contact our support team for any questions.",
    goToCourse: "Go to Course",
    myCourses: "My Courses",
    needHelp: "If you need support",
    contactUs: "contact us",
    loading: "Loading...",
    thankYou: "Thank you!",
    enjoyLearning: "Happy learning!",
    courseAccess: "📚 How to Access Course?",
    courseAccessDesc: "You can view all your courses and continue learning anytime by going to \"My Courses\" section in your account.",
    certificate: "🏆 Earning Certificate",
    certificateDesc: "When you complete 100% of the course, you will automatically earn and be able to download your digital certificate.",
    errorFetchingCourse: "Error fetching course information",
    course: "Course"
  }
};

// URL decode fonksiyonu
function decodeUrlString(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch (error) {
    console.error('Error decoding URL string:', error);
    return str; // Decode edilemezse orijinal string'i döndür
  }
}

function PaymentSuccessContent({ params }: PaymentSuccessPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const orderIdParam = searchParams.get('order_id');
  const courseId = searchParams.get('courseId');
  const rawCourseName = searchParams.get('name');
  const courseName = rawCourseName ? decodeUrlString(rawCourseName) : null;
  const isFreePurchase = searchParams.get('free') === 'true';
  const orderId = searchParams.get('orderId');
  const paymentId = searchParams.get('paymentId');

  const [courseSlug, setCourseSlug] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [resolvingOrder, setResolvingOrder] = useState(!!orderIdParam && !courseId);
  
  const resolvedParams = use(params);
  const { locale } = resolvedParams;
  const t = texts[locale as keyof typeof texts] || texts.tr;
  
  // Shopier link: order_id ile geldiyse önce siparişten courseId al, sonra aynı sayfaya courseId ile yönlendir
  useEffect(() => {
    if (!orderIdParam || courseId) {
      if (orderIdParam && courseId) setResolvingOrder(false);
      return;
    }

    setResolvingOrder(true);
    const resolveOrderAndRedirect = async () => {
      try {
        const res = await fetch(`/api/order-by-id?order_id=${encodeURIComponent(orderIdParam)}`);
        const data = await res.json();
        if (data.success && data.courseId) {
          const params = new URLSearchParams(window.location.search);
          params.set('courseId', data.courseId);
          if (data.courseName) params.set('name', encodeURIComponent(data.courseName));
          params.set('orderId', orderIdParam);
          params.delete('order_id');
          window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
          window.location.reload();
        } else {
          setResolvingOrder(false);
        }
      } catch (e) {
        console.error('Order resolve error:', e);
        setResolvingOrder(false);
        setLoadingCourse(false);
      }
    };

    resolveOrderAndRedirect();
  }, [orderIdParam, courseId]);

  // Kurs bilgilerini courseId'den al (slug ve title)
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!courseId) {
        setLoadingCourse(false);
        return;
      }

      try {
        console.log('Fetching course data for courseId:', courseId);
        
        const { data: courseData, error } = await supabase
          .from('myuni_courses')
          .select('slug, title')
          .eq('id', courseId)
          .single();

        if (error) {
          console.error('Error fetching course data:', error);
          setLoadingCourse(false);
          return;
        }

        console.log('Course data fetched:', courseData);
        setCourseSlug(courseData.slug);
        setCourseTitle(courseData.title);
      } catch (error) {
        console.error('Error in fetchCourseData:', error);
      } finally {
        setLoadingCourse(false);
      }
    };

    fetchCourseData();
  }, [courseId]);
  
  useEffect(() => {
    console.log('Payment Success Page - Parameters:', { 
      courseId, 
      courseName, 
      courseTitle,
      isFreePurchase, 
      orderId, 
      paymentId,
      courseSlug
    });
    
    // Kullanıcı oturum açmamışsa oturum açma sayfasına yönlendir
    if (isLoaded && !user) {
      console.log('No user found, redirecting to sign-in');
      router.push(`/${locale}/sign-in`);
    }
    
    // Kurs ID yoksa (ve order_id ile çözüm beklenmiyorsa) kurslar sayfasına yönlendir
    if (!courseId && !orderIdParam) {
      console.log('No courseId found, redirecting to courses');
      const courseType = locale === 'tr' ? 'kurs' : 'course';
      router.push(`/${locale}/${courseType}`);
    }
  }, [isLoaded, user, courseId, orderIdParam, router, locale, courseSlug, courseName, courseTitle, isFreePurchase, orderId, paymentId]);
  
  if (!isLoaded || loadingCourse || resolvingOrder || (!courseId && !orderIdParam)) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm font-light">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Kurs slug'ı bulunamazsa hata göster
  if (!courseSlug) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto text-center">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            {t.errorFetchingCourse}
          </h2>
          <div className="flex gap-4 justify-center mt-6">
            <Link 
              href={`/${locale}/dashboard`}
              className="px-6 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm"
            >
              {t.myCourses}
            </Link>
            <Link 
              href={`/${locale}/${locale === 'tr' ? 'kurs' : 'course'}`}
              className="px-6 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg text-sm border border-neutral-300 dark:border-neutral-600"
            >
              Kurslar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Gösterilecek kurs ismini belirle (öncelik sırası: courseTitle > decoded courseName > fallback)
  const displayCourseName = courseTitle || courseName || "MyUNI Eğitimi";
  
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-900 py-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-6">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          
          {/* Success Message */}
          <h1 className="text-2xl font-medium text-neutral-800 dark:text-neutral-200 mb-2">
            {t.congratulations}
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 mb-8">
            <span className="font-medium">{displayCourseName}</span> {t.courseAdded}
          </p>
          
          {/* Order Summary Card */}
          <div className="bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-neutral-700 dark:text-neutral-300 mb-4">{t.orderSummary}</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-600 dark:text-neutral-400">{t.course}:</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {displayCourseName}
                </span>
              </div>
              
              {orderId && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Sipariş No:</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-mono text-sm">
                    {orderId}
                  </span>
                </div>
              )}
              
              {paymentId && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Ödeme ID:</span>
                  <span className="text-neutral-800 dark:text-neutral-200 font-mono text-sm">
                    {paymentId}
                  </span>
                </div>
              )}
              
              {isFreePurchase && (
                <div className="mt-4">
                  <span className="inline-block text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                    {t.freeDiscount}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-3">
              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-2">
                  {t.startNow}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  {t.support}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link 
              href={`/${locale}/watch/course/${courseSlug}`} 
              className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 px-8 py-3 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center font-medium"
            >
              <Play size={16} className="mr-2" fill="currentColor" />
              {t.goToCourse}
              <ArrowRight size={16} className="ml-2" />
            </Link>
            
            <Link 
              href={`/${locale}/dashboard`} 
              className="bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-8 py-3 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors border border-neutral-300 dark:border-neutral-600 flex items-center"
            >
              {t.myCourses}
            </Link>
          </div>
          
          {/* Thank You Message */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              {t.thankYou}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {t.enjoyLearning}
            </p>
            
            {/* Support Link */}
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {t.needHelp},{" "}
              <Link 
                href="https://support.myunilab.net" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors underline"
              >
                {t.contactUs}
              </Link>
              .
            </p>
          </div>
        </div>
        
        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Erişim Bilgisi */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3">
              {t.courseAccess}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t.courseAccessDesc}
            </p>
          </div>
          
          {/* Sertifika Bilgisi */}
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <h4 className="font-medium text-neutral-800 dark:text-neutral-200 mb-3">
              {t.certificate}
            </h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t.certificateDesc}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage({ params }: PaymentSuccessPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center">
        <div className="p-8 max-w-md w-full mx-auto">
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-neutral-200 dark:border-neutral-700 border-t-neutral-800 dark:border-t-neutral-300 rounded-full animate-spin"></div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400 text-sm font-light">Yükleniyor...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent params={params} />
    </Suspense>
  );
}