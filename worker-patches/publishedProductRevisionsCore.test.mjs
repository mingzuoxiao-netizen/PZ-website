import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pzPublishedProductRevisionsFetch} from './publishedProductRevisionsCore.mjs';
import {pzValidateTechnicalSpecs} from './productSpecificationsCore.mjs';

function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER);"+
    "CREATE TABLE products(id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,material TEXT,"+
    "size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,images TEXT,production_sites TEXT,"+
    "specs_json TEXT NOT NULL DEFAULT '{}',created_by TEXT,status TEXT,created_at TEXT,updated_at TEXT);");
  sql.exec("INSERT INTO users VALUES('admin','owner','admin',1),('lead','lead','factory',1),"+
    "('otherlead','otherlead','factory',1),('worker','worker','factory',1),('outsider','outsider','factory',1);");
  for(const file of [
    '009_department_accounts_REVIEW.sql',
    '010_two_stage_product_review_REVIEW.sql',
    '012_published_product_revisions_STAGING_REVIEW.sql'
  ])sql.exec(readFileSync(new URL('./migrations/'+file,import.meta.url),'utf8'));
  sql.exec("INSERT INTO pz_departments(id,name,factory_site,is_active,created_by,created_at) VALUES "+
    "('d1','Dept','zhaoqing',1,'admin','2026-01-01'),('d2','Other','kandal',1,'admin','2026-01-01');"+
    "INSERT INTO pz_staff_assignments(user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) VALUES "+
    "('lead','d1',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
    "('otherlead','d2',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
    "('worker','d1','lead','staff','admin','2026-01-01','2026-01-01'),"+
    "('outsider','d2','otherlead','staff','admin','2026-01-01','2026-01-01');");
  sql.exec("INSERT INTO products(id,name,name_cn,category,sub_category,material,size,finish,code,"+
    "description,description_cn,images,production_sites,specs_json,created_by,status,created_at,updated_at) VALUES "+
    "('p1','Old Table','旧桌','tables','','White Oak','180 cm','matte','PZ-TABLE-01',"+
    "'Old approved description','旧描述','[\"https://cdn.peng-zhan.com/uploads/old.webp\"]',"+
    "'[\"zhaoqing\"]','{}','worker','published','2026-01-01T00:00:00Z','2026-01-02T00:00:00Z')");
  const db={
    prepare(text){let args=[];return {
      bind(...p){args=p;return this;},
      async first(){return sql.prepare(text).get(...args)||null;},
      async all(){return {results:sql.prepare(text).all(...args)};},
      async run(){return {meta:{changes:Number(sql.prepare(text).run(...args).changes)}};},
      _run(){return {meta:{changes:Number(sql.prepare(text).run(...args).changes)}};}
    };},
    async batch(statements){
      sql.exec('BEGIN');
      try{const result=statements.map(s=>s._run());sql.exec('COMMIT');return result;}
      catch(err){sql.exec('ROLLBACK');throw err;}
    }
  };
  const env={
    DB:db,PZ_PRODUCT_REVISIONS_ENABLED:'true',
    PZ_TWO_STAGE_REVIEW_ENABLED:'true',PZ_ORG_RBAC_ENABLED:'true',
    PRODUCT_IMAGES:{async head(key){return key==='uploads/new.webp'?{size:32}:null;}}
  };
  const publish={calls:0,fail:false};
  const originalFetch=async req=>{
    if(new URL(req.url).pathname==='/admin/publish/products'){
      publish.calls++;
      return Response.json({success:!publish.fail},{status:publish.fail?503:200});
    }
    return Response.json({error:'Unknown path'},{status:404});
  };
  const authorize=async(req,_,roles)=>{
    const actor=req.headers.get('x-actor')||'anonymous';
    const role=actor==='admin'?'ADMIN':actor==='lead'||actor==='otherlead'?'SUPERVISOR':
      actor==='worker'||actor==='outsider'?'FACTORY':null;
    if(!role)return Response.json({error:'Unauthorized'},{status:401});
    if(!roles.includes(role))return Response.json({error:'Forbidden'},{status:403});
    return {user:{id:actor,role}};
  };
  const api=pzPublishedProductRevisionsFetch(originalFetch,{
    authorize,json:(payload,status=200)=>Response.json(payload,{status}),
    validateSpecs:pzValidateTechnicalSpecs,imageBase:()=>'https://cdn.peng-zhan.com'
  });
  async function call(path,actor='worker',method='GET',body){
    const response=await api(new Request('https://staging.example'+path,{
      method,headers:{'x-actor':actor,Authorization:'Bearer test-token',
        ...(method==='POST'||method==='PUT'?{'Content-Type':'application/json'}:{})},
      ...(method==='POST'||method==='PUT'?{body:JSON.stringify(body??{})}:{})
    }),env,{});
    return {status:response.status,data:await response.json()};
  }
  const product=()=>sql.prepare("SELECT * FROM products WHERE id='p1'").get();
  return {sql,env,call,product,publish};
}

