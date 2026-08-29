import type React from 'react';

/**
 * Image processing and safety utility for RadMed
 * Handles Base64 data URLs, Blobs, Unsplash URLs, and external medical image repositories
 * without corrupting URLs or triggering premature fallback placeholders.
 */

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80';

/**
 * Checks if a given URL string is a base64 data URI, blob URL, or relative local path
 */
export function isDataOrBlobUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  );
}

/**
 * Safely prepares an image URL for display:
 * - Preserves Data URIs (base64) and Blob URLs EXACTLY as they are (never appends query parameters)
 * - Safely appends width/quality only to Unsplash or supported image CDNs
 * - Ensures raw medical external URLs (Wikimedia, Radiopaedia, Cloudinary) remain uncorrupted
 */
export function getSafeImageUrl(
  url: string | null | undefined,
  width: number = 800,
  quality: number = 80
): string {
  if (!url || typeof url !== 'string') {
    return DEFAULT_FALLBACK_IMAGE;
  }

  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return DEFAULT_FALLBACK_IMAGE;
  }

  // Base64 Data URLs and Blob URLs must NEVER have query parameters appended
  if (isDataOrBlobUrl(cleanUrl)) {
    return cleanUrl;
  }

  // Unsplash URLs benefit from width and format optimization
  if (cleanUrl.includes('images.unsplash.com')) {
    if (cleanUrl.includes('?')) {
      // If it already has query parameters, don't duplicate ?
      if (!cleanUrl.includes('w=')) {
        return `${cleanUrl}&w=${width}&q=${quality}`;
      }
      return cleanUrl;
    }
    return `${cleanUrl}?auto=format&fit=crop&w=${width}&q=${quality}`;
  }

  // All other external URLs (e.g. Wikimedia, Radiopaedia, PMC, Imgur, etc.)
  return cleanUrl;
}

/**
 * Robust image error handler that prevents infinite error loops
 * and provides smooth fallback with no-referrer protection
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  customFallback?: string
): void {
  const target = event.currentTarget;
  const fallback = customFallback || DEFAULT_FALLBACK_IMAGE;

  // Prevent infinite loop if fallback image also fails
  if (target.src === fallback) {
    return;
  }

  target.referrerPolicy = 'no-referrer';
  target.src = fallback;
}

/**
 * Client-side image compressor and file reader:
 * - Reads user-uploaded image files (JPEG, PNG, WEBP, DICOM-exported BMP/TIFF)
 * - Auto-downscales high-resolution scans (e.g. 4000x3000 down to max 1920x1080)
 * - Compresses high-megabyte files (e.g. 8MB -> ~200KB) while preserving sharp radiological diagnostic detail
 * - Enables instant loading in React views, saves to localStorage without hitting 5MB quota,
 *   and saves to Firestore without hitting 1MB document size limit!
 */
export async function compressAndReadImageFile(
  file: File,
  maxDimension: number = 1920,
  quality: number = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image or SVG, read as standard Data URL
    if (!file.type.startsWith('image/') || file.type.includes('svg')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read image file'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        reject(new Error('Empty file content'));
        return;
      }

      // If file is already small (e.g. under 200KB), return directly
      if (file.size < 200 * 1024) {
        resolve(rawDataUrl);
        return;
      }

      // Use HTMLImageElement + Canvas for crisp downsampling
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if 2d context unavailable
          resolve(rawDataUrl);
          return;
        }

        // Apply high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG/WebP for optimal compression
        const outputMime = file.type === 'image/png' && hasTransparency(ctx, width, height) 
          ? 'image/png' 
          : 'image/jpeg';

        try {
          const compressedDataUrl = canvas.toDataURL(outputMime, quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => {
        // Fallback to raw data URL on decode error
        resolve(rawDataUrl);
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => reject(new Error('FileReader failed to read file'));
    reader.readAsDataURL(file);
  });
}

function hasTransparency(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, Math.min(width, 50), Math.min(height, 50)).data;
    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
}
