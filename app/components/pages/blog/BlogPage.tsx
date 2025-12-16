// BlogPage.tsx - Main Blog Page Component (Yazı bulunamadı kısmı sola yaslandı)
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import CategoryFilter from './CategoryFilter';
import BlogCard from './BlogCard';
import FeaturedBlogCard from './FeaturedBlogCard';
import SearchBar from './SearchBar';
import { MyUniBlogPost } from '@/app/types/myuniBlog';
import { useRouter } from 'next/navigation';

// Function to format date in the desired format based on locale
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

interface BlogPageProps {
  content: {
    title: string;
    description: string;
    categories: string[];
    posts: MyUniBlogPost[];
    featured: MyUniBlogPost[];
  };
  locale: string;
}

const BlogPage: React.FC<BlogPageProps> = ({ content, locale }) => {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Format dates for all posts
  const postsWithFormattedDates = useMemo(() => {
    return content.posts.map(post => ({
      ...post,
      formattedDate: formatDate(post.date, locale)
    }));
  }, [content.posts, locale]);

  // Format dates for featured posts
  const featuredPostsWithFormattedDates = useMemo(() => {
    return content.featured.map(post => ({
      ...post,
      formattedDate: formatDate(post.date, locale)
    }));
  }, [content.featured, locale]);

  // Initialize category from URL hash when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (hash && content.categories.includes(hash)) {
        setActiveCategory(hash);
      } else {
        setActiveCategory('');
      }
    }
  }, [content.categories]);

  // Update URL hash when category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    const newHash = category === '' ? '' : `#${category}`;
    router.push(`/${locale}/blog${newHash}`, { scroll: false });
  };
  
  // Filter by category and search
  const filteredPosts = useMemo(() => {
    let filtered = [...postsWithFormattedDates];
    
    if (activeCategory && activeCategory !== '') {
      filtered = filtered.filter(post => post.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) || 
        post.excerpt.toLowerCase().includes(query) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    
    return filtered;
  }, [postsWithFormattedDates, activeCategory, searchQuery]);
  
  return (
    <div className="bg-white dark:bg-neutral-900 min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-6">
        {/* Search */}
        <div className="py-12 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-8xl mx-auto">
            <SearchBar onSearch={setSearchQuery} locale={locale} />
          </div>
        </div>

        {/* Featured Posts Section */}
        {featuredPostsWithFormattedDates.length > 0 && !searchQuery && (
          <section className="py-16 border-b border-neutral-200 dark:border-neutral-800">
            <div className="mb-12">
              <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                {locale === 'tr' ? 'Öne Çıkan Yazılar' : 'Featured Posts'}
              </h2>
              <div className="w-16 h-px bg-[#990000] mb-6"></div>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl">
                {locale === 'tr' 
                  ? 'En güncel ve popüler eğitim içeriklerimizi keşfedin.' 
                  : 'Discover our most current and popular educational content.'}
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featuredPostsWithFormattedDates.slice(0, 2).map((post) => (
                <FeaturedBlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          </section>
        )}
        
        {/* All Posts Section */}
        <section className="py-16">
          {/* Category Filter */}
          <div className="mb-8">
            <CategoryFilter
              categories={content.categories}
              activeCategory={activeCategory}
              onChange={handleCategoryChange}
              locale={locale}
            />
          </div>
          
          <div className="mb-12">
            <h2 className="text-3xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
              {activeCategory 
                ? `${activeCategory}`
                : (locale === 'tr' ? 'Tüm Yazılar' : 'All Posts')
              }
            </h2>
            <div className="w-16 h-px bg-[#990000] mb-6"></div>
            {searchQuery ? (
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                <span className="font-medium">&ldquo;{searchQuery}&rdquo;</span> {locale === 'tr' ? 'için arama sonuçları' : 'search results'}
              </p>
            ) : (
              <p className="text-lg text-neutral-600 dark:text-neutral-400">
                {locale === 'tr' ? 'Eğitim ve teknoloji dünyasından güncel yazılar.' : 'Latest articles from the world of education and technology.'}
              </p>
            )}
          </div>
          
          {/* Results Count */}
          <div className="mb-8 text-sm text-neutral-500 dark:text-neutral-400">
            {locale === 'tr' 
              ? `${filteredPosts.length} yazı bulundu`
              : `${filteredPosts.length} posts found`
            }
          </div>
          
          {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} locale={locale} />
              ))}
            </div>
          ) : (
            <div className="py-20">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 flex-shrink-0 text-neutral-300 dark:text-neutral-600">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-3">
                    {locale === 'tr' ? 'Yazı bulunamadı' : 'No posts found'}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
                    {locale === 'tr' 
                      ? 'Arama kriterlerinizi değiştirmeyi veya filtreleri temizlemeyi deneyin.'
                      : 'Try adjusting your search criteria or clearing the filters.'}
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('');
                    }}
                    className="bg-[#990000] hover:bg-[#770000] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    {locale === 'tr' ? 'Filtreleri Temizle' : 'Clear Filters'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BlogPage;