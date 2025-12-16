// components/shared/content/MyUNIVideo.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, CheckCircle, AlertCircle, ArrowRight, Repeat, Users, Calendar } from 'lucide-react';
import supabase from '../../../_services/supabaseClient';

// Tip tanımlamaları
interface VimeoEventData {
  seconds: number;
  percent?: number;
  duration?: number;
}

interface VimeoPlayer {
  on(event: string, callback: (data?: VimeoEventData) => void): void;
  getDuration(): Promise<number>;
  setCurrentTime(seconds: number): Promise<void>;
  destroy(): void;
  ready?(): Promise<void>;
  play(): Promise<void>;
}

// Database response types
interface CourseVideoRecord {
  id: string;
  lesson_id: string;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number | null;
  vimeo_hash: string | null;
}

interface EventVideoRecord {
  id: string;
  session_id: string;
  title: string;
  description: string | null;
  vimeo_id: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number | null;
  vimeo_hash: string | null;
}

interface MyUNIVideoProps {
  contentId: string; // lessonId veya sessionId
  userId?: string;
  type: 'course' | 'event'; // İçerik tipi
  onProgress?: (progress: number) => void;
  onComplete?: () => Promise<void>;
  onNext?: () => void; // Sonraki içerik için callback
  hasNext?: boolean; // Sonraki içerik var mı?
  texts?: {
    loading?: string;
    videoLoading?: string;
    videoCompleted?: string;
    completedSuccessfully?: string;
    rewatch?: string;
    nextVideo?: string;
    nextSession?: string;
    navigationInfo?: string;
    eventNavigationInfo?: string;
    videoLoadError?: string;
    retry?: string;
  };
}

interface VideoContent {
  id: string;
  content_id: string | null; // lesson_id veya session_id
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
  video_watch_count: number;
  last_video_watch_at?: string;
}

const defaultTexts = {
  loading: 'Yükleniyor...',
  videoLoading: 'Video yükleniyor...',
  videoCompleted: 'Video Tamamlandı',
  sessionCompleted: 'Oturum Tamamlandı',
  completedSuccessfully: 'videosunu başarıyla tamamladınız.',
  sessionCompletedSuccessfully: 'oturumunu başarıyla tamamladınız.',
  rewatch: 'Tekrar İzle',
  nextVideo: 'Sonraki Videoya Geç',
  nextSession: 'Sonraki Oturuma Geç',
  navigationInfo: 'Soldaki menüden diğer derslere ulaşabilirsiniz',
  eventNavigationInfo: 'Soldaki menüden diğer oturumlara ulaşabilirsiniz',
  videoLoadError: 'Video Yüklenemedi',
  retry: 'Tekrar Dene'
};

