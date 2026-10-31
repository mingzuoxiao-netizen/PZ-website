# Production Worker category-request release gate

## Verified Production facts (Cloudflare console screenshot, 2026-10-30)

- Production Worker direct POST /factory/category-requests without auth returns **404 Not found**.
- Production D1 `category_requests` columns match Staging:
  `id, title, title_cn, subtitle, image, status, created_at, updated_at`.
- `status` default `pending`, and **one approved row already exists**.
- **Never delete, reset or overwrite the existing approved row.**
- No schema migration is planned.

## Production patch candidate: NOT DEPLOYED

- [factoryCategoryProduction.mjs](./factoryCategoryProduction.mjs) — gated to `PZ_RUNTIME_ENV=production` and exact `https://cdn.peng-zhan.com` image origin, validates uploaded file exists in Production R2, inserts only one `pending` row, never touches the approved row or published site config.
- [factoryCategoryProduction.test.mjs](./factoryCategoryProduction.test.mjs) — regression tests include preserving pre-existing approved records.
- Staging-only patch is a separate file; do not copy its `staging` guard into Production.
- **This is a candidate, not a verified deployment artifact.** Merge to current deployed Worker only after reviewing current Production source, environment bindings, and a prior release rollback path.

## Read-only preflight in Production D1

```sql
SELECT sql
FROM sqlite_master
WHERE type = 'table' AND name = 'category_requests';
SELECT id, title, title_cn, status, image
FROM category_requests
WHERE status = 'approved';
```

Review the DDL for any CHECK constraints; identify the existing approved row and do not recreate it.

## Worker preflight

1. Confirm exact target Worker is `pz-inquiry-api` and **not** `pz-inquiry-api-staging`.
2. Confirm `PZ_RUNTIME_ENV = production`, `PZ_IMAGE_BASE_URL=https://cdn.peng-zhan.com`, existing Production `DB`, `PRODUCT_IMAGES`, and `SITE_CONFIG_KV` bindings. Never share secrets.
3. Confirm `PZ_CATALOG_V2_ENABLED=false`, no changes to it.
4. Save current deployed Worker source/version to permit rollback. Do not replace current Worker with the old V3.2 file.
5. Review original existing `authorize`, `json`, `badRequest`, `pzConfiguredImageBase` helper signatures and routing. Insert the candidate function at Worker top level (remove `export` in single-file editor) and call it in `fetch` only for `POST /factory/category-requests` before final Not found. Verify no existing route with same purpose.
6. Deploy only this Worker change, then unauthenticated POST `{}` must return HTTP **401**, not 404.
7. Do NOT create authenticated Production test proposals until PR #6 Pages frontend is deployed and public-facing regression is planned. Instead test existing site endpoints and inquiry before/after. A 401 response is only route/auth proof, not end-to-end success.
8. Any regression: rollback the Worker to saved previous version. Pages rollback does not undo Worker changes.

## Publish-path safety

The production D1 approved row may or may not be included in the **published** site configuration. Check `/api/site-config` and the Admin product-category cover manager; do not assume approval alone means public display. On the existing Worker the category approval route may lack expected-state guards and can publish the entire site-config draft KV. Do not approve/reapprove the existing row to “fix” visibility. Inspect/upgrade approval atomicity separately if needed.

## After preflight & Worker route check

Complete PR #6 review and merge with full CI green, then build from final main and manually deploy Pages with Functions. Keep Pages automatic deployments paused. Release screenshots, all B2B inquiry tests, admin image upload tests and bilingual nav must pass. Production images need separate Production R2 upload; Preview images are isolated in Staging.
