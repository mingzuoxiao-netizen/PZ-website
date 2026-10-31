"""Run only on local in-memory SQLite, never Production D1."""
from pathlib import Path
import sqlite3
import json
from datetime import datetime

root=Path(__file__).parent
conn=sqlite3.connect(":memory:")
conn.executescript("""
CREATE TABLE category_requests (
  id TEXT PRIMARY KEY, title TEXT, title_cn TEXT, subtitle TEXT, image TEXT,
  status TEXT, created_at TEXT, updated_at TEXT
);
INSERT INTO category_requests VALUES
  ('rugs','RUGS','地毯','','','approved','before','before'),
  ('sofa','Sofa','沙发','','','approved','before','before'),
  ('pending','Pending','测试','','','pending','before','before');
""")
before=list(conn.execute("SELECT * FROM category_requests ORDER BY id"))
for name in ["005_category_changes_production_REVIEW.sql","006_site_config_d1_versioned_REVIEW.sql"]:
    sql=(root/"migrations"/name).read_text(encoding="utf-8")
    conn.executescript(sql)
    conn.executescript(sql)
assert list(conn.execute("SELECT * FROM category_requests ORDER BY id")) == before
config=json.dumps({"categories":[{"id":"sofa","title":"Sofa"}]})
conn.execute("""INSERT INTO site_config_state(
  id,draft_json,draft_revision,published_json,published_revision,
  published_version,published_at,write_token,updated_at
) VALUES(1,?,1,?,1,'seed','before','init','before')""",(config,config))
sql="""UPDATE site_config_state SET draft_json=?, draft_revision=draft_revision+1,
write_token=?, updated_at=? WHERE id=1 AND draft_revision=?"""
one=conn.execute(sql,(config,'first','today',1)).rowcount
two=conn.execute(sql,(config,'second','today',1)).rowcount
assert (one,two)==(1,0)
assert conn.execute("SELECT draft_revision FROM site_config_state").fetchone()[0]==2
conn.execute("""INSERT INTO category_change_requests (
id,category_id,base_json,proposed_json,created_by,created_at,updated_at
) VALUES('change-1','sofa','{}','{}','factory','today','today')""")
conn.execute("BEGIN")
try:
    a=conn.execute("""UPDATE site_config_state SET draft_json=?,
draft_revision=draft_revision+1,write_token=?,updated_at=? WHERE id=1 AND draft_revision=?
AND EXISTS (SELECT 1 FROM category_change_requests WHERE id=? AND status=?)""",
        (config,'approval-token','today',2,'change-1','pending')).rowcount
    b=conn.execute("""UPDATE category_change_requests SET status='approved',updated_at=?
WHERE id=? AND status=? AND (SELECT write_token FROM site_config_state WHERE id=1)=?""",
        ('today','change-1','pending','approval-token')).rowcount
    assert (a,b)==(1,1)
    conn.commit()
except Exception:
    conn.rollback()
    raise
assert conn.execute("SELECT draft_revision FROM site_config_state").fetchone()[0]==3
assert conn.execute("SELECT status FROM category_change_requests").fetchone()[0]=='approved'
assert conn.execute("SELECT published_json FROM site_config_state").fetchone()[0]==config
assert list(conn.execute("SELECT * FROM category_requests ORDER BY id"))==before
print("PASS: schema idempotent, old records unchanged, draft CAS and transactional approval")