export function MyUNIVideo({
  contentId,
  userId,
  type,
  onProgress,
  onComplete,
  onNext,
  hasNext = false,
  texts = {}
}: MyUNIVideoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoContent | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    watch_time_seconds: 0,
    last_position_seconds: 0,
    is_completed: false,
    video_watch_count: 0,
  });
  const [completionThreshold] = useState(3); // 3 seconds before end
  const [showEndScreen, setShowEndScreen] = useState(false); // Custom end screen state

  // Player states - separate from loading states
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const initializationRef = useRef(false); // Prevent multiple initializations

  // Metinleri birleştir
  const t = { ...defaultTexts, ...texts };

  // Stable embed URL - memoized to prevent re-renders
  const embedUrl = useCallback((video: VideoContent) => {
    if (!video.vimeo_id) return undefined;

    const baseUrl = `https://player.vimeo.com/video/${video.vimeo_id}`;
    const params = new URLSearchParams({
      badge: '0',
      autopause: '0',
      controls: '1',
      keyboard: '1',
      responsive: '1'
    });

    if (video.vimeo_hash) {
      params.set('h', video.vimeo_hash);
    }

    return `${baseUrl}?${params.toString()}`;
  }, []);

  // Get table names based on content type
  const getTableNames = useCallback(() => {
    if (type === 'course') {
      return {
        videosTable: 'myuni_videos',
        progressTable: 'myuni_user_progress',
        contentIdField: 'lesson_id'
      };
    } else {
      return {
        videosTable: 'myuni_event_videos', // Assuming this table exists
        progressTable: 'myuni_event_user_progress', // Assuming this table exists
        contentIdField: 'session_id'
      };
    }
  }, [type]);

  // Fetch video content - memoized to prevent re-fetching
  const fetchVideoContent = useCallback(async () => {
    if (!contentId) return;

    try {
      setLoading(true);
      setError(null);

      const { videosTable, contentIdField } = getTableNames();

      if (type === 'course') {
        // Course video query
        const { data, error } = await supabase
          .from(videosTable)
          .select('id, lesson_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash')
          .eq('lesson_id', contentId)
          .order('order_index', { ascending: true })
          .limit(1);

        if (error) throw new Error(error.message);

        if (data && data.length > 0) {
          const courseVideo = data[0] as CourseVideoRecord;
          const videoData: VideoContent = {
            id: courseVideo.id,
            content_id: courseVideo.lesson_id,
            title: courseVideo.title,
            description: courseVideo.description,
            vimeo_id: courseVideo.vimeo_id,
            video_url: courseVideo.video_url,
            thumbnail_url: courseVideo.thumbnail_url,
            duration_seconds: courseVideo.duration_seconds,
            order_index: courseVideo.order_index,
            vimeo_hash: courseVideo.vimeo_hash
          };
          setCurrentVideo(videoData);
        } else {
          setError('No video content found for this lesson');
        }
      } else {
        // Event video query
        const { data, error } = await supabase
          .from(videosTable)
          .select('id, session_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash')
          .eq('session_id', contentId)
          .order('order_index', { ascending: true })
          .limit(1);

        if (error) throw new Error(error.message);

        if (data && data.length > 0) {
          const eventVideo = data[0] as EventVideoRecord;
          const videoData: VideoContent = {
            id: eventVideo.id,
            content_id: eventVideo.session_id,
            title: eventVideo.title,
            description: eventVideo.description,
            vimeo_id: eventVideo.vimeo_id,
            video_url: eventVideo.video_url,
            thumbnail_url: eventVideo.thumbnail_url,
            duration_seconds: eventVideo.duration_seconds,
            order_index: eventVideo.order_index,
            vimeo_hash: eventVideo.vimeo_hash
          };
          setCurrentVideo(videoData);
        } else {
          setError('No video content found for this session');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load video content`);
      console.error('Video fetch error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [contentId, type, getTableNames]);

  // Load user progress - separate effect
  const loadUserProgress = useCallback(async () => {
    if (!userId || !currentVideo) return;

    try {
      const { progressTable } = getTableNames();

      if (type === 'course') {
        // Course progress query
        const { data, error } = await supabase
          .from(progressTable)
          .select('watch_time_seconds, last_position_seconds, is_completed, completed_at, video_watch_count, last_video_watch_at')
          .eq('user_id', userId)
          .eq('lesson_id', contentId)
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
            video_watch_count: data.video_watch_count || 0,
            last_video_watch_at: data.last_video_watch_at,
          });
        }
      } else {
        // Event progress query
        const { data, error } = await supabase
          .from(progressTable)
          .select('watch_time_seconds, last_position_seconds, is_completed, completed_at, video_watch_count, last_video_watch_at')
          .eq('user_id', userId)
          .eq('session_id', contentId)
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
            video_watch_count: data.video_watch_count || 0,
            last_video_watch_at: data.last_video_watch_at,
          });
        }
      }
    } catch (error) {
      console.error('Progress load error:', error);
    }
  }, [userId, currentVideo, contentId, type, getTableNames]);

  // Save progress to database
  const saveProgressToDb = useCallback(async (position: number, isCompleted: boolean = false) => {
    if (!userId || !contentId) {
      console.log('Missing required data for saving progress:', { userId, contentId });
      return;
    }

    try {
      const { progressTable } = getTableNames();
      const currentWatchCount = userProgress?.video_watch_count || 0;
      
      if (type === 'course') {
        // Course progress data
        const progressData = {
          user_id: userId,
          lesson_id: contentId,
          last_position_seconds: Math.floor(position),
          watch_time_seconds: Math.floor(position),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          video_watch_count: currentWatchCount + (isCompleted ? 1 : 0),
          last_video_watch_at: new Date().toISOString()
        };

        console.log('Attempting to save course progress to database:', progressData);

        const { data, error } = await supabase
          .from(progressTable)
          .upsert(progressData, {
            onConflict: 'user_id,lesson_id'
          })
          .select();

        if (error) {
          console.error('❌ Supabase error saving course progress:', error);
        } else {
          console.log('✅ Course progress saved successfully to database!');
          setUserProgress(prev => ({
            ...prev,
            last_position_seconds: Math.floor(position),
            watch_time_seconds: Math.floor(position),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : prev.completed_at,
            video_watch_count: currentWatchCount + (isCompleted ? 1 : 0),
            last_video_watch_at: new Date().toISOString()
          }));
        }
      } else {
        // Event progress data
        const progressData = {
          user_id: userId,
          session_id: contentId,
          last_position_seconds: Math.floor(position),
          watch_time_seconds: Math.floor(position),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          video_watch_count: currentWatchCount + (isCompleted ? 1 : 0),
          last_video_watch_at: new Date().toISOString()
        };

        console.log('Attempting to save event progress to database:', progressData);

        const { data, error } = await supabase
          .from(progressTable)
          .upsert(progressData, {
            onConflict: 'user_id,session_id'
          })
          .select();

        if (error) {
          console.error('❌ Supabase error saving event progress:', error);
        } else {
          console.log('✅ Event progress saved successfully to database!');
          setUserProgress(prev => ({
            ...prev,
            last_position_seconds: Math.floor(position),
            watch_time_seconds: Math.floor(position),
            is_completed: isCompleted,
            completed_at: isCompleted ? new Date().toISOString() : prev.completed_at,
            video_watch_count: currentWatchCount + (isCompleted ? 1 : 0),
            last_video_watch_at: new Date().toISOString()
          }));
        }
      }

      if (error) {
        console.error('❌ Supabase error saving progress:', error);
      } else {
        console.log('✅ Progress saved successfully to database!');

        // Update local state to reflect the saved progress
        setUserProgress(prev => ({
          ...prev,
          last_position_seconds: Math.floor(position),
          watch_time_seconds: Math.floor(position),
          is_completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : prev.completed_at,
          video_watch_count: currentWatchCount + (isCompleted ? 1 : 0),
          last_video_watch_at: new Date().toISOString()
        }));
      }
    } catch (error) {
      console.error('❌ Exception while saving progress:', error);
    }
  }, [userId, contentId, userProgress?.video_watch_count, getTableNames]);

  // Initialize Vimeo Player - only when needed
  const initializePlayer = useCallback(async () => {
    if (!iframeRef.current || !currentVideo || playerRef.current || initializationRef.current) {
      return;
    }

    if (!window.Vimeo?.Player) {
      console.error('Vimeo Player API not loaded');
      return;
    }

    try {
      initializationRef.current = true;
      console.log('Initializing Vimeo Player...');

      const player = new window.Vimeo.Player(iframeRef.current);
      playerRef.current = player;

      // Store current values to avoid stale closures
      let currentPos = 0;
      let lastSaved = 0;
      let playerDuration = 0;

      // Set up event listeners
      player.on('loaded', async () => {
        console.log('Player loaded');
        setPlayerInitialized(true);
        setIframeReady(true);

        // Get duration when player is loaded
        try {
          const dur = await player.getDuration();
          playerDuration = dur;
          console.log('Duration:', dur);

          // Seek to last position if available
          if (userProgress.last_position_seconds > 0 && userProgress.last_position_seconds < dur) {
            try {
              await player.setCurrentTime(userProgress.last_position_seconds);
              console.log('Resumed from:', userProgress.last_position_seconds);
            } catch (e) {
              console.warn('Could not seek to last position:', e);
            }
          }
        } catch (e) {
          console.warn('Could not get duration:', e);
        }
      });

      player.on('play', () => {
        console.log('Play event');
        setPlayerInitialized(true);
        setShowEndScreen(false); // Hide end screen when playing
      });

      player.on('pause', () => {
        console.log('⏸️ Pause event - saving progress at position:', currentPos);
        // Save progress when user pauses
        if (userId && contentId && currentPos > 0) {
          saveProgressToDb(currentPos);
        }
      });

      player.on('timeupdate', (data?: VimeoEventData) => {
        if (!data) return;

        const currentSeconds = data.seconds;
        currentPos = currentSeconds;

        // Progress tracking
        if (onProgress && playerDuration > 0) {
          const progress = Math.min(100, (currentSeconds / playerDuration) * 100);
          onProgress(progress);
        }

        // Save progress every 10 seconds
        if (Math.abs(currentSeconds - lastSaved) >= 10 && currentSeconds > 0) {
          console.log('⏰ Auto-saving progress every 10 seconds at:', currentSeconds);
          if (userId && contentId) {
            saveProgressToDb(currentSeconds);
            lastSaved = currentSeconds;
          }
        }

        // Completion check - 3 seconds before video ends
        if (playerDuration > 0) {
          const remainingTime = playerDuration - currentSeconds;
          if (remainingTime <= completionThreshold && !userProgress.is_completed) {
            console.log(`🎯 Video near completion (${remainingTime.toFixed(1)}s remaining), marking as completed`);
            if (userId && contentId) {
              saveProgressToDb(currentSeconds, true);
              setUserProgress(prev => ({
                ...prev,
                is_completed: true,
                completed_at: new Date().toISOString()
              }));
            }
            if (onComplete) {
              onComplete().then(() => {
                console.log('✅ onComplete callback executed successfully');
              }).catch((error) => {
                console.error('❌ Error in onComplete callback:', error);
              });
            }
          }
        }
      });

      player.on('ended', () => {
        console.log('🏁 Video ended - showing custom end screen');
        setShowEndScreen(true); // Show custom end screen

        if (userId && contentId) {
          saveProgressToDb(playerDuration || currentPos, true);
          // Update local state to reflect completion
          setUserProgress(prev => ({
            ...prev,
            is_completed: true,
            completed_at: new Date().toISOString()
          }));
        }
        if (onComplete) {
          onComplete().then(() => {
            console.log('✅ onComplete callback executed successfully');
          }).catch((error) => {
            console.error('❌ Error in onComplete callback:', error);
          });
        }
      });

      player.on('error', (data?: VimeoEventData) => {
        console.error('Vimeo player error:', data);
        setError(`Video player error: Player error occurred`);
      });

    } catch (err) {
      console.error('Player initialization error:', err);
      setError(`Failed to initialize video player: ${err}`);
      initializationRef.current = false;
    }
  }, [currentVideo, userProgress.last_position_seconds, userProgress.is_completed, completionThreshold, onProgress, onComplete, userId, contentId, saveProgressToDb]);

  // Load Vimeo API
  useEffect(() => {
    if (window.Vimeo?.Player) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    script.onload = () => {
      console.log('Vimeo API loaded');
    };
    script.onerror = () => {
      setError('Failed to load Vimeo Player API');
    };

    // Only add if not already present
    if (!document.querySelector('script[src*="player.vimeo.com"]')) {
      document.head.appendChild(script);
    }
  }, []);

  // Fetch video content when contentId changes
  useEffect(() => {
    fetchVideoContent();

    // Reset player state when content changes
    setPlayerInitialized(false);
    setIframeReady(false);
    setShowEndScreen(false);
    initializationRef.current = false;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      playerRef.current = null;
    }
  }, [contentId, fetchVideoContent]);

  // Load user progress when video is loaded
  useEffect(() => {
    if (currentVideo) {
      loadUserProgress();
    }
  }, [currentVideo, loadUserProgress]);

  // Initialize player when iframe is ready and video is loaded
  useEffect(() => {
    if (iframeReady && currentVideo && !playerInitialized) {
      const timer = setTimeout(() => {
        initializePlayer();
      }, 500); // Small delay to ensure iframe is fully loaded

      return () => clearTimeout(timer);
    }
  }, [iframeReady, currentVideo, playerInitialized, initializePlayer]);

  // Handle iframe load
  const handleIframeLoad = useCallback(() => {
    console.log('Iframe loaded');
    setIframeReady(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.warn('Error destroying player on unmount:', e);
        }
      }
    };
  }, []);

  const handleRetry = () => {
    setError(null);
    setPlayerInitialized(false);
    setIframeReady(false);
    setShowEndScreen(false);
    initializationRef.current = false;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying player on retry:', e);
      }
      playerRef.current = null;
    }

    fetchVideoContent();
  };

  const handleNext = () => {
    if (onNext) {
      setShowEndScreen(false);
      onNext();
    }
  };

  // Tekrar izleme fonksiyonu
  const handleReplay = async () => {
    if (!playerRef.current) return;
    
    try {
      console.log('🔄 Replaying video...');
      setShowEndScreen(false);
      
      // Video'yu başa sar ve oynat
      await playerRef.current.setCurrentTime(0);
      await playerRef.current.play();
      
      console.log('✅ Video replayed successfully');
    } catch (error) {
      console.error('❌ Error replaying video:', error);
    }
  };

  // Get completion icon based on content type
  const getCompletionIcon = () => {
    if (type === 'event') {
      return <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />;
    }
    return <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />;
  };

  // Get completion title based on content type
  const getCompletionTitle = () => {
    return type === 'course' ? t.videoCompleted : t.sessionCompleted;
  };

  // Get completion message based on content type
  const getCompletionMessage = () => {
    return type === 'course' ? t.completedSuccessfully : t.sessionCompletedSuccessfully;
  };

  // Get next button text based on content type
  const getNextButtonText = () => {
    return type === 'course' ? t.nextVideo : t.nextSession;
  };

  // Get navigation info based on content type
  const getNavigationInfo = () => {
    return type === 'course' ? t.navigationInfo : t.eventNavigationInfo;
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 mx-auto mb-4 flex items-center justify-center">
            {type === 'course' ? (
              <Play className="w-8 h-8 text-neutral-600" />
            ) : (
              <Calendar className="w-8 h-8 text-neutral-600" />
            )}
          </div>
          <p className="text-sm text-neutral-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !currentVideo || !currentVideo.vimeo_id) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-800 p-6">
        <div className="text-center space-y-4 max-w-2xl">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 mx-auto flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">{t.videoLoadError}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {error || 'Vimeo video bilgileri eksik'}
            </p>

            <button
              onClick={handleRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.retry}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const videoEmbedUrl = embedUrl(currentVideo);

  return (
    <div className="h-full flex justify-center">
      <div className="w-full max-w-7xl">
        {/* Video Container */}
        <div className="overflow-hidden relative">
          {videoEmbedUrl && (
            <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
              {/* Loading Skeleton */}
              <div
                className={`absolute inset-0 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center transition-opacity duration-700 ${
                  (iframeReady && playerInitialized) ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
                style={{ zIndex: 2 }}
              >
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 bg-white dark:bg-neutral-700 flex items-center justify-center shadow-sm">
                    {type === 'course' ? (
                      <Play className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                    ) : (
                      <Calendar className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                    )}
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    {t.videoLoading}
                  </p>
                </div>
              </div>

              {/* Custom End Screen Overlay */}
              <div
                className={`absolute inset-0 bg-black flex items-center justify-center transition-opacity duration-500 ${
                  showEndScreen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}
                style={{ zIndex: 3 }}
              >
                <div className="text-center space-y-4 sm:space-y-6 px-4 sm:px-6 max-w-sm sm:max-w-md">
                  {/* Completion Icon */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white mx-auto flex items-center justify-center rounded-full">
                    {getCompletionIcon()}
                  </div>

                  {/* Video Completed Message */}
                  <div className="space-y-2">
                    <h3 className="text-white text-lg sm:text-xl font-medium">{getCompletionTitle()}</h3>
                    <p className="text-neutral-300 text-xs sm:text-sm px-2 sm:px-0">
                      {currentVideo.title} {getCompletionMessage()}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 w-full">
                    {/* Replay Button */}
                    <button
                      onClick={handleReplay}
                      className="inline-flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-2.5 sm:px-6 sm:py-3 bg-white text-black hover:bg-neutral-100 transition-colors duration-200 font-medium text-sm sm:text-base w-full sm:w-auto border-2 border-transparent hover:border-neutral-200"
                    >
                      <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span>{t.rewatch}</span>
                    </button>

                    {/* Next Content Button */}
                    {hasNext && (
                      <button
                        onClick={handleNext}
                        className={`inline-flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-2.5 sm:px-6 sm:py-3 text-white hover:opacity-90 transition-colors duration-200 font-medium text-sm sm:text-base w-full sm:w-auto ${
                          type === 'course' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        <span>{getNextButtonText()}</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>

                  {/* Navigation Info */}
                  <div className="pt-2 sm:pt-4">
                    <p className="text-neutral-400 text-xs sm:text-sm px-2 sm:px-0">
                      {getNavigationInfo()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vimeo iframe */}
              <iframe
                ref={iframeRef}
                src={videoEmbedUrl}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                allowFullScreen
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1
                }}
                title={currentVideo.title}
                onLoad={handleIframeLoad}
                onError={() => setError('Failed to load video iframe')}
              />
            </div>
          )}
        </div>

        {/* Video Info */}
        <div className="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 mt-4">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-lg text-neutral-900 dark:text-neutral-100">
              {currentVideo.title}
            </h3>
            {userProgress.is_completed && (
              type === 'course' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Users className="w-5 h-5 text-blue-600" />
              )
            )}
          </div>

          {currentVideo.description && (
            <div
              className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentVideo.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}