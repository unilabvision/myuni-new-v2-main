// lib/eventService.ts - Revised functions for new myuni_event_user_progress table

import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import {
  getUserEventProgress as apiGetUserEventProgress,
  getUserEventLessonProgress as apiGetUserEventLessonProgress,
  updateUserEventProgress as apiUpdateUserEventProgress,
  markEventLessonCompleted as apiMarkEventLessonCompleted,
  getEventCompletionStats as apiGetEventCompletionStats,
  getLatestEventQuizResult as apiGetLatestEventQuizResult,
  saveEventQuizResult as apiSaveEventQuizResult,
  getEventAnalytics as apiGetEventAnalytics,
} from './eventProgressApi';

/**
 * Enrollment counts for event lists.
 * Must NOT import supabaseAdmin (server-only) — this module is used by client components.
 */
async function fetchEventEnrollmentCountMap(eventIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!eventIds.length) return map;

  try {
    if (typeof window === 'undefined') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceKey) {
        console.warn('Missing SUPABASE_SERVICE_ROLE_KEY for event enrollment counts');
        return map;
      }
      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await admin
        .from('myuni_event_enrollments')
        .select('event_id')
        .in('event_id', eventIds);
      if (error) {
        console.error('Error fetching enrollment counts:', error);
        return map;
      }
      (data || []).forEach((row) => {
        const id = row.event_id as string;
        map.set(id, (map.get(id) || 0) + 1);
      });
      return map;
    }

    const res = await fetch(
      `/api/event-enrollments/counts?eventIds=${encodeURIComponent(eventIds.join(','))}`
    );
    const json = await res.json();
    if (json.success && json.counts) {
      Object.entries(json.counts as Record<string, number>).forEach(([id, count]) => {
        map.set(id, Number(count) || 0);
      });
    }
  } catch (error) {
    console.error('Error fetching enrollment counts:', error);
  }
  return map;
}

// ========================================
// INTERFACES & TYPES
// ========================================

// Event Section interface - only notes type for events
export interface EventSection {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  section_type: 'notes' | 'video' | 'competition'; // Allow video for events
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_bio: string | null;
  speaker_image_url: string | null;
  speaker_linkedin_url: string | null;
  speaker_email: string | null;
  location_name: string | null;
  location_details: string | null;
  meeting_room: string | null;
  meeting_url: string | null;
  is_featured: boolean;
  is_mandatory: boolean;
  max_attendees: number | null;
  requires_registration: boolean;
  materials_url: string | null;
  slides_url: string | null;
  recording_url: string | null;
  additional_resources: unknown | null;
  tags: string[] | null;
  category: string | null;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null;
  language: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Always use notes for events
  lessons: EventLessonItem[];
}

// Event Lesson interface - always notes type
export interface EventLessonItem {
  id: string;
  title: string;
  lesson_type: 'notes' | 'video' | 'competition'; // allow competition for events
  duration_minutes?: number;
  order_index: number;
  section_id?: string;
}

// Event Note interface
export interface EventNote {
  id: string;
  section_id: string;
  title: string;
  content: string;
  content_type: 'markdown' | 'html' | 'plain' | 'secret_key';
  file_url?: string;
  is_ai_generated: boolean;
  order_index: number;
  secret_key?: string; // Gizli anahtar için
  created_at: string;
  updated_at: string;
}

// Updated User Event Progress interface to match new table
export interface UserEventProgress {
  section_id: string; // Changed from lesson_id to section_id
  is_completed: boolean;
  completed_at: string | null;
  watch_time_seconds: number;
  last_position_seconds: number;
  notes?: string;
  quiz_score?: number | null;
  quiz_attempts?: number;
  last_quiz_attempt_at?: string | null;
  video_watch_count?: number;
  last_video_watch_at?: string | null;
}

// ========================================
// API HELPER FUNCTIONS
// ========================================

export async function getEventSectionsForAPI(eventId: string): Promise<{
  success: boolean;
  data?: EventSection[];
  error?: string;
}> {
  try {
    console.log('API: Fetching event sections for eventId:', eventId);

    if (!eventId || typeof eventId !== 'string') {
      return {
        success: false,
        error: 'Invalid event ID provided'
      };
    }

    const sections = await getEventSections(eventId);

    return {
      success: true,
      data: sections
    };

  } catch (error) {
    console.error('Error in getEventSectionsForAPI:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch event sections'
    };
  }
}

