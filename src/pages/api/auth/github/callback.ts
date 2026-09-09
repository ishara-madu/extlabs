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
  const cookieHeader = request.headers.get('Cookie') || '';
  const stateMatch = cookieHeader.match(/(?:^|; )oauth_state_github=([^;]*)/);
  const cookieStateToken = stateMatch ? decodeURIComponent(stateMatch[1]) : null;

  if (encodedState) {
    try {
      let decodedJson = '';
      try {
        decodedJson = decodeURIComponent(escape(atob(encodedState)));
      } catch {
        decodedJson = atob(encodedState);
      }
      const parsedState = JSON.parse(decodedJson);
      // CSRF check: Verify state token from GitHub matches our secure cookie
      if (cookieStateToken && parsedState.token && cookieStateToken !== parsedState.token) {
        return new Response('Invalid OAuth state. Potential CSRF detected.', { status: 403 });
      }
      if (parsedState.redirect && parsedState.redirect.startsWith('/') && !parsedState.redirect.startsWith('//')) {
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
  const { user, sessionId } = await createOrUpdateUserSession(db, profile, superAdmin, accessToken);

  const isAdmin = user.role === 'super_admin' || user.role === 'moderator' || user.role === 'security_auditor';


  // 4. Set session cookie and redirect with client state sync
  const cookieValue = createSessionCookie(sessionId);

  const clientUserJson = JSON.stringify({
    name: user.name || user.username,
    username: user.username,
    role: user.role,
    avatar: user.avatar_url || '',
    email: user.email || '',
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Authenticating ExtLabs Session...</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa; color: #1e293b;">
  <div style="text-align: center;">
    <p style="font-size: 13px; font-weight: 600; letter-spacing: -0.01em;">Authenticating ExtLabs Session...</p>
  </div>
  <script>
    try {
      if (${isAdmin}) {
        localStorage.setItem('extlabs_admin_session', 'true');
        localStorage.setItem('extlabs_admin_user', JSON.stringify(${clientUserJson}));
      } else {
        localStorage.setItem('extlabs_dev_session', 'true');
        localStorage.setItem('extlabs_user', JSON.stringify(${clientUserJson}));
      }
    } catch(e) {}
    window.location.href = "${redirectTo}";
  </script>
</body>
</html>`;

  const response = new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
  response.headers.append('Set-Cookie', cookieValue);
  response.headers.append('Set-Cookie', 'oauth_state_github=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure');
  return response;
};
