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

/**
 * Check if a directory URL slug is already taken by another extension
 */
export async function isExtensionSlugTaken(
  db: D1Database,
  slug: string,
  excludeId?: string
): Promise<boolean> {
  let query = 'SELECT id FROM extensions WHERE slug = ?';
  const bindings: string[] = [slug];

  if (excludeId) {
    query += ' AND id != ?';
    bindings.push(excludeId);
  }

  query += ' LIMIT 1';

  const row = await db.prepare(query).bind(...bindings).first<{ id: string }>();
  return !!row;
}

export interface SaveExtensionBasicInput {
  id?: string;
  slug: string;
  name: string;
  category: string;
  version: string;
  tagline: string;
  githubUrl: string;
  downloadUrl?: string | null;
  supportEmail: string;
  developerWebsite?: string | null;
  docsUrl?: string | null;
  developerId: string;
  isEdit: boolean;
}

function normalizeStoreCategory(cat: string): string {
  const lower = (cat || '').toLowerCase();
  if (lower.includes('ai')) return 'ai';
  if (lower.includes('dev')) return 'dev';
  if (lower.includes('productivity')) return 'productivity';
  if (lower.includes('privacy') || lower.includes('security')) return 'privacy';
  if (lower.includes('util') || lower.includes('workflow')) return 'utilities';
  return lower || 'productivity';
}

/**
 * Save or insert basic extension details (Tab 1) in Cloudflare D1
 */
