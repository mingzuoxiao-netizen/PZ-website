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
- **2026-11-05 follow-up:** operator confirms that `PRAGMA table_info(products)` shows `id`, `status`, `updated_at`, `created_by`, and `specs_json` present. This is **user-reported**, not independently inspected SQL output. Column presence does **not** certify the entire migration 011 or its constraints.
- **2026-11-05 final required-column gate:** operator confirmed a read-only `WITH required(column_name) ... SELECT ... missing_column` query returned **zero rows** for all 18 fields required by Phase 3. This is user-reported pass; full `products` CREATE TABLE SQL, constraints and database FK check have not yet been independently inspected. The Production-specific 012 review candidate is tracked in PR #30; **not applied**.
- Next preflight: inspect schema compatibility for `users`, `pz_departments`, `pz_staff_assignments`, and published product review paths before drafting a **Production-specific** Phase 3 migration 012; the repository file named `012_published_product_revisions_STAGING_REVIEW.sql` is Staging-review only.
- No Production write, D1 migration, flag activation, or Worker deployment was done in this inventory check.

### Production D1 organization schema preflight (operator Console screenshot: 2026-11-05)

- Read-only `SELECT name, sql FROM sqlite_master WHERE type='table' AND name IN ('users','pz_departments','pz_staff_assignments')` returned all three CREATE TABLE statements.
- `users` has `id TEXT PRIMARY KEY`, `org_id`, `username`, `password_hash`, `role`, `is_active`, `created_at`, `last_login_at`; `org_id` references `organizations(id)`.
- `pz_departments` has `id TEXT PRIMARY KEY`, `name`, `factory_site` (restricted to `zhaoqing`, `kandal`, `shared`), `is_active`, `created_by` and `created_at`.
- `pz_staff_assignments` has `user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT`, `department_id TEXT NOT NULL REFERENCES pz_departments(id)`, `supervisor_id REFERENCES users(id) ON DELETE RESTRICT`, `job_type` restricted to supervisor/secretary/staff/data_entry, creator/timestamp fields and supervisor/self-reference constraints.
- **Assessment:** the three foreign key target tables and columns for migration 012 exist and align with the proposed revision workflow. This is a **schema shape check only**: it does not establish that all live assignments are valid or that the full products column set is complete.
- **Production remains unchanged.** Next: confirm all Phase 3 products columns with a read-only missing-columns query; perform a Production-specific 012 rehearsal and recovery-point approval prior to any live migration.

### Production D1 compatibility finding (2026-11-05)

- The operator executed `PRAGMA integrity_check;` against Production D1 `1`, and the console returned **`not authorized: SQLITE_AUTH`**. This is an unsupported/blocked PRAGMA in Cloudflare D1, **not evidence of actual data corruption**.
- Cloudflare's supported commands include `PRAGMA quick_check;` and `PRAGMA foreign_key_check;`. The operator was instructed to run these read-only checks; their results are **not yet confirmed**.
- Documentation for the Production 012 gate was corrected in PR #30 to avoid repeating the unsupported check.
- This observation made **no change** to Production data or Worker configuration.

### Production D1 supported integrity checks (operator screenshot: 2026-11-05)

- `PRAGMA quick_check;` returned a single `ok` value, indicating that D1's supported quick consistency check passed.
- `PRAGMA foreign_key_check;` completed and showed no violation rows in the Console screenshot.
- Earlier `PRAGMA integrity_check;` returned `SQLITE_AUTH` because D1 does not authorize that statement; it was replaced with the supported quick check.
- These checks are evidence of current integrity, **not** proof that a schema migration is already applied or that the deployed Worker matches GitHub.
- **Production migration 012 has NOT been executed**. PR #30 is a Draft SQL candidate.
- Official D1 Time Travel is automatic for supported D1 databases; before a write, record a current bookmark or UTC timestamp and a read-only baseline, rather than triggering an unneeded restore. Never use **Restore** as a backup step because it overwrites live data.

### Production D1 Time Travel access (operator confirmation: 2026-11-05)

- Operator reports that the Production D1 Time Travel page is accessible and recovery history can be viewed.
- This confirms **UI visibility only**; no specific restore bookmark/timestamp, retention limit, successful restore, or verified restore plan has been provided.
- No restore was initiated. Before Migration 012, record the exact recovery timestamp or bookmark and active Production Worker deployment version, reconfirm database UUID and operator go/no-go.
- Production schema 012 remains **not applied**.

### Production Worker active deployment (operator Deployments screenshot: 2026-11-05)

- Worker: `pz-inquiry-api`. Cloudflare active deployment **version ID prefix `e7e47e18`**, marked **Manually deployed**, receiving **100%** of traffic, with deployment history showing **Ready**. Screenshot showed **0%** error rate, **2.65 ms** median CPU and a relative deployment age of approximately **14 hours** (all metrics are a screenshot-time observation, not ongoing guarantees).
- This is a **short displayed version ID**, not the full Cloudflare deployment ID and not a Git commit SHA or a source checksum.
- The active deployment **source code has not been compared line-by-line** with the uploaded Production export or the GitHub Production candidate. The uploaded export was explicitly labeled `REVIEW CANDIDATE; NOT DEPLOYED`; do not assume it represents `e7e47e18`.
- Before deploying the Phase 3 Worker: inspect/download the active `e7e47e18` version source or verified version metadata, compare to the repo's Production candidate, record source checksum and any differences, and preserve the exact prior version as the rollback target.
- No Production database or Worker mutation occurred in this check.

