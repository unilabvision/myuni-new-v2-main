// app/services/unilabBlogService.ts - Updated for MyUNI with site support
import { supabase } from '@/lib/supabase';

// Site type definition
export type SiteType = 'unilab_vision' | 'myuni_platform';

// MyUNI Eğitim Platformu blog types - simplified without author, reading time, comments
export interface MyUniBlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  tags: string[];
  featured: boolean;
  site: SiteType;
  alternateSlug?: string;
}

export interface MyUniBlogContent {
  title: string;
  description: string;
  categories: string[];
  posts: MyUniBlogPost[];
  featured: MyUniBlogPost[];
  site: SiteType;
}

// Keep legacy exports for compatibility
export type UnilabBlogPost = MyUniBlogPost;
export type UnilabBlogContent = MyUniBlogContent;

// Helper function to get current site context
export function getCurrentSite(): SiteType {
  // Check if we're in browser environment
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Domain-based detection
    if (hostname.includes('myuni') || hostname.includes('localhost')) {
      return 'myuni_platform';
    } else if (hostname.includes('unilab-vision')) {
      return 'unilab_vision';
    }
  }
  
  // Fallback to environment variable
  const site = process.env.NEXT_PUBLIC_SITE_TYPE as SiteType;
  return site || 'myuni_platform'; // Default to MyUNI for your current need
}

// Storage URL helper function
const getFullStorageUrl = (path: string | null): string => {
  if (!path) return '/blog/default-image.webp';
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  if (path.startsWith('/blog/') || path.startsWith('/myuni/')) {
    return path;
  }
  
  const normalizedPath = path.startsWith('/') ? path : '/' + path;
  const baseUrl = "https://ghuellgktqqzpryuyiky.supabase.co/storage/v1/object/public/unilab-vision-uploads";
  
  return baseUrl + normalizedPath;
};

/**
 * Get alternate language version slug for a blog post
 */
export async function getUnilabBlogPostAlternateSlug(
  postId: string, 
  targetLocale: string, 
  site: SiteType = getCurrentSite()
): Promise<string | null> {
  try {
    // First, get the current post to find its alternate_post_id
    const { data: currentPost, error: currentError } = await supabase
      .from('unilab_vision_blog_posts')
      .select('post_id, locale, slug, alternate_post_id')
      .eq('id', postId)
      .eq('site', site)
      .single();
    
    if (currentError || !currentPost) {
      console.warn(`Could not find current post with id ${postId}:`, currentError);
      return null;
    }
    
    // If no alternate_post_id, no alternate version exists
    if (!currentPost.alternate_post_id) {
      return null;
    }
    
    // Find the alternate post using alternate_post_id
    const { data: alternatePost, error: alternateError } = await supabase
      .from('unilab_vision_blog_posts')
      .select('slug, locale, id, post_id')
      .eq('post_id', currentPost.alternate_post_id)
      .eq('locale', targetLocale)
      .eq('site', site)
      .single();
    
    if (alternateError || !alternatePost) {
      console.warn(`No alternate version found for alternate_post_id ${currentPost.alternate_post_id} in locale ${targetLocale}:`, alternateError);
      return null;
    }
    
    return alternatePost.slug;
  } catch (error) {
    console.error('Error fetching alternate slug:', error);
    return null;
  }
}

/**
 * Fetch all blog categories for a specific locale and site
 */
export async function getUnilabBlogCategories(
  locale: string, 
  site: SiteType = getCurrentSite()
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('unilab_vision_blog_categories')
      .select('name')
      .eq('locale', locale)
      .eq('site', site)
      .order('name');
    
    if (error) throw error;
    
    return data.map(category => category.name);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    
    // Return default categories based on site
    if (site === 'myuni_platform') {
      return locale === 'tr' 
        ? ["Platform Tanıtımı", "Öğrenme İpuçları", "Teknoloji", "Eğitim Trendleri"]
        : ["Platform Introduction", "Learning Tips", "Technology", "Education Trends"];
    } else {
      return locale === 'tr' 
        ? ["Yapay Zeka", "Makine Öğrenmesi", "Bilgisayarlı Görü", "Veri Bilimi", "Araştırma", "İnovasyon"]
        : ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Data Science", "Research", "Innovation"];
    }
  }
}

