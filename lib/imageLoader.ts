/** Selects an immutable pre-generated image variant from Supabase Storage. */
export default function imageLoader({
  src,
  width,
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
    const responsiveWidths = [320, 640, 960, 1280, 1920, 2560];
    const selectedWidth = responsiveWidths.find((candidate) => candidate >= width) || 2560;
    const managedMediaPattern = /\/([a-f0-9]{64})\/original\.webp(?:\?.*)?$/;
    const variantSrc = managedMediaPattern.test(src)
      ? src.replace(managedMediaPattern, `/$1/w-${selectedWidth}.webp`)
      : src;

    // Serve public Learning Storage assets through a cached external-origin
    // rewrite. This uses Vercel's CDN without invoking a Vercel Function, so
    // cache misses reach Supabase but do not add Function Origin Transfer.
    try {
      const url = new URL(variantSrc);
      const learningPublicPrefix = '/storage/v1/object/public/myunilab/';
      if (
        url.hostname === 'fibexawaayvejcqoofqu.supabase.co' &&
        url.pathname.startsWith(learningPublicPrefix)
      ) {
        return `/media/learning/${url.pathname.slice(learningPublicPrefix.length)}${url.search}`;
      }
    } catch {
      // Keep the original URL when it cannot be parsed.
    }

    return variantSrc;
  }

  // External (Unsplash, Clerk, etc.) — leave unchanged
  return src;
}
