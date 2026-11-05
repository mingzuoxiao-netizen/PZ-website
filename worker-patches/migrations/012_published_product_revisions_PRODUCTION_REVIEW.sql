-- PZ V2 Phase 3 — PRODUCTION SCHEMA REVIEW CANDIDATE. NOT EXECUTED.
-- STOP: Never run without a fresh Production D1 Time Travel recovery point,
-- actual Worker/binding version comparison, owner approval, and preflight checks.
-- This file is additive DDL ONLY; it does NOT enable a Worker feature flag,
-- deploy code, migrate product rows, publish content, or touch R2/KV.
-- Source: 012_published_product_revisions_STAGING_REVIEW.sql;
-- executable statements below must remain BYTE-FOR-BYTE IDENTICAL to Staging.
-- Prereqs: Production users/products/pz_departments/pz_staff_assignments,
-- Phase 2 two-stage review tables and products.specs_json present.
-- Production DB shown to operator as database '1'; verify exact UUID and
-- binding immediately before release. Do not rely on the friendly name alone.
-- Run only after explicit operator go/no-go; leave feature disabled afterwards.
CREATE TABLE IF NOT EXISTS pz_published_product_revisions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  submitter_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id) ON DELETE RESTRICT,
  base_updated_at TEXT NOT NULL,
  base_snapshot_json TEXT NOT NULL CHECK (json_valid(base_snapshot_json) AND json_type(base_snapshot_json)='object'),
  draft_json TEXT NOT NULL CHECK (json_valid(draft_json) AND json_type(draft_json)='object' AND length(draft_json)<=65536),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','pending_supervisor','pending_admin','returned_to_supervisor',
    'returned_to_uploader','approved_pending_publish','published','canceled'
  )),
  draft_revision INTEGER NOT NULL DEFAULT 1 CHECK (draft_revision>=1),
  latest_version INTEGER NOT NULL DEFAULT 0 CHECK (latest_version>=0),
  approved_version INTEGER,
  return_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (submitter_id<>supervisor_id),
  CHECK (approved_version IS NULL OR approved_version BETWEEN 1 AND latest_version)
);
-- Only one active revision per published SKU. A second can start after publish.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pz_published_one_active_revision
  ON pz_published_product_revisions(product_id)
  WHERE status NOT IN ('published','canceled');
CREATE INDEX IF NOT EXISTS idx_pz_published_revisions_supervisor
  ON pz_published_product_revisions(supervisor_id,status,updated_at);
CREATE INDEX IF NOT EXISTS idx_pz_published_revisions_admin
  ON pz_published_product_revisions(status,updated_at);
CREATE INDEX IF NOT EXISTS idx_pz_published_revisions_submitter
  ON pz_published_product_revisions(submitter_id,updated_at);

CREATE TABLE IF NOT EXISTS pz_published_revision_versions (
  revision_id TEXT NOT NULL REFERENCES pz_published_product_revisions(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK(version>=1),
  snapshot_json TEXT NOT NULL CHECK (json_valid(snapshot_json) AND json_type(snapshot_json)='object' AND length(snapshot_json)<=65536),
  submitted_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  PRIMARY KEY(revision_id,version)
);
CREATE TABLE IF NOT EXISTS pz_published_revision_events (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL REFERENCES pz_published_product_revisions(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_role TEXT NOT NULL,
  review_version INTEGER NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_published_revision_events
  ON pz_published_revision_events(revision_id,created_at,id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pz_published_revision_event_once
  ON pz_published_revision_events(revision_id,action,review_version);

-- Immutable submitted versions and decisions.
CREATE TRIGGER IF NOT EXISTS pz_pub_revision_versions_immutable_update
  BEFORE UPDATE ON pz_published_revision_versions BEGIN SELECT RAISE(ABORT,'Published revision versions immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_pub_revision_versions_immutable_delete
  BEFORE DELETE ON pz_published_revision_versions BEGIN SELECT RAISE(ABORT,'Published revision versions immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_pub_revision_events_immutable_update
  BEFORE UPDATE ON pz_published_revision_events BEGIN SELECT RAISE(ABORT,'Published revision events immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_pub_revision_events_immutable_delete
  BEFORE DELETE ON pz_published_revision_events BEGIN SELECT RAISE(ABORT,'Published revision events immutable'); END;

CREATE TRIGGER IF NOT EXISTS pz_pub_revision_no_draft_mutation_in_review
  BEFORE UPDATE OF draft_json ON pz_published_product_revisions
  WHEN OLD.status NOT IN ('draft','returned_to_uploader')
  BEGIN SELECT RAISE(ABORT,'Cannot change a submitted revision'); END;

-- All state transitions verify that the original live product is still
-- published and unchanged. Never allow review activity to unpublish live data.
CREATE TRIGGER IF NOT EXISTS pz_pub_revision_transition_guard
  BEFORE UPDATE OF status ON pz_published_product_revisions
  WHEN NEW.status<>OLD.status AND (
    COALESCE((SELECT status FROM products WHERE id=OLD.product_id),'')<>'published'
    OR COALESCE((SELECT updated_at FROM products WHERE id=OLD.product_id),'')<>OLD.base_updated_at
    OR NOT (
      (OLD.status='draft' AND NEW.status IN ('pending_supervisor','canceled'))
      OR (OLD.status='pending_supervisor' AND NEW.status IN ('pending_admin','returned_to_uploader'))
      OR (OLD.status='pending_admin' AND NEW.status IN ('approved_pending_publish','returned_to_supervisor'))
      OR (OLD.status='returned_to_supervisor' AND NEW.status='returned_to_uploader')
      OR (OLD.status='returned_to_uploader' AND NEW.status IN ('pending_supervisor','canceled'))
      OR (OLD.status='approved_pending_publish' AND NEW.status='published')
    )
  )
  BEGIN SELECT RAISE(ABORT,'Invalid or stale published revision transition'); END;
