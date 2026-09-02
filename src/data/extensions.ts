export interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

export interface HowItWorksItem {
  step: number;
  title: string;
  description: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ReviewItem {
  author: string;
  date: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
}

export interface DeveloperSupportInfo {
  email: string;
  website: string;
  github?: string;
  supportUrl: string;
  privacyPolicy: string;
}

export interface ComparisonItem {
  feature: string;
  current: string;
  others: string;
}

export interface Extension {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'ai' | 'dev' | 'productivity' | 'privacy' | 'social' | 'utilities';
  categoryLabel: string;
  developer: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  userCount: string;
  version: string;
  updatedDate: string;
  size: string;
  featured?: boolean;
  editorsPick?: boolean;
  badge?: string;
  iconSvg?: string;
  bannerSvg: string;
  screenshots?: string[];
  youtubeVideoId?: string;
  tags: string[];
  permissions: string[];
  overview: string[];
  features?: FeatureItem[];
  howItWorks?: HowItWorksItem[];
  whyChooseUs?: { title: string; description: string }[];
  comparison?: ComparisonItem[];
  faqs?: FAQItem[];
  developerSupport?: DeveloperSupportInfo;
  ratingBreakdown?: { 5: number; 4: number; 3: number; 2: number; 1: number };
  reviews?: ReviewItem[];
  downloadUrl?: string;
  monetagUrl?: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
  count: number;
  description: string;
  subtitle: string;
  tags: string[];
  colorAccent: string;
  heroIllustrationSvg: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'ai',
    label: 'AI & Machine Learning',
    count: 3,
    description: 'Explore state-of-the-art AI assistants, LLM page summarizers, voice transcribers, and prompt engineering utilities.',
    subtitle: 'Automate content research, summarize video transcripts, and write faster with browser-native AI.',
    tags: ['Summarizer', 'Prompt Assistant', 'Transcription', 'Voice Notes', 'LLM'],
    colorAccent: 'text-sky-600 bg-sky-50 border-sky-200',
    heroIllustrationSvg: `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="cat-ai-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0c4a6e" />
          <stop offset="50%" stop-color="#075985" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="460" height="260" fill="url(#cat-ai-bg)" rx="16" />
      
      <!-- Neural Nodes & Ambient Grid -->
      <g stroke="#38bdf8" stroke-opacity="0.2" stroke-width="1">
        <line x1="50" y1="50" x2="180" y2="90" />
        <line x1="180" y1="90" x2="280" y2="60" />
        <line x1="280" y1="60" x2="390" y2="100" />
        <line x1="180" y1="90" x2="240" y2="180" />
        <line x1="240" y1="180" x2="380" y2="200" />
      </g>
      
      <!-- Floating AI Hub Window -->
      <g transform="translate(45, 35)">
        <rect width="370" height="190" rx="14" fill="#0f172a" fill-opacity="0.85" stroke="#38bdf8" stroke-width="1.5" />
        
        <!-- Header -->
        <rect width="370" height="34" rx="14" fill="#1e293b" />
        <circle cx="20" cy="17" r="4" fill="#ef4444" />
        <circle cx="34" cy="17" r="4" fill="#f59e0b" />
        <circle cx="48" cy="17" r="4" fill="#10b981" />
        <text x="185" y="21" fill="#bae6fd" font-size="11" font-family="sans-serif" font-weight="600" text-anchor="middle">✨ Intelligent Model Studio</text>

        <!-- Live AI Waveform & Prompt Cards -->
        <g transform="translate(20, 50)">
          <rect width="210" height="42" rx="8" fill="#0369a1" fill-opacity="0.4" stroke="#0284c7" stroke-width="1" />
          <text x="12" y="18" fill="#e0f2fe" font-size="10" font-family="sans-serif" font-weight="600">Prompt: "Summarize paper into 3 insights"</text>
          <text x="12" y="32" fill="#7dd3fc" font-size="9" font-family="sans-serif">⚡ Latency 280ms • 4.8k tokens/s</text>

          <rect y="50" width="210" height="75" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1" />
          <rect x="12" y="14" width="12" height="12" rx="3" fill="#38bdf8" />
          <text x="30" y="24" fill="#f8fafc" font-size="9" font-family="sans-serif">Key Insight 1: Sub-millisecond latency</text>
          <rect x="12" y="34" width="12" height="12" rx="3" fill="#10b981" />
          <text x="30" y="44" fill="#f8fafc" font-size="9" font-family="sans-serif">Key Insight 2: Zero tracking privacy</text>
          <rect x="12" y="54" width="12" height="12" rx="3" fill="#a855f7" />
          <text x="30" y="64" fill="#f8fafc" font-size="9" font-family="sans-serif">Key Insight 3: Direct Markdown export</text>
        </g>

        <!-- Right Side AI Metric Badges -->
        <g transform="translate(245, 50)">
          <rect width="105" height="56" rx="8" fill="#0c4a6e" stroke="#0369a1" stroke-width="1" />
          <text x="52" y="24" fill="#e0f2fe" font-size="18" font-family="monospace" font-weight="bold" text-anchor="middle">99.4%</text>
          <text x="52" y="42" fill="#7dd3fc" font-size="9" font-family="sans-serif" text-anchor="middle">Extraction Accuracy</text>

          <rect y="64" width="105" height="60" rx="8" fill="#042f2e" stroke="#059669" stroke-width="1" />
          <text x="52" y="88" fill="#a7f3d0" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">On-Device</text>
          <text x="52" y="106" fill="#6ee7b7" font-size="9" font-family="sans-serif" text-anchor="middle">Private Execution</text>
        </g>
      </g>
    </svg>`
  },
  {
    id: 'dev',
    label: 'Developer Tools',
    count: 5,
    description: 'Inspect DOM trees, format JSON APIs, debug CSS layouts, and explore GitHub repositories with IDE-grade tools.',
    subtitle: 'High-performance engineering utilities built for frontend, backend, and full-stack developers.',
    tags: ['DOM Inspector', 'JSON Formatter', 'Git & GitHub', 'REST API Client', 'Color Picker'],
    colorAccent: 'text-blue-600 bg-blue-50 border-blue-200',
    heroIllustrationSvg: `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="cat-dev-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="50%" stop-color="#1e1b4b" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="460" height="260" fill="url(#cat-dev-bg)" rx="16" />
      
      <!-- DevTools Main View -->
      <g transform="translate(45, 30)">
        <rect width="370" height="200" rx="12" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5" />
        
        <!-- Tab Bar -->
        <rect width="370" height="30" rx="12" fill="#1e293b" />
        <text x="20" y="19" fill="#60a5fa" font-size="10" font-family="monospace" font-weight="bold">Elements</text>
        <text x="80" y="19" fill="#94a3b8" font-size="10" font-family="monospace">Console</text>
        <text x="140" y="19" fill="#94a3b8" font-size="10" font-family="monospace">Network (42ms)</text>
        <text x="240" y="19" fill="#94a3b8" font-size="10" font-family="monospace">ExtLabs Debugger</text>

        <!-- DOM Tree Left -->
        <g transform="translate(15, 42)">
          <rect width="180" height="145" rx="6" fill="#1e293b" />
          <text x="10" y="18" fill="#93c5fd" font-size="10" font-family="monospace">&lt;main id="app"&gt;</text>
          <text x="20" y="36" fill="#60a5fa" font-size="10" font-family="monospace">&lt;section.grid&gt;</text>
          
          <!-- Selected node highlight -->
          <rect x="25" y="44" width="145" height="22" rx="4" fill="#1d4ed8" />
          <text x="32" y="58" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold">&lt;div.card-preview&gt;</text>
          
          <text x="20" y="82" fill="#60a5fa" font-size="10" font-family="monospace">&lt;/section&gt;</text>
          <text x="10" y="100" fill="#93c5fd" font-size="10" font-family="monospace">&lt;/main&gt;</text>
          
          <g transform="translate(10, 116)">
            <rect width="160" height="18" rx="3" fill="#042f2e" />
            <text x="80" y="13" fill="#34d399" font-size="9" font-family="monospace" text-anchor="middle">✓ WCAG AAA Contrast (14:1)</text>
          </g>
        </g>

        <!-- CSS Box Model Right -->
        <g transform="translate(205, 42)">
          <rect width="150" height="145" rx="6" fill="#1e293b" />
          <!-- Margin -->
          <rect x="10" y="10" width="130" height="125" rx="4" fill="#c2410c" fill-opacity="0.2" stroke="#ea580c" stroke-width="1" />
          <text x="75" y="24" fill="#fdba74" font-size="8" font-family="monospace" text-anchor="middle">margin: 16px</text>
          
          <!-- Padding -->
          <rect x="25" y="32" width="100" height="80" rx="3" fill="#a16207" fill-opacity="0.2" stroke="#eab308" stroke-width="1" />
          <text x="75" y="46" fill="#fef08a" font-size="8" font-family="monospace" text-anchor="middle">padding: 24px</text>
          
          <!-- Content Box -->
          <rect x="40" y="54" width="70" height="42" rx="2" fill="#1d4ed8" fill-opacity="0.4" stroke="#3b82f6" stroke-width="1" />
          <text x="75" y="74" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">480 × 260</text>
          <text x="75" y="88" fill="#93c5fd" font-size="8" font-family="monospace" text-anchor="middle">Flexbox Active</text>
        </g>
      </g>
    </svg>`
  },
  {
    id: 'productivity',
    label: 'Productivity',
    count: 3,
    description: 'Stay in the zone, manage complex research tabs, clip web articles to Markdown, and eliminate distractions.',
    subtitle: 'Supercharge your daily browsing velocity and organize your workflows with zero friction.',
    tags: ['Workspace Manager', 'Markdown Clipper', 'Pomodoro Timer', 'Task Focus'],
    colorAccent: 'text-amber-600 bg-amber-50 border-amber-200',
    heroIllustrationSvg: `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="cat-prod-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#451a03" />
          <stop offset="50%" stop-color="#78350f" />
          <stop offset="100%" stop-color="#1c1917" />
        </linearGradient>
      </defs>
      <rect width="460" height="260" fill="url(#cat-prod-bg)" rx="16" />
      
      <!-- Productivity Workspace Overview -->
      <g transform="translate(45, 30)">
        <rect width="370" height="200" rx="12" fill="#1c1917" stroke="#f59e0b" stroke-width="1.5" />
        
        <!-- Left Tab Groups Stack -->
        <g transform="translate(15, 20)">
          <rect width="190" height="34" rx="8" fill="#292524" stroke="#f59e0b" stroke-width="1" />
          <circle cx="16" cy="17" r="5" fill="#f59e0b" />
          <text x="30" y="21" fill="#fef3c7" font-size="11" font-family="sans-serif" font-weight="600">Research Workspace</text>
          <text x="175" y="21" fill="#d97706" font-size="9" text-anchor="end">8 tabs</text>

          <rect y="44" width="190" height="34" rx="8" fill="#292524" stroke="#3b82f6" stroke-width="1" />
          <circle cx="16" cy="17" r="5" fill="#3b82f6" />
          <text x="30" y="21" fill="#dbeafe" font-size="11" font-family="sans-serif" font-weight="600">Engineering Sprint</text>
          <text x="175" y="21" fill="#60a5fa" font-size="9" text-anchor="end">14 tabs</text>

          <rect y="88" width="190" height="34" rx="8" fill="#292524" stroke="#8b5cf6" stroke-width="1" />
          <circle cx="16" cy="17" r="5" fill="#8b5cf6" />
          <text x="30" y="21" fill="#f3e8ff" font-size="11" font-family="sans-serif" font-weight="600">Notion & Docs</text>
          <text x="175" y="21" fill="#c084fc" font-size="9" text-anchor="end">6 tabs</text>

          <rect y="132" width="190" height="24" rx="6" fill="#064e3b" />
          <text x="95" y="16" fill="#6ee7b7" font-size="9" font-family="sans-serif" font-weight="600" text-anchor="middle">⚡ 82% RAM Usage Reduced</text>
        </g>

        <!-- Right Focus Clock & Markdown -->
        <g transform="translate(225, 20)">
          <!-- Focus Timer Ring -->
          <rect width="130" height="74" rx="8" fill="#292524" stroke="#44403c" stroke-width="1" />
          <circle cx="40" cy="37" r="24" fill="none" stroke="#7f1d1d" stroke-width="5" />
          <circle cx="40" cy="37" r="24" fill="none" stroke="#f43f5e" stroke-width="5" stroke-dasharray="110, 150" stroke-linecap="round" />
          <text x="40" y="41" fill="#fff1f2" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">25:00</text>
          <text x="75" y="32" fill="#fda4af" font-size="10" font-family="sans-serif" font-weight="bold">Focus</text>
          <text x="75" y="48" fill="#94a3b8" font-size="8" font-family="sans-serif">Session #4</text>

          <!-- Markdown Clipper -->
          <rect y="82" width="130" height="74" rx="8" fill="#292524" stroke="#44403c" stroke-width="1" />
          <text x="12" y="20" fill="#38bdf8" font-size="9" font-family="monospace"># Clipped Page</text>
          <text x="12" y="36" fill="#cbd5e1" font-size="8" font-family="monospace">- Extracted table</text>
          <text x="12" y="50" fill="#cbd5e1" font-size="8" font-family="monospace">- Saved to Obsidian</text>
          <text x="12" y="64" fill="#34d399" font-size="8" font-family="monospace">✓ Clean format</text>
        </g>
      </g>
    </svg>`
  },
  {
    id: 'privacy',
    label: 'Privacy & Security',
    count: 3,
    description: 'Block invasive trackers, secure passwords with biometric passkeys, and auto-clean cross-site tracking cookies.',
    subtitle: 'Manifest V3 compliant security suites with zero telemetry tracking and client-side encryption.',
    tags: ['Ad Blocker', 'Passkey Vault', 'Cookie Cleaner', 'Tracker Shield'],
    colorAccent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    heroIllustrationSvg: `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="cat-priv-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#022c22" />
          <stop offset="50%" stop-color="#064e3b" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="460" height="260" fill="url(#cat-priv-bg)" rx="16" />
      
      <!-- Privacy Security Center -->
      <g transform="translate(45, 30)">
        <rect width="370" height="200" rx="12" fill="#042f2e" stroke="#10b981" stroke-width="1.5" />
        
        <!-- Large Shield -->
        <g transform="translate(25, 35)">
          <circle cx="50" cy="55" r="45" fill="#064e3b" stroke="#34d399" stroke-width="2" />
          <path d="M50 25 L80 38 C80 72 50 90 50 90 C50 90 20 72 20 38 Z" fill="#059669" />
          <path d="M42 56 L48 62 L60 50" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <text x="50" y="118" fill="#a7f3d0" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">Shield Active</text>
        </g>

        <!-- Metric Bars Right -->
        <g transform="translate(145, 25)">
          <rect width="200" height="42" rx="8" fill="#064e3b" stroke="#047857" stroke-width="1" />
          <text x="15" y="22" fill="#a7f3d0" font-size="14" font-family="monospace" font-weight="bold">0 Trackers Leaked</text>
          <text x="15" y="34" fill="#6ee7b7" font-size="9" font-family="sans-serif">All 3rd-party beacons blocked</text>

          <rect y="50" width="200" height="42" rx="8" fill="#064e3b" stroke="#047857" stroke-width="1" />
          <text x="15" y="72" fill="#a7f3d0" font-size="14" font-family="monospace" font-weight="bold">256-bit AES Vault</text>
          <text x="15" y="84" fill="#6ee7b7" font-size="9" font-family="sans-serif">Biometric Passkey Authenticated</text>

          <rect y="100" width="200" height="42" rx="8" fill="#064e3b" stroke="#047857" stroke-width="1" />
          <text x="15" y="122" fill="#a7f3d0" font-size="14" font-family="monospace" font-weight="bold">Auto-Purge Cookies</text>
          <text x="15" y="134" fill="#6ee7b7" font-size="9" font-family="sans-serif">Containers wiped on tab close</text>
        </g>
      </g>
    </svg>`
  },
  {
    id: 'utilities',
    label: 'Workflow & Tabs',
    count: 2,
    description: 'Speed up reading comprehension and free browser memory by sleeping inactive background tabs.',
    subtitle: 'Lightweight system enhancements to make your browser faster and easier on battery life.',
    tags: ['Bionic Reading', 'Tab Suspender', 'RAM Saver', 'Accessibility'],
    colorAccent: 'text-sky-600 bg-sky-50 border-sky-200',
    heroIllustrationSvg: `<svg viewBox="0 0 460 260" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="cat-util-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0c4a6e" />
          <stop offset="50%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#064e3b" />
        </linearGradient>
      </defs>
      <rect width="460" height="260" fill="url(#cat-util-bg)" rx="16" />
      
      <!-- Utility Preview Hub -->
      <g transform="translate(45, 30)">
        <rect width="370" height="200" rx="12" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        
        <!-- Left: RAM Saver -->
        <g transform="translate(20, 25)">
          <rect width="155" height="150" rx="8" fill="#1e293b" />
          <text x="15" y="28" fill="#38bdf8" font-size="12" font-family="sans-serif" font-weight="bold">💤 Tab Suspender</text>
          <text x="15" y="55" fill="#4ade80" font-size="22" font-family="monospace" font-weight="bold">1.8 GB</text>
          <text x="15" y="72" fill="#94a3b8" font-size="9" font-family="sans-serif">Memory Saved</text>
          
          <rect x="15" y="88" width="125" height="26" rx="4" fill="#052e16" />
          <text x="77" y="105" fill="#86efac" font-size="9" font-family="sans-serif" text-anchor="middle">🔋 +1.5h Battery Boost</text>
          
          <text x="15" y="132" fill="#cbd5e1" font-size="8" font-family="sans-serif">Instant wake on hover</text>
        </g>

        <!-- Right: Bionic Reading Excerpt -->
        <g transform="translate(195, 25)">
          <rect width="155" height="150" rx="8" fill="#1e293b" />
          <text x="15" y="28" fill="#38bdf8" font-size="12" font-family="sans-serif" font-weight="bold">📖 Bionic Fast Read</text>
          
          <g transform="translate(15, 48)">
            <text x="0" y="14" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">Gui<tspan fill="#94a3b8" font-weight="normal">ded</tspan> fix<tspan fill="#94a3b8" font-weight="normal">ation</tspan></text>
            <text x="0" y="32" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">poi<tspan fill="#94a3b8" font-weight="normal">nts</tspan> inc<tspan fill="#94a3b8" font-weight="normal">rease</tspan></text>
            <text x="0" y="50" fill="#ffffff" font-size="10" font-family="sans-serif" font-weight="bold">rea<tspan fill="#94a3b8" font-weight="normal">ding</tspan> spe<tspan fill="#94a3b8" font-weight="normal">ed</tspan></text>
          </g>

          <rect x="15" y="112" width="125" height="24" rx="4" fill="#0369a1" />
          <text x="77" y="128" fill="#e0f2fe" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">⚡ 2.4× Speed Multiplier</text>
        </g>
      </g>
    </svg>`
  },
];

