-- Task 14: D1 in-app notifications and verified opt-in email.
-- STAGING ONLY. Requires 010 (new-product reviews), published revision tables,
-- migration 018 fast-lane sampling, user identities. No new outbound mail on migration.
CREATE TABLE IF NOT EXISTS pz_notification_email_settings (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE RESTRICT,
 email TEXT,
 verified INTEGER NOT NULL DEFAULT 0 CHECK(verified IN (0,1)),
 email_enabled INTEGER NOT NULL DEFAULT 0 CHECK(email_enabled IN (0,1)),
 verification_hash TEXT,
 verification_expires_at TEXT,
 verification_attempts INTEGER NOT NULL DEFAULT 0,
 verification_last_sent_at TEXT,
 updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pz_notification_verified
 ON pz_notification_email_settings(verified,email_enabled);

CREATE TABLE IF NOT EXISTS pz_notifications (
 id TEXT PRIMARY KEY,
 recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 source_event_id TEXT NOT NULL,
 event_type TEXT NOT NULL,
 actor_id TEXT,
 entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL,
 title TEXT NOT NULL,
 message TEXT NOT NULL DEFAULT '',
 read_at TEXT,
 created_at TEXT NOT NULL,
 email_state TEXT NOT NULL DEFAULT 'pending' CHECK(email_state IN ('pending','sending','sent','skipped','failed')),
 email_attempts INTEGER NOT NULL DEFAULT 0,
 email_provider_id TEXT,
 email_last_error TEXT,
 email_sent_at TEXT,
 UNIQUE(recipient_id,source_event_id)
);
CREATE INDEX IF NOT EXISTS idx_pz_notifications_unread
 ON pz_notifications(recipient_id,read_at,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pz_notifications_mail
 ON pz_notifications(email_state,created_at DESC);

-- Insert notifications IN THE SAME D1 transaction that inserts audit events.
-- A transient external mail failure will never roll back a review transition.
-- Trigger payloads contain only product code and field issue summaries.
CREATE TRIGGER IF NOT EXISTS pz_notify_new_product_event
AFTER INSERT ON pz_product_review_events
WHEN NEW.action IN ('submitted','supervisor_returned','admin_returned',
  'correction_assigned','supervisor_approved','published','fast_published')
BEGIN
  INSERT OR IGNORE INTO pz_notifications
  (id,recipient_id,source_event_id,event_type,actor_id,entity_type,entity_id,title,message,created_at)
  SELECT lower(hex(randomblob(16))),
    CASE WHEN NEW.action IN ('submitted') THEN r.supervisor_id
      WHEN NEW.action IN ('supervisor_returned','correction_assigned','published','fast_published') THEN r.submitter_id
      WHEN NEW.action='admin_returned' THEN r.supervisor_id END,
    NEW.id,NEW.action,NEW.actor_id,'product',r.product_id,
    CASE NEW.action
      WHEN 'submitted' THEN '待初审产品'
      WHEN 'supervisor_returned' THEN '产品退回修改'
      WHEN 'admin_returned' THEN '管理员退回主管'
      WHEN 'correction_assigned' THEN '请修改退回产品'
      WHEN 'published' THEN '产品已正式发布'
      WHEN 'fast_published' THEN '快速审核产品已发布' END,
    substr('SKU: '||COALESCE(p.code,'')||' · '||
      CASE WHEN NEW.action IN ('supervisor_returned','admin_returned','correction_assigned')
        THEN COALESCE(NULLIF(r.return_reason,''),CASE
          WHEN substr(NEW.note,1,length('PZ_FIELD_RETURN_V1:'))='PZ_FIELD_RETURN_V1:'
          THEN '退回字段：'||COALESCE((
            SELECT group_concat(json_extract(value,'$.field')||'：'||json_extract(value,'$.message'),'；')
            FROM json_each(
              CASE WHEN json_valid(substr(NEW.note,length('PZ_FIELD_RETURN_V1:')+1))
                THEN substr(NEW.note,length('PZ_FIELD_RETURN_V1:')+1)
                ELSE '{"issues":[]}' END,'$.issues')
          ),'请查看审核详情')
          ELSE COALESCE(NEW.note,'请查看审核详情') END)
        ELSE '请登录后台查看审核进度' END,1,600),
    NEW.created_at
  FROM pz_product_reviews r
  JOIN products p ON p.id=r.product_id
  JOIN users u ON u.id=(CASE WHEN NEW.action='submitted' THEN r.supervisor_id
    WHEN NEW.action IN ('supervisor_returned','correction_assigned','published','fast_published') THEN r.submitter_id
    ELSE r.supervisor_id END)
  WHERE r.id=NEW.review_id AND NEW.action NOT IN ('supervisor_approved')
    AND u.is_active=1 AND u.deleted_at IS NULL AND u.id<>NEW.actor_id;

  INSERT OR IGNORE INTO pz_notifications
  (id,recipient_id,source_event_id,event_type,actor_id,entity_type,entity_id,title,message,created_at)
  SELECT lower(hex(randomblob(16))),u.id,NEW.id,NEW.action,NEW.actor_id,
    'product',r.product_id,
    CASE WHEN NEW.action='supervisor_approved' THEN '产品待管理员终审'
      ELSE '快速审核产品已发布，请抽检' END,
    substr('SKU: '||COALESCE(p.code,'')||' · 请进入审核中心查看',1,600),NEW.created_at
  FROM pz_product_reviews r JOIN products p ON p.id=r.product_id
  JOIN users u ON lower(u.role)='admin' AND u.is_active=1 AND u.deleted_at IS NULL
  WHERE r.id=NEW.review_id AND NEW.action IN ('supervisor_approved','fast_published')
    AND u.id<>NEW.actor_id;
END;

CREATE TRIGGER IF NOT EXISTS pz_notify_revision_event
AFTER INSERT ON pz_published_revision_events
WHEN NEW.action IN ('submitted','supervisor_returned','admin_returned',
  'correction_assigned','supervisor_approved','published')
BEGIN
  INSERT OR IGNORE INTO pz_notifications
  (id,recipient_id,source_event_id,event_type,actor_id,entity_type,entity_id,title,message,created_at)
  SELECT lower(hex(randomblob(16))),u.id,NEW.id,'revision_'||NEW.action,NEW.actor_id,
    'revision',r.id,
    CASE WHEN NEW.action='submitted' THEN '产品修订待主管审核'
      WHEN NEW.action IN ('supervisor_returned','correction_assigned') THEN '修订资料被退回'
      WHEN NEW.action='admin_returned' THEN '修订申请退回主管'
      WHEN NEW.action='published' THEN '产品修订已发布'
      ELSE '修订待管理员审核' END,
    substr('SKU: '||COALESCE(p.code,'')||' · '||COALESCE(NEW.note,'请登录后台查看审核详情'),1,600),
    NEW.created_at
  FROM pz_published_product_revisions r JOIN products p ON p.id=r.product_id
  JOIN users u ON u.id=(CASE
    WHEN NEW.action IN ('submitted','admin_returned') THEN r.supervisor_id
    ELSE r.submitter_id END)
  WHERE r.id=NEW.revision_id AND NEW.action<>'supervisor_approved'
    AND u.is_active=1 AND u.deleted_at IS NULL AND u.id<>NEW.actor_id;

  INSERT OR IGNORE INTO pz_notifications
  (id,recipient_id,source_event_id,event_type,actor_id,entity_type,entity_id,title,message,created_at)
  SELECT lower(hex(randomblob(16))),u.id,NEW.id,'revision_'||NEW.action,NEW.actor_id,
    'revision',r.id,'修订待管理员审核','SKU: '||COALESCE(p.code,''),
    NEW.created_at
  FROM pz_published_product_revisions r JOIN products p ON p.id=r.product_id
  JOIN users u ON lower(u.role)='admin' AND u.is_active=1 AND u.deleted_at IS NULL
  WHERE r.id=NEW.revision_id AND NEW.action='supervisor_approved' AND u.id<>NEW.actor_id;
END;

CREATE TRIGGER IF NOT EXISTS pz_notify_sample_retracted
AFTER INSERT ON pz_fast_lane_events
WHEN NEW.event_type='sample_unpublished'
BEGIN
  INSERT OR IGNORE INTO pz_notifications
  (id,recipient_id,source_event_id,event_type,actor_id,entity_type,entity_id,title,message,created_at)
  SELECT lower(hex(randomblob(16))),u.id,NEW.id,'sample_unpublished',NEW.actor_id,
    'product',p.id,'抽检不通过，产品已下架',
    substr('SKU: '||COALESCE(p.code,'')||' · 原因：'||COALESCE(NEW.note,''),1,600),
    NEW.created_at
  FROM pz_fast_lane_publications f JOIN products p ON p.id=f.product_id
  JOIN users u ON u.id IN (f.operator_id,f.supervisor_id) AND u.is_active=1 AND u.deleted_at IS NULL
  WHERE f.review_id=NEW.review_id AND u.id<>NEW.actor_id;
END;
