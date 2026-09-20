// src/pages/api/developers/extensions/upload-image.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug } from '../../../../lib/db';
import { getR2Bucket, uploadToR2 } from '../../../../lib/r2';

export const prerender = false;

function base64ToUint8Array(base64Str: string): Uint8Array {
  const base64Data = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getSessionUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please sign in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const developer = await getDeveloperByUserIdOrSlug(db, user.id, user.username);
  if (!developer) {
    return new Response(JSON.stringify({ success: false, error: 'Developer account not found.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const bucket = getR2Bucket();
  if (!bucket) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'R2 storage is not configured on the server.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = (await request.json()) as {
      image?: string;
      type?: 'icon' | 'banner' | 'screenshot';
      extensionSlug?: string;
    };

    const image = body?.image?.trim();
    const type = body?.type || 'screenshot';

    if (!image) {
      return new Response(JSON.stringify({ success: false, error: 'No image data provided.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Payload size guard
    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const estimatedBytes = Math.round(base64Data.length * 0.75);
    const maxBytes = type === 'icon' ? 1.5 * 1024 * 1024 : 2.5 * 1024 * 1024;

    if (estimatedBytes > maxBytes) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `File size exceeds maximum allowed limit for ${type}s.`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const slug = (body.extensionSlug || 'shared').replace(/[^a-zA-Z0-9_-]/g, '_');
    const isSvg = image.startsWith('data:image/svg+xml');
    const ext = isSvg ? 'svg' : 'webp';
    const mime = isSvg ? 'image/svg+xml' : 'image/webp';
    const randomSuffix = Math.random().toString(36).slice(2, 7);
    const key = `extlabs/${slug}/${type}_${Date.now()}_${randomSuffix}.${ext}`;

    const bytes = base64ToUint8Array(image);
    const upload = await uploadToR2(bucket, key, bytes, mime);

    return new Response(
      JSON.stringify({
        success: true,
        url: upload.publicUrl,
        key: upload.key,
        bytes: upload.size,
        format: ext,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error uploading image to R2:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to upload image to R2.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
