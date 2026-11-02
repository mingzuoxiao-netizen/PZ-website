# PZ V2 Phase 1 — Organization RBAC staging release gate

**REVIEW ONLY. No production D1/R2/KV writes. No automatic deployment.**
Working branch: feature/pz-v2-organization-rbac; Draft PR #21.

## Preconditions
- Verify live Worker source, database migration history and separate staging credentials / D1 / R2 / KV.
- Staging users table must have id, username, password_hash, role, is_active, org_id, created_at.
- Verify audit_logs migration 008 was applied. Capture a recovery snapshot.
- Keep legacy users.role values admin/factory: supervisor is computed from staff assignments.
- DO NOT enable PZ_ORG_RBAC_ENABLED before migration 009 and legacy account mapping.

## Apply on staging only
1. Apply migrations/009_department_accounts_REVIEW.sql to isolated Staging D1.
2. Verify pz_departments and pz_staff_assignments tables, indexes and constraints.
3. Deploy the staging review Worker with PZ_RUNTIME_ENV=staging, keeping separate bindings.
4. Set PZ_ORG_RBAC_ENABLED=true on Staging only.
5. Point Pages Preview to Staging Worker, not to production.

## Manual role and data tests
1. Legacy admin logs in and creates a department, supervisor and secretary.
2. Supervisor logs in at #/creator/supervisor and sees only own team.
3. Supervisor can create secretary/staff/data-entry accounts, disable them or reset passwords.
4. Supervisor cannot create supervisor/admin or change another supervisor's account (403).
5. Admin can assign an existing factory account to an active supervisor without changing account ID.
6. Unassigned staff cannot use managed product endpoints when feature is enabled.
7. Assigned staff may only list, edit and submit their own products; other product ID returns 403.
8. Unknown roles must not fall back to FACTORY; audit event contains actor and action but no password.
9. Verify existing public catalog, site configuration, image, category and inquiry endpoints.

## Automated checks
- npm run typecheck
- npm test
- node --test worker-patches/organizationAccessCore.test.mjs
- node --check worker-patches/staging-worker-category-changes-REVIEW.js
- node --check worker-patches/production-worker-category-governance-REVIEW.js
- Existing GitHub Actions QA and Pages Functions build

## Rollback and next stage
- Disable feature flag only after confirming managed accounts fail closed (no legacy FACTORY escalation).
- Do not delete 009 tables / audit records to undo a deployment.
- Production requires separate approval and verification of live Worker source/bindings.
- Stage 2 will add supervisor first review, admin final review, admin returns to supervisor, and immutable snapshots.