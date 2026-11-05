# PZ Phase 4 responsibility delegation — WITHDRAWN

Decision: **Do not deploy or enable the per-product responsibility delegation feature.** The operator prefers the simpler original-account rule.

## Effective product authorization

- **Factory employee:** may edit their own unpublished drafts and request corrections; once published, only the original uploading account (`products.created_by`) may initiate a new versioned revision.
- **Other factory employees:** cannot edit or request changes to that account's products, even if they are members of the same department.
- **Supervisor:** reviews requests from assigned employees; no right to directly rewrite or publish products.
- **Administrator:** final approval and explicit publish, plus account/department management; no individual product responsibility assignments are required.
- Product content remains protected by the existing Phase 2 and Phase 3 review/publish workflows. The original creator ID is preserved.

## Safe rollback of PR #34

- The dedicated product responsibility API and Chinese administrator assignment panel were removed from the code. Staging and Production Worker candidates, original revision logic, and CI are restored to their proven post-PR-#33 state.
- **Staging environment:** immediately set `PZ_PRODUCT_RESPONSIBILITY_ENABLED=false` (or remove it). Then deploy the reverted Staging Worker **only to Staging** after reviewing current active version, and confirm owner-only authorization. This migration is not a live deployment.
- **Production:** do not apply Migration 013 and do not turn on `PZ_PRODUCT_RESPONSIBILITY_ENABLED`. No Phase 4 Production Worker cutover is required. The original Phase 3 production code already enforces creator ownership.
- Pages frontend: merge the single rollback PR to remove the assignment UI. Verify Pages Preview and Production use their correct isolated backends before publishing.

## Why Migration 013 remains in the repository

The operator has already executed the additive `013_product_responsibility_STAGING_REVIEW.sql` on Staging D1. Those two tables and the related audit history must **not** be deleted automatically: this is a data-preservation decision, not a reason to keep the feature active. The original SQL scripts remain archived as a record of what was executed. They are **not approved for further deployment**.

A database cleanup, if ever needed, would require a separate inventory and evidence that no authorization/audit records are present. No cleanup is required for the owner-only workflow.

## Verification

- `node --test worker-patches/publishedProductRevisionsCore.test.mjs` — rejects revision creation by any factory user whose ID differs from `products.created_by`, including staff from other departments.
- `node --test worker-patches/productTwoStageReviewCore.test.mjs` — unapproved direct edits remain blocked; two-stage flow remains intact.
- `python worker-patches/test_published_revision_integration.py` — both assembled Worker bundles contain the original owner-only check and unchanged Phase 3 gates.
- **Production Worker is untouched until explicitly authorized.**

This document supersedes the Phase 4 enablement procedure previously present here; do not follow the old enablement instructions.
