"use client";

import React, { useState, useEffect } from 'react';
import { User, Linkedin, Mail, Lock, Edit2, Trash2, X, Check } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';
import { checkUserEnrollment } from '../../../../../../lib/enrollmentService';

// Supabase client'ı oluşturun
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface CourseObjective {
  id: string;
  objective_text: string;
  order_index: number;
}

interface CourseRequirement {
  id: string;
  requirement_text: string;
  order_index: number;
}

interface CourseComment {
  id: string;
  user_id: string;
  user_display_name: string;
  content: string;
  created_at: string;
  rating?: number | null;
  is_anonymous?: boolean;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  description?: string;
  instructor_name?: string;
  instructor_description?: string;
  instructor_email?: string;
  instructor_linkedin?: string;
  instructor_image_url?: string; // Yeni alan eklendi
  duration?: string;
  level?: string;
  price?: number;
  original_price?: number;
  thumbnail_url?: string;
  banner_url?: string;
  is_active?: boolean;
  rating?: number;
  students?: number;
  course_type?: 'online' | 'live' | 'hybrid';
}

interface CourseMainContentTexts {
  // Add specific text properties here if needed
  [key: string]: string;
}

interface CourseMainContentProps {
  courseSlug: string;
  texts?: CourseMainContentTexts;
  course?: Course;
}

