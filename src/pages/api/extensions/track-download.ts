// src/pages/api/extensions/track-download.ts
import type { APIRoute } from 'astro';
import { getDb, recordExtensionDownload } from '../../../lib/db';

export const prerender = false;

// Common bot & crawler user-agents to ignore without touching database
const BOT_REGEX = /bot|spider|crawler|crawling|googlebot|bingbot|yandex|baidu|slurp|duckduckbot|ahrefs|semrush|petalbot|bytespider/i;

export const POST: APIRoute = async ({ request }) => {
  // 1. Immediate Bot Filter (Zero DB operations)
  const userAgent = request.headers.get('user-agent') || '';
  if (BOT_REGEX.test(userAgent)) {
    return new Response(JSON.stringify({ success: true, tracked: false, reason: 'bot_ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Parse request payload
  let extensionId = '';
  try {
    const text = await request.text();
    if (text) {
      const parsed = JSON.parse(text);
      extensionId = typeof parsed.extensionId === 'string' ? parsed.extensionId.trim() : '';
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!extensionId || extensionId.length < 2 || extensionId.length > 100) {
    return new Response(JSON.stringify({ error: 'Valid extensionId is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Server-Side 24-Hour Cooldown Cookie Check (Zero DB operations on repeat downloads)
  const cookieHeader = request.headers.get('cookie') || '';
  const safeCookieKey = `extlabs_dl_${extensionId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  if (cookieHeader.includes(`${safeCookieKey}=`)) {
    return new Response(JSON.stringify({ success: true, tracked: false, reason: 'cooldown' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 4. Database Connection
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database connection unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5. Geographic location from Cloudflare edge header
  const countryCode = request.headers.get('cf-ipcountry') || 'GLOBAL';

  // 6. Record download using batched atomic D1 execution
  try {
    const result = await recordExtensionDownload(db, extensionId, countryCode);
    if (!result.success) {
      return new Response(JSON.stringify({ error: 'Extension not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Set 24h cooldown cookie to protect DB against future repeat requests
    const resolvedId = (result.extensionId || extensionId).replace(/[^a-zA-Z0-9_-]/g, '');
    const setCookieVal = `extlabs_dl_${resolvedId}=1; Path=/; Max-Age=86400; SameSite=Lax; Secure`;

    return new Response(JSON.stringify({ success: true, tracked: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': setCookieVal
      }
    });
  } catch (err: any) {
    console.error('Failed to record extension download:', err);
    return new Response(JSON.stringify({ error: 'Internal telemetry error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
