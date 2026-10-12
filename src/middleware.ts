// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';
import { getDb, getPlatformSetting } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request } = context;
  const pathname = url.pathname;

  // 1. Protect Admin Routes (except /admin/login)
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !pathname.startsWith('/admin/login')
  ) {
    const db = getDb();
    let user = null;
    if (db) {
      try {
        user = await getSessionUser(db, request);
      } catch (err) {
        console.error('Middleware auth check error:', err);
      }
    }

    // If no active session or not an authorized admin role, redirect to admin login
    if (!user || (user.role !== 'super_admin' && user.role !== 'moderator' && user.role !== 'security_auditor')) {
      const returnUrl = url.pathname + url.search;
      return context.redirect(`/admin/login?auth_required=true&redirect=${encodeURIComponent(returnUrl)}`, 302);
    }

    (context.locals as any).user = user;
  }

  // 2. Protect Developer Console Routes (except public /developers and /developers/login)
  if (
    pathname === '/developers/dashboard' ||
    pathname.startsWith('/developers/dashboard') ||
    pathname.startsWith('/developers/manage') ||
    pathname.startsWith('/developers/new') ||
    pathname.startsWith('/developers/settings')
  ) {
    const db = getDb();
    let user = null;
    if (db) {
      try {
        user = await getSessionUser(db, request);
      } catch (err) {
        console.error('Middleware auth check error:', err);
      }
    }

    // If no active session, redirect to developer login preserving target page
    if (!user) {
      const returnUrl = url.pathname + url.search;
      return context.redirect(`/developers/login?auth_required=true&redirect=${encodeURIComponent(returnUrl)}`, 302);
    }

    (context.locals as any).user = user;
  }

  // 3. Storefront Maintenance Mode Enforcement
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api/admin') &&
    !pathname.startsWith('/api/auth') &&
    !pathname.startsWith('/_astro') &&
    !pathname.startsWith('/favicon') &&
    !pathname.startsWith('/site.webmanifest')
  ) {
    const db = getDb();
    if (db) {
      try {
        const isMaintenance = (await getPlatformSetting(db, 'maintenance_mode')) === 'true';
        if (isMaintenance) {
          let user = (context.locals as any)?.user;
          if (!user) {
            user = await getSessionUser(db, request);
          }
          const isStaff = user && ['super_admin', 'moderator', 'security_auditor'].includes(user.role);
          if (!isStaff) {
            const storeName = (await getPlatformSetting(db, 'store_name')) || 'ExtLabs';
            const supportEmail = (await getPlatformSetting(db, 'support_email')) || 'support@extlabs.store';
            return new Response(
              `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Scheduled Platform Maintenance — ${storeName}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fbfbfc; color: #1e293b; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
    .card { max-width: 460px; width: 100%; text-align: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    h1 { font-size: 20px; font-weight: 800; color: #0f172a; margin: 16px 0 8px; letter-spacing: -0.02em; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
    .contact { font-size: 12px; color: #94a3b8; }
    .contact a { color: #2563eb; text-decoration: none; font-weight: 600; }
    .dot { display: inline-block; width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; margin-right: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; background: #fef3c7; border-radius: 12px; color: #d97706; margin-bottom: 8px;">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <h1>Under Scheduled Maintenance</h1>
    <p>${storeName} is temporarily offline for scheduled system upgrades and database maintenance. We will be back online shortly.</p>
    <div class="contact">
      <span class="dot"></span>Engineers Active • Contact: <a href="mailto:${supportEmail}">${supportEmail}</a>
    </div>
  </div>
</body>
</html>`,
              {
                status: 503,
                headers: {
                  'Content-Type': 'text/html; charset=utf-8',
                  'Retry-After': '300',
                  'Cache-Control': 'no-store, no-cache, must-revalidate',
                },
              }
            );
          }
        }
      } catch (mErr) {
        console.error('Maintenance mode check error:', mErr);
      }
    }
  }

  const response = await next();

  // Strictly prevent any caching for authenticated or dynamic developer, admin, and API pages
  if (
    pathname.startsWith('/developers') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api')
  ) {
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Vary', 'Cookie');
  }

  return response;
});
