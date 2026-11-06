ALTER TABLE products ADD COLUMN catalog_hidden INTEGER NOT NULL DEFAULT 0 CHECK (catalog_hidden IN (0, 1));
