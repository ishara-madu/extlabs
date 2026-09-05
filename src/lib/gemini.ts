// src/lib/gemini.ts
import { env } from 'cloudflare:workers';

/**
 * Pre-configured Gemini API Keys pool with automatic rotation & failover.
 */
const DEFAULT_KEYS: string[] = [];

// In-memory round-robin pointer and cooldown tracker
let currentKeyIndex = 0;
const keyCooldowns = new Map<string, number>();

/**
 * Get all available Gemini API keys from environment or defaults
 */
export function getGeminiKeyPool(): string[] {
  try {
    const cf = env as any;
    const rawKeys = cf?.GEMINI_API_KEYS || process.env.GEMINI_API_KEYS;
    if (rawKeys && typeof rawKeys === 'string') {
      const parsed = rawKeys
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 10);
      if (parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_KEYS;
}

export interface CodeSnippet {
  filename: string;
  role: 'background' | 'content_script' | 'popup' | 'package' | 'options';
  content: string;
}

export interface ExtensionContext {
  name: string;
  repoName: string;
  owner: string;
  repoDescription?: string;
  topics?: string[];
  manifest?: any;
  readme?: string;
  license?: string;
  codeSnippets?: CodeSnippet[];
}

export interface GeminiStoreListing {
  tagline: string;
  category: string;
  description: string;
  features: Array<{ title: string; description: string }>;
  workflow: Array<{ step: number; title: string; description: string }>;
  faqs: Array<{ q: string; a: string }>;
}

/**
 * Execute a Gemini 3.8 Flash request with automatic key rotation and failover.
 * Tries the next key in the pool if a key hits rate limits (429) or quota errors.
 */
export async function callGeminiWithRotation(
  prompt: string,
  systemInstruction?: string
): Promise<string | null> {
  const pool = getGeminiKeyPool();
  if (pool.length === 0) return null;

  const totalKeys = pool.length;
  const now = Date.now();

  // Try each key in the pool starting from the current rotating index
  for (let attempt = 0; attempt < totalKeys; attempt++) {
    const keyIdx = (currentKeyIndex + attempt) % totalKeys;
    const apiKey = pool[keyIdx];

    // Check if key is in cooldown
    const cooldownUntil = keyCooldowns.get(apiKey) || 0;
    if (cooldownUntil > now) {
      continue;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

      const requestBody: any = {
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      };

      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const json: any = await res.json();
        const candidate = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidate) {
          // Advance the index for next call to distribute load evenly
          currentKeyIndex = (keyIdx + 1) % totalKeys;
          return candidate;
        }
      }

      // Handle Rate Limiting / Quota Exhaustion (429 or 403)
      if (res.status === 429 || res.status === 403 || res.status === 503) {
        const errText = await res.text();
        console.warn(`[Gemini Rotation] Key #${keyIdx + 1} hit error HTTP ${res.status}: ${errText.slice(0, 100)}. Switching to next key...`);
        // Put in 60s cooldown
        keyCooldowns.set(apiKey, Date.now() + 60_000);
        continue;
      } else {
        console.warn(`[Gemini Rotation] Key #${keyIdx + 1} unexpected status ${res.status}. Trying next key...`);
      }
    } catch (networkErr: any) {
      console.warn(`[Gemini Rotation] Network error with key #${keyIdx + 1}: ${networkErr.message}. Trying next key...`);
      keyCooldowns.set(apiKey, Date.now() + 30_000);
      continue;
    }
  }

  console.error('[Gemini Rotation] All keys in pool exhausted or cooling down.');
  return null;
}

/**
 * Generate SEO-optimized Chrome Web Store listing copy from extension context
 */
