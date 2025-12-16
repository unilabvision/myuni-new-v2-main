'use client';

// Using React Icons instead of Lucide React
import { 
  FaXTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaLink,
  FaBookmark,
  FaRegBookmark
} from "react-icons/fa6";

import { useState, useEffect } from 'react';

interface MobileShareSectionProps {
  postId: string;
  title: string;
  locale: string;
}

export default function MobileShareSection({ postId, title, locale }: MobileShareSectionProps) {
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Check if post is already bookmarked on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bookmarked = localStorage.getItem(`bookmark-${postId}`);
      setIsBookmarked(!!bookmarked);
    }
  }, [postId]);

  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break; 
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url)
          .then(() => {
            setShowCopyNotification(true);
            setTimeout(() => setShowCopyNotification(false), 2000);
          })
          .catch(err => console.log('Error copying:', err));
        break;
    }
  };

  // Common button class for consistent styling
  const buttonClass = "p-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-[#a90013] transition-colors";
  const iconClass = "w-4 h-4";

  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => {
          if (navigator.share) {
            navigator.share({
              title: title,
              url: window.location.href
            }).catch(err => console.log('Error sharing:', err));
          } else {
            handleShare('twitter');
          }
        }}
        className={buttonClass}
        aria-label="Share on Twitter"
      >
        <FaXTwitter className={iconClass} />
      </button>
      
      <button 
        onClick={() => handleShare('facebook')}
        className={buttonClass}
        aria-label="Share on Facebook"
      >
        <FaFacebookF className={iconClass} />
      </button>
      
      <button 
        onClick={() => handleShare('linkedin')}
        className={buttonClass}
        aria-label="Share on LinkedIn"
      >
        <FaLinkedinIn className={iconClass} />
      </button>
      
      <div className="relative">
        <button 
          onClick={() => handleShare('copy')}
          className={buttonClass}
          aria-label="Copy Link"
        >
          <FaLink className={iconClass} />
        </button>
        
        {/* Copy notification */}
        {showCopyNotification && (
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-3 rounded whitespace-nowrap">
            {locale === 'tr' ? 'Link kopyalandı!' : 'Link copied!'}
          </div>
        )}
      </div>
      
      {/* Add bookmark button */}
      <button 
        onClick={() => {
          if (isBookmarked) {
            localStorage.removeItem(`bookmark-${postId}`);
            setIsBookmarked(false);
          } else {
            localStorage.setItem(`bookmark-${postId}`, JSON.stringify({
              id: postId,
              title: title,
              url: window.location.href,
              date: new Date().toISOString()
            }));
            setIsBookmarked(true);
          }
        }}
        className={buttonClass}
        aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
      >
        {isBookmarked ? <FaBookmark className={iconClass} /> : <FaRegBookmark className={iconClass} />}
      </button>
    </div>
  );
}