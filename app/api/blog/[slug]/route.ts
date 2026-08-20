import { NextRequest, NextResponse } from 'next/server';
import {
  getUnilabBlogPostBySlug,
  getUnilabRelatedBlogPosts,
  getCurrentSite,
  type SiteType
} from '@/app/services/unilabBlogService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'tr';
    const includeRelated = searchParams.get('related') === 'true';
    const site = (searchParams.get('site') as SiteType) || getCurrentSite();

    if (!slug) {
      return NextResponse.json(
        { error: 'Blog slug is required' },
        { status: 400 }
      );
    }

    console.log('API: Fetching blog post by slug:', slug, 'locale:', locale, 'site:', site);

    const post = await getUnilabBlogPostBySlug(slug, locale, site);

    if (!post) {
      return NextResponse.json(
        { error: 'Blog post not found' },
        { status: 404 }
      );
    }

    let relatedPosts = [];
    if (includeRelated) {
      relatedPosts = await getUnilabRelatedBlogPosts(post, locale, 3, site);
    }

    return NextResponse.json(
      {
        success: true,
        data: post,
        related: relatedPosts
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );

  } catch (error) {
    console.error('Error in blog post API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch blog post'
      },
      { status: 500 }
    );
  }
}
