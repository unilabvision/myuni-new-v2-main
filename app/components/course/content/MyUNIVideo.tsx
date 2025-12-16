// components/course/content/MyUNIVideo.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, RotateCcw, CheckCircle, AlertCircle, ArrowRight, Repeat } from 'lucide-react';
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

interface MyUNIVideoProps {
  lessonId: string;
  userId?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => Promise<void>;
  onNextVideo?: () => void; // Sonraki video için callback
  hasNextVideo?: boolean; // Sonraki video var mı?
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
  video_watch_count: number;
  last_video_watch_at?: string;
}

export function MyUNIVideo({
  lessonId,
  userId,
  onProgress,
  onComplete,
  onNextVideo,
  hasNextVideo = false
}: MyUNIVideoProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VimeoVideo | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null); // Start with null to detect when progress is loaded
  const [completionThreshold] = useState(3); // 3 seconds before end
  const [showEndScreen, setShowEndScreen] = useState(false); // Custom end screen state

  // Player states - separate from loading states
  const [playerInitialized, setPlayerInitialized] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayer | null>(null);
  const initializationRef = useRef(false); // Prevent multiple initializations

  // Stable embed URL - memoized to prevent re-renders
  const embedUrl = useCallback((video: VimeoVideo) => {
    if (!video.vimeo_id) return undefined;

    const baseUrl = `https://player.vimeo.com/video/${video.vimeo_id}`;
    const params = new URLSearchParams({
      badge: '0',
      autopause: '0',
      autoplay: '0', // Disable autoplay to prevent unwanted playback
      controls: '1',
      keyboard: '1',
      responsive: '1',
      playsinline: '1' // Better mobile experience
    });

    if (video.vimeo_hash) {
      params.set('h', video.vimeo_hash);
    }

    return `${baseUrl}?${params.toString()}`;
  }, []);

  // Fetch video content - memoized to prevent re-fetching
  const fetchVideoContent = useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('myuni_videos')
        .select('id, lesson_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (error) throw new Error(error.message);

      if (data && data.length > 0) {
        setCurrentVideo(data[0]);
      } else {
        setError('No video content found for this lesson');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError('Failed to load video content');
      console.error('Video fetch error:', errorMsg);
    } finally {
      setLoading(false);
    }
  }, [lessonId]); // Only depend on lessonId

  // Load user progress - separate effect
  const loadUserProgress = useCallback(async () => {
    if (!userId || !currentVideo) return;

    try {
      console.log('🔄 Loading user progress for lesson:', lessonId);
      
      const { data, error } = await supabase
        .from('myuni_user_progress')
        .select('watch_time_seconds, last_position_seconds, is_completed, completed_at, video_watch_count, last_video_watch_at')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }

      if (data) {
        console.log('✅ Found existing progress:', data);
        setUserProgress({
          watch_time_seconds: data.watch_time_seconds || 0,
          last_position_seconds: data.last_position_seconds || 0,
          is_completed: data.is_completed || false,
          completed_at: data.completed_at,
          video_watch_count: data.video_watch_count || 0,
          last_video_watch_at: data.last_video_watch_at,
        });
      } else {
        // No progress found, set default values for this lesson
        console.log('📝 No progress found, setting defaults for lesson:', lessonId);
        setUserProgress({
          watch_time_seconds: 0,
          last_position_seconds: 0,
          is_completed: false,
          video_watch_count: 0,
        });
      }
    } catch (error) {
      console.error('❌ Progress load error:', error);
      // Set default values on error for this specific lesson
      setUserProgress({
        watch_time_seconds: 0,
        last_position_seconds: 0,
        is_completed: false,
        video_watch_count: 0,
      });
    }
  }, [userId, currentVideo, lessonId]);

  // Save progress to database
  const saveProgressToDb = useCallback(async (position: number, isCompleted: boolean = false) => {
    if (!userId || !lessonId) {
      console.log('Missing required data for saving progress:', { userId, lessonId });
      return;
    }

    try {
      const currentWatchCount = userProgress?.video_watch_count || 0;
      const currentCompletionStatus = userProgress?.is_completed || false;
      
      // If video was already completed, don't override the completion status unless explicitly completing again
      const finalCompletionStatus = currentCompletionStatus ? true : isCompleted;
      
      const progressData = {
        user_id: userId,
        lesson_id: lessonId,
        last_position_seconds: Math.floor(position),
        watch_time_seconds: Math.floor(position),
        is_completed: finalCompletionStatus,
        completed_at: finalCompletionStatus ? (userProgress?.completed_at || new Date().toISOString()) : null,
        video_watch_count: currentWatchCount + (isCompleted && !currentCompletionStatus ? 1 : 0),
        last_video_watch_at: new Date().toISOString()
      };

      console.log('Attempting to save progress to database:', progressData);

      const { data, error } = await supabase
        .from('myuni_user_progress')
        .upsert(progressData, {
          onConflict: 'user_id,lesson_id'
        })
        .select();

      if (error) {
        console.error('❌ Supabase error saving progress:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        console.error('Error code:', error.code);
      } else {
        console.log('✅ Progress saved successfully to database!');
        console.log('Saved data:', progressData);
        console.log('Database response:', data);

        // Update local state to reflect the saved progress
        setUserProgress(prev => {
          if (!prev) {
            return {
              watch_time_seconds: Math.floor(position),
              last_position_seconds: Math.floor(position),
              is_completed: finalCompletionStatus,
              completed_at: finalCompletionStatus ? new Date().toISOString() : undefined,
              video_watch_count: currentWatchCount + (isCompleted && !currentCompletionStatus ? 1 : 0),
              last_video_watch_at: new Date().toISOString()
            };
          }
          return {
            ...prev,
            last_position_seconds: Math.floor(position),
            watch_time_seconds: Math.floor(position),
            is_completed: finalCompletionStatus,
            completed_at: finalCompletionStatus ? (prev.completed_at || new Date().toISOString()) : prev.completed_at,
            video_watch_count: currentWatchCount + (isCompleted && !currentCompletionStatus ? 1 : 0),
            last_video_watch_at: new Date().toISOString()
          };
        });

        // Trigger sidebar progress update if completion status changed
        if (isCompleted && !currentCompletionStatus && onProgress) {
          console.log('🔄 Triggering sidebar progress update after completion');
          // Trigger parent component to update progress
          setTimeout(() => {
            if (onProgress) {
              onProgress(100); // Force 100% completion
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Exception while saving progress:', error);
      console.error('Exception details:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Exception stack:', error instanceof Error ? error.stack : 'No stack');
    }
  }, [userId, lessonId, userProgress?.video_watch_count, userProgress?.is_completed, userProgress?.completed_at]);

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
          console.log('Video duration:', dur);

          // Wait a bit for the player to be fully ready before seeking
          setTimeout(async () => {
            // Seek to last position if available and reasonable
            const lastPos = userProgress?.last_position_seconds || 0;
            if (lastPos > 0 && lastPos < (dur - 5)) { // Don't seek if too close to end
              try {
                console.log('Attempting to seek to last position:', lastPos);
                await player.setCurrentTime(lastPos);
                console.log('✅ Successfully resumed from:', lastPos);
              } catch (e) {
                console.warn('❌ Could not seek to last position:', e);
                // If seeking fails, start from beginning
                try {
                  await player.setCurrentTime(0);
                  console.log('Started from beginning due to seek error');
                } catch (seekError) {
                  console.warn('Could not seek to beginning either:', seekError);
                }
              }
            } else if (lastPos === 0 || lastPos >= (dur - 5)) {
              // Start from beginning for new videos or completed videos
              try {
                await player.setCurrentTime(0);
                console.log('Started from beginning (new or completed video)');
              } catch (seekError) {
                console.warn('Could not seek to beginning:', seekError);
              }
            }
          }, 1500); // Wait 1.5 seconds for player to be fully ready

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
        // Save progress when user pauses (but don't change completion status)
        if (userId && lessonId && currentPos > 0) {
          saveProgressToDb(currentPos, false); // Explicitly pass false to not override completion
        }
      });

      player.on('timeupdate', (data?: VimeoEventData) => {
        if (!data) return;

        const currentSeconds = data.seconds;
        currentPos = currentSeconds;

        // Progress tracking
        if (onProgress && playerDuration > 0) {
          const progress = Math.min(100, (currentSeconds / playerDuration) * 100); // ✅ Max %100 garantisi
          onProgress(progress);
        }

        // Save progress every 10 seconds
        if (Math.abs(currentSeconds - lastSaved) >= 10 && currentSeconds > 0) {
          console.log('⏰ Auto-saving progress every 10 seconds at:', currentSeconds);
          if (userId && lessonId) {
            saveProgressToDb(currentSeconds, false); // Don't override completion status on auto-save
            lastSaved = currentSeconds;
          }
        }

        // Completion check - 3 seconds before video ends
        if (playerDuration > 0) {
          const remainingTime = playerDuration - currentSeconds;
          if (remainingTime <= completionThreshold && !userProgress?.is_completed) {
            console.log(`🎯 Video near completion (${remainingTime.toFixed(1)}s remaining), marking as completed`);
            if (userId && lessonId) {
              saveProgressToDb(currentSeconds, true);
              setUserProgress(prev => {
                if (!prev) {
                  return {
                    watch_time_seconds: Math.floor(currentSeconds),
                    last_position_seconds: Math.floor(currentSeconds),
                    is_completed: true,
                    completed_at: new Date().toISOString(),
                    video_watch_count: 1,
                    last_video_watch_at: new Date().toISOString()
                  };
                }
                return {
                  ...prev,
                  is_completed: true,
                  completed_at: new Date().toISOString()
                };
              });
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

        if (userId && lessonId) {
          saveProgressToDb(playerDuration || currentPos, true);
          // Update local state to reflect completion
          setUserProgress(prev => {
            if (!prev) {
              return {
                watch_time_seconds: Math.floor(playerDuration || currentPos),
                last_position_seconds: Math.floor(playerDuration || currentPos),
                is_completed: true,
                completed_at: new Date().toISOString(),
                video_watch_count: 1,
                last_video_watch_at: new Date().toISOString()
              };
            }
            return {
              ...prev,
              is_completed: true,
              completed_at: new Date().toISOString()
            };
          });
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
  }, [currentVideo, userProgress?.last_position_seconds, userProgress?.is_completed, completionThreshold, onProgress, onComplete, userId, lessonId, saveProgressToDb]);

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

  // Fetch video content when lessonId changes
  useEffect(() => {
    // Reset player state when lesson changes
    setPlayerInitialized(false);
    setIframeReady(false);
    setShowEndScreen(false);
    initializationRef.current = false;

    // Reset user progress state for new lesson (but don't clear it completely)
    setUserProgress(null); // Will be loaded fresh for the new lesson

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.warn('Error destroying player:', e);
      }
      playerRef.current = null;
    }

    // Fetch new video content
    fetchVideoContent();
  }, [lessonId, fetchVideoContent]); // Include fetchVideoContent

  // Load user progress when video is loaded
  useEffect(() => {
    if (currentVideo && currentVideo.id && userId) {
      console.log('Loading user progress for video:', currentVideo.id, 'lesson:', lessonId);
      loadUserProgress();
    }
  }, [currentVideo, loadUserProgress, userId, lessonId]);

  // Initialize player when iframe is ready, video is loaded, and user progress is loaded
  useEffect(() => {
    if (iframeReady && currentVideo && !playerInitialized && userProgress !== null) {
      console.log('Ready to initialize player with progress:', userProgress.last_position_seconds);
      const timer = setTimeout(() => {
        initializePlayer();
      }, 1000); // Increased delay to ensure all data is loaded

      return () => clearTimeout(timer);
    }
  }, [iframeReady, currentVideo, playerInitialized, userProgress, initializePlayer]);

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

  const handleNextVideo = () => {
    if (onNextVideo) {
      setShowEndScreen(false);
      onNextVideo();
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

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 mx-auto mb-4 flex items-center justify-center">
            <Play className="w-8 h-8 text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-600">Loading video...</p>
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
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Video Yüklenemedi</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              {error || 'Vimeo video bilgileri eksik'}
            </p>

            <button
              onClick={handleRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
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
                    <Play className="w-7 h-7 text-neutral-400 dark:text-neutral-500" />
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    Video yükleniyor...
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
                    <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
                  </div>

                  {/* Video Completed Message */}
                  <div className="space-y-2">
                    <h3 className="text-white text-lg sm:text-xl font-medium">Video Tamamlandı</h3>
                    <p className="text-neutral-300 text-xs sm:text-sm px-2 sm:px-0">
                      {currentVideo.title} videosunu başarıyla tamamladınız.
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
                      <span>Tekrar İzle</span>
                    </button>

                    {/* Next Video Button */}
                    {hasNextVideo && (
                      <button
                        onClick={handleNextVideo}
                        className="inline-flex items-center justify-center space-x-2 sm:space-x-3 px-4 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 font-medium text-sm sm:text-base w-full sm:w-auto"
                      >
                        <span>Sonraki Videoya Geç</span>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </div>

                  {/* Navigation Info */}
                  <div className="pt-2 sm:pt-4">
                    <p className="text-neutral-400 text-xs sm:text-sm px-2 sm:px-0">
                      Soldaki menüden diğer derslere ulaşabilirsiniz
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
            {userProgress?.is_completed && <CheckCircle className="w-5 h-5 text-green-600" />}
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