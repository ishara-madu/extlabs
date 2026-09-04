// src/pages/api/developers/extensions/save-basic.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionBasic } from '../../../../lib/db';

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
      name,
      slug,
      category,
      version,
      tagline,
      githubUrl,
      downloadUrl,
      supportEmail,
      developerWebsite,
      docsUrl,
      isEdit,
    } = body;

    // Strict Server-Side Validation of Mandatory Fields
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return new Response(JSON.stringify({ success: false, error: 'Extension name is required (min 3 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanSlug = (slug || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!cleanSlug || cleanSlug.length < 2) {
      return new Response(JSON.stringify({ success: false, error: 'Valid directory URL slug is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Primary store category is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!version || typeof version !== 'string' || !version.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Release version is required (e.g. 1.0.0).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!tagline || typeof tagline !== 'string' || tagline.trim().length < 10) {
      return new Response(JSON.stringify({ success: false, error: 'Tagline is required (min 10 characters).' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!githubUrl || typeof githubUrl !== 'string' || !githubUrl.trim().startsWith('http')) {
      return new Response(JSON.stringify({ success: false, error: 'Valid GitHub repository URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!supportEmail || typeof supportEmail !== 'string' || !emailRegex.test(supportEmail.trim())) {
      return new Response(JSON.stringify({ success: false, error: 'Valid support center email address is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let formattedDevWebsite = developerWebsite?.trim() || '';
    if (formattedDevWebsite && !formattedDevWebsite.startsWith('http://') && !formattedDevWebsite.startsWith('https://')) {
      formattedDevWebsite = `https://${formattedDevWebsite}`;
    }
    if (!formattedDevWebsite) {
      formattedDevWebsite = `https://github.com/${user.username}`;
    }

    // Save to Cloudflare D1 via repository pattern
    const result = await saveExtensionBasic(db, {
      id: id || undefined,
      slug: cleanSlug,
      name: name.trim(),
      category: category.trim(),
      version: version.trim(),
      tagline: tagline.trim(),
      githubUrl: githubUrl.trim(),
      downloadUrl: downloadUrl?.trim() || null,
      supportEmail: supportEmail.trim(),
      developerWebsite: formattedDevWebsite,
      docsUrl: docsUrl?.trim() || null,
      developerId: developer.id,
      isEdit: Boolean(isEdit),
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      slug: result.slug,
      isEdit: Boolean(isEdit),
      message: isEdit ? 'Extension basic details updated successfully.' : 'New extension created successfully.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error saving extension basic details:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Failed to save extension.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
