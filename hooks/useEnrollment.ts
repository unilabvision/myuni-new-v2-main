// hooks/useEnrollment.ts
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface EnrollmentResult {
  success: boolean;
  message: string;
  enrollment?: unknown;
  requiresAuth?: boolean;
  error?: unknown;
}

export function useEnrollment(courseId: string) {
  const { user, isLoaded } = useUser();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkEnrollment() {
      if (!isLoaded || !user || !courseId) {
        setEnrollmentChecked(true);
        return;
      }

      try {
        const res = await fetch(
          `/api/enrollments/me?courseId=${encodeURIComponent(courseId)}`
        );
        const json = await res.json();
        setIsEnrolled(!!json.isEnrolled);
        setError(null);
      } catch (err) {
        console.error('Error checking enrollment:', err);
        setError('Failed to check enrollment status');
        setIsEnrolled(false);
      } finally {
        setEnrollmentChecked(true);
      }
    }

    checkEnrollment();
  }, [user, isLoaded, courseId]);

  const enroll = async (): Promise<EnrollmentResult> => {
    if (!user) {
      return {
        success: false,
        message: 'User not authenticated',
        requiresAuth: true,
      };
    }

    if (!courseId) {
      return {
        success: false,
        message: 'Course ID is required',
      };
    }

    setIsEnrolling(true);
    setError(null);

    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const result = await res.json();

      if (result.success) {
        setIsEnrolled(true);
        setError(null);
      } else {
        setError(result.message);
      }

      return result;
    } catch (err) {
      console.error('Unexpected enrollment error:', err);
      const errorMessage = 'An unexpected error occurred during enrollment';
      setError(errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: err,
      };
    } finally {
      setIsEnrolling(false);
    }
  };

  return {
    isEnrolled,
    isEnrolling,
    enrollmentChecked,
    error,
    enroll,
    refreshEnrollment: async () => {
      if (user && courseId) {
        setEnrollmentChecked(false);
        const res = await fetch(
          `/api/enrollments/me?courseId=${encodeURIComponent(courseId)}`
        );
        const json = await res.json();
        setIsEnrolled(!!json.isEnrolled);
        setEnrollmentChecked(true);
      }
    },
  };
}
