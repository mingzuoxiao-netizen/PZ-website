import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleFactoryCategoryRequests } from './factoryCategoryStaging.mjs';

function createFixture(role = 'FACTORY') {
  const records = [];
  const writes = [];
  const images = new Set(['uploads/test-sofa.webp']);
  const kv = {
    'draft:site_config': JSON.stringify({ categories: [{ id: 'tables', title: 'Tables' }] }),
    'published:site_config': JSON.stringify({ categories: [{ id: 'tables', title: 'Tables' }] })
  };
  const env = {
    PZ_RUNTIME_ENV: 'staging',
    PRODUCT_IMAGES: { head: async key => images.has(key) ? { key } : null },
    SITE_CONFIG_KV: { get: async key => kv[key] || null },
    DB: {
      prepare(sql) {
        let params = [];
        return {
          bind(...values) { params = values; return this; },
          async first() {
            if (sql.includes('SELECT id FROM category_requests')) {
              return records.find(r => r.title.toLowerCase() === params[0].toLowerCase()
                && ['draft','awaiting_review','approved'].includes(r.status)) || null;
            }
            throw new Error('Unexpected select: ' + sql);
          },
          async run() {
            if (sql.startsWith('INSERT INTO category_requests')) {
              const [id, title, title_cn, subtitle, description, image, status, user_id, created_at, updated_at] = params;
              records.push({ id, title, title_cn, subtitle, description, image, status, user_id, created_at, updated_at });
              writes.push('draft');
              return { meta: { changes: 1 } };
            }
            if (sql.startsWith("UPDATE category_requests SET status = 'awaiting_review'")) {
              const [updatedAt, id, userId] = params;
              const row = records.find(r => r.id === id && r.status === 'draft' && r.user_id === userId);
              if (!row) return { meta: { changes: 0 } };
              row.status = 'awaiting_review';
              row.updated_at = updatedAt;
              writes.push('awaiting_review');
              return { meta: { changes: 1 } };
            }
            throw new Error('Unexpected write: ' + sql);
          }
        };
      }
    }
  };
  const helpers = {
    authorize: async () => role === 'ANONYMOUS'
      ? new Response(JSON.stringify({error:'Unauthorized'}), {status:401})
      : { user: {id:'user-1', role} },
    json: (body, status = 200) => new Response(JSON.stringify(body), {status,headers:{'content-type':'application/json'}}),
    badRequest: error => new Response(JSON.stringify({error}), {status:400,headers:{'content-type':'application/json'}}),
    pzConfiguredImageBase: () => 'https://staging-images.example'
  };
  const call = (path, body, method='POST') => handleFactoryCategoryRequests({
    request:new Request('https://worker.staging.test'+path, {
      method, headers: {'content-type':'application/json'},
      ...(body === undefined ? {} : {body:JSON.stringify(body)})
    }),
    env, pathname:path, ...helpers
  });
  const item = {title:'Sofa',title_cn:'沙发',description:'Upholstered products',
    image:'https://staging-images.example/uploads%2Ftest-sofa.webp'};
  return {records,writes,kv,env,call,item};
}

test('create remains draft, submit enters review, without publishing public configuration', async () => {
  const f = createFixture();
  const result = await f.call('/factory/category-requests',f.item);
  assert.equal(result.status,201);
  const created = await result.json();
  assert.equal(created.status,'draft');
  assert.ok(created.id);
  assert.equal(f.records[0].title_cn,'沙发');
  assert.deepEqual(f.writes,['draft']);
  const before = JSON.parse(f.kv['published:site_config']);
  assert.equal(before.categories.length,1);
  const submit = await f.call('/factory/category-requests/'+created.id+'/submit');
  assert.equal(submit.status,200);
  assert.equal((await submit.json()).status,'awaiting_review');
  assert.deepEqual(f.writes,['draft','awaiting_review']);
  assert.deepEqual(JSON.parse(f.kv['published:site_config']),before);
  const retry = await f.call('/factory/category-requests/'+created.id+'/submit');
  assert.equal(retry.status,409);
});

test('anonymous user cannot create a category', async () => {
  const f=createFixture('ANONYMOUS');
  const res=await f.call('/factory/category-requests',f.item);
  assert.equal(res.status,401);
  assert.equal(f.records.length,0);
});
test('fake or external images are rejected without inserts', async () => {
  const f=createFixture();
  let res=await f.call('/factory/category-requests',{...f.item,image:'https://other.example/cover.webp'});
  assert.equal(res.status,400);
  res=await f.call('/factory/category-requests',{...f.item,image:'https://staging-images.example/uploads%2Fmissing.webp'});
  assert.equal(res.status,400);
  assert.equal(f.records.length,0);
});
test('duplicate pending category title is rejected', async () => {
  const f=createFixture();
  assert.equal((await f.call('/factory/category-requests',f.item)).status,201);
  assert.equal((await f.call('/factory/category-requests',f.item)).status,409);
});
test('a category that already exists in website configuration is rejected', async () => {
  const f=createFixture();
  const res=await f.call('/factory/category-requests',{...f.item,title:'Tables'});
  assert.equal(res.status,409);
});
test('non-category requests fall through to normal Worker routes', async () => {
  const f=createFixture();
  const res=await f.call('/factory/products',f.item);
  assert.equal(res,null);
});
