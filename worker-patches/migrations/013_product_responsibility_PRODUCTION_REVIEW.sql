-- PRODUCTION REVIEW CANDIDATE. NOT AUTOMATICALLY EXECUTED.
-- PZ Phase 4: historic published-product responsibility delegation.
-- Additive only: never rewrite products.created_by or existing review histories.
-- Requires migrations 009 (org), 010 (new product review), 012 (published revisions).
-- Keep feature flag PZ_PRODUCT_RESPONSIBILITY_ENABLED off until migration verified.
CREATE TABLE IF NOT EXISTS pz_product_responsibilities (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE RESTRICT,
  responsible_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  assigned_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (responsible_user_id <> supervisor_id)
);
CREATE INDEX IF NOT EXISTS idx_pz_responsibility_user
  ON pz_product_responsibilities(responsible_user_id,department_id);
CREATE INDEX IF NOT EXISTS idx_pz_responsibility_supervisor
  ON pz_product_responsibilities(supervisor_id,department_id);

CREATE TABLE IF NOT EXISTS pz_product_responsibility_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  old_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  new_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id) ON DELETE RESTRICT,
  supervisor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  version INTEGER NOT NULL CHECK (version >= 1),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_responsibility_events_product
  ON pz_product_responsibility_events(product_id,version);

CREATE TRIGGER IF NOT EXISTS pz_responsibility_insert_event
AFTER INSERT ON pz_product_responsibilities BEGIN
  INSERT INTO pz_product_responsibility_events
    (product_id,old_user_id,new_user_id,department_id,supervisor_id,actor_id,version,created_at)
  VALUES (NEW.product_id,NULL,NEW.responsible_user_id,NEW.department_id,
    NEW.supervisor_id,NEW.assigned_by,NEW.version,NEW.updated_at);
END;
CREATE TRIGGER IF NOT EXISTS pz_responsibility_update_guard
BEFORE UPDATE ON pz_product_responsibilities
WHEN NEW.product_id <> OLD.product_id
  OR NEW.assigned_at <> OLD.assigned_at
  OR NEW.version <> OLD.version+1
BEGIN
  SELECT RAISE(ABORT,'Product responsibility provenance/version immutable');
END;
CREATE TRIGGER IF NOT EXISTS pz_responsibility_update_event
AFTER UPDATE ON pz_product_responsibilities BEGIN
  INSERT INTO pz_product_responsibility_events
    (product_id,old_user_id,new_user_id,department_id,supervisor_id,actor_id,version,created_at)
  VALUES (NEW.product_id,OLD.responsible_user_id,NEW.responsible_user_id,
    NEW.department_id,NEW.supervisor_id,NEW.assigned_by,NEW.version,NEW.updated_at);
END;
CREATE TRIGGER IF NOT EXISTS pz_responsibility_delete_guard
BEFORE DELETE ON pz_product_responsibilities BEGIN
  SELECT RAISE(ABORT,'Product responsibility history cannot be deleted');
END;
CREATE TRIGGER IF NOT EXISTS pz_responsibility_events_no_update
BEFORE UPDATE ON pz_product_responsibility_events BEGIN
  SELECT RAISE(ABORT,'Immutable product responsibility events');
END;
CREATE TRIGGER IF NOT EXISTS pz_responsibility_events_no_delete
BEFORE DELETE ON pz_product_responsibility_events BEGIN
  SELECT RAISE(ABORT,'Immutable product responsibility events');
END;
