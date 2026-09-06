// src/pages/api/developers/extensions/save-media.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionMedia } from '../../../../lib/db';
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

    // Clean Screenshots Array
    const cleanedScreenshots = screenshots
      .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
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

    // If Cloudinary is configured, upload any Base64 images to Cloudinary CDN
    if (isCloudinaryConfigured()) {
      const extTag = slug || id || 'unknown';

      // 1. Upload Icon if Base64
      const iconPromise = (async () => {
        if (finalIcon.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: finalIcon,
            folder: getCloudinaryFolder('icons'),
            tags: ['extlabs', 'icon', extTag],
          });
          return res.secure_url;
        }
        return finalIcon;
      })();

      // 2. Upload Promo Banner if Base64
      const promoPromise = (async () => {
        if (finalPromo.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: finalPromo,
            folder: getCloudinaryFolder('banners'),
            tags: ['extlabs', 'banner', extTag],
          });
          return res.secure_url;
        }
        return finalPromo;
      })();

      // 3. Upload Screenshots if Base64
      const screenshotsPromises = cleanedScreenshots.map(async (screenshotUrl, idx) => {
        if (screenshotUrl.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: screenshotUrl,
            folder: getCloudinaryFolder('screenshots'),
            tags: ['extlabs', 'screenshot', extTag, `index-${idx}`],
          });
          return res.secure_url;
        }
        return screenshotUrl;
      });

      // Execute all media uploads concurrently
      const [uploadedIcon, uploadedPromo, uploadedScreenshots] = await Promise.all([
        iconPromise,
        promoPromise,
        Promise.all(screenshotsPromises),
      ]);

      var targetIcon = uploadedIcon;
      var targetPromo = uploadedPromo;
      var targetScreenshots = uploadedScreenshots;
    } else {
      // If Cloudinary is not configured, reject Base64 images to prevent database bloat
      if (
        finalIcon.startsWith('data:image/') ||
        finalPromo.startsWith('data:image/') ||
        cleanedScreenshots.some((s) => s.startsWith('data:image/'))
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              'Cloudinary configuration required. Direct Base64 database storage has been deprecated. Please configure Cloudinary in .dev.vars.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      var targetIcon = finalIcon;
      var targetPromo = finalPromo;
      var targetScreenshots = cleanedScreenshots;
    }

    // Strict validation: Ensure NO Base64 strings ever enter the database columns
    if (
      targetIcon.startsWith('data:image/') ||
      (targetPromo && targetPromo.startsWith('data:image/')) ||
      targetScreenshots.some((s) => s.startsWith('data:image/'))
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Image upload failed. Base64 strings cannot be stored directly in the database.',
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

    const isCloudinaryActive = isCloudinaryConfigured();

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      cloudinary: isCloudinaryActive,
      iconUrl: targetIcon,
      headerImageUrl: targetPromo,
      screenshots: targetScreenshots,
      message: isCloudinaryActive
        ? 'Extension visual media uploaded to Cloudinary and saved successfully.'
        : 'Extension visual media saved to database (Cloudinary not configured).',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error saving extension visual media:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Failed to save visual media.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
