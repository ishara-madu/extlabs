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
  status?: string;
  has_pending_draft?: number;
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
        e.status,
        (e.draft_data IS NOT NULL) AS has_pending_draft,
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

export interface TopGeographySummary {
  topGeography: string | null;
  secondaryGeography: string | null;
}

/**
 * Fetch top geographies for a list of extension IDs from telemetry_daily
 */
export async function getExtensionsTopGeographies(
  db: D1Database,
  extensionIds: string[]
): Promise<Record<string, TopGeographySummary>> {
  const result: Record<string, TopGeographySummary> = {};
  if (!extensionIds.length) return result;

  const placeholders = extensionIds.map(() => '?').join(',');
  const query = `
    SELECT extension_id, country_code, SUM(downloads) as total_downloads
    FROM telemetry_daily
    WHERE extension_id IN (${placeholders})
    GROUP BY extension_id, country_code
    ORDER BY total_downloads DESC
  `;

  try {
    const rows = await db.prepare(query).bind(...extensionIds).all<{
      extension_id: string;
      country_code: string;
      total_downloads: number;
    }>();

    if (rows && rows.results) {
      const byExt: Record<string, { country: string; count: number }[]> = {};
      for (const r of rows.results) {
        if (!byExt[r.extension_id]) byExt[r.extension_id] = [];
        byExt[r.extension_id].push({
          country: r.country_code,
          count: Number(r.total_downloads) || 0,
        });
      }

      for (const [extId, items] of Object.entries(byExt)) {
        const total = items.reduce((acc, curr) => acc + curr.count, 0);
        if (total > 0 && items.length > 0) {
          const top = items[0];
          const topPct = Math.round((top.count / total) * 100);
          const topGeography = `${top.country} (${topPct}%)`;

          const secondary = items.slice(1, 3);
          const secondaryGeography = secondary.length > 0
            ? secondary.map((s) => `${s.country} ${Math.round((s.count / total) * 100)}%`).join(' • ')
            : null;

          result[extId] = { topGeography, secondaryGeography };
        }
      }
    }
  } catch (err) {
    console.warn('Failed to fetch extensions top geographies:', err);
  }

  return result;
}
