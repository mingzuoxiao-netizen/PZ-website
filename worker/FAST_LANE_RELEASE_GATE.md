# Task 13 — Trusted-operator fast lane release gate

Status: **Draft / staging validation required. Never enable this feature by merging a PR.**

## Policy

The fast lane is an explicit exception to the default two-stage product review:
operator submits → Supervisor approves → **published without Admin pre-approval**.
Only low-risk, already familiar product categories qualify. An Admin gains an independent
**post-publish sampling** queue, with an audited, reasoned unpublish action.

All non-qualifying new products, and **all published-product revisions**, retain
Supervisor → Admin → publish.

Eligibility is re-evaluated by the Worker at the moment the assigned Supervisor approves:
- Worker `PZ_FAST_LANE_ENABLED` equals the string `true` (emergency kill switch).
- D1 `pz_fast_lane_settings.enabled=1` (Admin can immediately turn this off).
- Admin explicitly set `pz_fast_lane_trust.trusted=1` for an active staff/secretary/data-entry account.
- At least 10 **distinct reviewed, published product reviews with no return event**. If existing
  published products have no review history AND the audited sample is fewer than 10, the rule uses
  the task-list's **history-insufficient fallback: Admin trusted flag only**. Such publications
  carry `history_fallback=true` in the immutable audit event. A new account with zero publication
  history does **not** qualify by being granted trust.
- The operator previously published at least one different product in this category.
- The submission and current D1 product have no verification[] records and no evidence-bearing
  attributes such as tested_load, shelf_load, certification, lab results or safety claims.
- The submitted/current record passes the existing product readiness gates.

The count uses **all-history no-return** as a conservative interpretation of the task's
"published without a return in the last step." This is stricter than allowing older returned
products to count.

## DB and application changes

Apply `worker-patches/migrations/018_trusted_operator_fast_lane_REVIEW.sql` to an **isolated
Staging D1 only**, after the base two-stage review schema exists. It creates:
`pz_fast_lane_settings`, `pz_fast_lane_trust`, `pz_fast_lane_publications`,
and immutable `pz_fast_lane_events`; it also recreates the D1 review transition trigger,
preserving all original edges and permitting exactly the matching sampled fast-publish edge.
The migration inserts `enabled=0`, never enables it.

The Worker writes the review status, product status, fast-sampling row and both review
and lane audit rows in one D1 transaction. The subsequent public catalog KV update cannot
be in the same transaction: the response distinguishes a completed D1 publish from an
unfinished catalog sync with `catalog_published:false`, code `CATALOG_SYNC_PENDING`.
Admins can use the sampling queue's **重试目录同步** action. Do not re-approve to retry KV.

The default Admin catalog unpublish/relist routes refuse sampled fast-lane items: Admin must
use the sampling queue to enter a reason, and a sampled-unpublished item must not be directly
relisted without a newly reviewed revision. Two **distinct** sample unpublishes on one operator
automatically revoke the Admin trust flag, with a permanent audit event.

## Activation / acceptance procedure

1. Verify task 10 deployment controls and Staging/Production D1, KV and R2 independence.
2. Confirm PR #61 (preflight) and PR #62 (field returns) have been merged and staging-tested.
3. Record active Staging Worker version and backup the Staging D1. Run migration 018 once
   against **Staging** with `PZ_FAST_LANE_ENABLED` unset/false; inspect tables and trigger.
4. Deploy this PR to Staging, still with `PZ_FAST_LANE_ENABLED=false`.
   Check the unchanged two-stage workflow (new product, high-risk claim, returned revision).
5. Enable the Worker environment variable to `true` **only in Staging**, and ensure D1
   setting is still disabled until Admin deliberately enables it in 审核中心 → 发布后抽检.
6. With a staging test operator: Admin grants trust, verify at least 10 clean published
   reviews (or the documented legacy-history fallback) and prior category history.
   Supervisor approves a fresh ordinary item; verify that both D1 and the public catalog
   show published and the sampling queue contains `lane=fast` audit.
7. Submit a product with verification[], tested_load or shelf_load: Supervisor approval
   must still send it to Admin. Repeat with an untrusted operator and a never-published
   category. Verify a prior published-product revision also uses both stages.
8. Admin accepts one sample; subsequently unpublish with reason. Unpublish another
   distinct fast-lane sample and confirm automatic trust revocation and audit actor/time.
9. Disable Admin switch: the next Supervisor approval must go via Admin. Disable Worker
   env switch: it must remain two-stage even if D1 setting accidentally says enabled.
10. Simulate a Staging KV outage; verify `CATALOG_SYNC_PENDING`, post-publish queue sync
    indicator, Admin retry action and no repeated D1 publication/audit row.
11. Only after Staging acceptance may a separate, protected Production release be
    considered. Apply Production D1 migration before Worker deployment, but **leave
    both kill switches off**. GitHub Environment Required reviewers remain mandatory.

## Rollback and fail-safe

- Fast lane emergency stop: set Worker `PZ_FAST_LANE_ENABLED=false` or Admin setting
  `enabled=0`. Effective at the next Supervisor approval. Existing published catalog
  items remain published; Admin may sample/unpublish them individually.
- Reverting Worker code alone does **not** restore the previous DB transition trigger.
  The migration's state-edge extension only permits a pending review to go directly
  published if a matching `pz_fast_lane_publications` row exists; do not remove its
  constraints or trust existing records without inspection.
- Do not drop the new tables while reviews or audit events refer to them. Restore the
  old transition trigger from migration 010 only via a separately reviewed rollback
  migration after disabling fast lane and reconciling fast-lane records.
- If the public KV write fails, use the Admin **sync-catalog** action, not a second
  publication or a direct Admin catalog mutation. D1 already committed.
- No real API tokens, D1 database IDs, Worker secrets or production settings are
  included in this PR. The rollout and migration are intentionally manual/reviewed.

## Limitations

- Legacy history-insufficient fallback must be visible to the reviewer via audit
  metadata; it is a policy exception required by the task list, not evidence of 10
  clean reviewed publishes.
- Task 14 notifications (operator/supervisor alerts on fast publication or sampled
  unpublish) are **not implemented here** and must be added in a separate PR.
- A later, separate review can consider additional rate limits and stricter trusted
  history policies; do not weaken these gates in the initial release.
