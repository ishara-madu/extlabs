// src/pages/api/admin/extensions/review.ts
import type { APIRoute } from 'astro';
import { getDb, createNotification } from '../../../../lib/db';
import { approveExtensionReview, rejectExtensionReview, getDeveloperExtensionDetail } from '../../../../lib/queries/extensions';
import { purgeExtensionStoreCache } from '../../../../lib/cache-purge';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: 'Database connection unavailable' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      extensionId?: string;
      action?: 'approve' | 'reject';
      reason?: string;
    };

    const { extensionId, action, reason } = body;

    if (!extensionId || typeof extensionId !== 'string' || !extensionId.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Extension ID is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return new Response(JSON.stringify({ success: false, error: 'Valid action ("approve" or "reject") is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (action === 'approve') {
      const result = await approveExtensionReview(db, extensionId.trim());

      // Invalidate Edge CDN cache so the approved extension is instantly live
      try {
        await purgeExtensionStoreCache(request, {
          extensionId: extensionId.trim(),
          extensionSlug: result.slug,
          category: result.category,
        });
      } catch (purgeErr) {
        console.warn('Cache purge after approval failed non-critically:', purgeErr);
      }

      // Automatically create a success notification for the extension
      try {
        await createNotification(db, {
          extensionId: extensionId.trim(),
          developerId: result.developer_id,
          type: 'success',
          title: 'Extension Approved & Published Live',
          message: `Great news! "${result.name}" has passed moderation review and is now live on the ExtLabs Store.`,
          actionUrl: `/extension/${result.id}`,
          actionLabel: 'View Live Listing',
          senderName: 'ExtLabs Review Team',
        });
      } catch (notifErr) {
        console.warn('Failed to insert approval notification:', notifErr);
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'approve',
        message: 'Extension approved and published to the live directory successfully.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      const rejectionReason = reason?.trim() || 'Package did not pass ExtLabs security or quality guidelines.';
      const extDetails = await getDeveloperExtensionDetail(db, extensionId.trim());
      await rejectExtensionReview(db, extensionId.trim(), rejectionReason);

      // Automatically create an error/warning notification for the extension
      try {
        await createNotification(db, {
          extensionId: extensionId.trim(),
          developerId: extDetails?.developer_id,
          type: 'error',
          title: 'Review Audit Feedback: Action Required',
          message: `Moderation notice for "${extDetails?.name || 'your extension'}": ${rejectionReason}`,
          actionUrl: `/developers/manage/${extDetails?.slug || extensionId.trim()}/edit`,
          actionLabel: 'Edit & Resubmit',
          senderName: 'ExtLabs Review Team',
        });
      } catch (notifErr) {
        console.warn('Failed to insert rejection notification:', notifErr);
      }

      return new Response(JSON.stringify({
        success: true,
        action: 'reject',
        message: 'Extension rejected and kept unlisted.',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error: any) {
    console.error('Error in admin extension review:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error processing extension review.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
