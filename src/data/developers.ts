// src/data/developers.ts

export interface DeveloperAccount {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email: string;
  githubUrl: string;
  extensionsCount: number;
  totalDownloads: string;
  status: 'verified' | 'active' | 'pending';
  joinedDate: string;
  primaryCategory: string;
}

export const DEVELOPERS_DATA: DeveloperAccount[] = [
  {
    id: "extlabs-core",
    name: "ExtLabs Core Team",
    username: "extlabs-official",
    avatar: "/icons/github-profile-placeholder.avif",
    email: "core-team@extlabs.io",
    githubUrl: "https://github.com/extlabs",
    extensionsCount: 3,
    totalDownloads: "184.5K",
    status: "verified",
    joinedDate: "Jan 2026",
    primaryCategory: "Developer Tools"
  },
  {
    id: "dev-craft-tools",
    name: "DevCraft Software",
    username: "dev-craft-tools",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face",
    email: "contact@devcraft.tools",
    githubUrl: "https://github.com/devcraft-tools",
    extensionsCount: 2,
    totalDownloads: "76.2K",
    status: "verified",
    joinedDate: "Feb 2026",
    primaryCategory: "Developer Tools"
  },
  {
    id: "shield-guard-lab",
    name: "Privacy Guard Labs",
    username: "privacy-guard-labs",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=96&h=96&fit=crop&crop=face",
    email: "security@privacyguard.dev",
    githubUrl: "https://github.com/privacy-guard",
    extensionsCount: 2,
    totalDownloads: "92.0K",
    status: "verified",
    joinedDate: "Jan 2026",
    primaryCategory: "Privacy & Security"
  },
  {
    id: "flow-states-lab",
    name: "FlowStates Studio",
    username: "flow-states-lab",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=96&h=96&fit=crop&crop=face",
    email: "hello@flowstates.co",
    githubUrl: "https://github.com/flow-states",
    extensionsCount: 2,
    totalDownloads: "45.1K",
    status: "active",
    joinedDate: "Mar 2026",
    primaryCategory: "Productivity"
  },
  {
    id: "zen-dev-software",
    name: "ZenDev Workflows",
    username: "zen-dev-software",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
    email: "support@zendev.app",
    githubUrl: "https://github.com/zendev-team",
    extensionsCount: 1,
    totalDownloads: "34.8K",
    status: "active",
    joinedDate: "Feb 2026",
    primaryCategory: "Productivity"
  },
  {
    id: "pixel-craft",
    name: "PixelCraft Design Tools",
    username: "pixel-craft-design",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
    email: "creators@pixelcraft.studio",
    githubUrl: "https://github.com/pixelcraft",
    extensionsCount: 2,
    totalDownloads: "58.4K",
    status: "verified",
    joinedDate: "Jan 2026",
    primaryCategory: "Developer Tools"
  },
  {
    id: "eco-browser-team",
    name: "EcoBrowser Research",
    username: "eco-browser-team",
    avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=96&h=96&fit=crop&crop=face",
    email: "research@ecobrowser.org",
    githubUrl: "https://github.com/ecobrowser",
    extensionsCount: 1,
    totalDownloads: "118.0K",
    status: "verified",
    joinedDate: "Jan 2026",
    primaryCategory: "Workflow & Utilities"
  },
  {
    id: "prompt-masters",
    name: "PromptMasters AI",
    username: "prompt-masters-ai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    email: "info@promptmasters.ai",
    githubUrl: "https://github.com/promptmasters",
    extensionsCount: 1,
    totalDownloads: "64.9K",
    status: "active",
    joinedDate: "Mar 2026",
    primaryCategory: "AI & Machine Learning"
  },
  {
    id: "pkm-collective",
    name: "PKM Open Collective",
    username: "pkm-collective",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=96&h=96&fit=crop&crop=face",
    email: "maintainers@pkmcollective.org",
    githubUrl: "https://github.com/pkm-collective",
    extensionsCount: 1,
    totalDownloads: "29.3K",
    status: "active",
    joinedDate: "Apr 2026",
    primaryCategory: "Productivity"
  },
  {
    id: "inclusive-web",
    name: "Inclusive Web Initiative",
    username: "inclusive-web-hq",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
    email: "a11y@inclusiveweb.io",
    githubUrl: "https://github.com/inclusive-web",
    extensionsCount: 1,
    totalDownloads: "18.2K",
    status: "verified",
    joinedDate: "Feb 2026",
    primaryCategory: "Developer Tools"
  },
  {
    id: "indie-chain-dev",
    name: "Satoshi Indie Labs",
    username: "indie-chain-dev",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&fit=crop&crop=face",
    email: "build@satoshilabs.xyz",
    githubUrl: "https://github.com/indie-chain-dev",
    extensionsCount: 1,
    totalDownloads: "8.7K",
    status: "pending",
    joinedDate: "May 2026",
    primaryCategory: "Workflow & Utilities"
  },
  {
    id: "lunar-studio",
    name: "Lunar Theme Studio",
    username: "lunar-studio",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=96&h=96&fit=crop&crop=face",
    email: "themes@lunarstudio.design",
    githubUrl: "https://github.com/lunar-studio",
    extensionsCount: 1,
    totalDownloads: "52.0K",
    status: "active",
    joinedDate: "Mar 2026",
    primaryCategory: "Workflow & Utilities"
  }
];
