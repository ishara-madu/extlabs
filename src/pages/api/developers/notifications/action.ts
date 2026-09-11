// src/pages/api/developers/notifications/action.ts
import type { APIRoute } from 'astro';
import { getDb, markNotificationAsRead, deleteNotification } from '../../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      action?: 'mark_read' | 'delete';
      notificationId?: string;
    };

    const { action, notificationId } = body;

    if (!notificationId || typeof notificationId !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'Notification ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const ok = await deleteNotification(db, notificationId);
      return new Response(JSON.stringify({ success: ok }), {
        status: ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    } else if (action === 'mark_read') {
      const ok = await markNotificationAsRead(db, notificationId);
      return new Response(JSON.stringify({ success: ok }), {
        status: ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Invalid action.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error handling notification action:', error);
    return new Response(JSON.stringify({ success: false, error: error.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
