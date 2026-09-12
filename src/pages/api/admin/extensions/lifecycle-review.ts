// src/pages/api/admin/extensions/lifecycle-review.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, createNotification, getExtensionById } from '../../../../lib/db';
import { approveLifecycleRequest, rejectLifecycleRequest } from '../../../../lib/queries/lifecycle';
import { purgeExtensionStoreCache } from '../../../../lib/cache-purge';
import { deleteFromCloudinary, extractCloudinaryPublicId } from '../../../../lib/cloudinary';

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
  if (!user || !['super_admin', 'moderator', 'security_auditor'].includes(user.role)) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Staff privileges required.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      requestId?: string;
      action?: 'approve' | 'reject';
      adminReason?: string;
    };

    const { requestId, action, adminReason } = body;

    if (!requestId || typeof requestId !== 'string' || !requestId.trim()) {
      return new Response(JSON.stringify({ success: false, error: 'Request ID is required.' }), {
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

    if (action === 'reject' && (!adminReason || typeof adminReason !== 'string' || !adminReason.trim())) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please provide a reason explaining why the request was rejected.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'approve') {
      const result = await approveLifecycleRequest(db, {
        requestId: requestId.trim(),
        adminUserId: user.id,
        adminNotes: adminReason?.trim(),
      });

      // Purge Edge CDN cache if unpublishing
      if (result.requestType === 'unpublish') {
        try {
          await purgeExtensionStoreCache(request, {
            extensionId: result.extensionId,
            extensionSlug: result.extensionSlug,
          });
        } catch (purgeErr) {
          console.warn('Cache purge after unpublish failed non-critically:', purgeErr);
        }

        // Notify developer
        try {
          await createNotification(db, {
            developerId: result.developerId,
            extensionId: result.extensionId,
            type: 'warning',
            title: 'Extension Unpublished by Moderation',
            message: `Your request to unpublish "${result.extensionName}" was approved. The extension is now offline and hidden from public store visitors.`,
            actionUrl: `/developers/manage/${result.extensionSlug}`,
            actionLabel: 'Manage Extension',
            senderName: 'ExtLabs Admin Team',
          });
        } catch (notifErr) {
          console.warn('Failed to send unpublish notification:', notifErr);
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'approve',
            requestType: 'unpublish',
            message: `"${result.extensionName}" has been successfully unpublished and set to draft.`,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        // Deletion approved: Purge extension assets from Cloudinary
        try {
          const extToPurge = await getExtensionById(db, result.extensionId, { allowDraft: true });
          if (extToPurge) {
            if (extToPurge.icon_url) {
              const pid = extractCloudinaryPublicId(extToPurge.icon_url);
              if (pid) deleteFromCloudinary(pid).catch(() => {});
            }
            if (extToPurge.header_image_url) {
              const pid = extractCloudinaryPublicId(extToPurge.header_image_url);
              if (pid) deleteFromCloudinary(pid).catch(() => {});
            }
            if (extToPurge.screenshots && Array.isArray(extToPurge.screenshots)) {
              for (const s of extToPurge.screenshots) {
                if (typeof s === 'string') {
                  const pid = extractCloudinaryPublicId(s);
                  if (pid) deleteFromCloudinary(pid).catch(() => {});
                }
              }
            }
          }
        } catch (cloudErr) {
          console.warn('Failed to clean up Cloudinary assets upon extension deletion:', cloudErr);
        }

        // Notify developer
        try {
          await createNotification(db, {
            developerId: result.developerId,
            extensionId: null, // Extension is deleted
            type: 'error',
            title: 'Extension Permanently Deleted',
            message: `Your request to permanently delete "${result.extensionName}" was approved by administrators. The package and all associated files have been erased.`,
            actionUrl: '/developers/dashboard',
            actionLabel: 'Developer Dashboard',
            senderName: 'ExtLabs Admin Team',
          });
        } catch (notifErr) {
          console.warn('Failed to send delete notification:', notifErr);
        }

        return new Response(
          JSON.stringify({
            success: true,
            action: 'approve',
            requestType: 'delete',
            message: `"${result.extensionName}" has been permanently deleted from ExtLabs.`,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } else {
      // Rejection
      const result = await rejectLifecycleRequest(db, {
        requestId: requestId.trim(),
        adminUserId: user.id,
        adminNotes: adminReason!.trim(),
      });

      try {
        await createNotification(db, {
          developerId: result.developerId,
          extensionId: result.extensionId,
          type: 'info',
          title: `${result.requestType === 'unpublish' ? 'Unpublish' : 'Deletion'} Request Declined`,
          message: `Your request to ${result.requestType} "${result.extensionName}" was declined by moderation. Reason: "${adminReason!.trim()}"`,
          actionUrl: `/developers/manage/${result.extensionSlug}`,
          actionLabel: 'View Extension',
          senderName: 'ExtLabs Admin Team',
        });
      } catch (notifErr) {
        console.warn('Failed to send decline notification:', notifErr);
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'reject',
          requestType: result.requestType,
          message: `The ${result.requestType} request for "${result.extensionName}" was declined.`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (err: any) {
    console.error('Error reviewing lifecycle request:', err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to process lifecycle review action.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
