// app/types/myuniBlog.ts - Updated to match service interface

import { SiteType, UnilabBlogPost, UnilabBlogContent } from '@/app/services/unilabBlogService';

// Re-export the main types from service
export type { SiteType };
export type MyUniBlogPost = UnilabBlogPost;
export type MyUniBlogContent = UnilabBlogContent;

// Search/Filter interfaces
export interface BlogSearchParams {
  query?: string;
  category?: string;
  tag?: string;
  locale: string;
  site: SiteType; // Add site filtering
}

export interface BlogFilterOptions {
  categories: string[];
  tags: string[];
  site: SiteType;
}

// API Response types
export interface BlogAPIResponse {
  success: boolean;
  data?: MyUniBlogPost[] | MyUniBlogPost | MyUniBlogContent;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Blog category types for MyUNI platform
export interface MyUniBlogCategory {
  id: string;
  name: string;
  slug: string;
  locale: string;
  site: SiteType; // Add site field
  description?: string;
  postCount?: number;
}

// Blog tag types for MyUNI platform
export interface MyUniBlogTag {
  id: string;
  name: string;
  slug: string;
  locale: string;
  site: SiteType; // Add site field
  postCount?: number;
}

// Extended blog post with additional metadata
export interface MyUniBlogPostDetailed extends MyUniBlogPost {
  readingTime?: number; // in minutes
  views?: number;
  likes?: number;
  relatedPosts?: MyUniBlogPost[];
  author?: {
    name: string;
    avatar?: string;
    bio?: string;
  };
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

// Blog statistics for admin/analytics
export interface MyUniBlogStats {
  totalPosts: number;
  totalCategories: number;
  totalTags: number;
  totalViews: number;
  popularPosts: MyUniBlogPost[];
  popularCategories: MyUniBlogCategory[];
  recentPosts: MyUniBlogPost[];
  site: SiteType; // Add site context
}

// Blog content management types
export interface MyUniBlogContentManager {
  posts: MyUniBlogPost[];
  categories: MyUniBlogCategory[];
  tags: MyUniBlogTag[];
  stats: MyUniBlogStats;
  site: SiteType; // Add site context
}

// Form types for blog management
export interface MyUniBlogPostForm {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  image?: string;
  tags: string[];
  featured: boolean;
  locale: string;
  site: SiteType; // Add site field
  status: 'draft' | 'published' | 'archived';
  publishDate?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
}

// Site configuration for different platforms
export interface SiteConfig {
  site: SiteType;
  name: string;
  description: string;
  logo: string;
  colors: {
    primary: string;
    secondary: string;
  };
  domains: string[];
  locales: string[];
}

// Predefined site configurations
export const SITE_CONFIGS: Record<SiteType, SiteConfig> = {
  unilab_vision: {
    site: 'unilab_vision',
    name: 'UNILAB Vision',
    description: 'UNILAB Vision blog and updates',
    logo: '/unilab/logo.svg',
    colors: {
      primary: '#990000',
      secondary: '#770000'
    },
    domains: ['unilab-vision.com', 'www.unilab-vision.com'],
    locales: ['tr', 'en']
  },
  myuni_platform: {
    site: 'myuni_platform',
    name: 'MyUNI Eğitim Platformu',
    description: 'MyUNI Education Platform blog and updates',
    logo: '/myuni/logo.svg',
    colors: {
      primary: '#990000',
      secondary: '#770000'
    },
    domains: ['myuni.edu.tr', 'www.myuni.edu.tr'],
    locales: ['tr', 'en']
  }
};

// Utility function to get site from domain or context
export function getSiteFromDomain(domain: string): SiteType {
  if (domain.includes('myuni')) {
    return 'myuni_platform';
  }
  return 'unilab_vision'; // default
}

// Utility function to get site config
export function getSiteConfig(site: SiteType): SiteConfig {
  return SITE_CONFIGS[site];
}