-- PR #11: execute ONCE on the intended environment's D1 before deploying its Worker.
-- Run Staging first, then Production separately; never repeat without checking sqlite_master.
-- Append-only audit events with a durable pending reservation before each mutation.
-- No foreign keys: a historical actor or target must remain auditable after deletion.
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_username TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending','success','failed')),
  http_status INTEGER,
  before_json TEXT,
  after_json TEXT,
  changes_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(entity_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status, created_at DESC);
