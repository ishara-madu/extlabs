-- migrations/0003_add_extension_fields.sql
-- Add repository, monetization, support, docs, and media columns to extensions table

ALTER TABLE extensions ADD COLUMN source_repo_url TEXT;
ALTER TABLE extensions ADD COLUMN monetag_direct_link TEXT;
ALTER TABLE extensions ADD COLUMN support_email TEXT;
ALTER TABLE extensions ADD COLUMN docs_url TEXT;
ALTER TABLE extensions ADD COLUMN screenshots TEXT DEFAULT '[]';
ALTER TABLE extensions ADD COLUMN youtube_video_url TEXT;
