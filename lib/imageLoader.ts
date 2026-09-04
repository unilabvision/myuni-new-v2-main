/**
 * Next.js custom image loader.
 * Routes Supabase Storage URLs through /api/media so repeat views are served
 * from Vercel CDN instead of counting against Supabase Cached Egress.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  if (!src) return src;

  // Local / public assets — serve as-is
  if (src.startsWith('/') && !src.startsWith('//')) {
    return src;
  }

  const isSupabaseStorage =
    src.includes('.supabase.co/storage/v1/object/') ||
    src.includes('supabase.co/storage/v1/object/');

  if (isSupabaseStorage) {
    const params = new URLSearchParams({
      u: src,
      w: String(width),
      q: String(quality || 75),
    });
    return `/api/media?${params.toString()}`;
  }

  // External (Unsplash, Clerk, etc.) — leave unchanged
  return src;
}
