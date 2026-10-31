-- Production release review: do not run on live D1 until separately authorized.
-- Versioned site configuration is authoritative in D1 after opt-in cutover.
-- Both draft and public snapshot start from existing KV through explicit
-- ADMIN bootstrap; schema migration alone does not mutate published content.
CREATE TABLE IF NOT EXISTS site_config_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  draft_json TEXT NOT NULL CHECK (json_valid(draft_json)),
  draft_revision INTEGER NOT NULL DEFAULT 1 CHECK (draft_revision >= 1),
  published_json TEXT NOT NULL CHECK (json_valid(published_json)),
  published_revision INTEGER NOT NULL DEFAULT 1 CHECK (published_revision >= 1),
  published_version TEXT NOT NULL,
  published_at TEXT NOT NULL,
  write_token TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
