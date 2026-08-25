/**
 * Resolve the public origin used for Iyzico callbackUrl / redirects.
 *
 * Production / Vercel: ONLY https://www.myunilab.net (or a non-local
 * NEXT_PUBLIC_BASE_URL). Hardcoded localhost fallbacks are never used.
 *
 * Development: uses NEXT_PUBLIC_BASE_URL from .env.local, or the incoming
 * request Host so payment callbacks stay on the same Next process.
 */

const PRODUCTION_FALLBACK = 'https://www.myunilab.net';
const PRODUCTION_UNIBOARD_FALLBACK = 'https://dashboard.myunilab.net';

function isLocalHostname(host: string): boolean {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
}

function isLocalUrl(value: string): boolean {
  try {
    return isLocalHostname(new URL(value).host);
  } catch {
    return /localhost|127\.0\.0\.1/i.test(value);
  }
}

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.VERCEL_ENV === 'production'
  );
}

function sanitizeEnvBase(raw: string): string {
  return raw.replace(/\/$/, '').trim();
}

function originFromRequest(request: Request): string | null {
  try {
    const url = new URL(request.url);
    const forwardedHost = request.headers.get('x-forwarded-host');
    const host = (forwardedHost || request.headers.get('host') || url.host)
      .split(',')[0]
      .trim();
    if (!host) return null;

    const proto =
      request.headers.get('x-forwarded-proto') ||
      url.protocol.replace(':', '') ||
      'https';

    return `${proto}://${host}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

/**
 * Returns the origin Iyzico (and payment redirects) should use.
 */
export function resolvePublicBaseUrl(request?: Request): string {
  const envBase = sanitizeEnvBase(process.env.NEXT_PUBLIC_BASE_URL || '');

  // ---- Production: never return a local origin ----
  if (isProductionRuntime()) {
    if (envBase && !isLocalUrl(envBase)) {
      return envBase;
    }
    if (envBase && isLocalUrl(envBase)) {
      console.error(
        '[publicBaseUrl] CRITICAL: NEXT_PUBLIC_BASE_URL points at a local host in production — using',
        PRODUCTION_FALLBACK
      );
    } else if (!envBase) {
      console.warn(
        '[publicBaseUrl] NEXT_PUBLIC_BASE_URL missing in production — using',
        PRODUCTION_FALLBACK
      );
    }
    return PRODUCTION_FALLBACK;
  }

  // ---- Development / non-production ----
  // Prefer request origin when it is local (correct port for this process).
  if (request) {
    const fromRequest = originFromRequest(request);
    if (fromRequest && isLocalUrl(fromRequest)) {
      return fromRequest;
    }
  }

  // Then .env.local (may be local or a tunnel URL).
  if (envBase) {
    return envBase;
  }

  // No env and no request host — refuse to invent a local default that could
  // be copied into production configs. Use the public site as last resort.
  console.error(
    '[publicBaseUrl] NEXT_PUBLIC_BASE_URL is unset outside production; set it in .env.local. Using',
    PRODUCTION_FALLBACK
  );
  return PRODUCTION_FALLBACK;
}

/**
 * Uniboard admin origin for server-to-server payment confirm.
 * Never posts to localhost in production (silent confirm failures).
 */
export function resolveUniboardAdminUrl(): string | null {
  const candidates = [
    process.env.UNIBOARD_ADMIN_URL,
    process.env.NEXT_PUBLIC_UNIBOARD_URL,
    process.env.UNIBOARD_URL,
  ];

  for (const raw of candidates) {
    const value = sanitizeEnvBase(raw || '');
    if (!value) continue;
    if (isProductionRuntime() && isLocalUrl(value)) {
      console.error(
        '[publicBaseUrl] CRITICAL: Uniboard admin URL is local in production — using',
        PRODUCTION_UNIBOARD_FALLBACK
      );
      return PRODUCTION_UNIBOARD_FALLBACK;
    }
    return value;
  }

  if (isProductionRuntime()) {
    return PRODUCTION_UNIBOARD_FALLBACK;
  }

  return null;
}
