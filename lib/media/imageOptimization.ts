import sharp from 'sharp';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_IMAGE_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 2560;
export const RESPONSIVE_IMAGE_WIDTHS = [320, 640, 960, 1280, 1920, 2560] as const;

export interface OptimizedImage {
  data: Buffer;
  width: number;
  height: number;
  originalBytes: number;
}

export interface ImageVariant {
  data: Buffer;
  width: number;
}

export function validateImageUpload(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Only JPEG, PNG, WebP and AVIF images are supported.';
  }
  if (file.size <= 0 || file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return `Image must be smaller than ${MAX_IMAGE_UPLOAD_BYTES / 1024 / 1024} MB.`;
  }
  return null;
}

export async function optimizeImage(file: File): Promise<OptimizedImage> {
  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, { failOn: 'error', limitInputPixels: 40_000_000 });
  const metadata = await pipeline.metadata();

  if (!metadata.width || !metadata.height || (metadata.pages ?? 1) > 1) {
    throw new Error('Invalid or animated image.');
  }

  const { data, info } = await pipeline
    .rotate()
    .resize({
      width: MAX_IMAGE_DIMENSION,
      height: MAX_IMAGE_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });

  return {
    data,
    width: info.width,
    height: info.height,
    originalBytes: file.size,
  };
}

export async function createImageVariants(data: Buffer): Promise<ImageVariant[]> {
  return Promise.all(
    RESPONSIVE_IMAGE_WIDTHS.map(async (width) => ({
      width,
      data: await sharp(data)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 78, effort: 4, smartSubsample: true })
        .toBuffer(),
    }))
  );
}
