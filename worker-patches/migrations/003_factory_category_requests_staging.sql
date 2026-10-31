-- Staging D1 ONLY. Inspect PRAGMA table_info('category_requests') FIRST.
-- Safe for a fresh table, but does NOT repair an incompatible existing schema.
-- Do not run on Production D1.

CREATE TABLE IF NOT EXISTS category_requests (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  title_cn TEXT,
  subtitle TEXT,
  description TEXT,
  image TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'awaiting_review', 'approved', 'rejected')),
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_category_requests_review
ON category_requests (status, updated_at);

CREATE INDEX IF NOT EXISTS idx_category_requests_title
ON category_requests (title);
