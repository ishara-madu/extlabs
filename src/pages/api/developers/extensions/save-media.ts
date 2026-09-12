// src/pages/api/developers/extensions/save-media.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionMedia, getExtensionBySlug, getExtensionById } from '../../../../lib/db';
import { 
  uploadToCloudinary, 
  isCloudinaryConfigured, 
  getCloudinaryFolder, 
  CLOUDINARY_IMAGE_PRESETS,
  deleteFromCloudinary,
  extractCloudinaryPublicId
} from '../../../../lib/cloudinary';

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

    // Strict payload size guards: Max 1MB for icon, max 2MB for banner & screenshots
    if (finalIcon.startsWith('data:image/')) {
      const rawData = finalIcon.split(',')[1] || '';
      const estimatedBytes = Math.round(rawData.length * 0.75);
      if (estimatedBytes > 1.2 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: 'Icon file size exceeds the strict 1 MB limit.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    if (finalPromo.startsWith('data:image/')) {
      const rawData = finalPromo.split(',')[1] || '';
      const estimatedBytes = Math.round(rawData.length * 0.75);
      if (estimatedBytes > 2.2 * 1024 * 1024) {
        return new Response(JSON.stringify({ success: false, error: 'Promotional banner file size exceeds the strict 2 MB limit.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    for (const shot of cleanedScreenshots) {
      if (shot.startsWith('data:image/')) {
        const rawData = shot.split(',')[1] || '';
        const estimatedBytes = Math.round(rawData.length * 0.75);
        if (estimatedBytes > 2.2 * 1024 * 1024) {
          return new Response(JSON.stringify({ success: false, error: 'Screenshot file size exceeds the strict 2 MB limit.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
    }

    // If Cloudinary is configured, upload any Base64 images to Cloudinary CDN
    if (isCloudinaryConfigured()) {
      const extTag = slug || id || 'unknown';

      // Query existing extension to safely clean up replaced images from Cloudinary storage
      let existingExt: any = null;
      try {
        existingExt = (await getExtensionBySlug(db, slug || id || '', { allowDraft: true })) ||
                      (await getExtensionById(db, id || slug || '', { allowDraft: true }));
      } catch (qErr) {
        console.warn('Failed to query existing extension for Cloudinary cleanup:', qErr);
      }

      // 1. Upload Icon if Base64 (Strict 1:1, Min 128x128, Max 1024x1024)
      const iconPromise = (async () => {
        if (finalIcon.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: finalIcon,
            folder: getCloudinaryFolder('icons'),
            tags: ['extlabs', 'icon', extTag],
            transformation: CLOUDINARY_IMAGE_PRESETS.icon,
          });

          // Server-side strict aspect ratio (1:1) and dimension validation
          const ratio = res.width / res.height;
          if (Math.abs(ratio - 1.0) > 0.03) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Extension icon must strictly have a 1:1 square aspect ratio (${res.width}×${res.height} px uploaded). Other aspect ratios are not permitted.`);
          }
          if (res.width < 128 || res.height < 128) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Extension icon resolution is too low (${res.width}×${res.height} px). Minimum required size is 128×128 px to ensure crisp rendering.`);
          }
          if (res.width > 1024 || res.height > 1024) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Extension icon resolution (${res.width}×${res.height} px) exceeds maximum allowed size of 1024×1024 px.`);
          }

          // Delete old icon from Cloudinary if replaced
          if (existingExt?.icon_url && existingExt.icon_url !== res.secure_url) {
            const oldPublicId = extractCloudinaryPublicId(existingExt.icon_url);
            if (oldPublicId) {
              deleteFromCloudinary(oldPublicId).catch((delErr) => {
                console.warn('Failed to delete old icon from Cloudinary:', delErr);
              });
            }
          }

          return res.secure_url;
        }
        return finalIcon;
      })();

      // 2. Upload Promo Banner if Base64 (Strict 16:9, Min 640x360, Max 1920x1080)
      const promoPromise = (async () => {
        if (finalPromo.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: finalPromo,
            folder: getCloudinaryFolder('banners'),
            tags: ['extlabs', 'banner', extTag],
            transformation: CLOUDINARY_IMAGE_PRESETS.banner,
          });

          // Server-side strict aspect ratio (16:9) and dimension validation
          const ratio = res.width / res.height;
          if (Math.abs(ratio - (16 / 9)) > 0.04) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Promotional shelf banner must strictly have a 16:9 aspect ratio (${res.width}×${res.height} px uploaded). Other aspect ratios are not permitted.`);
          }
          if (res.width < 640 || res.height < 360) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Promotional banner resolution is too low (${res.width}×${res.height} px). Minimum required size is 640×360 px.`);
          }
          if (res.width > 1920 || res.height > 1080) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Promotional banner resolution (${res.width}×${res.height} px) exceeds maximum allowed size of 1920×1080 px.`);
          }

          // Delete old promo banner from Cloudinary if replaced
          if (existingExt?.header_image_url && existingExt.header_image_url !== res.secure_url) {
            const oldPublicId = extractCloudinaryPublicId(existingExt.header_image_url);
            if (oldPublicId) {
              deleteFromCloudinary(oldPublicId).catch((delErr) => {
                console.warn('Failed to delete old promo banner from Cloudinary:', delErr);
              });
            }
          }

          return res.secure_url;
        }
        return finalPromo;
      })();

      // 3. Upload Screenshots if Base64 (Strict 16:9, Min 1280x720, Max 1920x1080)
      const screenshotsPromises = cleanedScreenshots.map(async (screenshotUrl, idx) => {
        if (screenshotUrl.startsWith('data:image/')) {
          const res = await uploadToCloudinary({
            file: screenshotUrl,
            folder: getCloudinaryFolder('screenshots'),
            tags: ['extlabs', 'screenshot', extTag, `index-${idx}`],
            transformation: CLOUDINARY_IMAGE_PRESETS.screenshot,
          });

          // Server-side strict aspect ratio (16:9) and dimension validation
          const ratio = res.width / res.height;
          if (Math.abs(ratio - (16 / 9)) > 0.04) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Screenshot #${idx + 1} must strictly have a 16:9 aspect ratio (${res.width}×${res.height} px uploaded). Other aspect ratios are not permitted.`);
          }
          if (res.width < 1280 || res.height < 720) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Screenshot #${idx + 1} resolution is too low (${res.width}×${res.height} px). Minimum required size is 1280×720 px (720p HD).`);
          }
          if (res.width > 1920 || res.height > 1080) {
            await deleteFromCloudinary(res.public_id).catch(() => {});
            throw new Error(`Screenshot #${idx + 1} resolution (${res.width}×${res.height} px) exceeds maximum allowed size of 1920×1080 px.`);
          }

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

      // Check if any old screenshots were dropped / replaced, and purge them from Cloudinary storage
      if (existingExt?.screenshots && Array.isArray(existingExt.screenshots)) {
        for (const oldScr of existingExt.screenshots) {
          if (typeof oldScr === 'string' && !uploadedScreenshots.includes(oldScr)) {
            const oldPublicId = extractCloudinaryPublicId(oldScr);
            if (oldPublicId) {
              deleteFromCloudinary(oldPublicId).catch((delErr) => {
                console.warn('Failed to delete replaced screenshot from Cloudinary:', delErr);
              });
            }
          }
        }
      }

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

    // Note: CDN cache purge is deferred until final publication to protect live store visitors

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
