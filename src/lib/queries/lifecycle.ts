// src/lib/queries/lifecycle.ts
import type { D1Database } from '@cloudflare/workers-types';

export interface LifecycleRequest {
  id: string;
  extension_id: string;
  developer_id: string;
  request_type: 'unpublish' | 'delete';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string | null;
  reviewed_by?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface LifecycleRequestWithDetails extends LifecycleRequest {
  extension_name: string;
  extension_slug: string;
  extension_icon_url?: string | null;
  extension_version?: string | null;
  extension_category?: string | null;
  extension_status?: string | null;
  weekly_active_users?: number;
  developer_name: string;
  developer_slug: string;
  developer_email?: string | null;
}

/**
 * Submit a new unpublish or delete lifecycle request
 */
export async function createLifecycleRequest(
  db: D1Database,
  params: {
    extensionId: string;
    developerId: string;
    requestType: 'unpublish' | 'delete';
    reason: string;
  }
): Promise<LifecycleRequest> {
  const { extensionId, developerId, requestType, reason } = params;

  // Check if an active pending request of this type already exists
  const existing = await db
    .prepare(
      `SELECT * FROM lifecycle_requests 
       WHERE extension_id = ? AND request_type = ? AND status = 'pending' 
       LIMIT 1`
    )
    .bind(extensionId, requestType)
    .first<LifecycleRequest>();

  if (existing) {
    // Update the existing pending request with new reason
    await db
      .prepare(
        `UPDATE lifecycle_requests 
         SET reason = ?, created_at = DATETIME('now') 
         WHERE id = ?`
      )
      .bind(reason.trim(), existing.id)
      .run();

    return { ...existing, reason: reason.trim() };
  }

  const id = `req_${requestType}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  await db
    .prepare(
      `INSERT INTO lifecycle_requests (id, extension_id, developer_id, request_type, reason, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', DATETIME('now'))`
    )
    .bind(id, extensionId, developerId, requestType, reason.trim())
    .run();

  return {
    id,
    extension_id: extensionId,
    developer_id: developerId,
    request_type: requestType,
    reason: reason.trim(),
    status: 'pending',
    admin_notes: null,
    reviewed_by: null,
    created_at: now,
    reviewed_at: null,
  };
}

/**
 * Fetch all active pending requests for an extension
 */
export async function getActiveLifecycleRequestsForExtension(
  db: D1Database,
  extensionId: string
): Promise<LifecycleRequest[]> {
  const { results } = await db
    .prepare(
      `SELECT * FROM lifecycle_requests 
       WHERE extension_id = ? AND status = 'pending' 
       ORDER BY created_at DESC`
    )
    .bind(extensionId)
    .all<LifecycleRequest>();

  return results || [];
}

/**
 * Fetch pending lifecycle requests joined with extension and developer details
 */
export async function getPendingLifecycleRequests(
  db: D1Database,
  requestType?: 'unpublish' | 'delete'
): Promise<LifecycleRequestWithDetails[]> {
  let query = `
    SELECT 
      lr.*,
      e.name AS extension_name,
      e.slug AS extension_slug,
      e.icon_url AS extension_icon_url,
      e.current_version AS extension_version,
      e.category AS extension_category,
      e.status AS extension_status,
      e.weekly_active_users AS weekly_active_users,
      d.display_name AS developer_name,
      d.slug AS developer_slug,
      e.support_email AS developer_email
    FROM lifecycle_requests lr
    JOIN extensions e ON lr.extension_id = e.id
    JOIN developers d ON lr.developer_id = d.id
    WHERE lr.status = 'pending'
  `;

  const bindings: any[] = [];
  if (requestType) {
    query += ` AND lr.request_type = ?`;
    bindings.push(requestType);
  }

  query += ` ORDER BY lr.created_at ASC`;

  const { results } = await db.prepare(query).bind(...bindings).all<LifecycleRequestWithDetails>();
  return results || [];
}

/**
 * Approve a lifecycle request (Unpublish or Delete)
 */
export async function approveLifecycleRequest(
  db: D1Database,
  params: {
    requestId: string;
    adminUserId?: string;
    adminNotes?: string;
  }
): Promise<{
  success: boolean;
  request: LifecycleRequest;
  extensionId: string;
  extensionSlug: string;
  extensionName: string;
  developerId: string;
  requestType: 'unpublish' | 'delete';
}> {
  const { requestId, adminUserId, adminNotes } = params;

  const reqRow = await db
    .prepare(
      `SELECT lr.*, e.name AS extension_name, e.slug AS extension_slug, e.category AS extension_category
       FROM lifecycle_requests lr
       JOIN extensions e ON lr.extension_id = e.id
       WHERE lr.id = ? AND lr.status = 'pending'
       LIMIT 1`
    )
    .bind(requestId)
    .first<LifecycleRequest & { extension_name: string; extension_slug: string; extension_category: string }>();

  if (!reqRow) {
    throw new Error('Pending lifecycle request not found.');
  }

  const reviewedAt = new Date().toISOString();

  if (reqRow.request_type === 'unpublish') {
    // Unpublish: set status to 'draft', is_active = 0
    await db
      .prepare(
        `UPDATE extensions 
         SET status = 'draft', is_active = 0, updated_at = DATETIME('now')
         WHERE id = ?`
      )
      .bind(reqRow.extension_id)
      .run();

    // Mark request approved
    await db
      .prepare(
        `UPDATE lifecycle_requests 
         SET status = 'approved', admin_notes = ?, reviewed_by = ?, reviewed_at = DATETIME('now')
         WHERE id = ?`
      )
      .bind(adminNotes?.trim() || null, adminUserId || null, requestId)
      .run();
  } else if (reqRow.request_type === 'delete') {
    // Permanent deletion: Mark request approved first
    await db
      .prepare(
        `UPDATE lifecycle_requests 
         SET status = 'approved', admin_notes = ?, reviewed_by = ?, reviewed_at = DATETIME('now')
         WHERE id = ?`
      )
      .bind(adminNotes?.trim() || null, adminUserId || null, requestId)
      .run();

    // Delete extension (foreign keys cascade versions, reviews, notifications, etc.)
    await db
      .prepare(`DELETE FROM extensions WHERE id = ?`)
      .bind(reqRow.extension_id)
      .run();
  }

  return {
    success: true,
    request: {
      ...reqRow,
      status: 'approved',
      admin_notes: adminNotes?.trim() || null,
      reviewed_by: adminUserId || null,
      reviewed_at: reviewedAt,
    },
    extensionId: reqRow.extension_id,
    extensionSlug: reqRow.extension_slug,
    extensionName: reqRow.extension_name,
    developerId: reqRow.developer_id,
    requestType: reqRow.request_type,
  };
}

/**
 * Reject a lifecycle request
 */
export async function rejectLifecycleRequest(
  db: D1Database,
  params: {
    requestId: string;
    adminUserId?: string;
    adminNotes: string;
  }
): Promise<{
  success: boolean;
  request: LifecycleRequest;
  extensionId: string;
  extensionSlug: string;
  extensionName: string;
  developerId: string;
  requestType: 'unpublish' | 'delete';
}> {
  const { requestId, adminUserId, adminNotes } = params;

  const reqRow = await db
    .prepare(
      `SELECT lr.*, e.name AS extension_name, e.slug AS extension_slug
       FROM lifecycle_requests lr
       JOIN extensions e ON lr.extension_id = e.id
       WHERE lr.id = ? AND lr.status = 'pending'
       LIMIT 1`
    )
    .bind(requestId)
    .first<LifecycleRequest & { extension_name: string; extension_slug: string }>();

  if (!reqRow) {
    throw new Error('Pending lifecycle request not found.');
  }

  const reviewedAt = new Date().toISOString();

  await db
    .prepare(
      `UPDATE lifecycle_requests 
       SET status = 'rejected', admin_notes = ?, reviewed_by = ?, reviewed_at = DATETIME('now')
       WHERE id = ?`
    )
    .bind(adminNotes.trim(), adminUserId || null, requestId)
    .run();

  return {
    success: true,
    request: {
      ...reqRow,
      status: 'rejected',
      admin_notes: adminNotes.trim(),
      reviewed_by: adminUserId || null,
      reviewed_at: reviewedAt,
    },
    extensionId: reqRow.extension_id,
    extensionSlug: reqRow.extension_slug,
    extensionName: reqRow.extension_name,
    developerId: reqRow.developer_id,
    requestType: reqRow.request_type,
  };
}
