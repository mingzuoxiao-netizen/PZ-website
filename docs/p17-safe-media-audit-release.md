# PZ PR #17 — Safe image references and audit storage visibility

**Status: candidate only — not deployed.** No current Production Worker, Pages deployment, R2 object or D1 row is changed by merging this PR.

## Why
- The factory editor previously called `/factory/products/:id/remove-image` but the Workers implemented only `/admin/products/:id/remove-image`; the UI removed the picture before a failed request, making it look successful.
- The existing product hook also sent a partial PUT when reordering images, potentially overwriting other product fields. Reordering now stays local until the full form is saved.
- A former media cleanup component had a permanent delete button against an endpoint absent from the reviewed worker. Replace it with an admin **read-only** reference inspector.
- D1 `audit_logs` is append-only with no automatic retention. Add an approximate, admin-only storage display; do not delete audit records.

## Scope
1. Both Production and Staging Worker candidates: `/factory/products/:id/remove-image` now supports Factory or Admin authenticated users but only **draft/rejected** products; admin route retains its role. Images are matched by exact URL. The Worker does not delete R2 objects.
2. Product image editor: wait for server acknowledgement before removing an existing image from the UI; show errors; reorder locally and save the complete product with the form.
3. Worker: `GET /admin/media/image-usage?url=<encoded>` checks known product/category/site config references, R2 existence and returns `safeToDelete:false` **regardless of counts**. It does not check every historical R2 snapshot, external link or cache. It is for investigation, **not deletion authorization**.
4. Admin website media tab: show that read-only inspector; no delete button.
5. Production audit Worker: `GET /admin/audit-storage` returns a count, pending count, dates and approximate JSON payload bytes (excludes database indexes/overhead). The UI displays this under Operation Logs.
6. No audit retention or automatic purging, no R2 deletion, no schema migration.

## Mandatory release order
1. Review the diff and PR QA; confirm it merges against current `main`.
2. **Staging first**: deploy only the Staging candidate Worker to `pz-inquiry-api-staging`. Preserve Staging D1/R2/KV + `PZ_RUNTIME_ENV=staging`. Keep Production Worker unchanged.
3. On Staging: create a **new test product** with a unique SKU and 2 images; remove 1 via factory; reload to check D1-backed persistence; verify the R2 object still exists. Check unsubmitted/rejected product edit, submitted/published 409, missing image 409, anonymous 401, Admin-only media check 403 for factory and valid result for Admin. Reorder images, click Save, reload; verify all other product fields and SKU survived.
4. Only after all tests pass: deploy Production Worker candidate to `pz-inquiry-api`. Record active Worker version before/after and keep rollback. Do not change Secrets or environment bindings.
5. Check administrator and factory products, approval, catalog, category changes, site config and audit log.
6. Merge PR and manually deploy Pages Production (auto deploy is disabled). Verify current Git commit, API custom domain and the media/log UI.
7. Keep `workers.dev` until a separate cutover review. Do not claim the entire historical R2 bucket can be safely cleaned.

## Audit logs and retention
- Logs are durable entries in D1, not a browser memory cache. The UI paginates 30 per page.
- Estimated JSON bytes in the dashboard is not the actual D1 storage size. No current auto-expiration rule exists.
- Retain security-related actions. If storage becomes material, first implement export/verification to a private archive plus a documented retention policy; make deletion separately approved and independently tested.

## Known safety limits
- The read-only check is deliberately incomplete: R2 site-config historical snapshots, external links and caches are not exhaustively scanned.
- The R2 key check only accepts images belonging to the current environment's CDN and under `uploads/`.
- Cloudflare Worker code is pasted/deployed separately; a GitHub PR merge does **not** deploy that Worker.