// ========================================
// EVENT SECTIONS API FUNCTIONS
// ========================================

export async function getEventSections(eventId: string): Promise<EventSection[]> {
  try {
    console.log('Fetching event sections for eventId:', eventId);

    const { data: sections, error } = await supabase
      .from('myuni_event_sections')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Supabase error fetching event sections:', error);
      throw error;
    }

    if (!sections) {
      console.log('No sections found for event:', eventId);
      return [];
    }

    // Get section IDs to check for videos
    const sectionIds = sections.map(s => s.id);

    // Check which sections have videos
    const { data: videoData } = await supabase
      .from('myuni_event_videos')
      .select('lesson_id')
      .in('lesson_id', sectionIds);

    const sectionsWithVideo = new Set(videoData?.map(v => v.lesson_id) || []);

    // Fetch all lessons for these sections
    const { data: eventLessons } = await supabase
      .from('myuni_event_lessons')
      .select('*')
      .in('section_id', sectionIds)
      .eq('is_active', true);

    const allLessons = eventLessons || [];

    // Transform sections
    const transformedSections: EventSection[] = sections.map(section => {
      const sectionLessons = allLessons
        .filter(l => l.section_id === section.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        .map(l => ({
          id: l.id,
          title: l.title,
          lesson_type: l.lesson_type as 'notes' | 'video' | 'competition',
          duration_minutes: l.duration_minutes,
          order_index: l.order_index || 0,
          section_id: section.id
        }));

      // Fallback if no lessons are found for a section, we can use the section itself as a notes lesson to not break existing data
      const finalLessons: EventLessonItem[] = sectionLessons.length > 0 ? sectionLessons : [{
        id: section.id,
        title: section.title,
        lesson_type: (sectionsWithVideo.has(section.id) ? 'video' : 'notes') as 'notes' | 'video' | 'competition', // Dynamic type
        duration_minutes: section.duration_minutes,
        order_index: section.order_index,
        section_id: section.id
      }];

      return {
        id: section.id,
        event_id: section.event_id,
        title: section.title,
        description: section.description,
        start_time: section.start_time,
        end_time: section.end_time,
        duration_minutes: section.duration_minutes,
        section_type: sectionsWithVideo.has(section.id) ? 'video' : 'notes', // Use video section type if it has video
        speaker_name: section.speaker_name,
        speaker_title: section.speaker_title,
        speaker_bio: section.speaker_bio,
        speaker_image_url: section.speaker_image_url,
        speaker_linkedin_url: section.speaker_linkedin_url,
        speaker_email: section.speaker_email,
        location_name: section.location_name,
        location_details: section.location_details,
        meeting_room: section.meeting_room,
        meeting_url: section.meeting_url,
        is_featured: section.is_featured || false,
        is_mandatory: section.is_mandatory || false,
        max_attendees: section.max_attendees,
        requires_registration: section.requires_registration || false,
        materials_url: section.materials_url,
        slides_url: section.slides_url,
        recording_url: section.recording_url,
        additional_resources: section.additional_resources,
        tags: section.tags,
        category: section.category,
        difficulty_level: section.difficulty_level,
        language: section.language || 'tr',
        order_index: section.order_index,
        is_active: section.is_active,
        created_at: section.created_at,
        updated_at: section.updated_at,
        lessons: finalLessons
      };
    });

    console.log('Transformed sections:', transformedSections);
    return transformedSections;

  } catch (error) {
    console.error('Error fetching event sections:', error);
    return [];
  }
}

// ========================================
// EVENT LESSON CONTENT - NOTES ONLY
// ========================================

