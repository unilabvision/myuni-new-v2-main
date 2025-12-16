"use client";

import React, { useState, useEffect } from 'react';
import { Play, BookOpen, ChevronDown, ChevronUp, Clock, FileText, Video, Award } from 'lucide-react';
import VideoPreviewModal from './VideoPreviewModal'; // Modal'ı import et

// Interfaces
interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: string;
  description?: string;
  order_index: number;
  isCompleted: boolean;
  isLocked: boolean;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons: Lesson[];
}

interface CourseSectionsProps {
  courseSlug: string;
  courseId?: string;
  sections: Section[];
  totalLessons: number;
  locale?: string;
  texts?: {
    courseSections?: string;
    lessons?: string;
    lesson?: string;
    preview?: string;
    courseSummary?: string;
    totalDuration?: string;
    noContent?: string;
    noContentDesc?: string;
    retry?: string;
  };
}

const CourseSections: React.FC<CourseSectionsProps> = ({ 
  courseSlug,
  courseId = '',
  sections,
  totalLessons,
  locale = 'tr',
  texts = { 
    courseSections: 'Kurs İçeriği',
    lessons: 'ders',
    lesson: 'ders',
    preview: 'Önizleme',
    courseSummary: 'Kurs Özeti',
    totalDuration: 'Toplam süre',
    noContent: 'Henüz içerik eklenmemiş',
    noContentDesc: 'Bu kurs için yakında detaylı bölümler ve dersler eklenecek.',
    retry: 'Yeniden Dene'
  }
}) => {
  const [openSections, setOpenSections] = useState<{ [key: number]: boolean }>({
    0: true
  });
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    lessonId: string | null;
    lessonTitle: string | null;
  }>({
    isOpen: false,
    lessonId: null,
    lessonTitle: null
  });

  // If you need to perform additional operations when courseSlug changes, you can do so here
  useEffect(() => {
    // Eğer courseSlug ile ek veri çekmek istersen buraya kod ekleyebilirsin
  }, [courseSlug]);

  // Helper functions
  const toggleSection = (index: number) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4 text-neutral-400" />;
      case 'text':
        return <FileText className="w-4 h-4 text-neutral-400" />;
      case 'quiz':
        return <Award className="w-4 h-4 text-neutral-400" />;
      case 'assignment':
        return <BookOpen className="w-4 h-4 text-neutral-400" />;
      default:
        return <Play className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getLessonTypeLabel = (type: string) => {
    const labels = {
      video: 'Video',
      text: 'Metin',
      quiz: 'Quiz',
      assignment: 'Ödev'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const calculateSectionDuration = (lessons: Lesson[]) => {
    if (!lessons || lessons.length === 0) return '0 dk';
    
    let totalMinutes = 0;
    lessons.forEach(lesson => {
      const duration = lesson.duration;
      if (duration.includes('dk')) {
        totalMinutes += parseInt(duration.replace('dk', '').trim()) || 0;
      } else if (duration.includes('sa')) {
        totalMinutes += (parseInt(duration.replace('sa', '').trim()) || 0) * 60;
      }
    });

    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours}sa${minutes > 0 ? ` ${minutes}dk` : ''}`;
    }
    
    return `${totalMinutes}dk`;
  };

  const getTotalDuration = () => {
    return sections.reduce((total, section) => {
      const duration = calculateSectionDuration(section.lessons);
      let minutes = 0;
      
      if (duration.includes('sa')) {
        const parts = duration.split('sa');
        minutes += parseInt(parts[0]) * 60;
        if (parts[1] && parts[1].includes('dk')) {
          minutes += parseInt(parts[1].replace('dk', '').trim()) || 0;
        }
      } else if (duration.includes('dk')) {
        minutes += parseInt(duration.replace('dk', '').trim()) || 0;
      }
      
      return total + minutes;
    }, 0);
  };

  // Önizleme modal'ını aç
  const openPreviewModal = (lessonId: string, lessonTitle: string) => {
    setPreviewModal({
      isOpen: true,
      lessonId,
      lessonTitle
    });
  };

  // Önizleme modal'ını kapat
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      lessonId: null,
      lessonTitle: null
    });
  };

  // Önizleme logic'i - sadece ilk bölümün ilk 3 video dersinde göster
  const shouldShowPreview = (sectionIndex: number, lessonIndex: number, lessonType: string) => {
    return sectionIndex === 0 && lessonIndex < 3 && lessonType === 'video' && !sections[sectionIndex]?.lessons[lessonIndex]?.isLocked;
  };

  // Empty state
  if (sections.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-left">
          <h2 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
            {texts.courseSections}
          </h2>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
        </div>
        
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
          <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            {texts.noContent}
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-500 max-w-md mx-auto">
            {texts.noContentDesc}
          </p>
        </div>
      </div>
    );
  }

  const totalDurationMinutes = getTotalDuration();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {texts.courseSections}
        </h2>
        <div className="w-16 h-px bg-[#990000] mb-4 sm:mb-6"></div>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {sections.length} bölüm, {totalLessons} {texts.lessons} • Detaylı video içerikler ve uygulamalı projeler
        </p>
      </div>
      
      {/* Course Sections */}
      <div className="space-y-4">
        {sections.map((section: Section, sectionIndex: number) => {
          const sectionDuration = calculateSectionDuration(section.lessons);
          const completedLessons = section.lessons.filter(lesson => lesson.isCompleted).length;
          
          return (
            <div 
              key={section.id} 
              className="border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden bg-white dark:bg-neutral-800"
            >
              {/* Section Header */}
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors group"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-neutral-100 dark:bg-neutral-700 rounded-sm flex items-center justify-center text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      {sectionIndex + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2 break-words">
                      {section.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center space-x-1">
                        <BookOpen className="w-3 h-3 flex-shrink-0" />
                        <span>{section.lessons?.length || 0} {texts.lesson}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        <span>{sectionDuration}</span>
                      </span>
                      {completedLessons > 0 && (
                        <span className="text-neutral-600 dark:text-neutral-400 flex items-center space-x-1">
                          <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>{completedLessons}/{section.lessons.length}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0 ml-2">
                  {openSections[sectionIndex] ? (
                    <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </div>
              </button>

              {/* Section Content */}
              {openSections[sectionIndex] && section.lessons && (
                <div className="border-t border-neutral-200 dark:border-neutral-700">
                  {section.description && (
                    <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {section.description}
                      </p>
                    </div>
                  )}
                  
                  {section.lessons.map((lesson: Lesson, lessonIndex: number) => (
                    <div 
                      key={lesson.id} 
                      className={`flex items-center justify-between p-3 sm:p-4 border-b border-neutral-100 dark:border-neutral-700 last:border-b-0 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors cursor-pointer group ${
                        lesson.isLocked ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        {/* Lesson Icon */}
                        <div className="flex-shrink-0">
                          {lesson.isCompleted ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-neutral-600 dark:bg-neutral-400 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="white" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : lesson.isLocked ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-neutral-200 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                              <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                              {getLessonIcon(lesson.type)}
                            </div>
                          )}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0 mb-1">
                            <h4 className={`font-medium text-xs sm:text-sm break-words ${
                              lesson.isLocked 
                                ? 'text-neutral-400 dark:text-neutral-500' 
                                : 'text-neutral-900 dark:text-neutral-100'
                            }`}>
                              {lessonIndex + 1}. {lesson.title}
                            </h4>
                            
                            <span className="text-xs px-2 py-1 rounded-sm bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 font-medium w-fit">
                              {getLessonTypeLabel(lesson.type)}
                            </span>
                          </div>
                          
                          {lesson.description && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 break-words">
                              {lesson.description}
                            </p>
                          )}
                        </div>

                        {/* Lesson Duration & Preview */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 flex-shrink-0">
                          <div className="flex items-center space-x-1 text-xs text-neutral-500 dark:text-neutral-400">
                            <Clock className="w-3 h-3" />
                            <span>{lesson.duration}</span>
                          </div>

                          {/* Preview Badge - Sadece ilk bölümün ilk 3 video dersinde */}
                          {shouldShowPreview(sectionIndex, lessonIndex, lesson.type) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openPreviewModal(lesson.id, lesson.title);
                              }}
                              className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 px-2 py-1 rounded-sm font-medium border border-blue-200 dark:border-blue-700 transition-colors"
                            >
                              <span className="hidden sm:inline">{texts.preview}</span>
                              <span className="sm:hidden">Önizle</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="p-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-1">
              {texts.courseSummary}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Toplamda {sections.length} bölüm ve {totalLessons} ders içeriği
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {totalDurationMinutes >= 60 ? 
                `${Math.floor(totalDurationMinutes / 60)}sa${totalDurationMinutes % 60 > 0 ? ` ${totalDurationMinutes % 60}dk` : ''}` :
                `${totalDurationMinutes}dk`
              }
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {texts.totalDuration}
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        isOpen={previewModal.isOpen}
        onClose={closePreviewModal}
        lessonId={previewModal.lessonId || ''}
        lessonTitle={previewModal.lessonTitle || ''}
        courseId={courseId}
        courseSlug={courseSlug}
        locale={locale}
        texts={{
          preview: texts.preview,
          loading: 'Video yükleniyor...',
          error: 'Video yüklenemedi',
          retry: 'Yeniden Dene'
        }}
      />
    </div>
  );
};

export default CourseSections;