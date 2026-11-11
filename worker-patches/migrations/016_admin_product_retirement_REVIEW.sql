-- PZ 016: privileged permanent catalog removal with referentially safe audit tombstones.
-- Staging first. Required before PZ_FORCE_PRODUCT_RETIRE_ENABLED=true.
-- User-facing product disappears and original SKU is reusable; products that
-- have immutable reviews/revision/responsibility histories keep one scrubbed
-- products row so their ON DELETE RESTRICT foreign keys remain valid.
ALTER TABLE products ADD COLUMN deleted_at TEXT;
ALTER TABLE products ADD COLUMN deleted_by TEXT;

CREATE INDEX IF NOT EXISTS idx_pz_products_deleted_at
  ON products(deleted_at);

CREATE TABLE IF NOT EXISTS pz_product_retirements (
  product_id TEXT PRIMARY KEY NOT NULL,
  original_sku TEXT NOT NULL,
  tombstone_sku TEXT NOT NULL UNIQUE,
  actor_id TEXT NOT NULL,
  retired_at TEXT NOT NULL,
  disposal_mode TEXT NOT NULL CHECK(disposal_mode='audit_tombstone')
);
CREATE INDEX IF NOT EXISTS idx_pz_product_retirements_when
  ON pz_product_retirements(retired_at,product_id);

CREATE TRIGGER IF NOT EXISTS pz_product_retirements_immutable_update
  BEFORE UPDATE ON pz_product_retirements
  BEGIN SELECT RAISE(ABORT,'Product retirement history is immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_product_retirements_immutable_delete
  BEFORE DELETE ON pz_product_retirements
  BEGIN SELECT RAISE(ABORT,'Product retirement history is immutable'); END;

-- The final scrubbed row is a referential-integrity placeholder, not an
-- editable product. Never allow legacy admin/factory routes to revive it.
CREATE TRIGGER IF NOT EXISTS pz_retired_products_no_update
  BEFORE UPDATE ON products WHEN OLD.deleted_at IS NOT NULL
  BEGIN SELECT RAISE(ABORT,'Retired product tombstone is immutable'); END;
CREATE TRIGGER IF NOT EXISTS pz_retired_products_no_delete
  BEFORE DELETE ON products WHEN OLD.deleted_at IS NOT NULL
  BEGIN SELECT RAISE(ABORT,'Retired product tombstone cannot be removed'); END;
