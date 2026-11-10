import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pzCategoryTwoStageReviewFetch} from './categoryTwoStageReviewCore.mjs';
const json=(body,status=200)=>Response.json(body,{status});
function setup(runtime='production'){
  const sql=new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER);"+
    "INSERT INTO users VALUES('admin','admin','admin',1),('superA','leadA','factory',1),"+
    "('superB','leadB','factory',1),('factoryA','staffA','factory',1),"+
    "('factoryB','staffB','factory',1),('unassigned','unassigned','factory',1);"+
    "CREATE TABLE category_requests(id TEXT PRIMARY KEY,title TEXT,title_cn TEXT,subtitle TEXT,image TEXT,status TEXT DEFAULT 'pending',created_at TEXT,updated_at TEXT);"+
    "INSERT INTO category_requests VALUES('legacy','Legacy','历史','','','pending','now','now');");
  sql.exec(readFileSync(new URL('./migrations/009_department_accounts_REVIEW.sql',import.meta.url),'utf8'));
  sql.exec("INSERT INTO pz_departments VALUES('dA','Products','zhaoqing',1,'admin','now'),('dB','Sales','kandal',1,'admin','now');"+
    "INSERT INTO pz_staff_assignments VALUES('superA','dA',NULL,'supervisor','admin','now','now'),"+
    "('superB','dB',NULL,'supervisor','admin','now','now'),"+
    "('factoryA','dA','superA','staff','admin','now','now'),"+
    "('factoryB','dB','superB','staff','admin','now','now');");
  sql.exec(readFileSync(new URL('./migrations/015_category_request_two_stage_REVIEW.sql',import.meta.url),'utf8'));
  const prepare=q=>{
    let args=[];
    return {bind(...values){args=values;return this;},
      async first(){return sql.prepare(q).get(...args)||null;},
      async all(){return {results:sql.prepare(q).all(...args)};},
      async run(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}};},
      runSync(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}
    };
  };
  const env={PZ_RUNTIME_ENV:runtime,PZ_CATEGORY_TWO_STAGE_ENABLED:'true',
    SITE_CONFIG_KV:{async get(){return JSON.stringify({categories:[]});}},
    PRODUCT_IMAGES:{async head(key){return key==='uploads/cover.jpg'?{size:100}:null;}},
    DB:{prepare,async batch(statements){
      sql.exec('BEGIN');
      try{const out=statements.map(x=>x.runSync());sql.exec('COMMIT');return out;}
      catch(e){sql.exec('ROLLBACK');throw e;}
    }}
  };
  const authorize=async(req,scope,roles)=>{
    const id=req.headers.get('x-actor')||'admin';
    const user=sql.prepare('SELECT * FROM users WHERE id=?').get(id);
    if(!user||!user.is_active)return json({error:'Unauthorized'},401);
    const job=sql.prepare('SELECT job_type FROM pz_staff_assignments WHERE user_id=?').get(id)?.job_type;
    const role=user.role==='admin'?'ADMIN':job==='supervisor'?'SUPERVISOR':'FACTORY';
    return roles.includes(role)?{user:{id,role}}:json({error:'Forbidden'},403);
  };
  const original=async req=>{
    const match=new URL(req.url).pathname.match(/^\/admin\/category[-_]requests\/([^/]+)\/approve$/);
    if(!match)return json({error:'Legacy route'},404);
    const record=sql.prepare('SELECT status FROM category_requests WHERE id=?').get(match[1]);
    if(record?.status!=='pending')return json({error:'Not pending'},409);
    sql.prepare("UPDATE category_requests SET status='approved' WHERE id=?").run(match[1]);
    return json({success:true,status:'approved',published:false,needsPublish:true});
  };
  const fetch=pzCategoryTwoStageReviewFetch(original,{authorize,json,expectedRuntime:runtime,
    imageBase:()=>runtime==='staging'?'https://staging-images.test':'https://cdn.peng-zhan.com'});
  const call=async(path,method='GET',body,actor='admin')=>{
    const request=new Request('https://worker.test'+path,{method,
      headers:{'x-actor':actor,...(body===undefined?{}:{'content-type':'application/json'})},
      ...(body===undefined?{}:{body:JSON.stringify(body)})});
    const response=await fetch(request,env,{});
    return {status:response.status,body:await response.json()};
  };
  const imageBase=runtime==='staging'?'https://staging-images.test':'https://cdn.peng-zhan.com';
  const payload={title:'Heritage Chairs',title_cn:'复古椅',subtitle:'Wooden seating',image:imageBase+'/uploads%2Fcover.jpg'};
  return {sql,env,call,payload};
}

