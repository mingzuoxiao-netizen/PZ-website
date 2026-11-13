-- PRODUCTION MIGRATION CANDIDATE — ONE TIME, MANUAL REVIEW REQUIRED.
-- PZ bulk draft import, schema parity with Staging migration 020.
-- Target ONLY the D1 bound as DB on the live pz-inquiry-api Worker.
-- DO NOT execute against Staging, or run both 020 and 021 on the same D1.
--
-- BEFORE EXECUTING:
-- 1. Record the live Worker deployment and DB binding identifier; verify that
--    it is the intended Production D1 (currently displayed as database "1").
-- 2. Create and verify a recoverable D1 Time Travel bookmark/backup.
-- 3. Check PRAGMA table_info(products): import_batch_id MUST NOT exist.
-- 4. Check sqlite_master: neither pz_product_import_batches nor
--    pz_product_import_rows may exist; inspect any partial prior application.
-- 5. Confirm an expression-based unique index on UPPER(TRIM(code)) exists:
--    SELECT name, sql FROM sqlite_master
--    WHERE type = 'index' AND tbl_name = 'products';
--    If missing, separately inspect normalized-SKU duplicates and establish
--    the approved uniqueness constraint BEFORE this migration.
-- 6. Leave PZ_BULK_IMPORT_ENABLED unset/false until all verification passes.
--
-- This file is a one-time migration, NOT idempotent: SQLite's ADD COLUMN
-- cannot safely be repeated. The DDL below intentionally matches 020.
-- No UPDATE/DELETE of existing products, review data, or assets is performed.
ALTER TABLE products ADD COLUMN import_batch_id TEXT;
CREATE INDEX IF NOT EXISTS idx_pz_products_import_batch
 ON products(import_batch_id,created_at,id);

CREATE TABLE IF NOT EXISTS pz_product_import_batches (
 id TEXT PRIMARY KEY,
 imported_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 created_at TEXT NOT NULL,
 finished_at TEXT,
 input_count INTEGER NOT NULL CHECK(input_count BETWEEN 0 AND 100),
 inserted_count INTEGER NOT NULL DEFAULT 0,
 skipped_count INTEGER NOT NULL DEFAULT 0,
 failed_count INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_pz_import_batches_owner
 ON pz_product_import_batches(owner_id,created_at DESC);

CREATE TABLE IF NOT EXISTS pz_product_import_rows (
 batch_id TEXT NOT NULL REFERENCES pz_product_import_batches(id) ON DELETE RESTRICT,
 row_number INTEGER NOT NULL CHECK(row_number>0),
 code TEXT,
 disposition TEXT NOT NULL CHECK(disposition IN ('imported','existing','invalid')),
 product_id TEXT REFERENCES products(id) ON DELETE RESTRICT,
 reason TEXT,
 created_at TEXT NOT NULL,
 PRIMARY KEY(batch_id,row_number)
);
CREATE INDEX IF NOT EXISTS idx_pz_import_rows_sku
 ON pz_product_import_rows(code,batch_id);
-- No auto-publish trigger; newly imported rows use status='draft'.
