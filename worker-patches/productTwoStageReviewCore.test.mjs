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
 sql.exec("INSERT INTO products(id,name,name_cn,category,sub_category,material,size,finish,code,description,description_cn,images,production_sites,created_by,status,created_at,updated_at)"+
 " VALUES('p1','Oak Counter','橡木台面','countertop','','oak','6ft','matte','PZ-OAK-01','desc','描述','[\"a.jpg\"]','[\"zhaoqing\"]','worker','draft','2026-01-01','2026-01-01')");
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
 const s=await call('/factory/products/p1/submit','worker','POST');
 const rid=s.data.id;
 assert.equal((await call('/supervisor/reviews/'+rid+'/approve','lead','POST')).status,200);
 assert.equal((await call('/admin/reviews/'+rid+'/return','admin','POST',{note:'Please correct material specification'})).data.status,'returned_to_supervisor');
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).status,409);
 assert.equal((await call('/supervisor/reviews/'+rid+'/request-correction','lead','POST',{note:'Please correct product description'})).data.status,'returned_to_uploader');
 sql.prepare("UPDATE products SET description=? WHERE id='p1'").run('updated description');
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).data.version,2);
 const detail=await call('/admin/reviews/'+rid,'admin');
 assert.equal(detail.status,200);
 assert.equal(detail.data.versions.length,2);
 assert.equal(detail.data.versions[0].snapshot.description,'desc');
 assert.equal(detail.data.versions[1].snapshot.description,'updated description');
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
 assert.match(missing.data.error,/image/i);
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_reviews").get().n,0);
});

test('flag off retains phase-one routing without altering database',async()=>{
 const {call,env,legacy,sql}=setup();
 env.PZ_TWO_STAGE_REVIEW_ENABLED='false';
 assert.equal((await call('/factory/products/p1/submit','worker','POST')).status,200);
 assert.equal(legacy[0],'/factory/products/p1/submit');
 assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_product_reviews").get().n,0);
});
