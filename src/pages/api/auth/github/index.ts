// src/pages/api/auth/github/index.ts
import type { APIRoute } from 'astro';
import { getGitHubAuthUrl } from '../../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirect') || '/developers/dashboard';

  // Retrieve environment variables from Cloudflare runtime or process.env
  const env = (locals as any)?.runtime?.env || process.env;
  const clientId = env.GITHUB_CLIENT_ID;

  if (!clientId || clientId === 'your_github_client_id_here') {
    return new Response(
      JSON.stringify({
        error: 'Missing GITHUB_CLIENT_ID environment variable.',
        setupGuide: 'Please provide GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .dev.vars or Cloudflare dashboard.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Generate random state token and encode redirect path
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  const stateToken = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const state = JSON.stringify({ token: stateToken, redirect: redirectTo });
  const encodedState = btoa(state);

  const callbackUrl = `${url.origin}/api/auth/github/callback`;
  const githubUrl = getGitHubAuthUrl(clientId, encodedState, callbackUrl);

  return Response.redirect(githubUrl, 302);
};
