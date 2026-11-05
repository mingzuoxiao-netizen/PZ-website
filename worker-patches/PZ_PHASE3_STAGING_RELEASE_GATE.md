# PZ Phase 3 — Published Product Revision Staging Release Gate

**Status:** REVIEW ONLY. Do not deploy this branch or execute SQL against Production.

## Why a separate revision store

The existing Phase 2 new-product approval process changes products.status. Reusing it for a published product would temporarily remove that product from published-only public catalogs. Phase 3 stores every candidate change in new pz_published_* tables. products remains the public source until a separate admin publish.

## Required baseline and compatibility

1. Compare the ACTUAL active Cloudflare Staging Worker with the repository Staging Worker candidate. The compiled Worker in GitHub is not guaranteed to match the active Worker.
2. Staging must have isolated DB, PRODUCT_IMAGES R2, SITE_CONFIG_KV and secrets. Confirm PZ_RUNTIME_ENV=staging; do not share Production bindings.
3. Staging migrations 009, 010 and 011 must already exist. Inspect column names, statuses, triggers and existing rows before proceeding. Do not silently run 011 again: ALTER TABLE ADD COLUMN is not idempotent.
4. Take a Staging D1 recovery point, then apply **only** 012_published_product_revisions_STAGING_REVIEW.sql to Staging. It adds separate tables and never ALTERs the products table.
5. Deploy the reviewed Staging Worker candidate with PZ_PRODUCT_REVISIONS_ENABLED unset or false. Check original new-product approvals, uploads, categories, inquiries and public catalog still work.
6. After gate verification, enable **PZ_PRODUCT_REVISIONS_ENABLED=true** in Staging only. All revision routes reject mismatched PZ_RUNTIME_ENV (403). The flag does not opt in any Production Worker.
7. Point a Pages Preview build only at the isolated Staging backend. Never let the Preview frontend write to Production.

## UAT with a published Staging test product

Use a published product whose created_by is an **active assigned FACTORY staff** account with an active supervisor. Legacy ADMIN-created or unassigned products are deliberately not editable under the initial ownership gate.

1. Public product GET /public/products?id=<test> and current website details: note existing name, images, SKU and status=published.
2. As original uploading staff, open product list -> 申请修改. Edit name, size and main image; save. Confirm a separate revision draft appears.
3. Before submission and at every review step, public GET remains unchanged; products.status stays published.
4. As staff, click 提交主管初审. Verify latest submitted snapshot version 1; draft becomes read-only.
5. As another department's supervisor, attempted access/approval must return 403. Correct supervisor approves.
6. Admin return: revision goes to **returned_to_supervisor**, not directly to employee. Supervisor clicks 安排员工修改. Original employee edits, saves and resubmits. Original immutable V1 is unchanged; V2 is appended.
7. Correct supervisor approves V2, admin final-approves; public product still unchanged in both legacy KV catalog and D1 V2 reads.
8. Admin explicitly clicks 确认发布修订. Existing product ID and SKU remain unchanged, status stays published, newly approved fields appear in D1 public API and refreshed KV catalog.
9. Verify no price/financial fields, technical specs_json, attachments or review history appear in public catalog. No R2 object was deleted.
10. Attempt submitting with an external image URL, wrong R2 bucket, stale draft_revision and stale product.updated_at: each must reject without changing product or review states.
11. If D1 publication succeeds but KV refresh fails (503), admin's 重新同步官网目录 should repair the published snapshot without applying the product edit twice.
12. Finish with read-only review of the approved revision version/event history and two-stage audit controls.

## Operational limitations (do not bypass)

- Phase 3 initially allows only the **original publishing staff account** to start/edit its published SKU revision. ADMIN can review and publish but cannot silently overwrite or self-initiate a revision. For legacy/admin-owned SKUs, create a separate audited reassignment/delegation feature; do not temporarily bypass authorization.
- New images must be present in the environment's R2 bucket. Existing published image URLs are grandfathered; no physical R2 deletion occurs here.
- The Production candidate contains disabled code only. A **separate Production D1 schema and Worker preflight**, deployment plan and operator authorization are required before ever enabling the flag in Production.
- No claims about Production D1 or active Worker schema should be inferred from this repository alone.
- Do not remove old snapshots or product history as a rollback. Disabling PZ_PRODUCT_REVISIONS_ENABLED hides new revision routes but does not undo a revision that has already been explicitly published.

## Automated checks

GitHub website-2-qa runs node --test worker-patches/publishedProductRevisionsCore.test.mjs and python3 worker-patches/test_published_revision_integration.py, plus the existing TypeScript, frontend and Worker regression suites.
