
// ===============================

// FeaturedBlogCard.tsx - Featured Blog Card Component
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { MyUniBlogPost } from '@/app/types/myuniBlog';

interface FeaturedBlogCardProps {
  post: MyUniBlogPost;
  locale: string;
}

function formatDate(dateString: string, locale: string): string {
  const date = new Date(dateString);
  
  if (locale === 'tr') {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
  } else {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }
}

const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({ post, locale }) => {
  const postUrl = `/${locale}/blog/${post.slug}`;
  const formattedDate = formatDate(post.date, locale);
  const defaultImage = "/blog/default-image.webp";
  
  return (
    <article className="group relative bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg hover:border-[#990000]/20 dark:hover:border-[#990000]/30 transition-all duration-300">
      <Link href={postUrl} className="absolute inset-0 z-10">
        <span className="sr-only">{post.title}</span>
      </Link>
      
      {/* Image */}
      <div className="aspect-[16/9] relative overflow-hidden">
        <Image 
          src={post.image || defaultImage} 
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-[#990000] text-white px-3 py-1.5 text-sm font-medium rounded-lg">
            {post.category}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="flex items-center mb-4 text-neutral-500 dark:text-neutral-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm">{formattedDate}</span>
        </div>
        
        <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-[#990000] dark:group-hover:text-white transition-colors duration-300 line-clamp-2">
          {post.title}
        </h3>
        
        <p className="text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-3 leading-relaxed">
          {post.excerpt}
        </p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span 
                key={index}
                className="bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2.5 py-1 text-xs rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Read More */}
        <div className="flex items-center text-[#990000] dark:text-white font-medium relative z-20 pointer-events-none">
          <span className="text-sm">{locale === 'tr' ? 'Devamını Oku' : 'Read More'}</span>
          <ArrowRight className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>
    </article>
  );
};

export default FeaturedBlogCard;