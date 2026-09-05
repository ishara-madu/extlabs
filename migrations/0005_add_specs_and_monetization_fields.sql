-- migrations/0005_add_specs_and_monetization_fields.sql
-- Add monetization, specs, FAQs, and compliance fields to extensions and developers tables

ALTER TABLE extensions ADD COLUMN ad_frequency TEXT DEFAULT '24h';
ALTER TABLE extensions ADD COLUMN faqs TEXT DEFAULT '[]';
ALTER TABLE extensions ADD COLUMN manifest_version TEXT DEFAULT 'v3';
ALTER TABLE extensions ADD COLUMN license TEXT DEFAULT 'MIT';
ALTER TABLE extensions ADD COLUMN supported_browsers TEXT DEFAULT '["chrome","brave","edge","firefox","arc","opera"]';
ALTER TABLE extensions ADD COLUMN privacy_policy_url TEXT;

ALTER TABLE developers ADD COLUMN default_monetag_url TEXT;
ALTER TABLE developers ADD COLUMN default_frequency TEXT DEFAULT '24h';
