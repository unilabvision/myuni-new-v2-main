'use client';

import { Share2, Twitter, Facebook, Linkedin, Link2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface ShareButtonProps {
  title: string;
  size?: 'sm' | 'md' | 'lg';
  locale: string;
}

export default function ShareButton({ title, size = 'md', locale }: ShareButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle share via platform
  const handleShare = (platform: 'twitter' | 'facebook' | 'linkedin' | 'copy') => {
    const url = window.location.href;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    
    // Different platforms
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
            alert(locale === 'tr' ? 'Link kopyalandı!' : 'Link copied!');
          })
          .catch(err => console.log('Error copying:', err));
        break;
    }
    
    setIsMenuOpen(false);
  };

  // Size classes
  const sizeClasses = {
    sm: "p-2 rounded-full",
    md: "p-3 rounded-full",
    lg: "p-4 rounded-full"
  };

  const iconSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  const menuSizeClasses = {
    sm: "bottom-10 -left-16",
    md: "bottom-14 -left-16",
    lg: "bottom-16 -left-20"
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => {
          // If Web Share API is available, use it first
          if (navigator.share) {
            navigator.share({
              title: title,
              url: window.location.href
            })
            .catch(() => {
              // If share fails or user cancels, open our custom menu
              setIsMenuOpen(!isMenuOpen);
            });
          } else {
            // Otherwise open our custom menu
            setIsMenuOpen(!isMenuOpen);
          }
        }}
        className={`${sizeClasses[size]} bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors`} 
        aria-label="Share"
      >
        <Share2 className={iconSizeClasses[size]} />
      </button>
      
      {/* Share menu */}
      {isMenuOpen && (
        <div className={`absolute ${menuSizeClasses[size]} bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-2 z-50 w-36`}>
          <div className="flex flex-col space-y-1">
            <button 
              onClick={() => handleShare('twitter')}
              className="flex items-center px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <Twitter className="w-4 h-4 mr-2 text-[#1DA1F2]" />
              Twitter
            </button>
            <button 
              onClick={() => handleShare('facebook')}
              className="flex items-center px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <Facebook className="w-4 h-4 mr-2 text-[#4267B2]" />
              Facebook
            </button>
            <button 
              onClick={() => handleShare('linkedin')}
              className="flex items-center px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <Linkedin className="w-4 h-4 mr-2 text-[#0077B5]" />
              LinkedIn
            </button>
            <div className="border-t border-neutral-200 dark:border-neutral-700 my-1"></div>
            <button 
              onClick={() => handleShare('copy')}
              className="flex items-center px-3 py-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm text-neutral-700 dark:text-neutral-300"
            >
              <Link2 className="w-4 h-4 mr-2 text-neutral-500" />
              {locale === 'tr' ? 'Linki Kopyala' : 'Copy Link'}
            </button>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-neutral-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
}