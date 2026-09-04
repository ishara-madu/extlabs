// src/data/admins.ts

export interface AdminMember {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: 'super_admin' | 'security_auditor' | 'moderator' | 'support';
  roleLabel: string;
  status: 'active' | 'invited' | 'suspended';
  twoFactorEnabled: boolean;
  lastActive: string;
  permissions: string[];
  isPrimarySuperAdmin?: boolean;
}

export interface AdminActivityLog {
  id: string;
  adminName: string;
  adminUsername: string;
  adminAvatar: string;
  action: string;
  target: string;
  timestamp: string;
}

export const ADMIN_MEMBERS_DATA: AdminMember[] = [
  {
    id: "adm-001",
    name: "Ishara Madusanka",
    username: "ishara-madu",
    email: "ishara@extlabs.io",
    avatar: "/icons/github-profile-placeholder.avif",
    role: "super_admin",
    roleLabel: "Super Admin (Owner)",
    status: "active",
    twoFactorEnabled: true,
    lastActive: "Active Now",
    permissions: ["Root Authority", "Manage Admins", "Publish & Revoke", "Monetization Split", "Security Policies"],
    isPrimarySuperAdmin: true
  },
  {
    id: "adm-002",
    name: "Alex Thorne",
    username: "alex-security",
    email: "alex.t@extlabs.io",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face",
    role: "security_auditor",
    roleLabel: "Lead Security Auditor",
    status: "active",
    twoFactorEnabled: true,
    lastActive: "15m ago",
    permissions: ["Security Triage", "Permission Audits", "Malware Quarantining", "Review Queue"]
  },
  {
    id: "adm-003",
    name: "Elena Rostova",
    username: "elena-moderation",
    email: "elena@extlabs.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
    role: "moderator",
    roleLabel: "Content & Store Moderator",
    status: "active",
    twoFactorEnabled: true,
    lastActive: "1 hour ago",
    permissions: ["Review Queue", "Approve & Reject", "Directory Curation", "Abuse Reports"]
  },
  {
    id: "adm-004",
    name: "Marcus Vance",
    username: "marcus-compliance",
    email: "marcus.v@extlabs.io",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face",
    role: "moderator",
    roleLabel: "Submission Moderator",
    status: "active",
    twoFactorEnabled: true,
    lastActive: "3 hours ago",
    permissions: ["Review Queue", "Abuse Reports", "Developer Communications"]
  },
  {
    id: "adm-005",
    name: "Kavinda Perera",
    username: "kavinda-devops",
    email: "kavinda@extlabs.io",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&fit=crop&crop=face",
    role: "security_auditor",
    roleLabel: "Infrastructure Auditor",
    status: "active",
    twoFactorEnabled: true,
    lastActive: "Yesterday",
    permissions: ["CDN Edge Nodes", "Static Crawler Scanner", "Telemetry Audits"]
  },
  {
    id: "adm-006",
    name: "Sarah Jenkins",
    username: "sarah-support",
    email: "sarah.j@extlabs.io",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96&h=96&fit=crop&crop=face",
    role: "support",
    roleLabel: "Developer Relations",
    status: "invited",
    twoFactorEnabled: false,
    lastActive: "Invite Sent",
    permissions: ["Read-Only Queue", "Developer Inquiries", "Documentation"]
  }
];

export const RECENT_AUDIT_LOGS: AdminActivityLog[] = [
  {
    id: "log-001",
    adminName: "Ishara Madusanka",
    adminUsername: "ishara-madu",
    adminAvatar: "/icons/github-profile-placeholder.avif",
    action: "Updated monetization split pacing ratio to 5:1",
    target: "Platform Monetag Settings",
    timestamp: "24m ago"
  },
  {
    id: "log-002",
    adminName: "Alex Thorne",
    adminUsername: "alex-security",
    adminAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face",
    action: "Approved package and cleared static AST scan",
    target: "API Quick Tester (v1.2.0)",
    timestamp: "1h ago"
  },
  {
    id: "log-003",
    adminName: "Elena Rostova",
    adminUsername: "elena-moderation",
    adminAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face",
    action: "Dismissed community abuse ticket #rep-008",
    target: "Quick Color Picker",
    timestamp: "3h ago"
  },
  {
    id: "log-004",
    adminName: "Ishara Madusanka",
    adminUsername: "ishara-madu",
    adminAvatar: "/icons/github-profile-placeholder.avif",
    action: "Invited new developer relations administrator",
    target: "sarah.j@extlabs.io",
    timestamp: "Yesterday"
  }
];
