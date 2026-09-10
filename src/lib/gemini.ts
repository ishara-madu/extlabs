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
  targetKeywords?: string[];
}

export interface ComparisonItem {
  feature: string;
  current: string;
  others: string;
}

export interface GeminiStoreListing {
  tagline: string;
  category: string;
  metaDescription?: string;
  description: string;
  features: Array<{ title: string; description: string }>;
  workflow: Array<{ step: number; title: string; description: string }>;
  comparison: ComparisonItem[];
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
          thinkingConfig: {
            thinking_level: 'HIGH',
          },
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
        const parts = json.candidates?.[0]?.content?.parts || [];
        const textPart = parts.find((p: any) => p.text && !p.thought)?.text || parts[parts.length - 1]?.text || parts[0]?.text;
        if (textPart) {
          // Advance the index for next call to distribute load evenly
          currentKeyIndex = (keyIdx + 1) % totalKeys;
          return textPart;
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
 * Helper to build the unified base context string for all subagents
 */
function buildBaseContext(context: ExtensionContext): string {
  const permissions = Array.isArray(context.manifest?.permissions)
    ? context.manifest.permissions.join(', ')
    : 'None specified';

  const codeSection = Array.isArray(context.codeSnippets) && context.codeSnippets.length > 0
    ? `
### SOURCE CODE HIGHLIGHTS:
${context.codeSnippets
  .map(
    (s) => `--- FILE: ${s.filename} [Role: ${s.role.toUpperCase()}] ---
${s.content.slice(0, 2000)}
`
  )
  .join('\n')}`
    : '';

  const keywordsSection = Array.isArray(context.targetKeywords) && context.targetKeywords.length > 0
    ? `
### DEVELOPER-TARGETED SEARCH KEYWORDS:
The developer has specifically targeted the following search terms. You MUST prioritize and naturally integrate them:
${context.targetKeywords.map((k) => `- "${k}"`).join('\n')}`
    : '';

  return `
Extension Name: ${context.name}
Repository: ${context.owner}/${context.repoName}
Repo Description: ${context.repoDescription || 'None'}
Repo Topics/Tags: ${(context.topics || []).join(', ') || 'None'}
Manifest Version: ${context.manifest?.manifest_version || '3'}
Permissions: ${permissions}
License: ${context.license || 'MIT'}
README Summary:
${context.readme ? context.readme.slice(0, 2500) : 'No README provided.'}
${keywordsSection}
${codeSection}
`;
}

/**
 * 🎯 Subagent 1: Product Marketing & Feature Matrix Specialist
 * Generates: High-CTR Tagline (<150 chars), Category, 5-6 Benefit-driven Feature Cards, 4-5 Step Workflow.
 */
async function runPositioningSubagent(
  context: ExtensionContext
): Promise<{
  tagline: string;
  category: string;
  features: Array<{ title: string; description: string }>;
  workflow: Array<{ step: number; title: string; description: string }>;
} | null> {
  const systemInstruction = `You are a World-Class Browser Extension Product Marketing Specialist.
Your sole mission is to craft punchy, high-CTR positioning, category tagging, exactly 6 rich benefit-driven feature cards (each with a comprehensive 150 to 300 character description), and a 4 to 5 step user workflow based on actual extension capabilities.
Always return strictly valid JSON matching the schema. No markdown code blocks.`;

  const prompt = `
${buildBaseContext(context)}

Analyze the codebase and metadata above. Produce a JSON object with this exact structure:
{
  "tagline": "Action-oriented hook with primary keyword and user benefit (10 to 150 characters max).",
  "category": "Exactly one of: 'productivity', 'dev', 'ai', 'privacy', 'utilities'",
  "features": [
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    },
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    },
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    },
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    },
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    },
    {
      "title": "Action/Benefit Name (4 to 80 characters)",
      "description": "Concrete outcome and how it works. MUST be detailed and between 150 and 300 characters long."
    }
  ],
  "workflow": [
    {
      "step": 1,
      "title": "Installation & Pinning (4 to 80 characters)",
      "description": "Specific action to activate and pin (25 to 250 characters)"
    },
    {
      "step": 2,
      "title": "Configuration & Options (4 to 80 characters)",
      "description": "Customizing settings and keyboard shortcuts (25 to 250 characters)"
    },
    {
      "step": 3,
      "title": "Active In-Page Operation (4 to 80 characters)",
      "description": "Using the toolbar popup or in-page triggers (25 to 250 characters)"
    },
    {
      "step": 4,
      "title": "Export & Automation (4 to 80 characters)",
      "description": "Saving, copying, or automating outputs (25 to 250 characters)"
    }
  ]
}
`;

  try {
    const raw = await callGeminiWithRotation(prompt, systemInstruction);
    if (!raw) return null;
    const parsed = JSON.parse(raw.trim());
    if (parsed && typeof parsed.tagline === 'string' && Array.isArray(parsed.features)) {
      return {
        tagline: parsed.tagline.slice(0, 150),
        category: ['productivity', 'dev', 'ai', 'privacy', 'utilities'].includes(parsed.category)
          ? parsed.category
          : 'productivity',
        features: parsed.features.slice(0, 6).map((f: any) => ({
          title: (f.title || '').slice(0, 95),
          description: (f.description || '').slice(0, 380),
        })),
        workflow: Array.isArray(parsed.workflow)
          ? parsed.workflow.slice(0, 5).map((w: any, idx: number) => ({
              step: typeof w.step === 'number' ? w.step : idx + 1,
              title: (w.title || '').slice(0, 95),
              description: (w.description || '').slice(0, 380),
            }))
          : [],
      };
    }
  } catch (err) {
    console.warn('[Subagent 1: Positioning] Error:', err);
  }
  return null;
}

/**
 * 📝 Subagent 2: Deep Technical SEO Copywriter
 * Generates: 1,200 - 1,800+ Word Exhaustive Markdown Store Guide and 150-160 char Google Meta Description.
 */
async function runDeepSeoSubagent(
  context: ExtensionContext
): Promise<{
  metaDescription: string;
  description: string;
} | null> {
  const systemInstruction = `You are a World-Class Technical SEO Journalist & Long-form Content Copywriter.
Your sole mission is to write an exhaustive, authoritative, deeply structured store guide (minimum 1,200 to 1,800 words, ~6,500 to 11,000 characters) in pristine, production-ready GitHub Markdown, and a dedicated 150-160 character Google Meta Description snippet.
CRITICAL FORMATTING REQUIREMENT:
You MUST pre-format the description with rich Markdown so the developer never has to manually format text:
- Use '### Level 3 Headings' for all major sections.
- Embolden all primary and search keywords with '**keyword**'.
- Use clean bullet points with bold lead-ins for features and takeaways: '- **Feature Name**: detailed explanation'.
- Write extensive, in-depth, informative paragraphs with zero filler or placeholders. Meet the minimum 1,200-word target thoroughly with technical depth and real-world clarity.
Always return strictly valid JSON matching the schema. No markdown code blocks around the JSON.`;

  const prompt = `
${buildBaseContext(context)}

Write an exhaustive, comprehensive SEO store guide (minimum 1,200 words, ~6,500 to 11,000+ characters) with rich Markdown formatting (### headings, **bold keywords**, - **bullet points**) and a Google Meta Description for this extension.
Ensure you comprehensively cover these sections with deep technical explanations:
1. ### Quick Feature Highlights (with bold lead-ins: - **Feature**: description)
2. ### What is ${context.name}? (2-3 detailed paragraphs explaining value proposition, target keyword hooks in **bold**)
3. ### The Core Everyday Friction It Eliminates (detailed before-and-after workflow analysis)
4. ### Technical Architecture & Chromium APIs (deep dive into Manifest V3, background service workers, local content scripts, and storage)
5. ### Zero-Telemetry Privacy & Local Execution (reassuring breakdown of permissions requested and proof of client-side safety)
6. ### In-Depth Feature Breakdown & Practical Use Cases (deep analysis of every capability)
7. ### Who Benefits Most from ${context.name}? (- **Developers**, - **Researchers & Students**, - **Power Users**)
8. ### Step-by-Step Power User Tips & Shortcuts (actionable accelerators to get 10x value)
9. ### Open-Source Transparency & GitHub Community (auditability, community contributions, license)

Produce a JSON object with this exact structure:
{
  "metaDescription": "Concise 150-160 character snippet with primary keyword and action call-to-action.",
  "description": "### Quick Feature Highlights\\n- **Fast Local Execution**: ...\\n\\n### What is ${context.name}?\\n... (minimum 1,200 words total)"
}
`;

  try {
    const raw = await callGeminiWithRotation(prompt, systemInstruction);
    if (!raw) return null;
    const parsed = JSON.parse(raw.trim());
    if (parsed && typeof parsed.description === 'string') {
      return {
        metaDescription: (parsed.metaDescription || '').slice(0, 160),
        description: parsed.description,
      };
    }
  } catch (err) {
    console.warn('[Subagent 2: Deep SEO] Error:', err);
  }
  return null;
}

/**
 * ⚖️ Subagent 3: Competitive Intelligence & Long-Tail FAQ Specialist
 * Generates: 4 Competitor Comparison Rows (Alternative SEO) and exactly 10 Long-Tail Search FAQs.
 */
async function runComparisonFaqSubagent(
  context: ExtensionContext
): Promise<{
  comparison: ComparisonItem[];
  faqs: Array<{ q: string; a: string }>;
} | null> {
  const systemInstruction = `You are a World-Class Technical Product Reviewer & Search Query Analyst.
Your sole mission is to craft a 4-row competitive comparison matrix (highlighting this extension's local advantages vs cloud/competing alternatives) and exactly 10 in-depth FAQs addressing real Google search queries.
Always return strictly valid JSON matching the schema. No markdown code blocks around the JSON.`;

  const prompt = `
${buildBaseContext(context)}

Analyze the extension's privacy, performance, and architecture. Produce a JSON object with this exact structure:
{
  "comparison": [
    {
      "feature": "Capability or Metric (3 to 60 characters)",
      "current": "This extension's advantage (15 to 200 characters)",
      "others": "Cloud/Alternative tool drawback (15 to 200 characters)"
    },
    {
      "feature": "Capability or Metric (3 to 60 characters)",
      "current": "This extension's advantage (15 to 200 characters)",
      "others": "Cloud/Alternative tool drawback (15 to 200 characters)"
    },
    {
      "feature": "Capability or Metric (3 to 60 characters)",
      "current": "This extension's advantage (15 to 200 characters)",
      "others": "Cloud/Alternative tool drawback (15 to 200 characters)"
    },
    {
      "feature": "Capability or Metric (3 to 60 characters)",
      "current": "This extension's advantage (15 to 200 characters)",
      "others": "Cloud/Alternative tool drawback (15 to 200 characters)"
    }
  ],
  "faqs": [
    {
      "q": "High-intent search question regarding privacy & offline safety (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding zero telemetry & external servers (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding supported Chromium browsers (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding permissions and data collection (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding system performance, RAM, and battery (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding keyboard shortcuts or customization (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding exporting or downloading data (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding pricing, paywalls, and licenses (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding Manifest V3 compliance and updates (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    },
    {
      "q": "High-intent search question regarding getting help, reporting bugs, or source code (15 to 150 characters)",
      "a": "Direct, authoritative, reassuring answer (35 to 600 characters)"
    }
  ]
}
`;

  try {
    const raw = await callGeminiWithRotation(prompt, systemInstruction);
    if (!raw) return null;
    const parsed = JSON.parse(raw.trim());
    if (parsed && (Array.isArray(parsed.comparison) || Array.isArray(parsed.faqs))) {
      return {
        comparison: Array.isArray(parsed.comparison)
          ? parsed.comparison.slice(0, 5).map((c: any) => ({
              feature: (c.feature || '').slice(0, 75),
              current: (c.current || '').slice(0, 240),
              others: (c.others || '').slice(0, 240),
            }))
          : [],
        faqs: Array.isArray(parsed.faqs)
          ? parsed.faqs.slice(0, 10).map((faq: any) => ({
              q: (faq.q || '').slice(0, 180),
              a: (faq.a || '').slice(0, 800),
            }))
          : [],
      };
    }
  } catch (err) {
    console.warn('[Subagent 3: Comparison & FAQs] Error:', err);
  }
  return null;
}

/**
 * 🚀 Multi-Subagent Orchestrator
 * Executes all 3 specialized subagents concurrently via Promise.all
 * Ensures maximum quality, zero generation fatigue, and <1.5s latency.
 */
export async function generateSeoStoreListing(
  context: ExtensionContext
): Promise<GeminiStoreListing | null> {
  try {
    // Run all 3 specialized subagents in parallel
    const [posResult, seoResult, compResult] = await Promise.all([
      runPositioningSubagent(context),
      runDeepSeoSubagent(context),
      runComparisonFaqSubagent(context),
    ]);

    // If all three failed (e.g. no API keys configured), return null to trigger deterministic fallback
    if (!posResult && !seoResult && !compResult) {
      return null;
    }

    return {
      tagline: seoResult?.metaDescription || posResult?.tagline || '',
      category: posResult?.category || 'productivity',
      metaDescription: seoResult?.metaDescription || posResult?.tagline || '',
      description: seoResult?.description || '',
      features: posResult?.features || [],
      workflow: posResult?.workflow || [],
      comparison: compResult?.comparison || [],
      faqs: compResult?.faqs || [],
    };
  } catch (orchestratorErr) {
    console.error('[Gemini Multi-Agent Orchestrator] Error executing parallel subagents:', orchestratorErr);
    return null;
  }
}
