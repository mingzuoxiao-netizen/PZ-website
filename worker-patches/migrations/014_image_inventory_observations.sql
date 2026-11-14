CREATE TABLE IF NOT EXISTS pz_image_inventory_checkpoint (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  observed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pz_image_inventory_candidates (
  object_key TEXT PRIMARY KEY,
  object_version TEXT NOT NULL,
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL
);

INSERT OR IGNORE INTO pz_image_inventory_checkpoint (id, observed_at)
VALUES (1, '1970-01-01T00:00:00.000Z');
