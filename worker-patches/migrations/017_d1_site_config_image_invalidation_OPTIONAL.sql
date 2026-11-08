CREATE TRIGGER IF NOT EXISTS pz_inventory_site_config_state_insert
AFTER INSERT ON site_config_state
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.published_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_site_config_state_update
AFTER UPDATE OF draft_json, published_json ON site_config_state
WHEN OLD.draft_json IS NOT NEW.draft_json OR OLD.published_json IS NOT NEW.published_json
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(NEW.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(NEW.published_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.published_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_site_config_state_delete
AFTER DELETE ON site_config_state
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(replace(lower(OLD.draft_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0 OR
      instr(replace(replace(lower(OLD.published_json), '%2f', '/'), char(92) || '/', '/'), lower(object_key)) > 0;
END;
