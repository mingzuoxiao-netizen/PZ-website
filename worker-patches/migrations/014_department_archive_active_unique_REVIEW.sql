-- PZ department archive — apply once on the verified D1 before deploying the updated Worker.
-- Preserve archived departments and their IDs for products, approvals and immutable audit history.
-- Allow administrators to recreate a department with the same name after archival.
-- Requires migration 009_department_accounts_REVIEW.sql.
CREATE UNIQUE INDEX IF NOT EXISTS idx_pz_departments_active_name
  ON pz_departments(lower(name)) WHERE is_active=1;
DROP INDEX IF EXISTS idx_pz_departments_name;
