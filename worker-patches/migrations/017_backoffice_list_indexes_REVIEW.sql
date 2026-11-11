-- Optional performance support for list_version=1. No product or review writes.
-- Requires the existing organization, review and revision schemas first.
CREATE INDEX IF NOT EXISTS idx_products_owner_list
  ON products(created_by,deleted_at,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_products_owner_status_list
  ON products(created_by,deleted_at,status,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_admin_list
  ON pz_product_reviews(status,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_supervisor_list
  ON pz_product_reviews(supervisor_id,department_id,status,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_admin_list
  ON pz_published_product_revisions(status,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_supervisor_list
  ON pz_published_product_revisions(supervisor_id,department_id,status,updated_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS idx_revisions_owner_list
  ON pz_published_product_revisions(submitter_id,status,updated_at DESC,id DESC);
