// src/lib/cache-purge.ts
import { env } from 'cloudflare:workers';

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
 */
export async function purgeExtensionStoreCache(
  request: Request,
  options: PurgeOptions = {}
): Promise<{ success: boolean; purgedUrls: string[]; reason?: string }> {
  try {
    const url = new URL(request.url);
    const origin = url.origin;
    const urlsToPurge: Set<string> = new Set();

    // 1. Extension detail URLs
    if (options.extensionSlug) {
      urlsToPurge.add(`${origin}/extension/${options.extensionSlug}`);
    }
    if (options.extensionId && options.extensionId !== options.extensionSlug) {
      urlsToPurge.add(`${origin}/extension/${options.extensionId}`);
    }

    // 2. Category showcase URL
    if (options.category) {
      urlsToPurge.add(`${origin}/category/${options.category}`);
    }

    // 3. Home page (to reflect updated featured/recent shelves)
    urlsToPurge.add(`${origin}/`);

    const fileList = Array.from(urlsToPurge);

    // 4. Try local Cloudflare Worker cache purge (caches.default.delete)
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

    // 5. Try Cloudflare Global Edge Purge API if credentials exist
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
