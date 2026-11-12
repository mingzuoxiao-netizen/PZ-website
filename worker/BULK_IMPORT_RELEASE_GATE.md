# Task 15 — CSV bulk draft-import release and acceptance gate

Status: **Draft PR #65. Not merged, not deployed; no D1 migration executed.**

## Scope and limits

This is a **CSV-only** implementation because the repository has no installed
Excel parser dependency. Excel files must be saved as **CSV UTF-8** before upload.
Do not add xlsx parsers to production silently. Template uses BOM UTF-8 to
preserve Chinese text in Excel, shows centimeter/kilogram units and has an
example row marked `__example=YES` that is ignored at import.

Both Creator Admin and assigned factory employees can import. Admin selects
an active operator with a valid department and supervisor; that operator owns
every imported draft. A factory operator can import only to their own account.

The service can write only `draft` records. It **never** edits or overwrites
existing SKUs, submits for review, approves, publishes, changes catalog KV or
updates public product lists. Task 11 preflight still applies in the editor
and again on submission. A draft without four images/media roles can be saved
but **cannot enter the review queue** until images are completed.

Images use existing authenticated `POST /upload-image`, which verifies
JPEG/PNG/WebP bytes and writes to the existing environment-bound R2 bucket.
Import matches local files named `{SKU}__{role}.jpg` (main, lifestyle,
detail, material, dimension, packaging), and accepts only matching hosted
`uploads/` URLs from the current environment. Missing main images, unmatched
files and upload errors are exported as a *separate to-fix report*.

## Staging migration / rollout

1. Confirm independent Staging D1/KV/R2 and that prior migration 019 is valid.
2. Audit existing normalized SKU uniqueness. Do not add a duplicate-unsafe
   uniqueness constraint or run a migration blindly on Production.
3. Back up **Staging D1** and apply
   `worker-patches/migrations/020_bulk_draft_import_REVIEW.sql`
   **exactly once**. It adds `products.import_batch_id`,
   `pz_product_import_batches`, `pz_product_import_rows`, and indexes.
4. Deploy code to isolated Staging with `PZ_BULK_IMPORT_ENABLED` unset/false.
   Verify attempts return 503 instead of invoking the legacy product API.
5. Explicitly enable `PZ_BULK_IMPORT_ENABLED=true` in Staging Worker
   environment only, keep `PZ_ORG_RBAC_ENABLED=true` and existing product
   submission/approval safeguards.
6. Admin opens **批量导入草稿**, chooses an active employee, downloads a
   category-specific template, exports a 100-row Excel workbook as UTF-8 CSV,
   leaves its `__example=YES` row untouched, and uploads real data.
7. Add five deliberately invalid rows. Verify that exactly 95 are saved as
   `draft`, five failed CSV rows appear in the **blocking error** report,
   and no product changes to `pending_supervisor` or `published`.
8. Select images named `{SKU}__main.jpg`, etc.; test correct `media_roles`,
   missing main warning, unmatched image report, and regular Task 11 submit
   rejection until the images are completed.
9. Re-import the original CSV with a fresh UUID: zero products created,
   95 global SKU collisions shown as **existing**, five original errors.
   Re-send the exact original UUID: result reports `already_processed=true`
   and does not repeat writes. D1 rows are never updated.
10. Filter both Admin and Factory product catalogs by the returned batch UUID;
    verify paging, owner scope and status counts still work.
11. If an import request times out, click **核对批次结果** using that UUID.
    A half-finished batch deliberately fails closed until a database admin
    reconciles the import rows. Do not resubmit with a different UUID until
    actual D1 status is confirmed.
12. Only after all staging acceptance and required GitHub Environment
    approvals should a separate production release be considered. Start
    Production with the bulk-import feature disabled, run the production
    migration after an audited backup, then explicitly enable it.

## API

- `GET /admin/products/import-operators`: active eligible staff options.
- `POST /admin/products/import-drafts`: Admin, required owner_id and UUID.
- `POST /factory/products/import-drafts`: assigned factory operator only.
- `GET /admin|factory/products/import-batches/:uuid`: batch readback.
- `GET /factory/products?list_version=1&status=all&import_batch=<uuid>`:
   SQL-level scoped filter, applied before LIMIT/OFFSET.

Each POST accepts 1–100 row entries with CSV source row numbers, parsed cell
values and optional R2-uploaded image URLs/roles. The Worker ignores any
client-provided product status and creates `draft` only. SKU existence
checks are global and case-insensitive; existing SKUs are never overwritten.
A batch UUID is idempotent, and row outcomes remain in D1 for audit.

## Automated checks

- Worker SQLite integration creates **95 draft rows** for 100 input rows with
  five malformed rows and **0 published rows**.
- Repeat import as new batch: 95 existing, zero inserted.
- Repeat original UUID: returns prior result without creating duplicates.
- Image file naming, ordering and media_roles, missing-image submit preflight.
- Owner/organization guards, external-image rejection, feature flag off,
  server ignoring forged published status.
- CSV quote/BOM/sample parsing and formula-escaped error CSV output.
- `npm run build && npm run typecheck && npm test`, Worker parity/regression
  and Wrangler Staging dry-run in GitHub Actions.

## Limitations

- No native `.xlsx` import; use Excel's UTF-8 CSV export.
- Images without a matching CSV row are **not** uploaded and are listed in
  the separate image warning report. A draft without main remains editable,
  but is not ready to submit.
- Existing product records are not backfilled with an import_batch_id.
- The Staging D1 migration and feature flag are deliberately manual/reviewed;
  the PR does not put API secrets, D1 IDs or R2 bucket credentials in GitHub.
