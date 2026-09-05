// src/pages/api/developers/extensions/save-story.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb, getDeveloperByUserIdOrSlug, saveExtensionStory } from '../../../../lib/db';

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
    return new Response(JSON.stringify({ success: false, error: 'Developer account not found.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      slug?: string;
      description?: string;
      features?: any[];
      workflow?: any[];
      comparison?: any[];
    };
    const {
      id,
      slug,
      description,
      features,
      workflow,
      comparison,
    } = body;

    if (!id && !slug) {
      return new Response(JSON.stringify({ success: false, error: 'Extension ID or slug is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Markdown Overview Description (min 100 chars)
    const cleanDescription = (description || '').trim();
    if (!cleanDescription || cleanDescription.length < 100) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Markdown overview description must be at least 100 characters.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate Key Feature Highlights (Min: 3, Max: 6)
    if (!Array.isArray(features) || features.length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'At least 3 key feature highlights are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanFeatures = features.slice(0, 6).map((f: any) => ({
      title: (f?.title || '').trim(),
      description: (f?.description || '').trim(),
    }));

    for (let i = 0; i < cleanFeatures.length; i++) {
      const f = cleanFeatures[i];
      if (!f.title || f.title.length < 4 || f.title.length > 60) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Feature #${i + 1} title must be between 4 and 60 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!f.description || f.description.length < 15 || f.description.length > 180) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Feature #${i + 1} description must be between 15 and 180 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate Internal Execution Workflow (Min: 3, Max: 5)
    if (!Array.isArray(workflow) || workflow.length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'At least 3 internal execution workflow stages are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanWorkflow = workflow.slice(0, 5).map((w: any, idx: number) => ({
      step: typeof w?.step === 'number' ? w.step : idx + 1,
      title: (w?.title || '').trim(),
      description: (w?.description || '').trim(),
    }));

    for (let i = 0; i < cleanWorkflow.length; i++) {
      const w = cleanWorkflow[i];
      if (!w.title || w.title.length < 4 || w.title.length > 60) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Workflow stage #${i + 1} headline must be between 4 and 60 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!w.description || w.description.length < 20 || w.description.length > 200) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Workflow stage #${i + 1} execution details must be between 20 and 200 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Validate Comparison Overview Matrix (Min: 3, Max: 5)
    if (!Array.isArray(comparison) || comparison.length < 3) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'At least 3 comparison overview rows are required.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanComparison = comparison.slice(0, 5).map((c: any) => ({
      feature: (c?.feature || '').trim(),
      current: (c?.current || '').trim(),
      others: (c?.others || '').trim(),
    }));

    for (let i = 0; i < cleanComparison.length; i++) {
      const c = cleanComparison[i];
      if (!c.feature || c.feature.length < 3 || c.feature.length > 40) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Comparison row #${i + 1} metric name must be between 3 and 40 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!c.current || c.current.length < 10 || c.current.length > 100) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Comparison row #${i + 1} advantage details must be between 10 and 100 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (!c.others || c.others.length < 10 || c.others.length > 100) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: `Comparison row #${i + 1} alternative details must be between 10 and 100 characters.` 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Save story, features, workflow, comparison to Cloudflare D1
    const result = await saveExtensionStory(db, {
      id,
      slug,
      developerId: developer.id,
      description: cleanDescription,
      features: cleanFeatures,
      workflow: cleanWorkflow,
      comparison: cleanComparison,
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.id,
      message: 'Store story and SEO metadata saved successfully.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving extension story:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error while saving store story.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
