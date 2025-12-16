"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Star, MessageCircle, Edit2, Trash2, Send, AlertCircle, CheckCircle, User, Lock, X, Check } from 'lucide-react';

interface EventComment {
  id: string;
  user_id: string;
  user_display_name: string;
  content: string;
  created_at: string;
  rating?: number | null;
  is_anonymous?: boolean;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  [key: string]: any;
}

interface EventCommentsProps {
  event: Event;
  eventSlug: string;
  texts?: { [key: string]: string };
  locale?: string;
}

const EventComments: React.FC<EventCommentsProps> = ({ 
  event, 
  eventSlug, 
  texts = {}, 
  locale = 'tr' 
}) => {
  const { user, isLoaded } = useUser();
  const [comments, setComments] = useState<EventComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newIsAnonymous, setNewIsAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentChecked, setEnrollmentChecked] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [editCommentRating, setEditCommentRating] = useState(5);
  const [editIsAnonymous, setEditIsAnonymous] = useState(false);
  const [updatingComment, setUpdatingComment] = useState(false);

  // Check enrollment status when user and event are available
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!user || !isLoaded || !event?.id) {
        setEnrollmentChecked(true);
        return;
      }

      try {
        // Check if user is enrolled in this event
        const response = await fetch(`/api/event-enrollment-check?eventId=${event.id}`);
        if (response.ok) {
          const data = await response.json();
          setIsEnrolled(data.isEnrolled || false);
        } else {
          setIsEnrolled(false);
        }
      } catch (error) {
        console.error('Error checking enrollment:', error);
        setIsEnrolled(false);
      } finally {
        setEnrollmentChecked(true);
      }
    };

    checkEnrollment();
  }, [user, isLoaded, event?.id]);

  // Fetch comments when event is loaded
  useEffect(() => {
    const fetchComments = async () => {
      if (!event?.id) return;
      try {
        setCommentsLoading(true);
        setCommentsError(null);
        const res = await fetch(`/api/event-comments?eventId=${event.id}`);
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
  }, [event?.id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event?.id || !newComment.trim()) return;
    try {
      setSubmitting(true);
      const res = await fetch('/api/event-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, content: newComment.trim(), rating: newRating, isAnonymous: newIsAnonymous })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Yorum gönderilemedi');
      }
      // Optimistic: prepend new comment
      setComments(prev => [data.comment as EventComment, ...prev]);
      setNewComment('');
      setNewRating(5);
      setNewIsAnonymous(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum gönderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditComment = (comment: EventComment) => {
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

  const updateComment = async (commentId: string) => {
    if (!editCommentContent.trim()) return;
    try {
      setUpdatingComment(true);
      const res = await fetch('/api/event-comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          commentId, 
          content: editCommentContent.trim(), 
          rating: editCommentRating,
          isAnonymous: editIsAnonymous
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Yorum güncellenemedi');
      }
      // Update comment in list with the response from API
      setComments(prev => prev.map(c => 
        c.id === commentId ? { 
          ...c, 
          content: editCommentContent.trim(), 
          rating: editCommentRating,
          is_anonymous: editIsAnonymous,
          user_display_name: data.comment.user_display_name // Use the name from API response
        } : c
      ));
      cancelEditComment();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum güncellenemedi');
    } finally {
      setUpdatingComment(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm(locale === 'tr' ? 'Bu yorumu silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/event-comments?commentId=${commentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || 'Yorum silinemedi');
      }
      // Remove comment from list
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yorum silinemedi');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!enrollmentChecked) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-6">
        {locale === 'tr' ? 'Etkinlik Yorumları' : 'Event Comments'}
      </h3>

      {/* Yorum gönderme formu - only shown if enrolled */}
      {!enrollmentChecked ? (
        <div className="text-center py-4">
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
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
                  {locale === 'tr' ? 'Yorumunuzu Yazın' : 'Write Your Comment'}
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
                  aria-label={`${star} ${locale === 'tr' ? 'yıldız' : 'star'}`}
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
                {locale === 'tr' ? 'Anonim olarak yorum yap' : 'Comment anonymously'}
              </span>
            </label>
          </div>
          
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={locale === 'tr' ? 'Etkinlik hakkındaki düşüncelerinizi paylaşın...' : 'Share your thoughts about the event...'}
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
                  <span>{locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...'}</span>
                </>
              ) : (
                locale === 'tr' ? 'Yorumu Gönder' : 'Submit Comment'
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            {locale === 'tr' ? 'Not: İsim soyisim formatında gösterilir.' : 'Note: Name will be displayed in name format.'}
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
                {locale === 'tr' ? 'Yorum yapmak için etkinliğe kayıt olun' : 'Register for the event to comment'}
              </p>
              <p className="text-blue-600 dark:text-blue-300 text-xs">
                {locale === 'tr' ? 'Etkinliğe kayıt olduktan sonra yorum yapabilirsiniz' : 'You can comment after registering for the event'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Yorumlar listesi - herkese gösterilir */}
      <div className="space-y-6">
        {commentsLoading && (
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">{locale === 'tr' ? 'Yükleniyor...' : 'Loading...'}</div>
        )}
        {commentsError && (
          <div className="text-red-600 dark:text-red-400 text-sm">{commentsError}</div>
        )}
        {!commentsLoading && !commentsError && comments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              {locale === 'tr' ? 'Henüz yorum yapılmamış. İlk yorumu siz yapın!' : 'No comments yet. Be the first to comment!'}
            </p>
          </div>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-300 dark:bg-neutral-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                    {comment.user_display_name}
                  </h4>
                  {typeof comment.rating === 'number' && (
                    <div className="flex items-center space-x-1">
                      <div className="flex text-yellow-400">
                        {'★'.repeat(Math.max(1, Math.min(5, comment.rating || 0)))}
                      </div>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{comment.rating?.toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDate(comment.created_at)}
                </span>
                {isLoaded && user && comment.user_id === user.id && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditComment(comment)}
                      className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                      title={locale === 'tr' ? 'Düzenle' : 'Edit'}
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteComment(comment.id)}
                      className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      title={locale === 'tr' ? 'Sil' : 'Delete'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
                      
            
            {editingCommentId === comment.id ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-1 text-yellow-500 mb-2">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditCommentRating(star)}
                      className={`text-lg ${editCommentRating >= star ? 'opacity-100' : 'opacity-40'}`}
                      aria-label={`${star} ${locale === 'tr' ? 'yıldız' : 'star'}`}
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
                      {locale === 'tr' ? 'Anonim olarak göster' : 'Show anonymously'}
                    </span>
                  </label>
                </div>
                <textarea
                  value={editCommentContent}
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-sm text-neutral-800 dark:text-neutral-200"
                  placeholder={locale === 'tr' ? 'Yorumunuzu düzenleyin...' : 'Edit your comment...'}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={cancelEditComment}
                    className="px-3 py-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateComment(comment.id)}
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
                {comment.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventComments;
