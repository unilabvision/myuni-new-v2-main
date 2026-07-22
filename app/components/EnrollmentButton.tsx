// app/components/EnrollmentButton.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Play, Check, Shield } from 'lucide-react';
import supabase from '../_services/supabaseClient';

interface EnrollmentButtonProps {
  courseId: string;
  courseSlug: string;
  locale: string;
  price: number;
  currency: string;
  texts: {
    enrollButton: string;
    startLearning: string;
    continueLearning: string;
    signInToEnroll: string;
    enrolling: string;
    enrolled: string;
    free: string;
    moneyBackGuarantee: string;
  };
}

export default function EnrollmentButton({
  courseId,
  courseSlug,
  locale,
  price,
  currency,
  texts
}: EnrollmentButtonProps) {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  // Kayıt durumunu kontrol et
  const checkEnrollmentStatus = useCallback(async () => {
    try {
      setCheckingEnrollment(true);

      const clerkUserId = user?.id;
      if (!clerkUserId) {
        setCheckingEnrollment(false);
        return;
      }

      const res = await fetch(
        `/api/enrollments/me?courseId=${encodeURIComponent(courseId)}`
      );
      const json = await res.json();
      setIsEnrolled(!!json.isEnrolled);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [user, courseId]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      checkEnrollmentStatus();
    } else {
      setCheckingEnrollment(false);
    }
  }, [isLoaded, isSignedIn, user, checkEnrollmentStatus]);

  const handleEnrollment = async () => {
    console.log('=== ENROLLMENT BUTTON CLICKED ===');
    console.log('Clerk User ID:', user?.id);
    console.log('User Object:', user);
    console.log('Course ID:', courseId);
    console.log('Course Slug:', courseSlug);
    console.log('Price:', price);
    console.log('Is Signed In:', isSignedIn);
    console.log('Is Enrolled:', isEnrolled);
    
    // Kullanıcı girişi kontrolü
    if (!isSignedIn || !user) {
      console.log('User not signed in, redirecting to sign-in');
      
      // Mevcut sayfayı redirect parametresi olarak ekle
      const currentPath = window.location.pathname;
      const redirectUrl = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      
      console.log('Redirecting to:', redirectUrl);
      router.push(redirectUrl);
      return;
    }

    // Zaten kayıtlı ise kursa git
    if (isEnrolled) {
      console.log('User already enrolled, redirecting to course');
      router.push(`/${locale}/watch/${courseSlug}`);
      return;
    }

    console.log('Starting enrollment process for course:', courseId, 'price:', price);
    setLoading(true);

    try {
      // Kurs detaylarını al — ödeme yalnızca Iyzico checkout üzerinden
      const { data: courseData, error: courseError } = await supabase
        .from('myuni_courses')
        .select('title, thumbnail_url, price, slug')
        .eq('id', courseId)
        .single();

      if (courseError) {
        console.error('Course fetch error:', courseError);
        alert('Kurs bilgileri alınırken hata oluştu');
        return;
      }

      console.log('Course data fetched:', courseData);

      // Ücretsiz kurs ise direkt kaydet
      if (price === 0 || courseData.price === 0) {
        console.log('Free course detected, enrolling directly');
        await enrollDirectly(courseData.title);
        return;
      }

      // Ücretli kurs - Iyzico checkout sayfasına yönlendir
      console.log('Paid course, redirecting to checkout');
      
      // Keep affiliate code and referral code if they exist
      if (typeof window !== 'undefined') {
        // Get the affiliate code from URL hash if present
        const hashValue = window.location.hash;
        console.log('EnrollmentButton: Current URL hash:', hashValue);
        
        if (hashValue && hashValue.length > 1) {
          // Remove the # character and store the discount code
          const discountCode = hashValue.substring(1);
          console.log('EnrollmentButton: Extracted discount code from hash:', discountCode);
          
          if (discountCode) {
            // Store the discount code in localStorage for use in checkout
            localStorage.setItem('myuni_affiliate_code', discountCode);
            console.log('EnrollmentButton: Affiliate discount code stored from URL hash:', discountCode);
            
            // Verify the code was stored correctly
            const storedCode = localStorage.getItem('myuni_affiliate_code');
            console.log('EnrollmentButton: Verified code in localStorage:', storedCode);
          }
        } else {
          console.log('EnrollmentButton: No hash found in URL or hash is empty');
        }
        
        // Get referral code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        console.log('EnrollmentButton: Current URL ref parameter:', refCode);
        
        if (refCode) {
          // Store the referral code in localStorage for use in checkout
          localStorage.setItem('myuni_referral_code', refCode);
          console.log('EnrollmentButton: Referral code stored from URL parameter:', refCode);
        }
      }
      
      // Build checkout URL with referral code if present
      let checkoutUrl = `/${locale}/checkout?id=${encodeURIComponent(courseId)}`;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
          checkoutUrl += `&ref=${encodeURIComponent(refCode)}`;
        }
      }
      console.log('Redirecting to:', checkoutUrl);
      
      router.push(checkoutUrl);
    } catch (error) {
      console.error('Enrollment error:', error);
      alert('Kayıt sırasında hata oluştu: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const enrollDirectly = async (courseTitle: string) => {
    try {
      console.log('Direct enrollment starting for:', courseTitle);

      const clerkUserId = user?.id;

      if (!clerkUserId) {
        console.error('No Clerk user ID found for enrollment');
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const result = await res.json();

      if (!result.success) {
        console.error('Direct enrollment error:', result);
        throw new Error(result.message || 'Enrollment failed');
      }

      console.log('Direct enrollment successful:', result);
      setIsEnrolled(true);

      // Başarı sayfasına yönlendir
      const successUrl = `/${locale}/payment-success?courseId=${encodeURIComponent(courseId)}&name=${encodeURIComponent(courseTitle)}&free=true`;
      console.log('Redirecting to success page:', successUrl);
      router.push(successUrl);
    } catch (error) {
      console.error('Direct enrollment error:', error);
      alert('Ücretsiz kursa kayıt sırasında hata oluştu: ' + (error as Error).message);
    }
  };

  // Login için redirect URL oluştur
  const createSignInUrl = () => {
    const currentPath = window.location.pathname;
    return `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
  };

  // Loading durumu
  if (!isLoaded || checkingEnrollment) {
    return (
      <button 
        disabled
        className="w-full py-3 px-6 bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 rounded-lg flex items-center justify-center"
      >
        <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mr-2"></div>
        {texts.enrolling}
      </button>
    );
  }

  // Giriş yapılmamış
  if (!isSignedIn) {
    return (
      <Link 
        href={createSignInUrl()}
        className="w-full py-3 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center"
      >
        <ShoppingCart className="w-4 h-4 mr-2" />
        {texts.signInToEnroll}
      </Link>
    );
  }

  // Zaten kayıtlı
  if (isEnrolled) {
    return (
      <div className="space-y-3">
        <button
          onClick={handleEnrollment}
          disabled={loading}
          className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <Play className="w-4 h-4 mr-2" fill="currentColor" />
          {texts.startLearning}
        </button>
        <div className="flex items-center justify-center text-sm text-green-600 dark:text-green-400">
          <Check className="w-4 h-4 mr-1" />
          {texts.enrolled}
        </div>
      </div>
    );
  }

  // Kayıt butonu
  return (
    <div className="space-y-3">
      <button
        onClick={handleEnrollment}
        disabled={loading}
        className="w-full py-3 px-6 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white dark:border-neutral-900 border-t-transparent rounded-full animate-spin mr-2"></div>
            {texts.enrolling}
          </>
        ) : (
          <>
            {price === 0 ? (
              <>
                <Play className="w-4 h-4 mr-2" fill="currentColor" />
                {texts.free} - {texts.startLearning}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {currency}{price} - {texts.enrollButton}
              </>
            )}
          </>
        )}
      </button>
      
      {price > 0 && (
        <div className="flex items-center justify-center text-sm text-neutral-600 dark:text-neutral-400">
          <Shield className="w-4 h-4 mr-1" />
          {texts.moneyBackGuarantee}
        </div>
      )}
    </div>
  );
}