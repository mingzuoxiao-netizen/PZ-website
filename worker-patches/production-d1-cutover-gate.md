# Production D1 site-config concurrency cutover — REVIEW GATE

**NOT DEPLOYED. No Cloudflare Production D1, Worker, Pages or KV changes made by this PR.**

## Why

Before this change, multiple administrative writes to `draft:site_config` used direct KV get/put. KV has no conditional compare-and-swap for these writes, so concurrent editors or approvals can silently replace each other's changes. The Production candidate therefore moves **both draft and public site config** to a single-row D1 authority behind a flag; it does not rely on KV locking or in-memory locks.

## Components

- `migrations/005_category_changes_production_REVIEW.sql`: separate classification amendment requests.
- `migrations/006_site_config_d1_versioned_REVIEW.sql`: additive table `site_config_state` with draft/published JSON, integer revisions, write token, metadata.
- `siteConfigD1Production.mjs`: D1 CAS, transactional approval, one-time bootstrap, revision-guarded publish/rollback, R2 published snapshots.
- `production-worker-category-governance-REVIEW.js`: full Production Worker candidate, containing the D1 module and old routes retained behind an opt-in gate.
- `AdminWorkspace.tsx`: new `revision` request envelope when server returns it; sends legacy payload on the current Staging/older backend.

## Safeguards

- While `PZ_D1_SITE_CONFIG_ENABLED` is not `true`, old site-config routes and pre-existing new-category approval remain routable; **new category modification approval and reconciliation** return 503 until D1 cutover. Legacy new-category approval in the full candidate now saves draft only (no auto-publish); communicate the behavior change before deployment. Direct KV writes remain a temporary risk in this phase, so observe a short editor maintenance window.
- With the flag on: reads and writes of draft/published configuration go to **D1**. `PUT /site-config` requires `{revision,config}`; `POST /admin/publish` requires `{revision}`; stale writes return 409; missing revision returns 428.
- Legacy new category approval and new category amendment approval update D1 draft + request status in a single D1 `batch` transaction with a unique write token. Both are draft-only.
- Public `GET /api/site-config`, factory category amendment reads and admin preview read D1 authoritative data. Legacy KV reconciliation is rejected after cutover.
- No change to `PZ_CATALOG_V2_ENABLED`. Production R2 validation remains `https://cdn.peng-zhan.com`.

## Release prerequisites (do not skip)

1. Obtain explicit Production rollout approval, change window, and record the current Active Worker version for recovery. Confirm there is no newer Worker version since the baseline used in PR #8.
2. Verify production D1 `DB`, Production R2 `PRODUCT_IMAGES` and `SITE_CONFIG_HISTORY`, and Production `SITE_CONFIG_KV` bindings. Do not copy Staging values.
3. Run migration SQL 005 and 006 **only against the confirmed Production D1** after reviewing it. Read-only verify table/index definitions and that existing `RUGS`, `Sofa` (approved) and `PZ Pending Test` (pending) remain unchanged.
4. Publish the **revision-aware frontend** to Production before enabling D1 (the frontend is backward compatible with the pre-cutover backend). Coordinate PR #6 → #7 → #8; do not publish while drafts/worker versions disagree.
5. Deploy the full Worker candidate with `PZ_D1_SITE_CONFIG_ENABLED=false`. The D1 feature must be inactive at first. Confirm legacy public reads, auth, Products, and Inquiries remain correct. Temporarily freeze all admin site-config edits, new-category approvals, category-change approvals and publishing until cutover completes.
6. As an authenticated Production ADMIN, `GET /admin/site-config/bootstrap` to obtain `draftSha`, `publishedSha`, and both category counts. Manually compare with existing KV and expected website. Then **POST** the same endpoint with JSON `{draftSha,publishedSha}`. It is one-time and refuses an existing D1 state; wrong SHA 409. **Before inserting the D1 state, bootstrap writes and re-reads an immutable R2 snapshot named `snapshots/site_config/bootstrap-<publishedSha>.json`; it returns `publishedVersion` and `initialSnapshotVerified: true`. If R2 is missing or inconsistent, D1 remains untouched.** This seeds D1 from the existing KV snapshots, **not** from defaults. Verify the D1 row, the exact expected number of categories, the `published_version` and its R2 snapshot. Record the returned `publishedVersion` as the pre-cutover rollback target.
7. Switch the **Production Worker only** to `PZ_D1_SITE_CONFIG_ENABLED=true`, then test `/api/site-config`, admin `/admin/draft/site-config` revision, Preview, a benign draft write, deliberate stale version conflict (409), and explicit draft-only category approvals. Confirm Products and Inquiries unaffected. End maintenance window only after verification.
8. Publish deliberately once and verify live category names/covers, Chinese/English display, product relationships, and snapshot history. Test manual rollback on a staging replica before using it in Production.

## Important rollback limitation

**Do not turn off `PZ_D1_SITE_CONFIG_ENABLED` or revert to the old Worker after new D1-backed publication without a verified data recovery plan.** The old Worker reads KV, but D1-backed publishing intentionally does not overwrite old KV, so a blind code rollback could show an older website. Prior to cutover, use original Worker deployment rollback; after cutover, preserve D1 authority and restore a verified published snapshot in D1. For emergency reversion to the old Worker, export the exact D1 draft/published snapshot and reconcile it to KV under a maintenance window first. This transfer is not automated in this PR.

## Follow-up gates before applying Production SQL

- Real Cloudflare D1 multi-request integration, including two admins saving concurrently, two category approvals concurrently, and failed R2 snapshot writes.
- Confirm bootstrap captured the current authoritative KV state (KV reads are eventually consistent); freeze editors during seed/cutover.
- Verify old open browser tabs receive 428/409, and that user-facing refresh instructions work.
- Verify on a staging clone that public D1 reads and cache policy match expectations.
- Add/verify operational rollback workflow for a **post-cutover** outage, not only old Worker rollback.

The completed GitHub CI is a code-and-mock check, **not proof of live Cloudflare concurrency behavior**. The PR stays Draft until operator validation and authorization.
