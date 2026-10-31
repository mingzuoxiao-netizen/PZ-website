-- STAGING ONLY. Do not apply to Production without a separate review.
-- Existing category_requests and approved records remain unchanged.
CREATE TABLE IF NOT EXISTS category_change_requests (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  base_json TEXT NOT NULL,
  proposed_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applying', 'approved', 'rejected')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TEXT,
  reject_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_category_changes_status_created
  ON category_change_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_category_changes_category
  ON category_change_requests(category_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_changes_one_pending
  ON category_change_requests(category_id)
  WHERE status IN ('pending', 'applying');