### Active Production editor export fingerprint and exact GitHub lineage (operator file: 2026-11-05 19:46)

- New file: `粘贴的文本 (1)(20261105-194602).txt`, supplied after viewing Production Worker Deployments and opening **Edit code**. Source-to-deployment link is **operator-provided**, not independently attested by Cloudflare version metadata.
- File length **228,497 bytes**, **5,944 lines**, Windows CRLF; SHA-256 `2a47829b726e03347b30d32231fd51600f527f745c41a77c1bb333a03754582f`. Its bytes exactly match the earlier export `粘贴的文本 (1)(20261105-191918).txt`.
- After converting CRLF to LF and adding a final newline, its Git blob SHA is **`ca4572b1139e9ec350144b0b8e78ab1919b6bd82`**, exactly matching `worker-patches/production-worker-category-governance-REVIEW.js` at historical commit **`4267d98f9a04`** (2026-11-02). The final newline and line-ending conversion are formatting differences; the code body matches that historical revision.
- Current `main` Production **candidate** Git blob: `be546392e96842d78a71d5988b484dbb6e761834`, about **6,470 lines**. GitHub compare `4267d98f9a04...main` reports **538 additions, 13 deletions** in the Worker candidate.
- Functional differences include **internal product `specs_json` reads/writes and validation, ADMIN guarded draft permission alignment, and Phase 3 published-product revision routes**. Old export lacks `pzValidateTechnicalSpecs`, `pzPublishedProductRevisionsFetch` and `PZ_PRODUCT_REVISIONS_ENABLED`. The new candidate contains them; Phase 3 is opt-in and must remain OFF until independently authorized.
- The upload's top comments read `REVIEW CANDIDATE; NOT DEPLOYED` even though the operator says it was copied from active Worker Edit code. This comment is **stale/inconclusive** relative to what Cloudflare may be running. Do not infer deployed state solely from it.
- The active Cloudflare Deployment page independently showed version **`e7e47e18`** with 100% traffic. Without a verified full Cloudflare deployed-source checksum/version API this remains an **operator-linked** source snapshot, not independently proven cryptographic linkage to that version.
- The source code export passes **`node --check`** after a temporary `.js` extension; no live Production runtime or API write test was performed.
- **Production still not modified.** Record exact current Worker version and a recoverable D1 bookmark/time before any authorized migration or Worker cutover. Never deploy the GitHub candidate solely because it is `main`.

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

## Production Phase 3 deployment checkpoint — 2026-11-05

**Evidence:** operator-provided Cloudflare `pz-inquiry-api` Worker Deployments screenshot, 2026-11-05. This section is an append-only observation. Do not mistake a variable-configuration deployment for proof of its value or for a Git source checksum.

| Observation | Value | Confidence |
| --- | --- | --- |
| Active deployment/version prefix | `e526d60b` | Visible on Worker Deployments screenshot |
| Most recent rollout entry | `e526d60b` — `Add variable: PZ_PRODUCT_REVISIONS_ENABLED` | Screenshot |
| Earlier new code deployment | `01d3ab2a` — `Manually deployed` | Screenshot |
| Previously known Worker version | `e7e47e18` — `Manually deployed` | Screenshot, historical rollback reference |
| Health information | New rollout marked Ready; screenshot showed 0 req/sec, 0% error and 0 ms median CPU (no meaningful observed request volume) | Screenshot-time only |
| Traffic allocation | Screenshot shows a 0%-to-100% bar; **do not interpret its scale endpoints as confirmed per-version traffic allocation** | Not independently verified |
| Revision feature flag | `PZ_PRODUCT_REVISIONS_ENABLED` **added**, actual value **not visible** | Screenshot |
| Runtime, bindings | Previously observed Production `PZ_RUNTIME_ENV=production`, D1 `DB` name `1`, UUID `b263701b-012b-4d3b-b24d-d250b4e582f9`, R2 `pz-product-images`, Production KV | Historical screenshot; recheck if changed |
| Production Migration 012 | Operator reported 3 tables, 6 indexes, 6 triggers; post-check `revision_count=0`, `quick_check=ok`, no FK violations | Screenshot + operator confirmation |
| Old features | Operator reported normal after Worker code cutover | Operator confirmation |
| End-to-end Production revision UAT | **Not yet verified** | Pending |

**Next action:** Verify in the active **Production Worker** Settings that `PZ_PRODUCT_REVISIONS_ENABLED` is `true`, `PZ_RUNTIME_ENV=production`, and DB/R2/KV bindings still point to Production. Only then run an explicit, controlled revision UAT using a designated eligible published test product. Do not silently edit actual customer product data or interpret the presence of the variable alone as feature activation.

No Cloudflare environment, source code, secrets or database values were changed while recording this checkpoint.

## Required process for every subsequent review

Update this ledger with:

1. Review date, **environment** and exact Worker name.
2. Deployed Cloudflare version/deployment ID **if independently observable**; otherwise write `unverified`.
3. A user-supplied export's SHA-256, length and source identity; its differences from the GitHub candidate.
4. Visible variables and binding names/targets, distinguishing screenshots from confirmed IDs; never record secret values.
5. D1 migration versions, feature-flag state, test evidence, and explicit **not deployed / staging only / production active** status.
6. Outstanding incompatibilities and deployment blockers, especially data preservation and review/approval guards.

**Never overwrite an older snapshot with unsupported assumptions.** Append a dated observation or make a versioned change with GitHub history. Production remains immutable unless the user explicitly directs a reviewed cutover.
