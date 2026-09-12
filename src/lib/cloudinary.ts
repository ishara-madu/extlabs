// src/lib/cloudinary.ts
import { env } from 'cloudflare:workers';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  baseFolder: string;
}

export interface CloudinaryUploadOptions {
  file: string; // Base64 Data URI or remote image URL
  folder?: string;
  publicId?: string;
  tags?: string[];
  format?: string; // 'avif' | 'webp' | 'png' | 'jpg'
  transformation?: string; // e.g. 'c_limit,w_1280,h_720,q_auto'
}

/**
 * Standard optimization presets for ExtLabs assets to strictly minimize Cloudinary storage & bandwidth.
 * Applying these incoming transformations discards the bulky original files (e.g. 4K/raw PNGs)
 * and permanently stores lightweight AVIF/WebP assets.
 */
export const CLOUDINARY_IMAGE_PRESETS = {
  icon: 'c_limit,w_256,h_256,q_auto',
  screenshot: 'c_limit,w_1280,h_720,q_auto',
  banner: 'c_limit,w_1400,h_560,q_auto',
} as const;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Parses Cloudinary configuration from Cloudflare Worker environment or process.env.
 * Supports both individual variables and standard CLOUDINARY_URL (cloudinary://key:secret@cloud_name).
 */
export function getCloudinaryConfig(): CloudinaryConfig | null {
  try {
    const cf = env as any;
    
    // Read custom base folder (e.g. from .dev.vars)
    const baseFolder = (
      cf?.CLOUDINARY_UPLOAD_FOLDER ||
      cf?.CLOUDINARY_FOLDER ||
      process.env.CLOUDINARY_UPLOAD_FOLDER ||
      process.env.CLOUDINARY_FOLDER ||
      'extlabs'
    ).trim().replace(/^\/+|\/+$/g, '');

    // Check CLOUDINARY_URL first
    const cloudinaryUrl = cf?.CLOUDINARY_URL || process.env.CLOUDINARY_URL;
    if (cloudinaryUrl && typeof cloudinaryUrl === 'string') {
      const match = cloudinaryUrl.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?#]+)/);
      if (match) {
        const [, apiKey, apiSecret, cloudName] = match;
        if (apiKey && apiSecret && cloudName) {
          return {
            cloudName: cloudName.trim(),
            apiKey: apiKey.trim(),
            apiSecret: apiSecret.trim(),
            baseFolder,
          };
        }
      }
    }

    // Check individual variables
    const cloudName = (cf?.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || '').trim();
    const apiKey = (cf?.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY || '').trim();
    const apiSecret = (cf?.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET || '').trim();

    if (cloudName && apiKey && apiSecret) {
      return { cloudName, apiKey, apiSecret, baseFolder };
    }
  } catch (err) {
    console.error('Error reading Cloudinary configuration:', err);
  }

  return null;
}

/**
 * Resolves full folder path based on configured base folder.
 */
export function getCloudinaryFolder(subfolder?: string): string {
  const config = getCloudinaryConfig();
  const base = config?.baseFolder || 'extlabs';
  try {
    const cf = env as any;
    const disableSubfolders = 
      cf?.CLOUDINARY_NO_SUBFOLDERS === 'true' || 
      process.env.CLOUDINARY_NO_SUBFOLDERS === 'true';
    if (disableSubfolders || !subfolder) return base;
  } catch {}
  if (!subfolder) return base;
  return `${base}/${subfolder}`.replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
}

/**
 * Returns true if Cloudinary credentials are fully configured.
 */
export function isCloudinaryConfigured(): boolean {
  return getCloudinaryConfig() !== null;
}

/**
 * Computes SHA-1 hexadecimal hash using native Web Crypto API (100% Cloudflare Workers compatible).
 */
async function computeSha1Hex(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Uploads an image (Base64 data URI or image URL) to Cloudinary using signed authentication.
 */
export async function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const config = getCloudinaryConfig();
  if (!config) {
    throw new Error(
      'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .dev.vars or Cloudflare dashboard.'
    );
  }

  const { file, folder, publicId, tags, format = 'avif', transformation } = options;
  if (!file) {
    throw new Error('No image file or URL provided for Cloudinary upload.');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Cloudinary signed upload: build and sort parameters to sign
  const paramsToSign: Record<string, string> = {
    timestamp,
  };

  if (folder) {
    paramsToSign.folder = folder;
  }
  if (format) {
    paramsToSign.format = format;
  }
  if (publicId) {
    paramsToSign.public_id = publicId;
  }
  if (tags && tags.length > 0) {
    paramsToSign.tags = tags.join(',');
  }
  if (transformation) {
    paramsToSign.transformation = transformation;
  }

  // Sort parameter keys alphabetically
  const sortedKeys = Object.keys(paramsToSign).sort();
  const serializedParams = sortedKeys.map((key) => `${key}=${paramsToSign[key]}`).join('&');
  const stringToSign = `${serializedParams}${config.apiSecret}`;

  const signature = await computeSha1Hex(stringToSign);

  // Prepare FormData payload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);

  if (folder) formData.append('folder', folder);
  if (format) formData.append('format', format);
  if (publicId) formData.append('public_id', publicId);
  if (tags && tags.length > 0) formData.append('tags', tags.join(','));
  if (transformation) formData.append('transformation', transformation);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const data = (await response.json()) as any;

  if (!response.ok || data.error) {
    const errorMsg = data?.error?.message || `Cloudinary upload failed with HTTP status ${response.status}`;
    console.error('Cloudinary API upload error:', data);
    throw new Error(errorMsg);
  }

  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
    bytes: data.bytes,
  };
}

/**
 * Deletes an image from Cloudinary using signed authentication.
 * Essential for freeing up Cloudinary storage when developers update or delete extension media.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  const config = getCloudinaryConfig();
  if (!config) return false;
  if (!publicId || typeof publicId !== 'string') return false;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`;
    const signature = await computeSha1Hex(stringToSign);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/destroy`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as any;
    return data?.result === 'ok';
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
    return false;
  }
}

/**
 * Extracts Cloudinary Public ID from a secure_url or delivery URL.
 * Example: 'https://res.cloudinary.com/demo/image/upload/v1234/extlabs/icons/my-icon.avif'
 * -> 'extlabs/icons/my-icon'
 */
export function extractCloudinaryPublicId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  if (!url.includes('res.cloudinary.com')) return null;

  try {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + '/upload/'.length);

    // Remove any transformation segments (segments that don't start with v[0-9]+ or aren't folders)
    const versionMatch = pathAfterUpload.match(/(?:^|\/)v\d+\/(.+)$/);
    if (versionMatch && versionMatch[1]) {
      pathAfterUpload = versionMatch[1];
    } else {
      const parts = pathAfterUpload.split('/');
      while (parts.length > 1 && (parts[0].includes('_') || parts[0].includes(','))) {
        parts.shift();
      }
      pathAfterUpload = parts.join('/');
    }

    // Strip file extension (.jpg, .png, .avif, .webp)
    const dotIndex = pathAfterUpload.lastIndexOf('.');
    if (dotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
    }

    return pathAfterUpload || null;
  } catch {
    return null;
  }
}

/**
 * Optimizes a Cloudinary image delivery URL with automatic format (AVIF/WebP) and compression.
 * Example: turns https://res.cloudinary.com/demo/image/upload/v1/sample.jpg
 * into https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1/sample.jpg
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  options: {
    format?: 'auto' | 'avif' | 'webp' | 'png' | 'jpg';
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number;
    width?: number;
    height?: number;
    crop?: 'scale' | 'fill' | 'fit' | 'thumb';
  } = {}
): string {
  if (!url || typeof url !== 'string') return '';
  if (!url.includes('res.cloudinary.com')) return url;

  const {
    format = 'auto',
    quality = 'auto',
    width,
    height,
    crop = 'scale',
  } = options;

  const transformations: string[] = [];
  if (format) transformations.push(`f_${format}`);
  if (quality) transformations.push(`q_${quality}`);
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if ((width || height) && crop) transformations.push(`c_${crop}`);

  const transformString = transformations.join(',');
  if (!transformString) return url;

  // Insert transformations immediately after /upload/
  return url.replace('/upload/', `/upload/${transformString}/`);
}


