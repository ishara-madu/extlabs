// src/pages/api/extensions/review.ts
import type { APIRoute } from 'astro';
import { getDb, submitExtensionReview, deleteExtensionReview } from '../../../lib/db';
import { getReviewerUser } from '../../../lib/auth';

export const prerender = false;

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

  // 2. Parse and validate payload
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
