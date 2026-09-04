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

export interface ManageExtensionDetail extends DbExtension {
  developer_name: string;
  developer_slug: string;
  developer_verified: number;
  version_name?: string;
  review_status?: string;
  package_size_bytes?: number;
  manifest_json?: string;
}

/**
 * Fetch extension details for developer management console by ID or slug
 */
export async function getDeveloperExtensionDetail(
  db: D1Database,
  idOrSlug: string,
  developerId?: string
): Promise<ManageExtensionDetail | null> {
  const query = `
    SELECT 
      e.*, 
      d.display_name AS developer_name, 
      d.slug AS developer_slug, 
      d.is_verified AS developer_verified,
      ev.version AS version_name,
      ev.review_status,
      ev.package_size_bytes,
      ev.manifest_json
    FROM extensions e
    JOIN developers d ON e.developer_id = d.id
    LEFT JOIN (
      SELECT extension_id, version, review_status, package_size_bytes, manifest_json, MAX(submitted_at)
      FROM extension_versions
      GROUP BY extension_id
    ) ev ON e.id = ev.extension_id
    WHERE (e.id = ? OR e.slug = ?)
    ${developerId ? 'AND e.developer_id = ?' : ''}
    LIMIT 1
  `;

  const stmt = db.prepare(query);
  const result = developerId
    ? await stmt.bind(idOrSlug, idOrSlug, developerId).first<ManageExtensionDetail>()
    : await stmt.bind(idOrSlug, idOrSlug).first<ManageExtensionDetail>();

  return result || null;
}

export interface ExtensionRegionalTelemetry {
  country_code: string;
  total_downloads: number;
}

/**
 * Fetch aggregated downloads by country from Cloudflare D1 telemetry_daily
 */
export async function getExtensionRegionalAnalytics(
  db: D1Database,
  extensionId: string
): Promise<ExtensionRegionalTelemetry[]> {
  const query = `
    SELECT 
      country_code, 
      SUM(downloads) AS total_downloads
    FROM telemetry_daily
    WHERE extension_id = ?
    GROUP BY country_code
    ORDER BY total_downloads DESC
  `;

  const { results } = await db.prepare(query).bind(extensionId).all<ExtensionRegionalTelemetry>();
  return results || [];
}

