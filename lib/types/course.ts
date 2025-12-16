// lib/types/course.ts
export interface Lesson {
  id: string;
  title: string;
  type: "video" | "notes" | "quick" | "mixed";
  duration: string;
  isCompleted: boolean;
  lastPosition: number;
  watchTime: number;
  order: number;
}

export interface Section {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  totalWatchTime: number;
  sections: Section[];
  course_type?: "online" | "live" | "hybrid";
  isLive?: boolean;
  live_start_date?: string | null;
  live_end_date?: string | null;
  live_timezone?: string | null;
  duration?: string; // ✅ Bu satırı ekle
}

export interface Translations {
  courseContent: string;
  analytics: string;
  progress: string;
  instructor: string;
  completed: string;
  inProgress: string;
  myuniVideo: string;
  myuniNotes: string;
  myuniQuick: string;
  myuniAnalytics: string;
  mixed: string;
  selectContent: string;
  welcomeBack: string;
  continueWatching: string;
  overview: string;
  totalWatchTime: string;
  completedLessons: string;
  avgDailyTime: string;
  currentStreak: string;
  lastActive: string;
  weeklyProgress: string;
  contentProgress: string;
  performance: string;
  minutes: string;
  days: string;
  lessons: string;
  loading: string;
  error: string;
  enrolling: string;
  enrollSuccess: string;
  notes: string;
  showNotes: string;
  hideNotes: string;
  notEnrolled: string;
  enrollmentRequired: string;
  resumeFromLastPosition: string;
  continueLesson: string;
  nextLesson: string;
  previousLesson: string;
  lessonCompleted: string;
}

export interface VimeoVideo {
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