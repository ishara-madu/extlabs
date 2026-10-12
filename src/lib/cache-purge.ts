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

    let requestOrigin = '';
    try {
      const url = new URL(request.url);
      requestOrigin = url.origin;
    } catch {}

    const origins = new Set<string>(['https://extlabs.store', 'http://extlabs.store']);
    if (requestOrigin) {
      origins.add(requestOrigin);
    }

    const urlsToPurge: Set<string> = new Set();

    for (const org of origins) {
      // Home page
      urlsToPurge.add(`${org}/`);
      urlsToPurge.add(`${org}`);

      // Categories
      urlsToPurge.add(`${org}/categories`);
      urlsToPurge.add(`${org}/categories/`);

      // Category showcase URL
      if (options.category) {
        urlsToPurge.add(`${org}/category/${options.category}`);
        urlsToPurge.add(`${org}/category/${options.category}/`);
      }

      // Extension detail URLs
      if (options.extensionSlug) {
        urlsToPurge.add(`${org}/extension/${options.extensionSlug}`);
        urlsToPurge.add(`${org}/extension/${options.extensionSlug}/`);
      }
      if (options.extensionId && options.extensionId !== options.extensionSlug) {
        urlsToPurge.add(`${org}/extension/${options.extensionId}`);
        urlsToPurge.add(`${org}/extension/${options.extensionId}/`);
      }

      // Sitemaps
      urlsToPurge.add(`${org}/sitemap-extensions.xml`);
      urlsToPurge.add(`${org}/sitemap-index.xml`);
      urlsToPurge.add(`${org}/sitemap.xml`);
    }

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
    const zoneId = cf?.CLOUDFLARE_ZONE_ID || cf?.CF_ZONE_ID || process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID;
    const apiToken = cf?.CLOUDFLARE_API_TOKEN || cf?.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN;

    if (zoneId && apiToken) {
      const purgeEndpoint = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
      const res = await fetch(purgeEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: fileList }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn('Cloudflare Global Purge API returned error:', errorText);
        return { success: false, purgedUrls: fileList, reason: 'api_error' };
      }
    }

    return { success: true, purgedUrls: fileList };
  } catch (err: any) {
    console.error('Error in purgeExtensionStoreCache:', err);
    return { success: false, purgedUrls: [], reason: err?.message || 'unknown_error' };
  }
}
