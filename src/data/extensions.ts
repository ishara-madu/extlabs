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
  id?: string;
  userId?: string;
  avatarUrl?: string;
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
  supportUrl?: string;
  docsUrl?: string;
  privacyPolicy: string;
}

export interface ComparisonItem {
  feature: string;
  current: string;
  others: string;
}

export interface Extension {
  id: string;
  dbId?: string;
  slug?: string;
  developerId?: string;
  name: string;
  tagline: string;
  description: string;
  category: 'privacy' | 'media' | 'automation' | 'customization' | 'ai' | 'dev' | 'productivity' | 'networking' | 'social' | 'shopping' | string;
  categoryLabel: string;
  developer: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  userCount: string;
  version: string;
  updatedDate: string;
  createdDate?: string;
  size?: string;
  featured?: boolean;
  editorsPick?: boolean;
  badge?: string;
  iconSvg?: string;
  iconUrl?: string;
  bannerSvg: string;
  headerImageUrl?: string;
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
  license?: string;
  manifestVersion?: string;
  supportedBrowsers?: string[];
  status?: string;
  isDraft?: boolean;
  isActive?: boolean;
  isSuspended?: boolean;
}

export interface CategoryInfo {
  id: string;
  label: string;
  count: number;
  description: string;
  subtitle: string;
  tags: string[];
  colorAccent: string;
  imageUrl?: string;
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
    imageUrl: '/images/categories/privacy.avif',
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
    imageUrl: '/images/categories/media.avif',
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
    imageUrl: '/images/categories/automation.avif',
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
    imageUrl: '/images/categories/customization.avif',
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
    imageUrl: '/images/categories/ai.avif',
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
    imageUrl: '/images/categories/dev.avif',
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
    imageUrl: '/images/categories/productivity.avif',
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
    imageUrl: '/images/categories/networking.avif',
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
    imageUrl: '/images/categories/social.avif',
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
    imageUrl: '/images/categories/shopping.avif',
    heroIllustrationSvg: '',
  },
];

export const EXTENSIONS: Extension[] = [];

