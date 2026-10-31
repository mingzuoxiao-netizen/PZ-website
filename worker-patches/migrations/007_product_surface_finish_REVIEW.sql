-- Additive one-time D1 migration for the optional product surface finish field.
-- REVIEW ONLY: do not run on Production without an approved release.
-- Run on the dedicated Staging D1 first; repeat separately on Production D1
-- only after the affected Worker version and bindings are verified.
-- This changes no product rows other than adding the empty default column.
-- SQLite/D1 ADD COLUMN has no IF NOT EXISTS here: check PRAGMA table_info(products)
-- before applying; do not run twice.
ALTER TABLE products ADD COLUMN finish TEXT NOT NULL DEFAULT '';
