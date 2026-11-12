-- PZ Task 13: trusted-operator fast lane. STAGING REVIEW ONLY.
-- Requires migrations 009, 010, 017 and deployed Worker with fast-lane logic.
-- Never apply directly to Production without staging schema/rollback validation.
-- Deployment begins with BOTH PZ_FAST_LANE_ENABLED=false and enabled=0.
CREATE TABLE IF NOT EXISTS pz_fast_lane_settings (
  id INTEGER PRIMARY KEY CHECK(id=1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0,1)),
  updated_by TEXT,
  updated_at TEXT
);
INSERT OR IGNORE INTO pz_fast_lane_settings(id,enabled) VALUES(1,0);

CREATE TABLE IF NOT EXISTS pz_fast_lane_trust (
  operator_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  trusted INTEGER NOT NULL DEFAULT 0 CHECK(trusted IN (0,1)),
  updated_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_fast_lane_trust_active
 ON pz_fast_lane_trust(trusted,updated_at);

CREATE TABLE IF NOT EXISTS pz_fast_lane_publications (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL UNIQUE REFERENCES pz_product_reviews(id) ON DELETE RESTRICT,
  product_id TEXT NOT NULL UNIQUE REFERENCES products(id) ON DELETE RESTRICT,
  operator_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
    CHECK(status IN ('published','sampled_ok','unpublished')),
  catalog_synced INTEGER NOT NULL DEFAULT 0 CHECK(catalog_synced IN (0,1)),
  published_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  unpublish_reason TEXT
);
CREATE INDEX IF NOT EXISTS idx_pz_fast_lane_sampling
 ON pz_fast_lane_publications(status,published_at,id);
CREATE INDEX IF NOT EXISTS idx_pz_fast_lane_unpublished
 ON pz_fast_lane_publications(operator_id,status);

CREATE TABLE IF NOT EXISTS pz_fast_lane_events (
  id TEXT PRIMARY KEY,
  lane TEXT NOT NULL DEFAULT 'fast' CHECK(lane='fast'),
  event_type TEXT NOT NULL,
  operator_id TEXT,
  review_id TEXT,
  product_id TEXT,
  actor_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_fast_lane_events_owner
 ON pz_fast_lane_events(operator_id,created_at,id);
CREATE TRIGGER IF NOT EXISTS pz_fast_lane_events_no_update
 BEFORE UPDATE ON pz_fast_lane_events BEGIN
 SELECT RAISE(ABORT,'Fast lane audit rows are immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_fast_lane_events_no_delete
 BEFORE DELETE ON pz_fast_lane_events BEGIN
 SELECT RAISE(ABORT,'Fast lane audit rows are immutable'); END;

-- Preserve the existing state-machine guards; add ONLY a direct supervisor ->
-- published edge, and only if the matching DB transaction recorded a fast
-- publication. All other transitions retain their original checks.
DROP TRIGGER IF EXISTS pz_review_transition_guard;
CREATE TRIGGER pz_review_transition_guard
 BEFORE UPDATE OF status ON pz_product_reviews
 WHEN NEW.status <> OLD.status AND (
  COALESCE((SELECT lower(status) FROM products WHERE id=OLD.product_id),'') <> OLD.status
  OR NOT (
    (OLD.status='pending_supervisor' AND NEW.status IN ('pending_admin','returned_to_uploader'))
    OR (OLD.status='pending_admin' AND NEW.status IN ('approved_pending_publish','returned_to_supervisor'))
    OR (OLD.status='returned_to_supervisor' AND NEW.status='returned_to_uploader')
    OR (OLD.status='returned_to_uploader' AND NEW.status='pending_supervisor')
    OR (OLD.status='approved_pending_publish' AND NEW.status='published')
    OR (OLD.status='pending_supervisor' AND NEW.status='published'
      AND EXISTS (
        SELECT 1 FROM pz_fast_lane_publications f
        WHERE f.review_id=OLD.id AND f.product_id=OLD.product_id
          AND f.operator_id=OLD.submitter_id AND f.supervisor_id=OLD.supervisor_id
          AND f.status='published'
      ))
  )
 )
 BEGIN SELECT RAISE(ABORT,'Invalid or stale product review transition'); END;

-- Rollback this migration only through a separately reviewed recovery plan:
-- reverting the Worker without restoring this trigger could leave an unused
-- fast-publish transition accepted by D1, despite the Worker kill switch.
