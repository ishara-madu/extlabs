import type { D1Database } from '@cloudflare/workers-types';
import type { DbExtension } from '../db';
import { EXTENSIONS, type Extension } from '../../data/extensions';

export interface ExtensionWithDeveloper extends DbExtension {
  developer_name: string;
  developer_slug: string;
  developer_verified: number;
}

/**
 * Fetch all live extensions from D1
 */
export async function getLiveExtensions(db: D1Database): Promise<ExtensionWithDeveloper[]> {
  const query = `
    SELECT 
      e.*, 
      COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
      COALESCE(d.slug, 'developer') AS developer_slug, 
      COALESCE(d.is_verified, 1) AS developer_verified
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.is_active = 1 AND e.is_suspended = 0
    ORDER BY e.is_featured DESC, e.rating DESC, e.weekly_active_users DESC
  `;
  const { results } = await db.prepare(query).all<ExtensionWithDeveloper>();
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
      SELECT 
        e.*, 
        COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
        COALESCE(d.slug, 'developer') AS developer_slug, 
        COALESCE(d.is_verified, 1) AS developer_verified
      FROM extensions e
      LEFT JOIN developers d ON e.developer_id = d.id
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
): Promise<ExtensionWithDeveloper[]> {
  const query = `
    SELECT 
      e.*, 
      COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
      COALESCE(d.slug, 'developer') AS developer_slug, 
      COALESCE(d.is_verified, 1) AS developer_verified
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.category = ? AND e.is_active = 1 AND e.is_suspended = 0
    ORDER BY e.is_featured DESC, e.rating DESC, e.weekly_active_users DESC
  `;
  const { results } = await db.prepare(query).bind(category).all<ExtensionWithDeveloper>();
  return results || [];
}

/**
 * Generate a clean SVG visual banner for real extensions
 */
