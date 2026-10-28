-- PZ Product Catalog V2: supporting indexes for D1 keyset pagination.
-- Read-only SQL structure update: run ONLY after production data backup and EXPLAIN QUERY PLAN review.
-- Existing products table has status/category/sub_category/updated_at/id/code.
-- No is_published column is needed.
CREATE INDEX IF NOT EXISTS idx_products_public_cursor
  ON products(status, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_products_public_category_cursor
  ON products(status, category, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_products_public_subcategory_cursor
  ON products(status, category, sub_category, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_products_public_code
  ON products(status, code);
