# PZ V2 phase 2 — Double-review Staging gate (PR #22)

Review only. Do not merge or deploy Production. Based on PR #21 phase-one verified Staging.

## Blocking prerequisites
- Confirm PR #21 Staging roles, D1 009 and deployed Worker version are still healthy.
- Confirm Staging uses distinct D1/R2/KV/JWT secrets and Pages Preview backend.
- Verify Staging D1 backup/restore plan; worker candidate must be compared with active Staging Worker source.
- BEFORE enabling, inspect legacy pending requests: SELECT status,COUNT(*) AS n FROM products GROUP BY status;
- If `awaiting_review` legacy rows exist, keep phase-two flag OFF until each is resolved or explicitly migrated with immutable V1; never silently publish or discard them.
- Confirm Worker syntax, unit tests, TypeScript, frontend build, existing category tests all pass.

## Deployment sequence (Staging only)
1. Apply migration `010_two_stage_product_review_REVIEW.sql` to Staging D1 once. Inspect `pz_product_reviews`, `pz_product_review_versions`, `pz_product_review_events` and review triggers/indexes.
2. Deploy the reviewed Staging candidate, not Production candidate; keep PZ_RUNTIME_ENV=staging.
3. Set Worker flag `PZ_TWO_STAGE_REVIEW_ENABLED=true` only after migration and legacy-pending preflight passes. Maintain `PZ_ORG_RBAC_ENABLED=true`.
4. Deploy branch Preview, not live Pages. Review API via the Preview gateway and verify direct Staging Worker 401 on unauthenticated review routes.

## Manual E2E acceptance
1. Staff from an assigned department creates a new draft with required SKU, name, category and images.
2. Staff submits via `POST /factory/products/:id/submit`; returned status `pending_supervisor`; public catalog remains unchanged.
3. Direct supervisor opens `#/creator/supervisor` > 产品初审; other supervisor cannot read/approve this request (403).
4. Supervisor approves, status `pending_admin`; admin sees it in 产品终审与发布.
5. Admin can inspect V1 and all events and approve, status `approved_pending_publish`; product is not public yet.
6. Admin explicitly publishes; confirm product appears once and that catalog snapshot is updated.
7. Separate request: admin returns with a reason → `returned_to_supervisor`. Employee cannot edit until supervisor assigns changes.
8. Supervisor requests correction with reason → `returned_to_uploader`. Employee edits draft and resubmits → V2. V1 remains unchanged.
9. Check second supervisor approval is mandatory before second admin final review.
10. Admin attempts direct POST/PUT/DELETE `/admin/products` or physical image removal while phase-two flag is on → blocked.
11. Test duplicate approval and stale actions → 409; verify unchanged published catalog and persisted full event history.
12. Verify categories, inquiry submission, public product lists, account management and original R2 uploads are still functional.

## Important deliberate limits
- This first phase-two PR implements workflow for NEW draft products. Already published product editing/revision cloning is NOT enabled; do not modify live products using the legacy PUT.
- Review snapshots retain immutable JSON image references; physical admin product image removal is blocked under the feature flag. Separate R2 cleanup must respect referenced versions.
- Current publish changes D1 status and then triggers the existing KV catalog publish endpoint. If the catalog snapshot fails, report 503 and reconcile using the existing admin publish-products action; check both D1 and KV before confirming publication.
- The first staging cutover is only for verified test accounts. Production sign-off requires a separate migration plan for legacy pending records and publication consistency.

## CI commands
- node --test worker-patches/productTwoStageReviewCore.test.mjs
- node --check worker-patches/staging-worker-category-changes-REVIEW.js
- node --check worker-patches/production-worker-category-governance-REVIEW.js
- npm run typecheck; npm test; npm run build

## Rollback
- Turn phase-two flag off only after freezing in-flight new reviews. Do not delete review tables, versions or events.
- Do not roll back to a Worker that can edit or publish review products through old routes. Reconcile draft statuses and pending reviews first.
- Keep phase-one RBAC enabled. Never use production bindings to test.