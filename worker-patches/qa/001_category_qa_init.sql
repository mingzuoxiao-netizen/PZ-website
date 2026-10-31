-- QA ONLY: Execute solely in D1 database pz-category-qa-db.
-- NEVER run against pz-staging-db or the Production DB.
-- Idempotent: CREATE IF NOT EXISTS / INSERT OR IGNORE only.
-- Tests use invented "QA" categories; no customer information.
CREATE TABLE IF NOT EXISTS category_requests (
  id TEXT PRIMARY KEY,
  title TEXT,
  title_cn TEXT,
  subtitle TEXT,
  image TEXT,
  status TEXT,
  created_at TEXT,
  updated_at TEXT
);

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

CREATE TABLE IF NOT EXISTS site_config_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draft_json TEXT NOT NULL CHECK (json_valid(draft_json)),
  draft_revision INTEGER NOT NULL DEFAULT 1 CHECK (draft_revision >= 1),
  published_json TEXT NOT NULL CHECK (json_valid(published_json)),
  published_revision INTEGER NOT NULL DEFAULT 1 CHECK (published_revision >= 1),
  published_version TEXT NOT NULL,
  published_at TEXT NOT NULL,
  write_token TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO site_config_state (
  id, draft_json, draft_revision, published_json, published_revision,
  published_version, published_at, write_token, updated_at
)
VALUES (
  1,
  '{"categories":[{"id":"qa-sofa","title":"QA Sofa","title_cn":"测试沙发","title_zh":"测试沙发","subtitle":"Original QA Sofa","description":"Non-production fixture","image":"","subCategories":[{"id":"qa-loveseat","title":"QA Loveseat"}]},{"id":"qa-table","title":"QA Table","title_cn":"测试桌子","title_zh":"测试桌子","subtitle":"Original QA Table","description":"Non-production fixture","image":""}],"home":{"hero":{"title":"QA demo site"}}}',
  1,
  '{"categories":[{"id":"qa-sofa","title":"QA Sofa","title_cn":"测试沙发","title_zh":"测试沙发","subtitle":"Original QA Sofa","description":"Non-production fixture","image":"","subCategories":[{"id":"qa-loveseat","title":"QA Loveseat"}]},{"id":"qa-table","title":"QA Table","title_cn":"测试桌子","title_zh":"测试桌子","subtitle":"Original QA Table","description":"Non-production fixture","image":""}],"home":{"hero":{"title":"QA demo site"}}}',
  1, 'qa-seed-1', '2026-10-31T00:00:00Z',
  'qa-init', '2026-10-31T00:00:00Z'
);

INSERT OR IGNORE INTO category_requests (
  id,title,title_cn,subtitle,image,status,created_at,updated_at
)
VALUES
  ('qa-new-rugs','QA Rugs','测试地毯','Non-production request','','pending','2026-10-31','2026-10-31'),
  ('qa-new-bookcase','QA Bookcase','测试书架','Non-production request','','pending','2026-10-31','2026-10-31');

INSERT OR IGNORE INTO category_change_requests (
  id,category_id,base_json,proposed_json,status,created_by,created_at,updated_at
)
VALUES (
  'qa-change-sofa',
  'qa-sofa',
  '{"title":"QA Sofa","title_cn":"测试沙发","subtitle":"Original QA Sofa","description":"Non-production fixture","image":""}',
  '{"title":"QA Sofa","title_cn":"测试沙发","subtitle":"Edited QA Sofa","description":"Non-production fixture","image":""}',
  'pending','qa-factory','2026-10-31','2026-10-31'
);
