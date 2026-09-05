// src/pages/api/developers/github/fetch-repo.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';

export const prerender = false;

interface GitHubRepoInfo {
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  default_branch: string;
  license?: { spdx_id?: string; key?: string; name?: string } | null;
  topics?: string[];
}

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
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Please sign in to import repositories.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = (await request.json()) as { repoUrl?: string };
    const rawUrl = body.repoUrl?.trim() || '';

    if (!rawUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Repository URL is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse owner and repo from URL (e.g., https://github.com/owner/repo or owner/repo)
    let cleanPath = rawUrl
      .replace(/^https?:\/\/github\.com\//i, '')
      .replace(/\.git$/i, '')
      .replace(/^\/+|\/+$/g, '');

    const parts = cleanPath.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Please enter a valid GitHub repository URL (e.g. https://github.com/username/extension-name).',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const owner = parts[0];
    const repo = parts[1];

    // Strict Account Ownership Check:
    // Only allow importing repositories belonging to the logged-in user's GitHub username
    if (owner.toLowerCase() !== user.username.toLowerCase()) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Access Denied: You can only import repositories from your own connected GitHub account (@${user.username}).`,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    const token = user?.github_access_token;

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ExtLabs-Directory',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // 1. Fetch Repository Metadata
    const repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers });
    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Repository "${owner}/${repo}" was not found or is private without authorized access.`,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: `GitHub API error: HTTP ${repoRes.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const repoInfo = (await repoRes.json()) as GitHubRepoInfo;
    const defaultBranch = repoInfo.default_branch || 'main';

    // 2. Fetch manifest.json (try root, src/, public/)
    let manifestData: any = null;
    const manifestPaths = ['manifest.json', 'src/manifest.json', 'public/manifest.json', 'extension/manifest.json'];

    for (const mPath of manifestPaths) {
      try {
        const mRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${mPath}?ref=${encodeURIComponent(defaultBranch)}`,
          { headers }
        );
        if (mRes.ok) {
          const mJson = (await mRes.json()) as { content?: string; encoding?: string };
          if (mJson.content && mJson.encoding === 'base64') {
            const rawContent = atob(mJson.content.replace(/\s/g, ''));
            manifestData = JSON.parse(rawContent);
            break;
          }
        }
      } catch {}
    }

    // 3. Fetch README (if present)
    let readmeText = '';
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme?ref=${encodeURIComponent(defaultBranch)}`,
        { headers }
      );
      if (readmeRes.ok) {
        const rmJson = (await readmeRes.json()) as { content?: string; encoding?: string };
        if (rmJson.content && rmJson.encoding === 'base64') {
          readmeText = decodeURIComponent(escape(atob(rmJson.content.replace(/\s/g, ''))));
        }
      }
    } catch {}

    // Derive name and clean title
    const rawName = manifestData?.name || repoInfo.name || repo;
    const cleanName = rawName
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
      .trim();

    // Derive slug
    const cleanSlug = (repoInfo.name || repo)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Derive version
    const cleanVersion = manifestData?.version || '1.0.0';

    // Derive Category
    const topics = repoInfo.topics || [];
    let detectedCategory = 'productivity';
    const textCorpus = `${rawName} ${repoInfo.description || ''} ${topics.join(' ')} ${manifestData?.description || ''}`.toLowerCase();
    if (textCorpus.includes('ai') || textCorpus.includes('gpt') || textCorpus.includes('llm') || textCorpus.includes('copilot')) {
      detectedCategory = 'ai';
    } else if (textCorpus.includes('dev') || textCorpus.includes('code') || textCorpus.includes('git') || textCorpus.includes('json') || textCorpus.includes('api')) {
      detectedCategory = 'dev';
    } else if (textCorpus.includes('privacy') || textCorpus.includes('security') || textCorpus.includes('cookie') || textCorpus.includes('guard')) {
      detectedCategory = 'privacy';
    } else if (textCorpus.includes('tool') || textCorpus.includes('download') || textCorpus.includes('utility') || textCorpus.includes('reader')) {
      detectedCategory = 'utilities';
    }

    // Derive Tagline (Short description)
    let tagline = manifestData?.description || repoInfo.description || '';
    if (!tagline || tagline.length < 10) {
      tagline = `High-performance, privacy-conscious Chromium extension for modern web productivity.`;
    } else if (tagline.length > 120) {
      tagline = tagline.slice(0, 117) + '...';
    }

    // Derive License
    const spdxLicense = repoInfo.license?.spdx_id;
    const cleanLicense = spdxLicense && spdxLicense !== 'NOASSERTION' ? spdxLicense : 'MIT';

    // Derive Manifest Version
    const mv = manifestData?.manifest_version === 3 ? 'v3' : manifestData?.manifest_version === 2 ? 'v2' : 'v3';

    // Derive Icon URL if manifest contains icon
    let iconUrl = '';
    if (manifestData?.icons) {
      const bestIcon = manifestData.icons['128'] || manifestData.icons['64'] || manifestData.icons['48'] || manifestData.icons['16'];
      if (bestIcon && typeof bestIcon === 'string') {
        const cleanIconPath = bestIcon.replace(/^\.?\/+/, '');
        iconUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${cleanIconPath}`;
      }
    }

    // Derive Overview Description
    let description = '';
    if (readmeText && readmeText.trim().length >= 100) {
      // Clean README markdown to use first substantial section
      const strippedReadme = readmeText
        .replace(/<!--[\s\S]*?-->/g, '') // remove comments
        .replace(/!\[.*?\]\(.*?\)/g, '') // remove image tags
        .trim();
      
      const paragraphs = strippedReadme.split(/\n\n+/).filter(p => p.trim().length > 30);
      if (paragraphs.length >= 2) {
        description = paragraphs.slice(0, 4).join('\n\n');
      } else {
        description = strippedReadme.slice(0, 800);
      }
    }

    if (!description || description.trim().length < 100) {
      description = `### Overview\n\n**${cleanName}** is an open-source Manifest V3 extension built to optimize your daily browsing workflow with speed, privacy, and zero unnecessary bloat.\n\n### Core Design Philosophy\n- **Client-Side Execution**: Operates locally directly in your browser without telemetry harvesting.\n- **Modern Chromium Native**: Seamlessly integrates with Chrome, Brave, Edge, Arc, and Opera.\n- **Full Transparency**: Open-source architecture with completely auditable code on GitHub.`;
    }

    // Derive Feature Highlights
    const permissions: string[] = Array.isArray(manifestData?.permissions) ? manifestData.permissions : [];
    const features = [
      {
        title: 'Native Browser Integration',
        description: `Directly hooks into modern Chromium APIs for zero-friction background operations.`,
      },
      {
        title: permissions.includes('storage') ? 'Local Data Storage' : 'Privacy-First Architecture',
        description: permissions.includes('storage')
          ? 'Securely persists state and preferences in your browser’s isolated local storage.'
          : 'Strictly zero tracking or third-party telemetry, keeping your web data confidential.',
      },
      {
        title: 'Lightweight & Efficient',
        description: 'Engineered with minimal memory overhead for fast execution without slowing tab performance.',
      },
    ];

    // Derive Workflow Stages
    const workflow = [
      {
        step: 1,
        title: 'Install & Pin',
        description: 'Add the extension from ExtLabs or load the package zip into chrome://extensions.',
      },
      {
        step: 2,
        title: 'Configure Preferences',
        description: 'Access the extension toolbar popup to adjust options to fit your workflow.',
      },
      {
        step: 3,
        title: 'Automate & Accelerate',
        description: 'Experience automated productivity enhancements seamlessly across active tabs.',
      },
    ];

    // Derive FAQs
    const faqs = [
      {
        q: `Is ${cleanName} completely free and open source?`,
        a: `Yes, ${cleanName} is distributed under the open-source ${cleanLicense} license and is free to download and inspect on GitHub.`,
      },
      {
        q: `Which browsers are supported by ${cleanName}?`,
        a: `It is built on Manifest V3 standards and is compatible with Google Chrome, Brave, Microsoft Edge, Arc, and Opera.`,
      },
      {
        q: `Does this extension collect or share my personal data?`,
        a: `No. All operations run locally within your browser sandbox, and no telemetry or personal usage statistics are harvested.`,
      },
    ];

    const downloadUrl = `https://github.com/${owner}/${repo}/releases/latest/download/${repo}.zip`;
    const developerWebsite = repoInfo.homepage?.trim() || `https://github.com/${owner}`;
    const supportEmail = user?.email || `support@${owner}.dev`;
    const docsUrl = `https://github.com/${owner}/${repo}#readme`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          name: cleanName.includes('Extension') ? cleanName : `${cleanName} Extension`,
          slug: cleanSlug,
          category: detectedCategory,
          version: cleanVersion,
          tagline,
          githubUrl: repoInfo.html_url,
          downloadUrl,
          supportEmail,
          developerWebsite,
          docsUrl,
          license: cleanLicense,
          manifestVersion: mv,
          iconUrl,
          description,
          features,
          workflow,
          faqs,
          hasManifest: Boolean(manifestData),
          hasReadme: Boolean(readmeText),
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Error fetching repo details:', err);
    return new Response(JSON.stringify({ success: false, error: err.message || 'Failed to fetch repository details.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
