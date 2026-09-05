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
      // Authenticated GitHub repos request (returns all public & private user repos)
      // Note: 'type' parameter cannot be combined with 'visibility' or 'affiliation' per GitHub REST API specs
      const res = await fetch('https://api.github.com/user/repos?sort=updated&direction=desc&per_page=100&visibility=all&affiliation=owner,collaborator,organization_member', {
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
        const errBody = await res.text();
        console.error(`Authenticated /user/repos failed with status ${res.status}:`, errBody);
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

    // Keywords indicating a browser extension repository
    const EXT_TOPIC_KEYWORDS = [
      'chrome-extension',
      'browser-extension',
      'webextension',
      'firefox-addon',
      'safari-extension',
      'edge-extension',
      'extension',
      'manifest-v3',
      'mv3',
    ];
    const EXT_NAME_KEYWORDS = [
      'extension',
      'chrome-ext',
      'web-ext',
      'browser-ext',
      '-ext',
      '_ext',
      'addon',
    ];

    const authHeaders: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ExtLabs-Directory',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Helper to check manifest.json existence in repository
    async function repoHasManifest(owner: string, repoName: string, branch: string): Promise<boolean> {
      const candidatePaths = ['manifest.json', 'src/manifest.json', 'public/manifest.json', 'extension/manifest.json'];
      for (const p of candidatePaths) {
        try {
          const res = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/contents/${p}?ref=${encodeURIComponent(branch)}`,
            { headers: authHeaders }
          );
          if (res.ok) return true;
        } catch {}
      }
      return false;
    }

    // Process repositories and identify actual browser extensions
    const formattedRepos = await Promise.all(
      (Array.isArray(repos) ? repos : []).map(async (r: any) => {
        const topics: string[] = Array.isArray(r.topics) ? r.topics.map((t: string) => t.toLowerCase()) : [];
        const nameLower = (r.name || '').toLowerCase();
        const descLower = (r.description || '').toLowerCase();

        // 1. Fast heuristic from metadata
        const hasTopic = topics.some((t) => EXT_TOPIC_KEYWORDS.includes(t));
        const hasName = EXT_NAME_KEYWORDS.some((kw) => nameLower.includes(kw));
        const hasDesc = descLower.includes('chrome extension') || descLower.includes('browser extension') || descLower.includes('manifest v3');

        let isExtension = hasTopic || hasName || hasDesc;

        // 2. If not detected by name/topic, check if manifest.json exists in repo contents
        if (!isExtension) {
          const owner = r.owner?.login || r.full_name?.split('/')[0] || user.username;
          const branch = r.default_branch || 'main';
          isExtension = await repoHasManifest(owner, r.name, branch);
        }

        return {
          name: r.name,
          fullName: r.full_name,
          url: r.html_url,
          description: r.description || '',
          isPrivate: Boolean(r.private),
          isExtension,
          defaultBranch: r.default_branch || 'main',
          updatedAt: r.updated_at,
          stargazersCount: r.stargazers_count || 0,
          topics: r.topics || [],
          language: r.language || '',
        };
      })
    );

    const extensionRepos = formattedRepos.filter((r) => r.isExtension);
    const hasExtensions = extensionRepos.length > 0;

    return new Response(
      JSON.stringify({
        success: true,
        username: user.username,
        hasToken: Boolean(token),
        count: hasExtensions ? extensionRepos.length : formattedRepos.length,
        totalCount: formattedRepos.length,
        extensionCount: extensionRepos.length,
        // Default to real extensions if any exist, or all repos if no extensions were identified yet
        repos: hasExtensions ? extensionRepos : formattedRepos,
        allRepos: formattedRepos,
        isFiltered: hasExtensions && extensionRepos.length < formattedRepos.length,
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
