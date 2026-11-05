# PZ Workers / Cloudflare runtime baseline

**Last reviewed:** 2026-11-05 (America/Los_Angeles)
**Purpose:** durable deployment inventory. Update this ledger whenever the user supplies an actual Worker code export, runtime-variable screenshot, D1 schema evidence, or confirms a deployment.

> Evidence levels matter:
> - **Screenshot:** observed in a supplied Cloudflare screenshot (not direct API verification).
> - **User-confirmed:** deployment/migration/UAT stated by operator (not independently read from Cloudflare).
> - **GitHub candidate:** code checked into the repository (not proof the active Worker has that code).
> - **Uploaded code:** pasted Worker code (not necessarily the active deployed version unless verified against the deployment).

## Production Worker — screenshot and code export (2026-11-05)

**Worker:** `pz-inquiry-api` (Production). **Status:** inspect-only, not authorized to migrate, replace, or enable Phase 3.

### Variables shown

| Variable | Visible value | Evidence |
| --- | --- | --- |
| `PZ_RUNTIME_ENV` | `production` | Production Worker screenshot |
| `PZ_CATALOG_V2_ENABLED` | `true` | screenshot |
| `PZ_D1_SITE_CONFIG_ENABLED` | `true` | screenshot name was visually truncated; full spelling also occurs in uploaded Worker source |
| `PZ_IMAGE_BASE_URL` | `https://cdn.peng-zhan.com` | screenshot |
| `PZ_ORG_RBAC_ENABLED` | `true` | screenshot |
| `PZ_TWO_STAGE_REVIEW_ENABLED` | `true` | screenshot name truncated; full spelling occurs in uploaded Worker source |
| `PZ_PRODUCT_REVISIONS_ENABLED` | **not visible in screenshot** (do not assume enabled) | screenshot |

**Secret names shown** (VALUES MUST NEVER BE COPIED INTO THIS FILE): `ADMIN_PASSWORD`, `ADMIN_SECRET_TOKEN`, `DEEPSEEK_API_KEY`, `JWT_SECRET`, `OPENAI_API_KEY`, `TURNSTILE_SECRET`.

### Bindings shown

| Type | Binding | Value shown |
| --- | --- | --- |
| KV | `ASSETS_KV` | `ASSETS_KV` |
| D1 | `DB` | `1` — database UUID `b263701b-012b-4d3b-b24d-d250b4e582f9` (matched with dedicated D1 overview screenshot, 2026-11-05) |
| R2 | `PRODUCT_IMAGES` | `pz-product-images` |
| R2 | `SITE_CONFIG_HISTORY` | `pz-site-config-history` |
| KV | `SITE_CONFIG_KV` | `SITE_CONFIG_KV` |

### Uploaded Production code export

- Source: user-provided `粘贴的文本 (1)(20261105-191918).txt`.
- Local source **SHA-256**: `2a47829b726e03347b30d32231fd51600f527f745c41a77c1bb333a03754582f`.
- Size **228,497 bytes**, approximately **5,944 lines**.
- Includes `pzTwoStageReviewFetch`, organization RBAC, Product/Catalog V2 and D1 site config logic.
- Does **not** contain `pzPublishedProductRevisionsFetch` or `PZ_PRODUCT_REVISIONS_ENABLED`.
- The file itself begins with the comment `REVIEW CANDIDATE; NOT DEPLOYED`. Consequently, **do not equate it to the active Production deployment without independent Cloudflare version verification**.
- GitHub main **Production candidate** is different: `worker-patches/production-worker-category-governance-REVIEW.js`, Git blob SHA `be546392e96842d78a71d5988b484dbb6e761834` (approx. 6,470 lines) and **contains Phase 3 revision code**. **Not evidence of Production deployment.**

### D1 Overview confirmation (operator screenshot: 2026-11-05)

- Cloudflare breadcrumb: `D1 Database > 1` — this is the **database name**, not a numeric index.
- Database UUID visible in screenshot: `b263701b-012b-4d3b-b24d-d250b4e582f9`.
- Dashboard reported **15 tables** and approximately **385 kB** current storage. These are descriptive dashboard statistics, **not** proof that migrations 009/010/011/012 or required columns are installed.
- No SQL was run in this step; no Production migration or code deployment is confirmed.
- Next verification: **read-only** D1 Console queries to list relevant tables, inspect `products` columns, and check review/departments schema before designing a Production migration.
- Dashboard D1 identification is screenshot-confirmed; active Worker binding is consistent by database name, but independently confirming its UUID in Worker Settings remains prudent.

### Production D1 read-only table inventory (operator Console screenshots: 2026-11-05)

