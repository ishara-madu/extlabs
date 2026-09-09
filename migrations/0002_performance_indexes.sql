-- migrations/0002_performance_indexes.sql
-- High-Performance Composite Indexes for ExtLabs Store Catalog & Telemetry

-- 1. Fast active/suspended filtering across all public store listings
CREATE INDEX IF NOT EXISTS idx_extensions_active_suspended ON extensions(is_active, is_suspended);

-- 2. Fast category browsing with active filtering
CREATE INDEX IF NOT EXISTS idx_extensions_category_active ON extensions(category, is_active, is_suspended);

-- 3. Optimal store ranking covering index for featured shelves & sorting
CREATE INDEX IF NOT EXISTS idx_extensions_store_rank ON extensions(is_active, is_suspended, is_featured, weekly_active_users, rating);

-- 4. Fast extension reviews sorting by creation date
CREATE INDEX IF NOT EXISTS idx_reviews_ext_created ON extension_reviews(extension_id, created_at);

-- 5. Fast telemetry analytics range queries
CREATE INDEX IF NOT EXISTS idx_telemetry_ext_date ON extension_telemetry(extension_id, date);
