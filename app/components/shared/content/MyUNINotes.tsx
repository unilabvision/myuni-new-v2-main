// components/shared/content/MyUNINotes.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Download, CheckCircle, Save, Users, Calendar } from 'lucide-react';
import { getLessonContent, updateUserProgress, getUserLessonProgress } from '../../../../lib/courseService';
import { getEventLessonContent, updateUserEventProgress, getUserEventLessonProgress } from '../../../../lib/eventService';

interface Note {
  id: string;
  title: string;
  content: string;
  content_type: string;
  file_url?: string;
  is_ai_generated: boolean;
  secret_key?: string; // Gizli anahtar için
}

interface MyUNINotesProps {
  contentId: string; // lessonId or sectionId
  userId?: string;
  type: 'course' | 'event'; // Content type
  onNoteCreate?: (note: string) => void;
  onComplete?: () => Promise<void>;
  onAIQuestionGenerate?: (content: string) => void;
  texts?: {
    loading?: string;
    notesLoading?: string;
    notAvailable?: string;
    noNotesFound?: string;
    createOwnNotes?: string;
    reading?: string;
    participation?: string;
    completed?: string;
    saving?: string;
    addPersonalNote?: string;
    generateAIQuestions?: string;
    markCompleted?: string;
    readingProgress?: string;
    participationProgress?: string;
    timeSpent?: string;
    estimatedReadingTime?: string;
    estimatedParticipationTime?: string;
    createPersonalNote?: string;
    cancel?: string;
    saveNote?: string;
    personalNotes?: string;
    editNote?: string;
    relatedNotes?: string;
    relatedMaterials?: string;
    document?: string;
    documents?: string;
    manual?: string;
    aiGenerated?: string;
    additionalResources?: string;
    downloadPDF?: string;
    sessionMaterials?: string;
    courseMaterials?: string;
    secretKeyPrompt?: string;
    enterSecretKey?: string;
    secretKeyCorrect?: string;
    secretKeyIncorrect?: string;
    verifyKey?: string;
    secretKeySuccess?: string;
  };
}

interface UserProgress {
  watch_time_seconds: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
}

const defaultTexts = {
  loading: 'Yükleniyor...',
  notesLoading: 'Notlar yükleniyor...',
  materialsLoading: 'Materyaller yükleniyor...',
  notAvailable: 'Not Mevcut Değil',
  materialsNotAvailable: 'Materyal Mevcut Değil',
  noNotesFound: 'Bu ders için not içeriği bulunamadı',
  noMaterialsFound: 'Bu oturum için materyal bulunamadı',
  createOwnNotes: 'Kendi Notlarınızı Oluşturun',
  reading: 'Okuma',
  participation: 'Katılım',
  completed: 'Tamamlandı',
  saving: 'Kaydediliyor...',
  addPersonalNote: 'Kişisel Not Ekle',
  generateAIQuestions: 'AI Soruları Oluştur',
  markCompleted: 'Tamamlandı olarak işaretle',
  readingProgress: 'Okuma İlerlemesi',
  participationProgress: 'Katılım İlerlemesi',
  timeSpent: 'Harcanan zaman',
  estimatedReadingTime: 'Tahmini okuma süresi',
  estimatedParticipationTime: 'Tahmini inceleme süresi',
  createPersonalNote: 'Kişisel Not Oluştur',
  cancel: 'İptal',
  saveNote: 'Notu Kaydet',
  personalNotes: 'Kişisel Notlarınız',
  editNote: 'Notu Düzenle',
  relatedNotes: 'İlgili Notlar',
  relatedMaterials: 'İlgili Materyaller',
  document: 'belge',
  documents: 'belge',
  manual: 'Görüntüle',
  aiGenerated: 'AI Oluşturdu',
  additionalResources: 'Ek Kaynaklar',
  downloadPDF: 'PDF İndir',
  sessionMaterials: 'Oturum Materyalleri',
  courseMaterials: 'Ders Materyalleri',
  secretKeyPrompt: 'Bu bölümü tamamlamak için gizli anahtar gereklidir',
  enterSecretKey: 'Gizli anahtarı girin',
  secretKeyCorrect: 'Doğru! Bölüm tamamlandı.',
  secretKeyIncorrect: 'Yanlış anahtar. Tekrar deneyin.',
  verifyKey: 'Anahtarı Doğrula',
  secretKeySuccess: 'Tebrikler! Gizli anahtarı doğru girdiniz.'
};

