-- migrations/0010_create_notifications_table.sql
-- In-console notification system for developers and extensions

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  developer_id TEXT REFERENCES developers(id) ON DELETE CASCADE,
  extension_id TEXT REFERENCES extensions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'warning', 'error', 'success', 'announcement')),
  action_url TEXT,
  action_label TEXT,
  is_read INTEGER NOT NULL DEFAULT 0,
  sender_name TEXT DEFAULT 'ExtLabs Review Team',
  sender_avatar_url TEXT DEFAULT '/icons/github-profile-placeholder.avif',
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_extension ON notifications(extension_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_developer ON notifications(developer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Seed realistic notifications for testing
INSERT OR IGNORE INTO notifications (
  id,
  developer_id,
  extension_id,
  title,
  message,
  type,
  action_url,
  action_label,
  is_read,
  sender_name,
  sender_avatar_url,
  created_at
) VALUES (
  'notif_omniai_review_notice',
  'dev_extlabs',
  'ext_mtr74tz6_omniai_page_',
  'Extension Review Notice: Manifest V3 Permissions Verified',
  'Your extension passed our automated sandbox security checks. Reviewers verified active tab permissions and confirmed zero tracking telemetry.',
  'info',
  '/developers/manage/omniai-page-summarizer/edit',
  'Review Manifest Specs',
  0,
  'ExtLabs Security Team',
  '/icons/github-profile-placeholder.avif',
  DATETIME('now')
);

INSERT OR IGNORE INTO notifications (
  id,
  developer_id,
  extension_id,
  title,
  message,
  type,
  action_url,
  action_label,
  is_read,
  sender_name,
  sender_avatar_url,
  created_at
) VALUES (
  'notif_general_welcome',
  'dev_extlabs',
  NULL,
  'Welcome to the ExtLabs Developer Console',
  'Publish your browser extensions, track real-time installations, configure Monetag monetization, and inspect daily user telemetry.',
  'announcement',
  '/developers#how-it-works',
  'Read Developer Guide',
  0,
  'ExtLabs Team',
  '/icons/github-profile-placeholder.avif',
  DATETIME('now', '-2 days')
);
