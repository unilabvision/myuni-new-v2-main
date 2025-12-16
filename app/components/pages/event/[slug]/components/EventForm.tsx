// app/components/pages/event/[slug]/components/EventForm.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { supabase } from '../../../../../../lib/supabase';
import { getEventAttendeeCount } from '../../../../../../lib/eventUtils';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

interface Event {
  id: string;
  slug: string;
  title: string;
  is_paid: boolean;
  price: number | null;
  max_attendees: number | null;
  current_attendees: number;
  is_registration_open: boolean;
  registration_deadline: string | null;
  is_online: boolean;
  meeting_url: string | null;
}

interface EventFormProps {
  event: Event;
  locale: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  onAttendeesChange?: (newCount: number) => void;
}

const EventForm: React.FC<EventFormProps> = ({ 
  event, 
  locale, 
  onSuccess, 
  onError,
  onAttendeesChange
}) => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [attendeesCount, setAttendeesCount] = useState<number>(event.current_attendees);

  // Check if user is already registered
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  React.useEffect(() => {
    if (isSignedIn && user && event.id) {
      checkRegistrationStatus();
    } else {
      setCheckingRegistration(false);
    }
  }, [isSignedIn, user, event.id]);

  // Katılımcı sayısını dinamik olarak güncelle
  const updateAttendeeCount = async () => {
    try {
      const realCount = await getEventAttendeeCount(event.id);
      setAttendeesCount(realCount);
      onAttendeesChange?.(realCount);
    } catch (error) {
      console.error('Error updating attendee count:', error);
    }
  };

  const checkRegistrationStatus = async () => {
    try {
      setCheckingRegistration(true);
      
      const { data, error } = await supabase
        .from('myuni_event_enrollments')
        .select('id, attendance_status')
        .eq('user_id', user?.id)
        .eq('event_id', event.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error checking registration:', error);
      }

      setIsRegistered(!!data);
      
      // Her kontrol sırasında katılımcı sayısını da güncelle
      await updateAttendeeCount();
    } catch (error) {
      console.error('Error checking registration status:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleRegistration = async () => {
    if (!isSignedIn) {
      const currentPath = window.location.pathname;
      const redirectUrl = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Check if registration is still open
    if (!event.is_registration_open) {
      onError?.(locale === 'tr' ? 'Kayıt alımı sona ermiştir.' : 'Registration is closed.');
      return;
    }

    // Güncel katılımcı sayısını kontrol et
    const currentRealCount = await getEventAttendeeCount(event.id);
    
    // Check if event is full
    if (event.max_attendees && currentRealCount >= event.max_attendees) {
      onError?.(locale === 'tr' ? 'Etkinlik dolu.' : 'Event is full.');
      await updateAttendeeCount(); // UI'ı güncelle
      return;
    }

    // Check registration deadline
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      const now = new Date();
      if (now > deadline) {
        onError?.(locale === 'tr' ? 'Kayıt son tarihi geçmiştir.' : 'Registration deadline has passed.');
        return;
      }
    }

    // Handle paid events
    if (event.is_paid && event.price && event.price > 0) {
      const checkoutUrl = `/${locale}/checkout/event?id=${encodeURIComponent(event.id)}`;
      router.push(checkoutUrl);
      return;
    }

    // Handle free events - direct registration
    await registerForFreeEvent();
  };

  const registerForFreeEvent = async () => {
    if (!user?.id || !event.id) {
      onError?.(locale === 'tr' ? 'Kullanıcı bilgisi bulunamadı.' : 'User information not found.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get user email from Clerk
      let userEmail = '';
      let userName = '';
      
      // Method 1: Try to get from Clerk user object
      if (user?.emailAddresses && user.emailAddresses.length > 0) {
        userEmail = user.emailAddresses[0].emailAddress;
        userName = user.fullName || user.firstName || user.emailAddresses[0].emailAddress.split('@')[0];
        console.log('✅ Got email from Clerk user:', userEmail);
      }
      
      // Method 2: Try to get from Clerk user metadata
      if (!userEmail && user?.publicMetadata?.email) {
        userEmail = user.publicMetadata.email as string;
        userName = user.fullName || user.firstName || userEmail.split('@')[0];
        console.log('✅ Got email from Clerk metadata:', userEmail);
      }
      
      // Method 3: Try to get from Supabase auth (fallback)
      if (!userEmail) {
        try {
          const { data: { user: authUser }, error } = await supabase.auth.getUser();
          if (!error && authUser?.email) {
            userEmail = authUser.email;
            userName = authUser.user_metadata?.full_name || authUser.email.split('@')[0];
            console.log('✅ Got email from Supabase auth:', userEmail);
          }
        } catch (authError) {
          console.log('❌ Error getting user from Supabase auth:', authError);
        }
      }
      
      // Fallback
      if (!userEmail) {
        userEmail = 'user@example.com';
        userName = 'Kullanıcı';
        console.log('❌ No email found, using fallback');
      }
      
      const requestBody = {
        userId: user.id,
        eventId: event.id,
        locale: locale,
        userEmail: userEmail,
        userName: userName
      };
      
      console.log('Sending enrollment request:', requestBody);
      
      // Use API endpoint for enrollment with email sending
      const response = await fetch('/api/event-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (!response.ok) {
        console.error('API Response Status:', response.status);
        console.error('API Response:', result);
        
        if (result?.error === 'User is already enrolled in this event') {
          onError?.(locale === 'tr' ? 'Bu etkinliğe zaten kayıtlısınız.' : 'You are already registered for this event.');
        } else if (result?.error === 'Event is full') {
          onError?.(locale === 'tr' ? 'Etkinlik dolu.' : 'Event is full.');
        } else if (result?.error === 'Registration is closed for this event') {
          onError?.(locale === 'tr' ? 'Kayıt alımı sona ermiştir.' : 'Registration is closed.');
        } else if (result?.error === 'Registration deadline has passed') {
          onError?.(locale === 'tr' ? 'Kayıt son tarihi geçmiştir.' : 'Registration deadline has passed.');
        } else if (result?.error === 'Event not found or inactive') {
          onError?.(locale === 'tr' ? 'Etkinlik bulunamadı.' : 'Event not found.');
        } else if (result?.error === 'Failed to fetch user profile') {
          onError?.(locale === 'tr' ? 'Kullanıcı bilgileri alınamadı.' : 'Failed to fetch user profile.');
        } else {
          console.error('Registration error:', result);
          onError?.(locale === 'tr' ? 'Kayıt sırasında bir hata oluştu.' : 'An error occurred during registration.');
        }
        return;
      }

      // Katılımcı sayısını dinamik olarak güncelle
      await updateAttendeeCount();

      // Success
      setIsRegistered(true);
      setShowSuccess(true);
      onSuccess?.();

    } catch (error) {
      console.error('Registration error:', error);
      onError?.(locale === 'tr' ? 'Kayıt sırasında bir hata oluştu.' : 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (checkingRegistration) {
    return (
      <button 
        disabled
        className="w-full bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-sm font-medium flex items-center justify-center"
      >
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        {locale === 'tr' ? 'Kontrol ediliyor...' : 'Checking...'}
      </button>
    );
  }

  // Inline toast (render helper)
  const renderSuccessToast = () => {
    if (!showSuccess) return null;
    return (
      <div 
        className="absolute -top-28 left-1/2 transform -translate-x-1/2 z-40"
        style={{
          animation: 'slideInFromTop 0.4s ease-out forwards'
        }}
      >
        <style jsx>{`
          @keyframes slideInFromTop {
            0% {
              transform: translate(-50%, -20px);
              opacity: 0;
            }
            100% {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}</style>
        <div className="flex items-start space-x-3 bg-white dark:bg-neutral-800 border border-green-300 dark:border-green-700 rounded-md shadow-lg px-4 py-3 min-w-80">
          <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-sm flex-1">
            <div className="font-medium text-neutral-900 dark:text-neutral-100">
              {locale === 'tr' ? 'Kaydınız başarı ile alınmıştır!' : 'Registration successful!'}
            </div>
            <div className="text-neutral-600 dark:text-neutral-300 mt-1">
              {locale === 'tr' 
                ? 'Aşağıdan etkinlikle ilgili detaylara ulaşabilirsiniz.'
                : 'You can access event details below.'}
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={() => setShowSuccess(false)}
            className="ml-2 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100 text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Already registered state
  if (isRegistered) {
    return (
      <div className="relative inline-flex w-full">
        {renderSuccessToast()}
        <button 
          onClick={() => router.push(`/${locale}/watch/event/${event.slug}`)}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-sm font-medium transition-colors"
        >
          {locale === 'tr' ? 'Etkinliğe Git' : 'Go to Event'}
        </button>
      </div>
    );
  }

  // Registration closed state
  if (!event.is_registration_open) {
    return (
      <div className="space-y-2">
        <button 
          disabled
          className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-sm font-medium cursor-not-allowed flex items-center justify-center"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Kayıt Kapalı' : 'Registration Closed'}
        </button>
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
          {locale === 'tr' ? 
            'Bu etkinlik için kayıt alımı sona ermiştir.' : 
            'Registration for this event has ended.'
          }
        </p>
      </div>
    );
  }

  // Event full state - Dinamik katılımcı sayısını kullan
  if (event.max_attendees && attendeesCount >= event.max_attendees) {
    return (
      <div className="space-y-2">
        <button 
          disabled
          className="w-full bg-neutral-300 dark:bg-neutral-600 text-neutral-500 dark:text-neutral-400 py-3 px-6 rounded-sm font-medium cursor-not-allowed flex items-center justify-center"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          {locale === 'tr' ? 'Etkinlik Dolu' : 'Event Full'}
        </button>
        <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
          {locale === 'tr' ? 
            'Bu etkinlik için maksimum katılımcı sayısına ulaşılmıştır.' : 
            'Maximum capacity reached for this event.'
          }
        </p>
      </div>
    );
  }

  // (success overlay moved earlier)

  // Registration button
  return (
    <div className="relative inline-flex w-full">
      {renderSuccessToast()}
      <button 
        onClick={handleRegistration}
        disabled={isSubmitting}
        className="w-full bg-neutral-800 hover:bg-[#990000] dark:bg-neutral-700 dark:hover:bg-[#990000] text-white py-3 px-6 rounded-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            {locale === 'tr' ? 'Kayıt Yapılıyor...' : 'Registering...'}
          </>
        ) : (
          <>
            {!isSignedIn ? 
              (locale === 'tr' ? 'Kayıt Ol/Giriş Yap' : 'Register/Sign In') : 
              (!event.is_paid || event.price === 0 ? 
                (locale === 'tr' ? 'Ücretsiz Kayıt Ol' : 'Register for Free') : 
                (locale === 'tr' ? 'Etkinliğe Kayıt Ol' : 'Register for Event')
              )
            }
          </>
        )}
      </button>
    </div>
  );
};

export default EventForm;