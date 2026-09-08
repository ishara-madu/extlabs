// src/pages/api/auth/google/index.ts
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getGoogleAuthUrl } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirect') || '/';

  // Retrieve environment variables via cloudflare:workers env or process.env
  const cf = env as any;
  const clientId = cf?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

  if (!clientId || clientId === 'your_google_client_id_here') {
    return new Response(
      JSON.stringify({
        error: 'Missing GOOGLE_CLIENT_ID environment variable.',
        message: 'Google OAuth is not yet configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .dev.vars or Cloudflare dashboard. In the meantime, you can sign in with GitHub!',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate random state token and encode redirect path
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const stateToken = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const state = JSON.stringify({ token: stateToken, redirect: redirectTo });
  const encodedState = btoa(state);

  const callbackUrl = `${url.origin}/api/auth/google/callback`;
  const googleUrl = getGoogleAuthUrl(clientId, encodedState, callbackUrl);

  return new Response(null, {
    status: 302,
    headers: {
      Location: googleUrl,
      'Set-Cookie': `oauth_state_google=${encodeURIComponent(stateToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`,
    },
  });
};
