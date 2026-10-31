# Staging category change integration gate (NOT DEPLOYED)

**Scope:** PR #7 / `feature/category-governance-approval` ONLY. No Production D1, R2, KV, Worker or Pages edits. This guide is for an operator with Cloudflare access.

## Why this must be a two-step rollout

The repo contains a historical 2026-10-30 compiled Staging Worker, **not confirmed to be the presently deployed Active version**. That file may lack the manually deployed category creation route. **Never replace the live Worker with that historical file.** Export the current Active source and patch that current version only.

## Gate A — Staging D1 (database only)

1. In Cloudflare, inspect **pz-inquiry-api-staging** → Settings → Bindings. Follow `DB` to the actual **Staging** D1 database. Do not rely on the display name alone.
2. Read-only preflight:

```sql
SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN
('category_requests','category_change_requests');
SELECT status, COUNT(*) AS count FROM category_requests GROUP BY status;
```

3. Run **only in Staging D1**: [004_category_changes_staging.sql](./migrations/004_category_changes_staging.sql).
   This creates an independent `category_change_requests` table and three indexes. It contains no `DROP`, `DELETE`, `UPDATE` or modifications to `category_requests`.
4. Read-only postflight:

```sql
PRAGMA table_info(category_change_requests);
SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='category_change_requests';
SELECT COUNT(*) AS count FROM category_change_requests;
SELECT status, COUNT(*) AS count FROM category_requests GROUP BY status;
```

Only advance if the old status counts are unchanged and the new table exists.

## Gate B — Staging Worker

1. Record **current Active Staging Worker version** and export its complete code for rollback. Do not touch `pz-inquiry-api` (Production).
2. Verify bindings: `PZ_RUNTIME_ENV=staging`, Staging `DB`, Staging `PRODUCT_IMAGES`, Staging `SITE_CONFIG_KV`. Do not copy Production credentials, buckets, or KV.
3. Image origin: the existing uploaded Staging bundle used `PZ_STAGING_IMAGE_BASE_URL`; newer candidates may use `PZ_IMAGE_BASE_URL`. The new handler uses `stagingCategoryImageBase(env)` to accept either **only when the values agree if both are set**, and reject Production domains. Match to the base URL used by the **deployed uploader**.
4. Merge [factoryCategoryChangesStaging.mjs](./factoryCategoryChangesStaging.mjs) into the *current Active Staging Worker source*, not an older repository bundle. In Cloudflare's single-file editor, strip the two `export` keywords (`stagingCategoryImageBase` and `handleCategoryChanges`), then include the functions before the Worker `index_default` or other module entrypoint. Do not introduce duplicate helper declarations.
5. Inside the Worker's `fetch()` `try` block, before the original route handlers, insert:

```js
const categoryChangeResponse = await handleCategoryChanges({
  request, env, pathname, authorize, json, badRequest
});
if (categoryChangeResponse) return categoryChangeResponse;
```

6. In the **existing** Staging `/admin/category-requests/:id/approve` route, change `let autoPublish = true;` to `let autoPublish = false;` so approving a new category never implicitly publishes. Keep the existing pending-creation route and all other handlers in place.
7. Run syntax check on the **entire patched Worker**. Deploy only to Staging after checks pass. An unauthenticated GET `/admin/category-change-requests` and POST `/factory/category-change-requests` must return 401, not 404 or 500. These are route/auth smoke checks, not workflow proof.

## Gate C — Preview QA

Use a *Staging* preview build of PR #7. Verify `/api` on Preview resolves to **Staging Worker**; inspect actual request hostname in DevTools. Do not use Production URLs.

1. Factory: open **产品分类申请**, choose a published Staging category (e.g. Sofa), change Chinese name/description and upload a **new Staging R2** cover; submit. Response `status=pending`.
2. Recheck `/api/site-config`: published category remains unchanged. Existing legacy `category_requests` rows remain unchanged.
3. Admin: open **审核中心**; ensure side-by-side old/new values. Approve. Response `status=approved, needsPublish=true, published=false`.
4. Inspect **draft**: changed values present. Inspect **published**: unchanged.
5. Admin explicitly clicks **发布全部网站配置** only after confirming all draft sections are ready. Verify published English/Chinese name, cover and navigation. This publishes the *entire* saved site configuration, not just categories.
6. Negative tests: reject second request with reason; duplicate pending request 409; wrong CDN hostname 400; unauthorized request 401; stale admin draft rejects with 409.
7. Existing category creation (legacy `category_requests`) still creates `pending`; approval is draft-only after Step B. No existing approved rows are modified by this migration.

## Gate D — Production readiness (future, NOT performed here)

Before any Production rollout, resolve concurrent KV writes and `applying` reconciliation; separately review Production D1 migration, Worker guard and Production R2 host validation. Keep `PZ_CATALOG_V2_ENABLED=false` unless a separately authorized release changes it.

## Rollback

If staging code fails, restore previous Active Staging Worker deployment; do not reset D1. The new `category_change_requests` table can remain unused. Roll back preview Pages separately if needed. Never use a Pages rollback as a Worker rollback.
