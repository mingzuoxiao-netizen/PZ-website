-- PZ V2 phase 2: Staging REVIEW ONLY; do not deploy against Production D1.
-- Requires migration 009 (department and staff assignments), users, products.
-- Existing published products, image objects and category approvals are untouched.
CREATE TABLE IF NOT EXISTS pz_product_reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE RESTRICT,
  submitter_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN (
    'pending_supervisor','pending_admin','returned_to_supervisor',
    'returned_to_uploader','approved_pending_publish','published'
  )),
  latest_version INTEGER NOT NULL CHECK (latest_version >= 1),
  approved_version INTEGER,
  return_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (submitter_id <> supervisor_id),
  CHECK (approved_version IS NULL OR approved_version BETWEEN 1 AND latest_version)
);
CREATE INDEX IF NOT EXISTS idx_pz_product_reviews_supervisor
  ON pz_product_reviews(supervisor_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_pz_product_reviews_status
  ON pz_product_reviews(status,updated_at);

CREATE TABLE IF NOT EXISTS pz_product_review_versions (
  review_id TEXT NOT NULL REFERENCES pz_product_reviews(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 1),
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json)),
  submitted_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (review_id,version)
);
CREATE TABLE IF NOT EXISTS pz_product_review_events (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL REFERENCES pz_product_reviews(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL,
  review_version INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_review_events
  ON pz_product_review_events(review_id,created_at,id);

-- Audit history must be append-only. Never silently modify the original version.
CREATE TRIGGER IF NOT EXISTS pz_versions_no_update
 BEFORE UPDATE ON pz_product_review_versions BEGIN
 SELECT RAISE(ABORT,'Review versions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_versions_no_delete
 BEFORE DELETE ON pz_product_review_versions BEGIN
 SELECT RAISE(ABORT,'Review versions are immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_events_no_update
 BEFORE UPDATE ON pz_product_review_events BEGIN
 SELECT RAISE(ABORT,'Review events are immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_events_no_delete
 BEFORE DELETE ON pz_product_review_events BEGIN
 SELECT RAISE(ABORT,'Review events are immutable'); END;

-- Review snapshots include original image keys/URLs. R2 cleanup code must check
-- snapshot references before physical deletion (stage 2 R2 integration gate).
