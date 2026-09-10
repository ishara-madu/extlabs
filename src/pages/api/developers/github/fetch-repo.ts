// src/pages/api/developers/github/fetch-repo.ts
import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../../lib/auth';
import { getDb } from '../../../../lib/db';
import { generateSeoStoreListing, type CodeSnippet } from '../../../../lib/gemini';

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

/**
 * Safely decode base64 strings across Node and Edge runtimes
 */
function decodeBase64(b64: string): string {
  try {
    const clean = b64.replace(/\s/g, '');
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(clean, 'base64').toString('utf-8');
    }
    return decodeURIComponent(escape(atob(clean)));
  } catch {
    try {
      return atob(b64.replace(/\s/g, ''));
    } catch {
      return '';
    }
  }
}

/**
 * Distill README to strip badges, build commands, and licensing bloat
 */
function distillReadme(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/<!--[\s\S]*?-->/g, '') // strip HTML comments
    .replace(/\[!\[[\s\S]*?\]\(.*?\)\]\(.*?\)/g, '') // strip nested badge links
    .replace(/!\[.*?\]\(.*?\)/g, '') // strip image tags
    .replace(/```(?:bash|sh|shell)[\s\S]*?```/gi, '') // strip shell/npm install blocks
    .replace(/##\s+(?:License|Contributing|Authors|Acknowledgements|Changelog)[\s\S]*?(?=(?:##\s+|$))/gi, '') // strip license/contributing sections
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 2500);
}

/**
 * Distill source code to focus on Chrome APIs, event listeners, and business logic signatures
 */
function distillCodeSnippet(raw: string, role: string): string {
  if (!raw) return '';
  const lines = raw.split('\n');
  const distilledLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Skip heavy JSX/CSS classes and standard non-browser imports
    if (trimmed.startsWith('import ') && !trimmed.includes('chrome') && !trimmed.includes('storage')) continue;
    if (trimmed.startsWith('className="') || trimmed.startsWith('class="')) continue;
    if (trimmed.startsWith('<svg') || trimmed.startsWith('<path ') || trimmed.startsWith('d="M')) continue;

    // Prioritize high-signal extension lines
    if (
      trimmed.includes('chrome.') ||
      trimmed.includes('browser.') ||
      trimmed.includes('.addListener') ||
      trimmed.includes('addEventListener') ||
      trimmed.includes('postMessage') ||
      trimmed.includes('sendMessage') ||
      trimmed.includes('action ===') ||
      trimmed.includes('type ===') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('async function ') ||
      trimmed.startsWith('export const ') ||
      trimmed.startsWith('export function ') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*')
    ) {
      distilledLines.push(line);
    }
  }

  // If distilled lines provide good context, return them
  if (distilledLines.length >= 5) {
    return distilledLines.join('\n').slice(0, 1500);
  }

  // Otherwise, return pruned snippet without excessive CSS/whitespace
  return raw
    .replace(/class(?:Name)?="[^"]*"/g, '')
    .slice(0, 1500);
}

/**
 * Fetch a single file's content from a GitHub repository (supports public and private repos)
 */