export async function generateSeoStoreListing(
  context: ExtensionContext
): Promise<GeminiStoreListing | null> {
  const systemInstruction = `You are a World-Class Chrome Web Store Copywriter & Technical SEO Specialist.
Your goal is to write a high-ranking, deeply authentic, high-CTR store listing for a browser extension based on its ACTUAL SOURCE CODE and metadata.
Analyze the real functions, Chrome extension API usages (e.g. tabs, storage, alarms, contextMenus, webRequest, scripting, declarativeNetRequest), DOM injections, and popup UI to describe genuine features accurately.
Never use generic filler or fabricated claims.
Always return your response in strictly valid JSON format matching the schema requested.
Do not use markdown codeblocks around the JSON response.`;

  const permissions = Array.isArray(context.manifest?.permissions)
    ? context.manifest.permissions.join(', ')
    : 'None specified';

  const codeSection = Array.isArray(context.codeSnippets) && context.codeSnippets.length > 0
    ? `
### ACTUAL EXTENSION SOURCE CODE FILES:
The following are real source code files extracted from this repository. Analyze their functions, event listeners, and API calls to deeply understand the extension:
${context.codeSnippets
  .map(
    (s) => `--- FILE: ${s.filename} [Role: ${s.role.toUpperCase()}] ---
${s.content.slice(0, 2500)}
`
  )
  .join('\n')}
`
    : '';

  const userPrompt = `
Analyze the following browser extension metadata and ACTUAL CODEBASE to craft an SEO-optimized, highly authentic store listing in English:

Extension Name: ${context.name}
Repository: ${context.owner}/${context.repoName}
Repo Description: ${context.repoDescription || 'None'}
Repo Topics/Tags: ${(context.topics || []).join(', ') || 'None'}
Manifest Version: ${context.manifest?.manifest_version || '3'}
Permissions: ${permissions}
License: ${context.license || 'MIT'}
README Content (if available):
${context.readme ? context.readme.slice(0, 3000) : 'No README provided.'}
${codeSection}

Generate a JSON object with this exact structure:
{
  "tagline": "A punchy, benefit-driven hook with high-intent keywords (10 to 115 characters max).",
  "category": "Exactly one of: 'productivity', 'dev', 'ai', 'privacy', 'utilities'",
  "description": "Rich markdown overview (min 200 words). Include sections: '### Overview', '### Key Advantages', and '### Privacy & Architecture'. Use bold text on primary search keywords. Ensure it is compelling and professional.",
  "features": [
    {
      "title": "Concise feature name (4 to 55 characters)",
      "description": "Benefit-driven explanation (20 to 175 characters)"
    },
    {
      "title": "Concise feature name (4 to 55 characters)",
      "description": "Benefit-driven explanation (20 to 175 characters)"
    },
    {
      "title": "Concise feature name (4 to 55 characters)",
      "description": "Benefit-driven explanation (20 to 175 characters)"
    }
  ],
  "workflow": [
    {
      "step": 1,
      "title": "Step 1 Action (4 to 55 characters)",
      "description": "Clear instructions (20 to 190 characters)"
    },
    {
      "step": 2,
      "title": "Step 2 Action (4 to 55 characters)",
      "description": "Clear instructions (20 to 190 characters)"
    },
    {
      "step": 3,
      "title": "Step 3 Action (4 to 55 characters)",
      "description": "Clear instructions (20 to 190 characters)"
    }
  ],
  "faqs": [
    {
      "q": "High-intent search question #1 (10 to 95 characters)",
      "a": "Direct, authoritative, reassuring answer (25 to 280 characters)"
    },
    {
      "q": "High-intent search question #2 (10 to 95 characters)",
      "a": "Direct, authoritative, reassuring answer (25 to 280 characters)"
    },
    {
      "q": "High-intent search question #3 (10 to 95 characters)",
      "a": "Direct, authoritative, reassuring answer (25 to 280 characters)"
    }
  ]
}
`;

  try {
    const rawResult = await callGeminiWithRotation(userPrompt, systemInstruction);
    if (!rawResult) return null;

    const parsed = JSON.parse(rawResult.trim());
    if (parsed && typeof parsed.tagline === 'string' && Array.isArray(parsed.features)) {
      return {
        tagline: parsed.tagline.slice(0, 120),
        category: ['productivity', 'dev', 'ai', 'privacy', 'utilities'].includes(parsed.category)
          ? parsed.category
          : 'productivity',
        description: parsed.description || '',
        features: Array.isArray(parsed.features)
          ? parsed.features.slice(0, 6).map((f: any) => ({
              title: (f.title || '').slice(0, 60),
              description: (f.description || '').slice(0, 180),
            }))
          : [],
        workflow: Array.isArray(parsed.workflow)
          ? parsed.workflow.slice(0, 5).map((w: any, idx: number) => ({
              step: typeof w.step === 'number' ? w.step : idx + 1,
              title: (w.title || '').slice(0, 60),
              description: (w.description || '').slice(0, 200),
            }))
          : [],
        faqs: Array.isArray(parsed.faqs)
          ? parsed.faqs.slice(0, 6).map((faq: any) => ({
              q: (faq.q || '').slice(0, 100),
              a: (faq.a || '').slice(0, 300),
            }))
          : [],
      };
    }
  } catch (parseErr) {
    console.error('[Gemini Rotation] Failed to parse Gemini response as JSON:', parseErr);
  }

  return null;
}
