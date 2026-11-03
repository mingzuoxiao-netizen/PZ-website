# PZ V2.1 — structured product editor, Staging rollout guide

**Status:** Draft PR #24. Do not merge/deploy to Production yet.
**Reference:** `PZ_V2_家具网站对标_产品资料标准模板_无价格.xlsx`.

## What changed
- ProductForm retains existing SKU, category, bilingual descriptions, factory sites, image upload and save/submit controls.
- Four sections: core information (SKU/category/series/name/primary material/finish/color/description), single-entry numeric dimensions and category-specific attributes, existing uploaded images with adjacent role tags, and optional internal packaging/assembly/care. Component materials are optional when parts differ.
- Fields are optional except existing SKU/name/category checks. Numeric values must be non-negative. The public size display is derived from the structured cm dimensions; old free-text sizes are shown as legacy read-only values until replaced.
- No pricing, costs, margins, quotes, FOB, EXW or finance keys allowed in the schema/API.
- Image manager continues to perform actual R2 uploads. Image role tags appear alongside actual uploads; the first image remains the main picture. Filename-only attachment registration and the misleading 'suggest public' selector are removed from the UI.
- Document/certificate PDF upload and approvals are not yet implemented, so the UI does not pretend to upload or verify evidence. Server rejects new 'public' attachment visibility and unaudited 'verified' claims. New data remains authenticated and is captured in V1/V2 immutable snapshots; public D1 catalog is unchanged.

## Staging deployment (one controlled cycle)
1. In the correct Staging D1, apply the **complete** `worker-patches/migrations/011_structured_product_specifications_STAGING_REVIEW.sql` exactly once. This adds `products.specs_json TEXT NOT NULL DEFAULT '{}'`. Never apply it to Production in this cycle.
2. Deploy `worker-patches/staging-worker-category-changes-REVIEW.js` to the **Staging** Worker, keeping existing R2/D1/KV bindings and Phase-1/2 flags unchanged.
3. Open the PR #24 Cloudflare Pages Preview with its API set to the dedicated Staging Worker. Do not use the official website for testing.
4. Under the designated employee account, edit a **draft** SKU or create a new test SKU. Enter dimensions, one component material, one packaging carton and at least one image role; save, reopen, verify the values, then submit.
5. Supervisor and admin inspect the new technical-data comparison; return to uploader and submit V2 with a different dimension. Compare V1 and V2, confirm original values remain. Do not publish test data on Production.
6. Existing `/public/products` must still return only published data, without the internal `specifications` object.

## Migration gate
Production must not receive the new editor/Worker before Production migration 011 is separately reviewed and applied.
There is no production cutover flag for the schema; deploying this code without the column causes D1 SQL errors. Do not do so.
Existing approved/published product revision editing is still outside the Phase-2 scope; no direct modification of a published product is enabled.

## Minimal technical audit
GitHub CI runs:
- `node --test worker-patches/productSpecificationsCore.test.mjs`
- `python3 worker-patches/test_structured_product_migration.py`
- existing RBAC, two-stage review, image workflow, TypeScript and Pages build checks.

## Rollback
If Staging shows any problem, revert the Staging Worker to its previous deployment and revert the Preview frontend. Do NOT delete the 011 column or restore a D1 database as a routine rollback; this additive column is ignored by the older Worker. Preserve review version rows and R2 assets.
