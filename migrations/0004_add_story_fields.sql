-- migrations/0004_add_story_fields.sql
-- Add features, workflow, and comparison JSON columns to extensions table

ALTER TABLE extensions ADD COLUMN features TEXT DEFAULT '[]';
ALTER TABLE extensions ADD COLUMN workflow TEXT DEFAULT '[]';
ALTER TABLE extensions ADD COLUMN comparison TEXT DEFAULT '[]';
