# Staging V3.1 SKU integrity — deployment contract

Zhaoqing HQ centrally manages the catalog; this migration is unrelated to production-site authorization.

## Apply order (STAGING only)
1. Back up D1 `pz-staging-db`; never operate on production D1 `1`.
2. Run the first SELECT from migration 002. It MUST return 0 duplicate groups. If not, stop and reconcile individual records manually.
3. Apply `migrations/002_unique_normalized_sku.sql` to Staging D1.
4. Verify `PRAGMA index_list('products');` includes `ux_products_sku_normalized`, unique=1.
5. Deploy the complete **V3.1 staging Worker bundle** provided separately, retaining Staging D1/KV/R2/JWT bindings. This Worker:
   - normalizes new SKUs using trim + uppercase, requires `PZ-...` format on creation,
   - catches D1 UNIQUE collisions and returns HTTP 409 `{error:"SKU already exists",code:"SKU_CONFLICT"}`,
   - exposes authenticated `POST /factory/products/check-skus` with `{codes:[...]}` (max 30) returning `{existingCodes:[...]}`; the lookup uses the new index,
   - preserves existing V3 draft, review, production-site and public D1 V2 routes.
6. Only after the Staging Worker has been updated, test the latest PR #5 Pages Preview. Preview must bind `PZ_BACKEND_WORKER` to the Staging Worker, not production.
7. Verify duplicate creation returns HTTP 409 directly from backend, including same SKU with varied case/whitespace, and no additional D1 row appears.

## Important
- This PR adds the *migration and frontend client* but **does not deploy the complete compiled Cloudflare Worker source**. Deploy the provided V3.1 bundle manually to Staging before using the updated batch form.
- Existing records with empty/null SKU are retained as legacy drafts. These are not covered by the unique index until assigned valid SKUs.
- The unique index prevents duplicate nonblank SKUs even when two accounts write concurrently. The preflight lookup is an ergonomic early check only.
- R2 uploads and D1 product creation are still separate operations; unused objects can remain after an interrupted draft save.
- GitHub PRs #4 and #5 remain draft. Do not merge to production until Staging acceptance and independent security review.
