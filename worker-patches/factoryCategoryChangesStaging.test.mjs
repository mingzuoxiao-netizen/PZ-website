import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleCategoryChanges } from './factoryCategoryChangesStaging.mjs';

function fixture(role = 'FACTORY') {
  const storage = {
    'published:site_config': JSON.stringify({ categories: [
      { id: 'sofa', title:'Sofa', title_cn:'沙发', subtitle:'Seats', description:'Seats from PZ',
        image:'https://staging-images.example/uploads%2Fold.webp',
        subCategories:[{name:'Loveseat'}], custom:'preserve-me' }
    ] }),
    'draft:site_config': JSON.stringify({ categories: [
      { id: 'sofa', title:'Sofa', title_cn:'沙发', subtitle:'Seats', description:'Seats from PZ',
        image:'https://staging-images.example/uploads%2Fold.webp',
        subCategories:[{name:'Loveseat'}], custom:'preserve-me' }
    ] })
  };
  const records = [];
  const writes = [];
  const env = {
    PZ_RUNTIME_ENV: 'staging',
    SITE_CONFIG_KV: {
      get: async key=> storage[key] || null,
      put: async (key,value)=>{ writes.push('kv:'+key); storage[key]=value; }
    },
    PRODUCT_IMAGES: { head: async key=>key==='uploads/new.webp'?{key}:null },
    DB: {
      prepare(sql) {
        let args=[];
        return {
          bind(...items) {args=items;return this;},
          async all() {
            const found = sql.includes('WHERE created_by = ?') ? records.filter(r=>r.created_by===args[0]) : records;
            return { results:found.map(r=>({...r})) };
          },
          async first() { return records.find(r=>r.id===args[0]) || null; },
          async run() {
            if (sql.includes('INSERT INTO category_change_requests')) {
              const [id,category_id,base_json,proposed_json,created_by,created_at,updated_at]=args;
              if (records.some(r=>r.category_id===category_id && ['pending','applying'].includes(r.status)))
                throw Error('UNIQUE constraint failed');
              records.push({id,category_id,base_json,proposed_json,created_by,created_at,updated_at,status:'pending'});
              writes.push('db:insert');
              return {meta:{changes:1}};
            }
            if(sql.includes("status='pending'")) {
              const [id]=args;
              const record=records.find(r=>r.id===id&&r.status==='applying');
              if(record)record.status='pending';
              return {meta:{changes:record?1:0}};
            }
            if (sql.includes("status='approved'")) {
              const [reviewed_by,reviewed_at,updated_at,id]=args;
              const record=records.find(r=>r.id===id&&r.status==='applying');
              if(!record)return {meta:{changes:0}};
              Object.assign(record,{status:'approved',reviewed_by,reviewed_at,updated_at});
              return {meta:{changes:1}};
            }
            if (sql.includes("status='applying'")) {
              const [time,id]=args;
              const record=records.find(r=>r.id===id&&r.status==='pending');
              if (!record)return {meta:{changes:0}};
              record.status='applying';record.updated_at=time;
              return {meta:{changes:1}};
            }
            if (sql.includes("status='rejected'")) {
              const [reject_reason,reviewed_by,reviewed_at,updated_at,id]=args;
              const record=records.find(r=>r.id===id&&r.status==='pending');
              if(!record)return {meta:{changes:0}};
              Object.assign(record,{status:'rejected',reject_reason,reviewed_by,reviewed_at,updated_at});
              return {meta:{changes:1}};
            }
            throw Error('Unexpected query: '+sql);
          }
        };
      }
    }
  };
  const authorize = async()=>role==='ANONYMOUS'
    ?new Response('{}',{status:401})
    :{user:{id:'user-1',role}};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  const badRequest=value=>json({error:value},400);
  const call=(pathname,body,method='POST')=>handleCategoryChanges({
    request:new Request('https://staging.example'+pathname,{
      method,headers:{'content-type':'application/json'},
      ...(method==='GET'?{}:{body:JSON.stringify(body ?? {})})
    }),env,pathname,authorize,json,badRequest,pzConfiguredImageBase:()=> 'https://staging-images.example'
  });
  const proposal={category_id:'sofa',proposed:{title_cn:'精品沙发',image:'https://staging-images.example/uploads%2Fnew.webp'}};
  return {env,storage,records,writes,call,proposal};
}

