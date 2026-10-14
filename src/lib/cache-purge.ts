// src/lib/cache-purge.ts
import { env } from 'cloudflare:workers';
import { clearMemoryCache } from './queries/extensions';

export interface PurgeOptions {
  extensionSlug?: string;
  extensionId?: string;
  category?: string;
}


/**
 * Purge Cloudflare Edge CDN cache for an extension and associated store pages.
 * Purges:
 * - /extension/[slug] and /extension/[id]
 * - /category/[category]
 * - / (Home page)
 * - /categories (Categories overview)
 * - Sitemaps
 */
export async function purgeExtensionStoreCache(
  request: Request,
  options: PurgeOptions = {}
): Promise<{ success: boolean; purgedUrls: string[]; reason?: string }> {
  try {
    // 0. Instantly flush Worker L1 In-Memory Cache
    clearMemoryCache();

    // The canonical, production HTTPS origin
    const canonicalOrigin = 'https://extlabs.store';
    const urlsToPurge = new Set<string>();

    // 1. Home page (Cloudflare API requires valid path, so '/' is mandatory; do NOT send 'https://extlabs.store' without slash)
    urlsToPurge.add(`${canonicalOrigin}/`);

    // 2. Categories overview
    urlsToPurge.add(`${canonicalOrigin}/categories`);
    urlsToPurge.add(`${canonicalOrigin}/categories/`);

    // 3. Category showcase URL
    if (options.category && typeof options.category === 'string' && options.category.trim()) {
      const cleanCat = options.category.trim().toLowerCase();
      urlsToPurge.add(`${canonicalOrigin}/category/${cleanCat}`);
      urlsToPurge.add(`${canonicalOrigin}/category/${cleanCat}/`);
    }

    // 4. Extension detail URLs
    if (options.extensionSlug && typeof options.extensionSlug === 'string' && options.extensionSlug.trim()) {
      const cleanSlug = options.extensionSlug.trim();
      urlsToPurge.add(`${canonicalOrigin}/extension/${cleanSlug}`);
      urlsToPurge.add(`${canonicalOrigin}/extension/${cleanSlug}/`);
    }
    if (
      options.extensionId &&
      typeof options.extensionId === 'string' &&
      options.extensionId.trim() &&
      options.extensionId.trim() !== options.extensionSlug?.trim()
    ) {
      const cleanId = options.extensionId.trim();
      urlsToPurge.add(`${canonicalOrigin}/extension/${cleanId}`);
      urlsToPurge.add(`${canonicalOrigin}/extension/${cleanId}/`);
    }

    // 5. Sitemaps
    urlsToPurge.add(`${canonicalOrigin}/sitemap-extensions.xml`);
    urlsToPurge.add(`${canonicalOrigin}/sitemap-index.xml`);
    urlsToPurge.add(`${canonicalOrigin}/sitemap.xml`);

    const fileList = Array.from(urlsToPurge);

    // 1. Try local Cloudflare Worker cache purge (caches.default.delete)
    try {
      const defaultCache = (globalThis as any).caches?.default;
      if (defaultCache && typeof defaultCache.delete === 'function') {
        for (const fileUrl of fileList) {
          await defaultCache.delete(fileUrl);
        }
      }
    } catch (cacheErr) {
      console.warn('Worker local cache purge skipped:', cacheErr);
    }

    // 2. Cloudflare Global Edge Purge API
    const cf = env as any;
    const zoneId = (cf?.CLOUDFLARE_ZONE_ID || cf?.CF_ZONE_ID || process.env?.CLOUDFLARE_ZONE_ID || process.env?.CF_ZONE_ID || '').trim();
    const apiToken = (cf?.CLOUDFLARE_API_TOKEN || cf?.CF_API_TOKEN || process.env?.CLOUDFLARE_API_TOKEN || process.env?.CF_API_TOKEN || '').trim();

    if (!zoneId || !apiToken) {
      const missing: string[] = [];
      if (!zoneId) missing.push('CLOUDFLARE_ZONE_ID');
      if (!apiToken) missing.push('CLOUDFLARE_API_TOKEN');
      const reason = `Missing Cloudflare credentials: ${missing.join(', ')} not found in Worker runtime secrets.`;
      console.warn('Cloudflare Global Edge Purge skipped:', reason);
      return { success: false, purgedUrls: fileList, reason };
    }

    // Cloudflare single-file purge allows up to 30 files per request.
    const chunkSize = 30;
    for (let i = 0; i < fileList.length; i += chunkSize) {
      const chunk = fileList.slice(i, i + chunkSize);
      const purgeEndpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
      const res = await fetch(purgeEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: chunk }),
      });

      const responseText = await res.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {}

      if (!res.ok || (responseJson && responseJson.success === false)) {
        let errorDetail = responseText;
        if (responseJson?.errors && Array.isArray(responseJson.errors) && responseJson.errors.length > 0) {
          errorDetail = responseJson.errors.map((e: any) => `[Code ${e.code}] ${e.message}`).join('; ');
        }
        const reason = `Cloudflare Purge API Error (HTTP ${res.status}): ${errorDetail}`;
        console.error('Cloudflare Global Purge API failed:', reason);
        return { success: false, purgedUrls: fileList, reason };
      }
    }

    console.log(`Cloudflare edge cache successfully purged for ${fileList.length} URLs:`, fileList);
    return { success: true, purgedUrls: fileList };
  } catch (err: any) {
    console.error('Error in purgeExtensionStoreCache:', err);
    return { success: false, purgedUrls: [], reason: err?.message || 'unknown_error' };
  }
}
