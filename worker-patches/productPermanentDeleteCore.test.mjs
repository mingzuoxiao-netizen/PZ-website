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
  const DB={
    prepare(q){let args=[];return {
      bind(...values){args=values;return this;},
      async first(){return sql.prepare(q).get(...args)||null;},
      async all(){return{results:sql.prepare(q).all(...args)};},
      async run(){return{meta:{changes:Number(sql.prepare(q).run(...args).changes)}};},
      runSync(){return{meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}
    };},
    async batch(statements){
      sql.exec('BEGIN');
      try{const results=statements.map(stmt=>stmt.runSync());sql.exec('COMMIT');return results;}
      catch(error){sql.exec('ROLLBACK');throw error;}
    }
  };
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


function enableForce(f){
  const fields=[
    "catalog_hidden INTEGER DEFAULT 0","archived_at TEXT","name_cn TEXT DEFAULT ''",
    "category TEXT DEFAULT ''","sub_category TEXT DEFAULT ''","material TEXT DEFAULT ''",
    "size TEXT DEFAULT ''","finish TEXT DEFAULT ''","description TEXT DEFAULT ''",
    "description_cn TEXT DEFAULT ''","images TEXT DEFAULT '[]'",
    "production_sites TEXT DEFAULT '[]'","specs_json TEXT DEFAULT '{}'"
  ];
  for(const column of fields)f.sql.exec('ALTER TABLE products ADD COLUMN '+column);
  f.sql.exec(readFileSync(new URL('./migrations/016_admin_product_retirement_REVIEW.sql',import.meta.url),'utf8'));
  f.env.PZ_FORCE_PRODUCT_RETIRE_ENABLED='true';
  return f;
}
const forceBody=sku=>({...confirmation(sku),force:true});

test('Admin can force-remove published SKU with review history; audit references survive and SKU is reusable',async()=>{
  const f=enableForce(fixture());
  f.sql.prepare("INSERT INTO pz_product_reviews VALUES('review-live','live')").run();
  const pre=await f.call('live');
  assert.equal(pre.status,200);
  assert.equal(pre.body.eligible,true);
  assert.equal(pre.body.force_enabled,true);
  assert.equal(pre.body.disposal_mode,'audit_tombstone');
  const done=await f.call('live','POST',forceBody('PZ-OAK-001'));
  assert.equal(done.status,200,JSON.stringify(done.body));
  assert.equal(done.body.sku_reusable,true);
  assert.equal(done.body.disposal_mode,'audit_tombstone');
  assert.equal(done.body.physically_removed,false);
  assert.equal(done.body.history_retained,true);
  assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM products WHERE code='PZ-OAK-001'").get().n,0);
  const row=f.sql.prepare("SELECT * FROM products WHERE id='live'").get();
  assert.equal(row.status,'archived');
  assert.equal(row.catalog_hidden,1);
  assert.equal(row.images,'[]');
  assert.ok(row.deleted_at);
  assert.equal(row.deleted_by,'admin');
  assert.match(row.code,/^PZ-DEL-[0-9A-F]{32}$/);
  assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM pz_product_reviews WHERE product_id='live'").get().n,1);
  const receipt=f.sql.prepare("SELECT * FROM pz_product_retirements WHERE product_id='live'").get();
  assert.equal(receipt.original_sku,'PZ-OAK-001');
  assert.equal(receipt.actor_id,'admin');
  assert.equal(f.sql.prepare('PRAGMA foreign_key_check').all().length,0);
  f.sql.prepare("INSERT INTO products(id,code,name,status,updated_at) VALUES('newlive','PZ-OAK-001','New Oak','draft','2026-11-10')").run();
  assert.ok(f.sql.prepare("SELECT id FROM products WHERE code='PZ-OAK-001'").get());
  assert.throws(()=>f.sql.prepare("UPDATE products SET status='published' WHERE id='live'").run(),/tombstone is immutable/);
  assert.throws(()=>f.sql.prepare("DELETE FROM pz_product_retirements WHERE product_id='live'").run(),/immutable/);
  assert.deepEqual(f.state(),{forwarded:0,filesDeleted:0,kvWritten:0});
  f.sql.close();
});

test('Pending workflow SKU can be removed without FK violations, never touches immutable history',async()=>{
  const f=enableForce(fixture());
  f.sql.prepare("INSERT INTO pz_product_reviews VALUES('review-queued','queued')").run();
  const result=await f.call('queued','POST',forceBody('PZ-ASH-001'));
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.disposal_mode,'audit_tombstone');
  assert.equal(f.sql.prepare("SELECT status FROM products WHERE id='queued'").get().status,'archived');
  assert.equal(f.sql.prepare('PRAGMA foreign_key_check').all().length,0);
  f.sql.close();
});

