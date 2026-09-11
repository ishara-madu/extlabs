-- migrations/0011_create_lifecycle_requests_table.sql
-- Table for moderated unpublish and deletion requests submitted by developers

CREATE TABLE IF NOT EXISTS lifecycle_requests (
  id TEXT PRIMARY KEY,
  extension_id TEXT NOT NULL REFERENCES extensions(id) ON DELETE CASCADE,
  developer_id TEXT NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK(request_type IN ('unpublish', 'delete')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by TEXT REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (DATETIME('now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_lifecycle_requests_ext ON lifecycle_requests(extension_id, status);
CREATE INDEX IF NOT EXISTS idx_lifecycle_requests_status ON lifecycle_requests(status, request_type);
