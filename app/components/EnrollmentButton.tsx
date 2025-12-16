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
      
      // Clerk user objesini tamamen debug et
      console.log('=== CLERK USER DEBUG ===');
      console.log('Full user object:', user);
      console.log('user.id:', user?.id);
      console.log('user.primaryEmailAddress?.emailAddress:', user?.primaryEmailAddress?.emailAddress);
      console.log('user.emailAddresses:', user?.emailAddresses);
      console.log('user.externalId:', user?.externalId);
      console.log('========================');
      
      // Clerk user ID'sini doğru şekilde al
      const clerkUserId = user?.id;
      console.log('Using Clerk user ID for enrollment check:', clerkUserId, 'course:', courseId);
      
      if (!clerkUserId) {
        console.log('No Clerk user ID found');
        setCheckingEnrollment(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('myuni_enrollments')
        .select('id, is_active')
        .eq('user_id', clerkUserId) // Clerk user ID kullan
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Enrollment check error:', error);
        return;
      }

      console.log('Enrollment check result:', data);
      setIsEnrolled(!!data);
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
      const redirectUrl = `/${locale}/sign-in?redirect=${encodeURIComponent(currentPath)}`;
      
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
      // Kurs detaylarını al
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

      // Ücretli kurs - checkout sayfasına yönlendir
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
      
      // Clerk user objesini tamamen debug et
      console.log('=== ENROLLMENT USER DEBUG ===');
      console.log('Full user object:', user);
      console.log('user.id:', user?.id);
      console.log('user.primaryEmailAddress?.emailAddress:', user?.primaryEmailAddress?.emailAddress);
      console.log('user.emailAddresses:', user?.emailAddresses);
      console.log('user.externalId:', user?.externalId);
      console.log('typeof user.id:', typeof user?.id);
      console.log('==============================');
      
      // Clerk user ID'sini doğru şekilde al
      const clerkUserId = user?.id;
      
      if (!clerkUserId) {
        console.error('No Clerk user ID found for enrollment');
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }

      // ID'nin gerçekten Clerk ID olduğunu doğrula
      if (clerkUserId.includes('@') || !clerkUserId.startsWith('user_')) {
        console.error('WARNING: This does not look like a valid Clerk user ID:', clerkUserId);
        console.error('Expected format: user_xxxxxxxxxx but got:', clerkUserId);
      }

      console.log('Using Clerk User ID for enrollment:', clerkUserId);
      console.log('Clerk User ID type:', typeof clerkUserId);
      console.log('Clerk User ID length:', clerkUserId.length);
      
      // Önce mevcut kaydı kontrol et
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('myuni_enrollments')
        .select('id, is_active')
        .eq('user_id', clerkUserId) // Clerk user ID kullan
        .eq('course_id', courseId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Existing enrollment check error:', checkError);
        throw checkError;
      }

      if (existingEnrollment && existingEnrollment.is_active) {
        console.log('User already enrolled, updating state');
        setIsEnrolled(true);
        router.push(`/${locale}/watch/${courseSlug}`);
        return;
      }

      // Yeni kayıt oluştur veya eskisini aktif et
      if (existingEnrollment && !existingEnrollment.is_active) {
        // Mevcut kaydı aktif et
        console.log('Reactivating existing enrollment:', existingEnrollment.id);
        const { error: updateError } = await supabase
          .from('myuni_enrollments')
          .update({
            is_active: true,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0
          })
          .eq('id', existingEnrollment.id);

        if (updateError) {
          console.error('Enrollment update error:', updateError);
          throw updateError;
        }

        console.log('Existing enrollment reactivated successfully');
      } else {
        // Yeni kayıt oluştur
        console.log('Creating new enrollment with Clerk User ID:', clerkUserId);
        
        const enrollmentData = {
          user_id: clerkUserId, // Clerk user ID'sini doğru şekilde kullan
          course_id: courseId,
          enrolled_at: new Date().toISOString(),
          progress_percentage: 0,
          is_active: true
        };

        console.log('Enrollment data to insert:', enrollmentData);

        const { data, error } = await supabase
          .from('myuni_enrollments')
          .insert(enrollmentData)
          .select()
          .single();

        if (error) {
          console.error('Direct enrollment error:', error);
          console.error('Error details:', error.details);
          console.error('Error hint:', error.hint);
          console.error('Error message:', error.message);
          throw error;
        }

        console.log('Direct enrollment successful:', data);
      }

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
    return `/${locale}/sign-in?redirect=${encodeURIComponent(currentPath)}`;
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