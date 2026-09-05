// src/pages/api/auth/me.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ authenticated: false, error: 'Database unavailable' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getSessionUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Query developer profile if exists to get website & default monetization settings
  const developer = await db
    .prepare('SELECT * FROM developers WHERE user_id = ? OR slug = ?')
    .bind(user.id, user.username)
    .first<{ website?: string | null; default_monetag_url?: string | null; default_frequency?: string | null }>();

  let devWebsite = developer?.website?.trim() || '';
  if (!devWebsite || devWebsite === 'https://extlabs.io') {
    devWebsite = `https://github.com/${user.username}`;
  }

  return new Response(
    JSON.stringify({
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatar_url,
        role: user.role,
        twoFactorEnabled: Boolean(user.two_factor_enabled),
        website: devWebsite,
        defaultMonetagUrl: developer?.default_monetag_url || null,
        defaultFrequency: developer?.default_frequency || null,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
