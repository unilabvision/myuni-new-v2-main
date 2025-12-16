// app/components/pages/blog/RelatedPosts.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { MyUniBlogPost } from '@/app/types/myuniBlog';

interface RelatedPostsProps {
  posts: MyUniBlogPost[];
  locale: string;
  title?: string;
}

const RelatedPosts: React.FC<RelatedPostsProps> = ({ 
  posts, 
  locale,
  title 
}) => {
  if (posts.length === 0) return null;
  
  // Default image for posts with missing images
  const defaultImage = "/blog/default-image.webp";
  
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg shadow-sm border border-transparent">
      <h3 className="text-2xl font-semibold text-[#141414] dark:text-white mb-4">
        {title || (locale === 'tr' ? 'İlgili Yazılar' : 'Related Posts')}
      </h3>
      <div className="w-12 h-px bg-[#a90013] mt-2 mb-6"></div>
      
      <div className="space-y-6">
        {posts.map((post) => (
          <Link 
            key={post.id}
            href={`/${locale}/blog/${post.slug}`}
            className="block group"
          >
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-24 h-20 relative overflow-hidden rounded-md">
                <Image 
                  src={post.image || defaultImage} 
                  alt={post.title} 
                  fill 
                  className="object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
              </div>
              <div className="flex-grow">
                <h4 className="text-sm font-medium text-[#141414] dark:text-white group-hover:text-[#a90013] dark:group-hover:text-[#ffdee2] transition-colors">
                  {post.title}
                </h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {post.date}
                </p>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300">
                  <span className="text-[#a90013] dark:text-[#ffdee2] text-xs font-medium inline-flex items-center">
                    <span>{locale === 'tr' ? 'Devamını Oku' : 'Read More'}</span>
                    <ArrowRight className="ml-1 w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedPosts;