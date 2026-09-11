import type { D1Database } from '@cloudflare/workers-types';
import type { DbExtension } from '../db';
import type { Extension, ReviewItem } from '../../data/extensions';

export interface ExtensionWithDeveloper extends DbExtension {
  developer_name: string;
  developer_slug: string;
  developer_verified: number;
  developer_website?: string | null;
}

// ==========================================
// L1 Worker In-Memory Cache (Sub-millisecond D1 Protection)
// ==========================================
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();

export function getMemoryCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setMemoryCached<T>(key: string, data: T, ttlMs: number = 60_000): void {
  if (memoryCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (now > v.expiresAt) memoryCache.delete(k);
    }
  }
  memoryCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function clearMemoryCache(keyPattern?: string): void {
  if (!keyPattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(keyPattern)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Fetch all live extensions from D1 (L1 In-Memory Cached for 60s)
 */
export async function getLiveExtensions(db: D1Database): Promise<ExtensionWithDeveloper[]> {
  const cacheKey = 'd1:live_extensions';
  const cached = getMemoryCached<ExtensionWithDeveloper[]>(cacheKey);
  if (cached) return cached;

  const query = `
    SELECT 
      e.*, 
      COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
      COALESCE(d.slug, 'developer') AS developer_slug, 
      COALESCE(d.is_verified, 1) AS developer_verified,
      d.website AS developer_website
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.is_active = 1 AND e.is_suspended = 0 AND e.status = 'published'
    ORDER BY e.is_featured DESC, e.rating DESC, e.weekly_active_users DESC
  `;
  const { results } = await db.prepare(query).all<ExtensionWithDeveloper>();
  const data = results || [];
  setMemoryCached(cacheKey, data, 60_000);
  return data;
}

/**
 * Fetch extension by slug with developer info (L1 In-Memory Cached for 60s)
 */
export async function getExtensionBySlug(
  db: D1Database,
  slug: string,
  options?: { allowDraft?: boolean }
): Promise<ExtensionWithDeveloper | null> {
  const cacheKey = `d1:ext_slug:${slug}:${options?.allowDraft ? 'draft' : 'live'}`;
  const cached = getMemoryCached<ExtensionWithDeveloper>(cacheKey);
  if (cached) return cached;

  const draftClause = options?.allowDraft ? '' : "AND e.is_active = 1 AND e.is_suspended = 0 AND e.status = 'published'";
  const query = `
    SELECT 
      e.*, 
      COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
      COALESCE(d.slug, 'developer') AS developer_slug, 
      COALESCE(d.is_verified, 1) AS developer_verified,
      d.website AS developer_website
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.slug = ?
    ${draftClause}
  `;

  const result = await db.prepare(query).bind(slug).first<ExtensionWithDeveloper>();

  if (result) {
    setMemoryCached(cacheKey, result, 60_000);
  }
  return result || null;
}

/**
 * Fetch extension by ID
 */
export async function getExtensionById(
  db: D1Database,
  id: string,
  options?: { allowDraft?: boolean }
): Promise<ExtensionWithDeveloper | null> {
  const draftClause = options?.allowDraft ? '' : "AND e.is_active = 1 AND e.is_suspended = 0 AND e.status = 'published'";
  const query = `
    SELECT 
      e.*, 
      COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
      COALESCE(d.slug, 'developer') AS developer_slug, 
      COALESCE(d.is_verified, 1) AS developer_verified,
      d.website AS developer_website
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.id = ?
    ${draftClause}
  `;

  const result = await db.prepare(query).bind(id).first<ExtensionWithDeveloper>();
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
      COALESCE(d.is_verified, 1) AS developer_verified,
      d.website AS developer_website
    FROM extensions e
    LEFT JOIN developers d ON e.developer_id = d.id
    WHERE e.category = ? AND e.is_active = 1 AND e.is_suspended = 0 AND e.status = 'published'
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
    privacy: ['#064e3b', '#047857'],
    media: ['#881337', '#be123c'],
    automation: ['#581c87', '#7e22ce'],
    customization: ['#831843', '#be185d'],
    ai: ['#0c4a6e', '#0369a1'],
    dev: ['#0f172a', '#1e293b'],
    productivity: ['#451a03', '#b45309'],
    networking: ['#134e4a', '#0f766e'],
    social: ['#312e81', '#4338ca'],
    shopping: ['#064e3b', '#059669'],
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
      <text x="185" y="105" fill="#94a3b8" font-size="11" font-family="monospace" text-anchor="middle">Verified Extension • ExtLabs</text>
    </g>
  </svg>`;
}

/**
 * Fetch real rating star breakdown from reviews table in Cloudflare D1
 */
export async function getExtensionRatingBreakdown(
  db: D1Database | null,
  extensionId: string
): Promise<{ 5: number; 4: number; 3: number; 2: number; 1: number }> {
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  if (!db || !extensionId) return breakdown;

  try {
    const ext = await db
      .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
      .bind(extensionId, extensionId)
      .first<{ id: string }>();

    if (!ext) return breakdown;

    const rows = await db
      .prepare('SELECT rating, COUNT(*) as count FROM reviews WHERE extension_id = ? GROUP BY rating')
      .bind(ext.id)
      .all<{ rating: number; count: number }>();

    if (rows && rows.results) {
      for (const r of rows.results) {
        const star = Math.round(Number(r.rating));
        if (star >= 1 && star <= 5) {
          breakdown[star as 1 | 2 | 3 | 4 | 5] = Number(r.count) || 0;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to calculate rating breakdown from D1:', err);
  }

  return breakdown;
}

/**
 * Fetch reviews for an extension from D1 database
 */
export async function getExtensionReviews(db: D1Database | null, extensionId: string): Promise<ReviewItem[]> {
  if (!db || !extensionId) return [];
  try {
    const ext = await db
      .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
      .bind(extensionId, extensionId)
      .first<{ id: string }>();
    if (!ext) return [];

    const query = `
      SELECT r.id, r.user_id, r.rating, r.title, r.comment, r.created_at, u.name, u.username, u.avatar_url
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.extension_id = ?
      ORDER BY r.created_at DESC
      LIMIT 50
    `;
    const rows = await db.prepare(query).bind(ext.id).all();
    if (rows && rows.results && rows.results.length > 0) {
      return rows.results.map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        author: r.name || r.username || 'Verified User',
        avatarUrl: r.avatar_url || '',
        date: r.created_at ? r.created_at.split(' ')[0] : 'Recently',
        rating: Number(r.rating) || 5,
        title: r.title || '',
        comment: r.comment || '',
        verified: true,
      }));
    }
  } catch (err) {
    console.warn('Failed to fetch extension reviews from D1:', err);
  }
  return [];
}

/**
 * Fetch existing review submitted by a specific user for an extension
 */
export async function getUserReviewForExtension(
  db: D1Database | null,
  extensionId: string,
  userId: string
): Promise<ReviewItem | null> {
  if (!db || !extensionId || !userId) return null;
  try {
    const ext = await db
      .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
      .bind(extensionId, extensionId)
      .first<{ id: string }>();
    if (!ext) return null;

    const row = await db
      .prepare(`
        SELECT r.id, r.user_id, r.rating, r.title, r.comment, r.created_at, u.name, u.username, u.avatar_url
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.extension_id = ? AND r.user_id = ?
        LIMIT 1
      `)
      .bind(ext.id, userId)
      .first<any>();

    if (row) {
      return {
        id: row.id,
        userId: row.user_id,
        author: row.name || row.username || 'You',
        avatarUrl: row.avatar_url || '',
        date: row.created_at ? row.created_at.split(' ')[0] : 'Recently',
        rating: Number(row.rating) || 5,
        title: row.title || '',
        comment: row.comment || '',
        verified: true,
      };
    }
  } catch (err) {
    console.warn('Failed to fetch user review from D1:', err);
  }
  return null;
}

/**
 * Submit or update a user review for an extension and recalculate rating stats
 */
export async function submitExtensionReview(
  db: D1Database,
  input: {
    extensionId: string;
    userId: string;
    rating: number;
    title?: string;
    comment: string;
  }
): Promise<{ success: boolean; reviewId: string; newRating: number; newReviewCount: number }> {
  const { extensionId, userId, rating, title, comment } = input;

  // Resolve target extension primary key (extensionId could be PK id or slug)
  const ext = await db
    .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionId, extensionId)
    .first<{ id: string }>();

  if (!ext) {
    throw new Error(`Extension "${extensionId}" not found.`);
  }

  const realExtensionId = ext.id;

  // 1. Check if user already reviewed this extension
  const existing = await db
    .prepare('SELECT id FROM reviews WHERE extension_id = ? AND user_id = ?')
    .bind(realExtensionId, userId)
    .first<{ id: string }>();

  let reviewId: string;
  if (existing) {
    reviewId = existing.id;
    await db
      .prepare(`
        UPDATE reviews 
        SET rating = ?, title = ?, comment = ?, created_at = DATETIME('now')
        WHERE id = ?
      `)
      .bind(rating, title?.trim() || null, comment.trim(), reviewId)
      .run();
  } else {
    reviewId = `rev_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
    await db
      .prepare(`
        INSERT INTO reviews (id, extension_id, user_id, rating, title, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?, DATETIME('now'))
      `)
      .bind(reviewId, realExtensionId, userId, rating, title?.trim() || null, comment.trim())
      .run();
  }

  // 2. Recalculate average rating & review count for extension
  const stats = await db
    .prepare(`
      SELECT COUNT(*) as total_count, AVG(rating) as avg_rating
      FROM reviews
      WHERE extension_id = ?
    `)
    .bind(realExtensionId)
    .first<{ total_count: number; avg_rating: number }>();

  const newReviewCount = stats?.total_count ?? 1;
  const rawAvg = stats?.avg_rating ?? rating;
  const newRating = Math.round(rawAvg * 10) / 10;

  // 3. Update extensions table
  await db
    .prepare(`
      UPDATE extensions
      SET rating = ?, review_count = ?, updated_at = DATETIME('now')
      WHERE id = ?
    `)
    .bind(newRating, newReviewCount, realExtensionId)
    .run();

  return {
    success: true,
    reviewId,
    newRating,
    newReviewCount,
  };
}

/**
 * Delete a user review for an extension and recalculate rating stats
 */
export async function deleteExtensionReview(
  db: D1Database,
  extensionId: string,
  userId: string
): Promise<{ success: boolean; newRating: number; newReviewCount: number }> {
  // Resolve target extension primary key (extensionId could be PK id or slug)
  const ext = await db
    .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionId, extensionId)
    .first<{ id: string }>();

  if (!ext) {
    throw new Error(`Extension "${extensionId}" not found.`);
  }

  const realExtensionId = ext.id;

  // Delete review
  await db
    .prepare('DELETE FROM reviews WHERE extension_id = ? AND user_id = ?')
    .bind(realExtensionId, userId)
    .run();

  // Recalculate stats
  const stats = await db
    .prepare(`
      SELECT COUNT(*) as total_count, AVG(rating) as avg_rating
      FROM reviews
      WHERE extension_id = ?
    `)
    .bind(realExtensionId)
    .first<{ total_count: number; avg_rating: number }>();

  const newReviewCount = stats?.total_count ?? 0;
  const newRating = newReviewCount > 0 && stats?.avg_rating ? Math.round(stats.avg_rating * 10) / 10 : 5.0;

  await db
    .prepare(`
      UPDATE extensions
      SET rating = ?, review_count = ?, updated_at = DATETIME('now')
      WHERE id = ?
    `)
    .bind(newRating, newReviewCount, realExtensionId)
    .run();

  return {
    success: true,
    newRating,
    newReviewCount,
  };
}

/**
 * Map database extension to store frontend Extension format
 */
export function mapDbExtensionToStoreItem(
  dbExt: ExtensionWithDeveloper,
  customReviews?: ReviewItem[],
  customBreakdown?: { 5: number; 4: number; 3: number; 2: number; 1: number }
): Extension {
  let tags: string[] = [];
  try {
    tags = JSON.parse(dbExt.tags || '[]');
  } catch {}
  if (!Array.isArray(tags)) {
    tags = [];
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
    privacy: 'Adblock & Content Filters',
    media: 'Media & Downloaders',
    automation: 'Automation & Scripts',
    customization: 'Web Modifiers & Themes',
    ai: 'AI & Smart Tools',
    dev: 'Developer & Power Tools',
    productivity: 'Productivity & Workflow',
    networking: 'Proxies & Network Unblockers',
    social: 'Social Media & Community',
    shopping: 'Shopping & Rewards',
  };

  const usersCountFormatted = (dbExt.weekly_active_users || 0) >= 1000
    ? `${((dbExt.weekly_active_users || 0) / 1000).toFixed(1)}k users`
    : (dbExt.weekly_active_users ? `${dbExt.weekly_active_users} users` : '');

  let screenshots: string[] = [];
  try {
    const rawScreenshots = typeof dbExt.screenshots === 'string' ? JSON.parse(dbExt.screenshots || '[]') : dbExt.screenshots;
    if (Array.isArray(rawScreenshots)) {
      screenshots = rawScreenshots.filter((s: any) => typeof s === 'string' && s.trim().length > 0);
    }
  } catch {}

  let youtubeVideoId: string | undefined = undefined;
  if (dbExt.youtube_video_url) {
    const match = dbExt.youtube_video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match) youtubeVideoId = match[1];
  }

  const bannerSvg = dbExt.header_image_url
    ? `<img src="${dbExt.header_image_url}" alt="${dbExt.name}" class="w-full h-full object-cover" />`
    : generateExtensionBannerSvg(dbExt.name, dbExt.category);

  const reviewCount = typeof dbExt.review_count === 'number' ? dbExt.review_count : 0;
  const rating = reviewCount > 0 && typeof dbExt.rating === 'number' ? dbExt.rating : 0;
  const reviews: ReviewItem[] = customReviews || [];
  const ratingBreakdown = reviewCount > 0 ? (customBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }) : undefined;

  let supportedBrowsers: string[] = ['chrome', 'brave', 'edge', 'opera'];
  try {
    const rawBrowsers = typeof dbExt.supported_browsers === 'string'
      ? JSON.parse(dbExt.supported_browsers || '[]')
      : dbExt.supported_browsers;
    if (Array.isArray(rawBrowsers) && rawBrowsers.length > 0) {
      supportedBrowsers = rawBrowsers;
    }
  } catch {}

  return {
    id: dbExt.slug || dbExt.id,
    dbId: dbExt.id,
    slug: dbExt.slug,
    name: dbExt.name,
    tagline: dbExt.short_description || '',
    description: dbExt.full_description || dbExt.short_description || '',
    category: (dbExt.category || 'productivity') as any,
    categoryLabel: categoryLabels[dbExt.category] || 'Productivity',
    developer: dbExt.developer_name || 'Developer',
    isVerified: Boolean(dbExt.developer_verified),
    rating,
    reviewCount,
    ratingBreakdown,
    reviews,
    userCount: usersCountFormatted,
    version: dbExt.current_version || '1.0.0',
    updatedDate: dbExt.updated_at ? dbExt.updated_at.split(' ')[0] : '',
    createdDate: dbExt.created_at ? dbExt.created_at.split(' ')[0] : (dbExt.updated_at ? dbExt.updated_at.split(' ')[0] : ''),
    size: undefined,
    featured: Boolean(dbExt.is_featured),
    editorsPick: Boolean(dbExt.is_editors_pick),
    badge: dbExt.is_featured ? 'Featured' : undefined,
    iconUrl: dbExt.icon_url || '/icons/extension-placeholder.avif',
    bannerSvg,
    screenshots: Array.isArray(screenshots) && screenshots.length > 0 ? screenshots : undefined,
    youtubeVideoId,
    tags,
    permissions: dbExt.permissions ? JSON.parse(dbExt.permissions || '[]') : [],
    overview: [],
    features: Array.isArray(features) && features.length > 0 ? features : undefined,
    howItWorks: Array.isArray(workflow) && workflow.length > 0 ? workflow.map((w: any) => ({ step: w.step, title: w.title, description: w.description })) : undefined,
    comparison: Array.isArray(comparison) && comparison.length > 0 ? comparison : undefined,
    faqs: Array.isArray(faqs) && faqs.length > 0 ? faqs.map((f: any) => ({ question: f.q || f.question, answer: f.a || f.answer })) : undefined,
    developerSupport: (dbExt.support_email || dbExt.developer_website || dbExt.source_repo_url || dbExt.github_url || dbExt.docs_url || dbExt.privacy_policy_url) ? {
      email: dbExt.support_email || '',
      website: dbExt.developer_website || '',
      github: dbExt.source_repo_url || dbExt.github_url || undefined,
      supportUrl: dbExt.docs_url || undefined,
      docsUrl: dbExt.docs_url || undefined,
      privacyPolicy: dbExt.privacy_policy_url || undefined,
    } : undefined,
    downloadUrl: dbExt.crx_download_url || dbExt.zip_download_url || dbExt.download_url || '#',
    monetagUrl: dbExt.monetag_direct_link || undefined,
    license: dbExt.license || 'MIT',
    manifestVersion: dbExt.manifest_version || 'v3',
    supportedBrowsers,
    status: dbExt.status || 'published',
    isDraft: dbExt.status === 'draft' || dbExt.is_active === 0,
  };
}

/**
 * Get count of active live extensions
 */
export async function getLiveExtensionsCount(db: D1Database | null): Promise<number> {
  if (!db) return 0;
  try {
    const result = await db
      .prepare("SELECT COUNT(*) as count FROM extensions WHERE is_active = 1 AND is_suspended = 0 AND status = 'published'")
      .first<{ count: number }>();
    return result?.count ?? 0;
  } catch (err) {
    console.warn('Failed to count live extensions from D1:', err);
    return 0;
  }
}

/**
 * Fetch all live extensions for the store, mapping real D1 database rows (L1 In-Memory Cached for 60s)
 */
export async function getStoreExtensions(db: D1Database | null): Promise<Extension[]> {
  if (!db) return [];
  const cacheKey = 'd1:store_all';
  const cached = getMemoryCached<Extension[]>(cacheKey);
  if (cached) return cached;

  try {
    const liveExtensions = await getLiveExtensions(db);
    if (liveExtensions) {
      const mapped = liveExtensions.map(mapDbExtensionToStoreItem);
      setMemoryCached(cacheKey, mapped, 60_000);
      return mapped;
    }
  } catch (err) {
    console.warn('Failed to fetch extensions from D1:', err);
  }
  return [];
}

/**
 * Fetch live store extensions for a specific category (L1 In-Memory Cached for 60s)
 */
export async function getStoreExtensionsByCategory(db: D1Database | null, category: string): Promise<Extension[]> {
  if (!db) return [];
  const cacheKey = `d1:store_cat:${category}`;
  const cached = getMemoryCached<Extension[]>(cacheKey);
  if (cached) return cached;

  try {
    const liveCatExtensions = await getExtensionsByCategory(db, category);
    if (liveCatExtensions) {
      const mapped = liveCatExtensions.map(mapDbExtensionToStoreItem);
      setMemoryCached(cacheKey, mapped, 60_000);
      return mapped;
    }
  } catch (err) {
    console.warn('Failed to fetch category extensions from D1:', err);
  }
  return [];
}

/**
 * Fetch a single store extension by slug or ID from D1
 */
export async function getStoreExtensionByIdOrSlug(
  db: D1Database | null, 
  idOrSlug: string,
  options?: { allowDraftForDeveloperId?: string; allowAdminPreview?: boolean }
): Promise<Extension | null> {
  if (!db) return null;
  try {
    const allowDraft = Boolean(options?.allowDraftForDeveloperId || options?.allowAdminPreview);
    let ext = await getExtensionBySlug(db, idOrSlug, { allowDraft });
    if (!ext) {
      ext = await getExtensionById(db, idOrSlug, { allowDraft });
    }

    if (ext) {
      // If extension is not published or inactive, only permit preview if viewed by its developer author or admin
      if (ext.status !== 'published' || ext.is_active !== 1 || ext.is_suspended === 1) {
        const isAuthor = options?.allowDraftForDeveloperId && options.allowDraftForDeveloperId === ext.developer_id;
        const isAdmin = Boolean(options?.allowAdminPreview);
        if (!isAuthor && !isAdmin) {
          return null; // Block public visitors from accessing drafts
        }
      }

      const [reviews, ratingBreakdown] = await Promise.all([
        getExtensionReviews(db, ext.id),
        getExtensionRatingBreakdown(db, ext.id),
      ]);
      return mapDbExtensionToStoreItem(ext, reviews, ratingBreakdown);
    }
  } catch (err) {
    console.warn('Failed to fetch extension by slug from D1:', err);
  }
  return null;
}

export interface ManageExtensionDetail extends DbExtension {
  developer_name: string;
  developer_slug: string;
  developer_verified: number;
  developer_website?: string | null;
  version_name?: string;
  review_status?: string;
  package_size_bytes?: number;
  manifest_json?: string;
  has_pending_draft?: boolean;
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
      d.website AS developer_website,
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

  const bindings = developerId ? [idOrSlug, idOrSlug, developerId] : [idOrSlug, idOrSlug];
  const row = await db.prepare(query).bind(...bindings).first<ManageExtensionDetail>();
  if (row) {
    row.has_pending_draft = Boolean(row.draft_data);
  }
  return row || null;
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
  const ext = await db
    .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionId, extensionId)
    .first<{ id: string }>();
  const resolvedId = ext ? ext.id : extensionId;

  const query = `
    SELECT 
      country_code, 
      SUM(downloads) AS total_downloads
    FROM telemetry_daily
    WHERE extension_id = ?
    GROUP BY country_code
    ORDER BY total_downloads DESC
  `;

  const { results } = await db.prepare(query).bind(resolvedId).all<ExtensionRegionalTelemetry>();
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
  manifestVersion?: string | null;
  developerId: string;
  isEdit: boolean;
}

function normalizeStoreCategory(cat: string): string {
  const lower = (cat || '').toLowerCase().trim();
  if (lower.includes('priv') || lower.includes('adblock') || lower.includes('filter')) return 'privacy';
  if (lower.includes('media') || lower.includes('download') || lower.includes('stream') || lower.includes('video')) return 'media';
  if (lower.includes('auto') || lower.includes('script') || lower.includes('bot')) return 'automation';
  if (lower.includes('custom') || lower.includes('theme') || lower.includes('mod')) return 'customization';
  if (lower.includes('ai') || lower.includes('llm') || lower.includes('gpt')) return 'ai';
  if (lower.includes('dev') || lower.includes('tool')) return 'dev';
  if (lower.includes('prod') || lower.includes('work') || lower.includes('tab')) return 'productivity';
  if (lower.includes('proxy') || lower.includes('network') || lower.includes('vpn')) return 'networking';
  if (lower.includes('social') || lower.includes('feed')) return 'social';
  if (lower.includes('shop') || lower.includes('reward') || lower.includes('coupon') || lower.includes('price')) return 'shopping';
  return lower || 'productivity';
}

