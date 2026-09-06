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
  iconUrl?: string;
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
  heroIllustrationSvg?: string;
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'privacy',
    label: 'Adblock & Content Filters',
    count: 0,
    description: 'Block intrusive ads, bypass restrictive paywalls, skip ad-links, and neutralize tracking scripts.',
    subtitle: 'Clean, unrestricted browsing with adblockers, paywall bypassers, and anti-tracker shields.',
    tags: ['Ad Blocker', 'Paywall Bypass', 'Link Skipper', 'Anti-Adblock', 'Tracker Shield'],
    colorAccent: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'media',
    label: 'Media & Downloaders',
    count: 0,
    description: 'Download videos, extract audio streams, capture full-resolution graphics, and enhance web media players.',
    subtitle: 'Grab video and audio from popular platforms and unlock high-definition media playback.',
    tags: ['Video Downloader', 'Audio Ripper', 'Stream Grabber', 'Volume Booster', 'Media Saver'],
    colorAccent: 'text-rose-600 bg-rose-50 border-rose-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'automation',
    label: 'Automation & Scripts',
    count: 0,
    description: 'Run userscripts, automate repetitive browser actions, auto-fill forms, and schedule background macros.',
    subtitle: 'Unleash custom user scripts and browser automations with high-efficiency bots and macro runners.',
    tags: ['Userscripts', 'Auto Clicker', 'Web Bot', 'Macro Runner', 'Form Auto-Fill'],
    colorAccent: 'text-purple-600 bg-purple-50 border-purple-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'customization',
    label: 'Web Modifiers & Themes',
    count: 0,
    description: 'Transform website aesthetics with dark modes, custom styling, layout modifiers, and UI feature unlockers.',
    subtitle: 'Personalize any website layout, remove clutter, and inject custom CSS/JS styling effortlessly.',
    tags: ['Dark Mode', 'CSS Injector', 'Site Cleaner', 'UI Modder', 'Theme Switcher'],
    colorAccent: 'text-pink-600 bg-pink-50 border-pink-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'ai',
    label: 'AI & Smart Tools',
    count: 0,
    description: 'Integrate intelligent LLM assistants, instant text summarizers, prompt copilots, and smart automation.',
    subtitle: 'Supercharge your browsing velocity with cloud and on-device intelligent AI helpers.',
    tags: ['AI Copilot', 'Summarizer', 'Prompt Assistant', 'LLM Injector', 'Chatbot Helper'],
    colorAccent: 'text-sky-600 bg-sky-50 border-sky-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'dev',
    label: 'Developer & Power Tools',
    count: 0,
    description: 'Inspect network traffic, modify HTTP headers, debug APIs, manage cookies, and analyze page DOM.',
    subtitle: 'Professional diagnostic and power-user utilities for web engineers, reverse engineers, and testers.',
    tags: ['Header Modifier', 'Request Inspector', 'API Tester', 'Cookie Manager', 'DOM Inspector'],
    colorAccent: 'text-blue-600 bg-blue-50 border-blue-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'productivity',
    label: 'Productivity & Workflow',
    count: 0,
    description: 'Organize tab groups, suspend memory-hogging pages, clip web research, and optimize daily workflows.',
    subtitle: 'Reduce system memory consumption, manage infinite tabs, and boost daily browsing speed.',
    tags: ['Tab Suspender', 'Tab Manager', 'RAM Optimizer', 'Markdown Clipper', 'Focus Timer'],
    colorAccent: 'text-amber-600 bg-amber-50 border-amber-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'networking',
    label: 'Proxies & Network Unblockers',
    count: 0,
    description: 'Bypass geo-restrictions, switch proxies on the fly, spoof user agents, and unblock restricted domains.',
    subtitle: 'Fast proxy switchers, VPN clients, DNS resolvers, and geo-block unblockers for free internet.',
    tags: ['Proxy Switcher', 'Geo Bypass', 'VPN Client', 'User-Agent Spoof', 'DNS Unblocker'],
    colorAccent: 'text-teal-600 bg-teal-50 border-teal-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'social',
    label: 'Social Media & Community',
    count: 0,
    description: 'Enhance social networks with ghost modes, feed cleaners, bulk actions, and direct story downloaders.',
    subtitle: 'Take full control of social feeds, clean sponsored posts, and unlock private viewing features.',
    tags: ['Ghost Mode', 'Feed Cleaner', 'Story Downloader', 'Bulk Action', 'Social Suite'],
    colorAccent: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    heroIllustrationSvg: '',
  },
  {
    id: 'shopping',
    label: 'Shopping & Rewards',
    count: 0,
    description: 'Automatically apply discount coupon codes, track price fluctuations over time, and harvest online rewards.',
    subtitle: 'Never overpay online with automatic coupon finders, price drop alerts, and reward auto-claimers.',
    tags: ['Auto Coupon', 'Price Tracker', 'Reward Bot', 'Cashback', 'Deal Finder'],
    colorAccent: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    heroIllustrationSvg: '',
  },
];

export const EXTENSIONS: Extension[] = [];

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
    iconUrl: ext.iconUrl || '/icons/extension-placeholder.avif',
    downloadUrl: ext.downloadUrl || '#',
    monetagUrl: ext.monetagUrl || 'https://monetag.com'
  };
}

export function getRelatedExtensions(currentExtId: string, category: string, limit: number = 3): Extension[] {
  return EXTENSIONS
    .filter(ext => ext.id !== currentExtId && ext.category === category)
    .slice(0, limit);
}