export function generateExtensionBannerSvg(name: string, category: string): string {
  const gradients: Record<string, [string, string]> = {
    ai: ['#0c4a6e', '#0369a1'],
    dev: ['#0f172a', '#1e293b'],
    productivity: ['#14532d', '#059669'],
    privacy: ['#4c1d95', '#6d28d9'],
    utilities: ['#1f2937', '#374151'],
    social: ['#831843', '#be185d'],
  };
  const [c1, c2] = gradients[category] || ['#0f172a', '#1e293b'];
  const safeName = (name || 'Browser Extension').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
    <defs>
      <linearGradient id="banner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <rect width="460" height="260" fill="url(#banner-grad)" />
    <g transform="translate(45, 60)">
      <rect width="370" height="140" rx="12" fill="#0f172a" fill-opacity="0.85" stroke="#475569" stroke-width="1" />
      <circle cx="24" cy="24" r="4" fill="#ef4444" />
      <circle cx="38" cy="24" r="4" fill="#f59e0b" />
      <circle cx="52" cy="24" r="4" fill="#10b981" />
      <text x="185" y="80" fill="#ffffff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">${safeName}</text>
      <text x="185" y="105" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="middle">Chromium Manifest V3 • Verified</text>
    </g>
  </svg>`;
}

/**
 * Map database extension to store frontend Extension format
 */
export function mapDbExtensionToStoreItem(dbExt: ExtensionWithDeveloper): Extension {
  let tags: string[] = [];
  try {
    tags = JSON.parse(dbExt.tags || '[]');
  } catch {}
  if (!Array.isArray(tags) || tags.length === 0) {
    tags = [dbExt.category.toUpperCase(), 'Manifest V3', 'Verified'];
  }

  let features: any[] = [];
  try {
    features = JSON.parse(dbExt.features || '[]');
  } catch {}

  let workflow: any[] = [];
  try {
    workflow = JSON.parse(dbExt.workflow || '[]');
  } catch {}

  let comparison: any[] = [];
  try {
    comparison = JSON.parse(dbExt.comparison || '[]');
  } catch {}

  let faqs: any[] = [];
  try {
    faqs = JSON.parse(dbExt.faqs || '[]');
  } catch {}

  const categoryLabels: Record<string, string> = {
    ai: 'AI & Machine Learning',
    dev: 'Developer Tools',
    productivity: 'Productivity',
    privacy: 'Privacy & Security',
    utilities: 'Utilities & System',
    social: 'Social & Communication',
  };

  const usersCountFormatted = (dbExt.weekly_active_users || 0) >= 1000
    ? `${((dbExt.weekly_active_users || 0) / 1000).toFixed(1)}k users`
    : `${dbExt.weekly_active_users || 120} users`;

  const existingMock = EXTENSIONS.find((e) => e.id === dbExt.slug || e.id === dbExt.id);
  const bannerSvg = existingMock?.bannerSvg || (dbExt.header_image_url
    ? `<img src="${dbExt.header_image_url}" alt="${dbExt.name}" class="w-full h-full object-cover" />`
    : generateExtensionBannerSvg(dbExt.name, dbExt.category));

  return {
    id: dbExt.slug || dbExt.id,
    name: dbExt.name,
    tagline: dbExt.short_description || 'Modern browser extension for high performance and privacy.',
    description: dbExt.full_description || dbExt.short_description || '',
    category: (dbExt.category || 'productivity') as any,
    categoryLabel: categoryLabels[dbExt.category] || 'Productivity',
    developer: dbExt.developer_name || 'ExtLabs Developer',
    isVerified: Boolean(dbExt.developer_verified),
    rating: dbExt.rating || 5.0,
    reviewCount: dbExt.review_count || 12,
    userCount: usersCountFormatted,
    version: dbExt.current_version || '1.0.0',
    updatedDate: dbExt.updated_at ? dbExt.updated_at.split(' ')[0] : '2026-09-01',
    size: '2.4 MB',
    featured: Boolean(dbExt.is_featured),
    editorsPick: Boolean(dbExt.is_editors_pick),
    badge: dbExt.is_featured ? 'Featured' : undefined,
    iconUrl: dbExt.icon_url || existingMock?.iconUrl || '/icons/extension-placeholder.avif',
    bannerSvg,
    tags,
    permissions: dbExt.permissions ? JSON.parse(dbExt.permissions || '[]') : [],
    overview: [dbExt.full_description || dbExt.short_description || ''],
    features: features.length > 0 ? features : existingMock?.features,
    howItWorks: workflow.length > 0 ? workflow.map((w: any) => ({ step: w.step, title: w.title, description: w.description })) : existingMock?.howItWorks,
    comparison: comparison.length > 0 ? comparison : existingMock?.comparison,
    faqs: faqs.length > 0 ? faqs.map((f: any) => ({ question: f.q || f.question, answer: f.a || f.answer })) : existingMock?.faqs,
    developerSupport: {
      email: dbExt.support_email || 'support@extlabs.io',
      website: dbExt.developer_website || 'https://extlabs.io',
      github: dbExt.github_url || undefined,
      supportUrl: dbExt.docs_url || 'https://extlabs.io',
      privacyPolicy: dbExt.privacy_policy_url || 'https://extlabs.io/privacy',
    },
    downloadUrl: dbExt.crx_download_url || dbExt.zip_download_url || dbExt.download_url || '#',
    monetagUrl: dbExt.monetag_direct_link || undefined,
  };
}

/**
 * Fetch all live extensions for the store, mapping real D1 database rows
 */
export async function getStoreExtensions(db: D1Database | null): Promise<Extension[]> {
  if (!db) return EXTENSIONS;
  try {
    const liveExtensions = await getLiveExtensions(db);
    if (liveExtensions && liveExtensions.length > 0) {
      return liveExtensions.map(mapDbExtensionToStoreItem);
    }
  } catch (err) {
    console.warn('Failed to fetch extensions from D1, using fallback:', err);
  }
  return EXTENSIONS;
}

/**
 * Fetch live store extensions for a specific category
 */
export async function getStoreExtensionsByCategory(db: D1Database | null, category: string): Promise<Extension[]> {
  if (!db) return EXTENSIONS.filter((e) => e.category === category);
  try {
    const liveCatExtensions = await getExtensionsByCategory(db, category);
    if (liveCatExtensions && liveCatExtensions.length > 0) {
      return liveCatExtensions.map(mapDbExtensionToStoreItem);
    }
  } catch (err) {
    console.warn('Failed to fetch category extensions from D1:', err);
  }
  return EXTENSIONS.filter((e) => e.category === category);
}

/**
 * Fetch a single store extension by slug or ID from D1
 */
export async function getStoreExtensionByIdOrSlug(db: D1Database | null, idOrSlug: string): Promise<Extension | null> {
  if (!db) return EXTENSIONS.find((e) => e.id === idOrSlug) || null;
  try {
    const ext = await getExtensionBySlug(db, idOrSlug);
    if (ext) {
      return mapDbExtensionToStoreItem(ext);
    }
    const extById = await getExtensionById(db, idOrSlug);
    if (extById) {
      return mapDbExtensionToStoreItem({
        ...extById,
        developer_name: 'ExtLabs Developer',
        developer_slug: 'developer',
        developer_verified: 1,
      });
    }
  } catch (err) {
    console.warn('Failed to fetch extension by slug from D1:', err);
  }
  return EXTENSIONS.find((e) => e.id === idOrSlug) || null;
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

