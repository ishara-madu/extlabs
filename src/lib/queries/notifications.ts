// src/lib/queries/notifications.ts
import type { D1Database } from '@cloudflare/workers-types';
import type { DbNotification } from '../db';

/**
 * Get the single latest notification specifically targeted to a given extension.
 * Used for the top banner alert on the Extension Manage workstation.
 */
export async function getLatestExtensionNotification(
  db: D1Database,
  extensionId: string
): Promise<DbNotification | null> {
  if (!db || !extensionId) return null;

  try {
    const result = await db
      .prepare(
        `SELECT 
          n.id,
          n.user_id,
          n.developer_id,
          n.extension_id,
          n.title,
          n.message,
          n.type,
          n.action_url,
          n.action_label,
          n.is_read,
          n.sender_name,
          n.sender_avatar_url,
          n.created_at,
          e.name as extension_name,
          e.icon_url as extension_icon_url,
          e.slug as extension_slug
        FROM notifications n
        LEFT JOIN extensions e ON n.extension_id = e.id
        WHERE n.extension_id = ?
        ORDER BY n.created_at DESC
        LIMIT 1`
      )
      .bind(extensionId)
      .first<DbNotification>();

    return result || null;
  } catch (error) {
    console.error(`Error querying latest notification for extension ${extensionId}:`, error);
    return null;
  }
}

/**
 * Get recent notifications for a developer / user (or general system-wide announcements).
 * Used for the Developer Console navigation bar bell dropdown.
 */
export async function getDeveloperNotifications(
  db: D1Database,
  options: {
    developerId?: string | null;
    userId?: string | null;
    limit?: number;
  } = {}
): Promise<DbNotification[]> {
  if (!db) return [];

  const { developerId, userId, limit = 20 } = options;

  try {
    let query = `
      SELECT 
        n.id,
        n.user_id,
        n.developer_id,
        n.extension_id,
        n.title,
        n.message,
        n.type,
        n.action_url,
        n.action_label,
        n.is_read,
        n.sender_name,
        n.sender_avatar_url,
        n.created_at,
        e.name as extension_name,
        e.icon_url as extension_icon_url,
        e.slug as extension_slug
      FROM notifications n
      LEFT JOIN extensions e ON n.extension_id = e.id
      WHERE 
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    if (userId && developerId) {
      conditions.push(`(n.user_id = ? OR n.developer_id = ? OR n.developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (n.user_id IS NULL AND n.developer_id IS NULL))`);
      params.push(userId, developerId, userId);
    } else if (userId) {
      conditions.push(`(n.user_id = ? OR n.developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (n.user_id IS NULL AND n.developer_id IS NULL))`);
      params.push(userId, userId);
    } else if (developerId) {
      conditions.push(`(n.developer_id = ? OR (n.user_id IS NULL AND n.developer_id IS NULL))`);
      params.push(developerId);
    } else {
      // General announcements
      conditions.push(`(n.user_id IS NULL AND n.developer_id IS NULL)`);
    }

    query += conditions.join(' AND ');
    query += ` ORDER BY n.created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await db.prepare(query).bind(...params).all<DbNotification>();
    return results || [];
  } catch (error) {
    console.error('Error querying developer notifications:', error);
    return [];
  }
}

/**
 * Get unread notification count for a developer / user.
 */
export async function getUnreadNotificationCount(
  db: D1Database,
  options: {
    developerId?: string | null;
    userId?: string | null;
  } = {}
): Promise<number> {
  if (!db) return 0;

  const { developerId, userId } = options;

  try {
    let query = `
      SELECT COUNT(*) as count
      FROM notifications
      WHERE is_read = 0 AND 
    `;

    const params: any[] = [];

    if (userId && developerId) {
      query += `(user_id = ? OR developer_id = ? OR developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(userId, developerId, userId);
    } else if (userId) {
      query += `(user_id = ? OR developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(userId, userId);
    } else if (developerId) {
      query += `(developer_id = ? OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(developerId);
    } else {
      query += `(user_id IS NULL AND developer_id IS NULL)`;
    }

    const res = await db.prepare(query).bind(...params).first<{ count: number }>();
    return res?.count ?? 0;
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }
}

/**
 * Create a new notification record.
 */
export async function createNotification(
  db: D1Database,
  notification: {
    id?: string;
    userId?: string | null;
    developerId?: string | null;
    extensionId?: string | null;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success' | 'announcement';
    actionUrl?: string | null;
    actionLabel?: string | null;
    senderName?: string;
    senderAvatarUrl?: string | null;
  }
): Promise<DbNotification> {
  const notifId = notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const notifType = notification.type || 'info';
  const senderName = notification.senderName || 'ExtLabs Review Team';
  const senderAvatar = notification.senderAvatarUrl || '/icons/github-profile-placeholder.avif';

  await db
    .prepare(
      `INSERT INTO notifications (
        id,
        user_id,
        developer_id,
        extension_id,
        title,
        message,
        type,
        action_url,
        action_label,
        is_read,
        sender_name,
        sender_avatar_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, DATETIME('now'))`
    )
    .bind(
      notifId,
      notification.userId ?? null,
      notification.developerId ?? null,
      notification.extensionId ?? null,
      notification.title,
      notification.message,
      notifType,
      notification.actionUrl ?? null,
      notification.actionLabel ?? null,
      senderName,
      senderAvatar
    )
    .run();

  return {
    id: notifId,
    user_id: notification.userId ?? null,
    developer_id: notification.developerId ?? null,
    extension_id: notification.extensionId ?? null,
    title: notification.title,
    message: notification.message,
    type: notifType,
    action_url: notification.actionUrl ?? null,
    action_label: notification.actionLabel ?? null,
    is_read: 0,
    sender_name: senderName,
    sender_avatar_url: senderAvatar,
    created_at: new Date().toISOString()
  };
}

/**
 * Mark a notification as read.
 */
export async function markNotificationAsRead(
  db: D1Database,
  notificationId: string
): Promise<boolean> {
  if (!db || !notificationId) return false;

  try {
    await db
      .prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`)
      .bind(notificationId)
      .run();
    return true;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return false;
  }
}

/**
 * Delete / dismiss a notification permanently.
 */
export async function deleteNotification(
  db: D1Database,
  notificationId: string
): Promise<boolean> {
  if (!db || !notificationId) return false;

  try {
    await db
      .prepare(`DELETE FROM notifications WHERE id = ?`)
      .bind(notificationId)
      .run();
    return true;
  } catch (error) {
    console.error(`Error deleting notification ${notificationId}:`, error);
    return false;
  }
}

/**
 * Mark all unread notifications as read for a developer / user.
 */
export async function markAllNotificationsAsRead(
  db: D1Database,
  options: {
    developerId?: string | null;
    userId?: string | null;
  } = {}
): Promise<boolean> {
  if (!db) return false;

  const { developerId, userId } = options;

  try {
    let query = `UPDATE notifications SET is_read = 1 WHERE is_read = 0 AND `;
    const params: any[] = [];

    if (userId && developerId) {
      query += `(user_id = ? OR developer_id = ? OR developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(userId, developerId, userId);
    } else if (userId) {
      query += `(user_id = ? OR developer_id IN (SELECT id FROM developers WHERE user_id = ?) OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(userId, userId);
    } else if (developerId) {
      query += `(developer_id = ? OR (user_id IS NULL AND developer_id IS NULL))`;
      params.push(developerId);
    } else {
      query += `(user_id IS NULL AND developer_id IS NULL)`;
    }

    await db.prepare(query).bind(...params).run();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}
