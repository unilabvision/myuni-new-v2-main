import { createHash, timingSafeEqual } from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { PUBLIC_CACHE_TAGS, PublicCacheResource } from '@/lib/publicCache';

type RevalidationBody = {
  resources?: PublicCacheResource[];
};

function hasValidWebhookSecret(request: NextRequest): boolean {
  const received = request.headers.get('x-cache-revalidation-secret');
  if (!received) return false;

  const receivedBuffer = Buffer.from(received);
  const serviceRoleKeys = [
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_IDENTITY_SECRET_KEY,
    process.env.SUPABASE_LEARNING_SECRET_KEY,
    process.env.SUPABASE_FORMS_SECRET_KEY,
  ].filter((key): key is string => Boolean(key));
  const expectedSecrets = [
    process.env.CACHE_REVALIDATION_SECRET,
    ...serviceRoleKeys.map((serviceRoleKey) =>
      createHash('sha256')
        .update(`myuni-cache-revalidation:${serviceRoleKey}`)
        .digest('hex'),
    ),
  ].filter((secret): secret is string => Boolean(secret));

  return expectedSecrets.some((expected) => {
    const expectedBuffer = Buffer.from(expected);
    return (
      expectedBuffer.length === receivedBuffer.length &&
      timingSafeEqual(expectedBuffer, receivedBuffer)
    );
  });
}

function getValidResources(resources: PublicCacheResource[] | undefined) {
  if (!Array.isArray(resources)) return [];
  return [...new Set(resources)].filter((resource) => resource in PUBLIC_CACHE_TAGS);
}

export async function POST(request: NextRequest) {
  const isWebhookAuthorized = hasValidWebhookSecret(request);
  const admin = isWebhookAuthorized ? null : await requireAdmin();
  if (!isWebhookAuthorized && !admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as RevalidationBody;
  const resources = getValidResources(body.resources);
  if (resources.length === 0) {
    return NextResponse.json(
      { error: 'At least one valid cache resource is required.' },
      { status: 400 }
    );
  }

  resources.forEach((resource) => revalidateTag(PUBLIC_CACHE_TAGS[resource]));

  return NextResponse.json({
    success: true,
    revalidated: resources,
  });
}
