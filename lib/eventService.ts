// lib/eventService.ts - Revised functions for new myuni_event_user_progress table

import { supabase } from './supabase';

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
  section_type: 'notes'; // Always notes for events
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
  additional_resources: any | null;
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
  lesson_type: 'notes'; // Always notes for events
  duration_minutes?: number;
  order_index: number;
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

    // Transform sections to always use notes type
    const transformedSections: EventSection[] = sections.map(section => ({
      id: section.id,
      event_id: section.event_id,
      title: section.title,
      description: section.description,
      start_time: section.start_time,
      end_time: section.end_time,
      duration_minutes: section.duration_minutes,
      section_type: 'notes', // Force all sections to be notes type
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
      // Create lesson item as notes type
      lessons: [{
        id: section.id,
        title: section.title,
        lesson_type: 'notes', // Always notes for events
        duration_minutes: section.duration_minutes,
        order_index: section.order_index
      }]
    }));

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

    // Debug: Log the exact return structure
    const result = {
      notes: notes || [],
      videos: [], // No videos for events
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
// USER EVENT PROGRESS FUNCTIONS - UPDATED FOR NEW TABLE
// ========================================

export async function getUserEventProgress(userId: string, eventId: string): Promise<UserEventProgress[]> {
  try {
    console.log('Fetching user event progress for:', { userId, eventId });

    if (!userId || !eventId) {
      console.log('Missing userId or eventId');
      return [];
    }

    // Get progress data from new table
    const { data: progressData, error: progressError } = await supabase
      .from('myuni_event_user_progress')
      .select('section_id, is_completed, watch_time_seconds, last_position_seconds, completed_at, notes, quiz_score, quiz_attempts, last_quiz_attempt_at, video_watch_count, last_video_watch_at')
      .eq('user_id', userId)
      .eq('event_id', eventId);

    if (progressError) {
      console.warn('Error fetching event progress:', progressError);
      return [];
    }

    console.log('Found event progress data:', progressData?.length || 0);

    // Transform to match interface
    const result = (progressData || []).map(p => ({
      section_id: p.section_id,
      is_completed: p.is_completed || false,
      watch_time_seconds: p.watch_time_seconds || 0,
      last_position_seconds: p.last_position_seconds || 0,
      completed_at: p.completed_at || null,
      notes: p.notes || undefined,
      quiz_score: p.quiz_score || null,
      quiz_attempts: p.quiz_attempts || 0,
      last_quiz_attempt_at: p.last_quiz_attempt_at || null,
      video_watch_count: p.video_watch_count || 0,
      last_video_watch_at: p.last_video_watch_at || null
    }));

    console.log('Returning progress for', result.length, 'sections');
    return result;

  } catch (error) {
    console.error('Error fetching user event progress:', error);
    return [];
  }
}

export async function getUserEventLessonProgress(userId: string, sectionId: string) {
  try {
    console.log('Fetching user event lesson progress for:', { userId, sectionId });

    const { data, error } = await supabase
      .from('myuni_event_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('section_id', sectionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user event lesson progress:', error);
      throw error;
    }

    return data || {
      user_id: userId,
      section_id: sectionId,
      watch_time_seconds: 0,
      is_completed: false,
      last_position_seconds: 0,
      notes: '',
      quiz_score: null,
      quiz_attempts: 0,
      last_quiz_attempt_at: null,
      video_watch_count: 0,
      last_video_watch_at: null
    };
  } catch (error) {
    console.error('Error fetching user event lesson progress:', error);
    throw error;
  }
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
  try {
    console.log('Updating user event progress:', { userId, sectionId, progressData });

    // First, get the event_id from the section
    const { data: sectionData, error: sectionError } = await supabase
      .from('myuni_event_sections')
      .select('event_id')
      .eq('id', sectionId)
      .single();

    if (sectionError) {
      console.error('Error fetching section data:', sectionError);
      throw sectionError;
    }

    if (!sectionData) {
      throw new Error('Section not found');
    }

    const updateData: Record<string, unknown> = {
      user_id: userId,
      event_id: sectionData.event_id,
      section_id: sectionId,
      updated_at: new Date().toISOString()
    };

    // Add progress data fields
    if (progressData.watch_time_seconds !== undefined) {
      updateData.watch_time_seconds = progressData.watch_time_seconds;
    }
    if (progressData.is_completed !== undefined) {
      updateData.is_completed = progressData.is_completed;
    }
    if (progressData.last_position_seconds !== undefined) {
      updateData.last_position_seconds = progressData.last_position_seconds;
    }
    if (progressData.notes !== undefined) {
      updateData.notes = progressData.notes;
    }
    if (progressData.quiz_score !== undefined) {
      updateData.quiz_score = progressData.quiz_score;
    }
    if (progressData.quiz_attempts !== undefined) {
      updateData.quiz_attempts = progressData.quiz_attempts;
    }
    if (progressData.last_quiz_attempt_at !== undefined) {
      updateData.last_quiz_attempt_at = progressData.last_quiz_attempt_at;
    }
    if (progressData.video_watch_count !== undefined) {
      updateData.video_watch_count = progressData.video_watch_count;
    }
    if (progressData.last_video_watch_at !== undefined) {
      updateData.last_video_watch_at = progressData.last_video_watch_at;
    }

    if (progressData.is_completed) {
      updateData.completed_at = new Date().toISOString();
    }

    console.log('Final update data:', updateData);

    const { data, error } = await supabase
      .from('myuni_event_user_progress')
      .upsert(updateData, {
        onConflict: 'user_id,event_id,section_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user event progress:', error);
      throw error;
    }

    console.log('Successfully updated user event progress:', data);
    return data;
  } catch (error) {
    console.error('Error updating user event progress:', error);
    throw error;
  }
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
      lessons: [{
        id: section.id,
        title: section.title,
        lesson_type: 'notes', // Always notes for events
        duration_minutes: section.duration_minutes,
        order_index: section.order_index
      }]
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

export async function getFeaturedEvents(locale: string = 'tr') {
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
    const { data: enrollmentCounts, error: enrollmentError } = await supabase
      .from('myuni_event_enrollments')
      .select('event_id')
      .in('event_id', eventIds);

    if (enrollmentError) {
      console.error('Error fetching enrollment counts:', enrollmentError);
    }

    // Create a map of event_id to enrollment count
    const enrollmentCountMap = new Map();
    if (enrollmentCounts) {
      enrollmentCounts.forEach(enrollment => {
        const eventId = enrollment.event_id;
        enrollmentCountMap.set(eventId, (enrollmentCountMap.get(eventId) || 0) + 1);
      });
    }

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

export async function getEventsForFilter(locale: string = 'tr') {
  try {
    console.log('Fetching events for filter component');

    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });

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
    const { data: enrollmentCounts, error: enrollmentError } = await supabase
      .from('myuni_event_enrollments')
      .select('event_id')
      .in('event_id', eventIds);

    if (enrollmentError) {
      console.error('Error fetching enrollment counts:', enrollmentError);
    }

    // Create a map of event_id to enrollment count
    const enrollmentCountMap = new Map();
    if (enrollmentCounts) {
      enrollmentCounts.forEach(enrollment => {
        const eventId = enrollment.event_id;
        enrollmentCountMap.set(eventId, (enrollmentCountMap.get(eventId) || 0) + 1);
      });
    }

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

export async function getAllEvents(locale: string = 'tr') {
  try {
    const { data, error } = await supabase
      .from('myuni_events')
      .select('*')
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Get enrollment counts for all events
    const eventIds = data.map(event => event.id);
    const { data: enrollmentCounts, error: enrollmentError } = await supabase
      .from('myuni_event_enrollments')
      .select('event_id')
      .in('event_id', eventIds);

    if (enrollmentError) {
      console.error('Error fetching enrollment counts:', enrollmentError);
    }

    // Create a map of event_id to enrollment count
    const enrollmentCountMap = new Map();
    if (enrollmentCounts) {
      enrollmentCounts.forEach(enrollment => {
        const eventId = enrollment.event_id;
        enrollmentCountMap.set(eventId, (enrollmentCountMap.get(eventId) || 0) + 1);
      });
    }

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
    const { data: enrollmentCounts, error: enrollmentError } = await supabase
      .from('myuni_event_enrollments')
      .select('event_id')
      .eq('event_id', data.id);

    if (enrollmentError) {
      console.error('Error fetching enrollment count:', enrollmentError);
    }

    const actualAttendeeCount = enrollmentCounts?.length || 0;

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
  try {
    const progressData: Record<string, unknown> = { is_completed: true };
    if (watchTimeSeconds !== undefined) {
      progressData.watch_time_seconds = watchTimeSeconds;
    }
    return await updateUserEventProgress(userId, sectionId, progressData);
  } catch (error) {
    console.error('Error marking event lesson completed:', error);
    throw error;
  }
}

export async function getEventCompletionStats(userId: string, eventId: string) {
  try {
    const progressData = await getUserEventProgress(userId, eventId);
    
    const totalLessons = progressData.length;
    const completedLessons = progressData.filter(p => p.is_completed).length;
    const totalWatchTime = progressData.reduce((acc, p) => acc + (p.watch_time_seconds || 0), 0);
    
    const completionPercentage = totalLessons > 0 ? 
      Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0;

    return {
      totalLessons,
      completedLessons,
      completionPercentage,
      totalWatchTimeSeconds: totalWatchTime,
      totalWatchTimeMinutes: Math.round(totalWatchTime / 60),
      lastActiveDate: null
    };
  } catch (error) {
    console.error('Error getting event completion stats:', error);
    throw error;
  }
}

// ========================================
// ANALYTICS
// ========================================

export async function getUserEventAnalytics(userId: string, eventId: string) {
  try {
    console.log('Fetching user event analytics for:', { userId, eventId });

    // Get user's event progress
    const progress = await getUserEventProgress(userId, eventId);
    
    // Get user's enrollment info
    const enrollment = await getUserEventEnrollment(userId, eventId);
    
    // Generate analytics data
    const analytics = await generateUserEventAnalytics(userId, eventId);

    return {
      analytics,
      progress,
      enrollment
    };
  } catch (error) {
    console.error('Error fetching user event analytics:', error);
    throw error;
  }
}

async function generateUserEventAnalytics(userId: string, eventId: string) {
  try {
    // Get direct progress data from new table
    const { data: progressData, error: progressError } = await supabase
      .from('myuni_event_user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .order('updated_at', { ascending: false });

    if (progressError) {
      console.warn('Error fetching progress for analytics:', progressError);
      return [];
    }

    // Generate daily analytics for the last 30 days
    const analytics = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      // Find progress updates for this day
      const dayProgress = progressData?.filter(p => {
        const progressDate = new Date(p.updated_at || p.created_at).toISOString().split('T')[0];
        return progressDate === dateString;
      }) || [];

      // Calculate daily metrics
      const totalWatchTimeMinutes = dayProgress.reduce((acc, p) => 
        acc + Math.floor((p.watch_time_seconds || 0) / 60), 0
      );
      
      const lessonsCompleted = dayProgress.filter(p => 
        p.is_completed && p.completed_at && 
        new Date(p.completed_at).toISOString().split('T')[0] === dateString
      ).length;

      const notesCreated = dayProgress.filter(p => 
        p.notes && p.notes.trim().length > 0
      ).length;

      analytics.push({
        session_date: dateString,
        user_id: userId,
        event_id: eventId,
        total_watch_time_minutes: totalWatchTimeMinutes,
        lessons_completed: lessonsCompleted,
        videos_watched: 0, // No videos for events
        quizzes_attempted: 0, // No quizzes for events
        quizzes_passed: 0,
        quizzes_failed: 0,
        quiz_time_minutes: 0,
        notes_created: notesCreated,
        session_count: dayProgress.length > 0 ? 1 : 0,
        avg_quiz_score: 0
      });
    }

    return analytics.filter(a => a.session_count > 0);
  } catch (error) {
    console.error('Error generating user event analytics:', error);
    return [];
  }
}

// ========================================
// QUIZ FUNCTIONS FOR EVENTS (if needed in the future)
// ========================================

export async function getLatestEventQuizResult(userId: string, sectionId: string) {
  try {
    console.log('Fetching latest event quiz result for:', { userId, sectionId });

    const { data, error } = await supabase
      .from('myuni_event_user_progress')
      .select('quiz_score, quiz_attempts, last_quiz_attempt_at, is_completed')
      .eq('user_id', userId)
      .eq('section_id', sectionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data || data.quiz_score === null) return null;

    return {
      score: data.quiz_score,
      attempts: data.quiz_attempts || 1,
      completed_at: data.last_quiz_attempt_at
    };
  } catch (error) {
    console.error('Error fetching latest event quiz result:', error);
    return null;
  }
}

export async function saveEventQuizResult(
  userId: string,
  sectionId: string,
  quickId: string,
  score: number
) {
  try {
    console.log('Saving event quiz result:', { userId, sectionId, quickId, score });

    // Get current progress
    const { data: currentProgress } = await supabase
      .from('myuni_event_user_progress')
      .select('quiz_attempts, quiz_score')
      .eq('user_id', userId)
      .eq('section_id', sectionId)
      .single();

    const attempts = (currentProgress?.quiz_attempts || 0) + 1;
    const passingScore = 70; // Default passing score for events
    const isPassed = score >= passingScore;

    // Update progress with quiz result
    await updateUserEventProgress(userId, sectionId, {
      quiz_score: score,
      quiz_attempts: attempts,
      last_quiz_attempt_at: new Date().toISOString(),
      is_completed: isPassed
    });

    return { success: true };
  } catch (error) {
    console.error('Error saving event quiz result:', error);
    throw error;
  }
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