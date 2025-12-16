"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play } from 'lucide-react';
import supabase from '../../../../../_services/supabaseClient';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle?: string;
  courseId?: string;
  courseSlug?: string;
  locale?: string;
  texts?: {
    preview?: string;
    loading?: string;
    error?: string;
    retry?: string;
  };
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

// Type for Vimeo Player event data
interface VimeoTimeUpdateData {
  seconds: number;
}

// Type for Vimeo Player methods we use - matching the global type
interface VimeoPlayerMethods {
  on: (event: string, callback: (data?: VimeoTimeUpdateData) => void) => void;
  off: (event: string) => void;
  pause: () => Promise<void>;
  destroy: () => void; // Changed to void to match the global type
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle = 'Video Preview',
  courseId = '',
  courseSlug = '',
  locale = 'tr',
  texts = {
    preview: 'Önizleme',
    loading: 'Video yükleniyor...',
    error: 'Video yüklenemedi',
    retry: 'Yeniden Dene'
  }
}) => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<VimeoVideo | null>(null);
  const [isVimeoReady, setIsVimeoReady] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPreviewLimitReached, setIsPreviewLimitReached] = useState(false);
  const [showPurchaseOverlay, setShowPurchaseOverlay] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  const PREVIEW_LIMIT_SECONDS = 60; // 1 dakika
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<VimeoPlayerMethods | null>(null);

  // Load Vimeo Player API script
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Vimeo) {
      const script = document.createElement('script');
      script.src = 'https://player.vimeo.com/api/player.js';
      script.async = true;
      script.onload = () => setIsVimeoReady(true);
      script.onerror = () => setError('Failed to load Vimeo Player API');
      
      if (!document.querySelector('script[src="https://player.vimeo.com/api/player.js"]')) {
        document.body.appendChild(script);
      } else {
        setIsVimeoReady(true);
      }
    } else if (window.Vimeo) {
      setIsVimeoReady(true);
    }
  }, []);

  // Fetch video data function
  const fetchVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setVideo(null);
      setVideoLoaded(false);

      if (!lessonId || lessonId === 'undefined' || lessonId === 'null') {
        throw new Error('Invalid lesson ID provided');
      }

      // Fetch the first video of the lesson for preview
      const { data: videos, error: videosError } = await supabase
        .from('myuni_videos')
        .select('id, lesson_id, title, description, vimeo_id, video_url, thumbnail_url, duration_seconds, order_index, vimeo_hash')
        .eq('lesson_id', lessonId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (videosError) {
        console.error('Videos query error:', videosError);
        throw new Error(`Failed to fetch videos: ${videosError.message}`);
      }

      if (videos && videos.length > 0) {
        setVideo(videos[0]);
      } else {
        setError('No video content found for this lesson');
      }
    } catch (err) {
      console.error('Video fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  // Check enrollment status
  const checkEnrollmentStatus = useCallback(async () => {
    try {
      if (!isSignedIn || !user || !courseId) {
        setCheckingEnrollment(false);
        setIsEnrolled(false);
        return;
      }
      
      setCheckingEnrollment(true);
      
      const { data: enrollmentData, error } = await supabase
        .from('myuni_enrollments')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Enrollment check error:', error);
        setIsEnrolled(false);
      } else {
        setIsEnrolled(!!enrollmentData);
      }
    } catch (error) {
      console.error('Error checking enrollment:', error);
      setIsEnrolled(false);
    } finally {
      setCheckingEnrollment(false);
    }
  }, [isSignedIn, user, courseId]);

  // Fetch video data when modal opens
  useEffect(() => {
    if (isOpen && lessonId) {
      fetchVideo();
    }
  }, [isOpen, lessonId, fetchVideo]);

  // Check enrollment status when modal opens
  useEffect(() => {
    if (isOpen && courseId && isSignedIn) {
      checkEnrollmentStatus();
    } else if (isOpen) {
      setCheckingEnrollment(false);
    }
  }, [isOpen, courseId, isSignedIn, checkEnrollmentStatus]);

  // Initialize Vimeo Player when ready
  useEffect(() => {
    if (iframeRef.current && isVimeoReady && window.Vimeo && video && isOpen) {
      try {
        const player = new window.Vimeo.Player(iframeRef.current);
        playerRef.current = player as VimeoPlayerMethods;

        // Video events
        player.on('loaded', () => {
          setVideoLoaded(true);
        });

        player.on('play', () => {
          setVideoLoaded(true);
        });

        player.on('timeupdate', (data?: VimeoTimeUpdateData) => {
          if (data) {
            // 1 dakika sonra videoyu durdur ve overlay göster
            if (data.seconds >= PREVIEW_LIMIT_SECONDS && !isPreviewLimitReached) {
              setIsPreviewLimitReached(true);
              setShowPurchaseOverlay(true);
              player.pause();
            }
            
            if (!videoLoaded) {
              setVideoLoaded(true);
            }
          }
        });

        return () => {
          if (player && player.off) {
            player.off('loaded');
            player.off('timeupdate');
            player.off('play');
          }
        };
      } catch (err) {
        console.error('Vimeo Player initialization error:', err);
        setError('Failed to initialize video player');
      }
    }
  }, [isVimeoReady, video, isOpen, isPreviewLimitReached, videoLoaded]);

  // Cleanup player on close
  useEffect(() => {
    if (!isOpen && playerRef.current) {
      try {
        if (playerRef.current.destroy) {
          playerRef.current.destroy(); // Now calling void method
        }
      } catch (err) {
        console.error('Error destroying player:', err);
      }
      playerRef.current = null;
      setVideoLoaded(false);
      setIsPreviewLimitReached(false);
      setShowPurchaseOverlay(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const getVimeoEmbedUrl = (video: VimeoVideo): string | undefined => {
    if (video.vimeo_id) {
      const hashParam = video.vimeo_hash ? `&h=${video.vimeo_hash}` : '';
      return `https://player.vimeo.com/video/${video.vimeo_id}?badge=0&autopause=0&player_id=preview_${video.id}&app_id=58479${hashParam}`;
    }
    return undefined;
  };

  const handleRetry = () => {
    setError(null);
    setVideoLoaded(false);
    setIsPreviewLimitReached(false);
    setShowPurchaseOverlay(false);
    fetchVideo();
  };

  const handlePurchaseClick = () => {
    if (isSignedIn && isEnrolled && courseSlug) {
      // Kullanıcı kursa kayıtlıysa, izleme sayfasına yönlendir
      const watchUrl = `/${locale}/watch/course/${courseSlug}`;
      console.log('User is enrolled, redirecting to watch page:', watchUrl);
      router.push(watchUrl);
    } else if (isSignedIn && courseId) {
      // Kullanıcı giriş yapmış ama kursa kayıtlı değilse, checkout sayfasına yönlendir
      const checkoutUrl = `/${locale}/checkout?id=${encodeURIComponent(courseId)}`;
      console.log('User is signed in but not enrolled, redirecting to checkout:', checkoutUrl);
      router.push(checkoutUrl);
    } else {
      // Kullanıcı giriş yapmamışsa, login sayfasına yönlendir
      const currentPath = window.location.pathname;
      const redirectUrl = `/${locale}/login?redirect=${encodeURIComponent(currentPath)}`;
      console.log('User is not signed in, redirecting to login:', redirectUrl);
      router.push(redirectUrl);
    }
    onClose();
  };

  if (!isOpen) return null;

  const embedUrl = video ? getVimeoEmbedUrl(video) : undefined;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-1 rounded text-xs sm:text-sm font-medium">
                {texts.preview}
              </span>
              <h3 className="text-sm sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {video?.title || lessonTitle}
              </h3>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Video Content */}
          <div className="relative bg-neutral-100 dark:bg-neutral-800 aspect-video flex-1">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3 p-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center shadow-sm">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin"></div>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                    {texts.loading}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-red-600 text-lg sm:text-xl">!</span>
                  </div>
                  <div>
                    <p className="text-sm sm:text-base text-neutral-900 dark:text-neutral-100 font-medium">{texts.error}</p>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-3 inline-flex items-center space-x-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded text-xs sm:text-sm hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>{texts.retry}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {embedUrl && !error && (
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                {/* Loading Skeleton */}
                <div 
                  className={`absolute inset-0 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center transition-opacity duration-700 ${
                    videoLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'
                  }`}
                  style={{ zIndex: 2 }}
                >
                  <div className="text-center space-y-3 p-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-neutral-700 rounded-lg flex items-center justify-center shadow-sm">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-neutral-400 border-t-neutral-800 rounded-full animate-spin"></div>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                      {texts.loading}
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
                    zIndex: 1,
                    filter: showPurchaseOverlay ? 'blur(4px) brightness(0.8)' : 'none',
                    transition: 'filter 0.5s ease'
                  }}
                  title={video?.title || 'Video Preview'}
                  id={`preview_player_${video?.id}`}
                />

                {/* Purchase Overlay */}
                {showPurchaseOverlay && (
                  <div className="absolute inset-0 z-20 flex items-end justify-center p-4 sm:items-center bg-neutral-900/20 backdrop-blur-sm">
                    <div className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md rounded-2xl p-6 w-full sm:w-auto sm:max-w-sm text-center shadow-lg border border-neutral-200/30 dark:border-neutral-700/30">
                      <div className="mb-6">
                        <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Play className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                          Devamını izlemek için
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                          {isEnrolled 
                            ? "Bu dersin tamamını izlemek için kursa gidin."
                            : "Bu dersin tamamına erişmek için kursa kayıt olabilirsiniz."}
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          onClick={handlePurchaseClick}
                          className={`w-full ${isEnrolled ? 'bg-green-600 hover:bg-green-700' : 'bg-[#990000] hover:bg-[#800000]'} text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm`}
                        >
                          {isEnrolled ? "Kursa Git" : "Kursa Kayıt Ol"}
                        </button>
                        <button
                          onClick={onClose}
                          className="w-full text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 px-6 py-2 text-sm font-medium transition-colors"
                        >
                          Kapat
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewModal;