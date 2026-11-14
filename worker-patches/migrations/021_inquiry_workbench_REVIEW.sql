-- Task 16: inquiry workbench. Apply once to audited, isolated Staging D1 AFTER migration 019.
-- Existing public submission endpoint and old /admin/inquiries read-only response remain supported.
-- No public route may expose pz_inquiry_history or internal_notes.
ALTER TABLE inquiries ADD COLUMN assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE inquiries ADD COLUMN first_response_at TEXT;
ALTER TABLE inquiries ADD COLUMN linked_product_code TEXT;
ALTER TABLE inquiries ADD COLUMN country TEXT;
ALTER TABLE inquiries ADD COLUMN internal_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE inquiries ADD COLUMN updated_at TEXT;
ALTER TABLE inquiries ADD COLUMN last_modified_by TEXT;
ALTER TABLE inquiries ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- Preserve genuinely replied legacy records; all otherwise untracked rows begin as new.
UPDATE inquiries SET status=CASE WHEN lower(trim(COALESCE(status,'')))='replied'
  THEN 'replied' ELSE 'new' END,updated_at=COALESCE(created_at,datetime('now'));
CREATE INDEX IF NOT EXISTS idx_inquiries_workbench_status_time ON inquiries(status,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_workbench_assignee_time ON inquiries(assignee_id,created_at DESC,id DESC);

CREATE TABLE IF NOT EXISTS pz_inquiry_history (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL REFERENCES inquiries(id) ON DELETE RESTRICT,
  -- Keep the immutable actor ID even when a login is retired/removed.
  -- A foreign key ON DELETE SET NULL would conflict with append-only audit triggers.
  actor_id TEXT,
  field TEXT NOT NULL CHECK(field IN ('status','assignee_id')),
  old_value TEXT,
  new_value TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_inquiry_history ON pz_inquiry_history(inquiry_id,created_at DESC,id DESC);
CREATE TRIGGER IF NOT EXISTS pz_inquiry_history_no_update BEFORE UPDATE ON pz_inquiry_history BEGIN
  SELECT RAISE(ABORT,'Inquiry history is append only');
END;
CREATE TRIGGER IF NOT EXISTS pz_inquiry_history_no_delete BEFORE DELETE ON pz_inquiry_history BEGIN
  SELECT RAISE(ABORT,'Inquiry history is append only');
END;
CREATE TRIGGER IF NOT EXISTS pz_inquiry_status_history AFTER UPDATE OF status ON inquiries
WHEN OLD.status IS NOT NEW.status
BEGIN
  INSERT INTO pz_inquiry_history(id,inquiry_id,actor_id,field,old_value,new_value,created_at)
  VALUES(lower(hex(randomblob(16))),NEW.id,NEW.last_modified_by,'status',
    OLD.status,NEW.status,COALESCE(NEW.updated_at,datetime('now')));
END;
CREATE TRIGGER IF NOT EXISTS pz_inquiry_assignee_history AFTER UPDATE OF assignee_id ON inquiries
WHEN OLD.assignee_id IS NOT NEW.assignee_id
BEGIN
  INSERT INTO pz_inquiry_history(id,inquiry_id,actor_id,field,old_value,new_value,created_at)
  VALUES(lower(hex(randomblob(16))),NEW.id,NEW.last_modified_by,'assignee_id',
    OLD.assignee_id,NEW.assignee_id,COALESCE(NEW.updated_at,datetime('now')));
END;

-- Reuse task 14 in-app notifications. Email not auto-enabled for customer PII.
-- The trigger is atomic with the existing public insertion, so no new queue is required.
CREATE TRIGGER IF NOT EXISTS pz_notify_inquiry_created AFTER INSERT ON inquiries BEGIN
  INSERT OR IGNORE INTO pz_notifications
    (id,recipient_id,source_event_id,event_type,entity_type,entity_id,title,message,created_at,email_state)
  SELECT lower(hex(randomblob(16))),u.id,'inquiry:new:'||NEW.id,
    'inquiry_received','inquiry',NEW.id,'收到新询盘',
    '网站收到新的客户咨询，请进入询盘管理分配负责人。',
    NEW.created_at,'skipped'
  FROM users u WHERE lower(u.role)='admin' AND u.is_active=1 AND u.deleted_at IS NULL;
END;
CREATE TRIGGER IF NOT EXISTS pz_notify_inquiry_assigned AFTER UPDATE OF assignee_id ON inquiries
WHEN NEW.assignee_id IS NOT NULL AND OLD.assignee_id IS NOT NEW.assignee_id
BEGIN
  INSERT OR IGNORE INTO pz_notifications
    (id,recipient_id,source_event_id,event_type,entity_type,entity_id,title,message,created_at,email_state)
  SELECT lower(hex(randomblob(16))),u.id,'inquiry:assigned:'||NEW.id||':'||NEW.version,
    'inquiry_assigned','inquiry',NEW.id,'新询盘分配给你',
    '管理员已分配一条询盘。当前详情权限仍限管理员，请与管理员联系。',
    COALESCE(NEW.updated_at,datetime('now')),'skipped'
  FROM users u WHERE u.id=NEW.assignee_id AND u.is_active=1 AND u.deleted_at IS NULL;
END;
