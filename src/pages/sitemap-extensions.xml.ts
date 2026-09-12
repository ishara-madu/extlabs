import type { APIRoute } from 'astro';
import { getDb, getLiveExtensions } from '../lib/db';

export const prerender = false;

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

      return `  <url>
    <loc>https://extlabs.io/extension/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXml}
</urlset>`;

  return new Response(sitemapXml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
