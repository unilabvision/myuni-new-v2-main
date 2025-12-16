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
  const [error, setError] = useState<string | null>(null);
  const [firstVideo, setFirstVideo] = useState<VimeoVideo | null>(null);
  const [courseData, setCourseData] = useState<CourseData | null>(course || null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    watch_time_seconds: 0,
    last_position_seconds: 0,
    is_completed: false,
  });
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isVimeoReady, setIsVimeoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  
  // New state to track initialization
  const [isInitialized, setIsInitialized] = useState(false);
  const [courseDataLoaded, setCourseDataLoaded] = useState(!!course);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);

  // Helper function to get banner image URL
  const getBannerUrl = useCallback((courseData: CourseData | null): string => {
    if (!courseData) return '/default-course-banner.jpg';
    
    // Try different possible banner fields in order of preference
    return (
      courseData.banner_url ||
      courseData.banner?.url ||
      courseData.thumbnail_url ||
      courseData.image ||
      '/default-course-banner.jpg'
    );
  }, []);

  // Helper function to get course title
  const getCourseTitle = useCallback((courseData: CourseData | null): string => {
    if (!courseData) return 'Course Name';
    return courseData.title || courseData.name || 'Course Name';
  }, []);

  // Check if course is online type - if not, just show banner
  const isOnlineCourse = courseData?.course_type === 'online' || !courseData?.course_type;

  // Log texts to avoid unused variable warning - remove in production if not needed
  useEffect(() => {
    if (Object.keys(texts).length > 0) {
      console.log('Available texts:', texts);
    }
  }, [texts]);

  // Fetch course data if not provided
  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('myuni_courses')
        .select('*')
        .eq('is_active', true);

      if (courseId && courseId !== 'undefined') {
        query = query.eq('id', courseId);
      } else if (courseSlug && courseSlug !== 'undefined') {
        query = query.eq('slug', courseSlug);
      } else {
        throw new Error('Course ID or slug is required');
      }

      const { data, error } = await query.single();

      if (error) {
        throw new Error(`Failed to fetch course: ${error.message}`);
      }

      if (data) {
        setCourseData(data);
        setCourseDataLoaded(true);
      } else {
        throw new Error('Course not found');
      }
    } catch (err) {
      console.error('Course data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course data');
    }
  }, [courseId, courseSlug]);

  const fetchFirstVideoWithCourseId = useCallback(async (cId: string) => {
    try {
      setLoading(true);
      // First get the first section of the course
      const { data: sections, error: sectionsError } = await supabase
        .from('myuni_course_sections')
        .select('id')
        .eq('course_id', cId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(1);

      if (sectionsError) {
        console.error('Sections query error:', sectionsError);
        throw new Error(`Failed to fetch sections: ${sectionsError.message}`);
      }

      if (!sections || sections.length === 0) {
        throw new Error('No sections found for this course');
      }

      // Then get the first lesson of the first section
      const { data: lessons, error: lessonsError } = await supabase
        .from('myuni_course_lessons')
        .select('id')
        .eq('section_id', sections[0].id)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
        .limit(1);

      if (lessonsError) {
        console.error('Lessons query error:', lessonsError);
        throw new Error(`Failed to fetch lessons: ${lessonsError.message}`);
      }

      if (!lessons || lessons.length === 0) {
        throw new Error('No lessons found for this course');
      }

      // Finally get the first video of the first lesson
      const { data: videos, error: videosError } = await supabase
        .from('myuni_videos')
        .select('id, lesson_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash')
        .eq('lesson_id', lessons[0].id)
        .order('order_index', { ascending: true })
        .limit(1);

      if (videosError) {
        console.error('Videos query error:', videosError);
        throw new Error(`Failed to fetch videos: ${videosError.message}`);
      }

      if (videos && videos.length > 0) {
        setFirstVideo(videos[0]);
        setError(null);
      } else {
        throw new Error('No video content found for this course');
      }
    } catch (err) {
      console.error('First video fetch with course ID error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course preview video');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const fetchFirstVideoBySlug = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate courseSlug
      if (!courseSlug || courseSlug === 'undefined' || courseSlug === 'null') {
        throw new Error('Invalid course slug provided');
      }

      // First get the course by slug to get the course ID
      const { data: courses, error: courseError } = await supabase
        .from('myuni_courses')
        .select('id')
        .eq('slug', courseSlug)
        .eq('is_active', true)
        .single();

      if (courseError) {
        console.error('Course query error:', courseError);
        throw new Error(`Failed to fetch course: ${courseError.message}`);
      }

      if (!courses) {
        throw new Error('Course not found');
      }

      // Now fetch first video using the course ID
      await fetchFirstVideoWithCourseId(courses.id);
    } catch (err) {
      console.error('First video fetch by slug error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course preview video');
      setLoading(false);
      setIsInitialized(true);
    }
  }, [courseSlug, fetchFirstVideoWithCourseId]);

  const fetchFirstVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate courseId
      if (!courseId || courseId === 'undefined' || courseId === 'null') {
        throw new Error('Invalid course ID provided');
      }

      await fetchFirstVideoWithCourseId(courseId);
    } catch (err) {
      console.error('First video fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load course preview video');
      setLoading(false);
      setIsInitialized(true);
    }
  }, [courseId, fetchFirstVideoWithCourseId]);

  const loadUserProgress = useCallback(async () => {
    if (!userId || !firstVideo || !firstVideo.lesson_id) return;

    try {
      const { data, error } = await supabase
        .from('myuni_user_progress')
        .select('watch_time_seconds, last_position_seconds, is_completed, completed_at')
        .eq('user_id', userId)
        .eq('lesson_id', firstVideo.lesson_id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      if (data) {
        setUserProgress({
          watch_time_seconds: data.watch_time_seconds || 0,
          last_position_seconds: data.last_position_seconds || 0,
          is_completed: data.is_completed || false,
          completed_at: data.completed_at,
        });
        setCurrentPosition(data.last_position_seconds || 0);
      }
    } catch (error) {
      console.error('Progress load error:', error);
    }
  }, [userId, firstVideo]);

  const handleProgressSave = useCallback(async (positionSeconds: number, progressPercent: number) => {
    if (!userId || !firstVideo || !firstVideo.lesson_id) return;

    try {
      const isCompleted = progressPercent >= 90 || userProgress.is_completed;
      
      // Watch time hesaplama - Hero video için basit versiyon
      const watchTimeIncrease = Math.max(0, Math.floor(positionSeconds - userProgress.last_position_seconds));
      const newTotalWatchTime = userProgress.watch_time_seconds + watchTimeIncrease;

      const progressData = {
        watch_time_seconds: newTotalWatchTime,
        last_position_seconds: Math.floor(positionSeconds),
        is_completed: isCompleted,
        completed_at: isCompleted && !userProgress.is_completed ? new Date().toISOString() : userProgress.completed_at,
        updated_at: new Date().toISOString(),
      };

      console.log('Hero video progress save:', {
        positionSeconds,
        watchTimeIncrease,
        newTotalWatchTime,
        progressData
      });

      const { error } = await supabase
        .from('myuni_user_progress')
        .upsert({
          user_id: userId,
          lesson_id: firstVideo.lesson_id,
          ...progressData,
        }, {
          onConflict: 'user_id,lesson_id',
          ignoreDuplicates: false
        });

      if (error) {
        throw new Error(error.message);
      }

      setUserProgress((prev) => ({
        ...prev,
        ...progressData,
      }));
    } catch (error) {
      console.error('Hero video progress save error:', error);
    }
  }, [userId, firstVideo, userProgress]);

  // Replay video function
  const handleReplayVideo = useCallback(() => {
    if (playerRef.current) {
      setVideoEnded(false);
      playerRef.current.setCurrentTime(0);
      playerRef.current.play();
    }
  }, []);

  // Initial setup effect
  useEffect(() => {
    // If course data is already provided, mark as loaded
    if (course) {
      setCourseData(course);
      setCourseDataLoaded(true);
    }
  }, [course]);

  // Fetch course data if not provided
  useEffect(() => {
    if (!courseDataLoaded && (courseId || courseSlug)) {
      fetchCourseData();
    }
  }, [courseDataLoaded, courseId, courseSlug, fetchCourseData]);

  // Load Vimeo Player API script - only for online courses
  useEffect(() => {
    if (!courseDataLoaded) return;
    
    if (!isOnlineCourse) {
      setLoading(false);
      setIsInitialized(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => setIsVimeoReady(true);
    script.onerror = () => {
      setError('Failed to load Vimeo Player API');
      setIsInitialized(true);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [isOnlineCourse, courseDataLoaded]);

  // Fetch first video of the course - only for online courses
  useEffect(() => {
    if (!courseDataLoaded || !isOnlineCourse) {
      return;
    }

    if (courseData?.id) {
      fetchFirstVideoWithCourseId(courseData.id);
    } else if (courseId && courseId !== 'undefined') {
      fetchFirstVideo();
    } else if (courseSlug && courseSlug !== 'undefined') {
      fetchFirstVideoBySlug();
    } else {
      setError('Course ID or slug is required');
      setLoading(false);
      setIsInitialized(true);
    }
  }, [courseData, courseId, courseSlug, isOnlineCourse, courseDataLoaded, fetchFirstVideo, fetchFirstVideoBySlug, fetchFirstVideoWithCourseId]);

  // Load user progress when video is found - only for online courses
  useEffect(() => {
    if (!isOnlineCourse) return;
    
    if (userId && firstVideo && firstVideo.lesson_id) {
      loadUserProgress();
    }
  }, [userId, firstVideo, isOnlineCourse, loadUserProgress]);

  // Initialize Vimeo Player when ready - only for online courses
  useEffect(() => {
    if (!isOnlineCourse) return;

    if (iframeRef.current && isVimeoReady && window.Vimeo && firstVideo) {
      try {
        const player = new window.Vimeo.Player(iframeRef.current);
        playerRef.current = player;
        let isFirstPlay = true;

        player.getDuration().then((dur: number) => {
          setDuration(dur);
        });

        if (userProgress.last_position_seconds > 0) {
          player.setCurrentTime(userProgress.last_position_seconds);
        }

        // Video events
        player.on('loaded', () => {
          setVideoLoaded(true);
        });

        player.on('play', () => {
          setVideoLoaded(true);
          setVideoEnded(false); // Reset video ended state when playing
          
          // İlk play'de progress kaydet
          if (isFirstPlay) {
            player.getCurrentTime().then((time: number) => {
              console.log('Hero video first play at time:', time);
              const progressPercent = duration > 0 ? (time / duration) * 100 : 0;
              handleProgressSave(time, progressPercent);
            });
            isFirstPlay = false;
          }
        });

        player.on('timeupdate', (data: VimeoEventData) => {
          setCurrentPosition(data.seconds);
          if (!videoLoaded) {
            setVideoLoaded(true);
          }
        });

        player.on('pause', () => {
          // Video paused - progress kaydet
          if (currentPosition > 0) {
            const progressPercent = duration > 0 ? (currentPosition / duration) * 100 : 0;
            handleProgressSave(currentPosition, progressPercent);
          }
        });

        player.on('ended', async () => {
          const progressPercent = 100;
          await handleProgressSave(duration, progressPercent);
          setVideoEnded(true); // Show overlay when video ends
        });

        return () => {
          player.off('loaded');
          player.off('timeupdate');
          player.off('play');
          player.off('pause');
          player.off('ended');
        };
      } catch (err) {
        console.error('Vimeo Player initialization error:', err);
        setError('Failed to initialize video player');
      }
    }
  }, [isVimeoReady, firstVideo, userProgress.last_position_seconds, duration, currentPosition, isOnlineCourse, handleProgressSave, videoLoaded]);

  const getVimeoEmbedUrl = (video: VimeoVideo): string | undefined => {
    if (video.vimeo_id) {
      const hashParam = video.vimeo_hash ? `&h=${video.vimeo_hash}` : '';
      return `https://player.vimeo.com/video/${video.vimeo_id}?badge=0&autopause=0&player_id=${video.id}&app_id=58479${hashParam}`;
    }
    return undefined;
  };

  const getLoadingText = () => {
    if (!courseDataLoaded) {
      return locale === 'en' ? 'Loading course...' : 'Kurs yükleniyor...';
    }
    return locale === 'en' ? 'Loading video...' : 'Video yükleniyor...';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleRetry = () => {
    setError(null);
    setVideoLoaded(false);
    setIsInitialized(false);
    
    if (!courseDataLoaded && (courseId || courseSlug)) {
      fetchCourseData();
    } else if (courseData?.id) {
      fetchFirstVideoWithCourseId(courseData.id);
    } else if (courseId && courseId !== 'undefined') {
      fetchFirstVideo();
    } else if (courseSlug && courseSlug !== 'undefined') {
      fetchFirstVideoBySlug();
    }
  };

  // For non-online courses, just show the banner
  if (courseDataLoaded && !isOnlineCourse) {
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
  }

  // Loading state - show until initialization is complete
  if (loading || !isInitialized) {
    return (
      <div className="w-full">
        <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 bg-neutral-200 dark:bg-neutral-700 rounded-sm flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin"></div>
              </div>
              <p className="text-sm text-neutral-500 font-medium">{getLoadingText()}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state for online courses - only show after initialization
  if (error || !firstVideo) {
    return (
      <div className="w-full">
        <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
          <Image
            src={getBannerUrl(courseData)}
            alt={getCourseTitle(courseData)}
            fill
            className="object-cover opacity-50"
            priority
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/20 rounded-sm flex items-center justify-center">
                <span className="text-red-600 text-xl">!</span>
              </div>
              <div>
                <p className="text-neutral-900 dark:text-neutral-100 font-medium">
                  {locale === 'en' ? 'Preview not available' : 'Önizleme mevcut değil'}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{locale === 'en' ? 'Retry' : 'Tekrar Dene'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const embedUrl = getVimeoEmbedUrl(firstVideo);

  return (
    <div className="w-full">
      {/* Video Container */}
      <div className="relative bg-neutral-100 dark:bg-neutral-800 rounded-sm overflow-hidden aspect-video border border-neutral-200 dark:border-neutral-700">
        {/* Video Player - Always showing */}
        {embedUrl && (
          <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
            {/* Loading Skeleton */}
            <div 
              className={`absolute inset-0 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center transition-opacity duration-700 ${
                videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
              }`}
              style={{ zIndex: 2 }}
            >
              <div className="text-center space-y-3">
                <div className="w-14 h-14 bg-white dark:bg-neutral-700 rounded-sm flex items-center justify-center shadow-sm">
                  <div className="w-5 h-5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                  {locale === 'en' ? 'Loading video...' : 'Video yükleniyor...'}
                </p>
              </div>
            </div>

            {/* Vimeo iframe */}
            <iframe
              ref={iframeRef}
              src={embedUrl}
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%',
                zIndex: 1
              }}
              title={firstVideo.title}
              id={`hero_player_${firstVideo.id}`}
            />

            {/* Video End Overlay */}
            {videoEnded && (
              <div 
                className="absolute inset-0 bg-black flex items-center justify-center transition-opacity duration-500"
                style={{ zIndex: 3 }}
              >
                <div className="text-center space-y-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white text-lg font-medium">
                      {locale === 'en' ? 'Video Completed' : 'Video Tamamlandı'}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {locale === 'en' ? 'Great job! You finished watching the preview.' : 'Harika! Önizlemeyi izlemeyi tamamladınız.'}
                    </p>
                  </div>
                  <button
                    onClick={handleReplayVideo}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  >
                    <Replay className="w-4 h-4" />
                    <span>{locale === 'en' ? 'Watch Again' : 'Tekrar İzle'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progress Overlay */}
        {videoLoaded && !videoEnded && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            {userProgress.is_completed && (
              <div className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>{locale === 'en' ? 'Completed' : 'Tamamlandı'}</span>
              </div>
            )}
          </div>
        )}

        {/* Resume Button */}
        {videoLoaded && !videoEnded && userProgress.last_position_seconds > 30 && !userProgress.is_completed && (
          <div className="absolute bottom-4 left-4">
            <button
              onClick={() => {
                if (playerRef.current) {
                  playerRef.current.setCurrentTime(userProgress.last_position_seconds);
                  playerRef.current.play();
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>
                {locale === 'en' 
                  ? `Resume from ${formatDuration(userProgress.last_position_seconds)}`
                  : `${formatDuration(userProgress.last_position_seconds)} konumundan devam et`
                }
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseHeroSection;