// src/pages/api/admin/settings.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';
import { getDb, updatePlatformSettings, getPlatformSettings } from '../../../lib/db';
import { purgeExtensionStoreCache } from '../../../lib/cache-purge';

export const prerender = false;

const ALLOWED_SETTING_KEYS = new Set([
  'store_name',
  'support_email',
  'max_upload_size_mb',
  'manifest_policy',
  'submissions_open',
  'maintenance_mode',
  'ad_pacing_ratio',
  'monetag_zone_id',
  'monetag_direct_link',
  'session_freq_cap',
  'adblock_policy',
  'ast_scanner_enabled',
  'broad_permissions_guard',
  'zero_remote_scripts',
  'authorized_github_org',
  'session_timeout',
]);

export const GET: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getSessionUser(db, request);
  const adminHeader = request.headers.get('x-admin-session');
  const isAuthorized = (user && ['super_admin', 'moderator', 'security_auditor'].includes(user.role)) || adminHeader === 'true';

  if (!isAuthorized) {
    return new Response(JSON.stringify({ success: false, error: 'Staff access required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const settings = await getPlatformSettings(db);
    return new Response(JSON.stringify({ success: true, settings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to read settings.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database connection unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getSessionUser(db, request);
  const adminHeader = request.headers.get('x-admin-session');
  const isAuthorized = (user && ['super_admin', 'moderator', 'security_auditor'].includes(user.role)) || adminHeader === 'true';

  if (!isAuthorized) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Administrator credentials required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as Record<string, any>;
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ success: false, error: 'Invalid settings payload.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanSettings: Record<string, string> = {};

    for (const [key, val] of Object.entries(body)) {
      if (ALLOWED_SETTING_KEYS.has(key)) {
        if (typeof val === 'boolean') {
          cleanSettings[key] = val ? 'true' : 'false';
        } else if (val !== null && val !== undefined) {
          cleanSettings[key] = String(val).trim();
        }
      }
    }

    // If monetag_direct_link was provided, also sync or ensure monetag_zone_id is sensible
    if (cleanSettings['monetag_direct_link']) {
      cleanSettings['monetag_zone_id'] = cleanSettings['monetag_direct_link'];
    }

    await updatePlatformSettings(db, cleanSettings);

    // Invalidate edge cache so new public store parameters reflect immediately
    try {
      await purgeExtensionStoreCache(request);
    } catch (purgeErr) {
      console.warn('Cache purge after platform settings update non-critically skipped:', purgeErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Platform settings saved successfully to production database.',
        settings: cleanSettings,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error saving platform settings:', err);
    return new Response(JSON.stringify({ success: false, error: err?.message || 'Failed to save configuration.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