export async function saveExtensionBasic(
  db: D1Database,
  data: SaveExtensionBasicInput
): Promise<{ id: string; slug: string }> {
  const normalizedCategory = normalizeStoreCategory(data.category);
  const cleanSlug = data.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (!cleanSlug) {
    throw new Error('Directory URL slug cannot be empty.');
  }

  // Check if slug taken by another extension
  const isTaken = await isExtensionSlugTaken(db, cleanSlug, data.isEdit ? data.id : undefined);
  if (isTaken) {
    throw new Error(`Directory slug "${cleanSlug}" is already taken by another extension.`);
  }

  // If editing an existing extension
  if (data.isEdit && data.id) {
    const existing = await db
      .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
      .bind(data.id, cleanSlug)
      .first<{ id: string }>();

    if (existing) {
      // Update record
      await db
        .prepare(`
          UPDATE extensions
          SET 
            name = ?,
            slug = ?,
            category = ?,
            current_version = ?,
            short_description = ?,
            source_repo_url = ?,
            zip_download_url = ?,
            support_email = ?,
            docs_url = ?,
            updated_at = DATETIME('now')
          WHERE id = ? AND developer_id = ?
        `)
        .bind(
          data.name.trim(),
          cleanSlug,
          normalizedCategory,
          data.version.trim(),
          data.tagline.trim(),
          data.githubUrl.trim(),
          data.downloadUrl?.trim() || null,
          data.supportEmail.trim(),
          data.docsUrl?.trim() || null,
          existing.id,
          data.developerId
        )
        .run();

      // Update developer website if provided
      if (data.developerWebsite?.trim()) {
        await db
          .prepare('UPDATE developers SET website = ? WHERE id = ?')
          .bind(data.developerWebsite.trim(), data.developerId)
          .run();
      }

      return { id: existing.id, slug: cleanSlug };
    }
  }

  // If new extension or inserting an unseeded fallback extension
  const newId = data.id || `ext_${Date.now().toString(36)}_${cleanSlug.slice(0, 12).replace(/-/g, '_')}`;

  await db
    .prepare(`
      INSERT INTO extensions (
        id, slug, name, category, current_version, short_description,
        source_repo_url, zip_download_url, support_email, docs_url,
        developer_id, icon_url, is_active, pricing_type, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '/icons/extension-placeholder.avif', 1, 'free', DATETIME('now'), DATETIME('now')
      )
    `)
    .bind(
      newId,
      cleanSlug,
      data.name.trim(),
      normalizedCategory,
      data.version.trim() || '1.0.0',
      data.tagline.trim(),
      data.githubUrl.trim(),
      data.downloadUrl?.trim() || null,
      data.supportEmail.trim(),
      data.docsUrl?.trim() || null,
      data.developerId
    )
    .run();

  // Create initial extension version record in review queue
  const versionId = `ver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  await db
    .prepare(`
      INSERT OR IGNORE INTO extension_versions (
        id, extension_id, version, package_zip_url, manifest_json, review_status, submitted_at
      ) VALUES (
        ?, ?, ?, COALESCE(?, ''), '{}', 'pending', DATETIME('now')
      )
    `)
    .bind(
      versionId,
      newId,
      data.version.trim() || '1.0.0',
      data.downloadUrl?.trim() || null
    )
    .run();

  // Update developer website if provided
  if (data.developerWebsite?.trim()) {
    await db
      .prepare('UPDATE developers SET website = ? WHERE id = ?')
      .bind(data.developerWebsite.trim(), data.developerId)
      .run();
  }

  return { id: newId, slug: cleanSlug };
}

export interface SaveExtensionMediaInput {
  id?: string;
  slug?: string;
  developerId: string;
  iconUrl: string;
  headerImageUrl?: string | null;
  screenshots?: string[];
  youtubeVideoUrl?: string | null;
}

/**
 * Save or update visual media & store assets (Tab 2) in Cloudflare D1
 */
export async function saveExtensionMedia(
  db: D1Database,
  data: SaveExtensionMediaInput
): Promise<{ id: string; success: boolean }> {
  const cleanId = (data.id || '').trim();
  const cleanSlug = (data.slug || '').trim().toLowerCase();

  if (!cleanId && !cleanSlug) {
    throw new Error('Extension ID or directory slug is required.');
  }

  // Find extension belonging to this developer
  const existing = await db
    .prepare('SELECT id FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<{ id: string }>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  const screenshotsJson = JSON.stringify(data.screenshots || []);

  await db
    .prepare(`
      UPDATE extensions
      SET 
        icon_url = ?,
        header_image_url = ?,
        screenshots = ?,
        youtube_video_url = ?,
        updated_at = DATETIME('now')
      WHERE id = ? AND developer_id = ?
    `)
    .bind(
      data.iconUrl.trim(),
      data.headerImageUrl?.trim() || null,
      screenshotsJson,
      data.youtubeVideoUrl?.trim() || null,
      existing.id,
      data.developerId
    )
    .run();

  return { id: existing.id, success: true };
}

export interface FeatureItemInput {
  title: string;
  description: string;
}

export interface WorkflowStageInput {
  step: number;
  title: string;
  description: string;
}

export interface ComparisonRowInput {
  feature: string;
  current: string;
  others: string;
}

export interface SaveExtensionStoryInput {
  id?: string;
  slug?: string;
  developerId: string;
  description: string;
  features: FeatureItemInput[];
  workflow: WorkflowStageInput[];
  comparison: ComparisonRowInput[];
}

/**
 * Save or update store story, features, workflow, and comparison matrix (Tab 3) in Cloudflare D1
 */
export async function saveExtensionStory(
  db: D1Database,
  data: SaveExtensionStoryInput
): Promise<{ id: string; success: boolean }> {
  const cleanId = (data.id || '').trim();
  const cleanSlug = (data.slug || '').trim().toLowerCase();

  if (!cleanId && !cleanSlug) {
    throw new Error('Extension ID or directory slug is required.');
  }

  // Find extension belonging to this developer
  const existing = await db
    .prepare('SELECT id FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<{ id: string }>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  const featuresJson = JSON.stringify(data.features || []);
  const workflowJson = JSON.stringify(data.workflow || []);
  const comparisonJson = JSON.stringify(data.comparison || []);

  await db
    .prepare(`
      UPDATE extensions
      SET 
        full_description = ?,
        features = ?,
        workflow = ?,
        comparison = ?,
        updated_at = DATETIME('now')
      WHERE id = ? AND developer_id = ?
    `)
    .bind(
      data.description.trim(),
      featuresJson,
      workflowJson,
      comparisonJson,
      existing.id,
      data.developerId
    )
    .run();

  return { id: existing.id, success: true };
}

export interface FAQInput {
  q: string;
  a: string;
}

export interface SaveExtensionSpecsInput {
  id?: string;
  slug?: string;
  developerId: string;
  monetagUrl: string;
  frequency: string;
  faqs: FAQInput[];
  manifestVersion: string;
  license: string;
  supportedBrowsers: string[];
  privacyPolicyUrl?: string | null;
  publish?: boolean;
}

/**
 * Save or update monetization stream, FAQs, technical specs, and compliance (Tab 4) in Cloudflare D1
 */
export async function saveExtensionSpecs(
  db: D1Database,
  data: SaveExtensionSpecsInput
): Promise<{ id: string; success: boolean }> {
  const cleanId = (data.id || '').trim();
  const cleanSlug = (data.slug || '').trim().toLowerCase();

  if (!cleanId && !cleanSlug) {
    throw new Error('Extension ID or directory slug is required.');
  }

  // Find extension belonging to this developer
  const existing = await db
    .prepare('SELECT id FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<{ id: string }>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  const faqsJson = JSON.stringify(data.faqs || []);
  const browsersJson = JSON.stringify(data.supportedBrowsers || []);

  await db
    .prepare(`
      UPDATE extensions
      SET 
        monetag_direct_link = ?,
        ad_frequency = ?,
        faqs = ?,
        manifest_version = ?,
        license = ?,
        supported_browsers = ?,
        privacy_policy_url = ?,
        updated_at = DATETIME('now')
      WHERE id = ? AND developer_id = ?
    `)
    .bind(
      data.monetagUrl.trim(),
      data.frequency || '24h',
      faqsJson,
      data.manifestVersion || 'v3',
      data.license || 'MIT',
      browsersJson,
      data.privacyPolicyUrl?.trim() || null,
      existing.id,
      data.developerId
    )
    .run();

  if (data.publish) {
    await db
      .prepare(`
        UPDATE extension_versions
        SET review_status = 'pending', submitted_at = DATETIME('now')
        WHERE extension_id = ?
      `)
      .bind(existing.id)
      .run();
  }

  return { id: existing.id, success: true };
}

