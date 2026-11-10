-- PZ category request two-stage review, additive only.
-- Prerequisites: category_requests legacy table, migration 009 organization schema.
-- Apply to Staging D1 first; Production only after verified schema and rollout approval.
-- Existing category_requests rows stay unchanged and are grandfathered to admin review.
CREATE TABLE IF NOT EXISTS pz_category_request_flow (
  request_id TEXT PRIMARY KEY REFERENCES category_requests(id) ON DELETE RESTRICT,
  submitter_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id),
  status TEXT NOT NULL CHECK(status IN (
    'pending_supervisor','pending_admin','returned_to_supervisor',
    'returned_to_uploader','approved'
  )),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>0),
  last_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_category_flow_submitter
  ON pz_category_request_flow(submitter_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pz_category_flow_supervisor
  ON pz_category_request_flow(supervisor_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pz_category_flow_admin
  ON pz_category_request_flow(status,updated_at DESC);

CREATE TABLE IF NOT EXISTS pz_category_request_events (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES category_requests(id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL CHECK(action IN (
    'submitted','supervisor_approved','supervisor_returned',
    'admin_approved','admin_returned','resubmitted'
  )),
  actor_id TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(request_id,revision,action)
);
CREATE INDEX IF NOT EXISTS idx_pz_category_events_history
  ON pz_category_request_events(request_id,created_at DESC);
