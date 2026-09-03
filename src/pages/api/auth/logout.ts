// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { destroySession, clearSessionCookie } from '../../../lib/auth';
import { getDb } from '../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
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

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  if (db) {
    await destroySession(db, request);
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Logging Out...</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa;">
  <script>
    try {
      localStorage.removeItem('extlabs_admin_session');
      localStorage.removeItem('extlabs_admin_user');
      localStorage.removeItem('extlabs_dev_session');
      localStorage.removeItem('extlabs_user');
      localStorage.removeItem('extlabs_dev_profile');
    } catch(e) {}
    window.location.href = '/';
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': clearSessionCookie(),
    },
  });
};
