import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { pzTwoStageReviewFetch } from './productTwoStageReviewCore.mjs';

function setup() {
 const sql=new DatabaseSync(':memory:');
 sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER);"+
   "CREATE TABLE products(id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,material TEXT,"+
   "size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,images TEXT,production_sites TEXT,"+
   "created_by TEXT,status TEXT,created_at TEXT,updated_at TEXT);");
 sql.exec("INSERT INTO users VALUES('admin','owner','admin',1),('lead','lead','factory',1),"+
   "('otherlead','otherlead','factory',1),('worker','worker','factory',1),('outsider','outsider','factory',1);");
 sql.exec(readFileSync(new URL('./migrations/009_department_accounts_REVIEW.sql',import.meta.url),'utf8'));
 sql.exec("INSERT INTO pz_departments(id,name,factory_site,is_active,created_by,created_at) VALUES "+
  "('dept1','Sales','zhaoqing',1,'admin','2026-01-01'),('dept2','Other','kandal',1,'admin','2026-01-01');"+
  "INSERT INTO pz_staff_assignments(user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) VALUES "+
  "('lead','dept1',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
  "('otherlead','dept2',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
  "('worker','dept1','lead','staff','admin','2026-01-01','2026-01-01'),"+
  "('outsider','dept2','otherlead','staff','admin','2026-01-01','2026-01-01');");
 sql.exec(readFileSync(new URL('./migrations/010_two_stage_product_review_REVIEW.sql',import.meta.url),'utf8'));
 sql.exec(readFileSync(new URL('./migrations/011_structured_product_specifications_STAGING_REVIEW.sql',import.meta.url),'utf8'));
 sql.exec("INSERT INTO products(id,name,name_cn,category,sub_category,material,size,finish,code,description,description_cn,images,production_sites,created_by,status,created_at,updated_at)"+
 " VALUES('p1','Oak Counter','橡木台面','countertop','','oak','6ft','matte','PZ-OAK-01','desc','描述','[\"a.jpg\"]','[\"zhaoqing\"]','worker','draft','2026-01-01','2026-01-01')");
 sql.prepare("UPDATE products SET specs_json=? WHERE id='p1'").run(JSON.stringify({schema_version:1,dimensions_cm:{length:180,width:80,thickness:4}}));
 const db={
  prepare(sqlText){let args=[];return{bind(...v){args=v;return this;},
    async first(){return sql.prepare(sqlText).get(...args)||null;},
    async all(){return {results:sql.prepare(sqlText).all(...args)};},
    async run(){return {meta:{changes:Number(sql.prepare(sqlText).run(...args).changes)}};},
    _run(){return sql.prepare(sqlText).run(...args);}};},
  async batch(stmts){
   sql.exec('BEGIN');
   try{const outcome=stmts.map(s=>({meta:{changes:Number(s._run().changes)}}));sql.exec('COMMIT');return outcome;}
   catch(e){sql.exec('ROLLBACK');throw e;}
  }
 };
 const env={PZ_ORG_RBAC_ENABLED:'true',PZ_TWO_STAGE_REVIEW_ENABLED:'true',DB:db};
 const json=(body,status=200)=>Response.json(body,{status});
 const legacy=[];
 const legacyFetch=async request=>{legacy.push(new URL(request.url).pathname);return json({success:true},200)};
 const authorize=async(request,_,roles)=>{
  const id=request.headers.get('x-actor')||'anonymous';
  const role=id==='admin'?'ADMIN':id==='lead'||id==='otherlead'?'SUPERVISOR':id==='worker'||id==='outsider'?'FACTORY':null;
  if(!role)return json({error:'Unauthorized'},401);
  if(!roles.includes(role))return json({error:'Forbidden'},403);
  return {user:{id,role}};
 };
 const api=pzTwoStageReviewFetch(legacyFetch,{authorize,json});
 async function call(path,actor='worker',method='GET',body){
  const request=new Request('https://staging.example'+path,{
   method,headers:{'x-actor':actor,'Authorization':'Bearer synthetic-test-token',
    ...(body?{'content-type':'application/json'}:{})},
   ...(body?{body:JSON.stringify(body)}:{})
  });
  const response=await api(request,env,{});
  return {status:response.status,data:await response.json()};
 }
 return{sql,env,call,legacy};
}

