-- migrations/0008_add_google_auth.sql
-- Support Google OAuth for regular directory visitors and reviewers

ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'github';

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
