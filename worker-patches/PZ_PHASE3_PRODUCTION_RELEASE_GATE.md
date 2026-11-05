# PZ Phase 3 — Production migration 012 release gate

**Status: review candidate / NOT deployed.** This is an operator runbook, not permission to execute production SQL.

## Evidence checked (2026-11-05)

- Operator screenshot: Production Worker `pz-inquiry-api`, `PZ_RUNTIME_ENV=production`, `PZ_ORG_RBAC_ENABLED=true` and `PZ_TWO_STAGE_REVIEW_ENABLED=true`. `PZ_PRODUCT_REVISIONS_ENABLED` was not visible and must stay unset/false throughout database preparation.
- Production D1 UI identifies database **name `1`**, UUID `b263701b-012b-4d3b-b24d-d250b4e582f9`. Reconfirm the **actual Worker's D1 DB binding UUID**, not only the database's friendly name, immediately before applying SQL.
- Operator's read-only D1 `sqlite_master` screenshot confirms `users`, `products`, `pz_departments`, `pz_staff_assignments`, and the Phase 2 `pz_product_reviews`, `pz_product_review_versions`, `pz_product_review_events` tables. Third-phase revision tables were absent.
- Operator reports the 18 Phase 3 required `products` columns are all present (zero missing-column rows). Full `products` schema/constraints and live FK integrity were not independently retrieved.
- Read-only `sqlite_master.sql` output confirms users/department/staff-assignment PKs, roles, FK targets and supervisor constraints.
- Staging migration 012, Worker and end-to-end two-stage revision flow passed operator UAT. The repository Production Worker **candidate** differs from a user-uploaded earlier Production code export. A GitHub merge does not deploy an active Worker.

## Candidate and tests

- **Candidate SQL:** `migrations/012_published_product_revisions_PRODUCTION_REVIEW.sql` — new tables, indexes and triggers only.
- Executable SQL is identical to tested `012_published_product_revisions_STAGING_REVIEW.sql`. The only changes are the cautionary Production header.
- Test `test_published_revision_production_migration.py` recreates the observed Product/Org/Approval schema **in-memory** and checks DDL parity, no data mutation, FK protections, immutable history, unique active revision and stale published-product guards.
- No D1 migration is automatically run by GitHub CI or merging this PR. No Production env or Worker setting is changed.

## Latest preflight result (2026-11-05 operator screenshot)

- Production D1 Console `PRAGMA quick_check;` returned **`ok`**.
- `PRAGMA foreign_key_check;` completed without displayed violation rows.
- `PRAGMA integrity_check;` was blocked by `SQLITE_AUTH`; do not reattempt it in D1.
- Original Production D1 remains untouched. These checks do not imply permission to run Migration 012.
- Per Cloudflare D1 documentation, Time Travel is automatic for supported databases, and a bookmark can be retrieved for a recovery point. **Do not click Restore to create a backup:** Restore overwrites the target database and could destroy unrelated Production changes.

## Mandatory before an authorized Production deployment

1. **Bind identity:** read the actual live Production Worker's D1 binding, verify database UUID exactly `b263701b-012b-4d3b-b24d-d250b4e582f9`, and verify separate Production R2/KV bindings.
2. **Read-only verification:** inspect Product `sqlite_master.sql`, `PRAGMA table_info(products)`, `PRAGMA foreign_key_check`, and Cloudflare-D1-supported `PRAGMA quick_check`. (`PRAGMA integrity_check` is rejected by D1 with `SQLITE_AUTH`; do not retry it.) Verify prerequisites and that no `pz_published_*revision*` tables or partially installed triggers remain. Any partial prior install is a STOP.
3. **Recovery point:** document the D1 Time Travel recovery timestamp/bookmark plus current active Worker deployment version. Record published product counts and a safe read-only product snapshot; don't expose secrets.
4. **Approval:** operator explicitly approves the Production D1 migration. The SQL must not be executed simply because the GitHub PR merged or CI passed.
5. **Schema migration only:** execute the **complete** reviewed Production 012 SQL in the confirmed Production D1 console. Leave `PZ_PRODUCT_REVISIONS_ENABLED` unset/false; do not change old product statuses or rows. If any query fails, stop and inspect; don't blindly retry partial SQL.
6. **Post-schema read-only checks:** inspect sqlite_master for 3 tables, 6 indexes and 6 triggers, confirm new tables are empty, and check `PRAGMA foreign_key_check`; verify existing users, products, review records, site config and public API are still intact. Preserve the recovery point.
7. **Separate code release:** compare uploaded **active Production Worker** code against the exact GitHub candidate with versioned deployment diffs. Resolve all code differences, feature gating, image storage and runtime-specific endpoints before a reviewed Worker deployment.
8. **Flag OFF smoke:** deploy the reviewed Worker with revision flag still off. Verify login, original two-stage new-product approval, admin workflows, categories, inquiries, images, and public products. Read-only checks alone cannot replace staging parity.
9. **Controlled activation:** only with explicit go/no-go, set `PZ_PRODUCT_REVISIONS_ENABLED=true` in Production after checking runtime isolation. Use a preselected, eligible test product. The Phase 3 workflow allows only the **original assigned uploading staff** to initiate edits.
10. **Business acceptance:** verify draft → supervisor → admin → explicit publication, failed/returned path, original product stays published until final release, exact SKU/ID preservation, and no private details or prices leak to public catalog.

## Rollback and failure distinctions

- Before any Phase 3 publication, turn OFF `PZ_PRODUCT_REVISIONS_ENABLED` to stop new revision routes. Restore prior Worker deployment version if a code regression occurs.
- After a new revision has been explicitly published, **disabling the flag will not restore the previous product data**. Restore/repair only through an audited product-specific recovery plan; do not casually Time Travel the entire Production D1 because it might roll back unrelated legitimate changes.
- If D1 product publication succeeded but KV catalog refresh failed, keep the published revision state and use the reviewed **catalog refresh retry**, never reapply product edits directly.
- Do not reset JWT secrets, change R2/KV bindings, overwrite Production Worker with a Staging bundle, or use a Staging database UUID in Production.
- Any row-level inconsistency, schema drift, unknown deployment hash, or lost audit data: **STOP and inspect**. Protect existing approved customer-facing data.

## D1 command compatibility note (2026-11-05)

- Production D1 operator received `not authorized: SQLITE_AUTH` for `PRAGMA integrity_check;`. This denotes a D1 unsupported/unauthorized SQL pragma, **not evidence of database corruption**.
- Use officially documented `PRAGMA quick_check;` and `PRAGMA foreign_key_check;` in D1 Console. `quick_check` is a lighter integrity check, **not equivalent to full** `integrity_check`.
- Record the result before applying the Production migration; don't equate an unsupported-command error with a failed integrity test.
- Reference: https://developers.cloudflare.com/d1/sql-api/sql-statements/

## Verification queries (read-only)

```sql
SELECT type,name FROM sqlite_master
WHERE name LIKE 'pz_published_%' OR name LIKE 'idx_pz_published_%'
   OR name LIKE 'pz_pub_revision_%'
ORDER BY type,name;
```

```sql
SELECT 'revisions' kind, count(*) n FROM pz_published_product_revisions
UNION ALL SELECT 'versions',count(*) FROM pz_published_revision_versions
UNION ALL SELECT 'events',count(*) FROM pz_published_revision_events;
```

```sql
PRAGMA foreign_key_check;
```

```sql
PRAGMA quick_check;
```

> The last two queries are **post-migration only**, because the tables do not exist before 012. Never run a write in a preflight query.
