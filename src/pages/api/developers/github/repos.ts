// src/pages/api/developers/github/repos.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
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

  try {
    let repos: any[] = [];
    const token = user.github_access_token;

    if (token) {
      // Authenticated GitHub repos request (returns all public & user accessible repos)
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100&type=all', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ExtLabs-Directory',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      });

      if (res.ok) {
        repos = await res.json();
      } else {
        console.warn('Authenticated /user/repos failed with status:', res.status, '- falling back to public repos');
      }
    }

    // Fallback to public repos if token missing or rejected
    if (repos.length === 0) {
      const publicRes = await fetch(`https://api.github.com/users/${encodeURIComponent(user.username)}/repos?sort=updated&per_page=100`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'ExtLabs-Directory',
        },
      });

      if (publicRes.ok) {
        repos = await publicRes.json();
      }
    }

    const formattedRepos = Array.isArray(repos)
      ? repos.map((r: any) => ({
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          description: r.description || '',
          isPrivate: Boolean(r.private),
          defaultBranch: r.default_branch || 'main',
          updatedAt: r.updated_at,
          stargazersCount: r.stargazers_count || 0,
          topics: r.topics || [],
          language: r.language || '',
        }))
      : [];

    return new Response(
      JSON.stringify({
        success: true,
        username: user.username,
        hasToken: Boolean(token),
        count: formattedRepos.length,
        repos: formattedRepos,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'private, no-cache, no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('Error fetching developer GitHub repos:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Failed to fetch repositories.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
