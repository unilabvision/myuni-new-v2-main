import { unstable_cache } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  getPublicCacheHeaders,
  PUBLIC_CACHE_SECONDS,
  PUBLIC_CACHE_TAGS,
} from '@/lib/publicCache';
import { createServerSupabasePublicClient } from '@/lib/supabase-server';

const getCachedTestimonials = unstable_cache(
  async () => {
    const supabase = createServerSupabasePublicClient();
    const { data, error } = await supabase
      .from('myuni_comments')
      .select('id, user_display_name, content, rating, created_at, myuni_courses(title)')
      .eq('status', 'approved')
      .gte('rating', 4)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },
  ['public-testimonials-v1'],
  {
    revalidate: PUBLIC_CACHE_SECONDS,
    tags: [PUBLIC_CACHE_TAGS.courseRatings],
  }
);

export async function GET() {
  try {
    const testimonials = await getCachedTestimonials();
    return NextResponse.json(
      { success: true, data: testimonials },
      { headers: getPublicCacheHeaders() }
    );
  } catch (error) {
    console.error('[public/testimonials] Request failed:', error);
    return NextResponse.json(
      { success: false, error: 'Testimonials could not be loaded' },
      { status: 500 }
    );
  }
}
