import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import {
  createImageVariants,
  optimizeImage,
  RESPONSIVE_IMAGE_WIDTHS,
  validateImageUpload,
} from '@/lib/media/imageOptimization';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const MEDIA_BUCKET = process.env.MEDIA_STORAGE_BUCKET || 'myunilab';

class StorageUploadError extends Error {}

function sanitizeFolder(value: FormDataEntryValue | null): string {
  const folder = typeof value === 'string' ? value : 'uploads';
  return folder
    .split('/')
    .map((part) => part.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))
    .filter(Boolean)
    .slice(0, 4)
    .join('/') || 'uploads';
}

function isDuplicateError(message: string): boolean {
  return /already exists|duplicate/i.test(message);
}

async function uploadImage(path: string, data: Buffer): Promise<boolean> {
  const { error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).upload(path, data, {
    cacheControl: '31536000',
    contentType: 'image/webp',
    upsert: false,
  });
  if (!error) return false;
  if (isDuplicateError(error.message)) return true;
  throw new StorageUploadError(error.message);
}

async function hasAllImageVariants(objectDirectory: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.storage.from(MEDIA_BUCKET).list(objectDirectory, {
    limit: RESPONSIVE_IMAGE_WIDTHS.length + 1,
  });

  if (error) {
    console.warn('[admin/media] Existing variants could not be checked:', error.message);
    return false;
  }

  const storedNames = new Set((data || []).map((item) => item.name));
  return (
    storedNames.has('original.webp') &&
    RESPONSIVE_IMAGE_WIDTHS.every((width) => storedNames.has(`w-${width}.webp`))
  );
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }

    const validationError = validateImageUpload(file);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const optimized = await optimizeImage(file);
    const checksum = createHash('sha256').update(optimized.data).digest('hex');
    const folder = sanitizeFolder(formData.get('folder'));
    const objectDirectory = `${folder}/${checksum}`;
    const objectPath = `${objectDirectory}/original.webp`;
    const storage = supabaseAdmin.storage.from(MEDIA_BUCKET);
    const alreadyStored = await hasAllImageVariants(objectDirectory);

    let deduplicated = alreadyStored;
    if (!alreadyStored) {
      const variants = await createImageVariants(optimized.data);
      const uploadResults = await Promise.all([
        uploadImage(objectPath, optimized.data),
        ...variants.map((variant) =>
          uploadImage(`${objectDirectory}/w-${variant.width}.webp`, variant.data)
        ),
      ]);
      deduplicated = uploadResults.every(Boolean);
    }

    const { data } = storage.getPublicUrl(objectPath);
    return NextResponse.json({
      success: true,
      deduplicated,
      bucket: MEDIA_BUCKET,
      path: objectPath,
      url: data.publicUrl,
      format: 'webp',
      width: optimized.width,
      height: optimized.height,
      originalBytes: optimized.originalBytes,
      optimizedBytes: optimized.data.length,
      savedBytes: Math.max(0, optimized.originalBytes - optimized.data.length),
      checksum,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[admin/media] Image optimization failed:', message);
    const isStorageFailure = error instanceof StorageUploadError;
    return NextResponse.json(
      { error: isStorageFailure ? 'Image could not be stored.' : 'Image could not be processed.' },
      { status: isStorageFailure ? 502 : 400 }
    );
  }
}
