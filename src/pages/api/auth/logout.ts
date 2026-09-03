// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { destroySession, clearSessionCookie } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals);
  if (db) {
    await destroySession(db, request);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};

export const GET: APIRoute = async ({ request, locals }) => {
  const db = getDb(locals);
  if (db) {
    await destroySession(db, request);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
