-- migrations/0001_initial_schema.sql
-- ExtLabs Chrome Extension Directory — Cloudflare D1 Relational Schema

PRAGMA foreign_keys = ON;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'developer' CHECK(role IN ('super_admin', 'moderator', 'security_auditor', 'developer', 'support')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'invited')),
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. SESSIONS TABLE
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- 3. DEVELOPERS TABLE
CREATE TABLE IF NOT EXISTS developers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  website TEXT,
  bio TEXT,
  primary_focus TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'flagged', 'suspended')),
  member_since TEXT NOT NULL DEFAULT (DATE('now')),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);

-- 4. EXTENSIONS TABLE
CREATE TABLE IF NOT EXISTS extensions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  full_description TEXT,
  category TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  header_image_url TEXT,
  current_version TEXT NOT NULL DEFAULT '1.0.0',
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE RESTRICT,
  is_active INTEGER NOT NULL DEFAULT 1,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_suspended INTEGER NOT NULL DEFAULT 0,
  pricing_type TEXT NOT NULL DEFAULT 'free' CHECK(pricing_type IN ('free', 'freemium', 'paid')),
  rating REAL NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  weekly_active_users INTEGER NOT NULL DEFAULT 0,
  download_count INTEGER NOT NULL DEFAULT 0,
  crx_download_url TEXT,
  zip_download_url TEXT,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_extensions_slug ON extensions(slug);
CREATE INDEX IF NOT EXISTS idx_extensions_category ON extensions(category);
CREATE INDEX IF NOT EXISTS idx_extensions_featured ON extensions(is_featured);
CREATE INDEX IF NOT EXISTS idx_extensions_developer ON extensions(developer_id);

-- 5. EXTENSION VERSIONS (Releases & Review Queue)
CREATE TABLE IF NOT EXISTS extension_versions (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  changelog TEXT,
  package_zip_url TEXT NOT NULL,
  package_size_bytes INTEGER NOT NULL DEFAULT 0,
  manifest_json TEXT NOT NULL,
  permissions TEXT, -- JSON array of requested permissions
  host_permissions TEXT, -- JSON array of host permissions
  min_chrome_version TEXT DEFAULT '88',
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending', 'approved', 'rejected')),
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  submitted_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_versions_ext ON extension_versions(extension_id);
CREATE INDEX IF NOT EXISTS idx_versions_status ON extension_versions(review_status);

-- 6. USER REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_reviews_extension ON reviews(extension_id);

-- 7. ABUSE & INCIDENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS abuse_reports (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  reporter_identifier TEXT NOT NULL,
  reporter_type TEXT NOT NULL DEFAULT 'community' CHECK(reporter_type IN ('community', 'researcher', 'automated_watchdog')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK(severity IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'investigating', 'resolved', 'dismissed')),
  resolved_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_reports_ext ON abuse_reports(extension_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON abuse_reports(status);

-- 8. TELEMETRY & AD METRICS TABLE (5:1 Pacing Analytics)
CREATE TABLE IF NOT EXISTS telemetry_daily (
  id TEXT PRIMARY KEY,
  extension_id TEXT REFERENCES extensions(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  page_visits INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  dev_ad_clicks INTEGER NOT NULL DEFAULT 0,
  extlabs_ad_clicks INTEGER NOT NULL DEFAULT 0,
  country_code TEXT NOT NULL DEFAULT 'GLOBAL'
);

CREATE INDEX IF NOT EXISTS idx_telemetry_date ON telemetry_daily(date);
CREATE INDEX IF NOT EXISTS idx_telemetry_ext ON telemetry_daily(extension_id);

-- 9. PLATFORM SETTINGS KEY-VALUE STORE
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (DATETIME('now'))
);

-- 10. ADMINISTRATIVE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target TEXT NOT NULL,
  details TEXT,
  timestamp TEXT NOT NULL DEFAULT (DATETIME('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
