-- migrations/0009_add_extension_status_and_draft_data.sql
-- Add status, draft_data, and published_at columns to support staged draft edits and protect the public store

ALTER TABLE extensions ADD COLUMN status TEXT DEFAULT 'draft';
ALTER TABLE extensions ADD COLUMN draft_data TEXT;
ALTER TABLE extensions ADD COLUMN published_at TEXT;

-- Set existing live extensions to published
UPDATE extensions 
SET status = 'published', 
    published_at = created_at 
WHERE is_active = 1 AND is_suspended = 0;

-- Create index for high-performance public store queries
CREATE INDEX IF NOT EXISTS idx_extensions_status_active 
ON extensions (status, is_active, is_suspended);