test('staff -> supervisor -> admin stages and final approved not published',async()=>{
  const a=setup();
  const create=await a.call('/factory/category-requests','POST',a.payload,'factoryA');
  assert.equal(create.status,201);
  assert.equal(create.body.status,'pending_supervisor');
  const id=create.body.id;
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items[0].status,'pending_supervisor');
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryB')).body.items.length,0);
  assert.equal((await a.call('/supervisor/category-requests','GET',undefined,'superB')).body.items.length,0);
  assert.equal((await a.call('/admin/category-requests/'+id+'/approve','POST',{},'admin')).status,409);
  assert.equal((await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superB')).status,403);
  assert.equal((await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA')).body.status,'pending_admin');
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items[0].status,'pending_admin');
  const approved=await a.call('/admin/category-requests/'+id+'/approve','POST',{note:''},'admin');
  assert.equal(approved.status,200);
  assert.equal(approved.body.needsPublish,true);
  assert.equal(approved.body.published,false);
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items[0].status,'approved');
  assert.deepEqual(a.sql.prepare('SELECT action FROM pz_category_request_events WHERE request_id=? ORDER BY revision').all(id).map(x=>x.action),
    ['submitted','supervisor_approved','admin_approved']);
  a.sql.close();
});

test('returns preserve reasons; same request can be revised and resubmitted',async()=>{
  const a=setup();
  const id=(await a.call('/factory/category-requests','POST',a.payload,'factoryA')).body.id;
  assert.equal((await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA')).status,200);
  assert.equal((await a.call('/admin/category-requests/'+id+'/reject','POST',{},'admin')).status,400);
  assert.equal((await a.call('/admin/category-requests/'+id+'/reject','POST',{note:'请补充说明'},'admin')).body.status,'returned_to_supervisor');
  assert.equal((await a.call('/supervisor/category-requests','GET',undefined,'superA')).body.items[0].reject_reason,'请补充说明');
  assert.equal((await a.call('/supervisor/category-requests/'+id+'/reject','POST',{note:'请调整封面'},'superA')).body.status,'returned_to_uploader');
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items[0].reject_reason,'请调整封面');
  assert.equal((await a.call('/factory/category-requests/'+id+'/resubmit','POST',a.payload,'factoryB')).status,403);
  assert.equal((await a.call('/factory/category-requests/'+id+'/resubmit','POST',{...a.payload,title_cn:'复古单椅'},'factoryA')).body.status,'pending_supervisor');
  assert.equal(a.sql.prepare('SELECT title_cn FROM category_requests WHERE id=?').get(id).title_cn,'复古单椅');
  assert.equal(a.sql.prepare('SELECT COUNT(*) AS n FROM category_requests').get().n,2);
  assert.equal((await a.call('/factory/category-requests/'+id+'/resubmit','POST',a.payload,'factoryA')).status,409);
  assert.deepEqual(a.sql.prepare('SELECT action FROM pz_category_request_events WHERE request_id=? ORDER BY revision').all(id).map(x=>x.action),
    ['submitted','supervisor_approved','admin_returned','supervisor_returned','resubmitted']);
  a.sql.close();
});

test('security: no assignment, invalid R2, duplicate, wrong roles, legacy separation',async()=>{
  const a=setup();
  assert.equal((await a.call('/factory/category-requests','POST',a.payload,'unassigned')).status,409);
  assert.equal((await a.call('/factory/category-requests','POST',{...a.payload,image:'https://evil.test/uploads/cover.jpg'},'factoryA')).status,400);
  assert.equal((await a.call('/factory/category-requests','POST',{...a.payload,image:'https://cdn.peng-zhan.com/uploads/missing.jpg'},'factoryA')).status,409);
  assert.equal((await a.call('/factory/category-requests','POST',a.payload,'factoryA')).status,201);
  assert.equal((await a.call('/factory/category-requests','POST',a.payload,'factoryA')).status,409);
  assert.equal((await a.call('/supervisor/category-requests','GET',undefined,'factoryA')).status,403);
  assert.equal((await a.call('/admin/category-requests','GET',undefined,'factoryA')).status,403);
  assert.equal((await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items.length,1);
  assert.equal((await a.call('/admin/category-requests')).body.items.find(x=>x.id==='legacy').legacy,true);
  assert.equal((await a.call('/admin/category-requests/legacy/approve','POST',{note:''},'admin')).status,200);
  a.env.PZ_CATEGORY_TWO_STAGE_ENABLED='false';
  assert.equal((await a.call('/factory/category-requests','POST',a.payload,'factoryA')).status,404);
  a.env.PZ_CATEGORY_TWO_STAGE_ENABLED='true';a.env.PZ_RUNTIME_ENV='staging';
  assert.equal((await a.call('/factory/category-requests','POST',a.payload,'factoryA')).status,403);
  a.sql.close();
});


test('accepts encoded upload-image URLs and plain R2 paths, but rejects unsafe/mismatched image hosts',async()=>{
  const a=setup('staging');
  const encoded=await a.call('/factory/category-requests','POST',a.payload,'factoryA');
  assert.equal(encoded.status,201,'The current upload-image endpoint encodes uploads/cover.jpg as uploads%2Fcover.jpg');
  const plain=await a.call('/factory/category-requests','POST',{
    ...a.payload,title:'Oak Shelving',title_cn:'橡木置物架',
    image:'https://staging-images.test/uploads/cover.jpg'
  },'factoryA');
  assert.equal(plain.status,201,'A standard /uploads/file.jpg URL also remains valid');
  const doubleEncoded=await a.call('/factory/category-requests','POST',{
    ...a.payload,title:'Woven Benches',image:'https://staging-images.test/uploads%252Fcover.jpg'
  },'factoryA');
  assert.equal(doubleEncoded.status,400,'Double-encoded paths are rejected');
  const external=await a.call('/factory/category-requests','POST',{
    ...a.payload,title:'Teak Tables',image:'https://cdn.peng-zhan.com/uploads%2Fcover.jpg'
  },'factoryA');
  assert.equal(external.status,400,'Production CDN images are rejected in Staging');
  a.sql.close();
});