export async function getEventLessonContent(sectionId: string) {
  try {
    console.log('Fetching event lesson content (notes only) for sectionId:', sectionId);

    // Get notes content for the section
    const { data: notes, error: notesError } = await supabase
      .from('myuni_event_notes')
      .select('id, title, content, content_type, file_url, is_ai_generated, order_index, secret_key')
      .eq('section_id', sectionId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (notesError) {
      console.error('Error fetching event notes:', notesError);
      console.log('Supabase error details:', notesError);
    }

    console.log('Event notes loaded:', {
      notesCount: notes?.length || 0,
      sectionId: sectionId,
      rawNotes: notes
    });

    // Get videos for this section
    const { data: videos, error: videosError } = await supabase
      .from('myuni_event_videos')
      .select('*')
      .eq('lesson_id', sectionId)
      .order('order_index', { ascending: true });

    if (videosError) {
      console.error('Error fetching event videos:', videosError);
    }

    // Debug: Log the exact return structure
    const result = {
      notes: notes || [],
      videos: videos || [], // Return actual videos
      quicks: []  // No quicks for events
    };

    console.log('Returning event lesson content:', result);

    return result;
  } catch (error) {
    console.error('Error fetching event lesson content:', error);
    return {
      notes: [],
      videos: [],
      quicks: []
    };
  }
}

// ========================================
// USER EVENT PROGRESS (via authenticated APIs)
// ========================================

export async function getUserEventProgress(userId: string, eventId: string) {
  return apiGetUserEventProgress(userId, eventId);
}

export async function getUserEventLessonProgress(userId: string, sectionId: string) {
  return apiGetUserEventLessonProgress(userId, sectionId);
}

export async function updateUserEventProgress(userId: string, sectionId: string, progressData: {
  watch_time_seconds?: number;
  is_completed?: boolean;
  last_position_seconds?: number;
  notes?: string;
  quiz_score?: number;
  quiz_attempts?: number;
  last_quiz_attempt_at?: string;
  video_watch_count?: number;
  last_video_watch_at?: string;
}) {
  return apiUpdateUserEventProgress(userId, sectionId, progressData);
}

// ========================================
// EVENT MANAGEMENT
// ========================================

export async function getEventWithContent(eventSlug: string) {
  try {
    console.log('Fetching event with content for slug:', eventSlug);

    const { data: event, error: eventError } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('slug', eventSlug)
      .eq('is_active', true)
      .single();

    if (eventError) throw eventError;
    if (!event) throw new Error('Event not found');

    // Get sections and ensure they use notes
    const sections = await getEventSections(event.id);

    // Transform sections to match expected interface
    const transformedSections = sections.map(section => ({
      id: section.id,
      title: section.title,
      order_index: section.order_index,
      lessons: section.lessons
    }));

    return {
      event: {
        ...event,
        title: event.title,
        event_type: event.event_type || 'workshop'
      },
      sections: transformedSections
    };
  } catch (error) {
    console.error('Error fetching event with content:', error);
    throw error;
  }
}

export async function getFeaturedEvents(_locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('start_date', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Get enrollment counts for all events
    const eventIds = data.map(event => event.id);
    const enrollmentCountMap = await fetchEventEnrollmentCountMap(eventIds);

    const transformedEvents = data?.map(event => {
      const actualAttendeeCount = enrollmentCountMap.get(event.id) || 0;

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description || '',
        organizer: event.organizer_name || 'Organizer',
        organizer_name: event.organizer_name || 'Organizer',
        event_type: event.event_type || 'workshop',
        category: event.category || '',
        tags: event.tags || [],
        tag: event.tags || [], // For compatibility with EventListFilter
        start_date: event.start_date,
        end_date: event.end_date,
        timezone: event.timezone || 'Europe/Istanbul',
        duration: event.duration_minutes ? `${event.duration_minutes} dk` : '2 saat',
        duration_minutes: event.duration_minutes,
        is_online: event.is_online || false,
        location_name: event.location_name,
        location_address: event.location_address,
        meeting_url: event.meeting_url,
        is_paid: event.is_paid || false,
        price: event.price || 0,
        max_attendees: event.max_attendees,
        current_attendees: actualAttendeeCount, // Use actual count from enrollments table
        registration_deadline: event.registration_deadline,
        is_registration_open: event.is_registration_open ?? true,
        image: event.thumbnail_url || event.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
        thumbnail_url: event.thumbnail_url,
        banner_url: event.banner_url,
        status: event.status || 'upcoming',
        is_active: event.is_active,
        is_featured: event.is_featured || false,
        organizer_description: event.organizer_description,
        organizer_email: event.organizer_email,
        organizer_linkedin: event.organizer_linkedin,
        organizer_image_url: event.organizer_image_url,
        created_at: event.created_at,
        updated_at: event.updated_at,
        attendees: actualAttendeeCount, // Use actual count from enrollments table
        maxAttendees: event.max_attendees,
        rating: (Math.random() * 1.5 + 3.5),
        isPaid: event.is_paid || false,
        isOnline: event.is_online || false,
        type: event.event_type || 'workshop', // For compatibility with EventListFilter
        date: event.start_date,
        time: event.start_date ? new Date(event.start_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        location: event.is_online ? 'Online' : (event.location_name || 'TBA')
      };
    });

    return transformedEvents || [];
  } catch (error) {
    console.error('Error fetching featured events:', error);
    throw error;
  }
}

export async function getEventsForFilter(_locale: string = 'tr') {
  try {
    console.log('Fetching events for filter component');

    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Supabase error fetching events:', error);
      throw error;
    }

    if (!data) {
      console.log('No events found');
      return [];
    }

    console.log(`Found ${data.length} events`);

    // Get enrollment counts for all events
    const eventIds = data.map(event => event.id);
    const enrollmentCountMap = await fetchEventEnrollmentCountMap(eventIds);

    // Transform data to match EventListFilter component expectations
    const transformedEvents = data.map(event => {
      const actualAttendeeCount = enrollmentCountMap.get(event.id) || 0;

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description || '',
        organizer: event.organizer_name || 'Organizer',
        organizer_name: event.organizer_name || 'Organizer',
        event_type: event.event_type || 'workshop',
        category: event.category || '',
        tags: event.tags || [],
        tag: event.tags || [], // For compatibility with EventListFilter component
        start_date: event.start_date,
        end_date: event.end_date,
        timezone: event.timezone || 'Europe/Istanbul',
        duration: event.duration_minutes ? `${event.duration_minutes} dk` : '2 saat',
        duration_minutes: event.duration_minutes,
        is_online: event.is_online || false,
        location_name: event.location_name,
        location_address: event.location_address,
        meeting_url: event.meeting_url,
        is_paid: event.is_paid || false,
        price: event.price || 0,
        max_attendees: event.max_attendees,
        current_attendees: actualAttendeeCount, // Use actual count from enrollments table
        registration_deadline: event.registration_deadline,
        is_registration_open: event.is_registration_open ?? true,
        image: event.thumbnail_url || event.banner_url || `https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop`,
        thumbnail_url: event.thumbnail_url,
        banner_url: event.banner_url,
        status: event.status || 'upcoming',
        is_active: event.is_active,
        is_featured: event.is_featured || false,
        organizer_email: event.organizer_email,
        organizer_linkedin: event.organizer_linkedin,
        organizer_image_url: event.organizer_image_url,
        created_at: event.created_at,
        updated_at: event.updated_at,
        // Additional fields for EventListFilter compatibility
        attendees: actualAttendeeCount, // Use actual count from enrollments table
        maxAttendees: event.max_attendees,
        rating: (Math.random() * 1.5 + 3.5), // Generate random rating between 3.5-5.0
        isPaid: event.is_paid || false,
        isOnline: event.is_online || false,
        type: event.event_type || 'workshop',
        date: event.start_date,
        time: event.start_date ? new Date(event.start_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        location: event.is_online ? 'Online' : (event.location_name || 'TBA')
      };
    });

    console.log('Transformed events for filter:', transformedEvents.length);
    return transformedEvents;

  } catch (error) {
    console.error('Error fetching events for filter:', error);
    return [];
  }
}

