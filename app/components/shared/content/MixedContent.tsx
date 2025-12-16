// components/shared/content/MixedContent.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { MyUNIVideo } from './MyUNIVideo';
import { MyUNINotes } from './MyUNINotes';
import { MyUNIQuick } from './MyUNIQuick';
import { Play, FileText, Zap, Users, Calendar, Brain } from 'lucide-react';

interface MixedContentProps {
  contentId: string; // lessonId veya sessionId
  userId?: string;
  type: 'course' | 'event'; // İçerik tipi
  onProgress?: (progress: number) => void;
  onComplete?: () => Promise<void>;
  onNext?: () => void;
  hasNext?: boolean;
  texts?: {
    video?: string;
    notes?: string;
    materials?: string;
    quiz?: string;
    exam?: string;
    interactive?: string;
    switchToVideo?: string;
    switchToNotes?: string;
    switchToMaterials?: string;
    switchToQuiz?: string;
    switchToExam?: string;
    mixedContent?: string;
    sessionContent?: string;
    courseContent?: string;
  };
}

type ContentType = 'video' | 'notes' | 'quiz';

const defaultTexts = {
  video: 'Video',
  notes: 'Notlar',
  materials: 'Materyaller',
  quiz: 'Quiz',
  exam: 'Sınav',
  interactive: 'İnteraktif',
  switchToVideo: 'Video\'ya Geç',
  switchToNotes: 'Notlara Geç',
  switchToMaterials: 'Materyallere Geç',
  switchToQuiz: 'Quiz\'e Geç',
  switchToExam: 'Sınava Geç',
  mixedContent: 'Karma İçerik',
  sessionContent: 'Oturum İçeriği',
  courseContent: 'Ders İçeriği'
};

export function MixedContent({ 
  contentId, 
  userId, 
  type, 
  onProgress, 
  onComplete, 
  onNext, 
  hasNext = false,
  texts = {} 
}: MixedContentProps) {
  const [activeContent, setActiveContent] = useState<ContentType>('video');
  const [availableContent, setAvailableContent] = useState<ContentType[]>([]);

  // Metinleri birleştir
  const t = { ...defaultTexts, ...texts };

  // Mevcut içerik tiplerini belirle (gerçek uygulamada API'den gelecek)
  useEffect(() => {
    // Varsayılan olarak tüm içerik tiplerinin mevcut olduğunu varsayıyoruz
    // Gerçek uygulamada bu bilgi API'den gelecek
    const available: ContentType[] = ['video', 'notes', 'quiz'];
    setAvailableContent(available);
    
    // İlk mevcut içeriği aktif yap
    if (available.length > 0) {
      setActiveContent(available[0]);
    }
  }, [contentId]);

  const getContentIcon = (contentType: ContentType) => {
    const baseClasses = "w-5 h-5";
    const courseColor = "text-[#990000]";
    const eventColor = "text-blue-600";
    const iconColor = type === 'course' ? courseColor : eventColor;

    switch (contentType) {
      case 'video':
        return type === 'course' ? 
          <Play className={`${baseClasses} ${iconColor}`} /> : 
          <Calendar className={`${baseClasses} ${iconColor}`} />;
      case 'notes':
        return type === 'course' ? 
          <FileText className={`${baseClasses} ${iconColor}`} /> : 
          <Users className={`${baseClasses} ${iconColor}`} />;
      case 'quiz':
        return <Brain className={`${baseClasses} ${iconColor}`} />;
      default:
        return <Play className={`${baseClasses} ${iconColor}`} />;
    }
  };

  const getContentLabel = (contentType: ContentType) => {
    switch (contentType) {
      case 'video':
        return t.video;
      case 'notes':
        return type === 'course' ? t.notes : t.materials;
      case 'quiz':
        return type === 'course' ? t.exam : t.quiz;
      default:
        return contentType;
    }
  };

  const getSwitchLabel = (contentType: ContentType) => {
    switch (contentType) {
      case 'video':
        return t.switchToVideo;
      case 'notes':
        return type === 'course' ? t.switchToNotes : t.switchToMaterials;
      case 'quiz':
        return type === 'course' ? t.switchToExam : t.switchToQuiz;
      default:
        return `${getContentLabel(contentType)}'ya Geç`;
    }
  };

  const getThemeColor = () => {
    return type === 'course' ? '#990000' : '#2563eb';
  };

  const getBgThemeColorClass = () => {
    return type === 'course' ? 'bg-[#990000]' : 'bg-blue-600';
  };

  const getTextThemeColorClass = () => {
    return type === 'course' ? 'text-[#990000]' : 'text-blue-600';
  };

  const getBorderThemeColorClass = () => {
    return type === 'course' ? 'border-[#990000]' : 'border-blue-600';
  };

  const renderActiveContent = () => {
    switch (activeContent) {
      case 'video':
        return (
          <MyUNIVideo
            contentId={contentId}
            userId={userId}
            type={type}
            onProgress={onProgress}
            onComplete={onComplete}
            onNext={onNext}
            hasNext={hasNext}
          />
        );
      case 'notes':
        return (
          <MyUNINotes
            contentId={contentId}
            userId={userId}
            type={type}
            onComplete={onComplete}
          />
        );
      case 'quiz':
        return (
          <MyUNIQuick
            contentId={contentId}
            userId={userId}
            type={type}
            onComplete={async (score) => {
              if (onComplete) {
                await onComplete();
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  if (availableContent.length <= 1) {
    // Tek içerik tipi varsa direkt göster
    return (
      <div className="h-full">
        {renderActiveContent()}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content Type Tabs */}
      <div className="flex-shrink-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center space-x-1 p-4">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mr-4">
            {type === 'course' ? t.courseContent : t.sessionContent}
          </h3>
          <div className="flex items-center space-x-1">
            {availableContent.map((contentType) => (
              <button
                key={contentType}
                onClick={() => setActiveContent(contentType)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                  activeContent === contentType
                    ? `${getTextThemeColorClass()} ${getBorderThemeColorClass()}`
                    : 'text-neutral-600 dark:text-neutral-400 border-transparent hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
                title={getSwitchLabel(contentType)}
              >
                {getContentIcon(contentType)}
                <span className="hidden sm:inline">
                  {getContentLabel(contentType)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Active Content */}
      <div className="flex-1 overflow-hidden">
        {renderActiveContent()}
      </div>

      {/* Mobile Content Switcher */}
      {availableContent.length > 1 && (
        <div className="sm:hidden flex-shrink-0 bg-white dark:bg-neutral-800 border-t border-neutral-200 dark:border-neutral-700 p-3">
          <div className="grid grid-cols-3 gap-2">
            {availableContent.map((contentType) => (
              <button
                key={contentType}
                onClick={() => setActiveContent(contentType)}
                className={`flex flex-col items-center space-y-1 p-3 rounded-lg transition-all duration-200 ${
                  activeContent === contentType
                    ? `${getBgThemeColorClass()} text-white`
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                }`}
              >
                {getContentIcon(contentType)}
                <span className="text-xs font-medium">
                  {getContentLabel(contentType)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}