// src/pages/api/auth/github/callback.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { 
  exchangeCodeForToken, 
  getGitHubUserProfile, 
  createOrUpdateUserSession, 
  createSessionCookie 
} from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const encodedState = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing authorization code from GitHub.', { status: 400 });
  }

  let redirectTo = '/developers/dashboard';
  if (encodedState) {
    try {
      const parsedState = JSON.parse(atob(encodedState));
      if (parsedState.redirect && parsedState.redirect.startsWith('/')) {
        redirectTo = parsedState.redirect;
      }
    } catch {
      // Fallback to default redirect
    }
  }

  // Get Cloudflare runtime env & D1 database binding via cloudflare:workers
  const cf = env as any;
  const clientId = cf?.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
  const clientSecret = cf?.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
  const superAdmin = cf?.SUPER_ADMIN_GITHUB_USERNAME || process.env.SUPER_ADMIN_GITHUB_USERNAME || 'ishara-madu';

  if (!clientId || !clientSecret) {
    return new Response('GitHub OAuth credentials not configured on server.', { status: 500 });
  }

  const db = getDb();
  if (!db) {
    return new Response('Database connection unavailable.', { status: 500 });
  }

  // 1. Exchange code for access token
  const callbackUrl = `${url.origin}/api/auth/github/callback`;
  const accessToken = await exchangeCodeForToken(code, clientId, clientSecret, callbackUrl);

  if (!accessToken) {
    return new Response('Failed to obtain access token from GitHub.', { status: 401 });
  }

  // 2. Fetch user profile from GitHub API
  const profile = await getGitHubUserProfile(accessToken);
  if (!profile) {
    return new Response('Failed to retrieve GitHub user profile.', { status: 502 });
  }

  // 3. Upsert user in Cloudflare D1 & create session
  const { user, sessionId } = await createOrUpdateUserSession(db, profile, superAdmin);

  // If user is admin and was heading to developer dashboard by default, send to admin hub
  if ((user.role === 'super_admin' || user.role === 'moderator' || user.role === 'security_auditor') && redirectTo === '/developers/dashboard') {
    redirectTo = '/admin';
  }

  // 4. Set session cookie and redirect
  const cookieValue = createSessionCookie(sessionId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': cookieValue,
    },
  });
};
