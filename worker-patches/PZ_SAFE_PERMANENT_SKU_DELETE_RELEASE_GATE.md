# PZ — Permanent SKU deletion: controlled and irreversible

**Review-only candidate.** GitHub PR/merge alone cannot deploy a Cloudflare Worker, update D1, delete R2 or change Production site configuration.

## Confirmed decision

Admin wants to **permanently delete an eligible SKU record** and **reuse the exact SKU**. This is NOT an archive, tombstone, hiding an item, or a return to Draft. Only a successful conditional `DELETE FROM products` permits SKU reuse.

## Safety constraints

- Administrator permission only; credentials still validated by existing Worker JWT and audit middleware.
- Admin must inspect eligibility, then type the **exact SKU** to confirm. API checks product ID, SKU, expected `updated_at`, runtime, status, protected relationships, and feature flag before deletion.
- Allowed candidate statuses: `draft`, `rejected`, `unpublished`, `inactive`, `archived`. Other states including `published`, `pending_supervisor`, `pending_admin`, `approved_pending_publish`, `returned_to_uploader` are disallowed.
- **Never delete a published product just because it is hidden from the public catalog (e.g. no image).** A truly published SKU needs a separately reviewed takedown flow, because D1 and public KV must remain consistent.
- Any product referenced by `pz_product_reviews`, `pz_published_product_revisions`, `pz_product_responsibilities`, or `pz_product_responsibility_events` is protected. This respects immutable review snapshots and FK `ON DELETE RESTRICT`. Other future FK references must also fail closed under D1 constraints.
- No physical R2 image delete. Original uploads may remain referenced by another product/old review or can be cleaned by a later verified orphan scan. No public catalog KV write for this operation.
- A separate `product.permanent_delete` event is reserved in the preexisting D1 `audit_logs` before mutation; audit stores the old product summary, status, timestamp and actor for traceability even after the SKU row is removed.
- Production and Staging isolates stay separate, and deletion is **off by default** behind `PZ_PERMANENT_SKU_DELETE_ENABLED`.

## API & UI

`GET /admin/products/:id/permanent-delete` returns product and eligibility, including reasons when blocked. `POST` accepts exact `{confirm_sku,expected_updated_at}`; no bulk deletes or force override. Admin 产品管理 shows an unobtrusive delete icon only for possible offline/draft statuses. The backend remains the final authority.

## Staging acceptance

1. Verify current Cloudflare Staging Worker version and correct Staging D1/R2/KV binding. Deploy PR candidate **only on Staging**, preserving existing variables and JWT.
2. Enable `PZ_PERMANENT_SKU_DELETE_ENABLED=true` **only on Staging**. Use Pages Preview pointing to Staging API. Do not expose a Production admin session in Staging.
3. Create a synthetic Staging draft with test SKU; inspect eligibility, type exact SKU, delete and confirm from `products` that the record is gone. Recreate using the same SKU: unique constraint must permit it.
4. Attempt deletion of a published SKU, in-progress review and a historical reviewed SKU. Each must refuse without D1/R2/KV data loss. Do not use real customer SKUs for this destructive test.
5. Verify D1 audit log reports `product.permanent_delete` with correct before/after and authenticated ADMIN. All existing two-stage reviews and Phase 3 published revisions must still operate.

## Production gate (separate operator approval)

1. PR merged and Staging UAT accepted; check exact deployed Production Worker version and save rollback ID.
2. Deploy reviewed `main/worker-patches/production-worker-category-governance-REVIEW.js` to **`pz-inquiry-api`**, preserving unrelated variables, secrets and bindings. Keep new flag OFF initially.
3. Smoke-test existing CRUD (non-destructive), audit history, reviews and publication.
4. Enable Production flag, publish Pages Production frontend, test GET eligibility on a controlled test SKU; any actual permanent deletion requires explicit confirmed SKU and is irreversible. Check SKU reuse and D1 audit.
5. If unexpected behavior: turn the flag off, revert code to previous Worker/Pages version. **Do not restore D1** to undo individual deletion; recovery needs deliberate product recreation from a trusted snapshot. Never assume an R2 file is a complete record.

No migration is needed. Do not invent a workaround that removes review history or bypasses foreign-key constraints. Products with protected history cannot be hard-purged in this release; supporting that would require a separately approved historical-retention redesign.
