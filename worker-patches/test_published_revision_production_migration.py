"""Production Phase 3 schema review gate. In-memory SQLite only. NEVER accesses Cloudflare."""
from pathlib import Path
import re
import sqlite3

root=Path(__file__).resolve().parent
stage=(root/"migrations/012_published_product_revisions_STAGING_REVIEW.sql").read_text(encoding="utf-8")
prod=(root/"migrations/012_published_product_revisions_PRODUCTION_REVIEW.sql").read_text(encoding="utf-8")
anchor="CREATE TABLE IF NOT EXISTS pz_published_product_revisions"
assert anchor in stage and anchor in prod
assert prod[prod.index(anchor):] == stage[stage.index(anchor):], "Production DDL has drifted from Staging"
assert "PRODUCTION SCHEMA REVIEW CANDIDATE. NOT EXECUTED." in prod
assert "leave feature disabled" in prod
assert not re.search(r"(?im)^\s*(?:ALTER\s+TABLE|UPDATE\s+\S+|DELETE\s+FROM|DROP\s+(?:TABLE|INDEX|TRIGGER)|INSERT\s+INTO)\b",prod), "Production migration must only create schema"

db=sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE organizations(id TEXT PRIMARY KEY);
CREATE TABLE users(
 id TEXT PRIMARY KEY,org_id TEXT NOT NULL,username TEXT NOT NULL UNIQUE,
 password_hash TEXT NOT NULL,role TEXT NOT NULL,is_active INTEGER NOT NULL,
 created_at TEXT NOT NULL,last_login_at TEXT,FOREIGN KEY(org_id) REFERENCES organizations(id)
);
CREATE TABLE products(
 id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,
 material TEXT,size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,
 images TEXT,production_sites TEXT,created_by TEXT,status TEXT,created_at TEXT,updated_at TEXT
);
CREATE TABLE audit_logs(
 id TEXT PRIMARY KEY,actor_id TEXT NOT NULL, action TEXT NOT NULL
);
INSERT INTO organizations VALUES('org-main');
INSERT INTO users VALUES
 ('admin','org-main','admin','hash','admin',1,'2026-11-05',NULL),
 ('lead','org-main','lead','hash','factory',1,'2026-11-05',NULL),
 ('worker','org-main','worker','hash','factory',1,'2026-11-05',NULL);
INSERT INTO products(id,name,name_cn,category,material,size,finish,code,
  description,images,production_sites,created_by,status,created_at,updated_at)
 VALUES('prod-1','Oak Table','橡木餐桌','tables','oak','180 cm','matte','PZ-TABLE-01',
  'Original approved record','["https://cdn.peng-zhan.com/uploads/old.webp"]',
  '["zhaoqing"]','worker','published','2026-11-03','2026-11-05T10:00:00Z');
INSERT INTO audit_logs VALUES('audit-1','admin','product.approved');
""")
db.executescript((root/"migrations/009_department_accounts_REVIEW.sql").read_text(encoding="utf-8"))
db.executescript((root/"migrations/010_two_stage_product_review_PRODUCTION_REVIEW.sql").read_text(encoding="utf-8"))
db.executescript((root/"migrations/011_structured_product_specifications_STAGING_REVIEW.sql").read_text(encoding="utf-8"))
db.executescript("""
INSERT INTO pz_departments (id,name,factory_site,is_active,created_by,created_at)
 VALUES('dept','Woodworking','zhaoqing',1,'admin','2026-11-05');
INSERT INTO pz_staff_assignments
 (user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at)
 VALUES
 ('lead','dept',NULL,'supervisor','admin','2026-11-05','2026-11-05'),
 ('worker','dept','lead','staff','admin','2026-11-05','2026-11-05');
