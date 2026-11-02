# PZ V2.1 — structured product editor, Staging rollout guide

**Status:** Draft PR #24. Do not merge/deploy to Production yet.
**Reference:** `PZ_V2_家具网站对标_产品资料标准模板_无价格.xlsx`.

## What changed
- ProductForm retains existing SKU, category, bilingual descriptions, factory sites, image upload and save/submit controls.
- New expandable sections collect: family/color, structured dimensions and net weight, three English highlights, parts/materials/process, category-specific attributes, multi-carton packaging, packing/protection, assembly, care, warnings, evidence-verified claims, source/provider/reviewer, registered attachments and photo roles.
- Fields are optional except established core validations; numeric values must be non-negative; a claim cannot be marked verified without a supporting evidence filename.
- No pricing, costs, margins, quotes, FOB, EXW or finance keys allowed in the schema/API.
- Image manager continues to perform actual R2 uploads. Registering an attachment filename does not upload a PDF. Images are grouped by existing URL and can be tagged, but the first image remains the main picture.
- New info is only available in authenticated product lists and stored in V1/V2 immutable snapshots. The public D1 catalog is intentionally unchanged.

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
