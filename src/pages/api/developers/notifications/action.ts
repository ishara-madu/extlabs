import type { APIRoute } from 'astro';
import { getDb, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '../../../../lib/db';
import { getSessionUser } from '../../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      action?: 'mark_read' | 'delete' | 'mark_all_read';
      notificationId?: string;
    };

    const { action, notificationId } = body;

    if (action === 'mark_all_read') {
      let user = (locals as any)?.user;
      if (!user) {
        try {
          user = await getSessionUser(db, request);
        } catch {}
      }
      const ok = await markAllNotificationsAsRead(db, {
        userId: user?.id,
        developerId: (user as any)?.developer_id,
      });
      return new Response(JSON.stringify({ success: ok }), {
        status: ok ? 200 : 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