export const EXTENSIONS: Extension[] = [
  {
    id: 'deep-summarize-ai',
    name: 'OmniAI Page Summarizer',
    tagline: 'Instant LLM-powered page and video summaries with one click',
    description: 'Summarize articles, research papers, GitHub pull requests, and YouTube transcripts instantly using fast on-device & cloud models.',
    category: 'ai',
    categoryLabel: 'AI & Machine Learning',
    developer: 'OmniLabs Inc.',
    isVerified: true,
    rating: 4.9,
    reviewCount: 3842,
    userCount: '250,000+',
    version: '3.4.1',
    updatedDate: 'Aug 28, 2026',
    size: '1.8 MB',
    featured: true,
    editorsPick: true,
    badge: 'Featured',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-ai" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-ai)" />
      <!-- Subtle Grid -->
      <path d="M0 40h400M0 80h400M0 120h400M0 160h400M0 200h400M40 0v220M80 0v220M120 0v220M160 0v220M200 0v220M240 0v220M280 0v220M320 0v220M360 0v220" stroke="#334155" stroke-width="0.5" stroke-opacity="0.4" />
      
      <!-- Summarizer Card UI Preview -->
      <g transform="translate(40, 30)">
        <rect width="320" height="160" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5" />
        <!-- Top Bar -->
        <rect x="15" y="15" width="60" height="8" rx="4" fill="#38bdf8" />
        <rect x="85" y="15" width="40" height="8" rx="4" fill="#64748b" />
        <circle cx="295" cy="19" r="4" fill="#10b981" />
        <line x1="15" y1="35" x2="305" y2="35" stroke="#334155" stroke-width="1" />
        
        <!-- Summary Bullet Items -->
        <rect x="15" y="48" width="12" height="12" rx="3" fill="#0284c7" />
        <rect x="35" y="50" width="180" height="8" rx="4" fill="#e2e8f0" />
        <rect x="35" y="64" width="220" height="6" rx="3" fill="#94a3b8" />
        
        <rect x="15" y="82" width="12" height="12" rx="3" fill="#10b981" />
        <rect x="35" y="84" width="140" height="8" rx="4" fill="#e2e8f0" />
        <rect x="35" y="98" width="250" height="6" rx="3" fill="#94a3b8" />

        <rect x="15" y="116" width="12" height="12" rx="3" fill="#8b5cf6" />
        <rect x="35" y="118" width="160" height="8" rx="4" fill="#e2e8f0" />
        <rect x="35" y="132" width="190" height="6" rx="3" fill="#94a3b8" />

        <!-- AI Sparkle Tag -->
        <g transform="translate(225, 48)">
          <rect width="80" height="22" rx="11" fill="#0369a1" />
          <text x="40" y="15" fill="#e0f2fe" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle">✨ AI Summary</text>
        </g>
      </g>
    </svg>`,
    tags: ['AI', 'Summary', 'Productivity', 'YouTube'],
    permissions: ['Read active tab content', 'Storage', 'Context menus'],
    overview: [
      'Extract bullet points and key takeaways from any webpage in under 2 seconds.',
      'Supports YouTube video timestamps and transcript extraction.',
      'Export summaries to Markdown, Notion, and Obsidian.',
      'Zero tracking and private API key support.'
    ]
  },
  {
    id: 'inspector-pro-devtools',
    name: 'DevLens DOM & CSS Inspector',
    tagline: 'Modern visual DOM tree inspector with live CSS grid & flex debugging',
    description: 'Inspect layout boxes, detect color contrast issues, analyze bundle scripts, and view live component state directly in your browser.',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    developer: 'DevLens Team',
    isVerified: true,
    rating: 4.8,
    reviewCount: 2190,
    userCount: '180,000+',
    version: '4.2.0',
    updatedDate: 'Aug 24, 2026',
    size: '3.1 MB',
    featured: true,
    editorsPick: true,
    badge: "Editor's Choice",
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-dev" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#090d16" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-dev)" />
      
      <!-- DOM & CSS Inspector UI Preview -->
      <g transform="translate(35, 25)">
        <rect width="330" height="170" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5" stroke-opacity="0.6" />
        
        <!-- Left: DOM Tree -->
        <rect x="12" y="12" width="130" height="146" rx="6" fill="#1e293b" />
        <text x="22" y="28" fill="#93c5fd" font-size="10" font-family="monospace">&lt;main.hero&gt;</text>
        <text x="32" y="46" fill="#60a5fa" font-size="9" font-family="monospace">&lt;div.grid&gt;</text>
        <text x="42" y="64" fill="#38bdf8" font-size="9" font-family="monospace">&lt;header.title&gt;</text>
        <text x="42" y="82" fill="#a78bfa" font-size="9" font-family="monospace">&lt;button.cta&gt;</text>
        <text x="32" y="100" fill="#64748b" font-size="9" font-family="monospace">&lt;/div&gt;</text>
        <text x="22" y="118" fill="#93c5fd" font-size="10" font-family="monospace">&lt;/main&gt;</text>

        <!-- Right: Box Model / Computed CSS -->
        <rect x="152" y="12" width="166" height="146" rx="6" fill="#1e293b" />
        <!-- Nested Margin/Border/Padding Box -->
        <rect x="165" y="24" width="140" height="100" rx="4" fill="#ea580c" fill-opacity="0.2" stroke="#ea580c" stroke-width="1" stroke-dasharray="3,2" />
        <text x="235" y="36" fill="#fdba74" font-size="8" font-family="sans-serif" text-anchor="middle">margin: 24px</text>
        
        <rect x="180" y="44" width="110" height="65" rx="3" fill="#ca8a04" fill-opacity="0.2" stroke="#ca8a04" stroke-width="1" />
        <text x="235" y="56" fill="#fef08a" font-size="8" font-family="sans-serif" text-anchor="middle">padding: 16px</text>

        <rect x="195" y="64" width="80" height="35" rx="2" fill="#2563eb" fill-opacity="0.3" stroke="#3b82f6" stroke-width="1" />
        <text x="235" y="85" fill="#bfdbfe" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">384 × 120</text>

        <g transform="translate(165, 134)">
          <rect width="60" height="16" rx="3" fill="#1e40af" />
          <text x="30" y="12" fill="#dbeafe" font-size="8" font-family="monospace" text-anchor="middle">display: flex</text>
        </g>
        <g transform="translate(235, 134)">
          <rect width="70" height="16" rx="3" fill="#065f46" />
          <text x="35" y="12" fill="#a7f3d0" font-size="8" font-family="monospace" text-anchor="middle">gap: 1.5rem</text>
        </g>
      </g>
    </svg>`,
    tags: ['Developer Tools', 'CSS', 'DOM', 'Debug'],
    permissions: ['Developer Tools integration', 'Active tab access', 'Scripting'],
    overview: [
      'Deep inspection of Flexbox, Grid, and Container Queries.',
      'Instant accessibility audit & color contrast checker.',
      'Live Tailwind CSS class autocompletion and modifier testing.',
      'Export component snippets as clean HTML/CSS.'
    ]
  },
  {
    id: 'shield-guard-privacy',
    name: 'ShieldGuard Ad & Tracker Blocker',
    tagline: 'Ultra-fast lightweight tracker blocker with zero fingerprinting',
    description: 'Block annoying trackers, malicious scripts, and invasive popups without slowing down page load times using declarative net requests.',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    developer: 'PrivacyCore Foundation',
    isVerified: true,
    rating: 4.9,
    reviewCount: 9420,
    userCount: '650,000+',
    version: '5.0.2',
    updatedDate: 'Aug 30, 2026',
    size: '890 KB',
    featured: true,
    badge: 'Popular',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-shield" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#061d19" />
          <stop offset="100%" stop-color="#0f2e28" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-shield)" />
      
      <!-- Privacy Shield UI Preview -->
      <g transform="translate(45, 25)">
        <!-- Shield Graphic Left -->
        <g transform="translate(20, 25)">
          <circle cx="50" cy="55" r="45" fill="#042f2e" stroke="#10b981" stroke-width="2" />
          <path d="M50 25 L75 37 C75 65 50 82 50 82 C50 82 25 65 25 37 Z" fill="#059669" />
          <path d="M43 53 L48 58 L58 48" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" />
        </g>

        <!-- Stats on Right -->
        <g transform="translate(130, 15)">
          <rect width="170" height="42" rx="8" fill="#134e4a" stroke="#0d9488" stroke-width="1" />
          <text x="15" y="24" fill="#a7f3d0" font-size="14" font-family="sans-serif" font-weight="bold">42 Trackers</text>
          <text x="15" y="36" fill="#5eead4" font-size="9" font-family="sans-serif">Blocked on this site</text>

          <rect y="50" width="170" height="42" rx="8" fill="#134e4a" stroke="#0d9488" stroke-width="1" />
          <text x="15" y="74" fill="#a7f3d0" font-size="14" font-family="sans-serif" font-weight="bold">0.32s Faster</text>
          <text x="15" y="86" fill="#5eead4" font-size="9" font-family="sans-serif">Page load speedup</text>

          <rect y="100" width="170" height="42" rx="8" fill="#134e4a" stroke="#0d9488" stroke-width="1" />
          <text x="15" y="124" fill="#a7f3d0" font-size="14" font-family="sans-serif" font-weight="bold">Manifest V3</text>
          <text x="15" y="136" fill="#5eead4" font-size="9" font-family="sans-serif">Native declarative rule engine</text>
        </g>
      </g>
    </svg>`,
    tags: ['Privacy', 'Adblocker', 'Security', 'Fast'],
    permissions: ['declarativeNetRequest', 'Storage', 'Alarms'],
    overview: [
      'Built purely on Manifest V3 declarativeNetRequest engine for zero CPU lag.',
      'Blocks cookie consent banners automatically.',
      'Prevents canvas and audio fingerprinting.',
      'Custom filter lists with uBlock format compatibility.'
    ]
  },
  {
    id: 'tab-flow-workspace',
    name: 'TabFlow Workspace Manager',
    tagline: 'Organize, suspend, and group 100+ browser tabs seamlessly',
    description: 'Save memory by suspending idle tabs, organize your research into vertical workspace groups, and search open tabs with fuzzy search.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    developer: 'FlowCraft Software',
    isVerified: true,
    rating: 4.7,
    reviewCount: 1540,
    userCount: '90,000+',
    version: '2.8.0',
    updatedDate: 'Aug 19, 2026',
    size: '1.2 MB',
    badge: 'Trending',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-tabs" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1c1917" />
          <stop offset="100%" stop-color="#292524" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-tabs)" />
      
      <!-- Tab Workspaces UI Preview -->
      <g transform="translate(40, 25)">
        <rect width="320" height="170" rx="10" fill="#1c1917" stroke="#44403c" stroke-width="1.5" />
        
        <!-- Tab Group 1: Research -->
        <g transform="translate(15, 15)">
          <rect width="290" height="32" rx="6" fill="#292524" stroke="#d97706" stroke-width="1" />
          <circle cx="15" cy="16" r="5" fill="#f59e0b" />
          <text x="28" y="20" fill="#fef3c7" font-size="11" font-family="sans-serif" font-weight="600">Research & Papers (6 tabs)</text>
          <text x="275" y="20" fill="#a8a29e" font-size="10" text-anchor="end">420 MB</text>
        </g>

        <!-- Tab Group 2: Work -->
        <g transform="translate(15, 55)">
          <rect width="290" height="32" rx="6" fill="#292524" stroke="#2563eb" stroke-width="1" />
          <circle cx="15" cy="16" r="5" fill="#3b82f6" />
          <text x="28" y="20" fill="#dbeafe" font-size="11" font-family="sans-serif" font-weight="600">Development Workspace (12 tabs)</text>
          <text x="275" y="20" fill="#a8a29e" font-size="10" text-anchor="end">780 MB</text>
        </g>

        <!-- Tab Group 3: Design -->
        <g transform="translate(15, 95)">
          <rect width="290" height="32" rx="6" fill="#292524" stroke="#7c3aed" stroke-width="1" />
          <circle cx="15" cy="16" r="5" fill="#a855f7" />
          <text x="28" y="20" fill="#f3e8ff" font-size="11" font-family="sans-serif" font-weight="600">Figma & Assets (4 tabs)</text>
          <text x="275" y="20" fill="#a8a29e" font-size="10" text-anchor="end">310 MB</text>
        </g>

        <!-- Memory Saver Badge -->
        <g transform="translate(15, 136)">
          <rect width="290" height="22" rx="4" fill="#042f2e" />
          <text x="145" y="15" fill="#34d399" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle">⚡ 1.5 GB Memory Saved via Sleep</text>
        </g>
      </g>
    </svg>`,
    tags: ['Tabs', 'Memory', 'Productivity', 'Workspace'],
    permissions: ['Tabs', 'TabGroups', 'Storage', 'Alarms'],
    overview: [
      'Reduce browser memory usage by up to 80% with smart background suspension.',
      'Auto-group tabs by domain, project name, or search query.',
      'Sync workspaces across devices safely using encrypted backup.',
      'Keyboard navigation with quick command bar (`Alt+Space`).'
    ]
  },
  {
    id: 'json-craft-formatter',
    name: 'JSONCraft Beautiful Viewer',
    tagline: 'Interactive JSON & GraphQL formatter with schema validation and diffing',
    description: 'Format raw API responses in your browser into collapsible trees with search, JSONPath queries, schema validation, and CSV export.',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    developer: 'HexCode Studio',
    isVerified: true,
    rating: 4.8,
    reviewCount: 3120,
    userCount: '320,000+',
    version: '3.1.0',
    updatedDate: 'Aug 15, 2026',
    size: '1.4 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-json" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#082f49" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-json)" />
      
      <!-- JSON Viewer Code Preview -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        
        <!-- Code Window Bar -->
        <rect width="310" height="26" rx="10" fill="#1e293b" />
        <circle cx="15" cy="13" r="3.5" fill="#ef4444" />
        <circle cx="27" cy="13" r="3.5" fill="#f59e0b" />
        <circle cx="39" cy="13" r="3.5" fill="#10b981" />
        <text x="155" y="17" fill="#94a3b8" font-size="9" font-family="monospace" text-anchor="middle">response.json (200 OK)</text>

        <!-- Syntax Highlights -->
        <g transform="translate(15, 42)">
          <text x="0" y="12" fill="#cbd5e1" font-size="11" font-family="monospace">{</text>
          <text x="14" y="28" fill="#38bdf8" font-size="10" font-family="monospace">"status"</text>
          <text x="75" y="28" fill="#cbd5e1" font-size="10" font-family="monospace">: </text>
          <text x="88" y="28" fill="#a7f3d0" font-size="10" font-family="monospace">"success"</text>
          <text x="145" y="28" fill="#cbd5e1" font-size="10" font-family="monospace">,</text>

          <text x="14" y="46" fill="#38bdf8" font-size="10" font-family="monospace">"data"</text>
          <text x="55" y="46" fill="#cbd5e1" font-size="10" font-family="monospace">: {</text>

          <text x="28" y="64" fill="#38bdf8" font-size="10" font-family="monospace">"user_id"</text>
          <text x="90" y="64" fill="#cbd5e1" font-size="10" font-family="monospace">: </text>
          <text x="102" y="64" fill="#fcd34d" font-size="10" font-family="monospace">94021</text>
          <text x="142" y="64" fill="#cbd5e1" font-size="10" font-family="monospace">,</text>

          <text x="28" y="82" fill="#38bdf8" font-size="10" font-family="monospace">"verified"</text>
          <text x="95" y="82" fill="#cbd5e1" font-size="10" font-family="monospace">: </text>
          <text x="110" y="82" fill="#f43f5e" font-size="10" font-family="monospace">true</text>

          <text x="14" y="100" fill="#cbd5e1" font-size="10" font-family="monospace">}</text>
          <text x="0" y="118" fill="#cbd5e1" font-size="11" font-family="monospace">}</text>
        </g>
      </g>
    </svg>`,
    tags: ['JSON', 'Developer Tools', 'API', 'GraphQL'],
    permissions: ['Active tab', 'Clipboard read/write'],
    overview: [
      'Clean syntax highlighting with dark/light auto-theme.',
      'Filter JSON keys instantly using JSONPath and regex queries.',
      'Side-by-side JSON comparison and diff tool.',
      'One-click conversion to TypeScript interfaces and Go structs.'
    ]
  },
  {
    id: 'git-enhancer-web',
    name: 'GitLens Web Tree & Blame',
    tagline: 'Adds interactive file trees, code reviews, and author blame to GitHub',
    description: 'Supercharge your code browsing on GitHub with fast file tree navigation, inline git blame, copy permalinks, and PR review highlights.',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    developer: 'CodeStream Labs',
    isVerified: true,
    rating: 4.9,
    reviewCount: 4210,
    userCount: '410,000+',
    version: '4.0.5',
    updatedDate: 'Aug 27, 2026',
    size: '2.4 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-git" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#18181b" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-git)" />
      
      <!-- Git File Tree UI Preview -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#18181b" stroke="#3f3f46" stroke-width="1.5" />
        
        <!-- Header -->
        <rect width="310" height="28" rx="10" fill="#27272a" />
        <text x="15" y="18" fill="#e4e4e7" font-size="10" font-family="monospace" font-weight="600">📁 extlabs/src/components</text>
        <text x="295" y="18" fill="#10b981" font-size="9" font-family="monospace" text-anchor="end">main ✓</text>

        <!-- Tree Nodes -->
        <g transform="translate(15, 42)">
          <text x="5" y="16" fill="#a1a1aa" font-size="10" font-family="monospace">▸ components/</text>
          <text x="18" y="34" fill="#93c5fd" font-size="10" font-family="monospace">📄 Navbar.astro</text>
          <text x="18" y="52" fill="#93c5fd" font-size="10" font-family="monospace">📄 ExtensionCard.astro</text>
          <text x="18" y="70" fill="#93c5fd" font-size="10" font-family="monospace">📄 ExtensionModal.astro</text>

          <!-- Inline Blame Tooltip -->
          <g transform="translate(140, 42)">
            <rect width="140" height="34" rx="6" fill="#09090b" stroke="#52525b" stroke-width="1" />
            <text x="10" y="15" fill="#f43f5e" font-size="9" font-family="monospace">@alexsmith</text>
            <text x="70" y="15" fill="#71717a" font-size="8" font-family="sans-serif">2 hours ago</text>
            <text x="10" y="27" fill="#d4d4d8" font-size="8" font-family="sans-serif">feat: add modal stats</text>
          </g>
        </g>
      </g>
    </svg>`,
    tags: ['Git', 'GitHub', 'Code Review', 'Developer Tools'],
    permissions: ['github.com/*', 'gitlab.com/*', 'Storage'],
    overview: [
      'Instant IDE-style sidebar file tree for GitHub repositories and Pull Requests.',
      'Hover over any code line to see author, commit hash, and commit message.',
      'Copy markdown permalinks with one keyboard shortcut.',
      'Download individual repository subdirectories as zip.'
    ]
  },
  {
    id: 'smart-prompt-copilot',
    name: 'PromptMatrix AI Assistant',
    tagline: 'Smart floating prompt assistant for writing, coding, and email drafting',
    description: 'Access AI assistants anywhere on the web by typing `//` in any input box. Enhance emails, fix grammar, and generate code snippets.',
    category: 'ai',
    categoryLabel: 'AI & Machine Learning',
    developer: 'NeuralMatrix Inc.',
    isVerified: true,
    rating: 4.8,
    reviewCount: 1890,
    userCount: '140,000+',
    version: '2.1.3',
    updatedDate: 'Aug 29, 2026',
    size: '2.0 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-prompt" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#2e1065" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-prompt)" />
      
      <!-- Floating AI Prompt Box Preview -->
      <g transform="translate(45, 30)">
        <rect width="310" height="160" rx="12" fill="#1e1b4b" stroke="#8b5cf6" stroke-width="1.5" />
        
        <!-- Input line -->
        <g transform="translate(20, 25)">
          <text x="0" y="15" fill="#a78bfa" font-size="14" font-family="monospace" font-weight="bold">//</text>
          <text x="20" y="15" fill="#f5f3ff" font-size="12" font-family="sans-serif">Improve tone to make it professional</text>
          <rect x="255" y="4" width="2" height="14" fill="#a78bfa" />
        </g>

        <!-- Suggestions -->
        <g transform="translate(20, 58)">
          <rect width="270" height="30" rx="6" fill="#312e81" />
          <text x="12" y="19" fill="#c4b5fd" font-size="10" font-family="sans-serif">Option 1: "I am writing to follow up on our discussion..."</text>

          <rect y="36" width="270" height="30" rx="6" fill="#312e81" />
          <text x="12" y="55" fill="#c4b5fd" font-size="10" font-family="sans-serif">Option 2: "Thank you for your time earlier today..."</text>
        </g>

        <g transform="translate(20, 134)">
          <text x="0" y="12" fill="#7c3aed" font-size="9" font-family="sans-serif">Press Tab to accept • Esc to dismiss</text>
        </g>
      </g>
    </svg>`,
    tags: ['AI', 'Writing', 'Email', 'Productivity'],
    permissions: ['Active tab', 'Storage', 'Context menus'],
    overview: [
      'Inline prompt triggers on Gmail, Slack Web, Notion, and LinkedIn.',
      'Custom system prompts and tone of voice presets.',
      'Bring your own OpenAI, Anthropic, or Gemini API keys.',
      'Strict local storage without remote data logging.'
    ]
  },
  {
    id: 'focus-clock-pomodoro',
    name: 'FocusZen Minimal Timer',
    tagline: 'Distraction-free Pomodoro timer with website blocklists and ambient sound',
    description: 'Stay in the zone with clean minimalist intervals, ambient focus noises, and automatic domain blocking during active work sessions.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    developer: 'Zenith Design',
    isVerified: false,
    rating: 4.6,
    reviewCount: 880,
    userCount: '45,000+',
    version: '1.6.0',
    updatedDate: 'Aug 10, 2026',
    size: '1.1 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-zen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4c0519" />
          <stop offset="100%" stop-color="#1c1917" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-zen)" />
      
      <!-- Pomodoro Ring Preview -->
      <g transform="translate(130, 25)">
        <circle cx="70" cy="75" r="55" fill="none" stroke="#881337" stroke-width="8" />
        <circle cx="70" cy="75" r="55" fill="none" stroke="#f43f5e" stroke-width="8" stroke-dasharray="260, 350" stroke-linecap="round" />
        <text x="70" y="82" fill="#ffe4e6" font-size="22" font-family="monospace" font-weight="bold" text-anchor="middle">24:18</text>
        <text x="70" y="98" fill="#fda4af" font-size="9" font-family="sans-serif" text-anchor="middle">Deep Focus Interval</text>
      </g>
      <g transform="translate(140, 165)">
        <rect width="120" height="24" rx="12" fill="#881337" />
        <text x="60" y="16" fill="#fff1f2" font-size="10" font-family="sans-serif" font-weight="600" text-anchor="middle">🌧️ Rain Ambient On</text>
      </g>
    </svg>`,
    tags: ['Focus', 'Pomodoro', 'Timer', 'Productivity'],
    permissions: ['Alarms', 'Storage', 'declarativeNetRequest'],
    overview: [
      'Clean circular countdown display in browser action badge.',
      'Gentle chime audio and optional built-in white noise / rain soundscapes.',
      'Block distracting social media feeds during deep work sessions.',
      'Daily productivity streaks and time tracking graphs.'
    ]
  },
  {
    id: 'cookie-sentinel-pro',
    name: 'CookieSentinel Auto-Cleaner',
    tagline: 'Automatically isolate, inspect, and delete third-party tracking cookies',
    description: 'Keep your browser session clean. Automatically wipe session cookies when closing tabs and inspect cookie lifespans with a clean dashboard.',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    developer: 'CyberShield Collective',
    isVerified: true,
    rating: 4.7,
    reviewCount: 1220,
    userCount: '80,000+',
    version: '2.4.0',
    updatedDate: 'Aug 12, 2026',
    size: '950 KB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-cookie" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#134e4a" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-cookie)" />
      
      <!-- Cookie Cleaner Sandbox UI -->
      <g transform="translate(45, 30)">
        <rect width="310" height="160" rx="10" fill="#042f2e" stroke="#0d9488" stroke-width="1.5" />
        <g transform="translate(20, 20)">
          <rect width="125" height="115" rx="8" fill="#115e59" />
          <text x="15" y="25" fill="#ccfbf1" font-size="11" font-family="sans-serif" font-weight="bold">Trusted Sandboxes</text>
          <text x="15" y="45" fill="#5eead4" font-size="9" font-family="sans-serif">✓ accounts.google.com</text>
          <text x="15" y="65" fill="#5eead4" font-size="9" font-family="sans-serif">✓ github.com</text>
          <text x="15" y="85" fill="#5eead4" font-size="9" font-family="sans-serif">✓ linear.app</text>
        </g>
        <g transform="translate(160, 20)">
          <rect width="130" height="115" rx="8" fill="#134e4a" />
          <text x="15" y="25" fill="#fca5a5" font-size="11" font-family="sans-serif" font-weight="bold">Purged on Tab Close</text>
          <text x="15" y="45" fill="#f87171" font-size="9" font-family="sans-serif">✕ _ga_tracking (12)</text>
          <text x="15" y="65" fill="#f87171" font-size="9" font-family="sans-serif">✕ ad_session_id (8)</text>
          <text x="15" y="85" fill="#f87171" font-size="9" font-family="sans-serif">✕ cross_pixel_sync</text>
        </g>
      </g>
    </svg>`,
    tags: ['Cookie', 'Privacy', 'Security', 'Cleaner'],
    permissions: ['Cookies', 'Tabs', 'Storage'],
    overview: [
      'Isolate browsing sessions into clean sandbox containers.',
      'Whitelist login cookies for trusted websites with one click.',
      'Audit expiration dates of all stored cookies and local storage tokens.',
      'Zero remote servers or data collection.'
    ]
  },
  {
    id: 'markdown-web-clipper',
    name: 'MarkClipper Markdown Exporter',
    tagline: 'Convert any webpage, documentation, or recipe into clean Markdown',
    description: 'Clip full articles or selected paragraphs directly to clean Markdown. Strips headers, ads, and clutter for seamless import into Obsidian or Notion.',
    category: 'productivity',
    categoryLabel: 'Productivity',
    developer: 'Obsidian Devs',
    isVerified: true,
    rating: 4.9,
    reviewCount: 2600,
    userCount: '190,000+',
    version: '3.2.1',
    updatedDate: 'Aug 21, 2026',
    size: '1.3 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-md" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b" />
          <stop offset="100%" stop-color="#334155" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-md)" />
      
      <!-- Markdown Split Preview -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#0f172a" stroke="#64748b" stroke-width="1.5" />
        <g transform="translate(15, 20)">
          <text x="0" y="14" fill="#38bdf8" font-size="13" font-family="monospace" font-weight="bold"># Architecture Overview</text>
          <text x="0" y="36" fill="#94a3b8" font-size="10" font-family="monospace">---</text>
          <text x="0" y="52" fill="#e2e8f0" font-size="10" font-family="monospace">title: "Modern Extension Guide"</text>
          <text x="0" y="68" fill="#e2e8f0" font-size="10" font-family="monospace">author: "Engineering Team"</text>
          <text x="0" y="84" fill="#94a3b8" font-size="10" font-family="monospace">---</text>
          <text x="0" y="106" fill="#a7f3d0" font-size="10" font-family="monospace">### Key Performance Takeaways</text>
          <text x="0" y="124" fill="#e2e8f0" font-size="9" font-family="monospace">- Zero bundle size overhead</text>
        </g>
      </g>
    </svg>`,
    tags: ['Markdown', 'Obsidian', 'Notion', 'Clipper'],
    permissions: ['Active tab', 'Clipboard write', 'Storage'],
    overview: [
      'Converts tables, code blocks, math LaTeX formulas, and image links faithfully.',
      'Auto-detects article titles, publish dates, and canonical authors.',
      'Custom mustache template formatting for Obsidian frontmatter properties.',
      'One-click copy or direct `.md` file download.'
    ]
  },
  {
    id: 'api-quick-tester',
    name: 'RestNinja API Client',
    tagline: 'Lightweight in-browser HTTP & REST API tester without leaving your tab',
    description: 'Test endpoints, inspect request headers, replay network requests, and manage environment variables directly in a tidy slide-out panel.',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    developer: 'NinjaStack',
    isVerified: true,
    rating: 4.7,
    reviewCount: 1670,
    userCount: '110,000+',
    version: '1.9.4',
    updatedDate: 'Aug 18, 2026',
    size: '2.2 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-api" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#431407" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-api)" />
      
      <!-- HTTP Request Builder UI -->
      <g transform="translate(40, 25)">
        <rect width="320" height="170" rx="10" fill="#0f172a" stroke="#ea580c" stroke-width="1.5" />
        
        <!-- Endpoint URL Bar -->
        <g transform="translate(15, 15)">
          <rect width="55" height="26" rx="4" fill="#ea580c" />
          <text x="27" y="17" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">POST</text>
          
          <rect x="62" width="228" height="26" rx="4" fill="#1e293b" />
          <text x="72" y="17" fill="#e2e8f0" font-size="10" font-family="monospace">https://api.domain.io/v1/auth</text>
        </g>

        <!-- Response Status -->
        <g transform="translate(15, 52)">
          <rect width="80" height="20" rx="4" fill="#065f46" />
          <text x="40" y="14" fill="#a7f3d0" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">200 OK • 38ms</text>
        </g>

        <!-- Response Body -->
        <g transform="translate(15, 80)">
          <rect width="290" height="75" rx="6" fill="#1e293b" />
          <text x="12" y="20" fill="#38bdf8" font-size="9" font-family="monospace">"access_token"</text>
          <text x="100" y="20" fill="#cbd5e1" font-size="9" font-family="monospace">: </text>
          <text x="110" y="20" fill="#fde047" font-size="9" font-family="monospace">"jwt_948a...12"</text>
          
          <text x="12" y="38" fill="#38bdf8" font-size="9" font-family="monospace">"expires_in"</text>
          <text x="85" y="38" fill="#cbd5e1" font-size="9" font-family="monospace">: </text>
          <text x="95" y="38" fill="#f97316" font-size="9" font-family="monospace">3600</text>

          <text x="12" y="56" fill="#38bdf8" font-size="9" font-family="monospace">"token_type"</text>
          <text x="85" y="56" fill="#cbd5e1" font-size="9" font-family="monospace">: </text>
          <text x="95" y="56" fill="#a7f3d0" font-size="9" font-family="monospace">"Bearer"</text>
        </g>
      </g>
    </svg>`,
    tags: ['API', 'HTTP', 'REST', 'Developer Tools'],
    permissions: ['webRequest', 'Storage', 'Context menus'],
    overview: [
      'Slide-over sidepanel UI with GET, POST, PUT, DELETE, and PATCH methods.',
      'Capture and clone active XHR / Fetch requests from the current page.',
      'Environment variable support (`{{BASE_URL}}`, `{{AUTH_TOKEN}}`).',
      'Export requests to cURL, Fetch, Axios, and Python requests syntax.'
    ]
  },
  {
    id: 'pass-vault-guardian',
    name: 'KeyVault Passkey Manager',
    tagline: 'Zero-knowledge end-to-end encrypted password and passkey manager',
    description: 'Auto-fill secure credentials, generate high-entropy passwords, and store two-factor authenticator OTP codes securely with biometric lock.',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    developer: 'KeyVault Security',
    isVerified: true,
    rating: 4.8,
    reviewCount: 3500,
    userCount: '210,000+',
    version: '3.6.0',
    updatedDate: 'Aug 26, 2026',
    size: '3.5 MB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-pass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#022c22" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-pass)" />
      
      <!-- Biometric Passkey Prompt -->
      <g transform="translate(50, 30)">
        <rect width="300" height="160" rx="12" fill="#064e3b" stroke="#10b981" stroke-width="1.5" />
        <g transform="translate(30, 20)">
          <circle cx="20" cy="20" r="16" fill="#047857" />
          <path d="M14 20 L18 24 L26 16" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
          <text x="48" y="16" fill="#ffffff" font-size="12" font-family="sans-serif" font-weight="bold">Passkey Authentication</text>
          <text x="48" y="30" fill="#a7f3d0" font-size="9" font-family="sans-serif">Touch ID / Windows Hello Verified</text>
        </g>
        <g transform="translate(30, 75)">
          <rect width="240" height="32" rx="6" fill="#022c22" />
          <text x="15" y="20" fill="#e2e8f0" font-size="10" font-family="monospace">•••• •••• •••• •••• (256-bit AES)</text>
        </g>
        <g transform="translate(30, 120)">
          <text x="120" y="14" fill="#6ee7b7" font-size="9" font-family="sans-serif" text-anchor="middle">Zero Knowledge Client-Side Encryption</text>
        </g>
      </g>
    </svg>`,
    tags: ['Password', 'Security', '2FA', 'Encryption'],
    permissions: ['Autofill', 'Storage', 'Biometrics / Native messaging'],
    overview: [
      'AES-GCM 256-bit client-side zero-knowledge encryption.',
      'Built-in TOTP Authenticator generator with autofill.',
      'Passkey (WebAuthn) support for modern passwordless logins.',
      'Security health dashboard alerting for compromised or reused passwords.'
    ]
  },
  {
    id: 'quick-color-picker',
    name: 'PixelHex Eyedropper & Palette',
    tagline: 'Instant color picker with HEX, RGB, HSL, OKLCH and gradient exporter',
    description: 'Sample any pixel from any webpage or image, generate matching color palettes, test WCAG contrast ratios, and copy CSS code instantly.',
    category: 'dev',
    categoryLabel: 'Developer Tools',
    developer: 'Chromatic Design',
    isVerified: true,
    rating: 4.8,
    reviewCount: 2840,
    userCount: '270,000+',
    version: '2.9.0',
    updatedDate: 'Aug 22, 2026',
    size: '820 KB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-color" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a044e" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-color)" />
      
      <!-- Color Palette Swatches UI -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#18181b" stroke="#c026d3" stroke-width="1.5" />
        
        <!-- Large Eyedropper Loupe -->
        <g transform="translate(20, 20)">
          <rect width="60" height="60" rx="30" fill="#6366f1" stroke="#ffffff" stroke-width="3" />
          <text x="30" y="35" fill="#ffffff" font-size="10" font-family="monospace" font-weight="bold" text-anchor="middle">#6366F1</text>
        </g>

        <g transform="translate(95, 25)">
          <text x="0" y="14" fill="#fdf4ff" font-size="11" font-family="monospace" font-weight="bold">OKLCH: 0.62 0.22 278°</text>
          <text x="0" y="32" fill="#e879f9" font-size="10" font-family="monospace">RGB: 99, 102, 241</text>
          <text x="0" y="48" fill="#a5b4fc" font-size="9" font-family="sans-serif">WCAG AAA Contrast (12.4:1)</text>
        </g>

        <!-- Color Palette Bars -->
        <g transform="translate(20, 95)">
          <rect x="0" width="50" height="55" rx="6" fill="#4f46e5" />
          <rect x="55" width="50" height="55" rx="6" fill="#818cf8" />
          <rect x="110" width="50" height="55" rx="6" fill="#c084fc" />
          <rect x="165" width="50" height="55" rx="6" fill="#f472b6" />
          <rect x="220" width="50" height="55" rx="6" fill="#fb7185" />
        </g>
      </g>
    </svg>`,
    tags: ['Color', 'CSS', 'Design', 'Developer Tools'],
    permissions: ['Active tab', 'Clipboard write'],
    overview: [
      'Magnified pixel loupe eyedropper tool.',
      'Formats: HEX, RGB, HSL, CSS OKLCH, and Swift/Flutter color tokens.',
      'History of last 50 picked colors with auto-palette generation.',
      'Real-time WCAG 2.1 AA/AAA contrast checker against backgrounds.'
    ]
  },
  {
    id: 'speed-reader-bionic',
    name: 'BionicRead Fast Typography',
    tagline: 'Read articles and documents 2x faster with guided fixation points',
    description: 'Transform regular article text into guided fixation reading mode. Enhances comprehension and reading velocity effortlessly on any website.',
    category: 'utilities',
    categoryLabel: 'Workflow & Tabs',
    developer: 'NeuroRead Labs',
    isVerified: false,
    rating: 4.6,
    reviewCount: 910,
    userCount: '62,000+',
    version: '1.8.1',
    updatedDate: 'Aug 14, 2026',
    size: '760 KB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-read" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0c4a6e" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-read)" />
      
      <!-- Bionic Reading Sample -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#0f172a" stroke="#0284c7" stroke-width="1.5" />
        
        <g transform="translate(20, 25)">
          <text x="0" y="16" fill="#38bdf8" font-size="13" font-family="sans-serif" font-weight="bold">Bio<tspan fill="#bae6fd" font-weight="normal">nic</tspan> Read<tspan fill="#bae6fd" font-weight="normal">ing</tspan> High<tspan fill="#bae6fd" font-weight="normal">light</tspan></text>
          
          <text x="0" y="48" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold">Gui<tspan fill="#cbd5e1" font-weight="normal">ded</tspan> fix<tspan fill="#cbd5e1" font-weight="normal">ation</tspan> poi<tspan fill="#cbd5e1" font-weight="normal">nts</tspan> let <tspan fill="#cbd5e1" font-weight="normal">your</tspan> ey<tspan fill="#cbd5e1" font-weight="normal">es</tspan></text>
          <text x="0" y="70" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold">ski<tspan fill="#cbd5e1" font-weight="normal">m</tspan> fas<tspan fill="#cbd5e1" font-weight="normal">ter</tspan> thr<tspan fill="#cbd5e1" font-weight="normal">ough</tspan> art<tspan fill="#cbd5e1" font-weight="normal">icles</tspan> with<tspan fill="#cbd5e1" font-weight="normal">out</tspan></text>
          <text x="0" y="92" fill="#ffffff" font-size="11" font-family="sans-serif" font-weight="bold">los<tspan fill="#cbd5e1" font-weight="normal">ing</tspan> com<tspan fill="#cbd5e1" font-weight="normal">prehension</tspan> or con<tspan fill="#cbd5e1" font-weight="normal">text.</tspan></text>
        </g>

        <g transform="translate(20, 132)">
          <rect width="110" height="22" rx="11" fill="#0369a1" />
          <text x="55" y="15" fill="#e0f2fe" font-size="9" font-family="sans-serif" font-weight="bold" text-anchor="middle">⚡ 450 Words / Min</text>
        </g>
      </g>
    </svg>`,
    tags: ['Reading', 'Speed', 'Workflow', 'Accessibility'],
    permissions: ['Active tab', 'Storage'],
    overview: [
      'Highlights the initial characters of each word to guide eye fixation.',
      'Adjustable fixation strength and font sizing controls.',
      'Clean Reader Mode removing ads and cluttered navigation.',
      'Shortcut toggle (`Alt+B`) on any article.'
    ]
  },
  {
    id: 'tab-suspender-eco',
    name: 'EcoTab Idle Suspender',
    tagline: 'Automatic RAM & battery saver that puts idle browser tabs to sleep',
    description: 'Automatically sleep inactive tabs after a chosen timeout period to reduce RAM consumption, save laptop battery, and keep your browser fast.',
    category: 'utilities',
    categoryLabel: 'Workflow & Tabs',
    developer: 'GreenByte Tools',
    isVerified: true,
    rating: 4.8,
    reviewCount: 3100,
    userCount: '340,000+',
    version: '3.0.1',
    updatedDate: 'Aug 25, 2026',
    size: '980 KB',
    bannerSvg: `<svg viewBox="0 0 400 220" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="w-full h-full object-cover">
      <defs>
        <linearGradient id="g-eco" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#14532d" />
          <stop offset="100%" stop-color="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="400" height="220" fill="url(#g-eco)" />
      
      <!-- Tab Memory Gauge Preview -->
      <g transform="translate(45, 25)">
        <rect width="310" height="170" rx="10" fill="#052e16" stroke="#22c55e" stroke-width="1.5" />
        
        <g transform="translate(30, 25)">
          <text x="0" y="16" fill="#86efac" font-size="14" font-family="sans-serif" font-weight="bold">💤 18 Tabs Sleeping</text>
          <text x="0" y="36" fill="#4ade80" font-size="24" font-family="monospace" font-weight="bold">1.82 GB RAM</text>
          <text x="0" y="54" fill="#bbf7d0" font-size="10" font-family="sans-serif">Freed up from active memory</text>
        </g>

        <!-- Battery + Performance Status -->
        <g transform="translate(30, 95)">
          <rect width="250" height="32" rx="6" fill="#14532d" />
          <text x="15" y="20" fill="#dcfce7" font-size="10" font-family="sans-serif">🔋 Battery Life Extended by ~1.4 hrs</text>
        </g>

        <g transform="translate(30, 138)">
          <text x="0" y="14" fill="#4ade80" font-size="9" font-family="sans-serif">Instant wake on tab click • Zero lost work</text>
        </g>
      </g>
    </svg>`,
    tags: ['Tabs', 'Battery', 'RAM', 'Performance'],
    permissions: ['Tabs', 'Storage', 'Alarms'],
    overview: [
      'Saves up to 90% memory by freeing tab memory without losing scroll position.',
      'Whitelist audio-playing tabs, pinned tabs, and custom domains.',
      'Instant tab wakeup on click or hover.',
      'Shows live RAM saved in the popup dashboard.'
    ]
  }
];