export async function getAllEvents(_locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Get enrollment counts for all events
    const eventIds = data.map(event => event.id);
    const enrollmentCountMap = await fetchEventEnrollmentCountMap(eventIds);

    const transformedEvents = data?.map(event => {
      const actualAttendeeCount = enrollmentCountMap.get(event.id) || 0;

      return {
        id: event.id,
        slug: event.slug,
        title: event.title,
        description: event.description || '',
        organizer: event.organizer_name || 'Organizer',
        organizer_name: event.organizer_name || 'Organizer',
        event_type: event.event_type || 'workshop',
        category: event.category || '',
        tags: event.tags || [],
        start_date: event.start_date,
        end_date: event.end_date,
        timezone: event.timezone || 'Europe/Istanbul',
        duration: event.duration_minutes ? `${event.duration_minutes} dk` : '2 saat',
        duration_minutes: event.duration_minutes,
        is_online: event.is_online || false,
        location_name: event.location_name,
        location_address: event.location_address,
        meeting_url: event.meeting_url,
        is_paid: event.is_paid || false,
        price: event.price || 0,
        max_attendees: event.max_attendees,
        current_attendees: actualAttendeeCount, // Use actual count from enrollments table
        registration_deadline: event.registration_deadline,
        is_registration_open: event.is_registration_open ?? true,
        image: event.thumbnail_url || event.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
        thumbnail_url: event.thumbnail_url,
        banner_url: event.banner_url,
        status: event.status || 'upcoming',
        is_active: event.is_active,
        is_featured: event.is_featured || false,
        organizer_description: event.organizer_description,
        organizer_email: event.organizer_email,
        organizer_linkedin: event.organizer_linkedin,
        organizer_image_url: event.organizer_image_url,
        created_at: event.created_at,
        updated_at: event.updated_at,
        attendees: actualAttendeeCount, // Use actual count from enrollments table
        maxAttendees: event.max_attendees,
        rating: (Math.random() * 1.5 + 3.5),
        isPaid: event.is_paid || false,
        isOnline: event.is_online || false,
        date: event.start_date,
        time: event.start_date ? new Date(event.start_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '',
        location: event.is_online ? 'Online' : (event.location_name || 'TBA')
      };
    });

    return transformedEvents || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}

export async function getEventBySlug(slug: string, locale: string = 'tr') {
  try {
    console.log('Fetching event by slug:', slug);

    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Supabase error fetching event by slug:', error);
      throw error;
    }

    if (!data) {
      console.log('No event found with slug:', slug);
      return null;
    }

    console.log('Found event:', data.title);

    // Get actual enrollment count for this event
    const enrollmentCountMap = await fetchEventEnrollmentCountMap([data.id]);
    const actualAttendeeCount = enrollmentCountMap.get(data.id) || 0;

    // Get sections safely
    let sections: EventSection[] = [];
    try {
      sections = await getEventSections(data.id);
      console.log('Fetched', sections.length, 'sections for event');
    } catch (sectionError) {
      console.warn('Could not fetch sections for event:', sectionError);
      sections = [];
    }

    const result = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      description: data.description || '',
      organizer: data.organizer_name || 'Organizer',
      organizer_name: data.organizer_name || 'Organizer',
      event_type: data.event_type || 'workshop',
      category: data.category || '',
      tags: data.tags || [],
      start_date: data.start_date,
      end_date: data.end_date,
      timezone: data.timezone || 'Europe/Istanbul',
      duration: data.duration_minutes ? `${data.duration_minutes} dk` : '2 saat',
      duration_minutes: data.duration_minutes,
      is_online: data.is_online || false,
      location_name: data.location_name,
      location_address: data.location_address,
      meeting_url: data.meeting_url,
      is_paid: data.is_paid || false,
      price: data.price || 0,
      max_attendees: data.max_attendees,
      current_attendees: actualAttendeeCount, // Use actual count from enrollments table
      registration_deadline: data.registration_deadline,
      is_registration_open: data.is_registration_open ?? true,
      image: data.thumbnail_url || data.banner_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=400&h=250&fit=crop`,
      thumbnail_url: data.thumbnail_url,
      banner_url: data.banner_url,
      banner: {
        url: data.banner_url || data.thumbnail_url || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=1200&h=600&fit=crop`
      },
      status: data.status || 'upcoming',
      is_active: data.is_active,
      is_featured: data.is_featured || false,
      organizer_description: data.organizer_description,
      organizer_email: data.organizer_email,
      organizer_linkedin: data.organizer_linkedin,
      organizer_image_url: data.organizer_image_url,
      sections: sections,
      features: generateEventFeatures(locale),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    console.log('Returning event data with', sections.length, 'sections');
    return result;

  } catch (error) {
    console.error('Error fetching event by slug:', error);
    throw error;
  }
}

