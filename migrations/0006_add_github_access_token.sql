-- migrations/0006_add_github_access_token.sql
-- Store developer's GitHub OAuth access token for repository sync & automated manifest discovery

ALTER TABLE users ADD COLUMN github_access_token TEXT;
