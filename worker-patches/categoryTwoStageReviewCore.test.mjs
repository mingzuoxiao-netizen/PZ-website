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
  const kv=new Map([
    ['draft:site_config',JSON.stringify({categories:[],home:{hero:{title:'Unpublished draft'}}})],
    ['published:site_config',JSON.stringify({categories:[],home:{hero:{title:'Existing live homepage'}}})]
  ]);
  const snapshots=new Map();
  const env={PZ_RUNTIME_ENV:runtime,PZ_CATEGORY_TWO_STAGE_ENABLED:'true',
    SITE_CONFIG_KV:{
      async get(key){return kv.get(key)||null;},
      async put(key,value){kv.set(key,value);}
    },
    SITE_CONFIG_HISTORY:{
      async put(key,value){snapshots.set(key,value);}
    },
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
  return {sql,env,call,payload,kv,snapshots};
}

test('staff -> supervisor -> admin approves and publishes only the category',async()=>{
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
  assert.equal(approved.body.needsPublish,false);
  assert.equal(approved.body.published,true);
  assert.equal(approved.body.publicationMode,'category_only');
  const publicConfig=JSON.parse(a.kv.get('published:site_config'));
  assert.equal(publicConfig.categories.length,1);
  assert.equal(publicConfig.categories[0].proposal_id,id);
  assert.equal(publicConfig.home.hero.title,'Existing live homepage');
  assert.equal(JSON.parse(a.kv.get('draft:site_config')).home.hero.title,'Unpublished draft');
  const mine=(await a.call('/factory/category-requests','GET',undefined,'factoryA')).body.items[0];
  assert.equal(mine.status,'approved');
  assert.equal(mine.published,true);
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


test('two different approved categories publish independently, never copying unrelated website drafts',async()=>{
  const a=setup();
  for (const [title,titleCn] of [['Cedar Benches','雪松长凳'],['Walnut Shelves','胡桃木架']]) {
    const created=await a.call('/factory/category-requests','POST',{...a.payload,title,title_cn:titleCn},'factoryA');
    const id=created.body.id;
    assert.equal((await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA')).status,200);
    const approved=await a.call('/admin/category-requests/'+id+'/approve','POST',{note:''},'admin');
    assert.equal(approved.body.published,true);
    assert.equal(approved.body.needsPublish,false);
  }
  const published=JSON.parse(a.kv.get('published:site_config'));
  assert.equal(published.categories.length,2);
  assert.deepEqual(new Set(published.categories.map(c=>c.title)),new Set(['Cedar Benches','Walnut Shelves']));
  assert.equal(published.home.hero.title,'Existing live homepage');
  const draft=JSON.parse(a.kv.get('draft:site_config'));
  assert.equal(draft.home.hero.title,'Unpublished draft');
  assert.equal(draft.categories.length,0,'mock approval does not change unrelated draft');
  assert.ok(a.snapshots.size>=2);
  a.sql.close();
});

test('if publication fails, approval persists and an idempotent individual retry publishes exactly once',async()=>{
  const a=setup();
  const id=(await a.call('/factory/category-requests','POST',a.payload,'factoryA')).body.id;
  assert.equal((await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA')).status,200);
  const put=a.env.SITE_CONFIG_KV.put.bind(a.env.SITE_CONFIG_KV);
  let fail=true;
  a.env.SITE_CONFIG_KV.put=async(key,value)=>{
    if(fail && key==='published:site_config')throw Error('simulated KV outage');
    return put(key,value);
  };
  const approved=await a.call('/admin/category-requests/'+id+'/approve','POST',{},'admin');
  assert.equal(approved.body.status,'approved');
  assert.equal(approved.body.published,false);
  assert.equal(approved.body.needsPublish,true);
  assert.equal(a.sql.prepare('SELECT status FROM category_requests WHERE id=?').get(id).status,'approved');
  assert.equal((await a.call('/admin/category-requests')).body.items.find(x=>x.id===id).published,false);
  fail=false;
  const retry=await a.call('/admin/category-requests/'+id+'/publish','POST',{},'admin');
  assert.equal(retry.body.published,true);
  assert.equal(JSON.parse(a.kv.get('published:site_config')).categories.length,1);
  assert.equal((await a.call('/admin/category-requests/'+id+'/publish','POST',{},'admin')).body.alreadyPublished,true);
  assert.equal(JSON.parse(a.kv.get('published:site_config')).categories.length,1);
  assert.equal((await a.call('/admin/category-requests/'+id+'/publish','POST',{},'factoryA')).status,403);
  a.sql.close();
});

test('D1 cutover publishes one category via revision CAS and preserves other published settings',async()=>{
  const a=setup();
  a.env.PZ_D1_SITE_CONFIG_ENABLED='true';
  a.env.PZ_SITE_CONFIG_D1_CUTOVER_ENABLED='true';
  a.sql.exec("CREATE TABLE site_config_state("+
    "id INTEGER PRIMARY KEY,draft_json TEXT NOT NULL,draft_revision INTEGER NOT NULL,"+
    "published_json TEXT NOT NULL,published_revision INTEGER NOT NULL,"+
    "published_version TEXT NOT NULL,published_at TEXT NOT NULL,"+
    "write_token TEXT NOT NULL,updated_at TEXT NOT NULL)");
  a.sql.prepare('INSERT INTO site_config_state VALUES(1,?,?,?,?,?,?,?,?)').run(
    JSON.stringify({categories:[],home:{hero:{title:'Still draft'}}}),1,
    JSON.stringify({categories:[],home:{hero:{title:'Currently live'}}}),3,
    'prior-version','prior-time','prior-token','prior-time'
  );
  const id=(await a.call('/factory/category-requests','POST',a.payload,'factoryA')).body.id;
  await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA');
  const result=await a.call('/admin/category-requests/'+id+'/approve','POST',{},'admin');
  assert.equal(result.body.published,true);
  const row=a.sql.prepare('SELECT * FROM site_config_state WHERE id=1').get();
  assert.equal(row.published_revision,4);
  assert.equal(JSON.parse(row.published_json).categories[0].proposal_id,id);
  assert.equal(JSON.parse(row.published_json).home.hero.title,'Currently live');
  assert.equal(JSON.parse(row.draft_json).home.hero.title,'Still draft');
  a.sql.close();
});


test('admin list advertises targeted publishing; unknown live state stays visible instead of false success',async()=>{
  const a=setup();
  const created=await a.call('/factory/category-requests','POST',a.payload,'factoryA');
  const id=created.body.id;
  await a.call('/supervisor/category-requests/'+id+'/approve','POST',{},'superA');
  const approval=await a.call('/admin/category-requests/'+id+'/approve','POST',{},'admin');
  assert.equal(approval.body.published,true);
  const before=await a.call('/admin/category-requests','GET',undefined,'admin');
  assert.equal(before.status,200);
  assert.equal(before.body.capabilities.targetedCategoryPublish,true);
  assert.equal(before.body.capabilities.publicationMode,'category_only');
  assert.equal(before.body.items.find(x=>x.id===id).publicationStatus,'published');
  a.kv.delete('published:site_config');
  const unknown=await a.call('/admin/category-requests','GET',undefined,'admin');
  const item=unknown.body.items.find(x=>x.id===id);
  assert.equal(item.status,'approved');
  assert.equal(item.published,null);
  assert.equal(item.publicationStatus,'unverified');
  assert.equal(unknown.body.items.filter(x=>x.id===id).length,1);
  a.sql.close();
});
