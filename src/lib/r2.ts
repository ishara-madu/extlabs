// src/lib/r2.ts
import type { R2Bucket } from '@cloudflare/workers-types';
import { env } from 'cloudflare:workers';

/**
 * Retrieves the Cloudflare R2 bucket binding via cloudflare:workers
 */
export function getR2Bucket(): R2Bucket | null {
  try {
    if ((env as any)?.R2) {
      return (env as any).R2 as R2Bucket;
    }
  } catch (err) {
    console.error('Error accessing R2 binding from cloudflare:workers env:', err);
  }
  return null;
}

/**
 * Returns true if R2 bucket binding is active
 */
export function isR2Configured(): boolean {
  return getR2Bucket() !== null;
}

/**
 * Uploads a binary image / asset to Cloudflare R2
 */
export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: Uint8Array | ArrayBuffer | ReadableStream,
  contentType: string = 'image/webp'
) {
  const cleanKey = key.replace(/^\/+/, '');
  const object = await bucket.put(cleanKey, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
  });

  return {
    key: cleanKey,
    publicUrl: getR2PublicUrl(cleanKey),
    size: object.size,
    etag: object.httpEtag,
  };
}

/**
 * Deletes an object from Cloudflare R2
 */
export async function deleteFromR2(bucket: R2Bucket, keyOrUrl: string): Promise<boolean> {
  try {
    const key = extractR2KeyFromUrl(keyOrUrl) || keyOrUrl.replace(/^\/+/, '');
    if (!key) return false;
    await bucket.delete(key);
    return true;
  } catch (err) {
    console.error('Failed to delete object from R2:', err);
    return false;
  }
}

/**
 * Generates the public CDN URL for an R2 key
 */
export function getR2PublicUrl(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  return `/cdn/${cleanKey}`;
}

/**
 * Extracts R2 object key from a full URL or relative path
 * Examples:
 * - "/cdn/extlabs/icons/my-icon.webp" -> "extlabs/icons/my-icon.webp"
 * - "https://extlabs.store/cdn/extlabs/screenshots/shot.webp" -> "extlabs/screenshots/shot.webp"
 */
export function extractR2KeyFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;

  try {
    if (url.startsWith('/cdn/')) {
      return url.slice('/cdn/'.length);
    }
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/cdn/')) {
      return parsed.pathname.slice('/cdn/'.length);
    }
  } catch {
    if (url.includes('/cdn/')) {
      return url.split('/cdn/')[1];
    }
  }

  return null;
}