/**
 * Fetch all blog posts for a specific locale and site
 */
export async function getUnilabBlogPosts(
  locale: string, 
  site: SiteType = getCurrentSite()
): Promise<MyUniBlogPost[]> {
  try {
    // Get all blog posts for the locale and site
    const { data: posts, error: postsError } = await supabase
      .from('unilab_vision_blog_posts')
      .select(`
        id,
        post_id,
        title,
        slug,
        category,
        excerpt,
        content,
        date,
        image,
        featured,
        site
      `)
      .eq('locale', locale)
      .eq('site', site)
      .order('date', { ascending: false });
    
    if (postsError) throw postsError;
    
    if (!posts || !posts.length) {
      return [];
    }
    
    // Get all tags for all posts in this locale and site
    const postIds = posts.map(post => post.post_id);
    const { data: tags, error: tagsError } = await supabase
      .from('unilab_vision_blog_post_tags')
      .select('post_id, tag')
      .eq('locale', locale)
      .eq('site', site)
      .in('post_id', postIds);
    
    if (tagsError) {
      console.warn('Error fetching blog tags:', tagsError);
    }
    
    // Create a map of post_id to tags for quick lookup
    const tagMap = new Map();
    if (tags) {
      tags.forEach(tag => {
        if (!tagMap.has(tag.post_id)) {
          tagMap.set(tag.post_id, []);
        }
        tagMap.get(tag.post_id).push(tag.tag);
      });
    }
    
    // Build the complete blog posts
    return posts.map(post => ({
      id: post.id, // Use the table id, not post_id
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      image: getFullStorageUrl(post.image),
      tags: tagMap.get(post.post_id) || [],
      featured: post.featured,
      site: post.site
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Fetch featured blog posts for a specific locale and site
 */
export async function getUnilabFeaturedBlogPosts(
  locale: string, 
  site: SiteType = getCurrentSite()
): Promise<MyUniBlogPost[]> {
  try {
    const allPosts = await getUnilabBlogPosts(locale, site);
    const featured = allPosts.filter(post => post.featured);
    
    // If no featured posts, use the first 2 posts
    if (featured.length === 0 && allPosts.length > 0) {
      return allPosts.slice(0, 2);
    }
    
    return featured;
  } catch (error) {
    console.error('Error fetching featured blog posts:', error);
    return [];
  }
}

/**
 * Fetch a single blog post by slug for a specific locale and site
 */
export async function getUnilabBlogPostBySlug(
  slug: string, 
  locale: string, 
  site: SiteType = getCurrentSite()
): Promise<MyUniBlogPost | null> {
  try {
    if (!slug) {
      console.error('No slug provided to getUnilabBlogPostBySlug');
      return null;
    }

    // Fetch the post by slug, locale, and site
    const { data: post, error } = await supabase
      .from('unilab_vision_blog_posts')
      .select(`
        id,
        post_id,
        title,
        slug,
        category,
        excerpt,
        content,
        date,
        image,
        featured,
        site
      `)
      .eq('locale', locale)
      .eq('site', site)
      .eq('slug', slug)
      .single();

    if (error || !post) {
      console.warn(`Blog post with slug "${slug}" not found for site ${site}:`, error);
      return null;
    }

    // Fetch tags for the post
    const { data: tags, error: tagsError } = await supabase
      .from('unilab_vision_blog_post_tags')
      .select('tag')
      .eq('locale', locale)
      .eq('site', site)
      .eq('post_id', post.post_id);

    if (tagsError) {
      console.warn('Error fetching blog tags:', tagsError);
    }

    // Build the complete blog post
    return {
      id: post.id, // Use the table id, not post_id
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      image: getFullStorageUrl(post.image),
      tags: tags ? tags.map(tag => tag.tag) : [],
      featured: post.featured,
      site: post.site
    };
  } catch (error) {
    console.error(`Error fetching blog post with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Fetch related blog posts for a specific post
 */
export async function getUnilabRelatedBlogPosts(
  post: MyUniBlogPost, 
  locale: string, 
  limit: number = 3, 
  site: SiteType = getCurrentSite()
): Promise<MyUniBlogPost[]> {
  try {
    if (!post) {
      console.warn('No post provided to getUnilabRelatedBlogPosts');
      return [];
    }
    
    // Get posts from the same category first
    const { data: relatedPosts, error } = await supabase
      .from('unilab_vision_blog_posts')
      .select(`
        id,
        post_id,
        title,
        slug,
        category,
        date,
        excerpt,
        content,
        image,
        featured,
        site
      `)
      .eq('locale', locale)
      .eq('site', site)
      .eq('category', post.category)
      .neq('id', post.id) // Use id instead of post_id
      .limit(limit);
      
    if (error || !relatedPosts || relatedPosts.length === 0) {
      // If no posts in same category, get random posts
      const { data: randomPosts, error: randomError } = await supabase
        .from('unilab_vision_blog_posts')
        .select(`
          id,
          post_id,
          title,
          slug,
          category,
          excerpt,
          content,
          date,
          image,
          featured,
          site
        `)
        .eq('locale', locale)
        .eq('site', site)
        .neq('id', post.id) // Use id instead of post_id
        .limit(limit);
        
      if (randomError || !randomPosts || randomPosts.length === 0) {
        return [];
      }
      
      return Promise.all(randomPosts.map(async (relatedPost) => {
        // Get tags for each post
        const { data: tagsData } = await supabase
          .from('unilab_vision_blog_post_tags')
          .select('tag')
          .eq('locale', locale)
          .eq('site', site)
          .eq('post_id', relatedPost.post_id);
          
        const tags = tagsData ? tagsData.map(t => t.tag) : [];
        
        return {
          id: relatedPost.id, // Use the table id
          title: relatedPost.title,
          slug: relatedPost.slug,
          category: relatedPost.category,
          excerpt: relatedPost.excerpt || '',
          content: relatedPost.content || '',
          date: relatedPost.date,
          image: getFullStorageUrl(relatedPost.image),
          tags: tags,
          featured: relatedPost.featured || false,
          site: relatedPost.site
        };
      }));
    }
    
    // Process related posts from same category
    return Promise.all(relatedPosts.map(async (relatedPost) => {
      // Get tags for each post
      const { data: tagsData } = await supabase
        .from('unilab_vision_blog_post_tags')
        .select('tag')
        .eq('locale', locale)
        .eq('site', site)
        .eq('post_id', relatedPost.post_id);
        
      const tags = tagsData ? tagsData.map(t => t.tag) : [];
      
      return {
        id: relatedPost.id, // Use the table id
        title: relatedPost.title,
        slug: relatedPost.slug,
        category: relatedPost.category,
        excerpt: relatedPost.excerpt || '',
        content: relatedPost.content || '',
        date: relatedPost.date,
        image: getFullStorageUrl(relatedPost.image),
        tags: tags,
        featured: relatedPost.featured || false,
        site: relatedPost.site
      };
    }));
  } catch (error) {
    console.error('Error fetching related blog posts:', error);
    return [];
  }
}

/**
 * Get complete blog content for a specific locale and site
 */
export async function getUnilabBlogContent(
  locale: string, 
  site: SiteType = getCurrentSite()
): Promise<MyUniBlogContent> {
  try {
    const [categories, allPosts, featuredPosts] = await Promise.all([
      getUnilabBlogCategories(locale, site),
      getUnilabBlogPosts(locale, site),
      getUnilabFeaturedBlogPosts(locale, site)
    ]);
    
    // Site-specific content with proper typing
    const siteContent: Record<SiteType, Record<string, { title: string; description: string }>> = {
      myuni_platform: {
        tr: {
          title: 'MyUNI Eğitim Platformu Blog',
          description: 'Eğitim teknolojileri ve öğrenme deneyimleri hakkında güncel yazılar.'
        },
        en: {
          title: 'MyUNI Education Platform Blog',
          description: 'Latest articles about educational technologies and learning experiences.'
        }
      },
      unilab_vision: {
        tr: {
          title: 'UNILAB Vision Blog',
          description: 'Teknoloji ve inovasyon dünyasından güncel yazılar.'
        },
        en: {
          title: 'UNILAB Vision Blog',
          description: 'Latest articles from the world of technology and innovation.'
        }
      }
    };

    const content = siteContent[site]?.[locale] || siteContent[site]?.['tr'] || siteContent['myuni_platform']['tr'];
    
    return {
      title: content.title,
      description: content.description,
      categories,
      posts: allPosts,
      featured: featuredPosts,
      site
    };
  } catch (error) {
    console.error('Error fetching blog content:', error);
    
    // Fallback content based on site with proper typing
    const fallbackContent: Record<SiteType, Record<string, { title: string; description: string; categories: string[] }>> = {
      myuni_platform: {
        tr: {
          title: 'MyUNI Eğitim Platformu Blog',
          description: 'Eğitim teknolojileri ve öğrenme deneyimleri hakkında güncel yazılar.',
          categories: ["Platform Tanıtımı", "Öğrenme İpuçları", "Teknoloji", "Eğitim Trendleri"]
        },
        en: {
          title: 'MyUNI Education Platform Blog',
          description: 'Latest articles about educational technologies and learning experiences.',
          categories: ["Platform Introduction", "Learning Tips", "Technology", "Education Trends"]
        }
      },
      unilab_vision: {
        tr: {
          title: 'UNILAB Vision Blog',
          description: 'Teknoloji ve inovasyon dünyasından güncel yazılar.',
          categories: ["Yapay Zeka", "Makine Öğrenmesi", "Bilgisayarlı Görü", "Veri Bilimi", "Araştırma", "İnovasyon"]
        },
        en: {
          title: 'UNILAB Vision Blog',
          description: 'Latest articles from the world of technology and innovation.',
          categories: ["Artificial Intelligence", "Machine Learning", "Computer Vision", "Data Science", "Research", "Innovation"]
        }
      }
    };

    const fallback = fallbackContent[site]?.[locale] || fallbackContent[site]?.['tr'] || fallbackContent['myuni_platform']['tr'];
    
    return {
      title: fallback.title,
      description: fallback.description,
      categories: fallback.categories,
      posts: [],
      featured: [],
      site
    };
  }
}

/**
 * Search blog posts by query, category, or tag for a specific site
 */
export async function searchUnilabBlogPosts(
  locale: string,
  site: SiteType = getCurrentSite(),
  query?: string,
  category?: string,
  tag?: string
): Promise<MyUniBlogPost[]> {
  try {
    let queryBuilder = supabase
      .from('unilab_vision_blog_posts')
      .select(`
        id,
        post_id,
        title,
        slug,
        category,
        excerpt,
        content,
        date,
        image,
        featured,
        site
      `)
      .eq('locale', locale)
      .eq('site', site);

    // Add category filter
    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // Add text search in title, excerpt, and content
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`);
    }

    const { data: posts, error } = await queryBuilder.order('date', { ascending: false });

    if (error) throw error;
    if (!posts) return [];

    // Get tags for all posts
    const postIds = posts.map(post => post.post_id);
    const { data: tags } = await supabase
      .from('unilab_vision_blog_post_tags')
      .select('post_id, tag')
      .eq('locale', locale)
      .eq('site', site)
      .in('post_id', postIds);

    // Create tag map
    const tagMap = new Map();
    if (tags) {
      tags.forEach(tagItem => {
        if (!tagMap.has(tagItem.post_id)) {
          tagMap.set(tagItem.post_id, []);
        }
        tagMap.get(tagItem.post_id).push(tagItem.tag);
      });
    }

    // Build posts with tags
    let result = posts.map(post => ({
      id: post.id, // Use the table id
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      content: post.content,
      date: post.date,
      image: getFullStorageUrl(post.image),
      tags: tagMap.get(post.post_id) || [],
      featured: post.featured,
      site: post.site
    }));

    // Filter by tag if specified
    if (tag) {
      result = result.filter(post => post.tags.includes(tag));
    }

    return result;
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return [];
  }
}