test('published revision leaves original live SKU untouched until admin explicitly publishes',async()=>{
  const {sql,call,product,publish}=setup();
  const old=structuredClone(product());
  const created=await call('/factory/products/p1/revisions','worker','POST',{
    draft:{name:'Revised Table',description:'New customer copy',size:'200 cm',
      images:['https://cdn.peng-zhan.com/uploads/old.webp'],specifications:{schema_version:1,net_weight_kg:40}}
  });
  assert.equal(created.status,201,JSON.stringify(created.data));
  const rid=created.data.id;
  assert.equal(product().name,old.name);
  assert.equal(product().images,old.images);
  assert.equal(product().status,'published');
  assert.equal((await call('/factory/products/p1/revisions','worker','POST',{})).status,409,'only one active revision');

  const badUpdate=await call('/factory/revisions/'+rid,'worker','PUT',{
    expected_draft_revision:999,draft:{name:'Stale update'}
  });
  assert.equal(badUpdate.status,409);
  assert.equal((await call('/factory/revisions/'+rid,'worker','PUT',{
    expected_draft_revision:1,draft:{name:'New Oak Table',size:'220 cm'}
  })).data.draft_revision,2);
  assert.equal((await call('/factory/revisions/'+rid,'worker','PUT',{
    expected_draft_revision:1,draft:{name:'Race'}
  })).status,409);
  assert.equal(product().name,old.name);
  const submitted=await call('/factory/revisions/'+rid+'/submit','worker','POST',{});
  assert.equal(submitted.data.status,'pending_supervisor',JSON.stringify(submitted.data));
  assert.equal(product().status,'published');
  assert.equal((await call('/factory/revisions/'+rid,'worker','PUT',{
    expected_draft_revision:2,draft:{name:'Tamper'}
  })).status,409);
  assert.equal((await call('/admin/revisions/'+rid+'/publish','admin','POST',{})).status,409);
  assert.equal((await call('/supervisor/revisions/'+rid+'/approve','otherlead','POST',{})).status,403);
  assert.equal((await call('/supervisor/revisions/'+rid+'/approve','lead','POST',{})).data.status,'pending_admin');
  assert.equal((await call('/admin/revisions/'+rid+'/approve','worker','POST',{})).status,403);
  assert.equal((await call('/admin/revisions/'+rid+'/approve','admin','POST',{})).data.status,'approved_pending_publish');
  assert.equal(product().name,old.name,'admin approval alone must NOT change the public product');
  assert.equal(publish.calls,0,'no catalog republish until explicit action');
  const published=await call('/admin/revisions/'+rid+'/publish','admin','POST',{});
  assert.equal(published.status,200,JSON.stringify(published.data));
  assert.equal(published.data.catalog_published,true);
  assert.equal(publish.calls,1);
  assert.equal(product().name,'New Oak Table');
  assert.equal(product().size,'220 cm');
  assert.equal(product().status,'published');
  assert.equal(product().code,old.code,'SKU remains immutable');
  assert.equal(product().created_by,old.created_by,'product owner preserved');
  const detail=await call('/admin/revisions/'+rid,'admin');
  assert.equal(detail.data.versions.length,1);
  assert.equal(detail.data.versions[0].snapshot.name,'New Oak Table');
  assert.equal(detail.data.base_snapshot.name,'Old Table');
  assert.equal(detail.data.events.length,4);
  assert.throws(()=>sql.prepare("UPDATE pz_published_revision_versions SET snapshot_json='{}' WHERE revision_id=?").run(rid),/immutable/i);
  assert.throws(()=>sql.prepare("DELETE FROM pz_published_revision_events WHERE revision_id=?").run(rid),/immutable/i);
});