""")
baseline_tables=["products","users","audit_logs","pz_departments","pz_staff_assignments",
                 "pz_product_reviews","pz_product_review_versions","pz_product_review_events"]
def rows(table):
    return list(db.execute(f"SELECT * FROM {table} ORDER BY 1"))
baseline={table:rows(table) for table in baseline_tables}
before_objects=set(db.execute("SELECT type,name FROM sqlite_master"))

db.executescript(prod)
expected_tables={"pz_published_product_revisions","pz_published_revision_versions","pz_published_revision_events"}
objects={name:kind for kind,name in db.execute("SELECT type,name FROM sqlite_master")}
for name in expected_tables: assert objects.get(name)=="table",name
for name in ("idx_pz_published_one_active_revision","idx_pz_published_revisions_supervisor",
             "idx_pz_published_revisions_admin","idx_pz_published_revisions_submitter",
             "idx_pz_published_revision_events","idx_pz_published_revision_event_once"):
    assert objects.get(name)=="index",name
for name in ("pz_pub_revision_versions_immutable_update","pz_pub_revision_versions_immutable_delete",
             "pz_pub_revision_events_immutable_update","pz_pub_revision_events_immutable_delete",
             "pz_pub_revision_no_draft_mutation_in_review","pz_pub_revision_transition_guard"):
    assert objects.get(name)=="trigger",name
for table in baseline_tables:
    assert rows(table)==baseline[table],f"Production 012 changed existing {table} rows"
assert not list(db.execute("PRAGMA foreign_key_check"))
assert all(rows(t)==[] for t in expected_tables),"Migration must not seed revision rows"

# Re-execution is syntactically safe due to IF NOT EXISTS; it must not erase existing data.
db.executescript(prod)
for table in baseline_tables:
    assert rows(table)==baseline[table],f"Reapplying 012 changed existing {table} rows"
assert all(rows(t)==[] for t in expected_tables)

def must_reject(sql):
    try: db.execute(sql)
    except sqlite3.IntegrityError: return
    raise AssertionError("D1 revision integrity guard allowed forbidden operation: "+sql)

db.execute("""
INSERT INTO pz_published_product_revisions
 (id,product_id,submitter_id,supervisor_id,department_id,base_updated_at,
  base_snapshot_json,draft_json,status,created_at,updated_at)
 VALUES ('rev-1','prod-1','worker','lead','dept','2026-11-05T10:00:00Z',
 '{"name":"Oak Table"}','{"name":"Revised Oak Table"}','draft','2026-11-05','2026-11-05')
""")
must_reject("""
INSERT INTO pz_published_product_revisions
 (id,product_id,submitter_id,supervisor_id,department_id,base_updated_at,
  base_snapshot_json,draft_json,status,created_at,updated_at)
 VALUES ('rev-2','prod-1','worker','lead','dept','2026-11-05T10:00:00Z',
 '{}','{}','draft','2026-11-05','2026-11-05')
""")
must_reject("UPDATE pz_published_product_revisions SET status='published' WHERE id='rev-1'")
db.execute("UPDATE pz_published_product_revisions SET status='pending_supervisor',latest_version=1 WHERE id='rev-1'")
db.execute("""
INSERT INTO pz_published_revision_versions(revision_id,version,snapshot_json,submitted_by,created_at)
 VALUES ('rev-1',1,'{"name":"Revised Oak Table"}','worker','2026-11-05')
""")
db.execute("""
INSERT INTO pz_published_revision_events(id,revision_id,action,actor_id,actor_role,
 review_version,created_at)
 VALUES ('event-1','rev-1','submitted','worker','FACTORY',1,'2026-11-05')
""")
must_reject("UPDATE pz_published_revision_versions SET snapshot_json='{}' WHERE revision_id='rev-1'")
must_reject("DELETE FROM pz_published_revision_versions WHERE revision_id='rev-1'")
must_reject("UPDATE pz_published_revision_events SET note='altered' WHERE id='event-1'")
must_reject("DELETE FROM pz_published_revision_events WHERE id='event-1'")
must_reject("UPDATE pz_published_product_revisions SET draft_json='{}' WHERE id='rev-1'")
must_reject("UPDATE pz_published_product_revisions SET status='published' WHERE id='rev-1'")
db.execute("UPDATE products SET updated_at='2026-11-05T11:00:00Z' WHERE id='prod-1'")
must_reject("UPDATE pz_published_product_revisions SET status='pending_admin' WHERE id='rev-1'")
assert db.execute("SELECT name FROM products WHERE id='prod-1'").fetchone()[0]=="Oak Table"
assert db.execute("SELECT status FROM products WHERE id='prod-1'").fetchone()[0]=="published"
assert not list(db.execute("PRAGMA foreign_key_check"))
print("PASS: Production 012 matches Staging DDL, no existing rows modified, 3 tables, guards, FK and CAS checks")
