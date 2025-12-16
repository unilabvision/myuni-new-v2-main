// lib/eventEnrollmentService.ts
import { supabase } from './supabase';

export interface EventEnrollment {
  id: string;
  user_id: string;
  event_id: string;
  enrolled_at: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
  welcome_shown?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Event {
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
  current_attendees?: number; // Bu alan artık dinamik olarak hesaplanacak
  thumbnail_url?: string;
  banner_url?: string;
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  is_active: boolean;
  is_registration_open?: boolean;
  registration_deadline?: string;
}

export interface UserEventEnrollmentWithEvent {
  id: string;
  user_id: string;
  event_id: string;
  enrolled_at: string;
  attendance_status: 'registered' | 'attended' | 'no_show';
  welcome_shown?: boolean;
  notes?: string;
  event: Event;
}

export interface EventEnrollmentResult {
  success: boolean;
  message: string;
  enrollment?: EventEnrollment;
  requiresAuth?: boolean;
  error?: unknown;
}

interface EventEnrollmentStatus {
  isEnrolled: boolean;
  welcomeShown: boolean;
  enrollmentId?: string;
  attendanceStatus?: 'registered' | 'attended' | 'no_show';
}

// Import getEventAttendeeCount from eventUtils
import { getEventAttendeeCount } from './eventUtils';

// Kullanıcının etkinliğe kayıtlı olup olmadığını ve welcome'u görup görmediğini kontrol et
export async function checkUserEventEnrollmentStatus(userId: string, eventId: string): Promise<EventEnrollmentStatus> {
  try {
    console.log('Checking event enrollment status for:', { userId, eventId });

    // First try including welcome_shown (new schema)
    let { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select('id, welcome_shown, attendance_status')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    // If the column doesn't exist, fallback to legacy schema (error code 42703: undefined_column)
    if (error && (error as any).code === '42703') {
      const fallback = await supabase
        .from('myuni_event_enrollments')
        .select('id, attendance_status')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();
      data = fallback.data as any;
      error = fallback.error as any;
    }

    if (error) {
      if ((error as any).code === 'PGRST116') {
        console.log('No event enrollment found');
        return { isEnrolled: false, welcomeShown: false };
      }
      throw error;
    }

    console.log('Event enrollment status found:', data);
    return {
      isEnrolled: true,
      welcomeShown: (data as any).welcome_shown ?? false,
      enrollmentId: (data as any).id,
      attendanceStatus: (data as any).attendance_status
    };

  } catch (error) {
    console.error('Error checking event enrollment status:', error);
    return { isEnrolled: false, welcomeShown: false };
  }
}

// Event Welcome'u gösterildi olarak işaretle

// Event Welcome'u gösterildi olarak işaretle - Improved version
export async function markEventWelcomeAsShown(userId: string, eventId: string): Promise<boolean> {
  try {
    console.log('Marking event welcome as shown for:', { userId, eventId });

    // First, check if the enrollment exists
    const { data: enrollment, error: checkError } = await supabase
      .from('myuni_event_enrollments')
      .select('id, welcome_shown')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (checkError) {
      if ((checkError as any).code === 'PGRST116') {
        console.error('No enrollment found for user and event');
        return false;
      }
      console.error('Error checking enrollment:', checkError);
      return false;
    }

    if (!enrollment) {
      console.error('No enrollment data found');
      return false;
    }

    // If welcome_shown is already true, no need to update
    if ((enrollment as any).welcome_shown === true) {
      console.log('Welcome already marked as shown');
      return true;
    }

    // Try to update welcome_shown
    const { error: updateError } = await supabase
      .from('myuni_event_enrollments')
      .update({ welcome_shown: true })
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (updateError) {
      // Check for specific error types
      if ((updateError as any).code === '42703') {
        console.warn('welcome_shown column not found; treating as legacy schema - operation considered successful');
        return true;
      }
      
      if ((updateError as any).code === '42501') {
        console.error('Permission denied when updating welcome_shown');
        return false;
      }

      console.error('Error updating welcome_shown:', {
        code: (updateError as any).code,
        message: updateError.message,
        details: (updateError as any).details,
        hint: (updateError as any).hint
      });
      return false;
    }

    console.log('Event welcome marked as shown successfully');
    return true;

  } catch (error) {
    console.error('Unexpected error marking event welcome as shown:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

// Mevcut checkUserEventEnrollment fonksiyonu (geriye dönük uyumluluk için)
export async function checkUserEventEnrollment(userId: string, eventId: string): Promise<boolean> {
  const status = await checkUserEventEnrollmentStatus(userId, eventId);
  return status.isEnrolled;
}

export async function enrollUserInEvent(userId: string, eventId: string): Promise<EventEnrollmentResult> {
  try {
    console.log('Enrolling user in event:', { userId, eventId });

    // Validate inputs
    if (!userId || !eventId) {
      return {
        success: false,
        message: 'Missing user ID or event ID',
        error: 'MISSING_PARAMS'
      };
    }

    // Check if user is already enrolled using new function
    console.log('Checking existing event enrollment...');
    const enrollmentStatus = await checkUserEventEnrollmentStatus(userId, eventId);
    
    if (enrollmentStatus.isEnrolled) {
      console.log('User already enrolled in event');
      return {
        success: true,
        message: 'Already enrolled'
      };
    }

    // Verify event exists and is open for registration
    console.log('Verifying event exists and is open...');
    const { data: event, error: eventError } = await supabase
      .from('myuni_events')
      .select('id, slug, title, description, start_date, end_date, is_online, meeting_url, location_name, organizer_name, max_attendees, is_registration_open, registration_deadline, status')
      .eq('id', eventId)
      .eq('is_active', true)
      .single();

    if (eventError || !event) {
      console.error('Event verification error:', eventError);
      return {
        success: false,
        message: 'Event not found or inactive',
        error: eventError
      };
    }

    console.log('Event found:', event);

    // Check if registration is still open
    if (!event.is_registration_open) {
      return {
        success: false,
        message: 'Registration is closed for this event'
      };
    }

    // Check if registration deadline has passed
    if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
      return {
        success: false,
        message: 'Registration deadline has passed'
      };
    }

    // Get current attendee count dynamically
    const currentAttendeeCount = await getEventAttendeeCount(eventId);

    // Check if event is full
    if (event.max_attendees && currentAttendeeCount >= event.max_attendees) {
      return {
        success: false,
        message: 'Event is full'
      };
    }

    // Check if event is still upcoming or ongoing
    if (event.status === 'completed' || event.status === 'cancelled') {
      return {
        success: false,
        message: `Event is ${event.status}`
      };
    }

    // Create new enrollment with welcome_shown = false
    console.log('Creating new event enrollment...');
    const enrollmentData = {
      user_id: userId,
      event_id: eventId,
      enrolled_at: new Date().toISOString(),
      attendance_status: 'registered' as const,
      welcome_shown: false
    };

    console.log('Event enrollment data:', enrollmentData);

    const { data: enrollment, error: enrollError } = await supabase
      .from('myuni_event_enrollments')
      .insert(enrollmentData)
      .select('*')
      .single();

    console.log('Event insert result:', { enrollment, enrollError });

    if (enrollError) {
      console.error('Event enrollment insert error:', enrollError);
      return {
        success: false,
        message: 'Failed to create event enrollment',
        error: enrollError
      };
    }

    console.log('Successfully enrolled user in event');
    return {
      success: true,
      message: 'Successfully enrolled',
      enrollment: enrollment as EventEnrollment
    };

  } catch (error) {
    console.error('Unexpected error enrolling user in event:', error);
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

// Kullanıcının etkinlik katılım durumunu güncelle
export async function updateEventAttendanceStatus(
  userId: string, 
  eventId: string, 
  attendanceStatus: 'registered' | 'attended' | 'no_show',
  notes?: string
): Promise<boolean> {
  try {
    console.log('Updating event attendance status:', { userId, eventId, attendanceStatus });
    
    const updateData: Partial<EventEnrollment> = { 
      attendance_status: attendanceStatus
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const { error } = await supabase
      .from('myuni_event_enrollments')
      .update(updateData)
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (error) {
      console.error('Error updating event attendance status:', error);
      return false;
    }

    console.log('Event attendance status updated successfully');
    return true;

  } catch (error) {
    console.error('Error updating event attendance status:', error);
    return false;
  }
}

// Kullanıcının tüm etkinlik kayıtlarını getir (current_attendees dinamik hesaplanacak)
export async function getUserEventEnrollments(userId: string): Promise<UserEventEnrollmentWithEvent[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select(`
        *,
        event:myuni_events(*)
      `)
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false });

    if (error) {
      console.error('Error fetching user event enrollments:', error);
      return [];
    }

    // Her etkinlik için dinamik katılımcı sayısını hesapla
    const enrollmentsWithDynamicCount = await Promise.all(
      (data || []).map(async (enrollment: any) => {
        if (enrollment.event) {
          const attendeeCount = await getEventAttendeeCount(enrollment.event.id);
          enrollment.event.current_attendees = attendeeCount;
        }
        return enrollment;
      })
    );

    return enrollmentsWithDynamicCount as UserEventEnrollmentWithEvent[];
  } catch (error) {
    console.error('Unexpected error fetching event enrollments:', error);
    return [];
  }
}

// Kullanıcının yaklaşan etkinliklerini getir
export async function getUserUpcomingEvents(userId: string): Promise<UserEventEnrollmentWithEvent[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select(`
        *,
        event:myuni_events(*)
      `)
      .eq('user_id', userId)
      .eq('myuni_events.status', 'upcoming')
      .gte('myuni_events.start_date', new Date().toISOString())
      .order('myuni_events.start_date', { ascending: true });

    if (error) {
      console.error('Error fetching user upcoming events:', error);
      return [];
    }

    // Her etkinlik için dinamik katılımcı sayısını hesapla
    const eventsWithDynamicCount = await Promise.all(
      (data || []).map(async (enrollment: any) => {
        if (enrollment.event) {
          const attendeeCount = await getEventAttendeeCount(enrollment.event.id);
          enrollment.event.current_attendees = attendeeCount;
        }
        return enrollment;
      })
    );

    return eventsWithDynamicCount as UserEventEnrollmentWithEvent[];
  } catch (error) {
    console.error('Unexpected error fetching upcoming events:', error);
    return [];
  }
}

// Kullanıcının geçmiş etkinliklerini getir
export async function getUserPastEvents(userId: string): Promise<UserEventEnrollmentWithEvent[]> {
  try {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select(`
        *,
        event:myuni_events(*)
      `)
      .eq('user_id', userId)
      .eq('myuni_events.status', 'completed')
      .order('myuni_events.start_date', { ascending: false });

    if (error) {
      console.error('Error fetching user past events:', error);
      return [];
    }

    // Her etkinlik için dinamik katılımcı sayısını hesapla
    const eventsWithDynamicCount = await Promise.all(
      (data || []).map(async (enrollment: any) => {
        if (enrollment.event) {
          const attendeeCount = await getEventAttendeeCount(enrollment.event.id);
          enrollment.event.current_attendees = attendeeCount;
        }
        return enrollment;
      })
    );

    return eventsWithDynamicCount as UserEventEnrollmentWithEvent[];
  } catch (error) {
    console.error('Unexpected error fetching past events:', error);
    return [];
  }
}

// Etkinlikten çıkış yap
export async function unenrollFromEvent(userId: string, eventId: string): Promise<EventEnrollmentResult> {
  try {
    console.log('Unenrolling user from event:', { userId, eventId });

    // Validate inputs
    if (!userId || !eventId) {
      return {
        success: false,
        message: 'Missing user ID or event ID',
        error: 'MISSING_PARAMS'
      };
    }

    // Check if user is enrolled
    const enrollmentStatus = await checkUserEventEnrollmentStatus(userId, eventId);
    
    if (!enrollmentStatus.isEnrolled) {
      return {
        success: false,
        message: 'User is not enrolled in this event'
      };
    }

    // Delete enrollment
    const { error: deleteError } = await supabase
      .from('myuni_event_enrollments')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (deleteError) {
      console.error('Error deleting event enrollment:', deleteError);
      return {
        success: false,
        message: 'Failed to unenroll from event',
        error: deleteError
      };
    }

    // current_attendees güncelleme kaldırıldı - artık dinamik hesaplama kullanıyoruz

    console.log('Successfully unenrolled user from event');
    return {
      success: true,
      message: 'Successfully unenrolled from event'
    };

  } catch (error) {
    console.error('Unexpected error unenrolling user from event:', error);
    
    return {
      success: false,
      message: 'Unexpected error occurred',
      error: error
    };
  }
}

// Etkinlik için katılımcı listesi getir (admin/organizer için)
export async function getEventAttendees(eventId: string): Promise<any[]> {
  try {
    console.log('Fetching event attendees for:', eventId);

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select(`
        *,
        user_profiles(
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('event_id', eventId)
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Error fetching event attendees:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching event attendees:', error);
    return [];
  }
}

// Etkinlik katılım istatistiklerini getir
export async function getEventAttendanceStats(eventId: string): Promise<{
  total: number;
  registered: number;
  attended: number;
  noShow: number;
  attendanceRate: number;
}> {
  try {
    console.log('Fetching event attendance stats for:', eventId);

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select('attendance_status')
      .eq('event_id', eventId);

    if (error) {
      console.error('Error fetching event attendance stats:', error);
      return {
        total: 0,
        registered: 0,
        attended: 0,
        noShow: 0,
        attendanceRate: 0
      };
    }

    const enrollments = data || [];
    const total = enrollments.length;
    const registered = enrollments.filter(e => e.attendance_status === 'registered').length;
    const attended = enrollments.filter(e => e.attendance_status === 'attended').length;
    const noShow = enrollments.filter(e => e.attendance_status === 'no_show').length;
    const attendanceRate = total > 0 ? (attended / total) * 100 : 0;

    return {
      total,
      registered,
      attended,
      noShow,
      attendanceRate: Math.round(attendanceRate * 100) / 100 // Round to 2 decimal places
    };

  } catch (error) {
    console.error('Unexpected error fetching event attendance stats:', error);
    return {
      total: 0,
      registered: 0,
      attended: 0,
      noShow: 0,
      attendanceRate: 0
    };
  }
}

// Toplu katılım durumu güncelleme (admin için)
export async function bulkUpdateAttendanceStatus(
  eventId: string,
  updates: Array<{
    userId: string;
    attendanceStatus: 'registered' | 'attended' | 'no_show';
    notes?: string;
  }>
): Promise<{ success: boolean; message: string; updatedCount: number }> {
  try {
    console.log('Bulk updating attendance status for event:', eventId);

    let updatedCount = 0;

    for (const update of updates) {
      const success = await updateEventAttendanceStatus(
        update.userId,
        eventId,
        update.attendanceStatus,
        update.notes
      );

      if (success) {
        updatedCount++;
      }
    }

    return {
      success: true,
      message: `Updated ${updatedCount} of ${updates.length} attendance records`,
      updatedCount
    };

  } catch (error) {
    console.error('Error in bulk attendance update:', error);
    return {
      success: false,
      message: 'Failed to update attendance records',
      updatedCount: 0
    };
  }
}

// Send enrollment confirmation email via API route
export async function sendEnrollmentEmail(
  userInfo: { name: string; email: string },
  eventInfo: any,
  enrollmentInfo: { id: string; enrolled_at: string },
  locale: string = 'tr'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('/api/event-enrollment-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userInfo,
        eventInfo,
        enrollmentInfo,
        locale
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error sending enrollment email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}