async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  headers: Record<string, string>
): Promise<string | null> {
  try {
    const cleanPath = filePath.replace(/^\.?\/+/, '');
    let res = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`,
      { headers }
    );
    if (res.status === 401 && headers['Authorization']) {
      const publicHeaders = { ...headers };
      delete publicHeaders['Authorization'];
      res = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath}?ref=${encodeURIComponent(branch)}`,
        { headers: publicHeaders }
      );
    }
    if (!res.ok) return null;
    const json = (await res.json()) as { content?: string; encoding?: string };
    if (json.content && json.encoding === 'base64') {
      return decodeBase64(json.content);
    }
    return null;
  } catch {
    return null;
  }
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
    const body = (await request.json()) as { repoUrl?: string; targetKeywords?: string };
    const rawUrl = body.repoUrl?.trim() || '';
    const rawKeywords = typeof body.targetKeywords === 'string' ? body.targetKeywords.trim() : '';
    const targetKeywords: string[] = rawKeywords
      ? rawKeywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0)
      : [];

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
    let repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers });

    // If authenticated request fails with 401 Unauthorized, stored token is invalid or expired
    if (repoRes.status === 401 && headers['Authorization']) {
      console.warn(`[GitHub API] Stored token for user ${user.username} rejected with HTTP 401. Retrying unauthenticated...`);
      delete headers['Authorization'];

      // Clear invalid token from database
      try {
        await db.prepare('UPDATE users SET github_access_token = NULL WHERE id = ?').bind(user.id).run();
      } catch (dbErr) {
        console.error('Failed to clear invalid github_access_token:', dbErr);
      }

      // Retry as public fetch
      repoRes = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers });
    }

    if (!repoRes.ok) {
      if (repoRes.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Repository "${owner}/${repo}" was not found or is private without authorized access. If this is a private repository, please sign out and sign in with GitHub again.`,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (repoRes.status === 401) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'GitHub session expired or invalid credentials. Please sign out and sign back in with GitHub to reconnect your account.',
          }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (repoRes.status === 403) {
        const rateLimitRemaining = repoRes.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining === '0') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'GitHub API rate limit exceeded. Please wait a few minutes before trying again.',
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      return new Response(
        JSON.stringify({ success: false, error: `GitHub API error: HTTP ${repoRes.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const repoInfo = (await repoRes.json()) as GitHubRepoInfo;
    const defaultBranch = repoInfo.default_branch || 'main';

    // 2. Fetch manifest.json (try root, src/, public/, extension/)
    let manifestData: any = null;
    let manifestBaseDir = '';
    const manifestPaths = ['manifest.json', 'src/manifest.json', 'public/manifest.json', 'extension/manifest.json', 'app/manifest.json'];

    for (const mPath of manifestPaths) {
      try {
        const rawContent = await fetchFileContent(owner, repo, mPath, defaultBranch, headers);
        if (rawContent) {
          manifestData = JSON.parse(rawContent);
          const slashIdx = mPath.lastIndexOf('/');
          if (slashIdx !== -1) {
            manifestBaseDir = mPath.substring(0, slashIdx);
          }
          break;
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
          readmeText = distillReadme(decodeBase64(rmJson.content));
        }
      }
    } catch {}

    // 3.5 Fetch Actual Extension Source Code Files (Background, Content Scripts, Popup, package.json)
    const codeSnippets: CodeSnippet[] = [];
    const filesToFetch: Array<{ path: string; role: CodeSnippet['role'] }> = [];

    const resolveCandidatePaths = (p: string): string[] => {
      const clean = p.replace(/^\.?\/+/, '');
      if (manifestBaseDir && !clean.startsWith(manifestBaseDir + '/')) {
        return [`${manifestBaseDir}/${clean}`, clean];
      }
      return [clean];
    };

    // A. Background service worker or scripts
    if (manifestData?.background?.service_worker && typeof manifestData.background.service_worker === 'string') {
      filesToFetch.push({ path: manifestData.background.service_worker, role: 'background' });
    } else if (Array.isArray(manifestData?.background?.scripts)) {
      for (const s of manifestData.background.scripts.slice(0, 2)) {
        if (typeof s === 'string') filesToFetch.push({ path: s, role: 'background' });
      }
    }

    // B. Content scripts
    if (Array.isArray(manifestData?.content_scripts)) {
      for (const cs of manifestData.content_scripts) {
        if (Array.isArray(cs.js)) {
          for (const jsPath of cs.js.slice(0, 2)) {
            if (typeof jsPath === 'string') filesToFetch.push({ path: jsPath, role: 'content_script' });
          }
        }
      }
    }

    // C. Popup (HTML & JS)
    const popupHtml = manifestData?.action?.default_popup || manifestData?.browser_action?.default_popup;
    if (popupHtml && typeof popupHtml === 'string') {
      filesToFetch.push({ path: popupHtml, role: 'popup' });
      const popupJs = popupHtml.replace(/\.html$/i, '.js');
      const popupTs = popupHtml.replace(/\.html$/i, '.ts');
      if (popupJs !== popupHtml) filesToFetch.push({ path: popupJs, role: 'popup' });
      if (popupTs !== popupHtml) filesToFetch.push({ path: popupTs, role: 'popup' });
    }

    // D. Options page
    const optionsHtml = manifestData?.options_ui?.page || manifestData?.options_page;
    if (optionsHtml && typeof optionsHtml === 'string') {
      filesToFetch.push({ path: optionsHtml, role: 'options' });
    }

    // Fallbacks if no manifest scripts were declared or manifest is absent
    if (filesToFetch.length === 0) {
      filesToFetch.push(
        { path: 'background.js', role: 'background' },
        { path: 'src/background.ts', role: 'background' },
        { path: 'src/background.js', role: 'background' },
        { path: 'content.js', role: 'content_script' },
        { path: 'src/content.ts', role: 'content_script' },
        { path: 'src/content.js', role: 'content_script' },
        { path: 'popup.js', role: 'popup' },
        { path: 'src/popup.ts', role: 'popup' }
      );
    }

    // Always fetch package.json to inspect dependencies and tools
    filesToFetch.push({ path: 'package.json', role: 'package' });

    // Deduplicate and fetch up to 5 source files
    const seenPaths = new Set<string>();
    for (const item of filesToFetch) {
      if (codeSnippets.length >= 5) break;
      if (seenPaths.has(item.path)) continue;
      seenPaths.add(item.path);

      if (item.path.endsWith('.min.js') || item.path.includes('node_modules/')) continue;

      const candidates = resolveCandidatePaths(item.path);
      let content: string | null = null;
      let matchedPath = item.path;

      for (const cand of candidates) {
        content = await fetchFileContent(owner, repo, cand, defaultBranch, headers);
        if (content) {
          matchedPath = cand;
          break;
        }
      }

      if (content && content.trim().length > 20) {
        codeSnippets.push({
          filename: matchedPath,
          role: item.role,
          content: distillCodeSnippet(content, item.role),
        });
      }
    }

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
    let features = [
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
    let workflow = [
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
    let faqs = [
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
        a: `No. All operations run locally within your browser sandbox, and strictly zero telemetry or personal usage statistics are harvested.`,
      },
      {
        q: `Why does ${cleanName} request specific browser permissions?`,
        a: `Permissions are requested solely to interact with active browser tabs and store your local settings offline without cloud round-trips.`,
      },
      {
        q: `How does ${cleanName} impact browser speed and memory (RAM)?`,
        a: `It is engineered with a lightweight, event-driven background service worker that sleeps when inactive, ensuring zero noticeable RAM impact.`,
      },
      {
        q: `Can I customize keyboard shortcuts for ${cleanName}?`,
        a: `Yes! You can configure custom hotkeys anytime by visiting chrome://extensions/shortcuts in your browser settings.`,
      },
      {
        q: `Does this extension require creating an account or signing in?`,
        a: `No account or registration is required. Simply install and pin the extension to begin using it immediately.`,
      },
      {
        q: `Can I export or download my data from the extension?`,
        a: `Yes, any locally saved configurations, notes, or history can be exported directly from the extension options page.`,
      },
      {
        q: `Is ${cleanName} compliant with Google's Manifest V3 standard?`,
        a: `Yes, it is fully compliant with the latest Manifest V3 specifications, guaranteeing modern security and long-term stability.`,
      },
      {
        q: `Where can I report bugs or suggest new features?`,
        a: `You can submit feedback, bug reports, or feature requests directly on the official GitHub repository issues page.`,
      },
    ];

    // Derive Comparison Matrix
    let comparison = [
      {
        feature: 'Privacy Architecture',
        current: '100% Client-Side Sandbox, zero telemetry',
        others: 'Cloud tracking, background telemetry harvesting',
      },
      {
        feature: 'Execution Performance',
        current: 'Instant in-memory execution (<50ms)',
        others: 'High latency server round-trips (>2s)',
      },
      {
        feature: 'Chromium Native Standards',
        current: 'Manifest V3 strictly compliant',
        others: 'Legacy Manifest V2 or background bloat',
      },
      {
        feature: 'Codebase Transparency',
        current: 'Open-Source with auditable GitHub repository',
        others: 'Proprietary, closed-source black box',
      },
    ];

    // 4. Generate High-Converting SEO-Optimized Listing with Multi-Subagent Pipeline
    let isAiGenerated = false;
    try {
      const aiListing = await generateSeoStoreListing({
        name: cleanName,
        repoName: repo,
        owner,
        repoDescription: repoInfo.description || '',
        topics,
        manifest: manifestData,
        readme: readmeText,
        license: cleanLicense,
        codeSnippets,
        targetKeywords,
      });

      if (aiListing) {
        if (aiListing.metaDescription) {
          tagline = aiListing.metaDescription;
        } else if (aiListing.tagline) {
          tagline = aiListing.tagline;
        }
        if (aiListing.category) detectedCategory = aiListing.category;
        if (aiListing.description) description = aiListing.description;
        if (Array.isArray(aiListing.features) && aiListing.features.length >= 3) {
          features = aiListing.features;
        }
        if (Array.isArray(aiListing.workflow) && aiListing.workflow.length >= 3) {
          workflow = aiListing.workflow;
        }
        if (Array.isArray(aiListing.comparison) && aiListing.comparison.length >= 3) {
          comparison = aiListing.comparison;
        }
        if (Array.isArray(aiListing.faqs) && aiListing.faqs.length >= 3) {
          faqs = aiListing.faqs;
        }
        isAiGenerated = true;
      }
    } catch (aiErr) {
      console.warn('Gemini Multi-Agent SEO generation error (falling back to deterministic metadata):', aiErr);
    }

    // 5. Fetch GitHub Releases to detect Direct Package Assets (.zip / .crx)
    let downloadUrl = '';
    try {
      let releaseData: any = null;
      // Try /releases/latest first
      const latestReleaseRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases/latest`,
        { headers }
      );
      if (latestReleaseRes.ok) {
        releaseData = await latestReleaseRes.json();
      } else {
        // Fallback to /releases?per_page=5 (in case releases are pre-releases or untagged latest)
        const releasesListRes = await fetch(
          `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=5`,
          { headers }
        );
        if (releasesListRes.ok) {
          const releasesList = await releasesListRes.json();
          if (Array.isArray(releasesList) && releasesList.length > 0) {
            releaseData = releasesList[0];
          }
        }
      }

      if (releaseData && Array.isArray(releaseData.assets) && releaseData.assets.length > 0) {
        // Find asset ending with .zip or .crx
        const packageAsset = releaseData.assets.find((asset: any) => {
          const assetName = (asset.name || '').toLowerCase();
          return assetName.endsWith('.zip') || assetName.endsWith('.crx');
        });

        if (packageAsset && packageAsset.browser_download_url) {
          downloadUrl = packageAsset.browser_download_url;
        }
      }
    } catch (relErr) {
      console.warn('Failed to fetch GitHub releases for direct package asset:', relErr);
    }

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
          metaDescription: tagline,
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
          comparison,
          faqs,
          hasManifest: Boolean(manifestData),
          hasReadme: Boolean(readmeText),
          analyzedFiles: codeSnippets.map((s) => ({ filename: s.filename, role: s.role })),
          isAiGenerated,
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
