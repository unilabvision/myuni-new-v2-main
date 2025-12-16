'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Calendar, Tag } from "lucide-react";
import { 
  getUnilabBlogPosts, 
  getUnilabBlogCategories, 
  getCurrentSite,
  type MyUniBlogPost
} from '@/app/services/unilabBlogService';

// Move content to a synchronous function since it's now client-side
function getBlogContent(locale: string) {
  return {
    badge: locale === 'tr' ? "📢 Son Blog Yazıları" : "📢 Latest Blog Posts",
    title: locale === 'tr' ? "Eğitim ve Öğrenme Rehberi" : "Education and Learning Guide",
    description: locale === 'tr'
      ? "MyUNI'nin uzman ekibi tarafından hazırlanan, bilim ve teknoloji dünyasından en güncel gelişmeleri keşfedin. Öğrenme yolculuğunuzda size rehberlik edecek kaliteli içerikler."
      : "Discover the latest developments from the world of science and technology, prepared by MyUNI's expert team. Quality content that will guide you on your learning journey.",
    loadMore: locale === 'tr' ? "Daha Fazla Göster" : "Load More",
    showLess: locale === 'tr' ? "Daha Az Göster" : "Show Less",
    exploreAll: locale === 'tr' ? "Tüm Blogları Keşfet" : "Explore All Blogs",
    readMore: locale === 'tr' ? "Devamını Oku" : "Read More",
    stats: locale === 'tr' 
      ? [
          { value: "150+", label: "Blog Yazısı" },
          { value: "25K+", label: "Okuyucu" },
          { value: "5", label: "Kategori" }
        ]
      : [
          { value: "150+", label: "Blog Posts" },
          { value: "25K+", label: "Readers" },
          { value: "5", label: "Categories" }
        ]
  };
}

interface BlogSectionProps {
  locale: string;
}

