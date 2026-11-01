"""PR #11 D1 schema + Worker packaging regression (no live D1 access)."""
from pathlib import Path
import sqlite3

root = Path(__file__).resolve().parents[1]
migration = (root / "worker-patches/migrations/008_real_audit_logs_REVIEW.sql").read_text()
db = sqlite3.connect(":memory:")
db.executescript(migration)
assert {row[1] for row in db.execute("PRAGMA table_info(audit_logs)")} == {
    "id", "created_at", "actor_id", "actor_username", "actor_role",
    "action", "entity_type", "entity_id", "status", "http_status",
    "before_json", "after_json", "changes_json"
}
db.execute(
    """INSERT INTO audit_logs
       (id,created_at,actor_id,actor_username,actor_role,action,entity_type,entity_id,status)
       VALUES (?,?,?,?,?,?,?,?,?)""",
    ("id-1", "2026-10-31T00:00:00.000Z", "u1", "operator1", "ADMIN",
     "product.create", "product", "p1", "pending")
)
db.execute("UPDATE audit_logs SET status='success',http_status=201 WHERE id='id-1'")
assert db.execute("SELECT status,http_status FROM audit_logs").fetchone() == ("success", 201)
try:
    db.execute("UPDATE audit_logs SET status='invented' WHERE id='id-1'")
    raise AssertionError("Audit status constraint must reject fabricated values")
except sqlite3.IntegrityError:
    pass
db.executescript(migration)  # IF NOT EXISTS migration can safely be retried.
assert db.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0] == 1
db.close()

core = (root / "worker-patches/adminAuditLogCore.mjs").read_text()
assert "export function pzAuditCreateFetch(" in core
inlined = core.replace("export function pzAuditCreateFetch(", "function pzAuditCreateFetch(", 1)
for filename in [
    "worker-patches/staging-worker-category-changes-REVIEW.js",
    "worker-patches/production-worker-category-governance-REVIEW.js",
]:
    worker = (root / filename).read_text()
    assert worker.count("function pzAuditCreateFetch(") == 1, filename
    assert inlined in worker, filename
    assert "index_default.fetch = pzAuditCreateFetch(pzAuditOriginalFetch, { authorize, json });" in worker
    assert worker.index("index_default.fetch = pzAuditCreateFetch") < worker.index(
        "pzCorsOriginalFetch = index_default.fetch"), filename
    assert "audit_logs" in worker and "Audit reservation failed; mutation blocked" in worker

ui = (root / "pages/CreatorPortal/components/AuditTimeline.tsx").read_text()
assert "adminFetch<AuditPage>('admin/audit-logs?'" in ui
assert "actionLabels" in ui and "actor" in ui and "changed_fields" in ui
assert "暂无法读取真实操作日志" not in ui
assert "结果待确认" in ui
print("PASS: audit D1 schema, Worker packaging, UI integration")
