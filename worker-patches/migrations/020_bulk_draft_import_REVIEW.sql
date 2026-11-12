-- Task 15: one-time staging migration for CSV draft import batches.
-- Apply only to isolated Staging D1, once, after confirming existing products
-- already have the normalized-SKU unique constraint from previous migrations.
-- Deliberately DOES NOT change status, review tables, live catalog or R2 assets.
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
-- No auto-publish triggers; every created row remains 'draft'.
