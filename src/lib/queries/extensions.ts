// src/lib/queries/extensions.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { DbExtension } from '../db';

export interface ExtensionWithDeveloper extends DbExtension {
  developer_name: string;
  developer_slug: string;
  developer_verified: number;
}

/**
 * Fetch all live extensions from D1
 */
export async function getLiveExtensions(db: D1Database): Promise<DbExtension[]> {
  const { results } = await db
    .prepare('SELECT * FROM extensions WHERE is_active = 1 AND is_suspended = 0 ORDER BY rating DESC')
    .all<DbExtension>();
  return results || [];
}

/**
 * Fetch extension by slug with developer info
 */
export async function getExtensionBySlug(
  db: D1Database,
  slug: string
): Promise<ExtensionWithDeveloper | null> {
  const result = await db
    .prepare(`
      SELECT e.*, d.display_name AS developer_name, d.slug AS developer_slug, d.is_verified AS developer_verified
      FROM extensions e
      JOIN developers d ON e.developer_id = d.id
      WHERE e.slug = ?
    `)
    .bind(slug)
    .first<ExtensionWithDeveloper>();
  return result || null;
}

/**
 * Fetch extension by ID
 */
export async function getExtensionById(
  db: D1Database,
  id: string
): Promise<DbExtension | null> {
  const result = await db
    .prepare('SELECT * FROM extensions WHERE id = ?')
    .bind(id)
    .first<DbExtension>();
  return result || null;
}

/**
 * Fetch active extensions by category
 */
export async function getExtensionsByCategory(
  db: D1Database,
  category: string
): Promise<DbExtension[]> {
  const { results } = await db
    .prepare('SELECT * FROM extensions WHERE category = ? AND is_active = 1 AND is_suspended = 0 ORDER BY rating DESC')
    .bind(category)
    .all<DbExtension>();
  return results || [];
}
