import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { handlePublicProductsD1 } from './publicProductsD1.js';

function fixture() {
  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE products (
    id TEXT, name TEXT, name_cn TEXT, category TEXT, sub_category TEXT,
    material TEXT, size TEXT, code TEXT, description TEXT, description_cn TEXT,
    images TEXT, status TEXT, created_at TEXT, updated_at TEXT
  )`);
  const insert = db.prepare(`INSERT INTO products VALUES (${Array(14).fill('?').join(',')})`);
  insert.run('p1','Marlow Collection','马洛系列','tables','Dining','White Oak','180cm',
    'PZ-TABLE-01','solid wood','实木',JSON.stringify(['https://cdn.peng-zhan.com/a.jpg']),
    'published','2026-01-01','2026-11-11');
  insert.run('p2','Caven Collection','胡桃木茶几','cabinetry','Media','Walnut','70cm',
    'PZ-CAB-02','storage unit','储物',JSON.stringify(['https://cdn.peng-zhan.com/b.jpg']),
    'published','2026-01-02','2026-11-10');
  insert.run('draft','Internal Table','保密餐桌','tables','Dining','Oak','180cm',
    'PZ-SECRET','draft','草稿',JSON.stringify(['https://cdn.peng-zhan.com/c.jpg']),
    'draft','2026-01-03','2026-11-12');
  insert.run('image-less','Another Table','无图餐桌','tables','Dining','Oak','180cm',
    'PZ-NO-IMAGE','invalid','无图','[]','published','2026-01-03','2026-11-13');
  const env = { DB: {
    prepare(sql) {
      const stmt = db.prepare(sql);
      return {
        bind(...values) { return {
          all: async () => ({ results: stmt.all(...values) }),
          first: async () => stmt.get(...values),
        }; },
        all: async () => ({ results: stmt.all() }),
      };
    },
  } };
  return { db, env };
}

test('live D1 predicate matches EN category synonyms, Chinese names and SKU without exposing drafts', async () => {
  const { db, env } = fixture();
  try {
    for (const q of ['table', 'tables', '餐桌', '桌', 'PZ-TABLE-01']) {
      const response = await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&q=' + encodeURIComponent(q)), env);
      assert.equal(response.status, 200);
      assert.deepEqual((await response.json()).items.map(item => item.id), ['p1'], q);
    }
    for (const q of ['胡桃木茶几', 'walnut', 'cabinetry']) {
      const response = await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&q=' + encodeURIComponent(q)), env);
      assert.deepEqual((await response.json()).items.map(item => item.id), ['p2'], q);
    }
    const empty = await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&q=unknown-xyz'), env);
    assert.deepEqual((await empty.json()).items, []);
  } finally { db.close(); }
});

test('search changes do not alter public facets or keyset pagination', async () => {
  const { db, env } = fixture();
  try {
    const facets = await (await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&summary=categories'),env)).json();
    assert.equal(facets.categories.length, 2);
    assert.ok(facets.categories.every(row => row.count === 1));
    const first = await (await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&limit=1'),env)).json();
    assert.equal(first.items.length, 1);
    assert.equal(first.hasMore, true);
    const next = await (await handlePublicProductsD1(new Request('https://pz.test/public/products?v=2&limit=1&cursor=' + encodeURIComponent(first.nextCursor)),env)).json();
    assert.equal(next.items.length, 1);
    assert.equal(next.hasMore, false);
    assert.notEqual(first.items[0].id,next.items[0].id);
  } finally { db.close(); }
});
