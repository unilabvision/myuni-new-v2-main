// components/course/content/MyUNINotes.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { FileText, PlusCircle, Download, CheckCircle, Clock, Save, Trash2 } from 'lucide-react';
import { getLessonContent, updateUserProgress, getUserLessonProgress } from '../../../../lib/courseService';

interface Note {
  id: string;
  title: string;
  content: string;
  content_type: string;
  file_url?: string;
  is_ai_generated: boolean;
}

interface MyUNINotesProps {
  lessonId: string;
  userId?: string;
  onNoteCreate?: (note: string) => void;
  onComplete?: () => Promise<void>;
  lessonDurationMinutes?: number; // Yeni prop ekledik
}

interface UserProgress {
  watch_time_seconds: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at?: string;
  notes?: string;
}

export function MyUNINotes({ lessonId, userId, onNoteCreate, onComplete, lessonDurationMinutes }: MyUNINotesProps) {
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

  const handleProgressSave = useCallback(async (timeSpent: number, forceComplete: boolean = false) => {
    if (!userId || !currentNote) return;
    
    try {
      setAutoSaving(true);
      
      // Veritabanından gelen duration_minutes'ı kullan (saniyeye çevir)
      const estimatedReadingTime = lessonDurationMinutes ? lessonDurationMinutes * 60 : 300; // Default 5 dakika
      const completionPercent = Math.min((timeSpent / estimatedReadingTime) * 100, 100);
      const wasCompleted = userProgress.is_completed;
      const isCompleted = forceComplete || completionPercent >= 80 || userProgress.is_completed;

      const progressData = {
        watch_time_seconds: timeSpent,
        last_position_seconds: timeSpent,
        is_completed: isCompleted,
        completed_at: isCompleted && !userProgress.is_completed ? new Date().toISOString() : userProgress.completed_at,
        notes: userNote
      };

      await updateUserProgress(userId, lessonId, progressData);

      setUserProgress(prev => ({
        ...prev,
        ...progressData
      }));

      // IMPORTANT: Call onComplete callback when lesson is completed for the first time
      if (isCompleted && !wasCompleted && onComplete) {
        console.log('Not dersi ilk kez tamamlandı, onComplete callback çağrılıyor');
        try {
          await onComplete();
        } catch (error) {
          console.error('onComplete callback hatası:', error);
        }
      }
    } catch (error) {
      console.error('İlerleme kaydetme hatası:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [userId, lessonId, currentNote, userProgress, userNote, onComplete, lessonDurationMinutes]);

  const fetchNotesContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const content = await getLessonContent(lessonId);
      
      if (content.notes && content.notes.length > 0) {
        setNotes(content.notes);
        setCurrentNote(content.notes[0]);
      } else {
        setError('Not içeriği bulunamadı');
      }

    } catch (err) {
      console.error('Not içeriği yükleme hatası:', err);
      setError('Not içeriği yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  const loadUserProgress = useCallback(async () => {
    if (!userId || !currentNote) return;
    
    try {
      const progress = await getUserLessonProgress(userId, lessonId);
      if (progress) {
        setUserProgress(progress);
        setUserNote(progress.notes || '');
        setReadingTime(progress.watch_time_seconds);
      }
    } catch (error) {
      console.error('İlerleme yükleme hatası:', error);
    }
  }, [userId, lessonId, currentNote]);

  // Fetch notes content when lessonId changes
  useEffect(() => {
    fetchNotesContent();
  }, [fetchNotesContent]);

  // Load user progress when userId or currentNote changes
  useEffect(() => {
    if (userId && currentNote) {
      loadUserProgress();
    }
  }, [loadUserProgress, userId, currentNote]);

  // Track reading time when component is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && currentNote && !userProgress.is_completed && userId) {
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
  }, [isActive, currentNote, userProgress.is_completed, userId, handleProgressSave]);

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

  const handleDownloadNotes = () => {
    if (!currentNote) return;

    // Create content to download
    let downloadContent = `# ${currentNote.title}\n\n`;
    downloadContent += `${currentNote.content}\n\n`;
    
    // Add personal notes if they exist
    if (userNote) {
      downloadContent += `## Kişisel Notlarım\n\n${userNote}\n\n`;
    }

    // Create blob and download
    const blob = new Blob([downloadContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentNote.title.replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '').replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteUserNote = async () => {
    if (confirm('Kişisel notlarınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      setUserNote('');
      // Save progress with empty note
      await handleProgressSave(readingTime, false);
    }
  };

  const renderMarkdownContent = (content: string) => {
    // Simple markdown rendering - in real app, use react-markdown
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 text-neutral-900 dark:text-neutral-100">$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, '<strong class="font-semibold text-neutral-900 dark:text-neutral-100">$1</strong>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 text-neutral-700 dark:text-neutral-300">$1</li>')
      .replace(/\n/g, '<br>');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded">
        <div className="animate-pulse text-center">
          <div className="w-16 h-16 bg-neutral-200 dark:bg-neutral-700 rounded mx-auto mb-4"></div>
          <p className="text-sm text-neutral-500">Notlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !currentNote) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-800 rounded">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 text-neutral-400 mx-auto" />
          <div>
            <p className="text-neutral-900 dark:text-neutral-100 font-medium mb-2">Not Mevcut Değil</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {error || 'Bu ders için not içeriği bulunamadı'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Veritabanından gelen duration_minutes'ı kullan (saniyeye çevir)
  const estimatedReadingTime = lessonDurationMinutes ? lessonDurationMinutes * 60 : 300; // Default 5 dakika
  const readingProgress = Math.min((readingTime / estimatedReadingTime) * 100, 100);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-t-lg">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
              {currentNote.title}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
              <Clock className="w-3 h-3" />
              <span>Okuma: {formatTime(readingTime)}</span>
              {userProgress.is_completed && (
                <>
                  <span>•</span>
                  <CheckCircle className="w-3 h-3 text-green-600" />
                  <span className="text-green-600">Tamamlandı</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {autoSaving && (
            <div className="flex items-center space-x-1 text-xs text-blue-600 dark:text-blue-400">
              <Save className="w-3 h-3 animate-pulse" />
              <span>Kaydediliyor...</span>
            </div>
          )}
          
          <button
            onClick={() => setShowUserNoteEditor(!showUserNoteEditor)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
            title="Kişisel Not Ekle"
          >
            <PlusCircle className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>
          
          <button
            onClick={handleDownloadNotes}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
            title="Notları İndir"
          >
            <Download className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          </button>

          {!userProgress.is_completed && (
            <button
              onClick={handleMarkAsComplete}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
            >
              Tamamlandı olarak işaretle
            </button>
          )}
        </div>
      </div>

      {/* Reading Progress Bar */}
      <div className="p-4 bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          <span>Okuma İlerlemesi</span>
          <span>{Math.round(readingProgress)}%</span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              userProgress.is_completed ? 'bg-green-600' : 'bg-blue-600'
            }`}
            style={{ width: `${readingProgress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          <span>Harcanan zaman: {formatTime(readingTime)}</span>
          <span>Tahmini okuma süresi: {formatTime(estimatedReadingTime)}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* User Note Editor */}
        {showUserNoteEditor && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Kişisel Not Oluştur
            </h4>
            <textarea
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              placeholder="Kişisel notlarınızı buraya yazın..."
              className="w-full h-24 p-3 border border-blue-200 dark:border-blue-700 rounded resize-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400"
            />
            <div className="flex items-center justify-end space-x-2 mt-2">
              <button
                onClick={() => setShowUserNoteEditor(false)}
                className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                İptal
              </button>
              <button
                onClick={handleCreateUserNote}
                disabled={!userNote.trim()}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Notu Kaydet
              </button>
            </div>
          </div>
        )}

        {/* Notes Content */}
        <div className="p-4 bg-white dark:bg-neutral-800">
          {currentNote.content_type === 'markdown' ? (
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdownContent(currentNote.content) 
              }}
            />
          ) : currentNote.content_type === 'html' ? (
            <div 
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: currentNote.content }}
            />
          ) : (
            <div className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {currentNote.content}
            </div>
          )}

          {/* PDF Link */}
          {currentNote.file_url && (
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-700 rounded border border-neutral-200 dark:border-neutral-600">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Ek Kaynaklar
              </h4>
              <a
                href={currentNote.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>PDF İndir</span>
              </a>
            </div>
          )}
        </div>

        {/* Personal Notes Display */}
        {userNote && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Kişisel Notlarınız
              </h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setShowUserNoteEditor(true);
                  }}
                  className="text-xs text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 transition-colors"
                  title="Notu Düzenle"
                >
                  Düzenle
                </button>
                <button
                  onClick={handleDeleteUserNote}
                  className="p-1 text-yellow-700 dark:text-yellow-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Notu Sil"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-wrap">
              {userNote}
            </div>
          </div>
        )}

        {/* Multiple Notes Navigation */}
        {notes.length > 1 && (
          <div className="p-4 bg-neutral-50 dark:bg-neutral-700 border-t border-neutral-200 dark:border-neutral-600">
            <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              İlgili Notlar ({notes.length} belge)
            </h4>
            <div className="space-y-2">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => setCurrentNote(note)}
                  className={`w-full flex items-center space-x-3 p-3 rounded text-left transition-colors ${
                    currentNote.id === note.id
                      ? 'bg-white dark:bg-neutral-600 shadow-sm'
                      : 'hover:bg-white/50 dark:hover:bg-neutral-600/50'
                  }`}
                >
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-500 rounded flex items-center justify-center">
                    <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {note.title}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {note.content_type.toUpperCase()} • {note.is_ai_generated ? 'AI Tarafından Oluşturuldu' : 'Manuel'}
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