test('Safe unreferenced draft is physically deleted when force is enabled',async()=>{
  const f=enableForce(fixture());
  const result=await f.call('draft','POST',forceBody('PZ-BIRCH-001'));
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.disposal_mode,'physical');
  assert.equal(result.body.physically_removed,true);
  assert.equal(f.sql.prepare("SELECT * FROM products WHERE id='draft'").get(),undefined);
  assert.equal(f.sql.prepare("SELECT COUNT(*) AS n FROM pz_product_retirements").get().n,0);
  f.sql.close();
});

test('Even an unreferenced formerly-published SKU keeps a hidden tombstone to block legacy cached exposure',async()=>{
  const f=enableForce(fixture());
  const result=await f.call('live','POST',forceBody('PZ-OAK-001'));
  assert.equal(result.status,200,JSON.stringify(result.body));
  assert.equal(result.body.disposal_mode,'audit_tombstone');
  assert.equal(f.sql.prepare("SELECT catalog_hidden,deleted_at FROM products WHERE id='live'").get().catalog_hidden,1);
  f.sql.close();
});

test('Force delete fails closed without migration or enable flag; never removes a live product',async()=>{
  const f=fixture();
  f.env.PZ_FORCE_PRODUCT_RETIRE_ENABLED='true';
  const result=await f.call('live','POST',forceBody('PZ-OAK-001'));
  assert.equal(result.status,503);
  assert.equal(result.body.code,'FORCE_DELETE_NOT_READY');
  assert.ok(f.sql.prepare("SELECT id FROM products WHERE id='live'").get());
  enableForce(f);
  f.env.PZ_FORCE_PRODUCT_RETIRE_ENABLED='false';
  const again=await f.call('live','POST',forceBody('PZ-OAK-001'));
  assert.equal(again.status,503);
  assert.ok(f.sql.prepare("SELECT id FROM products WHERE id='live'").get());
  f.sql.close();
});

test('Force remove uses preflight version and SKU even with history; no R2 object is deleted',async()=>{
  const f=enableForce(fixture());
  f.sql.prepare("INSERT INTO pz_product_reviews VALUES('review-live','live')").run();
  assert.equal((await f.call('live','POST',{...forceBody('PZ-OAK-001'),expected_updated_at:'stale'})).status,409);
  assert.equal((await f.call('live','POST',forceBody('PZ-NOT-REAL'))).status,409);
  const ok=await f.call('live','POST',forceBody('PZ-OAK-001'));
  assert.equal(ok.status,200);
  assert.equal((await f.call('live','POST',forceBody('PZ-OAK-001'))).status,410);
  assert.equal(f.sql.prepare('PRAGMA foreign_key_check').all().length,0);
  f.sql.close();
});

test('Force capability endpoint requires ADMIN and reports migration state accurately',async()=>{
  const f=fixture();
  const request=(actor)=>new Request('https://worker.example/admin/product-delete/capabilities',{
    headers:actor?{'x-actor':actor}:{}
  });
  const call=async(actor)=>{
    const route=pzProductPermanentDeleteFetch(async()=>Response.json({error:'forward'}, {status:404}),{
      authorize:async(request)=>request.headers.get('x-actor')==='admin'?
        {user:{id:'admin'}}:Response.json({error:'Forbidden'},{status:403}),
      json:(body,status=200)=>Response.json(body,{status}),expectedRuntime:'staging'
    });
    const res=await route(request(actor),f.env,{});
    return{status:res.status,body:await res.json()};
  };
  assert.equal((await call('staff')).status,403);
  assert.equal((await call('admin')).body.force_available,false);
  enableForce(f);
  assert.equal((await call('admin')).body.force_available,true);
  f.sql.close();
});

test('both standalone Worker bundles hide force-retired products from Admin/factory and review work lists',()=>{
  for(const path of ['staging-worker-category-changes-REVIEW.js','production-worker-admin-delete-v2-COPY.js']){
    const source=readFileSync(new URL(path,import.meta.url),'utf8');
    assert.match(source,/forceAvailable\(env\)/);
    assert.match(source,/PZ_FORCE_PRODUCT_RETIRE_ENABLED/);
    assert.match(source,/WHERE deleted_at IS NULL AND/);
    assert.match(source,/JOIN products p ON p\.id=r\.product_id AND p\.deleted_at IS NULL/);
    assert.doesNotMatch(source,/PRODUCT_IMAGES\.delete\s*\(/);
  }
});