export interface ExtensionDraftData {
  name?: string;
  category?: string;
  current_version?: string;
  manifest_version?: string;
  short_description?: string;
  source_repo_url?: string;
  zip_download_url?: string | null;
  support_email?: string;
  developer_website?: string | null;
  docs_url?: string | null;
  icon_url?: string;
  header_image_url?: string | null;
  screenshots?: string; // JSON string
  youtube_video_url?: string | null;
  full_description?: string;
  features?: string; // JSON string
  workflow?: string; // JSON string
  comparison?: string; // JSON string
  monetag_direct_link?: string;
  ad_frequency?: string;
  faqs?: string; // JSON string
  license?: string;
  supported_browsers?: string; // JSON string
  privacy_policy_url?: string | null;
  updated_at?: string;
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
      .prepare('SELECT id, slug, status, draft_data FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
      .bind(data.id, cleanSlug)
      .first<{ id: string; slug: string; status?: string; draft_data?: string | null }>();

    if (existing) {
      const permanentSlug = existing.slug || cleanSlug;

      if (existing.status === 'published') {
        // Stage changes into draft_data so live store listing remains unaffected until publication
        let draft: ExtensionDraftData = {};
        if (existing.draft_data) {
          try {
            draft = JSON.parse(existing.draft_data);
          } catch {}
        }

        draft.name = data.name.trim();
        draft.category = normalizedCategory;
        draft.current_version = data.version.trim();
        draft.manifest_version = data.manifestVersion?.trim() || draft.manifest_version;
        draft.short_description = data.tagline.trim();
        draft.source_repo_url = data.githubUrl.trim();
        draft.zip_download_url = data.downloadUrl?.trim() || null;
        draft.support_email = data.supportEmail.trim();
        draft.developer_website = data.developerWebsite?.trim() || null;
        draft.docs_url = data.docsUrl?.trim() || null;
        draft.updated_at = new Date().toISOString();

        await db
          .prepare("UPDATE extensions SET draft_data = ?, updated_at = DATETIME('now') WHERE id = ? AND developer_id = ?")
          .bind(JSON.stringify(draft), existing.id, data.developerId)
          .run();

        if (data.developerWebsite?.trim()) {
          await db
            .prepare('UPDATE developers SET website = ? WHERE id = ?')
            .bind(data.developerWebsite.trim(), data.developerId)
            .run();
        }

        return { id: existing.id, slug: permanentSlug };
      }

      // Extension is in draft status: update record directly
      await db
        .prepare(`
          UPDATE extensions
          SET 
            name = ?,
            slug = ?,
            category = ?,
            current_version = ?,
            manifest_version = COALESCE(?, manifest_version),
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
          permanentSlug,
          normalizedCategory,
          data.version.trim(),
          data.manifestVersion?.trim() || null,
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

      return { id: existing.id, slug: permanentSlug };
    }
  }

  // If new extension or inserting an unseeded fallback extension
  const newId = data.id || `ext_${Date.now().toString(36)}_${cleanSlug.slice(0, 12).replace(/-/g, '_')}`;

  // Default new extensions to is_active = 0 and status = 'draft' so they never leak into the store
  await db
    .prepare(`
      INSERT INTO extensions (
        id, slug, name, category, current_version, manifest_version, short_description,
        source_repo_url, zip_download_url, support_email, docs_url,
        developer_id, icon_url, is_active, status, pricing_type, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '/icons/extension-placeholder.avif', 0, 'draft', 'free', DATETIME('now'), DATETIME('now')
      )
    `)
    .bind(
      newId,
      cleanSlug,
      data.name.trim(),
      normalizedCategory,
      data.version.trim() || '1.0.0',
      data.manifestVersion?.trim() || 'v3',
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
    .prepare('SELECT id, status, draft_data FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<{ id: string; status?: string; draft_data?: string | null }>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  // Defensive assertion: ensure database columns only store clean URLs, never Base64
  if (data.iconUrl.startsWith('data:image/') || (data.headerImageUrl && data.headerImageUrl.startsWith('data:image/'))) {
    throw new Error('Direct Base64 images are deprecated. Images must be uploaded to Cloudinary CDN.');
  }

  const screenshotsJson = JSON.stringify(data.screenshots || []);

  if (existing.status === 'published') {
    let draft: ExtensionDraftData = {};
    if (existing.draft_data) {
      try {
        draft = JSON.parse(existing.draft_data);
      } catch {}
    }

    draft.icon_url = data.iconUrl.trim();
    draft.header_image_url = data.headerImageUrl?.trim() || null;
    draft.screenshots = screenshotsJson;
    draft.youtube_video_url = data.youtubeVideoUrl?.trim() || null;
    draft.updated_at = new Date().toISOString();

    await db
      .prepare("UPDATE extensions SET draft_data = ?, updated_at = DATETIME('now') WHERE id = ? AND developer_id = ?")
      .bind(JSON.stringify(draft), existing.id, data.developerId)
      .run();

    return { id: existing.id, success: true };
  }

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
    .prepare('SELECT id, status, draft_data FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<{ id: string; status?: string; draft_data?: string | null }>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  const featuresJson = JSON.stringify(data.features || []);
  const workflowJson = JSON.stringify(data.workflow || []);
  const comparisonJson = JSON.stringify(data.comparison || []);

  if (existing.status === 'published') {
    let draft: ExtensionDraftData = {};
    if (existing.draft_data) {
      try {
        draft = JSON.parse(existing.draft_data);
      } catch {}
    }

    draft.full_description = data.description.trim();
    draft.features = featuresJson;
    draft.workflow = workflowJson;
    draft.comparison = comparisonJson;
    draft.updated_at = new Date().toISOString();

    await db
      .prepare("UPDATE extensions SET draft_data = ?, updated_at = DATETIME('now') WHERE id = ? AND developer_id = ?")
      .bind(JSON.stringify(draft), existing.id, data.developerId)
      .run();

    return { id: existing.id, success: true };
  }

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
    .prepare('SELECT * FROM extensions WHERE (id = ? OR slug = ?) AND developer_id = ? LIMIT 1')
    .bind(cleanId || cleanSlug, cleanSlug || cleanId, data.developerId)
    .first<DbExtension>();

  if (!existing) {
    throw new Error('Extension not found or permission denied.');
  }

  const faqsJson = JSON.stringify(data.faqs || []);
  const browsersJson = JSON.stringify(data.supportedBrowsers || []);

  let draft: ExtensionDraftData = {};
  if (existing.draft_data) {
    try {
      draft = JSON.parse(existing.draft_data);
    } catch {}
  }

  // If not publishing, treat as draft save
  if (!data.publish) {
    if (existing.status === 'published') {
      draft.monetag_direct_link = data.monetagUrl.trim();
      draft.ad_frequency = data.frequency || '24h';
      draft.faqs = faqsJson;
      draft.manifest_version = data.manifestVersion || 'v3';
      draft.license = data.license || 'MIT';
      draft.supported_browsers = browsersJson;
      draft.privacy_policy_url = data.privacyPolicyUrl?.trim() || null;
      draft.updated_at = new Date().toISOString();

      await db
        .prepare("UPDATE extensions SET draft_data = ?, updated_at = DATETIME('now') WHERE id = ? AND developer_id = ?")
        .bind(JSON.stringify(draft), existing.id, data.developerId)
        .run();

      return { id: existing.id, success: true };
    }

    // Still in draft status, update columns directly
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

    return { id: existing.id, success: true };
  }

  // ----------------------------------------------------
  // PUBLISH ACTION (publish === true)
  // Promote all draft fields + current specs into live columns!
  // ----------------------------------------------------
  const finalName = draft.name ?? existing.name;
  const finalCategory = draft.category ?? existing.category;
  const finalVersion = draft.current_version ?? existing.current_version;
  const finalManifest = data.manifestVersion || draft.manifest_version || existing.manifest_version || 'v3';
  const finalTagline = draft.short_description ?? existing.short_description;
  const finalGithub = draft.source_repo_url ?? existing.source_repo_url;
  const finalDownload = draft.zip_download_url !== undefined ? draft.zip_download_url : (existing.zip_download_url || existing.crx_download_url);
  const finalEmail = draft.support_email ?? existing.support_email;
  const finalDocs = draft.docs_url !== undefined ? draft.docs_url : existing.docs_url;

  const finalIcon = draft.icon_url ?? existing.icon_url;
  const finalHeader = draft.header_image_url !== undefined ? draft.header_image_url : existing.header_image_url;
  const finalScreenshots = draft.screenshots ?? existing.screenshots;
  const finalYoutube = draft.youtube_video_url !== undefined ? draft.youtube_video_url : existing.youtube_video_url;

  const finalDesc = draft.full_description ?? existing.full_description;
  const finalFeatures = draft.features ?? existing.features;
  const finalWorkflow = draft.workflow ?? existing.workflow;
  const finalComparison = draft.comparison ?? existing.comparison;

  await db
    .prepare(`
      UPDATE extensions
      SET 
        name = ?,
        category = ?,
        current_version = ?,
        manifest_version = ?,
        short_description = ?,
        source_repo_url = ?,
        zip_download_url = ?,
        support_email = ?,
        docs_url = ?,
        icon_url = ?,
        header_image_url = ?,
        screenshots = ?,
        youtube_video_url = ?,
        full_description = ?,
        features = ?,
        workflow = ?,
        comparison = ?,
        monetag_direct_link = ?,
        ad_frequency = ?,
        faqs = ?,
        license = ?,
        supported_browsers = ?,
        privacy_policy_url = ?,
        is_active = 0,
        status = 'pending_review',
        draft_data = NULL,
        updated_at = DATETIME('now')
      WHERE id = ? AND developer_id = ?
    `)
    .bind(
      finalName,
      finalCategory,
      finalVersion,
      finalManifest,
      finalTagline,
      finalGithub,
      finalDownload,
      finalEmail,
      finalDocs,
      finalIcon,
      finalHeader,
      finalScreenshots,
      finalYoutube,
      finalDesc,
      finalFeatures,
      finalWorkflow,
      finalComparison,
      data.monetagUrl.trim(),
      data.frequency || '24h',
      faqsJson,
      data.license || 'MIT',
      browsersJson,
      data.privacyPolicyUrl?.trim() || null,
      existing.id,
      data.developerId
    )
    .run();

  // Update developer website if provided in draft
  if (draft.developer_website?.trim()) {
    await db
      .prepare('UPDATE developers SET website = ? WHERE id = ?')
      .bind(draft.developer_website.trim(), data.developerId)
      .run();
  }

  // Update extension version record in review queue
  await db
    .prepare(`
      UPDATE extension_versions
      SET version = ?, review_status = 'pending', submitted_at = DATETIME('now')
      WHERE extension_id = ?
    `)
    .bind(finalVersion, existing.id)
    .run();

  return { id: existing.id, success: true };
}

export interface TelemetryBatchItem {
  extensionId: string;
  date: string;
  countryCode: string;
  downloads: number;
  pageVisits: number;
  devAdClicks: number;
  extlabsAdClicks: number;
}

/**
 * Flush an aggregated batch of telemetry events to Cloudflare D1 in a single atomic transaction.
 * - Aggregates total downloads per extension to update extensions.download_count
 * - Upserts telemetry_daily with all 4 metrics (downloads, page_visits, dev_ad_clicks, extlabs_ad_clicks)
 * - Executes the entire batch in a single D1 roundtrip (db.batch)
 */
export async function flushTelemetryBatch(
  db: D1Database,
  items: TelemetryBatchItem[]
): Promise<boolean> {
  if (!items || items.length === 0) return true;

  // 0. Resolve any slugs or unconfirmed IDs to valid extensions.id
  const resolvedIds = new Map<string, string>();
  for (const item of items) {
    if (!resolvedIds.has(item.extensionId)) {
      try {
        const ext = await db
          .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
          .bind(item.extensionId, item.extensionId)
          .first<{ id: string }>();
        if (ext?.id) {
          resolvedIds.set(item.extensionId, ext.id);
        }
      } catch {}
    }
  }

  // Filter to items that map to an existing extension in D1
  const validItems: TelemetryBatchItem[] = [];
  for (const item of items) {
    const validId = resolvedIds.get(item.extensionId);
    if (validId) {
      validItems.push({
        ...item,
        extensionId: validId
      });
    }
  }

  if (validItems.length === 0) return true;

  // 1. Group downloads by extensionId for the extensions table increment
  const downloadIncrements = new Map<string, number>();
  for (const item of validItems) {
    if (item.downloads > 0) {
      downloadIncrements.set(
        item.extensionId,
        (downloadIncrements.get(item.extensionId) || 0) + item.downloads
      );
    }
  }

  const statements: any[] = [];

  // 2. Prepare extensions download_count update statements
  for (const [extId, count] of downloadIncrements.entries()) {
    statements.push(
      db
        .prepare(`
          UPDATE extensions
          SET download_count = download_count + ?,
              updated_at = DATETIME('now')
          WHERE id = ?
        `)
        .bind(count, extId)
    );
  }

  // 3. Prepare telemetry_daily upsert statements
  for (const item of validItems) {
    const cleanCountry = (item.countryCode || 'GLOBAL').toUpperCase().slice(0, 8);
    const telemetryId = `tel_${item.extensionId}_${item.date}_${cleanCountry}`;

    statements.push(
      db
        .prepare(`
          INSERT INTO telemetry_daily (
            id,
            extension_id,
            date,
            downloads,
            page_visits,
            dev_ad_clicks,
            extlabs_ad_clicks,
            country_code
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            downloads = downloads + excluded.downloads,
            page_visits = page_visits + excluded.page_visits,
            dev_ad_clicks = dev_ad_clicks + excluded.dev_ad_clicks,
            extlabs_ad_clicks = extlabs_ad_clicks + excluded.extlabs_ad_clicks
        `)
        .bind(
          telemetryId,
          item.extensionId,
          item.date,
          item.downloads,
          item.pageVisits,
          item.devAdClicks,
          item.extlabsAdClicks,
          cleanCountry
        )
    );
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return true;
}

/**
 * Direct record fallback for single download event
 */
export async function recordExtensionDownload(
  db: D1Database,
  extensionIdOrSlug: string,
  countryCode: string = 'GLOBAL'
): Promise<{ success: boolean; extensionId?: string }> {
  if (!extensionIdOrSlug || typeof extensionIdOrSlug !== 'string') {
    return { success: false };
  }

  const ext = await db
    .prepare('SELECT id FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionIdOrSlug, extensionIdOrSlug)
    .first<{ id: string }>();

  if (!ext || !ext.id) {
    return { success: false };
  }

  const today = new Date().toISOString().split('T')[0];
  await flushTelemetryBatch(db, [
    {
      extensionId: ext.id,
      date: today,
      countryCode,
      downloads: 1,
      pageVisits: 0,
      devAdClicks: 0,
      extlabsAdClicks: 0
    }
  ]);

  return { success: true, extensionId: ext.id };
}

export interface SearchExtensionParams {
  query?: string;
  category?: string;
  sort?: 'popular' | 'rating' | 'newest' | 'name' | string;
}

/**
 * Search live store extensions with keyword, category filter, and sorting
 */
export async function searchStoreExtensions(
  db: D1Database | null,
  params: SearchExtensionParams = {}
): Promise<Extension[]> {
  if (!db) return [];
  try {
    const { query = '', category = '', sort = 'popular' } = params;
    const cleanQuery = query.trim().toLowerCase();

    let sql = `
      SELECT 
        e.*, 
        COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name, 
        COALESCE(d.slug, 'developer') AS developer_slug, 
        COALESCE(d.is_verified, 1) AS developer_verified,
        d.website AS developer_website
      FROM extensions e
      LEFT JOIN developers d ON e.developer_id = d.id
      WHERE e.is_active = 1 AND e.is_suspended = 0 AND e.status = 'published'
    `;

    const bindings: any[] = [];

    if (category && category !== 'all') {
      sql += ` AND e.category = ?`;
      bindings.push(category);
    }

    if (cleanQuery) {
      sql += ` AND (
        LOWER(e.name) LIKE ? OR 
        LOWER(e.slug) LIKE ? OR 
        LOWER(e.short_description) LIKE ? OR 
        LOWER(COALESCE(e.full_description, '')) LIKE ? OR 
        LOWER(e.category) LIKE ?
      )`;
      const wildQuery = `%${cleanQuery}%`;
      bindings.push(wildQuery, wildQuery, wildQuery, wildQuery, wildQuery);
    }

    switch (sort) {
      case 'rating':
        sql += ` ORDER BY e.rating DESC, e.review_count DESC, e.weekly_active_users DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY e.created_at DESC, e.id DESC`;
        break;
      case 'name':
        sql += ` ORDER BY e.name ASC`;
        break;
      case 'popular':
      default:
        sql += ` ORDER BY e.is_featured DESC, e.weekly_active_users DESC, e.rating DESC`;
        break;
    }

    const stmt = bindings.length > 0 ? db.prepare(sql).bind(...bindings) : db.prepare(sql);
    const { results } = await stmt.all<ExtensionWithDeveloper>();

    if (results && results.length > 0) {
      return results.map(mapDbExtensionToStoreItem);
    }
  } catch (err) {
    console.warn('Failed to execute searchStoreExtensions on D1:', err);
  }
  return [];
}

export interface PendingReviewExtension {
  id: string;
  slug: string;
  name: string;
  category: string;
  icon_url: string;
  current_version: string;
  short_description: string;
  full_description?: string | null;
  status: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  developer_name: string;
  developer_slug: string;
  developer_verified: boolean;
  developer_website?: string | null;
  source_repo_url?: string | null;
  monetag_direct_link?: string | null;
  support_email?: string | null;
  docs_url?: string | null;
  screenshots?: string[];
  version_id?: string;
  version_name?: string;
  review_status: string;
  package_size_bytes?: number;
  package_zip_url?: string;
  manifest_json?: string;
  permissions?: string[];
  submitted_at: string;
  auditStatus: 'clean' | 'warning';
  auditSummary: string;
}

/**
 * Fetch all extensions pending admin review from Cloudflare D1
 */
export async function getPendingReviewExtensions(db: D1Database | null): Promise<PendingReviewExtension[]> {
  if (!db) return [];
  try {
    const query = `
      SELECT 
        e.id,
        e.slug,
        e.name,
        e.category,
        e.icon_url,
        e.current_version,
        e.short_description,
        e.full_description,
        e.source_repo_url,
        e.monetag_direct_link,
        e.support_email,
        e.docs_url,
        e.screenshots,
        e.status,
        e.is_active,
        e.created_at,
        e.updated_at,
        COALESCE(d.display_name, 'ExtLabs Developer') AS developer_name,
        COALESCE(d.slug, 'developer') AS developer_slug,
        COALESCE(d.is_verified, 0) AS developer_verified,
        d.website AS developer_website,
        ev.id AS version_id,
        ev.version AS version_name,
        ev.review_status,
        ev.package_size_bytes,
        COALESCE(ev.package_zip_url, e.zip_download_url, '') AS package_zip_url,
        ev.manifest_json,
        ev.permissions,
        COALESCE(ev.submitted_at, e.updated_at, e.created_at) AS submitted_at
      FROM extensions e
      LEFT JOIN developers d ON e.developer_id = d.id
      LEFT JOIN (
        SELECT extension_id, id, version, review_status, package_size_bytes, package_zip_url, manifest_json, permissions, submitted_at,
               ROW_NUMBER() OVER (PARTITION BY extension_id ORDER BY submitted_at DESC) as rn
        FROM extension_versions
      ) ev ON e.id = ev.extension_id AND ev.rn = 1
      WHERE (e.status = 'pending_review' OR ev.review_status = 'pending')
        AND e.is_suspended = 0
      ORDER BY COALESCE(ev.submitted_at, e.updated_at, e.created_at) DESC
    `;
    const { results } = await db.prepare(query).all<any>();
    if (!results) return [];

    return results.map((row) => {
      let parsedPerms: string[] = [];
      try {
        if (row.permissions) {
          parsedPerms = typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions;
        }
      } catch {}

      let parsedScreenshots: string[] = [];
      try {
        if (row.screenshots) {
          parsedScreenshots = typeof row.screenshots === 'string' ? JSON.parse(row.screenshots) : row.screenshots;
        }
      } catch {}

      // Analyze permissions for security indicator
      const highRiskPerms = ['<all_urls>', 'webRequestBlocking', 'debugger', 'management', 'nativeMessaging'];
      const hasHighRisk = Array.isArray(parsedPerms) && parsedPerms.some(p => highRiskPerms.includes(p));

      let formattedDate = 'Recently';
      if (row.submitted_at) {
        try {
          const d = new Date(row.submitted_at);
          formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {}
      }

      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        category: (row.category || 'productivity').charAt(0).toUpperCase() + (row.category || 'productivity').slice(1),
        icon_url: row.icon_url || '/icons/extension-placeholder.avif',
        current_version: row.current_version || '1.0.0',
        short_description: row.short_description || '',
        full_description: row.full_description || '',
        status: row.status,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        developer_name: row.developer_name,
        developer_slug: row.developer_slug,
        developer_verified: Boolean(row.developer_verified),
        developer_website: row.developer_website || null,
        source_repo_url: row.source_repo_url || null,
        monetag_direct_link: row.monetag_direct_link || null,
        support_email: row.support_email || null,
        docs_url: row.docs_url || null,
        screenshots: Array.isArray(parsedScreenshots) ? parsedScreenshots : [],
        version_id: row.version_id,
        version_name: row.version_name || row.current_version || '1.0.0',
        review_status: row.review_status || 'pending',
        package_size_bytes: row.package_size_bytes || 0,
        package_zip_url: row.package_zip_url || '',
        manifest_json: row.manifest_json,
        permissions: parsedPerms,
        submitted_at: formattedDate,
        auditStatus: hasHighRisk ? 'warning' : 'clean',
        auditSummary: hasHighRisk ? 'Elevated Permissions' : 'Passed Automated Scan • Clean',
      };
    });
  } catch (err) {
    console.error('Failed to fetch pending review extensions from D1:', err);
    return [];
  }
}

/**
 * Approve an extension for publication to the public directory
 */
export async function approveExtensionReview(
  db: D1Database,
  extensionId: string,
  reviewedByUserId?: string
): Promise<{ success: boolean; slug: string; category: string }> {
  const ext = await db
    .prepare('SELECT id, slug, category FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionId, extensionId)
    .first<{ id: string; slug: string; category: string }>();

  if (!ext) {
    throw new Error('Extension not found.');
  }

  const batchStatements = [
    db.prepare(`
      UPDATE extensions
      SET 
        status = 'published',
        is_active = 1,
        is_suspended = 0,
        published_at = COALESCE(published_at, DATETIME('now')),
        updated_at = DATETIME('now')
      WHERE id = ?
    `).bind(ext.id),

    db.prepare(`
      UPDATE extension_versions
      SET 
        review_status = 'approved',
        reviewed_by = ?,
        reviewed_at = DATETIME('now')
      WHERE extension_id = ?
    `).bind(reviewedByUserId || null, ext.id)
  ];

  await db.batch(batchStatements);

  // Invalidate memory caches
  try {
    clearMemoryCache();
  } catch {}

  return { success: true, slug: ext.slug, category: ext.category };
}

/**
 * Reject an extension submission in the review queue
 */
export async function rejectExtensionReview(
  db: D1Database,
  extensionId: string,
  reason: string = 'Package did not pass ExtLabs security or quality guidelines.',
  reviewedByUserId?: string
): Promise<{ success: boolean; slug: string }> {
  const ext = await db
    .prepare('SELECT id, slug FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
    .bind(extensionId, extensionId)
    .first<{ id: string; slug: string }>();

  if (!ext) {
    throw new Error('Extension not found.');
  }

  const batchStatements = [
    db.prepare(`
      UPDATE extensions
      SET 
        status = 'rejected',
        is_active = 0,
        updated_at = DATETIME('now')
      WHERE id = ?
    `).bind(ext.id),

    db.prepare(`
      UPDATE extension_versions
      SET 
        review_status = 'rejected',
        rejection_reason = ?,
        reviewed_by = ?,
        reviewed_at = DATETIME('now')
      WHERE extension_id = ?
    `).bind(reason, reviewedByUserId || null, ext.id)
  ];

  await db.batch(batchStatements);

  try {
    clearMemoryCache();
  } catch {}

  return { success: true, slug: ext.slug };
}