// ========================================
// USER ENROLLMENT
// ========================================

export async function getUserEventEnrollment(userId: string, eventId: string) {
  try {
    console.log('Checking user event enrollment:', { userId, eventId });

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user event enrollment:', error);
    throw error;
  }
}

export async function enrollUserToEvent(userId: string, eventId: string) {
  try {
    console.log('Enrolling user to event:', { userId, eventId });

    const { data, error } = await supabase
      .from('myuni_event_enrollments')
      .insert({
        user_id: userId,
        event_id: eventId,
        enrolled_at: new Date().toISOString(),
        attendance_status: 'registered'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error enrolling user to event:', error);
    throw error;
  }
}

// ========================================
// COMPLETION AND PROGRESS TRACKING
// ========================================

export async function markEventLessonCompleted(userId: string, sectionId: string, watchTimeSeconds?: number) {
  return apiMarkEventLessonCompleted(userId, sectionId, watchTimeSeconds);
}

export async function getEventCompletionStats(userId: string, eventId: string) {
  return apiGetEventCompletionStats(userId, eventId);
}

// ========================================
// ANALYTICS
// ========================================

export async function getUserEventAnalytics(userId: string, eventId: string) {
  try {
    const [progress, analytics] = await Promise.all([
      apiGetUserEventProgress(userId, eventId),
      apiGetEventAnalytics(userId, eventId),
    ]);

    let enrollment = null;
    try {
      const res = await fetch(`/api/event-enrollments/me?eventId=${encodeURIComponent(eventId)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        enrollment = json.enrollment || json.data || null;
      }
    } catch {
      enrollment = null;
    }

    return { analytics, progress, enrollment };
  } catch (error) {
    console.error('Error fetching user event analytics:', error);
    throw error;
  }
}

// ========================================
// QUIZ FUNCTIONS FOR EVENTS
// ========================================

export async function getLatestEventQuizResult(userId: string, sectionId: string) {
  return apiGetLatestEventQuizResult(userId, sectionId);
}

export async function saveEventQuizResult(
  userId: string,
  sectionId: string,
  quickId: string,
  score: number
) {
  return apiSaveEventQuizResult(userId, sectionId, quickId, score);
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateEventFeatures(locale: string) {
  const features = {
    tr: [
      "İnteraktif içerik",
      "Uzman eğitmenler",
      "Sertifika desteği",
      "Canlı Q&A seansları",
      "Networking fırsatları",
      "Kayıt erişimi",
      "Dijital materyaller",
      "Topluluk desteği"
    ],
    en: [
      "Interactive content",
      "Expert instructors",
      "Certificate support",
      "Live Q&A sessions",
      "Networking opportunities",
      "Recording access",
      "Digital materials",
      "Community support"
    ]
  };

  const localeFeatures = features[locale as keyof typeof features] || features.tr;
  return localeFeatures.sort(() => 0.5 - Math.random()).slice(0, 4);
}

export function mapEventTypeToLocale(eventType: string, locale: string) {
  const typeMappings = {
    tr: {
      'workshop': 'Atölye',
      'seminar': 'Seminer',
      'conference': 'Konferans',
      'meetup': 'Buluşma',
      'webinar': 'Webinar'
    },
    en: {
      'Atölye': 'Workshop',
      'Seminer': 'Seminar',
      'Konferans': 'Conference',
      'Buluşma': 'Meetup',
      'Webinar': 'Webinar'
    }
  };

  const mapping = typeMappings[locale as keyof typeof typeMappings];
  return mapping?.[eventType as keyof typeof mapping] || eventType;
}

export function mapEventStatusToLocale(status: string, locale: string) {
  const statusMappings = {
    tr: {
      'upcoming': 'Yaklaşan',
      'ongoing': 'Devam Eden',
      'completed': 'Tamamlanmış',
      'cancelled': 'İptal Edilmiş'
    },
    en: {
      'Yaklaşan': 'Upcoming',
      'Devam Eden': 'Ongoing',
      'Tamamlanmış': 'Completed',
      'İptal Edilmiş': 'Cancelled'
    }
  };

  const mapping = statusMappings[locale as keyof typeof statusMappings];
  return mapping?.[status as keyof typeof mapping] || status;
}