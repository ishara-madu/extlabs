// src/pages/api/auth/google/callback.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { 
  exchangeGoogleCodeForToken, 
  getGoogleUserProfile, 
  createOrUpdateGoogleUserSession, 
  createUserSessionCookie 
} from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const encodedState = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing authorization code from Google.', { status: 400 });
  }

  let redirectTo = '/';
  if (encodedState) {
    try {
      const parsedState = JSON.parse(atob(encodedState));
      if (parsedState.redirect && (parsedState.redirect.startsWith('/') || parsedState.redirect.startsWith('#'))) {
        redirectTo = parsedState.redirect;
      }
    } catch {
      // Fallback to default redirect
    }
  }

  // Get Cloudflare runtime env & D1 database binding via cloudflare:workers
  const cf = env as any;
  const clientId = cf?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = cf?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('Google OAuth credentials not configured on server.', { status: 500 });
  }

  const db = getDb();
  if (!db) {
    return new Response('Database connection unavailable.', { status: 500 });
  }

  // 1. Exchange code for access token
  const callbackUrl = `${url.origin}/api/auth/google/callback`;
  const accessToken = await exchangeGoogleCodeForToken(code, clientId, clientSecret, callbackUrl);

  if (!accessToken) {
    return new Response('Failed to obtain access token from Google.', { status: 401 });
  }

  // 2. Fetch user profile from Google UserInfo API
  const profile = await getGoogleUserProfile(accessToken);
  if (!profile) {
    return new Response('Failed to retrieve Google user profile.', { status: 502 });
  }

  // 3. Upsert user in Cloudflare D1 & create session
  const { user, sessionId } = await createOrUpdateGoogleUserSession(db, profile);

  // 4. Set reviewer user session cookie and redirect with client state sync
  const cookieValue = createUserSessionCookie(sessionId);

  const clientUserJson = JSON.stringify({
    id: user.id,
    name: user.name || user.username,
    username: user.username,
    avatar: user.avatar_url || '',
    email: user.email || '',
    authProvider: 'google',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Verifying Google Account...</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #1e293b;">
  <div style="text-align: center;">
    <p style="font-size: 13px; font-weight: 600; letter-spacing: -0.01em;">Verifying Google Account...</p>
  </div>
  <script>
    try {
      localStorage.setItem('extlabs_reviewer_user', JSON.stringify(${clientUserJson}));
    } catch(e) {}
    window.location.href = "${redirectTo}";
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Set-Cookie': cookieValue,
    },
  });
};
