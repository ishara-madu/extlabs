// src/lib/queries/developers.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { DbDeveloper } from '../db';

export interface DeveloperExtensionRow {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon_url: string;
  current_version: string;
  is_active: number;
  is_featured: number;
  is_suspended: number;
  rating: number;
  review_count: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  version_name?: string;
  review_status?: string;
}

/**
 * Fetch developer profile by User ID or developer slug/username
 */
export async function getDeveloperByUserIdOrSlug(
  db: D1Database,
  userId: string,
  slug?: string
): Promise<DbDeveloper | null> {
  const result = await db
    .prepare('SELECT * FROM developers WHERE user_id = ? OR slug = ?')
    .bind(userId, slug || userId)
    .first<DbDeveloper>();
  return result || null;
}

/**
 * Fetch all extensions belonging to a developer with their latest version & review status
 */
export async function getDeveloperExtensions(
  db: D1Database,
  developerId: string
): Promise<DeveloperExtensionRow[]> {
  const { results } = await db
    .prepare(`
      SELECT 
        e.id,
        e.slug,
        e.name,
        e.category,
        e.icon_url,
        e.current_version,
        e.is_active,
        e.is_featured,
        e.is_suspended,
        e.rating,
        e.review_count,
        e.download_count,
        e.created_at,
        e.updated_at,
        ev.version as version_name,
        ev.review_status
      FROM extensions e
      LEFT JOIN (
        SELECT extension_id, version, review_status, MAX(submitted_at)
        FROM extension_versions
        GROUP BY extension_id
      ) ev ON e.id = ev.extension_id
      WHERE e.developer_id = ?
      ORDER BY e.is_featured DESC, e.updated_at DESC
    `)
    .bind(developerId)
    .all<DeveloperExtensionRow>();

  return results || [];
}
