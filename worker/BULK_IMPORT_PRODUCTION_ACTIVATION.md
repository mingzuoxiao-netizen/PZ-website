# Production activation — ZIP batch draft import (review required)

Status: **NOT YET ENABLED**. This is an operational checklist, not a deployed fix.
The repository's Staging-only migration `020_bulk_draft_import_REVIEW.sql` must
not be run blindly against Production.

## Evidence observed on 2026-11-13

- Live Worker: `pz-inquiry-api`, custom domain `api.peng-zhan.com`.
- The active Worker has `PZ_ORG_RBAC_ENABLED=true`, while
  `PZ_BULK_IMPORT_ENABLED` is absent. The API returns HTTP 503 with
  `Bulk draft import is disabled for this Worker environment`.
- Its live `DB` binding points to a Production D1 displayed as `1`.
  Studio showed neither `pz_product_import_batches` nor
  `pz_product_import_rows` and no `products.import_batch_id` column.
  The distinct Staging database has the three structures.
- The operator's QA ZIP already uploaded eight photos to the Production R2
  bucket; the D1 draft submission was rejected by the off switch.
  A failed batch ID was `0f05e783-60bb-4fd6-b9d6-bde435f42571`.
  **Do not immediately upload the ZIP again**: first reconcile this batch
  and reuse the uploaded image URLs if the operator's browser session retains them.

## Gate A — confirm targets, backing up and preflight (read-only)

1. Confirm the intended Production Worker, its currently active source/version,
   route and D1 `DB` binding by **resource ID**. Do not rely only on the
   database display name. Confirm separate Staging D1 and R2 bindings.
2. Record a recoverable Production D1 Time Travel bookmark/backup and verify
   restore availability **before** applying any DDL.
3. Run these read-only queries against the confirmed Production D1. Stop if any
   results contradict the expected pre-migration state:

   ```sql
   PRAGMA table_info(products);
   SELECT name, type, sql FROM sqlite_master
     WHERE name IN ('pz_product_import_batches', 'pz_product_import_rows')
        OR (type='index' AND tbl_name='products');
   SELECT UPPER(TRIM(code)) AS normalized_sku, COUNT(*) AS duplicate_count
     FROM products
     WHERE code IS NOT NULL AND TRIM(code) <> ''
     GROUP BY UPPER(TRIM(code)) HAVING COUNT(*) > 1;
   SELECT status, COUNT(*) AS product_count FROM products GROUP BY status;
   ```

   Expected: no `import_batch_id`, neither import table, **zero duplicate**
   normalized SKUs, and an existing normalized-SKU **unique expression index**
   on `UPPER(TRIM(code))`. If the index is missing, review and repair it via
   its own approved migration before proceeding. Record status counts.

## Gate B — one-time Production D1 migration

1. Obtain explicit approval for **Production D1 schema change** and ensure the
   deploy owner has a verified backup and plan to stop on any partial failure.
2. Apply exactly `worker-patches/migrations/021_bulk_draft_import_PRODUCTION_REVIEW.sql`
   to the confirmed Production D1, **once**. This mirrors the Staging schema
   tested by `worker/tests/bulk-import.test.mjs` and
   `worker/tests/bulk-import-production-migration.test.mjs`.
3. Verify that `products.import_batch_id`, both import tables and all three
   `idx_pz_...import...` indexes are present. Confirm historical product rows,
   publication statuses, users and review records are untouched.
4. If any SQL fails, **stop**. Do not rerun the entire script, because
   `ALTER TABLE ADD COLUMN` is one-time. Diagnose partial schema state first.

## Gate C — enable Worker route, then operator recovery

1. Reconfirm that the active Worker script contains
   `bulkImportFetch` for the authenticated `/factory/products/import-drafts`
   and batch lookup routes; verify production source parity.
2. Add **plain-text runtime variable** `PZ_BULK_IMPORT_ENABLED=true` only
   to the Production Worker, preserving `PZ_ORG_RBAC_ENABLED=true` and all
   existing secrets/bindings. Use the team's protected Production approval and
   release process; do not deploy with placeholder `wrangler.toml` bindings.
3. Check authenticated batch-reconciliation for the original batch UUID
   before resubmitting. If it was never created, return to the operator's
   **same browser session** and retry **D1 submission only** using cached R2
   upload URLs. Do not blindly restart eight R2 uploads.
4. Expected QA result: two new **Draft** SKUs, the intentionally invalid SKU
   rejected, eight existing R2 photos attached to the valid drafts, **zero
   products published**. Verify the owner can see the batch and that both
   Drafts remain in supervisor review workflow, not auto-published.
5. Retry the **same batch UUID** to verify idempotence. If the browser no
   longer has cached uploads, pause and assess how to reuse existing R2 objects
   before any new upload.

## Rollback / stop conditions

- If an API or data check fails, disable `PZ_BULK_IMPORT_ENABLED` first.
- Do **not** automatically delete R2 photos, import tables or Draft rows.
- Worker rollback does not roll back D1 schema. Preserve the backup and
  handle any D1 restore only under a separate, reviewed incident procedure.
- Never bypass GitHub Required reviewers for Production deployment.
