// src/pages/sitemap.xml.ts
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 301,
    headers: {
      Location: '/sitemap-index.xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
};
