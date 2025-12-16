'use client';

// Using React Icons instead of Lucide React
import { 
  FaXTwitter, 
  FaFacebookF, 
  FaLinkedinIn, 
  FaLink, 
  FaCommentDots 
} from "react-icons/fa6";

import { useState } from 'react';

interface DesktopShareSectionProps {
  postId: string; // Keep this to match the parent component's expectations
  title: string;
  locale: string;
}

export default function DesktopShareSection({ 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  postId, 
  title, 
  locale 
}: DesktopShareSectionProps) {
  const [showCopyNotification, setShowCopyNotification] = useState(false);

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
  const buttonClass = "p-3 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full text-[#a90013] transition-colors";
  const iconClass = "w-4 h-4"; // Slightly smaller icons for better appearance

  return (
    <div className="sticky top-32 flex flex-col items-center gap-6">
      <div className="relative">
        <button 
          onClick={() => handleShare('twitter')}
          className={buttonClass}
          aria-label="Share on Twitter"
        >
          <FaXTwitter className={iconClass} />
        </button>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => handleShare('facebook')}
          className={buttonClass}
          aria-label="Share on Facebook"
        >
          <FaFacebookF className={iconClass} />
        </button>
      </div>
      
      <div className="relative">
        <button 
          onClick={() => handleShare('linkedin')}
          className={buttonClass}
          aria-label="Share on LinkedIn"
        >
          <FaLinkedinIn className={iconClass} />
        </button>
      </div>
      
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
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-black/80 text-white text-xs py-1 px-3 rounded whitespace-nowrap">
            {locale === 'tr' ? 'Link kopyalandı!' : 'Link copied!'}
          </div>
        )}
      </div>
      
      <a 
        href="#comments" 
        className={buttonClass}
        aria-label="Comment"
      >
        <FaCommentDots className={iconClass} />
      </a>
      
      <div className="h-16 w-px bg-neutral-200 dark:bg-neutral-700"></div>
      <span className="rotate-90 text-neutral-500 dark:text-neutral-400 whitespace-nowrap text-sm font-medium">
        {locale === 'tr' ? 'PAYLAŞ' : 'SHARE'}
      </span>
    </div>
  );
}