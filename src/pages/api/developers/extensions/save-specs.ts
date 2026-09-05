// src/pages/api/developers/extensions/save-specs.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionSpecs } from '../../../../lib/db';

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
      monetagUrl,
      frequency,
      faqs,
      manifestVersion,
      license,
      supportedBrowsers,
      privacyPolicyUrl,
      publish,
    } = body;

    if (!id && !slug) {
      return new Response(JSON.stringify({ success: false, error: 'Extension ID or slug is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Monetag Direct Link URL
    const cleanMonetagUrl = (monetagUrl || '').trim();
    if (!cleanMonetagUrl || (!cleanMonetagUrl.startsWith('http://') && !cleanMonetagUrl.startsWith('https://'))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please enter a valid Monetag Direct Link URL (starting with https://).',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Frequency
    const validFreqs = ['24h', 'download', '12h', 'session'];
    const cleanFrequency = validFreqs.includes(frequency) ? frequency : '24h';

    // Validate FAQs (Min 3, Max 6)
    if (!Array.isArray(faqs) || faqs.length < 3) {
      return new Response(JSON.stringify({
        success: false,
        error: 'At least 3 frequently asked questions (FAQs) are required for store discovery.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanFaqs = faqs.slice(0, 6).map((item: any) => ({
      q: (item?.q || '').trim(),
      a: (item?.a || '').trim(),
    }));

    for (let i = 0; i < cleanFaqs.length; i++) {
      const f = cleanFaqs[i];
      if (!f.q || f.q.length < 10 || f.q.length > 100) {
        return new Response(JSON.stringify({
          success: false,
          error: `FAQ #${i + 1} question must be between 10 and 100 characters.`,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!f.a || f.a.length < 20 || f.a.length > 300) {
        return new Response(JSON.stringify({
          success: false,
          error: `FAQ #${i + 1} answer must be between 20 and 300 characters.`,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate Supported Browsers (Min 1)
    if (!Array.isArray(supportedBrowsers) || supportedBrowsers.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Please select at least one supported browser.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Privacy Policy URL (optional, but if provided must be valid)
    const cleanPrivacy = (privacyPolicyUrl || '').trim();
    if (cleanPrivacy && !cleanPrivacy.startsWith('http://') && !cleanPrivacy.startsWith('https://')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Privacy policy URL must be a valid web address starting with http:// or https://.',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save to Cloudflare D1
    const result = await saveExtensionSpecs(db, {
      id,
      slug,
      developerId: developer.id,
      monetagUrl: cleanMonetagUrl,
      frequency: cleanFrequency,
      faqs: cleanFaqs,
      manifestVersion: manifestVersion || 'v3',
      license: license || 'MIT',
      supportedBrowsers,
      privacyPolicyUrl: cleanPrivacy || null,
      publish: Boolean(publish),
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      message: publish 
        ? 'Extension listing submitted to ExtLabs review queue successfully!' 
        : 'Monetization and technical specifications saved successfully.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving extension specs:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error while saving specs.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