export function getExtensionWithDefaults(ext: Extension) {
  const defaultFeatures: FeatureItem[] = ext.features || [
    {
      title: 'One-Click Instant Activation',
      description: 'Trigger instantly using keyboard shortcuts or the toolbar icon with zero configuration required.'
    },
    {
      title: 'Manifest V3 On-Device Execution',
      description: 'Built following modern web security standards with zero background memory bloat and private storage.'
    },
    {
      title: 'High-Performance Architecture',
      description: 'Sub-millisecond latency designed to run smoothly on low-spec hardware and save laptop battery.'
    },
    {
      title: 'Universal Browser Compatibility',
      description: 'Runs flawlessly across Chrome, Brave, Edge, Opera, and all Chromium-based desktop browsers.'
    }
  ];

  // Tailored Internal Execution Mechanics (How the extension operates under the hood)
  let defaultHowItWorks: HowItWorksItem[] = ext.howItWorks || [];
  if (defaultHowItWorks.length === 0) {
    if (ext.category === 'ai') {
      defaultHowItWorks = [
        {
          step: 1,
          title: 'Semantic DOM Parsing & Extraction',
          description: 'The background worker inspects the active page DOM, strips ad scripts, comments, and sidebars to extract clean readable text.'
        },
        {
          step: 2,
          title: 'Neural Token Optimization & Processing',
          description: 'Prepares compact embedding chunks and streams through high-speed inference with sub-300ms response time.'
        },
        {
          step: 3,
          title: 'Direct HUD Injection & Sync',
          description: 'Injects a zero-layout-shift Shadow DOM overlay with Markdown formatting, bullet summaries, and clipboard export.'
        }
      ];
    } else if (ext.category === 'dev') {
      defaultHowItWorks = [
        {
          step: 1,
          title: 'Shadow DOM Hooking & Inspection',
          description: 'Attaches an isolated inspection layer directly to the DOM tree without altering the host site CSS styles.'
        },
        {
          step: 2,
          title: 'Computed Layout & Metrics Engine',
          description: 'Calculates live Flexbox alignments, Grid tracks, box models, and WCAG AAA contrast ratios in real time.'
        },
        {
          step: 3,
          title: 'Instant Code Export & DevTools Sync',
          description: 'Generates clean Tailwind CSS, JSX components, or formatted JSON snippets ready for instant clipboard copying.'
        }
      ];
    } else if (ext.category === 'privacy') {
      defaultHowItWorks = [
        {
          step: 1,
          title: 'Declarative Request Interception',
          description: 'Evaluates network requests using the Manifest V3 declarativeNetRequest engine before any tracking scripts execute.'
        },
        {
          step: 2,
          title: 'Fingerprint & Canvas Randomization',
          description: 'Masks browser canvas signatures, WebGL hashes, and third-party tracking cookies dynamically per domain.'
        },
        {
          step: 3,
          title: 'Zero-Telemetry Local Shielding',
          description: 'Blocks malicious telemetry directly in browser memory without sending any analytics to external servers.'
        }
      ];
    } else if (ext.category === 'productivity') {
      defaultHowItWorks = [
        {
          step: 1,
          title: 'State & Session Capture',
          description: 'Listens to browser tab events and captures active workflows into encrypted chrome.storage.local.'
        },
        {
          step: 2,
          title: 'Low-Overhead Event Scheduling',
          description: 'Coordinates focus timers, pomodoros, or tab groups using native browser alarms without draining CPU cycles.'
        },
        {
          step: 3,
          title: 'Instant Dashboard Rendering',
          description: 'Displays a sub-millisecond reactive dashboard with quick hotkey triggers for uninterrupted daily productivity.'
        }
      ];
    } else {
      defaultHowItWorks = [
        {
          step: 1,
          title: 'Background Activity Monitoring',
          description: 'Monitors memory consumption, inactive tab idle thresholds, and battery status via lightweight event listeners.'
        },
        {
          step: 2,
          title: 'Memory Freezing & State Hibernation',
          description: 'Puts idle tabs and background resources into deep sleep while preserving scroll positions and form inputs.'
        },
        {
          step: 3,
          title: 'Instant Sub-Millisecond Rehydration',
          description: 'Restores the full page state and DOM context the exact millisecond the user clicks back onto the tab.'
        }
      ];
    }
  }

  // Tailored SEO Comparison Matrix against traditional alternative extensions
  let defaultComparison: ComparisonItem[] = ext.comparison || [];
  if (defaultComparison.length === 0) {
    if (ext.category === 'ai') {
      defaultComparison = [
        {
          feature: 'Data Privacy & Cloud Logging',
          current: '100% On-Device execution with zero server logging or user prompt retention.',
          others: 'Transmits raw page text and search history to remote cloud servers.'
        },
        {
          feature: 'Memory Footprint',
          current: '< 16 MB Lightweight',
          others: '> 140 MB Background Bloat'
        },
        {
          feature: 'Inference Speed & Streaming',
          current: 'Sub-300ms high-speed streaming engine optimized for instant reading.',
          others: '3.5s - 8s high-latency cloud roundtrips with frequent timeout errors.'
        },
        {
          feature: 'Manifest Standard',
          current: 'Native Manifest V3',
          others: 'Legacy Manifest V2'
        },
        {
          feature: 'Pricing & Token Limits',
          current: '100% Free core capabilities with unlimited daily page summaries.',
          others: 'Strict daily token caps and recurring monthly subscriptions.'
        }
      ];
    } else if (ext.category === 'dev') {
      defaultComparison = [
        {
          feature: 'DOM Style Isolation',
          current: 'Shadow DOM Encapsulation (Zero global CSS bleed into inspected webpage).',
          others: 'Injects un-isolated inline styles that break client page layouts.'
        },
        {
          feature: 'Execution Overhead',
          current: '< 4ms Latency',
          others: 'Heavy CPU Freezes'
        },
        {
          feature: 'Export & Code Generation',
          current: 'Instantly generates clean Tailwind CSS classes, JSX tokens, and CSS variables.',
          others: 'Restricted to basic raw text dumps or unformatted CSS blocks.'
        },
        {
          feature: 'Telemetry Policy',
          current: 'Zero Domain Tracking',
          others: 'Logs visited domains'
        },
        {
          feature: 'Feature Paywalls',
          current: '100% Open & Unrestricted inspection tools for all developers.',
          others: 'Paywalled "Pro" features requiring license activation keys.'
        }
      ];
    } else if (ext.category === 'privacy') {
      defaultComparison = [
        {
          feature: 'Network Filter Architecture',
          current: 'Native declarativeNetRequest engine operating directly at browser network layer.',
          others: 'Legacy JS blocking hooks that noticeably degrade page scrolling and FPS.'
        },
        {
          feature: 'RAM Consumption',
          current: '< 12 MB Footprint',
          others: '> 90 MB Background RAM'
        },
        {
          feature: 'Fingerprinting Protection',
          current: 'Dynamic Canvas and WebGL noise randomization to prevent cross-site tracking.',
          others: 'Basic cookie blocking without advanced canvas fingerprint defense.'
        },
        {
          feature: 'Update Frequency',
          current: 'Weekly Filter Lists',
          others: 'Infrequent Updates'
        },
        {
          feature: 'Telemetry & Monitization',
          current: 'Guaranteed 0% telemetry collection and zero sellable user tracking profiles.',
          others: 'Collects anonymized browsing metrics and upsells paid VPN tiers.'
        }
      ];
    } else {
      defaultComparison = [
        {
          feature: 'Tab Suspension Efficiency',
          current: 'Releases up to 90% inactive memory without losing unsubmitted form drafts.',
          others: 'Basic tab discarding that reloads full web pages and loses input text.'
        },
        {
          feature: 'Wakeup Latency',
          current: 'Sub-millisecond Rehydration',
          others: 'Slow Network Reload'
        },
        {
          feature: 'Battery Optimization',
          current: 'Suppresses background timer execution to extend laptop battery life by ~1.5 hours.',
          others: 'Unregulated background script polling continuously waking up laptop CPU.'
        },
        {
          feature: 'Sleeping Tab Limits',
          current: 'Unlimited Sleeping Tabs',
          others: 'Capped at 10 Tabs'
        },
        {
          feature: 'State & Input Preservation',
          current: 'Preserves exact scroll position, expanded accordions, and draft inputs.',
          others: 'Resets tab state back to default top-of-page view upon restoration.'
        }
      ];
    }
  }

  const defaultWhyChooseUs = ext.whyChooseUs || [
    {
      title: '100% Privacy-First & Zero Telemetry',
      description: 'We do not collect personal browsing histories or sell data to third-party data brokers.'
    },
    {
      title: 'Lightweight & Memory Efficient',
      description: 'Optimized to use less than 15 MB of RAM during peak usage, keeping your browser snappy.'
    },
    {
      title: 'Active Community & Frequent Updates',
      description: 'Maintained with regular security patches, bug fixes, and feature additions based on user feedback.'
    }
  ];

  const defaultFaqs: FAQItem[] = ext.faqs || [
    {
      question: `Is ${ext.name} completely free to use?`,
      answer: `Yes, ${ext.name} is 100% free to download and use. It is supported by verified developer sponsors and requires no paid subscription for core features.`
    },
    {
      question: `Which web browsers are supported?`,
      answer: `${ext.name} is built on open Manifest V3 standards and is fully compatible with Google Chrome, Microsoft Edge, Brave Browser, Opera, and Vivaldi.`
    },
    {
      question: `Does ${ext.name} collect my personal data?`,
      answer: `No. All operations run locally inside your browser sandbox. No telemetry or browsing history is tracked or transmitted to external servers.`
    },
    {
      question: `How do I uninstall or disable the extension?`,
      answer: `You can right-click the extension icon in your browser toolbar and select "Remove from Chrome..." or manage it anytime from chrome://extensions.`
    }
  ];

  const defaultRatingBreakdown = ext.ratingBreakdown || {
    5: Math.round(ext.reviewCount * 0.78),
    4: Math.round(ext.reviewCount * 0.14),
    3: Math.round(ext.reviewCount * 0.05),
    2: Math.round(ext.reviewCount * 0.02),
    1: Math.round(ext.reviewCount * 0.01)
  };

  const defaultReviews: ReviewItem[] = ext.reviews || [
    {
      author: 'Alex Mercer',
      date: '2 days ago',
      rating: 5,
      title: 'Indispensable tool in my daily workflow!',
      comment: `I have been using ${ext.name} every single day. The speed is remarkable and it saves me at least 30 minutes daily. Highly recommended!`,
      verified: true
    },
    {
      author: 'Sarah Chen',
      date: '1 week ago',
      rating: 5,
      title: 'Clean, fast, and no unnecessary clutter',
      comment: 'Super crisp UI that fits right into my browser. Love the zero-latency response and respectful privacy permissions.',
      verified: true
    },
    {
      author: 'David Miller',
      date: '3 weeks ago',
      rating: 4,
      title: 'Great extension with solid performance',
      comment: 'Works flawlessly on Chrome and Brave. Would love to see even more custom keyboard shortcuts in the next update!',
      verified: true
    },
    {
      author: 'Elena Rostova',
      date: '1 month ago',
      rating: 5,
      title: 'Best-in-class performance & zero memory leaks',
      comment: 'Replaced my previous heavy extension with this one. RAM usage dropped from 180MB to 12MB. Essential install.',
      verified: true
    },
    {
      author: 'Marcus Vance',
      date: '1 month ago',
      rating: 4,
      title: 'Very useful utility',
      comment: 'Smooth operation and reliable background syncing. UI is clean and doesn\'t distract from web browsing.',
      verified: true
    },
    {
      author: 'Jordan Reed',
      date: '2 months ago',
      rating: 3,
      title: 'Solid foundation, waiting for Firefox port',
      comment: 'Great on Chromium browsers. Hoping for Firefox Manifest V3 support soon!',
      verified: false
    }
  ];

  const defaultSupport: DeveloperSupportInfo = ext.developerSupport || {
    email: `support@${ext.id}.extlabs.io`,
    website: `https://${ext.id}.extlabs.io`,
    github: `https://github.com/extlabs/${ext.id}`,
    supportUrl: `https://extlabs.io/support/${ext.id}`,
    privacyPolicy: `https://extlabs.io/privacy`
  };

  const defaultYoutubeVideoId = ext.youtubeVideoId || 'dQw4w9WgXcQ';

  return {
    ...ext,
    features: defaultFeatures,
    howItWorks: defaultHowItWorks,
    whyChooseUs: defaultWhyChooseUs,
    comparison: defaultComparison,
    faqs: defaultFaqs,
    ratingBreakdown: defaultRatingBreakdown,
    reviews: defaultReviews,
    developerSupport: defaultSupport,
    youtubeVideoId: defaultYoutubeVideoId,
    downloadUrl: ext.downloadUrl || '#',
    monetagUrl: ext.monetagUrl || 'https://monetag.com'
  };
}

export function getRelatedExtensions(currentExtId: string, category: string, limit: number = 3): Extension[] {
  return EXTENSIONS
    .filter(ext => ext.id !== currentExtId && ext.category === category)
    .slice(0, limit);
}
