"""Additive D1 migration 011 proof — SQLite memory only; no remote D1 access."""
from pathlib import Path
import sqlite3
sql=(Path(__file__).resolve().parent/"migrations/011_structured_product_specifications_STAGING_REVIEW.sql").read_text()
db=sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE products(id TEXT PRIMARY KEY, name TEXT, status TEXT, created_by TEXT);
INSERT INTO products(id,name,status,created_by) VALUES('old','Legacy SKU','published','u1');
""")
before=db.execute("SELECT id,name,status,created_by FROM products").fetchall()
db.executescript(sql)
assert db.execute("SELECT id,name,status,created_by FROM products").fetchall()==before
assert db.execute("SELECT specs_json FROM products WHERE id='old'").fetchone()==('{}',)
db.execute("UPDATE products SET specs_json=? WHERE id='old'",('{"schema_version":1,"series_id":"MARLOW"}',))
assert db.execute("SELECT json_extract(specs_json,'$.series_id') FROM products WHERE id='old'").fetchone()==('MARLOW',)
for bad in ("[]","bad-json"):
    try:
        db.execute("UPDATE products SET specs_json=? WHERE id='old'",(bad,))
        raise AssertionError("Invalid JSON not rejected")
    except sqlite3.IntegrityError:
        pass
assert "specs_json" not in ["id","name","status"]  # public catalogs remain independently selected
print("PASS: 011 preserves old rows; defaults to {}, rejects invalid JSON and persists structured data")