test('factory submit => supervisor approve => admin approve => explicit publish',async()=>{
 const {sql,call,legacy}=setup();
 const s=await call('/factory/products/p1/submit','worker','POST');
 assert.equal(s.status,200);
 assert.equal(s.data.status,'pending_supervisor');
 const repeated=await call('/factory/products/p1/submit','worker','POST');
 assert.equal(repeated.status,409);
 assert.equal(repeated.data.code,'PRODUCT_REVIEW_STATE_CONFLICT');
 assert.equal(repeated.data.current_status,'pending_supervisor');
 const rid=s.data.id;
 assert.equal(sql.prepare('SELECT status FROM products WHERE id=?').get('p1').status,'pending_supervisor');
 assert.equal((await call('/admin/products/p1','admin','PUT',{status:'published'})).status,409);
 assert.equal((await call('/admin/products/p1/remove-image','admin','POST',{key:'a.jpg',deleteFromCloud:true})).status,409);
 assert.equal((await call('/admin/products','admin','POST',{name:'bypass',status:'published'})).status,409);
 assert.throws(()=>sql.prepare("UPDATE pz_product_reviews SET status='published' WHERE id=?").run(rid),/Invalid or stale product review transition/);

 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','otherlead','POST')).status,403);
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','worker','POST')).status,403);
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','lead','POST')).status,200);
 assert.equal((await call('/admin/reviews/'+rid+'/publish','admin','POST')).status,409);
 assert.equal((await call('/admin/reviews/'+rid+'/approve','admin','POST')).data.status,'approved_pending_publish');
 assert.equal(sql.prepare("SELECT status FROM products WHERE id='p1'").get().status,'approved_pending_publish');
 assert.equal(legacy.includes('/admin/publish/products'),false);
 assert.equal((await call('/admin/reviews/'+rid+'/publish','admin','POST')).status,200);
 assert.equal(legacy.includes('/admin/publish/products'),true);
 assert.equal(sql.prepare("SELECT status FROM products WHERE id='p1'").get().status,'published');
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_review_events").get().n,4);
 assert.equal((await call('/admin/reviews/'+rid+'/approve','admin','POST')).status,409);
});

test('scheme A: admin returns to supervisor, who directs corrections, then repeat first-level review',async()=>{
 const {sql,call}=setup();
 sql.prepare("UPDATE products SET specs_json=? WHERE id='p1'").run(
   JSON.stringify({schema_version:1,attributes:{wood_species:'Oak'},dimensions_cm:{length:182}}));
 const s=await call('/factory/products/p1/submit','worker','POST');
 const rid=s.data.id;
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','lead','POST')).status,200);
 assert.equal((await call('/admin/reviews/'+rid+'/return','admin','POST',{note:'Please correct material specification'})).data.status,'returned_to_supervisor');
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).status,409);
 assert.equal((await call('/supervisor/reviews/'+rid+'/request-correction','lead','POST',{note:'Please correct product description'})).data.status,'returned_to_uploader');
 sql.prepare("UPDATE products SET description=?, specs_json=? WHERE id='p1'").run(
   'updated description', JSON.stringify({schema_version:1,attributes:{wood_species:'Oak'},dimensions_cm:{length:190}}));
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).data.version,2);
 const detail=await call('/admin/reviews/'+rid,'admin');
 assert.equal(detail.status,200);
 assert.equal(detail.data.versions.length,2);
 assert.equal(detail.data.versions[0].snapshot.description,'desc');
 assert.equal(detail.data.versions[1].snapshot.description,'updated description');
 assert.equal(detail.data.versions[0].snapshot.specifications.dimensions_cm.length,182);
 assert.equal(detail.data.versions[1].snapshot.specifications.dimensions_cm.length,190);
 assert.equal(detail.data.events.length,5);
 assert.throws(()=>sql.prepare("UPDATE pz_product_review_versions SET snapshot_json='{}' WHERE review_id=? AND version=1").run(rid),/immutable/i);
 assert.equal((await call('/admin/reviews/'+rid+'/approve','admin','POST')).status,409);
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','lead','POST')).status,200);
 assert.equal((await call('/admin/reviews/'+rid+'/approve','admin','POST')).status,200);
});

test('supervisor return prevents admin final review and reasons are mandatory',async()=>{
 const {call}=setup();
 const s=await call('/factory/products/p1/submit','worker','POST');
 const rid=s.data.id;
 assert.equal((await call('/supervisor/reviews/'+rid+'/return','lead','POST',{note:'no'})).status,400);
 assert.equal((await call('/supervisor/reviews/'+rid+'/return','lead','POST',{note:'Missing main image'})).data.status,'returned_to_uploader');
 assert.equal((await call('/admin/reviews/'+rid+'/approve','admin','POST')).status,409);
});

test('unknown and cross-team users cannot read private review history',async()=>{
 const {call}=setup();
 const s=await call('/factory/products/p1/submit','worker','POST');
 const rid=s.data.id;
 assert.equal((await call('/factory/reviews/'+rid,'outsider')).status,403);
 assert.equal((await call('/supervisor/reviews/'+rid,'otherlead')).status,403);
 const otherList=await call('/supervisor/reviews','otherlead');
 assert.equal(otherList.data.items.length,0);
 assert.equal((await call('/factory/reviews/'+rid,'worker')).status,200);
 assert.equal((await call('/admin/reviews','admin')).data.items.length,1);
 assert.equal((await call('/admin/reviews','anonymous')).status,401);
});

test('submission requires at least one product image and cannot skip required data',async()=>{
 const {sql,call}=setup();
 sql.prepare("UPDATE products SET images=? WHERE id='p1'").run('[]');
 const missing=await call('/factory/products/p1/submit','worker','POST');
 assert.equal(missing.status,400);
 assert.deepEqual(missing.data.missing_fields,['images']);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_reviews").get().n,0);
});

