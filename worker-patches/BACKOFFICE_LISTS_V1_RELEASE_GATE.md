# Backoffice lists v1 — first UX migration stage

This stage prepares complete, scoped list reads before the Admin, Supervisor and
Factory interface changes. It does not activate new screens, change permissions,
approve products, publish content or apply a remote D1 migration.

## Problem

Legacy product/revision queues read the latest 300 historical records and filter
actionable items in the browser. An older pending item can disappear behind newer
completed history. Factory inventory similarly loads at most 500 products without
full-catalog search or pagination metadata. Raising these limits does not solve
the problem.

## Opt-in contract

The two current copy-ready candidates embed `backofficeListsCore.mjs` exactly:

- `production-worker-admin-delete-v2-COPY.js`
- `staging-worker-category-changes-REVIEW.js`

Only GET requests containing `list_version=1` use the new implementation:

| Endpoint | Server-enforced scope | Default status |
| --- | --- | --- |
| `/admin/reviews`, `/admin/revisions` | Admin | pending_admin, approved_pending_publish |
| `/admin/release-queue` | Admin; globally paged union of product and revision requests | pending_admin, approved_pending_publish |
| `/supervisor/reviews`, `/supervisor/revisions` | Current supervisor ID and active department | pending_supervisor, returned_to_supervisor |
| `/supervisor/release-queue` | Same supervisor and current department; unified product/revision queue | pending_supervisor, returned_to_supervisor |
| `/factory/revisions` | Original revision submitter and active staff assignment | Active revision states only |
| `/factory/products` | Current product creator and active staff assignment; existing Admin access retained | all |

Every request continues through normal authentication. Runtime isolation and
existing organization/review/revision feature flags remain required. Caller
filters narrow these scopes; they never grant access to another department.

Parameters:

- `page`: 1–100000, default 1; `page_size`: 1–100, default 50.
- `q`: at most 120 characters; SKU, English name and Chinese name are searched
  over the complete permitted scope. Exact SKU matches rank before substrings.
- `category`: exact category ID.
- `categories`: optional JSON array of at most 50 exact stored category values,
  mutually exclusive with `category`. This preserves legacy category aliases and
  uncategorized views without filtering only the current page.
- `status`: a specific allowed state or `action`; products additionally allow
  `all`. Work queues intentionally do not become historical audit exports.
- Review/revision queues: `department`, `supervisor`, `submitter` exact IDs.
- Unified Admin release queue: optional `kind=product` or `kind=revision`.
- Products: `site` is zhaoqing, cambodia or unassigned.
- Products also accept `status=waiting` for in-flight review/publication. A
  supervisor may explicitly read returned_to_uploader, pending_admin or
  approved_pending_publish to track progress; no write permission changes.
- `sort`: newest (default) or oldest, with ID as the stable tie-breaker.

Example: `/supervisor/reviews?list_version=1&page=1&page_size=50&q=PZ-001&sort=oldest`.

Envelope: `{list_version:1, items, total, page, page_size, has_more}`. Products
also return a `products` alias plus `status_counts` and `category_counts` for the
complete owner scope, independent of current search/status/category filters.
These facets must be labeled as owner-scope counts, not search-result counts.
Product images/sites/specifications are normalized without exposing arbitrary
product columns. Page and matching total are read in the same D1 batch.
When two-stage review is enabled, owned product rows include their own latest
review return reason, so correction tasks can show concrete instructions.

Failures return an error, not zero counts. The typed client in
`utils/backofficeLists.ts` requires the versioned envelope and internally
consistent page metadata. It never silently treats legacy truncated data as a
complete result. Legacy GETs and all mutations keep their existing handlers.

## Rollout sequence

1. Verify the current Staging Worker baseline and existing migrations/flags.
2. Deploy the Staging candidate, retaining the preceding Worker version.
3. Run authenticated, read-only list checks with seeded test data and all three
   roles. Confirm matching counts, older pending items, deep pages, search and
   cross-department denial.
4. Optional: review/apply `017_backoffice_list_indexes_REVIEW.sql` in Staging.
   It creates indexes only, requires the existing review/revision schemas and
   is not necessary for correctness. Evaluate real query plans/latency before
   claiming indexed substring-search performance.
5. Connect Admin first, then Supervisor, then Factory screens to the typed
   contract in subsequent UX changes. Each screen must have bounded rendering,
   explicit page selection and loading/error states. Do not switch only one
   service while shipping a frontend that assumes both are already upgraded.
6. After Staging verification, arrange Production Worker/client rollout with
   explicit version records. Nothing in this PR automatically deploys Workers.

The existing screens are deliberately unchanged in this foundation PR. Thus this
PR alone does not remove their old loading limits; it supplies the tested
contract needed for the next role-specific UI stages.

## Verification

Automated in-memory SQLite checks cover an older pending item after 350 newer
completed records, both review collections, 10,005 owned SKU, deep pagination,
full-scope Chinese/SKU search, deterministic ties, total/facet consistency,
ownership/current department isolation, invalid filters, flags/runtime gates,
failed database reads, legacy delegation, optional indexes and exact embedding
in both standalone Worker candidates. Client tests reject legacy or inconsistent
metadata and require explicit failure instead of an incorrect empty count.

Pagination is offset-based. The total and rows in one response share a snapshot,
but different pages are not one frozen session. Concurrent updates can move
records between pages; refresh before writes and preserve existing per-record
version/state guards. A future frozen cross-page batch requires its own server
contract rather than collecting whatever happens to be visible in the browser.

## Rollback

Stop new frontend use before restoring an older Worker. Otherwise the strict
client will correctly show the unsupported-service error. The optional indexes
need not be removed for rollback. This change does not alter existing product,
approval or revision records.