test('admin return routes to supervisor, correction draft stays isolated, immutable version 1 survives version 2',async()=>{
  const {call,product}=setup();
  const c=await call('/factory/products/p1/revisions','worker','POST',{draft:{name:'Revision A'}});
  assert.equal(c.status,201,JSON.stringify(c.data));
  const id=c.data.id;
  assert.equal((await call('/factory/revisions/'+id+'/submit','worker','POST',{})).status,200);
  assert.equal((await call('/supervisor/revisions/'+id+'/approve','lead','POST',{})).status,200);
  assert.equal((await call('/admin/revisions/'+id+'/return','admin','POST',{note:'Fix material description'})).data.status,'returned_to_supervisor');
  assert.equal((await call('/factory/revisions/'+id,'worker','PUT',{
    expected_draft_revision:1,draft:{name:'Premature correction'}
  })).status,409);
  assert.equal((await call('/supervisor/revisions/'+id+'/request-correction','lead','POST',{note:'Please fix material'})).data.status,'returned_to_uploader');
  assert.equal((await call('/factory/revisions/'+id,'worker','PUT',{
    expected_draft_revision:1,draft:{name:'Revision B'}
  })).status,200);
  assert.equal((await call('/factory/revisions/'+id+'/submit','worker','POST',{})).data.version,2);
  const before=await call('/admin/revisions/'+id,'admin');
  assert.equal(before.data.versions[0].snapshot.name,'Revision A');
  assert.equal(before.data.versions[1].snapshot.name,'Revision B');
  assert.equal(product().name,'Old Table');
  assert.equal((await call('/admin/revisions/'+id+'/approve','admin','POST',{})).status,409);
  assert.equal((await call('/supervisor/revisions/'+id+'/approve','lead','POST',{})).status,200);
  assert.equal((await call('/admin/revisions/'+id+'/approve','admin','POST',{})).status,200);
  assert.equal((await call('/admin/revisions/'+id+'/publish','admin','POST',{})).status,200);
  assert.equal(product().name,'Revision B');
});

test('draft ownership, financial data and images fail closed',async()=>{
  const {call,env,product}=setup();
  assert.equal((await call('/factory/products/p1/revisions','outsider','POST',{})).status,403);
  assert.equal((await call('/factory/products/p1/revisions','admin','POST',{})).status,403);
  assert.equal((await call('/factory/products/p1/revisions','worker','POST',{
    draft:{price:10}
  })).status,400);
  assert.equal((await call('/factory/products/p1/revisions','worker','POST',{
    draft:{specifications:{schema_version:1,cost:15}}
  })).status,400);
  assert.equal((await call('/factory/products/p1/revisions','worker','POST',{
    draft:{images:['https://random.example/image.png']}
  })).status,400);
  assert.equal((await call('/factory/products/p1/revisions','worker','POST',{
    draft:{images:['https://cdn.peng-zhan.com/uploads/not-found.webp']}
  })).status,400);
  const valid=await call('/factory/products/p1/revisions','worker','POST',{
    draft:{images:['https://cdn.peng-zhan.com/uploads/old.webp','https://cdn.peng-zhan.com/uploads/new.webp']}
  });
  assert.equal(valid.status,201,JSON.stringify(valid.data));
  assert.equal((await call('/factory/revisions/'+valid.data.id,'outsider')).status,403);
  assert.equal((await call('/supervisor/revisions/'+valid.data.id,'otherlead')).status,403);
  assert.equal((await call('/admin/revisions/'+valid.data.id,'admin')).status,200);
  assert.equal(product().images,'["https://cdn.peng-zhan.com/uploads/old.webp"]');
  env.PZ_PRODUCT_REVISIONS_ENABLED='false';
  assert.equal((await call('/factory/revisions','worker')).status,404);
});

test('published product version race blocks every review transition before live changes',async()=>{
  const {sql,call,product,publish}=setup();
  const created=await call('/factory/products/p1/revisions','worker','POST',{draft:{name:'Should not publish'}});
  const id=created.data.id;
  sql.prepare("UPDATE products SET updated_at=? WHERE id='p1'").run('2026-04-03T00:00:00Z');
  assert.equal((await call('/factory/revisions/'+id+'/submit','worker','POST',{})).status,409);
  assert.equal(product().name,'Old Table');
  assert.equal(publish.calls,0);
});

test('catalog refresh failure is explicit and retry does not reapply a revision',async()=>{
  const {call,product,publish}=setup();
  const c=await call('/factory/products/p1/revisions','worker','POST',{draft:{name:'Refresh retry'}});
  const id=c.data.id;
  await call('/factory/revisions/'+id+'/submit','worker','POST',{});
  await call('/supervisor/revisions/'+id+'/approve','lead','POST',{});
  await call('/admin/revisions/'+id+'/approve','admin','POST',{});
  publish.fail=true;
  const first=await call('/admin/revisions/'+id+'/publish','admin','POST',{});
  assert.equal(first.status,503);
  assert.equal(product().name,'Refresh retry');
  publish.fail=false;
  const retry=await call('/admin/revisions/'+id+'/publish','admin','POST',{});
  assert.equal(retry.status,200);
  assert.equal(publish.calls,2);
  assert.equal(product().name,'Refresh retry');
});