test('supervisor-directed correction may be edited only by original uploader',async()=>{
 const {call,legacy}=setup();
 const start=await call('/factory/products/p1/submit','worker','POST');
 const rid=start.data.id;
 assert.equal((await call('/factory/products/p1','worker','PUT',{name:'tamper'})).status,409);
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','lead','POST')).status,200);
 assert.equal((await call('/admin/reviews/'+rid+'/return','admin','POST',{note:'Please revise the product description'})).status,200);
 assert.equal((await call('/factory/products/p1','worker','PUT',{name:'tamper'})).status,409);
 assert.equal((await call('/supervisor/reviews/'+rid+'/request-correction','lead','POST',{note:'Update product description'})).status,200);
 assert.equal((await call('/factory/products/p1','outsider','PUT',{name:'intruder'})).status,403);
 assert.equal((await call('/factory/products/p1','admin','PUT',{name:'administrator'})).status,409);
 assert.equal((await call('/factory/products/p1','worker','PUT',{name:'corrected'})).status,200);
 assert.equal(legacy.includes('/factory/products/p1'),true);
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).data.version,2);
 assert.equal((await call('/factory/products/p1','worker','PUT',{name:'stale'})).status,409);
});

test('review-candidate Worker limits corrections to active Phase 2 feature flag',()=>{
 for(const file of [
  './staging-worker-category-changes-REVIEW.js',
  './production-worker-category-governance-REVIEW.js'
 ]){
  const source=readFileSync(new URL(file,import.meta.url),'utf8');
  assert.match(source,/lower\(status\) = 'returned_to_uploader' AND \? = 'true'/);
  assert.match(source,/String\(env\.PZ_TWO_STAGE_REVIEW_ENABLED \|\| ''\)/);
  assert.match(source,/const factoryEdit=path\.match/);
 }
});

test('flag off retains phase-one routing without altering database',async()=>{
 const {call,env,legacy,sql}=setup();
 env.PZ_TWO_STAGE_REVIEW_ENABLED='false';
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).status,200);
 assert.equal(legacy[0],'/factory/products/p1/submit');
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_reviews").get().n,0);
});


test('admin can maintain unpublished drafts, but cannot bypass review or overwrite published records',async()=>{
 const {sql,call,legacy}=setup();
 // The admin drafts through the guarded factory endpoint, not the blocked admin write path.
 assert.equal((await call('/factory/products','admin','POST',{name:'Admin draft',status:'draft'})).status,200);
 assert.equal((await call('/factory/products/p1','admin','PUT',{name:'Admin draft edit'})).status,200);
 assert.ok(legacy.includes('/factory/products/p1'));
 assert.equal((await call('/admin/products/p1','admin','PUT',{status:'published'})).status,409);
 assert.equal((await call('/factory/products/p1/submit','admin','POST')).status,403);

 sql.prepare("UPDATE products SET status='rejected' WHERE id='p1'").run();
 assert.equal((await call('/factory/products/p1','admin','PUT',{name:'Fix rejection'})).status,200);

 for (const status of ['returned_to_uploader','pending_supervisor','pending_admin',
   'approved_pending_publish','published']) {
   sql.prepare("UPDATE products SET status=? WHERE id='p1'").run(status);
   const response=await call('/factory/products/p1','admin','PUT',{name:'Disallowed overwrite'});
   assert.equal(response.status,409,status);
 }
 // Ownership boundaries remain intact for factory staff.
 sql.prepare("UPDATE products SET status='draft' WHERE id='p1'").run();
 assert.equal((await call('/factory/products/p1','outsider','PUT',{name:'Cross-team attempt'})).status,403);
});

test('rejects numeric or placeholder names and missing publish fields with explicit field keys',async()=>{
  const {sql,call}=setup();
  sql.prepare("UPDATE products SET name='123',material='',description='',specs_json='{}' WHERE id='p1'").run();
  const result=await call('/factory/products/p1/submit','worker','POST');
  assert.equal(result.status,400);
  assert.deepEqual(result.data.missing_fields,['name','material','description','dimensions']);
  assert.equal(sql.prepare("SELECT COUNT(*) AS count FROM pz_product_reviews").get().count,0);
  sql.prepare("UPDATE products SET name='Demo Counter' WHERE id='p1'").run();
  const demo=await call('/factory/products/p1/submit','worker','POST');
  assert.ok(demo.data.missing_fields.includes('name'));
});

test('admin publication rechecks current product completeness before status changes',async()=>{
  const {sql,call,legacy}=setup();
  const submitted=await call('/factory/products/p1/submit','worker','POST');
  assert.equal(submitted.status,200);
  const rid=submitted.data.id;
  await call('/supervisor/reviews/'+rid+'/approve','lead','POST');
  await call('/admin/reviews/'+rid+'/approve','admin','POST');
  sql.prepare("UPDATE products SET material='' WHERE id='p1'").run();
  const blocked=await call('/admin/reviews/'+rid+'/publish','admin','POST');
  assert.equal(blocked.status,400);
  assert.ok(blocked.data.missing_fields.includes('material'));
  assert.equal(sql.prepare("SELECT status FROM products WHERE id='p1'").get().status,'approved_pending_publish');
  assert.equal(legacy.includes('/admin/publish/products'),false);
});
