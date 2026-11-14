# Supervisor UX — stage C

Depends on stages A and B. This change does not widen approval, publication or
account permissions.

- New products and published-product revisions share one scoped, paged queue.
- Search/filter by SKU/name, submitting employee and request type. Separate
  actionable states from read-only waiting-for-employee/Admin/publication views.
- Supervisor first submissions now open in a six-field review summary with up
  to four clickable image thumbnails; complete product content is available via
  **查看完整资料**, not lost. Admin's full first-submission presentation is unchanged.
- Later submissions and revisions show **previous snapshot → latest snapshot**
  for changed public fields, instead of always comparing to V1. The supervisor
  summary still highlights material, dimensions, category, site, finish and
  images; internal specs, all versions and audit history remain optional.
- The summary reuses the existing shared `preflightProduct` rules used by the
  employee editor and Worker, and visibly lists hard issues, warnings and
  operator-confirmed warnings. This read-only recheck never automatically
  approves a product or changes backend permissions. Historical records with
  missing fields may show advisory warnings; they remain manually reviewable.
- Successful handoff opens the next actionable record. Returns still need a
  concrete reason; common explanation shortcuts only fill text, never submit it.
- Admin retains the master/detail layout and mobile return-to-list behavior.
- Team management adds account-name and enabled/disabled filters while retaining
  the existing department-scoped account lifecycle.

Automated workflow coverage verifies V1 visibility, product-to-revision advance,
correct action endpoints, and the absence of approval actions in waiting views.
Perform real three-role Staging handoff/return checks before release.

## Stage C.1 — lightweight supervisor triage (2026-11-13)

- Default new-product inspection is a compact summary, not 12 expanded fields.
- **前往审核操作 ↓** scrolls to and focuses the unchanged approval/return
  controls via a button. It must not use `href="#supervisor-review-actions"`:
  this app uses `HashRouter`, so a hash-only link replaces the route and can
  show a blank page. Regression coverage exercises the no-navigation shortcut.
- **查看完整资料** expands full new-product detail; a supervisor may collapse it
  again. Admin approval/publishing flow and endpoint authorization are intact.
- Existing employee preflight already blocks hard errors on save-and-submit,
  with Worker enforcement also protecting list/batch submissions. This iteration
  surfaces its results to supervisors rather than duplicating the rules.
- No auto-approval, batch initial approval, schema migration, or Worker changes.
  Those are separate later phases with risk and permissions review.
- Verify first-new, revised product, recheck, legacy snapshot, return form and
  complete handoff in Staging before deploying Production.

## Stage C.2 — category-style review cards (2026-11-13)

- The **supervisor-only** product queue now uses one full-width card per request,
  consistent with the category-initial-review page: product cover thumbnail,
  image count, category, product name, SKU, uploader, version, request type and
  current status appear before any detail is opened. Missing images use an
  explicit placeholder instead of silently borrowing another product's image.
- The paged queue already includes product images as a JSON column; parse it
  locally and render one preview without making extra per-card detail calls.
  For published-product revisions the preview is labeled as **existing image**;
  the submitted revision's images must still be confirmed in expanded detail.
- **查看审核详情 · 展开核对** expands the selected request directly below its card;
  **收起审核详情** collapses it. The expanded content retains the six-field
  summary, full-detail toggle, version comparison, technical/audit disclosures,
  and the unchanged approve/return controls.
- Search, submitter/type/status filters, pagination, read-only waiting states,
  and automatic next-item handoff remain available.
- No new approval authority, automatic approval, backend/API mutation, or
  changes to the Admin two-column final-review layout.
- Verify the card layout with multiple requests and on mobile in Staging,
  including opening/closing one card, navigating between cards, recheck,
  return form and the next actionable request after approval.
