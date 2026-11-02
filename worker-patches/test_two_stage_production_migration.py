"""Production Phase-2 SQL candidate gate: IN-MEMORY SQLite only, no remote access."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parent
stage_sql = (root / "migrations/010_two_stage_product_review_REVIEW.sql").read_text(encoding="utf-8")
prod_sql = (root / "migrations/010_two_stage_product_review_PRODUCTION_REVIEW.sql").read_text(encoding="utf-8")
anchor = "CREATE TABLE IF NOT EXISTS pz_product_reviews"
assert stage_sql[stage_sql.index(anchor):] == prod_sql[prod_sql.index(anchor):], "Production schema diverged from validated Staging SQL"
assert "Never enable PZ_ORG_RBAC_ENABLED" in prod_sql

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE users (
 id TEXT PRIMARY KEY, org_id TEXT NOT NULL, username TEXT NOT NULL,
 password_hash TEXT NOT NULL, role TEXT NOT NULL, is_active INTEGER NOT NULL,
 created_at TEXT NOT NULL, last_login_at TEXT
);
CREATE TABLE products (
 id TEXT PRIMARY KEY, name TEXT, name_cn TEXT, category TEXT,
 sub_category TEXT, material TEXT, size TEXT, code TEXT,
 description TEXT, description_cn TEXT, images TEXT, status TEXT,
 created_at TEXT, updated_at TEXT, production_sites TEXT NOT NULL DEFAULT '[]',
 created_by TEXT, org_id TEXT NOT NULL DEFAULT 'org-main', finish TEXT NOT NULL DEFAULT ''
);
CREATE TABLE audit_logs (id TEXT PRIMARY KEY, action TEXT NOT NULL);
INSERT INTO users VALUES ('admin','org-main','owner','hash','admin',1,'2026',NULL),
('factory1','org-main','factory1','hash','factory',1,'2026',NULL),
('factory2','org-main','factory2','hash','factory',1,'2026',NULL);
INSERT INTO audit_logs VALUES ('log1','account.create'),('log2','site_config.publish');
""")
db.executescript((root / "migrations/009_department_accounts_REVIEW.sql").read_text(encoding="utf-8"))
before = {name:list(db.execute(f"SELECT * FROM {name} ORDER BY 1"))
          for name in ("users","products","audit_logs","pz_departments","pz_staff_assignments")}

db.executescript(prod_sql)
db.executescript(prod_sql)  # IF NOT EXISTS supports a safe schema retry
after = {name:list(db.execute(f"SELECT * FROM {name} ORDER BY 1")) for name in before}
assert before == after, "Migration modified existing user/product/audit/organization rows"

objects = {row[0]:row[1] for row in db.execute(
 "SELECT name,type FROM sqlite_master WHERE name LIKE 'pz_%' OR name LIKE 'idx_pz_%'")}
for table in ("pz_product_reviews","pz_product_review_versions","pz_product_review_events"):
    assert objects.get(table) == "table",table
for name in ("pz_versions_no_update","pz_versions_no_delete","pz_events_no_update",
             "pz_events_no_delete","pz_review_transition_guard"):
    assert objects.get(name) == "trigger", name
for name in ("idx_pz_product_reviews_supervisor","idx_pz_product_reviews_status",
             "idx_pz_review_events","idx_pz_review_event_once"):
    assert objects.get(name) == "index",name
assert not list(db.execute("PRAGMA foreign_key_check")), "Foreign-key violations"
assert db.execute("SELECT COUNT(*) FROM pz_product_reviews").fetchone()[0] == 0

# Simulate one valid review against a new product; no website publishing or R2 writes.
db.executescript("""
INSERT INTO pz_departments(id,name,factory_site,created_by,created_at)
 VALUES ('dept','Sales','zhaoqing','admin','2026');
INSERT INTO products(id,name,code,images,created_by,status,created_at)
 VALUES ('p1','Review Test','PZ-TEST-01','["a.jpg"]','factory1','pending_supervisor','2026');
INSERT INTO pz_product_reviews(id,product_id,submitter_id,supervisor_id,department_id,
 status,latest_version,created_at,updated_at)
 VALUES ('review1','p1','factory1','factory2','dept','pending_supervisor',1,'2026','2026');
INSERT INTO pz_product_review_versions(review_id,version,snapshot_json,submitted_by,created_at)
 VALUES ('review1',1,'{"name":"Review Test"}','factory1','2026');
INSERT INTO pz_product_review_events(id,review_id,action,actor_id,actor_role,review_version,created_at)
 VALUES ('event1','review1','submitted','factory1','FACTORY',1,'2026');
""")

def rejects(statement):
    try:
        db.execute(statement)
    except sqlite3.IntegrityError:
        return
    raise AssertionError("SQL guard allowed forbidden change: "+statement)

rejects("UPDATE pz_product_review_versions SET snapshot_json='{}' WHERE review_id='review1'")
rejects("DELETE FROM pz_product_review_versions WHERE review_id='review1'")
rejects("UPDATE pz_product_review_events SET note='altered' WHERE id='event1'")
rejects("DELETE FROM pz_product_review_events WHERE id='event1'")
rejects("UPDATE pz_product_reviews SET status='published' WHERE id='review1'")
db.execute("UPDATE pz_product_reviews SET status='pending_admin' WHERE id='review1'")
db.execute("UPDATE products SET status='pending_admin' WHERE id='p1'")
rejects("UPDATE pz_product_reviews SET status='published' WHERE id='review1'")
assert not list(db.execute("PRAGMA foreign_key_check"))
print("PASS: production 010 matches Staging SQL, idempotent schema, existing rows preserved, five guards, four indexes, valid/invalid review transitions")