export function MyUNINotes({ 
  contentId, 
  userId, 
  type, 
  onNoteCreate, 
  onComplete, 
  onAIQuestionGenerate,
  texts = {}
}: MyUNINotesProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [userNote, setUserNote] = useState('');
  const [showUserNoteEditor, setShowUserNoteEditor] = useState(false);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    watch_time_seconds: 0,
    last_position_seconds: 0,
    is_completed: false,
    notes: ''
  });
  const [readingTime, setReadingTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [secretKeyResult, setSecretKeyResult] = useState<'correct' | 'incorrect' | null>(null);
  const [showSecretKeyForm, setShowSecretKeyForm] = useState(false);


  // Merge texts
  const t = { ...defaultTexts, ...texts };

  const handleProgressSave = useCallback(async (timeSpent: number, forceComplete: boolean = false) => {
    if (!userId || !currentNote) return;
    
    try {
      setAutoSaving(true);
      
      let isCompleted = forceComplete || userProgress.is_completed;
      
      // Only use time-based completion for courses
      if (type === 'course' && !forceComplete && !userProgress.is_completed) {
        // Estimate completion based on reading time (assume 200 words per minute)
        const estimatedReadingTime = calculateEstimatedReadingTime(currentNote.content);
        const completionPercent = Math.min((timeSpent / estimatedReadingTime) * 100, 100);
        isCompleted = completionPercent >= 80;
      }

      const wasCompleted = userProgress.is_completed;

      const progressData = {
        watch_time_seconds: timeSpent,
        last_position_seconds: timeSpent,
        is_completed: isCompleted,
        completed_at: isCompleted && !userProgress.is_completed ? new Date().toISOString() : userProgress.completed_at,
        notes: userNote
      };

      console.log('Saving progress for type:', type, 'contentId:', contentId, 'progressData:', progressData);

      // Save progress based on content type
      if (type === 'course') {
        await updateUserProgress(userId, contentId, progressData);
      } else {
        // For events, contentId is actually sectionId
        await updateUserEventProgress(userId, contentId, progressData);
      }

      setUserProgress(prev => ({
        ...prev,
        ...progressData
      }));

      // IMPORTANT: Call onComplete callback when lesson/session is completed for the first time
      if (isCompleted && !wasCompleted && onComplete) {
        console.log(`${type === 'course' ? 'Ders' : 'Oturum'} ilk kez tamamlandı, onComplete callback çağrılıyor`);
        try {
          await onComplete();
        } catch (error) {
          console.error('onComplete callback hatası:', error);
        }
      }
    } catch (error) {
      console.error('İlerleme kaydetme hatası:', error);
      // Don't throw error to prevent UI breaking
    } finally {
      setAutoSaving(false);
    }
  }, [userId, contentId, currentNote, userProgress, userNote, onComplete, type]);

  const fetchNotesContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== FETCHING NOTES CONTENT ===');
      console.log('Type:', type, 'ContentId:', contentId);

      let content;
      if (type === 'course') {
        content = await getLessonContent(contentId);
      } else {
        // For events, contentId is sectionId
        console.log('Calling getEventLessonContent with sectionId:', contentId);
        content = await getEventLessonContent(contentId);
      }
      
      console.log('=== CONTENT RECEIVED ===');
      console.log('Content structure:', content);
      console.log('Notes array:', content?.notes);
      console.log('Notes length:', content?.notes?.length);
      console.log('First note:', content?.notes?.[0]);
      
      if (content && content.notes && content.notes.length > 0) {
        console.log('✅ Setting notes and currentNote');
        setNotes(content.notes);
        
        // Check if there's a secret key parameter in the URL
        try {
          const urlParams = new URLSearchParams(window.location.search);
          const secretKeyParam = urlParams.get('sk');
          
          if (secretKeyParam && secretKeyParam !== 'true') {
            // Try to find the note with the ID specified in the sk parameter
            const secretKeyNote = content.notes.find(note => note.id === secretKeyParam);
            if (secretKeyNote) {
              console.log('Found secret key note by ID:', secretKeyNote);
              setCurrentNote(secretKeyNote);
            } else {
              setCurrentNote(content.notes[0]);
            }
          } else if (secretKeyParam === 'true') {
            // If sk=true, find the first note with content_type === 'secret_key'
            const secretKeyNote = content.notes.find(note => note.content_type === 'secret_key');
            if (secretKeyNote) {
              console.log('Found secret key note by content type:', secretKeyNote);
              setCurrentNote(secretKeyNote);
            } else {
              setCurrentNote(content.notes[0]);
            }
          } else {
            setCurrentNote(content.notes[0]);
          }
        } catch (error) {
          console.error('Error checking URL params:', error);
          setCurrentNote(content.notes[0]);
        }
      } else {
        console.log('❌ No notes found, setting error');
        console.log('Content exists:', !!content);
        console.log('Notes exists:', !!content?.notes);
        console.log('Notes length:', content?.notes?.length);
        setError(type === 'course' ? t.noNotesFound : t.noMaterialsFound);
      }

    } catch (err) {
      console.error(`${type === 'course' ? 'Not' : 'Materyal'} içeriği yükleme hatası:`, err);
      setError(`${type === 'course' ? 'Not' : 'Materyal'} içeriği yüklenemedi`);
    } finally {
      setLoading(false);
    }
  }, [contentId, type, t.noNotesFound, t.noMaterialsFound]);

  const loadUserProgress = useCallback(async () => {
    if (!userId || !currentNote) return;
    
    try {
      console.log('Loading user progress for type:', type, 'userId:', userId, 'contentId:', contentId);
      
      let progress;
      if (type === 'course') {
        progress = await getUserLessonProgress(userId, contentId);
      } else {
        // For events, contentId is sectionId
        progress = await getUserEventLessonProgress(userId, contentId);
      }
      
      console.log('Loaded progress:', progress);
      
      if (progress) {
        setUserProgress(progress);
        setUserNote(progress.notes || '');
        setReadingTime(progress.watch_time_seconds || 0);
      }
    } catch (error) {
      console.error('İlerleme yükleme hatası:', error);
      // Don't throw error to prevent UI breaking
    }
  }, [userId, contentId, currentNote, type]);

  const calculateEstimatedReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.max((wordCount / wordsPerMinute) * 60, 60); // Minimum 1 minute
  };

  // Check for URL parameter when component mounts
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const secretKeyParam = urlParams.get('sk');
      
      if (secretKeyParam) {
        // If there's a secret key parameter, set an initial state
        // This will be used to potentially highlight the UI or auto-focus the secret key input
        console.log('Secret key parameter detected in URL:', secretKeyParam);
      }
    } catch (error) {
      console.error('Error checking URL params on mount:', error);
    }
  }, []);

  // Fetch notes content when contentId changes
  useEffect(() => {
    fetchNotesContent();
  }, [fetchNotesContent]);

  // Load user progress when userId or currentNote changes
  useEffect(() => {
    if (userId && currentNote) {
      loadUserProgress();
    }
  }, [loadUserProgress, userId, currentNote]);

  // Track reading time when component is active (only for courses)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && currentNote && !userProgress.is_completed && userId && type === 'course') {
      interval = setInterval(() => {
        setReadingTime(prev => {
          const newTime = prev + 1;
          // Auto-save every 30 seconds
          if (newTime % 30 === 0) {
            handleProgressSave(newTime, false);
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, currentNote, userProgress.is_completed, userId, handleProgressSave, type]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => setIsActive(true);
    const handleInactivity = () => setIsActive(false);

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set inactive after 30 seconds of no activity
    const inactivityTimer = setTimeout(handleInactivity, 30000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearTimeout(inactivityTimer);
    };
  }, []);

  const handleCreateUserNote = async () => {
    if (userNote.trim()) {
      if (onNoteCreate) {
        onNoteCreate(userNote);
      }
      
      // Save progress with note
      await handleProgressSave(readingTime, false);
      setShowUserNoteEditor(false);
    }
  };

  const handleMarkAsComplete = async () => {
    await handleProgressSave(readingTime, true);
  };

  const handleSecretKeyVerification = async () => {
    if (!currentNote || !currentNote.secret_key) return;
    
    const enteredKey = secretKeyInput.trim().toLowerCase();
    const correctKey = currentNote.secret_key.toLowerCase();
    
    if (enteredKey === correctKey) {
      setSecretKeyResult('correct');
      setShowSecretKeyForm(false);
      // Otomatik olarak bölümü tamamla
      await handleProgressSave(readingTime, true);
    } else {
      setSecretKeyResult('incorrect');
      setTimeout(() => {
        setSecretKeyResult(null);
      }, 3000);
    }
  };



      // Secret Key tipli notlar için özel kontrol ve state temizleme
  useEffect(() => {
    if (currentNote?.content_type === 'secret_key' && !userProgress.is_completed) {
      setShowSecretKeyForm(true);
    } else {
      setShowSecretKeyForm(false);
    }
    
    // currentNote değiştiğinde gizli anahtar ile ilgili state'leri temizle
    setSecretKeyInput('');
    setSecretKeyResult(null);
  }, [currentNote, userProgress.is_completed]);

  // Component unmount olduğunda gizli anahtar state'lerini temizle
  useEffect(() => {
    return () => {
      setSecretKeyInput('');
      setSecretKeyResult(null);
    };
  }, []);

  const extractYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };



  const renderMarkdownContent = (content: string) => {
    // YouTube video link processing first
    let processedContent = content;
    
    // Find YouTube links in markdown format [text](url) or just plain URLs
    const youtubeRegex = /\[([^\]]*)\]\((https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^)]+))\)/g;
    const plainYoutubeRegex = /(https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([^\s<>\)]+))/g;
    
    // Replace markdown YouTube links
    processedContent = processedContent.replace(youtubeRegex, (match, text, url) => {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return `<div class="youtube-embed my-6">
          <div class="mb-3">
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">${text || 'Video'}</span>
          </div>
          <div class="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              title="${text || 'YouTube Video'}"
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>`;
      }
      return match;
    });
    
    // Replace plain YouTube URLs (not in markdown format)
    processedContent = processedContent.replace(plainYoutubeRegex, (match, url) => {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return `<div class="youtube-embed my-6">
          <div class="mb-3">
            <span class="text-sm font-medium text-neutral-900 dark:text-neutral-100">Video</span>
          </div>
          <div class="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden shadow-lg">
            <iframe 
              src="https://www.youtube.com/embed/${videoId}" 
              title="YouTube Video"
              frameborder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowfullscreen
              class="absolute inset-0 w-full h-full"
            ></iframe>
          </div>
        </div>`;
      }
      return match;
    });

    // Standard markdown rendering
    processedContent = processedContent
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100 font-arimo">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-3 text-neutral-900 dark:text-neutral-100 font-arimo">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mt-4 mb-2 text-neutral-900 dark:text-neutral-100 font-arimo">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-neutral-900 dark:text-neutral-100">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-700 dark:text-neutral-300">$1</em>')
      .replace(/^- \*\*(.*?)\*\*/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300 leading-relaxed mb-1">• <strong class="font-semibold text-neutral-900 dark:text-neutral-100">$1</strong></li>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300 leading-relaxed mb-1">• $1</li>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300 leading-relaxed mb-1">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300 leading-relaxed mb-1">$1</li>')
      .replace(/---/g, '<hr class="my-6 border-neutral-300 dark:border-neutral-600">');

    // Split by double newlines to create paragraphs, but preserve special elements like youtube-embed
    const sections = processedContent.split('\n\n');
    const processedSections = sections.map(section => {
      // Skip processing if it contains special elements
      if (section.includes('youtube-embed') || section.includes('<h1') || 
          section.includes('<h2') || section.includes('<h3') || 
          section.includes('<hr') || section.includes('<li')) {
        return section;
      }
      
      // Only wrap non-empty sections that don't contain HTML
      if (section.trim() && !section.includes('<')) {
        return `<p class="mb-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">${section.replace(/\n/g, '<br>')}</p>`;
      }
      
      return section.replace(/\n/g, '<br>');
    });

    return processedSections.join('');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Get icon based on content type
  const getContentIcon = () => {
    if (type === 'event') {
      return <Users className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />;
    }
    return <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />;
  };

  // Get user-friendly content type label
  const getContentTypeLabel = (contentType: string) => {
    switch (contentType.toLowerCase()) {
      case 'markdown':
        return 'Döküman';
      case 'secret_key':
        return 'Yoklama';
      case 'html':
        return 'Web İçeriği';
      case 'text':
        return 'Metin';
      case 'pdf':
        return 'PDF';
      case 'video':
        return 'Video';
      case 'audio':
        return 'Ses';
      case 'image':
        return 'Görsel';
      default:
        return 'Materyal';
    }
  };

  // Get progress label based on content type
  const getProgressLabel = () => {
    return type === 'course' ? t.readingProgress : t.participationProgress;
  };

  // Get time label based on content type
  const getTimeLabel = () => {
    return type === 'course' ? t.reading : t.participation;
  };

  // Get estimated time label based on content type
  const getEstimatedTimeLabel = () => {
    return type === 'course' ? t.estimatedReadingTime : t.estimatedParticipationTime;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto mb-4 flex items-center justify-center">
            {getContentIcon()}
          </div>
          <p className="text-sm text-neutral-500">
            {type === 'course' ? t.notesLoading : t.materialsLoading}
          </p>
        </div>
      </div>
    );
  }

  if (error || !currentNote) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto mb-4 flex items-center justify-center">
            {getContentIcon()}
          </div>
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">
              {type === 'course' ? t.notAvailable : t.materialsNotAvailable}
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const estimatedReadingTime = calculateEstimatedReadingTime(currentNote.content);
  const readingProgress = Math.min((readingTime / estimatedReadingTime) * 100, 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-lg">
        <div className="flex items-center space-x-3">
          {getContentIcon()}
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {currentNote.title}
            </h3>
            {userProgress.is_completed && (
              <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                {type === 'course' ? (
                  <CheckCircle className="w-3 h-3 text-green-600" />
                ) : (
                  <Users className="w-3 h-3 text-blue-600" />
                )}
                <span className={type === 'course' ? 'text-green-600' : 'text-blue-600'}>
                  {t.completed}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {autoSaving && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
              <Save className="w-3 h-3 animate-pulse" />
              <span>{t.saving}</span>
            </div>
          )}

          {!userProgress.is_completed && type === 'course' && (
            <button
              onClick={handleMarkAsComplete}
              className="px-3 py-1 text-white text-sm rounded transition-colors bg-green-600 hover:bg-green-700"
            >
              {t.markCompleted}
            </button>
          )}
        </div>
      </div>

      {/* Reading Progress Bar - Only show for course type */}
      {type === 'course' && (
        <div className="p-4 bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
          <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
            <span>{getProgressLabel()}</span>
            <span>{Math.round(readingProgress)}%</span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                userProgress.is_completed 
                  ? 'bg-green-600'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${readingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            <span>{t.timeSpent}: {formatTime(readingTime)}</span>
            <span>{getEstimatedTimeLabel()}: {formatTime(estimatedReadingTime)}</span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* User Note Editor */}
        {showUserNoteEditor && (
          <div className={`p-4 border-b ${
            type === 'course'
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <h4 className={`text-sm font-medium mb-2 ${
              type === 'course'
                ? 'text-blue-900 dark:text-blue-100'
                : 'text-green-900 dark:text-green-100'
            }`}>
              {t.createPersonalNote}
            </h4>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Kişisel notlarınızı buraya yazın..."
              className={`w-full h-24 p-3 border rounded resize-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 ${
                type === 'course'
                  ? 'border-blue-200 dark:border-blue-700'
                  : 'border-green-200 dark:border-green-700'
              }`}
            />
            <div className="flex items-center justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowUserNoteEditor(false)}
                className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateUserNote}
                disabled={!userNote.trim()}
                className={`px-3 py-1 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  type === 'course'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {t.saveNote}
              </button>
            </div>
          </div>
        )}

        {/* Notes Content */}
        <div className="p-4 bg-white dark:bg-neutral-800">
          {/* Secret Key Form */}
          {currentNote.content_type === 'secret_key' && showSecretKeyForm && (
            <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="text-center mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl sm:text-2xl">🔐</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Yoklama Şifresi
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-xs sm:text-sm px-2">
                  {t.secretKeyPrompt}
                </p>
              </div>
              
              <div className="max-w-md mx-auto">
                <label className="block text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">
                  {t.enterSecretKey}
                </label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    value={secretKeyInput}
                    onChange={(e) => setSecretKeyInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSecretKeyVerification()}
                    placeholder="Gizli anahtarı yazın..."
                    className="flex-1 px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                  />
                  <button
                    onClick={handleSecretKeyVerification}
                    disabled={!secretKeyInput.trim()}
                    className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 disabled:cursor-not-allowed text-white rounded-md transition-colors whitespace-nowrap"
                  >
                    {t.verifyKey}
                  </button>
                </div>
                

                
                {secretKeyResult === 'incorrect' && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-red-800 dark:text-red-200 text-sm">
                      ❌ {t.secretKeyIncorrect}
                    </p>
                  </div>
                )}
                
                {secretKeyResult === 'correct' && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      ✅ {t.secretKeySuccess}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Normal Content Display */}
          {currentNote.content_type !== 'secret_key' && (
            <>
              {currentNote.content_type === 'markdown' ? (
                <div 
                  className="max-w-none font-arimo text-neutral-700 dark:text-neutral-300 leading-relaxed prose prose-neutral dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: renderMarkdownContent(currentNote.content)
                  }}
                />
              ) : currentNote.content_type === 'html' ? (
                <div 
                  className="max-w-none font-arimo text-neutral-700 dark:text-neutral-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: currentNote.content }}
                />
              ) : (
                <div className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 leading-relaxed font-arimo">
                  {currentNote.content}
                </div>
              )}
            </>
          )}

          {/* Secret Key Content - Show only after successful verification */}
          {currentNote.content_type === 'secret_key' && userProgress.is_completed && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center space-x-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Yoklama Formu Tamamlandı
                </h4>
              </div>
              
              {currentNote.content && (
                <div className="whitespace-pre-wrap text-green-800 dark:text-green-200 leading-relaxed">
                  {currentNote.content}
                </div>
              )}
            </div>
          )}

          {/* PDF Link */}
          {currentNote.file_url && (
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                {t.additionalResources}
              </h4>
              <a
                href={currentNote.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>{t.downloadPDF}</span>
              </a>
            </div>
          )}
        </div>

        {/* Personal Notes Display */}
        {userNote && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
              {t.personalNotes}
            </h4>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
              {userNote}
            </div>
            <button
              onClick={() => {
                setShowUserNoteEditor(true);
              }}
              className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
            >
              {t.editNote}
            </button>
          </div>
        )}

        {/* Multiple Notes Navigation */}
        {notes.length > 1 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-600">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {type === 'course' ? t.relatedNotes : t.relatedMaterials} ({notes.length} {t.document})
            </h4>
            <div className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setCurrentNote(note);
                    
                    // Remove sk parameter from URL when switching between notes
                    // Only if the selected note is not a secret key note
                    if (note.content_type !== 'secret_key') {
                      try {
                        const url = new URL(window.location.href);
                        if (url.searchParams.has('sk')) {
                          url.searchParams.delete('sk');
                          // Update URL without reloading the page
                          window.history.replaceState({}, '', url.toString());
                        }
                      } catch (error) {
                        console.error('Error updating URL:', error);
                      }
                    } else if (note.content_type === 'secret_key') {
                      // Add sk=true parameter if navigating to a secret key note
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('sk', 'true');
                        // Update URL without reloading the page
                        window.history.replaceState({}, '', url.toString());
                      } catch (error) {
                        console.error('Error updating URL:', error);
                      }
                    }
                  }}
                  className={`w-full flex items-center space-x-3 p-3 rounded text-left transition-colors ${
                    currentNote.id === note.id
                      ? 'bg-white dark:bg-neutral-600 shadow-sm'
                      : 'hover:bg-white/50 dark:hover:bg-neutral-600/50'
                  } ${
                    note.content_type === 'secret_key' 
                      ? 'border-l-4 border-amber-500 dark:border-amber-400'
                      : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-500 rounded flex items-center justify-center">
                    {type === 'course' ? (
                      <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    ) : (
                      <Users className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {note.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {getContentTypeLabel(note.content_type)} • {note.is_ai_generated ? t.aiGenerated : t.manual}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            

          </div>
        )}
      </div>
    </div>
  );
}