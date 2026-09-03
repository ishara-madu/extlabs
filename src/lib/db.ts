import type { D1Database } from '@cloudflare/workers-types';
import { env } from 'cloudflare:workers';

export interface DbUser {
  id: string;
  github_id: string | null;
  username: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  role: 'super_admin' | 'moderator' | 'security_auditor' | 'developer' | 'support';
  status: 'active' | 'suspended' | 'invited';
  two_factor_enabled: number;
  created_at: string;
  updated_at: string;
}

export interface DbDeveloper {
  id: string;
  user_id: string | null;
  slug: string;
  display_name: string;
  avatar_url: string | null;
  website: string | null;
  bio: string | null;
  primary_focus: string | null;
  is_verified: number;
  status: 'active' | 'flagged' | 'suspended';
  member_since: string;
  created_at: string;
}

export interface DbExtension {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  full_description: string | null;
  category: string;
  icon_url: string;
  header_image_url: string | null;
  current_version: string;
  developer_id: string;
  is_active: number;
  is_featured: number;
  is_suspended: number;
  pricing_type: 'free' | 'freemium' | 'paid';
  rating: number;
  review_count: number;
  weekly_active_users: number;
  download_count: number;
  crx_download_url: string | null;
  zip_download_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExtensionVersion {
  id: string;
  extension_id: string;
  version: string;
  changelog: string | null;
  package_zip_url: string;
  package_size_bytes: number;
  manifest_json: string;
  permissions: string | null;
  host_permissions: string | null;
  min_chrome_version: string | null;
  review_status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export interface DbAbuseReport {
  id: string;
  extension_id: string;
  reporter_identifier: string;
  reporter_type: 'community' | 'researcher' | 'automated_watchdog';
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DbPlatformSetting {
  key: string;
  value: string;
  updated_at: string;
}

/**
 * Get Cloudflare D1 Database binding via cloudflare:workers env
 */
export function getDb(_locals?: any): D1Database | null {
  try {
    if ((env as any)?.DB) {
      return (env as any).DB as D1Database;
    }
  } catch {}
  return null;
}

/**
 * Helper to fetch all live extensions from D1
 */
export async function getLiveExtensions(db: D1Database): Promise<DbExtension[]> {
  const { results } = await db
    .prepare('SELECT * FROM extensions WHERE is_active = 1 AND is_suspended = 0 ORDER BY rating DESC')
    .all<DbExtension>();
  return results || [];
}

/**
 * Helper to fetch extension by slug with developer info
 */
export async function getExtensionBySlug(db: D1Database, slug: string) {
  const result = await db
    .prepare(`
      SELECT e.*, d.display_name AS developer_name, d.slug AS developer_slug, d.is_verified AS developer_verified
      FROM extensions e
      JOIN developers d ON e.developer_id = d.id
      WHERE e.slug = ?
    `)
    .bind(slug)
    .first<DbExtension & { developer_name: string; developer_slug: string; developer_verified: number }>();
  return result;
}

/**
 * Helper to fetch platform settings
 */
export async function getPlatformSettings(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db
    .prepare('SELECT key, value FROM platform_settings')
    .all<DbPlatformSetting>();
  
  const settings: Record<string, string> = {};
  for (const row of results || []) {
    settings[row.key] = row.value;
  }
  return settings;
}
