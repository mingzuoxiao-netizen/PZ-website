import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFactoryCategoryRequests } from './factoryCategoryProduction.mjs';

function fixture(role = 'FACTORY') {
  const records = [];
  const writes = [];
  const imageKeys = new Set(['uploads/test-sofa.webp']);
  const store = {
    'draft:site_config': JSON.stringify({ categories: [{ id: 'tables', title: 'Tables' }] }),
    'published:site_config': JSON.stringify({ categories: [{ id: 'tables', title: 'Tables' }] })
  };
  const env = {
    PZ_RUNTIME_ENV: 'production',
    SITE_CONFIG_KV: { get: async key => store[key] || null },
    PRODUCT_IMAGES: { head: async key => imageKeys.has(key) ? { key } : null },
    DB: {
      prepare(sql) {
        let params = [];
        return {
          bind(...args) { params = args; return this; },
          async all() {
            assert.match(sql, /^SELECT title FROM category_requests/);
            return { results: records.map(r => ({ title: r.title })) };
          },
          async run() {
            assert.match(sql, /^INSERT INTO category_requests/);
            assert.ok(!sql.includes('user_id'));
            assert.ok(!sql.includes('description'));
            const [id, title, title_cn, subtitle, image, created_at, updated_at] = params;
            records.push({ id, title, title_cn, subtitle, image, created_at, updated_at, status: 'pending' });
            writes.push('pending');
            return { meta: { changes: 1 } };
          }
        };
      }
    }
  };
  const helpers = {
    authorize: async (_req, _env, roles) => role === 'ANONYMOUS'
      ? new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      : roles.includes(role) ? { user: { id: 'factory-user-1', role } }
      : new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    json: (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
    badRequest: message => new Response(JSON.stringify({ error: message }), { status: 400 }),
    pzConfiguredImageBase: () => 'https://cdn.peng-zhan.com'
  };
  const request = (path, body, method = 'POST') => handleFactoryCategoryRequests({
    request: new Request('https://api-staging.example' + path, {
      method, headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    }),
    env, pathname: path, ...helpers
  });
  const sample = {
    title: 'Sofa', title_cn: '沙发', subtitle: 'Upholstered seating',
    image: 'https://cdn.peng-zhan.com/uploads%2Ftest-sofa.webp'
  };
  return { env, request, sample, store, records, writes };
}

test('FACTORY creates a pending review request with exact legacy eight-column schema', async () => {
  const f = fixture();
  const before = structuredClone(f.store);
  const response = await f.request('/factory/category-requests', f.sample);
  assert.equal(response.status, 201);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.status, 'pending');
  assert.ok(data.id);
  assert.equal(f.records[0].title_cn, '沙发');
  assert.equal(f.records[0].subtitle, 'Upholstered seating');
  assert.deepEqual(f.writes, ['pending']);
  assert.deepEqual(f.store, before, 'No category is published before admin approval');
});

test('FACTORY no longer requires a nonexistent draft/submit endpoint', async () => {
  const f = fixture();
  const response = await f.request('/factory/category-requests/abcd/submit');
  assert.equal(response, null);
  assert.equal(f.writes.length, 0);
});
test('anonymous access is rejected', async () => {
  const f = fixture('ANONYMOUS');
  const r = await f.request('/factory/category-requests', f.sample);
  assert.equal(r.status, 401);
  assert.equal(f.writes.length, 0);
});
test('staging runtime fails closed', async () => {
  const f = fixture();
  f.env.PZ_RUNTIME_ENV = 'staging';
  const r = await f.request('/factory/category-requests', f.sample);
  assert.equal(r.status, 403);
  assert.equal(f.writes.length, 0);
});
test('wrong image host and missing Staging R2 image are rejected', async () => {
  const f = fixture();
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, image: 'https://outside.example/uploads/test-sofa.webp' })).status, 400);
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, image: 'https://cdn.peng-zhan.com/uploads%2Fmissing.webp' })).status, 400);
  assert.equal(f.records.length, 0);
});
test('duplicate request titles and slugs are rejected', async () => {
  const f = fixture();
  assert.equal((await f.request('/factory/category-requests', f.sample)).status, 201);
  assert.equal((await f.request('/factory/category-requests', f.sample)).status, 409);
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, title: 'SoFa!' })).status, 409);
});
test('category already present in published or draft registry is rejected', async () => {
  const f = fixture();
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, title: 'Tables' })).status, 409);
  assert.equal(f.writes.length, 0);
});
test('missing draft registry blocks creating requests that cannot publish safely', async () => {
  const f = fixture();
  delete f.store['draft:site_config'];
  const r = await f.request('/factory/category-requests', f.sample);
  assert.equal(r.status, 503);
  assert.equal(f.writes.length, 0);
});
test('invalid English name and overlong subtitle are rejected', async () => {
  const f = fixture();
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, title: '沙发' })).status, 400);
  assert.equal((await f.request('/factory/category-requests', { ...f.sample, subtitle: 'x'.repeat(201) })).status, 400);
});
test('non-category routes are not intercepted', async () => {
  const f = fixture();
  assert.equal(await f.request('/factory/products', f.sample), null);
});

test('an existing approved production category remains untouched and prevents duplicate creation', async () => {
  const f = fixture();
  f.records.push({ id: 'already-approved', title: 'Sofa', status: 'approved', image: 'https://cdn.peng-zhan.com/uploads/previous.webp' });
  const before = structuredClone(f.records);
  const response = await f.request('/factory/category-requests', f.sample);
  assert.equal(response.status, 409);
  assert.deepEqual(f.records, before);
  assert.equal(f.writes.length, 0);
});
test('wrong production image host fails even if helper is unexpectedly misconfigured', async () => {
  const f = fixture();
  f.env.PZ_RUNTIME_ENV = 'production';
  const response = await f.request('/factory/category-requests', { ...f.sample, image: 'https://pub-something.r2.dev/uploads/test-sofa.webp' });
  assert.equal(response.status, 400);
  assert.equal(f.writes.length, 0);
});
