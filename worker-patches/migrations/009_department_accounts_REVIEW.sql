-- PZ V2 phase 1: additive, REVIEW ONLY. Apply to isolated Staging D1 first.
-- Keep legacy users.role ('admin'/'factory') unchanged for compatibility.
CREATE TABLE IF NOT EXISTS pz_departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  factory_site TEXT NOT NULL CHECK (factory_site IN ('zhaoqing','kandal','shared')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pz_departments_name ON pz_departments(lower(name));

CREATE TABLE IF NOT EXISTS pz_staff_assignments (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
  department_id TEXT NOT NULL REFERENCES pz_departments(id),
  supervisor_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  job_type TEXT NOT NULL CHECK (job_type IN ('supervisor','secretary','staff','data_entry')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK ((job_type = 'supervisor' AND supervisor_id IS NULL)
      OR (job_type <> 'supervisor' AND supervisor_id IS NOT NULL)),
  CHECK (supervisor_id IS NULL OR supervisor_id <> user_id)
);
CREATE INDEX IF NOT EXISTS idx_pz_staff_by_supervisor ON pz_staff_assignments(supervisor_id,department_id);
CREATE INDEX IF NOT EXISTS idx_pz_staff_by_department ON pz_staff_assignments(department_id,job_type);
-- No automatic seeding: existing factory users remain unassigned until the admin maps them.
-- A managed-account feature flag is required to activate the new routes/role flow.
