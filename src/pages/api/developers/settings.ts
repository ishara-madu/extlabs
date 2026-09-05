// src/pages/api/developers/settings.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

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
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      website?: string;
      bio?: string;
      defaultMonetagUrl?: string;
      defaultFrequency?: string;
    };

    let website = body.website?.trim() || '';
    if (website && !website.startsWith('http://') && !website.startsWith('https://')) {
      website = `https://${website}`;
    }
    if (!website) {
      website = `https://github.com/${user.username}`;
    }

    // Update developers table
    await db
      .prepare(`
        UPDATE developers 
        SET 
          website = ?, 
          display_name = COALESCE(?, display_name),
          default_monetag_url = COALESCE(?, default_monetag_url),
          default_frequency = COALESCE(?, default_frequency)
        WHERE user_id = ? OR slug = ?
      `)
      .bind(
        website,
        body.name?.trim() || null,
        body.defaultMonetagUrl?.trim() || null,
        body.defaultFrequency?.trim() || null,
        user.id,
        user.username
      )
      .run();

    // Update users table if email/name provided
    if (body.email?.trim() || body.name?.trim()) {
      await db
        .prepare(`
          UPDATE users 
          SET email = COALESCE(?, email), name = COALESCE(?, name), updated_at = DATETIME('now')
          WHERE id = ?
        `)
        .bind(body.email?.trim() || null, body.name?.trim() || null, user.id)
        .run();
    }

    return new Response(JSON.stringify({ success: true, website }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