const BlogSection: React.FC<BlogSectionProps> = ({ locale }) => {
  const [content] = useState(() => getBlogContent(locale));
  const [isLoaded, setIsLoaded] = useState(false);
  const [visiblePosts, setVisiblePosts] = useState<MyUniBlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<MyUniBlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const postsPerPage = 6;
  const blogGridRef = useRef(null);

  // Load blog data on component mount
  useEffect(() => {
    const loadBlogData = async () => {
      try {
        const site = getCurrentSite();
        
        const [blogPosts, blogCategories] = await Promise.all([
          getUnilabBlogPosts(locale, site),
          getUnilabBlogCategories(locale, site)
        ]);
        
        setAllPosts(blogPosts);
        setCategories(blogCategories);
        setVisiblePosts(blogPosts.slice(0, postsPerPage));
        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading blog data:', error);
        setIsLoaded(true);
      }
    };

    loadBlogData();
  }, [locale]);

  // Category filtering effect
  useEffect(() => {
    if (!allPosts || allPosts.length === 0) return;

    let filtered = allPosts;

    // Apply category filter
    if (activeCategory !== "all") {
      filtered = filtered.filter(post => post.category === activeCategory);
    }

    setVisiblePosts(filtered.slice(0, postsPerPage));
  }, [activeCategory, allPosts]);

  // Create category options with "All" option
  const categoryOptions = [
    { 
      id: 1, 
      name: locale === 'tr' ? "Tümü" : "All", 
      value: "all", 
      description: locale === 'tr' ? "Tüm kategoriler" : "All categories" 
    },
    ...categories.map((category, index) => ({
      id: index + 2,
      name: category,
      value: category,
      description: `${category} ${locale === 'tr' ? 'Kategorisi' : 'Category'}`
    }))
  ];

  const handleCategoryClick = (categoryValue: string) => {
    setActiveCategory(categoryValue);
  };

  const handleLoadMore = () => {
    if (!allPosts || allPosts.length === 0) return;
    
    const currentlyShowing = visiblePosts.length;
    
    let filtered = allPosts;
    if (activeCategory !== "all") {
      filtered = filtered.filter(post => post.category === activeCategory);
    }
    
    const nextBatch = filtered.slice(0, currentlyShowing + postsPerPage);
    setVisiblePosts(nextBatch);
  };

  const handleShowLess = () => {
    if (!allPosts || allPosts.length === 0) return;
    
    let filtered = allPosts;
    if (activeCategory !== "all") {
      filtered = filtered.filter(post => post.category === activeCategory);
    }
    
    setVisiblePosts(filtered.slice(0, postsPerPage));
    if (blogGridRef.current) {
      const yOffset = -20;
      const y = (blogGridRef.current as HTMLElement).getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({
        top: y,
        behavior: "smooth",
      });
    }
  };

  // Format date function
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (locale === 'tr') {
      return date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const showLoadMoreButton = (() => {
    if (!allPosts || allPosts.length === 0 || !visiblePosts) return false;
    
    let filtered = allPosts;
    if (activeCategory !== "all") {
      filtered = filtered.filter(post => post.category === activeCategory);
    }
    
    return visiblePosts.length < filtered.length;
  })();

  const showShowLessButton = visiblePosts && visiblePosts.length > postsPerPage;

  if (!isLoaded) {
    return (
      <section className="relative py-16 lg:py-18 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-6"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-neutral-200 dark:bg-neutral-700 rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-16 lg:py-18 overflow-hidden">
      <div className="container mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-left mb-12">
          {/* Badge */}
          <div className="bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm px-4 py-2 mb-6 border border-neutral-300 dark:border-neutral-700 rounded-full shadow-sm inline-block">
            {content.badge}
          </div>

          {/* Title */}
          <h2 className="text-3xl lg:text-4xl xl:text-4xl font-medium text-neutral-900 dark:text-neutral-100 leading-tight mb-6">
            {content.title}
          </h2>

          <div className="w-16 h-px bg-[#990000] dark:bg-[#990000] mb-6"></div>

          {/* Description */}
          <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 max-w-3xl">
            {content.description}
          </p>

          {/* Statistics */}
          <div className="flex space-x-8 mb-8 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
            {content.stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-start transition-all duration-300 hover:font-bold">
                <span className="text-2xl md:text-3xl font-semibold text-neutral-900 dark:text-neutral-100">{stat.value}</span>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categoryOptions.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.value)}
              className={`inline-flex items-center px-4 py-2 text-sm rounded-md transition-all duration-300 focus:outline-none ${
                activeCategory === category.value
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
              }`}
            >
              <Tag className="w-3 h-3 mr-2" />
              {category.name}
            </button>
          ))}
        </div>

        {/* Blog Grid */}
        <div ref={blogGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {visiblePosts && visiblePosts.length > 0 ? visiblePosts.map((post) => {
            const summary = post.excerpt.length > 120 ? post.excerpt.substring(0, 120) + "..." : post.excerpt;
            const formattedDate = formatDate(post.date);

            return (
              <article
                key={post.id}
                className="bg-white dark:bg-neutral-800 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 hover:shadow-lg dark:hover:shadow-neutral-900/20 transition-all duration-300 group">
                <Link
                  href={`/${locale}/blog/${post.slug}`}
                  className="block relative overflow-hidden bg-neutral-100 dark:bg-neutral-700"
                >
                  <div className="relative h-48 w-full">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/blog/default-image.webp";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </Link>
                
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formattedDate}
                    </div>
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md">
                      {post.category}
                    </span>
                  </div>
                  
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="block"
                  >
                    <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 line-clamp-2 hover:text-[#990000] dark:hover:text-[#990000] transition-colors leading-tight">
                      {post.title}
                    </h3>
                  </Link>
                  
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-3 leading-relaxed">
                    {summary}
                  </p>
                  
                  <Link
                    href={`/${locale}/blog/${post.slug}`}
                    className="inline-flex items-center text-sm text-neutral-900 dark:text-neutral-100 hover:text-[#990000] dark:hover:text-[#990000] mt-3 font-medium group"
                  >
                    {content.readMore}
                    <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </article>
            );
          }) : (
            <div className="col-span-full text-center py-12">
              <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                {locale === 'tr' ? 'Henüz blog yazısı bulunmuyor.' : 'No blog posts found yet.'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-start">
          {showLoadMoreButton && (
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white px-6 py-3 text-sm font-medium border-2 border-transparent hover:bg-transparent hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-900 dark:hover:border-neutral-100 transition-all duration-300 focus:outline-none rounded-md"
            >
              {content.loadMore}
            </button>
          )}

          {showShowLessButton && (
            <button
              onClick={handleShowLess}
              className="inline-flex items-center bg-transparent border border-neutral-300 hover:border-neutral-400 dark:border-neutral-700 dark:hover:border-neutral-600 text-neutral-800 dark:text-neutral-300 rounded-md py-3 px-6 text-sm font-medium transition-all duration-300 focus:outline-none"
            >
              {content.showLess}
            </button>
          )}

          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center bg-[#990000] hover:bg-[#7a0000] text-white px-6 py-3 text-sm font-medium border-2 border-transparent hover:bg-transparent hover:text-[#990000] hover:border-[#990000] transition-all duration-300 focus:outline-none rounded-md"
          >
            {content.exploreAll}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;