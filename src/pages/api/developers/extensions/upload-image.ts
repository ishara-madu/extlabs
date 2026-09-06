// src/pages/api/developers/extensions/upload-image.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug } from '../../../../lib/db';
import { uploadToCloudinary, isCloudinaryConfigured, getCloudinaryFolder } from '../../../../lib/cloudinary';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
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

  if (!isCloudinaryConfigured()) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          'Cloudinary is not configured on the server. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
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

    let folder = getCloudinaryFolder('screenshots');
    if (type === 'icon') {
      folder = getCloudinaryFolder('icons');
    } else if (type === 'banner') {
      folder = getCloudinaryFolder('banners');
    }

    const tags = ['extlabs', type];
    if (body.extensionSlug) {
      tags.push(body.extensionSlug);
    }

    const uploadResult = await uploadToCloudinary({
      file: image,
      folder,
      tags,
    });

    return new Response(
      JSON.stringify({
        success: true,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error uploading image to Cloudinary:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to upload image to Cloudinary.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
