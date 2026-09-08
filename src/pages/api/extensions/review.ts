import type { APIRoute } from 'astro';
import { getDb, submitExtensionReview, deleteExtensionReview } from '../../../lib/db';
import { getReviewerUser } from '../../../lib/auth';
import { purgeExtensionStoreCache } from '../../../lib/cache-purge';

export const prerender = false;

// In-memory rate limiting map: userId -> last submission timestamp (20s cooldown)
const reviewCooldownMap = new Map<string, number>();
const REVIEW_COOLDOWN_MS = 20 * 1000;

function checkReviewRateLimit(userId: string): { limited: boolean; remainingSec: number } {
  const now = Date.now();
  const lastTime = reviewCooldownMap.get(userId);
  if (lastTime && (now - lastTime) < REVIEW_COOLDOWN_MS) {
    const remainingSec = Math.ceil((REVIEW_COOLDOWN_MS - (now - lastTime)) / 1000);
    return { limited: true, remainingSec };
  }
  reviewCooldownMap.set(userId, now);
  // Clean up expired entries if map gets large
  if (reviewCooldownMap.size > 500) {
    for (const [id, time] of reviewCooldownMap.entries()) {
      if (now - time > REVIEW_COOLDOWN_MS * 3) {
        reviewCooldownMap.delete(id);
      }
    }
  }
  return { limited: false, remainingSec: 0 };
}

export const POST: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database connection unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Verify user session - strictly requires Google authentication
  const user = await getReviewerUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Please sign in with your Google account to submit a rating and review.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 2. Cooldown Rate-Limit Guard (Prevents write burst attacks on D1)
  const rateCheck = checkReviewRateLimit(user.id);
  if (rateCheck.limited) {
    return new Response(
      JSON.stringify({ error: `Please wait ${rateCheck.remainingSec}s before submitting or updating another review.` }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 3. Parse and validate payload
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { extensionId, rating, title, comment } = body;

  if (!extensionId || typeof extensionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Extension ID is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const numericRating = Math.round(Number(rating));
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return new Response(JSON.stringify({ error: 'Rating must be an integer between 1 and 5 stars.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const trimmedComment = typeof comment === 'string' ? comment.trim() : '';
  if (!trimmedComment || trimmedComment.length < 3) {
    return new Response(JSON.stringify({ error: 'Review comment must be at least 3 characters long.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (trimmedComment.length > 2000) {
    return new Response(JSON.stringify({ error: 'Review comment must not exceed 2000 characters.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const trimmedTitle = typeof title === 'string' ? title.trim().slice(0, 120) : '';

  try {
    const result = await submitExtensionReview(db, {
      extensionId,
      userId: user.id,
      rating: numericRating,
      title: trimmedTitle,
      comment: trimmedComment,
    });

    // On-demand Cache Purge: Invalidate Edge CDN cache so new rating and review appear immediately
    try {
      const ext = await db
        .prepare('SELECT id, slug, category FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
        .bind(extensionId, extensionId)
        .first<{ id: string; slug: string; category: string }>();
      if (ext) {
        await purgeExtensionStoreCache(request, {
          extensionId: ext.id,
          extensionSlug: ext.slug,
          category: ext.category,
        });
      }
    } catch (purgeErr) {
      console.warn('Cache purge after review submission failed non-critically:', purgeErr);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error submitting review:', err);
    return new Response(JSON.stringify({ error: 'Failed to submit review. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  const db = getDb();
  if (!db) {
    return new Response(JSON.stringify({ error: 'Database connection unavailable.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Verify user session - strictly requires Google authentication
  const user = await getReviewerUser(db, request);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Please sign in with your Google account to delete your review.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { extensionId } = body;
  if (!extensionId || typeof extensionId !== 'string') {
    return new Response(JSON.stringify({ error: 'Extension ID is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await deleteExtensionReview(db, extensionId, user.id);

    // On-demand Cache Purge: Invalidate Edge CDN cache so deleted review reflects immediately
    try {
      const ext = await db
        .prepare('SELECT id, slug, category FROM extensions WHERE id = ? OR slug = ? LIMIT 1')
        .bind(extensionId, extensionId)
        .first<{ id: string; slug: string; category: string }>();
      if (ext) {
        await purgeExtensionStoreCache(request, {
          extensionId: ext.id,
          extensionSlug: ext.slug,
          category: ext.category,
        });
      }
    } catch (purgeErr) {
      console.warn('Cache purge after review deletion failed non-critically:', purgeErr);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error deleting review:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete review.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
