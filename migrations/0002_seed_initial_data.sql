-- migrations/0002_seed_initial_data.sql
-- Initial Seed Data for ExtLabs Platform

-- 1. Initial Platform Settings
INSERT OR IGNORE INTO platform_settings (key, value) VALUES
  ('store_name', 'ExtLabs Extension Store'),
  ('support_email', 'support@extlabs.io'),
  ('max_upload_size_mb', '25'),
  ('manifest_policy', 'mv3_strict'),
  ('submissions_open', 'true'),
  ('maintenance_mode', 'false'),
  ('ad_pacing_ratio', '5_to_1'),
  ('monetag_zone_id', 'extlabs_infra_zone_882941'),
  ('session_freq_cap', '1_per_session'),
  ('adblock_policy', 'silent_pass'),
  ('ast_scanner_enabled', 'true'),
  ('broad_permissions_guard', 'true'),
  ('zero_remote_scripts', 'true'),
  ('authorized_github_org', 'extlabs-team'),
  ('session_timeout', '8h');

-- 2. Initial Admin & Staff Users
INSERT OR IGNORE INTO users (id, github_id, username, email, name, avatar_url, role, status, two_factor_enabled) VALUES
  ('usr_admin_001', '583231', 'ishara-madu', 'isharamadushankab@gmail.com', 'Ishara Madusanka', 'https://avatars.githubusercontent.com/u/583231', 'super_admin', 'active', 1),
  ('usr_admin_002', '124982', 'alex-security', 'alex.t@extlabs.io', 'Alex Thorne', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop&crop=face', 'security_auditor', 'active', 1),
  ('usr_admin_003', '392819', 'elena-moderation', 'elena@extlabs.io', 'Elena Rostova', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=96&h=96&fit=crop&crop=face', 'moderator', 'active', 1),
  ('usr_admin_004', '491028', 'marcus-compliance', 'marcus.v@extlabs.io', 'Marcus Vance', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face', 'moderator', 'active', 1);

-- 3. Initial Developers
INSERT OR IGNORE INTO developers (id, user_id, slug, display_name, avatar_url, website, bio, primary_focus, is_verified, status) VALUES
  ('dev_extlabs', 'usr_admin_001', 'extlabs-team', 'ExtLabs Official Team', 'https://avatars.githubusercontent.com/u/583231', 'https://extlabs.io', 'Official engineering and security research team maintaining verified core utilities for the Chromium ecosystem.', 'Core Developer Utilities & Privacy Tools', 1, 'active'),
  ('dev_aether', NULL, 'aether-labs', 'AetherLabs Engineering', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=96&h=96&fit=crop', 'https://aetherlabs.dev', 'Specializing in next-generation browser privacy, encrypted cookie vaults, and sandboxed web tools.', 'Browser Security & Privacy Protection', 1, 'active'),
  ('dev_nova', NULL, 'nova-devtools', 'Nova DevTools Studio', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=96&h=96&fit=crop', 'https://novadev.tools', 'Building state-of-the-art developer inspection instruments and real-time network payload formatters.', 'Network Inspection & API Automation', 1, 'active'),
  ('dev_zenith', NULL, 'zenith-productivity', 'Zenith Labs Global', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=96&h=96&fit=crop', 'https://zenithlabs.io', 'Ergonomic browser workspace optimizers, smart tab clustering, and memory suspension agents.', 'Tab Management & System Efficiency', 1, 'active');

-- 4. Initial Live Extensions
INSERT OR IGNORE INTO extensions (
  id, slug, name, short_description, full_description, category, icon_url, current_version, 
  developer_id, is_active, is_featured, is_suspended, pricing_type, rating, review_count, 
  weekly_active_users, download_count
) VALUES
  (
    'ext_deep_summarize_ai', 
    'deep-summarize-ai', 
    'Deep Summarize AI', 
    'Instant AI summaries for long articles, PDF documents, and multi-hour YouTube transcripts.',
    'Deep Summarize AI processes complex web pages, research papers, and video transcripts into concise key takeaways using local LLM inference and privacy-preserving cloud pipelines.',
    'ai', 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=96&h=96&fit=crop', 
    '2.4.1', 
    'dev_extlabs', 
    1, 1, 0, 'free', 4.9, 1420, 85400, 124500
  ),
  (
    'ext_inspector_pro_devtools', 
    'inspector-pro-devtools', 
    'Inspector Pro DevTools', 
    'Advanced DOM element inspection, dynamic computed CSS diffing, and live network payload editor.',
    'Inspector Pro turns your Chromium browser into a full-stack debugging powerhouse with real-time responsive viewport rulers and WebSocket telemetry.',
    'dev', 
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=96&h=96&fit=crop', 
    '3.1.0', 
    'dev_nova', 
    1, 1, 0, 'free', 4.8, 980, 64200, 91200
  ),
  (
    'ext_shield_guard_privacy', 
    'shield-guard-privacy', 
    'ShieldGuard Privacy Engine', 
    'Block malicious trackers, prevent canvas fingerprinting, and automatically strip tracking UTM params.',
    'ShieldGuard protects your digital footprint across every tab with zero-log edge filtering and heuristic script telemetry blocking.',
    'privacy', 
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=96&h=96&fit=crop', 
    '1.9.4', 
    'dev_aether', 
    1, 1, 0, 'free', 4.9, 2100, 112000, 189000
  ),
  (
    'ext_tab_flow_workspace', 
    'tab-flow-workspace', 
    'Tab Flow Workspace', 
    'Intelligent tab grouping, session hibernation, and memory reclamation for power browser users.',
    'Organize cluttered windows into clean categorized workspaces. Sleep idle tabs to free up to 75% of browser memory instantly.',
    'productivity', 
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=96&h=96&fit=crop', 
    '2.0.2', 
    'dev_zenith', 
    1, 0, 0, 'free', 4.7, 750, 42000, 58400
  ),
  (
    'ext_json_craft_formatter', 
    'json-craft-formatter', 
    'JSON Craft Formatter', 
    'Format, validate, query with JSONPath, and visualize API payloads directly in the browser.',
    'Fastest native JSON formatter for web developers. Supports collapsible nodes, schema validation, and dark mode syntax themes.',
    'dev', 
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=96&h=96&fit=crop', 
    '1.5.0', 
    'dev_nova', 
    1, 0, 0, 'free', 4.8, 512, 38000, 49200
  ),
  (
    'ext_smart_prompt_copilot', 
    'smart-prompt-copilot', 
    'Smart Prompt Copilot', 
    'AI prompt library with keyboard shortcuts for ChatGPT, Claude, and Gemini across every text field.',
    'Summon your custom prompt library with a single keystroke. Perfect for writers, programmers, and research workflows.',
    'ai', 
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=96&h=96&fit=crop', 
    '1.8.0', 
    'dev_extlabs', 
    1, 0, 0, 'free', 4.6, 620, 31000, 44100
  );

-- 5. Initial Extension Versions
INSERT OR IGNORE INTO extension_versions (
  id, extension_id, version, changelog, package_zip_url, manifest_json, permissions, host_permissions, review_status, reviewed_at
) VALUES
  (
    'ver_deep_summarize_001',
    'ext_deep_summarize_ai',
    '2.4.1',
    'Added local on-device LLM summarization mode and YouTube chapter auto-detect.',
    'https://cdn.extlabs.io/packages/deep-summarize-ai-2.4.1.zip',
    '{"manifest_version":3,"name":"Deep Summarize AI","version":"2.4.1"}',
    '["activeTab","storage","contextMenus"]',
    '["https://*/*"]',
    'approved',
    DATETIME('now')
  ),
  (
    'ver_inspector_pro_001',
    'ext_inspector_pro_devtools',
    '3.1.0',
    'Introduced computed CSS variables diffing and responsive container queries ruler.',
    'https://cdn.extlabs.io/packages/inspector-pro-devtools-3.1.0.zip',
    '{"manifest_version":3,"name":"Inspector Pro DevTools","version":"3.1.0"}',
    '["debugger","webRequest","storage"]',
    '["<all_urls>"]',
    'approved',
    DATETIME('now')
  ),
  (
    'ver_shield_guard_001',
    'ext_shield_guard_privacy',
    '1.9.4',
    'Expanded tracking pixel database with 1,200 new telemetry endpoints.',
    'https://cdn.extlabs.io/packages/shield-guard-privacy-1.9.4.zip',
    '{"manifest_version":3,"name":"ShieldGuard Privacy Engine","version":"1.9.4"}',
    '["declarativeNetRequest","cookies","storage"]',
    '["*://*/*"]',
    'approved',
    DATETIME('now')
  );

-- 6. Initial Abuse & Incident Reports
INSERT OR IGNORE INTO abuse_reports (
  id, extension_id, reporter_identifier, reporter_type, title, description, category, severity, status
) VALUES
  (
    'rep_001',
    'ext_deep_summarize_ai',
    'marcus.security@cve-audit.org',
    'researcher',
    'High memory consumption on large single-page applications',
    'Analyzing single page applications with over 20,000 DOM nodes triggers an unthrottled loop in the mutation observer causing browser tab crashes.',
    'Broken Functionality',
    'high',
    'open'
  ),
  (
    'rep_002',
    'ext_smart_prompt_copilot',
    'community_user_8821',
    'community',
    'Deceptive pop-up banner appearing after update',
    'After updating to the latest patch, clicking the extension action icon occasionally opens an external sponsor affiliate tab without user consent.',
    'Deceptive Advertising',
    'high',
    'open'
  );
