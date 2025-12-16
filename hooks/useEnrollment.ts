// hooks/useEnrollment.ts
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { enrollUserInCourse, checkUserEnrollment, EnrollmentResult } from '../lib/enrollmentService';

export function useEnrollment(courseId: string) {
  const { user, isLoaded } = useUser();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check enrollment status when user and courseId are available
  useEffect(() => {
    async function checkEnrollment() {
      if (!isLoaded || !user || !courseId) {
        setEnrollmentChecked(true);
        return;
      }

      try {
        console.log('Checking enrollment for user:', user.id, 'course:', courseId);
        const enrolled = await checkUserEnrollment(user.id, courseId);
        console.log('Enrollment status:', enrolled);
        setIsEnrolled(enrolled);
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
        requiresAuth: true
      };
    }

    if (!courseId) {
      return {
        success: false,
        message: 'Course ID is required'
      };
    }

    setIsEnrolling(true);
    setError(null);

    try {
      console.log('Starting enrollment process...');
      const result = await enrollUserInCourse(user.id, courseId);
      
      console.log('Enrollment result:', result);

      if (result.success) {
        setIsEnrolled(true);
        setError(null);
      } else {
        setError(result.message);
        console.error('Enrollment failed:', result.error);
      }

      return result;
    } catch (err) {
      console.error('Unexpected enrollment error:', err);
      const errorMessage = 'An unexpected error occurred during enrollment';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        error: err
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
    // Helper function to refresh enrollment status
    refreshEnrollment: async () => {
      if (user && courseId) {
        setEnrollmentChecked(false);
        const enrolled = await checkUserEnrollment(user.id, courseId);
        setIsEnrolled(enrolled);
        setEnrollmentChecked(true);
      }
    }
  };
}