- A read-only `sqlite_master` table-name query was executed on database `1` (UUID `b263701b-012b-4d3b-b24d-d250b4e582f9`).
- **17** entries are visible from the two screenshots, including the system tables `_cf_KV` and `sqlite_sequence`; this is consistent with the dashboard's **15 user tables**.
- Table names observed: `_cf_KV`, `audit_logs`, `auth_tokens`, `category_change_requests`, `category_requests`, `inquiries`, `organizations`, `products`, `pz_departments`, `pz_product_review_events`, `pz_product_review_versions`, `pz_product_reviews`, `pz_staff_assignments`, `rate_limits`, `site_config_state`, `sqlite_sequence`, `users`.
- Confirmed: department/assignment and original two-stage review tables exist. The three Phase 3 revision tables (`pz_published_product_revisions`, `pz_published_revision_versions`, `pz_published_revision_events`) are **absent** from the listing, so Production migration 012 has **not been confirmed as applied**.
- Table names **do not verify** schema migration 011 or the `products.specs_json` column; next read-only check: `PRAGMA table_info(products);`, then assess other column/constraint compatibility.
- No Production write, D1 migration, flag activation, or Worker deployment was done in this inventory check.

### Production release gates

1. Confirm actual Production Worker deployment/version. D1 `DB -> 1` is now **identified** via its D1 Overview screenshot: UUID `b263701b-012b-4d3b-b24d-d250b4e582f9`. Reconfirm the live Worker binding points to that exact UUID at deployment time.
2. Verify Production D1 existing migrations/tables and decide whether a production-specific 012 is compatible. Do not assume Staging migration is applicable unchanged.
3. Confirm KV/R2 isolation and public catalog code path against *actual active* Worker, not just the GitHub candidate.
4. Before a Production change: recovery point, reviewed migration, reviewed Worker diff, disabled-flag rollout, read-only pre/post checks, operator approval.
5. Do not set `PZ_PRODUCT_REVISIONS_ENABLED=true` in Production until all above gates pass.

## Staging Worker — screenshots and operator updates (2026-11-05)

**Worker:** `pz-inquiry-api-staging`.

### Variables and secrets observed

| Variable | Screenshot / operator status |
| --- | --- |
| `PZ_RUNTIME_ENV` | `staging` |
| `PZ_CATALOG_V2_ENABLED` | `true` |
| `PZ_ORG_RBAC_ENABLED` | `true` |
| `PZ_TWO_STAGE_REVIEW_ENABLED` | `true` |
| `PZ_IMAGE_BASE_URL` | a Staging R2 pub URL (truncated in screenshot) |
| `PZ_STAGING_IMAGE_BASE_URL` | Staging R2 pub URL (screenshot name truncated) |
| `PZ_PRODUCT_REVISIONS_ENABLED` | operator confirmed setting to `true` after Staging Worker deployment |
| `JWT_SECRET` | present as encrypted Secret (do not record value) |

### Bindings observed

| Type | Binding | Screenshot value |
| --- | --- | --- |
| D1 | `DB` | `pz-staging-db` |
| R2 | `PRODUCT_IMAGES` | `pz-staging-images` |
| R2 | `SITE_CONFIG_HISTORY` | `pz-staging-history` |
| KV | `ASSETS_KV` | `pz-staging-assets` |
| KV | `SITE_CONFIG_KV` | `pz-staging-site-config` |

- Migration 012 executed on Staging D1; operator reported the verification passed.
- Operator reported deploying the Phase 3 Staging Worker and enabling the revision flag.
- Operator reported the full factory → supervisor → admin → publish UAT passed.
- GitHub main **Staging candidate** file: `worker-patches/staging-worker-category-changes-REVIEW.js`, blob SHA `9d673ab1f8616b87ebcbf8a96f0c210d74492316`, approximately 6,082 lines, includes Phase 3. Operator's deployment is **not** an independently observed Cloudflare version hash.

## GitHub state on review date

- Repository: `mingzuoxiao-netizen/PZ-website`.
- PR #28 (Phase 3) merged on 2026-11-05T19:10:11Z.
- A PR merged into `main` **does not** automatically update active Workers or migrate Production D1.
- The exported Production code and current Production candidate are **not interchangeable**.

## Required process for every subsequent review

Update this ledger with:

1. Review date, **environment** and exact Worker name.
2. Deployed Cloudflare version/deployment ID **if independently observable**; otherwise write `unverified`.
3. A user-supplied export's SHA-256, length and source identity; its differences from the GitHub candidate.
4. Visible variables and binding names/targets, distinguishing screenshots from confirmed IDs; never record secret values.
5. D1 migration versions, feature-flag state, test evidence, and explicit **not deployed / staging only / production active** status.
6. Outstanding incompatibilities and deployment blockers, especially data preservation and review/approval guards.

**Never overwrite an older snapshot with unsupported assumptions.** Append a dated observation or make a versioned change with GitHub history. Production remains immutable unless the user explicitly directs a reviewed cutover.
