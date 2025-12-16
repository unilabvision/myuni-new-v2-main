// app/components/pages/blog/CommentSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthUser } from '@/app/hooks/useAuth';
import { User, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  user_id: string; // Kullanıcı ID'si ekleyelim
  user_name: string;
  content: string;
  created_at: string;
  status: string;
}

interface CommentSectionProps {
  postId: string;
  locale: string;
}

export default function CommentSection({ postId, locale }: CommentSectionProps) {
  const { isSignedIn, loading, redirectToSignup, redirectToLogin, userId } = useAuthUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?postId=${postId}&status=approved`);
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [postId]);

  // Yorumları yükle
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      redirectToSignup(locale);
      return;
    }

    if (!newComment.trim()) {
      setError(locale === 'tr' ? 'Yorum boş olamaz.' : 'Comment cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId,
          locale,
          content: newComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to post comment');
      }

      setNewComment('');
      setSuccess(
        locale === 'tr'
          ? 'Yorumunuz gönderildi!'
          : 'Your comment has been posted!'
      );
      
      // Yorumları yeniden yükle
      fetchComments();
      
    } catch (error) {
      console.error('Error posting comment:', error);
      setError(
        locale === 'tr'
          ? 'Yorum gönderilemedi. Lütfen tekrar deneyin.'
          : 'Failed to post comment. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm(locale === 'tr' ? 'Yorumu silmek istediğinize emin misiniz?' : 'Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingCommentId(commentId);
    
    try {
      const response = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete comment');
      }

      // Yorumu listeden kaldır
      setComments(comments.filter(comment => comment.id !== commentId));
      
      // Başarı mesajı göster
      setSuccess(locale === 'tr' ? 'Yorum silindi.' : 'Comment deleted.');
      
      // 3 saniye sonra başarı mesajını temizle
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(
        locale === 'tr'
          ? 'Yorum silinemedi. Lütfen tekrar deneyin.'
          : 'Failed to delete comment. Please try again.'
      );
      // 3 saniye sonra hata mesajını temizle
      setTimeout(() => setError(''), 3000);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Basit tarih formatlama fonksiyonu
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return locale === 'tr' ? 'az önce' : 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return locale === 'tr' 
        ? `${diffInMinutes} dakika önce` 
        : `${diffInMinutes} minutes ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return locale === 'tr' 
        ? `${diffInHours} saat önce` 
        : `${diffInHours} hours ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return locale === 'tr' 
      ? `${diffInDays} gün önce` 
      : `${diffInDays} days ago`;
  };

  if (loading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  return (
    <div id="comments" className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800">
      <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-6">
        {locale === 'tr' ? 'Yorumlar' : 'Comments'}
      </h3>

      {/* Comment Form */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 mb-8">
        {isSignedIn ? (
          <>
            <h4 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-4">
              {locale === 'tr' ? 'Yorum Yap' : 'Leave a Comment'}
            </h4>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={4}
                  className="w-full text-black dark:text-white bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#a90013] focus:border-transparent"
                  placeholder={
                    locale === 'tr'
                      ? 'Yorumunuzu yazın...'
                      : 'Write your comment...'
                  }
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {success && (
                <p className="text-green-500 text-sm">{success}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#a90013] hover:bg-[#8a0010] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {submitting
                  ? (locale === 'tr' ? 'Gönderiliyor...' : 'Submitting...')
                  : (locale === 'tr' ? 'Gönder' : 'Submit')}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py- W3C8">
    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
      {locale === 'tr'
        ? 'Yorum yapabilmek için üye olmanız veya giriş yapmanız gerekmektedir.'
        : 'You need to be a member or sign in to leave comments.'}
    </p>
    <div className="flex justify-center space-x-4">
      <button
        onClick={() => redirectToSignup(locale)}
        className="bg-[#a90013] hover:bg-[#8a0010] text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
      >
        {locale === 'tr' ? 'Üye Ol' : 'Sign Up'}
      </button>
      <button
        onClick={() => redirectToLogin(locale)} // redirectToLogin fonksiyonu varsayılıyor
        className="bg-neutral-600 hover:bg-neutral-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
      >
        {locale === 'tr' ? 'Giriş Yap' : 'Sign In'}
      </button>
    </div>
  </div>
)}
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-neutral-800/30 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                  </div>
                  <div>
                    <h5 className="font-medium text-neutral-900 dark:text-neutral-100">
                      {comment.user_name}
                    </h5>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
                
                {/* Silme butonu - sadece yorum sahibine göster */}
                {isSignedIn && userId === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    disabled={deletingCommentId === comment.id}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title={locale === 'tr' ? 'Yorumu sil' : 'Delete comment'}
                  >
                    {deletingCommentId === comment.id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              
              <p className="text-neutral-700 dark:text-neutral-300 text-sm pl-11">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            {locale === 'tr'
              ? 'Henüz yorum yapılmamış. İlk yorumu siz yapın!'
              : 'No comments yet. Be the first to comment!'}
          </div>
        )}
      </div>
    </div>
  );
}