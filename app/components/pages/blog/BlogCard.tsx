

// BlogCard.tsx - Regular Blog Card Component
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Calendar } from 'lucide-react';
import { MyUniBlogPost } from '@/app/types/myuniBlog';

interface BlogCardProps {
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

const BlogCard: React.FC<BlogCardProps> = ({ post, locale }) => {
  const formattedDate = formatDate(post.date, locale);
  
  return (
    <article className="group bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg hover:border-[#990000]/20 dark:hover:border-[#990000]/30 transition-all duration-300 flex flex-col h-full">
      {/* Image */}
      <Link href={`/${locale}/blog/${post.slug}`} className="block aspect-[16/9] relative overflow-hidden">
        <Image 
          src={post.image || "/blog/default-image.webp"} 
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-[#990000] text-white px-2.5 py-1 text-xs font-medium rounded-md">
            {post.category}
          </span>
        </div>
      </Link>
      
      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center mb-3 text-neutral-500 dark:text-neutral-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm">{formattedDate}</span>
        </div>
        
        <Link href={`/${locale}/blog/${post.slug}`} className="block">
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-3 group-hover:text-[#990000] dark:group-hover:text-white transition-colors duration-300 line-clamp-2">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
          {post.excerpt}
        </p>
        
        <Link 
          href={`/${locale}/blog/${post.slug}`} 
          className="text-[#990000] dark:text-white hover:text-[#770000] dark:hover:text-neutral-200 text-sm font-medium inline-flex items-center mt-auto group/link"
        >
          <span>{locale === 'tr' ? 'Devamını Oku' : 'Read More'}</span>
          <ArrowRight className="ml-2 w-4 h-4 transform group-hover/link:translate-x-1 transition-transform duration-300" />
        </Link>
      </div>
    </article>
  );
};

export default BlogCard;