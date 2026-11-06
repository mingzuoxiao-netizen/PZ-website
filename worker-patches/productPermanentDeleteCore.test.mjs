import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pzProductPermanentDeleteFetch} from './productPermanentDeleteCore.mjs';

function fixture(runtime='staging'){
  const sql=new DatabaseSync(':memory:');
  sql.exec(
    "PRAGMA foreign_keys=ON;"+
    "CREATE TABLE products(id TEXT PRIMARY KEY,code TEXT UNIQUE NOT NULL,name TEXT,status TEXT,updated_at TEXT NOT NULL);"+
    "CREATE TABLE pz_product_reviews(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT);"+
    "CREATE TABLE pz_published_product_revisions(id TEXT PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT);"+
    "CREATE TABLE pz_product_responsibilities(product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE RESTRICT);"+
    "CREATE TABLE pz_product_responsibility_events(id INTEGER PRIMARY KEY,product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT);"+
    "INSERT INTO products VALUES('draft','PZ-BIRCH-001','Birch','draft','2026-11-05T10:00:00Z');"+
    "INSERT INTO products VALUES('live','PZ-OAK-001','Oak','published','2026-11-05T10:00:00Z');"+
    "INSERT INTO products VALUES('queued','PZ-ASH-001','Ash','pending_admin','2026-11-05T10:00:00Z');"+
    "INSERT INTO products VALUES('offline','PZ-SAMAN-001','Saman','unpublished','2026-11-05T10:00:00Z');"
  );
  const DB={prepare(q){let args=[];return {
    bind(...values){args=values;return this;},
    async first(){return sql.prepare(q).get(...args)||null;},
    async all(){return{results:sql.prepare(q).all(...args)};},
    async run(){return{meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}
  }}};
  let forwarded=0,filesDeleted=0,kvWritten=0;
  const env={DB,PZ_RUNTIME_ENV:runtime,PZ_PERMANENT_SKU_DELETE_ENABLED:'true',
    PRODUCT_IMAGES:{async delete(){filesDeleted++;}},
    SITE_CONFIG_KV:{async put(){kvWritten++;}}
  };
  const route=pzProductPermanentDeleteFetch(async()=>{
    forwarded++;return Response.json({error:'not found'},{status:404});
  },{
    authorize:async(request,_,roles)=>{
      const id=request.headers.get('x-actor');
      if(!id)return Response.json({error:'Unauthorized'},{status:401});
      if(id!=='admin'||!roles.includes('ADMIN'))return Response.json({error:'Forbidden'},{status:403});
      return{user:{id:'admin',role:'ADMIN'}};
    },
    json:(payload,status=200)=>Response.json(payload,{status}),
    expectedRuntime:runtime
  });
  async function call(id,method='GET',payload,actor='admin'){
    const opts={method,headers:actor?{'x-actor':actor}:{}};
    if(payload){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(payload);}
    const res=await route(new Request(
      'https://worker.example/admin/products/'+id+'/permanent-delete',opts),env,{});
    return {status:res.status,body:await res.json()};
  }
  return {sql,env,call,state:()=>({forwarded,filesDeleted,kvWritten})};
}
const confirmation=(sku,version='2026-11-05T10:00:00Z')=>
  ({confirm_sku:sku,expected_updated_at:version});

test('admin hard-deletes unreferenced draft and makes SKU unique slot reusable',async()=>{
  const {sql,call,state}=fixture();
  const inspect=await call('draft');
  assert.equal(inspect.status,200);
  assert.equal(inspect.body.eligible,true);
  assert.equal(inspect.body.product.code,'PZ-BIRCH-001');
  const removed=await call('draft','POST',confirmation('PZ-BIRCH-001'));
  assert.equal(removed.status,200,JSON.stringify(removed.body));
  assert.equal(removed.body.sku_reusable,true);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM products WHERE code='PZ-BIRCH-001'").get().n,0);
  sql.prepare("INSERT INTO products VALUES ('newid','PZ-BIRCH-001','New SKU','draft','2026-11-06')").run();
  assert.equal(sql.prepare("SELECT id FROM products WHERE code='PZ-BIRCH-001'").get().id,'newid');
  assert.deepEqual(state(),{forwarded:0,filesDeleted:0,kvWritten:0});
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM products WHERE id='live'").get().n,1);
});

test('non-published, non-referenced unlisted record is permanently deletable',async()=>{
  const {sql,call}=fixture();
  assert.equal((await call('offline','POST',confirmation('PZ-SAMAN-001'))).status,200);
  assert.equal(sql.prepare("SELECT * FROM products WHERE id='offline'").get(),undefined);
});

test('published and in-review SKUs cannot be hard-deleted even if no image exists',async()=>{
  const {sql,call}=fixture();
  for(const [id,sku] of [['live','PZ-OAK-001'],['queued','PZ-ASH-001']]){
    const inspection=await call(id);
    assert.equal(inspection.body.eligible,false);
    assert.equal(inspection.body.code,'PRODUCT_NOT_ELIGIBLE');
    assert.equal((await call(id,'POST',confirmation(sku))).status,409);
  }
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM products').get().n,4);
});

test('review/revision/responsibility history blocks deletion without tampering with immutable audit',async()=>{
  const {sql,call}=fixture();
  const related=['pz_product_reviews','pz_published_product_revisions',
    'pz_product_responsibilities','pz_product_responsibility_events'];
  for(const [i,table] of related.entries()){
    const id='ref'+i,sku='PZ-REF-'+i;
    sql.prepare("INSERT INTO products VALUES (?,?,'Old','rejected','2026-11-05T10:00:00Z')").run(id,sku);
    if(table==='pz_product_responsibilities'){
      sql.prepare('INSERT INTO pz_product_responsibilities VALUES(?)').run(id);
    }else{
      sql.prepare('INSERT INTO '+table+'(id,product_id) VALUES(?,?)')
        .run(table==='pz_product_responsibility_events'?i:'history'+i,id);
    }
    assert.equal((await call(id)).body.code,'PRODUCT_HAS_HISTORY');
    assert.equal((await call(id,'POST',confirmation(sku))).status,409);
    assert.equal(sql.prepare('SELECT code FROM products WHERE id=?').get(id).code,sku);
  }
  assert.equal(sql.prepare('PRAGMA foreign_key_check').all().length,0);
});

test('no deletion with wrong confirmation, stale edit version or unexpected fields',async()=>{
  const {sql,call}=fixture();
  assert.equal((await call('draft','POST',confirmation('PZ-OAK-001'))).status,409);
  assert.equal((await call('draft','POST',confirmation('PZ-BIRCH-001','old'))).status,409);
  assert.equal((await call('draft','POST',{...confirmation('PZ-BIRCH-001'),force:true})).status,400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM products').get().n,4);
});

test('auth, runtime and flag are strict even for read-only eligibility check',async()=>{
  const {env,call}=fixture('staging');
  assert.equal((await call('draft','GET',undefined,null)).status,401);
  assert.equal((await call('draft','POST',confirmation('PZ-BIRCH-001'),'worker')).status,403);
  env.PZ_PERMANENT_SKU_DELETE_ENABLED='false';
  assert.equal((await call('draft')).status,404);
  env.PZ_PERMANENT_SKU_DELETE_ENABLED='true';
  env.PZ_RUNTIME_ENV='production';
  assert.equal((await call('draft')).status,403);
});

test('both Worker candidates have wrapped delete route BEFORE the audit middleware',()=>{
  for(const path of ['staging-worker-category-changes-REVIEW.js',
    'production-worker-category-governance-REVIEW.js']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/function pzProductPermanentDeleteFetch\(/);
    assert.match(source,/PZ_PERMANENT_SKU_DELETE_ENABLED/);
    assert.match(source,/action:"product.permanent_delete"/);
    assert.match(source,/index_default\.fetch=pzProductPermanentDeleteFetch/);
    assert.ok(source.indexOf('index_default.fetch=pzProductPermanentDeleteFetch')<
      source.indexOf('index_default.fetch = pzAuditCreateFetch'),
      'hard deletion must be captured by the existing before/after audit wrapper');
    assert.match(source,/Legacy direct admin product writes disabled during two-stage review/);
    assert.doesNotMatch(source,/PRODUCT_IMAGES\.delete\s*\(/);
  }
});
