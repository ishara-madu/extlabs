// src/data/reports.ts

export interface AbuseReport {
  id: string;
  extensionId: string;
  extensionName: string;
  extensionVersion: string;
  developer: string;
  reporterType: 'Community User' | 'Automated Watchdog' | 'Security Researcher';
  reporterIdentifier: string;
  type: 'Malware & Security' | 'Deceptive Advertising' | 'Broken Functionality' | 'Impersonation' | 'Privacy Leak';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reportedAt: string;
  status: 'open' | 'investigating' | 'resolved' | 'dismissed';
}

export const ABUSE_REPORTS_DATA: AbuseReport[] = [
  {
    id: "rep-001",
    extensionId: "tab-suspender-eco",
    extensionName: "Tab Suspender Eco",
    extensionVersion: "v1.8.2",
    developer: "eco-browser-team",
    reporterType: "Community User",
    reporterIdentifier: "alex.dev@gmail.com",
    type: "Broken Functionality",
    severity: "medium",
    title: "Session recovery fails when waking 20+ tabs",
    description: "After the v1.8.2 update, waking more than 20 tabs simultaneously causes Chrome memory spikes and crashes the background service worker.",
    reportedAt: "2 hours ago",
    status: "open"
  },
  {
    id: "rep-002",
    extensionId: "smart-prompt-copilot",
    extensionName: "Smart Prompt Copilot",
    extensionVersion: "v2.0.4",
    developer: "prompt-masters",
    reporterType: "Security Researcher",
    reporterIdentifier: "cert@infosec-labs.io",
    type: "Deceptive Advertising",
    severity: "high",
    title: "Unexpected redirect link on popup open",
    description: "Monetag interstitial triggers external affiliate tab on first install before user consents to developer monetization agreement.",
    reportedAt: "6 hours ago",
    status: "open"
  },
  {
    id: "rep-003",
    extensionId: "cookie-sentinel-pro",
    extensionName: "Cookie Sentinel Pro",
    extensionVersion: "v2.1.0",
    developer: "privacy-guard-labs",
    reporterType: "Automated Watchdog",
    reporterIdentifier: "ExtLabs Static Scanner",
    type: "Privacy Leak",
    severity: "high",
    title: "Broad host permission scope detected",
    description: "Manifest request for '*://*.google.com/*' exceeds core cookie deletion functional scope. Manual permission review required.",
    reportedAt: "1 day ago",
    status: "investigating"
  },
  {
    id: "rep-004",
    extensionId: "git-enhancer-web",
    extensionName: "Git Enhancer Web",
    extensionVersion: "v1.4.0",
    developer: "dev-craft-tools",
    reporterType: "Community User",
    reporterIdentifier: "github-enthusiast@outlook.com",
    type: "Impersonation",
    severity: "low",
    title: "Logo resembles official GitHub Octocat branding",
    description: "Extension icon in store shelf resembles trademarked assets without explicit third-party attribution notice in manifest.",
    reportedAt: "2 days ago",
    status: "investigating"
  },
  {
    id: "rep-005",
    extensionId: "api-quick-tester",
    extensionName: "API Quick Tester",
    extensionVersion: "v1.1.2",
    developer: "dev-craft-tools",
    reporterType: "Community User",
    reporterIdentifier: "sarah_k@devteam.org",
    type: "Broken Functionality",
    severity: "low",
    title: "CORS preflight bypass toggle unresponsive",
    description: "The custom headers modal does not persist between popup reopens on macOS Chromium builds.",
    reportedAt: "4 days ago",
    status: "resolved"
  },
  {
    id: "rep-006",
    extensionId: "deep-summarize-ai",
    extensionName: "Deep Summarize AI",
    extensionVersion: "v1.9.0",
    developer: "extlabs-official",
    reporterType: "Automated Watchdog",
    reporterIdentifier: "ExtLabs CDN Gateway",
    type: "Malware & Security",
    severity: "critical",
    title: "Remote code execution check cleared",
    description: "Automated probe tested manifest for unvetted remote script injections. Package bundle fully verified compliant with MV3 CSP.",
    reportedAt: "5 days ago",
    status: "resolved"
  },
  {
    id: "rep-007",
    extensionId: "pass-vault-guardian",
    extensionName: "PassVault Guardian",
    extensionVersion: "v3.0.1",
    developer: "privacy-guard-labs",
    reporterType: "Security Researcher",
    reporterIdentifier: "audit@crypto-sec.org",
    type: "Malware & Security",
    severity: "critical",
    title: "AES-GCM encryption routine verification",
    description: "Independent penetration test verified zero client-side key leaks in local IndexedDB storage. Ticket closed as verified secure.",
    reportedAt: "1 week ago",
    status: "resolved"
  },
  {
    id: "rep-008",
    extensionId: "quick-color-picker",
    extensionName: "Quick Color Picker",
    extensionVersion: "v1.0.4",
    developer: "pixel-craft-design",
    reporterType: "Community User",
    reporterIdentifier: "troll_user@tempmail.com",
    type: "Malware & Security",
    severity: "low",
    title: "Spam report alleging data theft without evidence",
    description: "Reporter submitted blank payload without reproducible crash logs. Extension source code audited and determined completely safe.",
    reportedAt: "1 week ago",
    status: "dismissed"
  }
];

export const OPEN_REPORTS_COUNT = ABUSE_REPORTS_DATA.filter(r => r.status === 'open').length;
export const INVESTIGATING_REPORTS_COUNT = ABUSE_REPORTS_DATA.filter(r => r.status === 'investigating').length;
export const RESOLVED_REPORTS_COUNT = ABUSE_REPORTS_DATA.filter(r => r.status === 'resolved').length;
