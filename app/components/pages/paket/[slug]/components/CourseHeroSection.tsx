"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Play, RotateCcw, CheckCircle, RotateCcw as Replay } from 'lucide-react';
import supabase from '../../../../../_services/supabaseClient';

// Use the existing global types from your global.d.ts file
type VimeoPlayer = import('../../../../../types/global').VimeoPlayer;
type VimeoEventData = import('../../../../../types/global').VimeoEventData;

interface CourseHeroSectionTexts {
  preview?: string;
  [key: string]: string | undefined;
}

// Updated CourseData interface to match database schema
interface CourseData {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  instructor_name?: string;
  duration?: string;
  level?: string;
  price?: number;
  original_price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  instructor_description?: string;
  instructor_email?: string;
  instructor_linkedin?: string;
  instructor_image_url?: string;
  course_type?: string;
  live_start_date?: string;
  live_end_date?: string;
  live_timezone?: string;
  max_participants?: number;
  current_participants?: number;
  session_count?: number;
  session_duration_minutes?: number;
  registration_deadline?: string;
  is_registration_open?: boolean;
  
  // Legacy fields for backward compatibility
  banner?: { url: string };
  name?: string;
  image?: string;
}

interface CourseHeroSectionProps {
  course?: CourseData;
  texts?: CourseHeroSectionTexts;
  courseId?: string;
  courseSlug?: string;
  userId?: string;
  locale?: string;
}

interface VimeoVideo {
  id: string;
  lesson_id: string | null;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number | null;
  vimeo_hash: string | null;
}

interface UserProgress {
  watch_time_seconds: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at?: string;
}

const CourseHeroSection: React.FC<CourseHeroSectionProps> = ({ 
  course, 
  texts = { preview: 'Önizleme' },
  courseId,
  courseSlug,
  userId,
  locale = 'tr'
}) => {
  const [loading, setLoading] = useState(true);
  const [courseData, setCourseData] = useState<CourseData | null>(course || null);

  const getBannerUrl = useCallback((cData: CourseData | null): string => {
    if (!cData) return '/default-course-banner.jpg';
    return (
      cData.banner_url ||
      cData.banner?.url ||
      cData.thumbnail_url ||
      cData.image ||
      '/default-course-banner.jpg'
    );
  }, []);

  const getCourseTitle = useCallback((cData: CourseData | null): string => {
    if (!cData) return 'Package Name';
    return cData.title || cData.name || 'Package Name';
  }, []);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('myuni_packages')
        .select('*')
        .eq('is_active', true);

      if (courseId && courseId !== 'undefined') {
        query = query.eq('id', courseId);
      } else if (courseSlug && courseSlug !== 'undefined') {
        query = query.eq('slug', courseSlug);
      } else {
        throw new Error('Package ID or slug is required');
      }

      const { data, error } = await query.single();

      if (!error && data) {
        setCourseData(data);
      }
    } catch (err) {
      console.error('Package data fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, courseSlug]);

  useEffect(() => {
    if (course) {
      setCourseData(course);
      setLoading(false);
    } else {
      fetchCourseData();
    }
  }, [course, fetchCourseData]);

  if (loading) {
    return (
      <div className="w-full relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700 animate-pulse">
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
        <Image
          src={getBannerUrl(courseData)}
          alt={getCourseTitle(courseData)}
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  );
};

export default CourseHeroSection;