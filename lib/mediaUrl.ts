/**
 * Rewrite absolute Supabase Storage URLs to the Vercel-cached media proxy.
 * Use for raw <img>, OG fallbacks, or places that do not go through next/image.
 */
export function toProxiedMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  const isSupabaseStorage =
    url.includes('.supabase.co/storage/v1/object/') ||
    url.includes('supabase.co/storage/v1/object/');

  if (!isSupabaseStorage) return url;

  const params = new URLSearchParams({ u: url });
  return `/api/media?${params.toString()}`;
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('.supabase.co/storage/v1/object/') ||
    url.includes('supabase.co/storage/v1/object/')
  );
}
