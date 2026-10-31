"""Production review: in-memory SQLite only; never connects to Production D1."""
import sqlite3
from pathlib import Path

migration = Path(__file__).parent / "migrations/005_category_changes_production_REVIEW.sql"
conn = sqlite3.connect(":memory:")
conn.executescript("""
CREATE TABLE category_requests (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, title_cn TEXT,
 subtitle TEXT, image TEXT, status TEXT NOT NULL,
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
INSERT INTO category_requests VALUES
 ('existing-sofa','Sofa','沙发','','','approved','2026-10-30','2026-10-30'),
 ('existing-rugs','RUGS','地毯','','','approved','2026-10-30','2026-10-30'),
 ('existing-pending','Pending','测试','','','pending','2026-10-30','2026-10-30');
""")
before = list(conn.execute("SELECT * FROM category_requests ORDER BY id"))
sql = migration.read_text(encoding="utf-8")
conn.executescript(sql)
conn.executescript(sql)  # safe on retry
after = list(conn.execute("SELECT * FROM category_requests ORDER BY id"))
assert after == before, "Legacy approvals/pending must be unchanged"
cols = {row[1] for row in conn.execute("PRAGMA table_info(category_change_requests)")}
required = {"id", "category_id", "base_json", "proposed_json", "status",
            "created_by", "created_at", "updated_at", "reviewed_by", "reviewed_at", "reject_reason"}
assert cols == required, cols
conn.execute("""INSERT INTO category_change_requests
 (id,category_id,base_json,proposed_json,created_by,created_at,updated_at)
 VALUES ('a','sofa','{}','{}','user','2026','2026')""")
try:
    conn.execute("""INSERT INTO category_change_requests
    (id,category_id,base_json,proposed_json,created_by,created_at,updated_at)
    VALUES ('b','sofa','{}','{}','user','2026','2026')""")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("Second pending request for same category was accepted")
conn.execute("UPDATE category_change_requests SET status='approved' WHERE id='a'")
conn.execute("""INSERT INTO category_change_requests
 (id,category_id,base_json,proposed_json,created_by,created_at,updated_at)
 VALUES ('c','sofa','{}','{}','user','2026','2026')""")
print("PASS: idempotent migration, legacy records unchanged, one pending per category")
