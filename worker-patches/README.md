# PZ Product Catalog V2 — scalable publication fix (staging only)

## Status

This repository contains the Pages/React frontend and API proxy. The live Cloudflare Worker `pz-inquiry-api` is **not** stored in this repository. The file `worker-patches/publicProductsD1.js` is a proposed integration helper, not a deployed Worker. Nothing in this branch updates the production D1 or KV.

**Do not merge or deploy a production Worker until the separate Worker source has been reviewed and staged.**

## Root cause

- Admin `PUT /admin/products/:id` writes the `products.status` in D1.
- Public `GET /public/products` reads `SITE_CONFIG_KV["published:products"]`, a previously generated whole-catalog snapshot.
- The update route does not invoke a snapshot update; therefore `published` in D1 can be missing from public JSON.
- Rewriting the full KV value on every approval costs O(N) in catalog size and can cause update races.

## Target architecture

1. D1 `products` with `status='published'` is the **sole authority** for visibility.
2. `GET /public/products?v=2&limit=24&category=...&sub=...&cursor=...` returns a **keyset-paginated** page of public records. Maximum 48.
3. `GET /public/products?v=2&summary=categories` returns category and subcategory counts without downloading products.
4. `GET /public/products?v=2&q=term` returns paginated search matches.
5. `GET /public/products?v=2&id=... ` returns a single published item for deep links.
6. Public response uses short 15-second shared-cache TTL as a starting configuration; monitor real cache behavior before claiming edge cache hits. Authorized APIs stay `no-store`.
7. Existing `/public/products` (without `v=2`) keeps the legacy KV format temporarily for safe staged migration. Once all clients migrate, deprecate it.
8. Approval, unpublish and delete modify D1 only. They should check affected rows and return meaningful errors. Never acknowledge success for a missing product.

## Integrating the separate Cloudflare Worker

In the actual Worker source (after making a backup):

- Copy `handlePublicProductsD1` and helpers from `worker-patches/publicProductsD1.js` into the Worker module, or import it in a Wrangler-managed project.
- In the existing `pathname === "/public/products" && request.method === "GET"` route, add *before* its existing KV reads:

  ```js
  if (new URL(request.url).searchParams.get("v") === "2") {
    return await handlePublicProductsD1(request, env);
  }
  ```

- Do not change the existing authentication / `POST /inquiries` / admin / factory endpoints.
- Do not copy the existing untested `is_published` field into SQL; it does not exist in D1.
- The frontend uses `/api/products?v=2` (Pages proxy maps it to Worker `/public/products`).
- For the first staging test, **use a duplicate Worker and a cloned staging D1**.
- Preview Pages can use `PZ_BACKEND_WORKER=https://<your-staging-worker>.workers.dev` scoped to Preview environment ONLY; never point staging writes at production D1 or R2.

## Index migration

Before applying `worker-patches/migrations/001_catalog_indexes.sql`, take a database backup and use `EXPLAIN QUERY PLAN` with representative queries. D1 schema includes `id,status,category,sub_category,updated_at,code`. Apply only after verifying names/types.

## Release gating — DO NOT SKIP

1. **Unpublish test SKU PZ-111** (fake jewelry images) through authenticated admin UI, confirm D1 status is `draft`/`rejected`, and verify it is absent from both legacy KV and V2 public API in staging.
2. Stage Worker with isolated D1. Seed test products: draft, awaiting_review, rejected and published, all with distinct images.
3. Test public reads are limited to published products with valid images.
4. Test >48 products pagination: no duplicates, complete traversal, stable ordering; filters, search, single-product deep link and category facets must work.
5. Test admin approval visibility and revoke visibility. With caching enabled, propagation time should be <= configured 15 seconds plus any unexpected edge or browser caching.
6. Test role isolation: FACTORY must not access ADMIN endpoints; public API must not return unpublished records.
7. Run the Pages feature branch preview with Preview-only `PZ_BACKEND_WORKER` pointed at staging Worker; verify Home, Portfolio, Search, images and product detail deep links, including mobile.
8. Check query plans and D1 `rows_read` for 1000, 10000 and larger test product counts, and check read costs, latency and cache hit rates.
9. After validation: deploy Worker V2 in backwards-compatible mode first, then release Pages V2; monitor and keep a rollback to legacy. No simultaneous unreviewed cutover.
10. Once stable, remove the unused full-catalog KV publisher in a separate change. Preserve `SITE_CONFIG_KV` for website configuration; do not delete unrelated keys.

## Scalability notes

- Keyset paging with indexed status/category/time scales more predictably than giant KV snapshot rewrites or SQL OFFSET scans.
- This V2 has basic substring search with LIKE. If product count or search traffic increases enough to cause high D1 rows_read, implement and benchmark a D1 FTS5 search index separately; don't assume LIKE is indexed.
- For high global read volume, D1 Read Replication is a later optimization. If enabled, use D1 Sessions/bookmarks for consistency rather than treating replicas as instant.
- Cloudflare Cache API caches only within local data centers and its invalidation is not globally instantaneous. Prefer bounded short TTLs with explicit monitoring.

## Known limitations of this branch

- The Cloudflare Worker source and deployed settings are not checked into this repo; therefore the actual D1-backed endpoint is **not yet live**.
- Frontend includes a legacy whole-snapshot fallback until Worker V2 is deployed.
- Production remains on its existing KV snapshot behavior.
- Any user-provided code excerpts in chat are not a substitute for a reviewed full Worker source and staging test.
