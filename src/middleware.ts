// src/middleware.ts
import { defineMiddleware } from 'astro:middleware';
import { getSessionUser } from './lib/auth';
import { getDb } from './lib/db';

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
      return context.redirect('/admin/login?auth_required=true', 302);
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

    // If no active session, redirect to developer login
    if (!user) {
      return context.redirect('/developers/login?auth_required=true', 302);
    }

    (context.locals as any).user = user;
  }

  return next();
});
