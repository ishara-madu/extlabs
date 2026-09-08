// src/pages/api/telemetry.ts
import type { APIRoute } from 'astro';
import { getDb } from '../../lib/db';
import { recordTelemetryEvent, forceFlushTelemetry, getBufferStats, isValidExtensionId, type TelemetryEventType } from '../../lib/telemetry-buffer';

export const prerender = false;

// Common bot & crawler user-agents to ignore
const BOT_REGEX = /bot|spider|crawler|crawling|googlebot|bingbot|yandex|baidu|slurp|duckduckbot|ahrefs|semrush|petalbot|bytespider/i;

const VALID_EVENT_TYPES: Set<TelemetryEventType> = new Set([
  'download',
  'page_visit',
  'dev_ad_click',
  'extlabs_ad_click'
]);

export const POST: APIRoute = async ({ request }) => {
  // 1. Immediate Bot Filter (Zero overhead)
  const userAgent = request.headers.get('user-agent') || '';
  if (BOT_REGEX.test(userAgent)) {
    return new Response(JSON.stringify({ success: true, buffered: false, reason: 'bot_ignored' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Parse request payload
  let extensionId = '';
  let eventType: TelemetryEventType = 'page_visit';
  let forceFlush = false;

  try {
    const text = await request.text();
    if (text) {
      const parsed = JSON.parse(text);
      extensionId = typeof parsed.extensionId === 'string' ? parsed.extensionId.trim() : '';
      if (parsed.type && VALID_EVENT_TYPES.has(parsed.type)) {
        eventType = parsed.type;
      }
      if (parsed.forceFlush === true) {
        forceFlush = true;
      }
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!isValidExtensionId(extensionId)) {
    return new Response(JSON.stringify({ error: 'Valid alphanumeric extensionId (max 64 chars) is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 3. Database connection (used only when 5-minute flush timer triggers)
  const db = getDb();

  // 4. Force flush check (e.g. for testing)
  if (forceFlush && db) {
    const flushRes = await forceFlushTelemetry(db);
    return new Response(JSON.stringify({ success: true, forceFlushed: true, ...flushRes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 5. Geographic location from Cloudflare edge header
  const countryCode = request.headers.get('cf-ipcountry') || 'GLOBAL';

  // 6. Ingest into in-memory buffer (flushes to D1 once every 5 minutes)
  const result = await recordTelemetryEvent(db, extensionId, eventType, countryCode);

  return new Response(JSON.stringify({ success: true, ...result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

// GET endpoint to view buffer status for monitoring
export const GET: APIRoute = async () => {
  const stats = getBufferStats();
  return new Response(JSON.stringify({ success: true, ...stats }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
