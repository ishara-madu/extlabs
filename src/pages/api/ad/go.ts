// src/pages/api/ad/go.ts
import type { APIRoute } from 'astro';
import { getDb } from '../../../lib/db';
import { recordTelemetryEvent, isValidExtensionId } from '../../../lib/telemetry-buffer';

export const prerender = false;

// Common bot & crawler filter
const BOT_REGEX = /bot|spider|crawler|crawling|googlebot|bingbot|yandex|baidu|slurp|duckduckbot|ahrefs|semrush|petalbot|bytespider/i;

export const GET: APIRoute = async ({ request, url }) => {
  const userAgent = request.headers.get('user-agent') || '';
  const extId = url.searchParams.get('extId')?.trim() || '';
  const isPlatform = url.searchParams.get('p') === '1';

  if (!extId || !isValidExtensionId(extId)) {
    return Response.redirect('https://extlabs.io/', 302);
  }

  const db = getDb();
  let targetUrl = 'https://monetag.com';
  let realExtId = extId;

  if (db) {
    try {
      const ext = await db
        .prepare('SELECT id, monetag_direct_link FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
        .bind(extId, extId)
        .first<{ id: string; monetag_direct_link?: string | null }>();

      if (ext) {
        realExtId = ext.id;
        if (!isPlatform && ext.monetag_direct_link && ext.monetag_direct_link.startsWith('http')) {
          targetUrl = ext.monetag_direct_link;
        }
      }
    } catch {}

    // Record verified ad telemetry if not a bot
    if (!BOT_REGEX.test(userAgent)) {
      const eventType = (isPlatform || targetUrl === 'https://monetag.com') ? 'extlabs_ad_click' : 'dev_ad_click';
      recordTelemetryEvent(db, realExtId, eventType).catch(() => {});
    }
  }

  return Response.redirect(targetUrl, 302);
};
