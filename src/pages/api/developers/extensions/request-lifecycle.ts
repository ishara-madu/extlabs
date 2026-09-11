// src/pages/api/developers/extensions/request-lifecycle.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, createLifecycleRequest, createNotification } from '../../../../lib/db';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await getSessionUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please sign in.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const developer = await getDeveloperByUserIdOrSlug(db, user.id, user.username);
  if (!developer) {
    return new Response(JSON.stringify({ success: false, error: 'Developer account required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      extensionId?: string;
      requestType?: 'unpublish' | 'delete';
      reason?: string;
    };

    const { extensionId, requestType, reason } = body;

    if (!extensionId || typeof extensionId !== 'string' || !extensionId.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Extension ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!requestType || (requestType !== 'unpublish' && requestType !== 'delete')) {
      return new Response(JSON.stringify({ success: false, error: 'Valid request type ("unpublish" or "delete") is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a clear reason (minimum 10 characters) explaining why you are requesting this change.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify developer owns this extension
    const extension = await db
      .prepare(
        `SELECT id, name, slug, status, is_active 
         FROM extensions 
         WHERE (id = ? OR slug = ?) AND developer_id = ? 
         LIMIT 1`
      )
      .bind(extensionId.trim(), extensionId.trim(), developer.id)
      .first<{ id: string; name: string; slug: string; status: string; is_active: number }>();

    if (!extension) {
      return new Response(
        JSON.stringify({ success: false, error: 'Extension not found or you do not have permission to manage it.' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // If requesting unpublish, verify it isn't already unpublished
    if (requestType === 'unpublish' && extension.status === 'draft' && extension.is_active === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'This extension is already unpublished and in draft status.' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const lifecycleReq = await createLifecycleRequest(db, {
      extensionId: extension.id,
      developerId: developer.id,
      requestType,
      reason: reason.trim(),
    });

    // Notify developer in console
    try {
      await createNotification(db, {
        developerId: developer.id,
        extensionId: extension.id,
        type: 'info',
        title: `${requestType === 'unpublish' ? 'Unpublish' : 'Permanent Deletion'} Request Submitted`,
        message: `Your request to ${requestType} "${extension.name}" has been submitted for moderation review. Reason: "${reason.trim().slice(0, 100)}${reason.trim().length > 100 ? '...' : ''}"`,
        actionUrl: `/developers/manage/${extension.slug}`,
        actionLabel: 'View Extension',
        senderName: 'ExtLabs Support',
      });
    } catch (notifErr) {
      console.warn('Failed to send request confirmation notification:', notifErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Your ${requestType} request has been submitted to administrators for review.`,
        request: lifecycleReq,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error submitting lifecycle request:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to submit lifecycle request.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
