import type { APIRoute } from 'astro';
import { getDb, getLiveExtensions } from '../lib/db';

export const prerender = false;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async () => {
  const db = getDb();
  let extensions: any[] = [];
  if (db) {
    try {
      extensions = await getLiveExtensions(db);
    } catch (e) {
      console.error('Failed to fetch extensions for sitemap:', e);
    }
  }

  const urlsXml = extensions
    .map((ext) => {
      const slug = ext.slug || ext.id;
      const lastMod = ext.updated_at
        ? new Date(ext.updated_at).toISOString().split('T')[0]
        : (ext.created_at ? new Date(ext.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

      const imageTags: string[] = [];

      const extName = (ext.name || '').trim();
      const hasExtensionWord = /extension$/i.test(extName);
      const bannerTitle = hasExtensionWord ? `${extName} Banner` : `${extName} Extension Banner`;
      const iconTitle = hasExtensionWord ? `${extName} Icon` : `${extName} Extension Icon`;

      // 1. Promotional 16:9 Banner Image (Primary Google visual preview)
      if (ext.header_image_url) {
        const bannerUrl = ext.header_image_url.startsWith('http')
          ? ext.header_image_url
          : `https://extlabs.store${ext.header_image_url.startsWith('/') ? '' : '/'}${ext.header_image_url}`;
        imageTags.push(`    <image:image>
      <image:loc>${escapeXml(bannerUrl)}</image:loc>
      <image:title>${escapeXml(bannerTitle)}</image:title>${ext.short_description ? `\n      <image:caption>${escapeXml(ext.short_description)}</image:caption>` : ''}
    </image:image>`);
      }

      // 2. Square Extension Icon
      if (ext.icon_url) {
        const iconUrl = ext.icon_url.startsWith('http')
          ? ext.icon_url
          : `https://extlabs.store${ext.icon_url.startsWith('/') ? '' : '/'}${ext.icon_url}`;
        imageTags.push(`    <image:image>
      <image:loc>${escapeXml(iconUrl)}</image:loc>
      <image:title>${escapeXml(iconTitle)}</image:title>
    </image:image>`);
      }

      // 3. High-resolution Screenshots
      if (ext.screenshots) {
        try {
          const screenshotsArr = typeof ext.screenshots === 'string' ? JSON.parse(ext.screenshots) : ext.screenshots;
          if (Array.isArray(screenshotsArr)) {
            screenshotsArr.forEach((item: any, idx: number) => {
              let sUrl = '';
              if (typeof item === 'string' && item.trim().length > 0) {
                sUrl = item.trim();
              } else if (item && typeof item === 'object') {
                sUrl = (typeof item.url === 'string' && item.url) ? item.url : ((typeof item.full === 'string' && item.full) ? item.full : '');
              }

              if (sUrl && !sUrl.startsWith('data:')) {
                const fullUrl = sUrl.startsWith('http')
                  ? sUrl
                  : `https://extlabs.store${sUrl.startsWith('/') ? '' : '/'}${sUrl}`;
                imageTags.push(`    <image:image>
      <image:loc>${escapeXml(fullUrl)}</image:loc>
      <image:title>${escapeXml(`${extName} Screenshot ${idx + 1}`)}</image:title>
    </image:image>`);
              }
            });
          }
        } catch {}
      }

      const imagesBlock = imageTags.length > 0 ? `\n${imageTags.join('\n')}` : '';

      return `  <url>
    <loc>https://extlabs.store/extension/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>${imagesBlock}
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlsXml}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
};
