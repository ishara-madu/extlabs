-- migrations/0007_cleanup_mock_extensions.sql
-- Remove mock extensions from database, retaining only genuine extensions belonging to Ishara (@ishara-madu)

DELETE FROM extension_versions WHERE extension_id NOT IN ('ext_deep_summarize_ai', 'ext_smart_prompt_copilot');
DELETE FROM reviews WHERE extension_id NOT IN ('ext_deep_summarize_ai', 'ext_smart_prompt_copilot');
DELETE FROM abuse_reports WHERE extension_id NOT IN ('ext_deep_summarize_ai', 'ext_smart_prompt_copilot');
DELETE FROM telemetry_daily WHERE extension_id NOT IN ('ext_deep_summarize_ai', 'ext_smart_prompt_copilot');
DELETE FROM extensions WHERE id NOT IN ('ext_deep_summarize_ai', 'ext_smart_prompt_copilot');
DELETE FROM developers WHERE id IN ('dev_nova', 'dev_aether', 'dev_zenith');
