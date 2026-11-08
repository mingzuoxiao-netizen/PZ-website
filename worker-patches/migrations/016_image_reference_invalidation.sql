CREATE TABLE IF NOT EXISTS pz_image_reference_writes (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_product_revisions_insert
AFTER INSERT ON pz_published_product_revisions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_product_revisions_update
AFTER UPDATE OF draft_json ON pz_published_product_revisions
WHEN OLD.draft_json IS NOT NEW.draft_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_product_revisions_delete
AFTER DELETE ON pz_published_product_revisions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_product_review_versions_insert
AFTER INSERT ON pz_product_review_versions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_product_review_versions_update
AFTER UPDATE OF snapshot_json ON pz_product_review_versions
WHEN OLD.snapshot_json IS NOT NEW.snapshot_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_product_review_versions_delete
AFTER DELETE ON pz_product_review_versions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_revision_versions_insert
AFTER INSERT ON pz_published_revision_versions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_revision_versions_update
AFTER UPDATE OF snapshot_json ON pz_published_revision_versions
WHEN OLD.snapshot_json IS NOT NEW.snapshot_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_pz_published_revision_versions_delete
AFTER DELETE ON pz_published_revision_versions
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.snapshot_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_requests_insert
AFTER INSERT ON category_requests
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.image), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_requests_update
AFTER UPDATE OF image ON category_requests
WHEN OLD.image IS NOT NEW.image
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.image), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.image), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_requests_delete
AFTER DELETE ON category_requests
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.image), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_change_requests_insert
AFTER INSERT ON category_change_requests
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.base_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.proposed_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_change_requests_update
AFTER UPDATE OF base_json, proposed_json ON category_change_requests
WHEN OLD.base_json IS NOT NEW.base_json OR OLD.proposed_json IS NOT NEW.proposed_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.base_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.proposed_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.base_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.proposed_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_category_change_requests_delete
AFTER DELETE ON category_change_requests
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.base_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.proposed_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_audit_logs_insert
AFTER INSERT ON audit_logs
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.before_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.after_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.changes_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_audit_logs_update
AFTER UPDATE OF before_json, after_json, changes_json ON audit_logs
WHEN OLD.before_json IS NOT NEW.before_json OR OLD.after_json IS NOT NEW.after_json OR OLD.changes_json IS NOT NEW.changes_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.before_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.after_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.changes_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.before_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.after_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.changes_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_audit_logs_delete
AFTER DELETE ON audit_logs
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.before_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.after_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.changes_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;
