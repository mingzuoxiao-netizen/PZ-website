-- PZ V2 structured technical product data / migration 011
-- STAGING FIRST. Review and apply to Production only after full staging QA.
-- Adds a single opt-in JSON column; existing products, images, review events,
-- version history, site_config, KV and R2 are not changed.
-- Manual migration ONCE. SQLite ADD COLUMN is not IF NOT EXISTS.
ALTER TABLE products ADD COLUMN specs_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(specs_json) AND json_type(specs_json)='object' AND length(specs_json)<=32768);
