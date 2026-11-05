# PZ Phase 4 — Historical published-product responsibility

**Review candidate only. This PR does not deploy Workers, run D1 SQL, or update R2/KV/Secrets.**

## Scope and invariants

- Admin designates the future custodian for one **already published** product, using the existing department, supervisor and staff accounts.
- `products.created_by`, public product content, SKU, image references, and existing two-stage and Phase 3 revision records do not change merely by assigning a custodian.
- A delegated custodian can request a published-product revision through the existing factory UI; original uploading staff cannot submit a new revision after explicit reassignment. If a product is not explicitly assigned, the original uploader retains the existing permission.
- Only an active, non-supervisor staff/secretary/data-entry account in an active department with an active same-department supervisor can be assigned.
- A product with an unfinished Phase 3 revision cannot be reassigned. `expected_version` implements compare-and-swap for admins. D1 triggers append immutable assignment history on creation and update.
- Revisions still go **staff → supervisor initial approval → admin final approval → explicit publish**. No automatic product publishing, image deletion or role escalation.

## Artifacts

- Schema: `migrations/013_product_responsibility_STAGING_REVIEW.sql` and `013_product_responsibility_PRODUCTION_REVIEW.sql`. Their executable SQL is identical; only the environment comment differs. Create-only; no updates/deletions of old records.
- API: `GET /admin/product-responsibilities`, `GET /admin/product-responsibilities/:productId/events`, `PUT /admin/product-responsibilities/:productId` with `{responsible_user_id,expected_version}`, ADMIN only.
- Staging and Production standalone Worker **candidates** updated to include the new API and delegate-aware factory product list, plus the revised Phase 3 authorization.
- UI: Admin → 产品管理 → 历史产品负责人授权. Factory product catalog shows assigned published products so the authorized staff can request a change.
- Flag: **`PZ_PRODUCT_RESPONSIBILITY_ENABLED`**. Must remain unset/false until the appropriate D1 migration has been verified and the Worker candidate deployed for that environment.

## Staging-first release gate

1. Review the live **`pz-inquiry-api-staging`** Worker version and current deployment source vs the GitHub Staging candidate; never overwrite newer live code. Keep `PZ_RUNTIME_ENV=staging` and Staging-only D1/R2/KV bindings and all existing review feature flags.
2. Apply Migration 013 to **Staging D1 only** after verifying prerequisites 009/010/012. Confirm two new tables `pz_product_responsibilities` / `pz_product_responsibility_events`, three indexes, six triggers. Run `PRAGMA foreign_key_check;` and `PRAGMA quick_check;` after migration; do not run `PRAGMA integrity_check` if D1 blocks it. Existing product rows and counts must stay unchanged.
3. Deploy reviewed Staging Worker **only to Staging** with `PZ_PRODUCT_RESPONSIBILITY_ENABLED` still unset/false; verify existing factory/admin login, lists, review and publish behavior and old Phase 3 UAT.
4. Enable `PZ_PRODUCT_RESPONSIBILITY_ENABLED=true` in Staging only, preserving all D1/R2/KV bindings/secrets.
5. Deploy a **Pages Preview** for this PR pointed at Staging API (do not treat Preview as Production). In Admin → 产品管理, select one synthetic or designated Staging published product originally created by an admin, choose an existing active staff member and confirm assignment. Verify `products.created_by` and published public data are unchanged and the new staff sees the product.
6. Use new staff to create a revision, supervisor to initial-approve, admin to final-approve, then explicitly publish. Check original uploader/no-longer-authorized employees and cross-department accounts cannot start or approve unauthorized revisions. Verify approval still requires explicit publish.
7. Verify assignment history, repeated/stale `expected_version` fails, inactive employee/supervisor rejected and reassignment blocked during an active revision. Ensure the existing revision is completed/canceled before reassigning. No production or customer product data should be used in destructive testing.

## Production release gate (separate approval)

1. After Staging UAT, merge the one reviewed feature PR (no automatic Worker SQL or deployment).
2. Record active **Production** Worker ID, D1 database `1` UUID `b263701b-012b-4d3b-b24d-d250b4e582f9`, R2 `pz-product-images` and Production KV bindings. Obtain a private D1 Time Travel bookmark. Do **not** click Restore as a backup mechanism.
3. Apply **Production Migration 013** separately with the flag **off**. Verify table/index/trigger counts, old row counts, `PRAGMA foreign_key_check`, and `PRAGMA quick_check`.
4. Deploy `main/worker-patches/production-worker-category-governance-REVIEW.js` to the **Production Worker** without changing unrelated config, secrets or review flags; verify existing APIs before enabling the new feature.
5. Enable the flag in Production, then manually deploy the reviewed Pages Production build if the Admin assignment UI is desired. Verify by granting one controlled test product, checking identity/history/read-only public content and the full review-to-publish path. Avoid customer-facing modifications as test data.
6. If a regression occurs, turn the new flag off and roll back the Worker/Pages to the saved active versions. **No D1 restore** is required or appropriate for a Worker code rollback; do not delete the additive migration tables without a separate explicit data-preservation decision.

## QA

- `node --test worker-patches/productResponsibilityCore.test.mjs` verifies migration parity, role restrictions, version CAS, history, active-revision locking, and no change to original product data.
- `node --test worker-patches/publishedProductRevisionsCore.test.mjs` verifies original uploader fallback, delegated custodian access, cross-department isolation, revision approval, and immutable published SKU/provenance.
- Existing full CI typecheck, frontend QA, Phase 2 and Phase 3 tests and Worker syntax checks must remain green.

**Version-management rule:** one feature PR; future Cloudflare deployment IDs and acceptance evidence belong in this PR conversation or the existing Worker runtime ledger, not a new PR per check.
