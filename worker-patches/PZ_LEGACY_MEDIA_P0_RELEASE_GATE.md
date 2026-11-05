# PZ P0 — retire the legacy image mutation endpoint (Issue #32)

**Status: GitHub review candidate. No Cloudflare deployment or R2/D1 changes in this PR.**

## Why this is still necessary

With `PZ_TWO_STAGE_REVIEW_ENABLED=true`, the Phase 2 middleware already rejects legacy `/admin/products/:id/remove-image` writes. However the low-level candidate Worker retained a dangerous fallback which could run if that feature flag was disabled: it updated `products.images`, optionally published the catalog and could physically delete an R2 object when `deleteFromCloud=true`. A cross-product reference could be lost without an approved revision.

Both Production and Staging Worker candidates now remove that fallback, rather than relying on an environment variable to make it unreachable. The legacy route authenticates and returns HTTP **410 Gone** without touching products, R2 or KV. Unauthorized callers get 401/403.

Existing product image removal works by editing the **local draft** and saving the entire product. Approved/published products still require supervisor initial review, administrator final review and explicit publish. Existing uploads and all approved product data remain intact.

## Changed scope

- Change **both** Worker candidate files only in the legacy route and its two-stage review guard. No other product endpoints, D1 migration, config variables or bindings changed.
- Add executable regression tests for Staging and Production, both with Phase 2 review enabled and disabled. Tests use synthetic users, R2 and D1 and assert no `products` mutations, no R2 delete, no KV publication and 401/403/410 behavior.
- CI runs the tests on PR; changes to GitHub do not deploy Worker code.

## Staging-first acceptance

1. Record actual Staging Worker deployment version and verify D1 `DB`, `PRODUCT_IMAGES` R2, `SITE_CONFIG_KV` KV and `PZ_RUNTIME_ENV=staging` have not changed. Compare active source with new candidate before replacing anything.
2. Deploy `staging-worker-category-changes-REVIEW.js` from the new PR **only in Staging**, without changing secrets or enabling/disabling current feature flags.
3. Verify existing product create/edit, local image remove/reorder/full Save, unchanged R2 image object, supervisor/admin reviews, published-product revisions, category management and public catalog. Do not test destructive operations on customer products.
4. With a valid Staging admin login, POST the old `/admin/products/<test-id>/remove-image` route (using a controlled test SKU) — expect **410**. If the two-stage middleware is disabled as a controlled test, it still must return 410. The product's D1 images and R2 object must remain unchanged. Unauthenticated requests should return 401, factory-role calls 403.
5. Ensure no `PRODUCT_IMAGES.delete` appears in the reviewed candidate. The feature must never delete physical R2 files on image-reference removal.

## Production release gate

- Only after Staging acceptance and an explicit reviewed cutover, compare the active Production Worker to `production-worker-category-governance-REVIEW.js` candidate. Record both Cloudflare version IDs for rollback.
- Deploy Production Worker without changing D1, KV, R2, JWT or feature flags; verify old business functions and approved product/public gallery are unchanged.
- If regression occurs, use Cloudflare Worker deployment rollback to the immediately preceding version. **Do not** restore D1 as a first response: this patch contains no schema/data migration.
- Keep future read-only media reference inspector and audit-storage dashboard as deferred tasks under Issue #32. Do not revive the obsolete PR #17 or its old large Worker bundle.
