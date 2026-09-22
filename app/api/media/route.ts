import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'emfvwpztyuykqtepnsfp.supabase.co',
  'ghuellgktqqzpryuyiky.supabase.co',
]);

const CACHE_CONTROL =
  'public, max-age=2592000, s-maxage=2592000, stale-while-revalidate=86400, immutable';

/**
 * Proxies Supabase Storage assets through Vercel so browsers hit our CDN
 * instead of Supabase Cached Egress on every page view.
 */
export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('u');
  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing u' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  if (!target.pathname.includes('/storage/v1/object/')) {
    return NextResponse.json({ error: 'Not a storage object' }, { status: 403 });
  }

  if (request.nextUrl.searchParams.has('w') || request.nextUrl.searchParams.has('q')) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.search = '';
    canonicalUrl.searchParams.set('u', target.toString());
    return NextResponse.redirect(canonicalUrl, 308);
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Prefer CDN/cache when available; still counts as egress on miss only.
      headers: { Accept: 'image/*,*/*' },
      next: { revalidate: 2592000 },
    });

    if (!upstream.ok) {
      return new NextResponse(null, {
        status: upstream.status,
        headers: { 'Cache-Control': 'public, max-age=60' },
      });
    }

    const headers = new Headers({
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
      'Cache-Control': CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
    });
    const contentLength = upstream.headers.get('content-length');
    const etag = upstream.headers.get('etag');
    if (contentLength) headers.set('Content-Length', contentLength);
    if (etag) headers.set('ETag', etag);

    return new NextResponse(upstream.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[api/media] proxy failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 502 });
  }
}
