"use client";

import React, { useState, useEffect } from 'react';
import { Play, BookOpen, ChevronDown, ChevronUp, Clock, FileText, Video, Award } from 'lucide-react';
import Link from 'next/link';
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
    noContentDesc?: string;
    retry?: string;
  };
  included_courses?: any[];
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
  },
  included_courses = []
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
    return '0 dk';
  };

  const getTotalDuration = () => {
    return 0;
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
  if (included_courses.length === 0) {
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
            Pakete dahil içerik bulunamadı
          </h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            Bu paket için henüz kurs tanımlanmamış.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-left">
        <h2 className="text-xl sm:text-2xl font-medium text-neutral-900 dark:text-neutral-100 mb-4">
          {texts.courseSections}
        </h2>
        <div className="w-16 h-px bg-[#990000] mb-4 sm:mb-6"></div>
        <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Bu pakette toplam {included_courses.length} adet kurs bulunmaktadır.
        </p>
      </div>
      
      {/* Included Courses List */}
      <div className="space-y-4">
        {included_courses.map((course: any, index: number) => {
          const courseRoute = locale === 'tr' ? 'kurs' : 'course';
          const courseHref = `/${locale}/${courseRoute}/${course.slug}`;
          return (
            <Link 
              key={course.id || index} 
              href={courseHref}
              className="block border border-neutral-200 dark:border-neutral-700 rounded-sm overflow-hidden bg-white dark:bg-neutral-800 hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-600 transition-all duration-200 cursor-pointer"
            >
              <div
                className="w-full flex items-center justify-between p-4 sm:p-6 text-left transition-colors group"
              >
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-16 h-12 sm:w-24 sm:h-16 bg-neutral-100 dark:bg-neutral-700 rounded-sm overflow-hidden relative">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  {/* Course Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base text-neutral-900 dark:text-neutral-100 mb-1 sm:mb-2 break-words">
                      {course.title}
                    </h3>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">

                      <span className="flex items-center space-x-1">
                        <Award className="w-3 h-3 flex-shrink-0" />
                        <span>{course.level || 'Tüm Seviyeler'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-shrink-0 ml-4 hidden sm:block">
                  <span className="inline-flex items-center px-3 py-1 rounded-sm text-xs font-medium bg-[#990000]/10 text-[#990000] dark:bg-red-900/20 dark:text-red-400">
                    {course.price === 0 ? 'Ücretsiz' : `₺${course.early_bird_price || course.price}`}
                  </span>
                </div>
              </div>
            </Link>
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
              Bu eğitim paketine toplam {included_courses.length} farklı kurs dahildir. Hepsine erişim sağlarsınız.
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              {included_courses.length} Kurs
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Paket Kapsamı
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