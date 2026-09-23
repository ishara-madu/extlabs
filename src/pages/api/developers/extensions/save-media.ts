// src/pages/api/developers/extensions/save-media.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionMedia, getExtensionBySlug, getExtensionById } from '../../../../lib/db';
import { getR2Bucket, uploadToR2, deleteFromR2 } from '../../../../lib/r2';

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
        error: 'R2 storage bucket is not configured. Please ensure R2 binding is set up in wrangler.jsonc.',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      slug?: string;
      iconUrl?: string;
      headerImageUrl?: string;
      promoTileUrl?: string;
      screenshots?: any[];
      youtubeVideoUrl?: string;
    };
    const {
      id,
      slug,
      iconUrl,
      headerImageUrl,
      promoTileUrl,
      screenshots,
      youtubeVideoUrl,
    } = body;

    if (!id && !slug) {
      return new Response(JSON.stringify({ success: false, error: 'Extension ID or slug is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Extension Logo / Icon
    const finalIcon = (iconUrl || '').trim();
    if (!finalIcon) {
      return new Response(JSON.stringify({ success: false, error: 'Extension logo / icon image is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Promotional Shelf Banner (header_image_url)
    const finalPromo = (headerImageUrl || promoTileUrl || '').trim();
    if (!finalPromo) {
      return new Response(JSON.stringify({ success: false, error: 'Promotional shelf banner is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Store Showcase Screenshots (Min: 2, Max: 10)
    if (!Array.isArray(screenshots) || screenshots.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'At least 2 showcase screenshots are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Clean Screenshots Array (supports string URLs, full Base64, or { full, thumb } objects)
    interface CleanedShot {
      full: string;
      thumb?: string;
    }

    const cleanedScreenshots: CleanedShot[] = (screenshots as any[])
      .map((s) => {
        if (typeof s === 'string' && s.trim().length > 0) {
          return { full: s.trim() };
        }
        if (s && typeof s === 'object' && typeof s.full === 'string' && s.full.trim().length > 0) {
          return {
            full: s.full.trim(),
            thumb: typeof s.thumb === 'string' && s.thumb.trim().length > 0 ? s.thumb.trim() : undefined,
          };
        }
        return null;
      })
      .filter((s): s is CleanedShot => s !== null)
      .slice(0, 10);

    if (cleanedScreenshots.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'At least 2 valid showcase screenshots are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate YouTube Video URL (optional)
    let finalYoutube = (youtubeVideoUrl || '').trim();
    if (finalYoutube && !finalYoutube.includes('youtube.com') && !finalYoutube.includes('youtu.be')) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a valid YouTube video URL or leave blank.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Strict payload size guards: Max 1.5MB for icon, max 2.5MB for banner & screenshots
    if (finalIcon.startsWith('data:image/')) {
      const rawData = finalIcon.split(',')[1] || '';
      const estimatedBytes = Math.round(rawData.length * 0.75);
      if (estimatedBytes > 1.5 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: 'Icon file size exceeds the 1.5 MB limit.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (finalPromo.startsWith('data:image/')) {
      const rawData = finalPromo.split(',')[1] || '';
      const estimatedBytes = Math.round(rawData.length * 0.75);
      if (estimatedBytes > 2.5 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: 'Promotional banner file size exceeds the 2.5 MB limit.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    for (const item of cleanedScreenshots) {
      if (item.full.startsWith('data:image/')) {
        const rawData = item.full.split(',')[1] || '';
        const estimatedBytes = Math.round(rawData.length * 0.75);
        if (estimatedBytes > 2.5 * 1024 * 1024) {
          return new Response(JSON.stringify({ success: false, error: 'Screenshot file size exceeds the 2.5 MB limit.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      // Defensively ensure thumbnail is a micro WebP Base64 (max 5 KB)
      if (item.thumb && item.thumb.length > 5000) {
        item.thumb = undefined;
      }
    }

    const extTag = (slug || id || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');

    // Query existing extension to safely clean up replaced images from R2 storage
    let existingExt: any = null;
    try {
      existingExt = (await getExtensionBySlug(db, slug || id || '', { allowDraft: true })) ||
                    (await getExtensionById(db, id || slug || '', { allowDraft: true }));
    } catch (qErr) {
      console.warn('Failed to query existing extension for R2 cleanup:', qErr);
    }

    const timestamp = Date.now();

    // 1. Upload Icon if Base64
    let targetIcon = finalIcon;
    if (finalIcon.startsWith('data:image/')) {
      const bytes = base64ToUint8Array(finalIcon);
      const isSvg = finalIcon.startsWith('data:image/svg+xml');
      const ext = isSvg ? 'svg' : 'webp';
      const mime = isSvg ? 'image/svg+xml' : 'image/webp';
      const key = `extlabs/${extTag}/icon_${timestamp}.${ext}`;
      const upload = await uploadToR2(bucket, key, bytes, mime);
      targetIcon = upload.publicUrl;

      // Clean up old R2 icon if replaced
      if (existingExt?.icon_url && existingExt.icon_url !== targetIcon && existingExt.icon_url.includes('/cdn/')) {
        deleteFromR2(bucket, existingExt.icon_url).catch((delErr) => {
          console.warn('Failed to delete old icon from R2:', delErr);
        });
      }
    }

    // 2. Upload Promo Banner if Base64
    let targetPromo = finalPromo;
    if (finalPromo.startsWith('data:image/')) {
      const bytes = base64ToUint8Array(finalPromo);
      const key = `extlabs/${extTag}/banner_${timestamp}.webp`;
      const upload = await uploadToR2(bucket, key, bytes, 'image/webp');
      targetPromo = upload.publicUrl;

      // Clean up old R2 banner if replaced
      if (existingExt?.header_image_url && existingExt.header_image_url !== targetPromo && existingExt.header_image_url.includes('/cdn/')) {
        deleteFromR2(bucket, existingExt.header_image_url).catch((delErr) => {
          console.warn('Failed to delete old banner from R2:', delErr);
        });
      }
    }

    // 3. Upload Screenshots if Base64
    const targetScreenshots: { url: string; thumb?: string }[] = [];
    const targetUrlsForCleanup: string[] = [];

    for (let idx = 0; idx < cleanedScreenshots.length; idx++) {
      const shot = cleanedScreenshots[idx];
      let publicUrl = shot.full;

      if (shot.full.startsWith('data:image/')) {
        const bytes = base64ToUint8Array(shot.full);
        const key = `extlabs/${extTag}/screenshot_${idx + 1}_${timestamp}.webp`;
        const upload = await uploadToR2(bucket, key, bytes, 'image/webp');
        publicUrl = upload.publicUrl;
      }

      targetUrlsForCleanup.push(publicUrl);
      targetScreenshots.push({
        url: publicUrl,
        thumb: shot.thumb || undefined,
      });
    }

    // Check if any old screenshots were dropped / replaced, and purge them from R2
    if (existingExt?.screenshots) {
      try {
        const rawOld = Array.isArray(existingExt.screenshots)
          ? existingExt.screenshots
          : JSON.parse(existingExt.screenshots);

        if (Array.isArray(rawOld)) {
          for (const oldItem of rawOld) {
            const oldUrl = typeof oldItem === 'string' ? oldItem : (oldItem?.url || '');
            if (oldUrl && !targetUrlsForCleanup.includes(oldUrl) && oldUrl.includes('/cdn/')) {
              deleteFromR2(bucket, oldUrl).catch((delErr) => {
                console.warn('Failed to delete replaced screenshot from R2:', delErr);
              });
            }
          }
        }
      } catch (parseErr) {
        console.warn('Failed to parse old screenshots for R2 cleanup:', parseErr);
      }
    }

    // Strict validation: Ensure NO raw full Base64 strings enter main URL database columns
    if (
      targetIcon.startsWith('data:image/') ||
      (targetPromo && targetPromo.startsWith('data:image/')) ||
      targetScreenshots.some((s) => s.url.startsWith('data:image/'))
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Image upload failed. Base64 strings cannot be stored as main URLs in the database.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Save visual media to Cloudflare D1 via repository pattern
    const result = await saveExtensionMedia(db, {
      id: id || undefined,
      slug: slug || undefined,
      developerId: developer.id,
      iconUrl: targetIcon,
      headerImageUrl: targetPromo || null,
      screenshots: targetScreenshots,
      youtubeVideoUrl: finalYoutube || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: result.id,
        storage: 'r2',
        iconUrl: targetIcon,
        headerImageUrl: targetPromo,
        screenshots: targetScreenshots,
        message: 'Extension visual media uploaded to R2 Storage CDN and saved successfully.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error saving extension visual media to R2:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Failed to save visual media.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