const CourseMainContent: React.FC<CourseMainContentProps> = ({ 
  courseSlug,
  texts = {},
  course: propCourse
}) => {
  const { user, isLoaded } = useUser();
  const [course, setCourse] = useState<Course | null>(propCourse || null);
  const [objectives, setObjectives] = useState<CourseObjective[]>([]);
  const [requirements, setRequirements] = useState<CourseRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'objectives' | 'requirements' | 'comments'>('overview');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [comments, setComments] = useState<CourseComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [submitting, setSubmitting] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentRating, setEditCommentRating] = useState(5);
  const [updatingComment, setUpdatingComment] = useState(false);
  const [newIsAnonymous, setNewIsAnonymous] = useState(false);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);

  // Log texts to avoid unused variable warning - remove in production if not needed
  useEffect(() => {
    if (Object.keys(texts).length > 0) {
      console.log('Available texts:', texts);
    }
  }, [texts]);

  useEffect(() => {
    setShowFullDescription(false);
  }, [activeTab]);

  // Check enrollment status when user and course are available
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!isLoaded || !user || !course?.id) {
        setEnrollmentChecked(true);
        return;
      }

      try {
        const enrolled = await checkUserEnrollment(user.id, course.id);
        setIsEnrolled(enrolled);
      } catch (err) {
        console.error('Error checking enrollment:', err);
        setIsEnrolled(false);
      } finally {
        setEnrollmentChecked(true);
      }
    };

    checkEnrollment();
  }, [user, isLoaded, course?.id]);

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: courseData, error: courseError } = await supabase
          .from('myuni_courses')
          .select('*')
          .eq('slug', courseSlug)
          .eq('is_active', true)
          .single();

        if (courseError) {
          throw new Error('Kurs bulunamadı');
        }

        setCourse(courseData);

        const { data: objectivesData, error: objectivesError } = await supabase
          .from('myuni_course_objectives')
          .select('*')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true });

        if (objectivesError) {
          console.error('Hedefler çekilemedi:', objectivesError);
        } else {
          setObjectives(objectivesData || []);
        }

        const { data: requirementsData, error: requirementsError } = await supabase
          .from('myuni_course_requirements')
          .select('*')
          .eq('course_id', courseData.id)
          .order('order_index', { ascending: true });

        if (requirementsError) {
          console.error('Gereksinimler çekilemedi:', requirementsError);
        } else {
          setRequirements(requirementsData || []);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    if (courseSlug) {
      fetchCourseData();
    }
  }, [courseSlug]);

  // Yorumları getir
  useEffect(() => {
    const fetchComments = async () => {
      if (!course?.id || activeTab !== 'comments') return;
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const res = await fetch(`/api/course-comments?courseId=${course.id}`);
        if (!res.ok) {
          throw new Error('Yorumlar alınamadı');
        }
        const data = await res.json();
        setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch (err) {
        setCommentsError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [course?.id, activeTab]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course?.id || !newComment.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/course-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, content: newComment.trim(), rating: newRating, isAnonymous: newIsAnonymous })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Yorum gönderilemedi');
      }
      // Optimistic: prepend new comment
      setComments(prev => [data.comment as CourseComment, ...prev]);
      setNewComment('');
      setNewRating(5);
      setNewIsAnonymous(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditComment = (comment: CourseComment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
    setEditCommentRating(comment.rating || 5);
    setEditIsAnonymous(comment.is_anonymous || false);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
    setEditCommentRating(5);
    setEditIsAnonymous(false);
  };

  const saveEditComment = async () => {
    if (!editingCommentId || !editCommentContent.trim()) return;
    try {
      setUpdatingComment(true);
      const res = await fetch('/api/course-comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commentId: editingCommentId, 
          content: editCommentContent.trim(), 
          rating: editCommentRating,
          isAnonymous: editIsAnonymous
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data?.error || 'Yorum güncellenemedi');
      }
      // Update comment in state
      setComments(prev => prev.map(c => c.id === editingCommentId ? data.comment : c));
      cancelEditComment();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum güncellenemedi');
    } finally {
      setUpdatingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    try {
      const res = await fetch(`/api/course-comments?commentId=${commentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Yorum silinemedi');
      }
      // Remove comment from state
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum silinemedi');
    }
  };

  // Eğitmen resmini Supabase Storage'dan çekme fonksiyonu
  const getInstructorImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) return null;
    
    // Eğer tam URL verilmişse direkt döndür
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Supabase storage URL'ini oluştur
    const { data } = supabase.storage
      .from('myunilab')
      .getPublicUrl(imagePath);
    
    return data.publicUrl;
  };

  const getTextLength = (htmlContent: string | undefined) => {
    if (!htmlContent) return 0;
    const textOnly = htmlContent.replace(/<[^>]*>/g, '').trim();
    return textOnly.length;
  };

  const renderRichText = (htmlContent: string | undefined) => {
    if (!htmlContent) return <p>Açıklama bulunmuyor.</p>;
    
    const isHtml = htmlContent.includes('<');
    const contentToRender = isHtml ? htmlContent : `<p>${htmlContent}</p>`;
    const textLength = getTextLength(htmlContent);
    const isLong = textLength > 400;

    if (isLong && !showFullDescription) {
      const truncatedContent = contentToRender.slice(0, 400) + '...';
      return (
        <div className="relative">
          <div 
            className="rich-text-content"
            dangerouslySetInnerHTML={{ __html: truncatedContent }}
          />
          {/* Gradyan overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-neutral-900 dark:via-neutral-900/90 dark:to-transparent pointer-events-none"></div>
          
          <div className="relative pt-4">
            <button
              onClick={() => setShowFullDescription(true)}
              className="text-neutral-900 dark:text-neutral-100 text-sm hover:underline font-medium transition-all duration-200 relative z-10"
            >
              Devamını oku
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div 
          className="rich-text-content"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
        />
        {isLong && (
          <button
            onClick={() => setShowFullDescription(false)}
            className="mt-4 text-neutral-900 dark:text-neutral-100 text-sm hover:underline font-medium transition-all duration-200"
          >
            Daha az göster
          </button>
        )}
      </div>
    );
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="text-left">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-4"></div>
          <div className="w-16 h-px bg-neutral-200 dark:bg-neutral-700"></div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400 mb-4">
          {error || 'Kurs bulunamadı'}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-neutral-800 text-white rounded-sm hover:bg-neutral-900 transition-colors"
        >
          Yeniden Dene
        </button>
      </div>
    );
  }

  // Eğitmen resmi URL'ini al
  const instructorImageUrl = getInstructorImageUrl(course.instructor_image_url);

  return (
    <div className="space-y-12">
      <style jsx>{`
        .rich-text-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
          color: rgb(115 115 115);
        }
        .dark .rich-text-content p {
          color: rgb(212 212 212);
        }
        .rich-text-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem 0;
          color: rgb(23 23 23);
        }
        .dark .rich-text-content h3 {
          color: rgb(245 245 245);
        }
        .rich-text-content strong {
          font-weight: 600;
          color: rgb(23 23 23);
        }
        .dark .rich-text-content strong {
          color: rgb(245 245 245);
        }
        .rich-text-content em {
          font-style: italic;
          color: rgb(82 82 82);
        }
        .dark .rich-text-content em {
          color: rgb(163 163 163);
        }
        .rich-text-content ul {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        .rich-text-content li {
          margin-bottom: 0.5rem;
          list-style-type: disc;
          color: rgb(115 115 115);
        }
        .dark .rich-text-content li {
          color: rgb(212 212 212);
        }
        .tab-content {
          opacity: 0;
          transform: translateY(10px);
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .instructor-image {
          transition: transform 0.2s ease-in-out;
        }
        .instructor-image:hover {
          transform: scale(1.02);
        }
      `}</style>

      {/* Live Course Banner Image - görseli en üste taşıdık */}
      {course.course_type !== 'online' && course.banner_url && (
        <div className="mb-8 hidden sm:block">
          <div className="relative w-full h-48 xs:h-56 sm:h-72 md:h-80 lg:h-96 xl:h-[28rem] rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <Image
              src={course.banner_url}
              alt={course.title}
              fill
              className="object-cover"
              priority={false}
            />
          </div>
        </div>
      )}

      <div className="border-b border-neutral-200 dark:border-neutral-700">
        <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Açıklama
            {activeTab === 'overview' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('objectives')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'objectives'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Öğrenecekleriniz
            {activeTab === 'objectives' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'requirements'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Gereksinimler
            {activeTab === 'requirements' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'comments'
                ? 'text-neutral-900 dark:text-neutral-100'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            Yorumlar
            {activeTab === 'comments' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900 dark:bg-neutral-100 transition-all duration-200"></div>
            )}
          </button>
        </nav>
      </div>

      <div className="tab-content" key={activeTab}>
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div>
              {renderRichText(course.description)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  Pratik Odaklı
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Teorinin yanında bol bol pratik yaparak gerçek projeler geliştirin
                </p>
              </div>

              <div className="text-left">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  Hedef Odaklı
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Her ders sonunda net hedeflere ulaşın ve ilerlemenizi takip edin
                </p>
              </div>

              <div className="text-left sm:col-span-2 lg:col-span-1">
                <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2 text-sm sm:text-base">
                  Sertifikalı
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Kurs sonunda geçerli bir dijital sertifika kazanın
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Bu kursu tamamladığınızda:
            </h3>
            <div className="space-y-4">
              {objectives.length > 0 ? (
                objectives.map((objective) => (
                  <div key={objective.id} className="flex items-start space-x-3">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed break-words overflow-wrap-anywhere">
                      {objective.objective_text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-neutral-600 dark:text-neutral-400">
                  Bu kurs için henüz hedefler tanımlanmamış.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requirements' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Kurs için gerekenler:
            </h3>
            <div className="space-y-4">
              {requirements.length > 0 ? (
                requirements.map((requirement) => (
                  <div key={requirement.id} className="flex items-start space-x-3">
                    <div className="w-1 h-1 bg-neutral-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed break-words overflow-wrap-anywhere">
                      {requirement.requirement_text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-neutral-600 dark:text-neutral-400">
                  Bu kurs için özel gereksinim bulunmuyor.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
              Kurs Yorumları
            </h3>

            {/* Yorum gönderme formu - only shown if enrolled */}
            {!enrollmentChecked ? (
              <div className="text-center py-4">
                <div className="text-neutral-600 dark:text-neutral-400 text-sm">Yükleniyor...</div>
              </div>
            ) : isEnrolled ? (
              <form onSubmit={submitComment} className="mb-6 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                        Yorumunuzu Yazın
                      </h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500">
                    {[1,2,3,4,5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className={`text-lg ${newRating >= star ? 'opacity-100' : 'opacity-40'}`}
                        aria-label={`${star} yıldız`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newIsAnonymous}
                      onChange={(e) => setNewIsAnonymous(e.target.checked)}
                      className="w-4 h-4 text-[#990000] bg-white border-neutral-300 rounded focus:ring-[#990000] focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      Anonim olarak yorum yap
                    </span>
                  </label>
                </div>
                
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Kurs hakkındaki düşüncelerinizi paylaşın..."
                  className="w-full min-h-[90px] p-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-800 dark:text-neutral-200"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || newComment.trim().length < 3}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-sm text-sm disabled:opacity-50 flex items-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Gönderiliyor...</span>
                      </>
                    ) : (
                      'Yorumu Gönder'
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Not: İsim soyisim formatında gösterilir.
                </p>
              </form>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-blue-800 dark:text-blue-200 text-sm font-medium">
                      Yorum yapmak için kursa kayıt olun
                    </p>
                    <p className="text-blue-600 dark:text-blue-300 text-xs">
                      Kursa kayıt olduktan sonra yorum yapabilirsiniz
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Yorumlar listesi - herkese gösterilir */}
            <div className="space-y-6">
              {commentsLoading && (
                <div className="text-neutral-600 dark:text-neutral-400 text-sm">Yükleniyor...</div>
              )}
              {commentsError && (
                <div className="text-red-600 dark:text-red-400 text-sm">{commentsError}</div>
              )}
              {!commentsLoading && !commentsError && comments.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Henüz yorum yapılmamış. İlk yorumu siz yapın!
                  </p>
                </div>
              )}
              {comments.map((c) => (
                <div key={c.id} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                          {c.user_display_name}
                        </h4>
                        {typeof c.rating === 'number' && (
                          <div className="flex items-center space-x-1">
                            <div className="flex text-yellow-400">
                              {'★'.repeat(Math.max(1, Math.min(5, c.rating || 0)))}
                            </div>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">{c.rating?.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {new Date(c.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                      {user && c.user_id === user.id && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => startEditComment(c)}
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteComment(c.id)}
                            className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingCommentId === c.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-1 text-yellow-500 mb-2">
                        {[1,2,3,4,5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setEditCommentRating(star)}
                            className={`text-lg ${editCommentRating >= star ? 'opacity-100' : 'opacity-40'}`}
                            aria-label={`${star} yıldız`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <div className="mb-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editIsAnonymous}
                            onChange={(e) => setEditIsAnonymous(e.target.checked)}
                            className="w-4 h-4 text-[#990000] bg-white border-neutral-300 rounded focus:ring-[#990000] focus:ring-2 dark:bg-neutral-700 dark:border-neutral-600"
                          />
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">
                            Anonim olarak göster
                          </span>
                        </label>
                      </div>
                      <textarea
                        value={editCommentContent}
                        onChange={(e) => setEditCommentContent(e.target.value)}
                        className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-800 dark:text-neutral-200"
                        placeholder="Yorumunuzu düzenleyin..."
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={cancelEditComment}
                          className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={saveEditComment}
                          disabled={editCommentContent.trim().length < 3 || updatingComment}
                          className="px-3 py-1 bg-neutral-900 text-white rounded-sm text-sm disabled:opacity-50 hover:bg-neutral-800 transition-colors flex items-center space-x-1"
                        >
                          {updatingComment ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">
                      {c.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {course.instructor_name && (
        <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-8">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
            Eğitmen
          </h3>
          <div className="w-16 h-px bg-[#990000] mb-6"></div>
          
          <div className="flex flex-col md:flex-row items-start space-y-6 md:space-y-0 md:space-x-6">
            <div className="flex-shrink-0">
              {instructorImageUrl && !imageError ? (
                <Image
                  src={instructorImageUrl}
                  alt={course.instructor_name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-sm object-cover instructor-image"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-20 h-20 bg-neutral-200 dark:bg-neutral-700 rounded-sm flex items-center justify-center">
                  <User className="w-10 h-10 text-neutral-600 dark:text-neutral-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                {course.instructor_name}
              </h4>
              {course.instructor_description && (
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed mb-6">
                  {course.instructor_description}
                </p>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                {course.instructor_linkedin && (
                  <a
                    href={course.instructor_linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white rounded-sm font-medium transition-colors text-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                )}
                
                {course.instructor_email && (
                  <a
                    href={`mailto:${course.instructor_email}`}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-800 dark:text-neutral-200 rounded-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    <span>E-posta</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseMainContent;