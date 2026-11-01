"""Verify additive finish migration and both reviewed Worker candidates.

Run: python3 worker-patches/test_product_finish_migration.py
No network or Cloudflare credentials are used.
"""
from pathlib import Path
import re
import sqlite3

ROOT = Path(__file__).resolve().parent
migration = (ROOT / "migrations/007_product_surface_finish_REVIEW.sql").read_text()
db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    material TEXT,
    size TEXT,
    description TEXT
);
INSERT INTO products (id, name, material, size, description)
VALUES ('old-1','Existing product','Birch','72 in','Original text');
""")
db.executescript(migration)
existing = db.execute("SELECT name, material, size, description, finish FROM products WHERE id='old-1'").fetchone()
assert existing == ("Existing product", "Birch", "72 in", "Original text", ""), existing

db.execute("UPDATE products SET finish = ? WHERE id = 'old-1'", ("Unfinished",))
assert db.execute("SELECT finish FROM products WHERE id = 'old-1'").fetchone()[0] == "Unfinished"
assert len([row for row in db.execute("PRAGMA table_info(products)") if row[1] == "finish"]) == 1

for name in ("production-worker-category-governance-REVIEW.js", "staging-worker-category-changes-REVIEW.js"):
    code = (ROOT / name).read_text()
    assert "finish: r.finish ?? \"\"" in code, name
    assert 'finish: String(p.finish ?? "")' in code, name
    assert "material,size,finish,code" in code, name
    inserts = re.findall(r"INSERT INTO products\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)", code)
    assert len(inserts) == 2, (name, len(inserts))
    for cols, values in inserts:
        columns = [x.strip() for x in cols.split(",")]
        placeholders = re.findall(r"\?", values)
        assert len(columns) == len(placeholders) == 18, (name, columns, values)
        assert "finish" in columns and columns.index("finish") == columns.index("size") + 1
    assert code.count("finish = ?,") == 2, name
    assert code.count("db.finish,") == 4, name
    assert code.count("material, size, finish, code") == 6, name

print("PASS: existing product preserved, finish D1 roundtrip, 2 Worker candidates and SQL bindings checked.")
