// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Course {
  id: string
  slug: string
  title: string
  description?: string
  instructor_name?: string
  duration?: string
  level?: string
  price?: number
  original_price?: number
  thumbnail_url?: string
  banner_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseSection {
  id: string
  course_id: string
  title: string
  description?: string
  order_index: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseLesson {
  id: string
  section_id: string
  title: string
  description?: string
  lesson_type: 'video' | 'notes' | 'quick' | 'mixed'
  order_index: number
  duration_minutes?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Video {
  id: string
  lesson_id: string
  title: string
  description?: string
  vimeo_id?: string
  vimeo_embed_url?: string
  vimeo_hash?: string
  video_url?: string
  thumbnail_url?: string
  duration_seconds?: number
  width?: number
  height?: number
  order_index: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  lesson_id: string
  title: string
  content: string
  content_type: string
  file_url?: string
  order_index: number
  is_ai_generated: boolean
  created_at: string
  updated_at: string
}

export interface Quick {
  id: string
  lesson_id: string
  title: string
  description?: string
  quick_type: 'quiz' | 'interactive' | 'game' | 'simulation'
  config?: unknown
  order_index: number
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
  progress_percentage: number
  is_active: boolean
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  completed_at?: string
  watch_time_seconds: number
  is_completed: boolean
  last_position_seconds: number
  notes?: string
  created_at: string
  updated_at: string
}

// User Profile interface
export interface UserProfile {
  id: string
  clerk_id: string
  first_name: string
  last_name: string
  email: string
  school?: string
  grade?: string
  bio?: string
  phone_number?: string
  created_at: string
  updated_at: string
}

// Event interface based on myuni_events table
export interface Event {
  id: string
  slug: string
  title: string
  description?: string
  organizer_name?: string
  organizer_email?: string
  organizer_linkedin?: string
  organizer_image_url?: string
  event_type: 'workshop' | 'seminar' | 'conference' | 'meetup' | 'webinar'
  category?: string
  tags?: string[]
  start_date: string
  end_date?: string
  timezone: string
  duration_minutes?: number
  is_online: boolean
  location_name?: string
  location_address?: string
  meeting_url?: string
  is_paid: boolean
  price?: number
  max_attendees?: number
  current_attendees: number
  registration_deadline?: string
  is_registration_open: boolean
  thumbnail_url?: string
  banner_url?: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}