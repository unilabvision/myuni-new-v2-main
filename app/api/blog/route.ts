import { NextRequest, NextResponse } from 'next/server';
import {
  getUnilabBlogPosts,
  getUnilabFeaturedBlogPosts,
  getUnilabBlogCategories,
  searchUnilabBlogPosts,
  getCurrentSite,
  type SiteType
} from '@/app/services/unilabBlogService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;
    const query = searchParams.get('query') || undefined;
    const site = (searchParams.get('site') as SiteType) || getCurrentSite();

    console.log('Fetching blog posts via API:', { 
      locale, 
      type, 
      category, 
      tag, 
      query,
      site 
    });

    let posts;
    let categories;

    // Handle different request types
    if (type === 'featured') {
      posts = await getUnilabFeaturedBlogPosts(locale, site);
    } else if (type === 'categories') {
      categories = await getUnilabBlogCategories(locale, site);
      return NextResponse.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } else if (type === 'search' || category || tag || query) {
      posts = await searchUnilabBlogPosts(locale, site, query, category, tag);
    } else {
      posts = await getUnilabBlogPosts(locale, site);
    }

    console.log(`API returned ${posts.length} blog posts`);

    return NextResponse.json(
      {
        success: true,
        data: posts,
        count: posts.length
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

  } catch (error) {
    console.error('Error in blog API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch blog posts',
        data: []
      },
      { status: 500 }
    );
  }
}
