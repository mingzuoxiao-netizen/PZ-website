-- Apply only once to the D1 database used by this Worker, before deploying this Worker.
-- Verify columns first with: PRAGMA table_info(users);
ALTER TABLE users ADD COLUMN deleted_at TEXT;
ALTER TABLE users ADD COLUMN deleted_by TEXT;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
