import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const staging = readFileSync(
  new URL('../../worker-patches/migrations/020_bulk_draft_import_REVIEW.sql', import.meta.url),
  'utf8'
);
const production = readFileSync(
  new URL('../../worker-patches/migrations/021_bulk_draft_import_PRODUCTION_REVIEW.sql', import.meta.url),
  'utf8'
);
const sqlOnly = text => text.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();

test('Production bulk-import DDL exactly matches the Staging-reviewed migration', () => {
  assert.equal(sqlOnly(production), sqlOnly(staging),
    'Any schema difference requires a new review and dedicated migration test');
  assert.match(production, /ONE TIME, MANUAL REVIEW REQUIRED/);
  assert.match(production, /PZ_BULK_IMPORT_ENABLED/);
});

test('Production migration preserves existing products and adds only draft-import tracking', () => {
  const db = new DatabaseSync(':memory:');
  try {
    db.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE users(id TEXT PRIMARY KEY);
      CREATE TABLE products(
        id TEXT PRIMARY KEY, code TEXT, created_at TEXT, status TEXT
      );
      CREATE UNIQUE INDEX ux_products_sku_normalized
        ON products(UPPER(TRIM(code)))
        WHERE code IS NOT NULL AND TRIM(code) <> '';
      INSERT INTO users(id) VALUES ('worker-user');
      INSERT INTO products(id,code,created_at,status)
        VALUES ('existing','PZ-EXISTING','2026-11-12','published');
    `);
    const before = db.prepare('SELECT * FROM products WHERE id=?').get('existing');
    db.exec(production);

    assert.deepEqual(
      db.prepare('SELECT id,code,created_at,status FROM products WHERE id=?').get('existing'),
      before
    );
    const names = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()
      .map(row => row.name);
    for (const name of ['pz_product_import_batches', 'pz_product_import_rows']) {
      assert.ok(names.includes(name), `missing ${name}`);
    }
    const columns = db.prepare("PRAGMA table_info(products)").all().map(row => row.name);
    assert.ok(columns.includes('import_batch_id'));
    const indexes = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_pz_%'"
    ).all().map(row => row.name);
    for (const name of [
      'idx_pz_products_import_batch',
      'idx_pz_import_batches_owner',
      'idx_pz_import_rows_sku'
    ]) assert.ok(indexes.includes(name), `missing ${name}`);

    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM products WHERE status='published'").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pz_product_import_batches").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM pz_product_import_rows").get().n, 0);
    assert.deepEqual(db.prepare("SELECT name FROM sqlite_master WHERE type='trigger'").all(), []);
    assert.throws(() => db.exec(production), /duplicate column name: import_batch_id/,
      'Migration must remain explicitly one-time; do not silently rerun');
  } finally {
    db.close();
  }
});

test('ZIP operator UI probes the Worker before any R2 photo upload and supports no-write recovery', () => {
  const source = readFileSync(
    new URL('../../pages/CreatorPortal/components/BulkZipImporter.tsx', import.meta.url),
    'utf8'
  );
  const confirm = source.slice(source.indexOf('const confirmImport=async()=>'),
    source.indexOf('const reconcile=async()=>'));
  assert.ok(confirm.indexOf('batchEndpoint(id)') < confirm.indexOf("'upload-image'"),
    'Batch-readiness must happen before any image upload');
  assert.match(confirm, /startedD1Submission=true/);
  assert.match(confirm, /if\(startedD1Submission\)setUncertain\(true\)/);
  const reconcile = source.slice(source.indexOf('const reconcile=async()=>'));
  assert.match(reconcile, /if\(batchNotFound\(e\)\)/);
  assert.match(reconcile, /setUncertain\(false\)/);
});
