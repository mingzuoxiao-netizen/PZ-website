CREATE TABLE IF NOT EXISTS pz_product_image_generation (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  generation INTEGER NOT NULL
);
INSERT OR IGNORE INTO pz_product_image_generation VALUES (1, 0);

CREATE TRIGGER IF NOT EXISTS pz_inventory_product_image_insert
AFTER INSERT ON products
WHEN coalesce(NEW.images, '[]') <> '[]'
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(lower(NEW.images), '%2f', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_product_image_update
AFTER UPDATE OF images ON products
WHEN OLD.images IS NOT NEW.images
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(lower(NEW.images), '%2f', '/'), lower(object_key)) > 0
     OR instr(replace(lower(OLD.images), '%2f', '/'), lower(object_key)) > 0;
END;

CREATE TRIGGER IF NOT EXISTS pz_inventory_product_image_delete
AFTER DELETE ON products
WHEN coalesce(OLD.images, '[]') <> '[]'
BEGIN
  UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id = 1;
  DELETE FROM pz_image_inventory_candidates
  WHERE instr(replace(lower(OLD.images), '%2f', '/'), lower(object_key)) > 0;
END;