test('factory amendment stays pending and never publishes',async()=>{
  const f=fixture();
  const original=structuredClone(f.storage);
  const r=await f.call('/factory/category-change-requests',f.proposal);
  assert.equal(r.status,201);
  assert.equal((await r.json()).status,'pending');
  assert.equal(f.records[0].status,'pending');
  assert.deepEqual(f.storage,original);
  assert.deepEqual(f.writes,['db:insert']);
});

test('production runtime cannot access staging handler',async()=>{
  const f=fixture();f.env.PZ_RUNTIME_ENV='production';
  assert.equal((await f.call('/factory/category-change-requests',f.proposal)).status,403);
  assert.equal(f.records.length,0);
});

test('anonymous request is rejected',async()=>{
  const f=fixture('ANONYMOUS');
  assert.equal((await f.call('/factory/category-change-requests',f.proposal)).status,401);
  assert.equal(f.records.length,0);
});

test('incorrect R2 origin and missing image fail without writing',async()=>{
  const f=fixture();
  assert.equal((await f.call('/factory/category-change-requests',{...f.proposal,proposed:{image:'https://cdn.peng-zhan.com/uploads%2Fnew.webp'}})).status,400);
  assert.equal((await f.call('/factory/category-change-requests',{...f.proposal,proposed:{image:'https://staging-images.example/uploads%2Fmissing.webp'}})).status,400);
  assert.equal(f.records.length,0);
});

test('duplicate pending amendment is blocked',async()=>{
  const f=fixture();
  assert.equal((await f.call('/factory/category-change-requests',f.proposal)).status,201);
  assert.equal((await f.call('/factory/category-change-requests',f.proposal)).status,409);
});

test('admin approval modifies draft only and preserves category identity',async()=>{
  const f=fixture();
  const initialPublished=f.storage['published:site_config'];
  const created=await(await f.call('/factory/category-change-requests',f.proposal)).json();
  const result=await f.call('/admin/category-change-requests/'+created.id+'/approve',{});
  assert.equal(result.status,200);
  assert.deepEqual(await result.json(),{success:true,id:created.id,status:'approved',needsPublish:true,published:false});
  assert.equal(f.storage['published:site_config'],initialPublished);
  const updated=JSON.parse(f.storage['draft:site_config']).categories[0];
  assert.equal(updated.id,'sofa');
  assert.equal(updated.title_cn,'精品沙发');
  assert.equal(updated.title_zh,'精品沙发');
  assert.deepEqual(updated.subCategories,[{name:'Loveseat'}]);
  assert.equal(updated.custom,'preserve-me');
  assert.equal(f.records[0].status,'approved');
  assert.equal((await f.call('/admin/category-change-requests/'+created.id+'/approve',{})).status,409);
});

test('stale changes conflict instead of overwriting admin edits',async()=>{
  const f=fixture();
  const created=await(await f.call('/factory/category-change-requests',f.proposal)).json();
  const draft=JSON.parse(f.storage['draft:site_config']);
  draft.categories[0].title='New admin edit';
  f.storage['draft:site_config']=JSON.stringify(draft);
  const r=await f.call('/admin/category-change-requests/'+created.id+'/approve',{});
  assert.equal(r.status,409);
  assert.equal(f.records[0].status,'pending');
  assert.equal(JSON.parse(f.storage['draft:site_config']).categories[0].title,'New admin edit');
});

test('admin can reject with reason without touching draft',async()=>{
  const f=fixture();
  const created=await(await f.call('/factory/category-change-requests',f.proposal)).json();
  const saved=structuredClone(f.storage);
  const result=await f.call('/admin/category-change-requests/'+created.id+'/reject',{reason:'图片不符合要求'});
  assert.equal((await result.json()).status,'rejected');
  assert.equal(f.records[0].reject_reason,'图片不符合要求');
  assert.deepEqual(f.storage,saved);
});
