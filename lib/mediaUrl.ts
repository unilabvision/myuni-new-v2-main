/** Keep storage assets on the object-storage CDN instead of proxying bytes through Vercel. */
export function toProxiedMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('/') && !url.startsWith('//')) return url;

  const isSupabaseStorage =
    url.includes('.supabase.co/storage/v1/object/') ||
    url.includes('supabase.co/storage/v1/object/');

  if (!isSupabaseStorage) return url;

  return url;
}

export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('.supabase.co/storage/v1/object/') ||
    url.includes('supabase.co/storage/v1/object/')
  );
}
