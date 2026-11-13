-- Task 20: optimistic edit revision + soft presence. Apply to isolated Staging D1 first.
-- Existing rows begin edit_revision=0. Each draft PUT must CAS on BOTH
-- edit_revision and updated_at; review/publish writes also change updated_at.
-- Presence is advisory; no operation uses this table as an edit lock.
ALTER TABLE products ADD COLUMN edit_revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN last_editor_id TEXT;
CREATE TABLE IF NOT EXISTS pz_product_edit_presence (
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL CHECK(length(session_id) BETWEEN 16 AND 100),
  started_at TEXT NOT NULL,
  heartbeat_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (product_id, actor_id, session_id)
);
CREATE INDEX IF NOT EXISTS idx_pz_edit_presence_product_expiry
  ON pz_product_edit_presence(product_id,expires_at);
CREATE INDEX IF NOT EXISTS idx_pz_edit_presence_expiry
  ON pz_product_edit_presence(expires_at);
