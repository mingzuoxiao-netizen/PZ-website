-- Cloudflare D1 STAGING migration: pz-staging-db only.
-- Run the preflight below first and STOP if it returns any rows:
-- SELECT UPPER(TRIM(code)) AS normalized_sku, COUNT(*) AS duplicate_count,
--        GROUP_CONCAT(id, ', ') AS product_ids
-- FROM products WHERE code IS NOT NULL AND TRIM(code) <> ''
-- GROUP BY UPPER(TRIM(code)) HAVING COUNT(*) > 1;
--
-- Do not delete legacy duplicates automatically. The partial index
-- intentionally exempts old NULL/blank SKU rows, but the V3.1 Worker
-- rejects NEW records without a normalized PZ- SKU.

CREATE UNIQUE INDEX IF NOT EXISTS ux_products_sku_normalized
ON products (UPPER(TRIM(code)))
WHERE code IS NOT NULL AND TRIM(code) <> '';
