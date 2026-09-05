// src/pages/api/developers/extensions/save-media.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionMedia } from '../../../../lib/db';

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
    const body = await request.json();
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

    // Save visual media to Cloudflare D1 via repository pattern
    const result = await saveExtensionMedia(db, {
      id: id || undefined,
      slug: slug || undefined,
      developerId: developer.id,
      iconUrl: finalIcon,
      headerImageUrl: finalPromo || null,
      screenshots: cleanedScreenshots,
      youtubeVideoUrl: finalYoutube || null,
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      message: 'Extension visual media saved successfully.',
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
