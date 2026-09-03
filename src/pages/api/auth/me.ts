// src/pages/api/auth/me.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals);
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
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
