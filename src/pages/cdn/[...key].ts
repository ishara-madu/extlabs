// src/pages/cdn/[...key].ts
import type { APIRoute } from 'astro';
import { getR2Bucket } from '../../lib/r2';

export const prerender = false;

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    svg: 'image/svg+xml',
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    avif: 'image/avif',
    gif: 'image/gif',
    ico: 'image/x-icon',
    zip: 'application/zip',
    crx: 'application/x-chrome-extension',
    json: 'application/json',
  };
  return (ext && map[ext]) || 'image/webp';
}

export const GET: APIRoute = async ({ params, request }) => {
  const rawKey = params.key;
  if (!rawKey) {
    return new Response('Asset key required', { status: 400 });
  }
  const key = rawKey.replace(/^\/+/, '');

  const bucket = getR2Bucket();
  if (!bucket) {
    return new Response('Storage service unavailable', { status: 503 });
  }

  try {
    const object = await bucket.get(key);
    if (!object) {
      return new Response('Asset not found', {
        status: 404,
        headers: {
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', getMimeType(key));
    }

    // Check If-None-Match for 304 Not Modified
    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error(`Error serving R2 object [${key}]:`, err);
    return new Response('Internal Server Error', { status: 500 });
  }
};

export const HEAD: APIRoute = async ({ params, request }) => {
  const rawKey = params.key;
  if (!rawKey) {
    return new Response(null, { status: 400 });
  }
  const key = rawKey.replace(/^\/+/, '');

  const bucket = getR2Bucket();
  if (!bucket) {
    return new Response(null, { status: 503 });
  }

  try {
    const object = await bucket.head(key);
    if (!object) {
      return new Response(null, { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('ETag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', getMimeType(key));
    }

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && ifNoneMatch === object.httpEtag) {
      return new Response(null, {
        status: 304,
        headers,
      });
    }

    return new Response(null, {
      status: 200,
      headers,
    });
  } catch {
    return new Response(null, { status: 500 });
  }
};
