import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import {pzProductResponsibilityFetch} from './productResponsibilityCore.mjs';

function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; "+
    "CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER);"+
    "CREATE TABLE products(id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,"+
    "material TEXT,size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,images TEXT,"+
    "production_sites TEXT,specs_json TEXT DEFAULT '{}',created_by TEXT,status TEXT,created_at TEXT,updated_at TEXT);");
  sql.exec("INSERT INTO users VALUES "+
    "('admin','admin','admin',1),('lead','lead','factory',1),"+
    "('lead2','lead2','factory',1),('worker','worker','factory',1),"+
    "('worker2','worker2','factory',1),('disabled','disabled','factory',0);");
  for(const name of [
    '009_department_accounts_REVIEW.sql',
    '010_two_stage_product_review_REVIEW.sql',
    '012_published_product_revisions_STAGING_REVIEW.sql',
    '013_product_responsibility_STAGING_REVIEW.sql'
  ])sql.exec(readFileSync(new URL('./migrations/'+name,import.meta.url),'utf8'));
  sql.exec("INSERT INTO pz_departments(id,name,factory_site,is_active,created_by,created_at) VALUES "+
    "('d1','Dept 1','zhaoqing',1,'admin','2026-01-01'),"+
    "('d2','Dept 2','kandal',1,'admin','2026-01-01');"+
    "INSERT INTO pz_staff_assignments(user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) VALUES "+
    "('lead','d1',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
    "('lead2','d2',NULL,'supervisor','admin','2026-01-01','2026-01-01'),"+
    "('worker','d1','lead','staff','admin','2026-01-01','2026-01-01'),"+
    "('worker2','d2','lead2','staff','admin','2026-01-01','2026-01-01'),"+
    "('disabled','d1','lead','staff','admin','2026-01-01','2026-01-01');");
  sql.exec("INSERT INTO products(id,name,name_cn,category,code,images,created_by,status,created_at,updated_at) VALUES "+
    "('legacy','Legacy Table','历史桌','tables','PZ-TABLE-01','[\"https://cdn.peng-zhan.com/uploads/legacy.webp\"]','admin','published','2026-01-01','2026-01-02'),"+
    "('draft','New Draft','草稿','tables','PZ-TABLE-02','[]','admin','draft','2026-01-01','2026-01-02');");
  const DB={
    prepare(q){let args=[];return{
      bind(...p){args=p;return this;},
      async first(){return sql.prepare(q).get(...args)||null;},
      async all(){return {results:sql.prepare(q).all(...args)};},
      async run(){return {meta:{changes:Number(sql.prepare(q).run(...args).changes)}};}
    }}
  };
  const env={
    DB,PZ_RUNTIME_ENV:'staging',
    PZ_ORG_RBAC_ENABLED:'true',PZ_TWO_STAGE_REVIEW_ENABLED:'true',
    PZ_PRODUCT_REVISIONS_ENABLED:'true',PZ_PRODUCT_RESPONSIBILITY_ENABLED:'true'
  };
  let originalCount=0;
  const core=pzProductResponsibilityFetch(async()=>{
    originalCount++;return Response.json({error:'not found'},{status:404});
  },{
    authorize:async(request,_,roles)=>{
      const actor=request.headers.get('x-actor')||'anonymous';
      const role=actor==='admin'?'ADMIN':actor==='lead'||actor==='lead2'?'SUPERVISOR':
        ['worker','worker2','disabled'].includes(actor)?'FACTORY':null;
      if(!role)return Response.json({error:'Unauthorized'},{status:401});
      if(!roles.includes(role))return Response.json({error:'Forbidden'},{status:403});
      return {user:{id:actor,role}};
    },
    json:(payload,status=200)=>Response.json(payload,{status}),
    expectedRuntime:'staging'
  });
  async function call(path,actor='admin',method='GET',body){
    const response=await core(new Request('https://staging.example'+path,{
      method,headers:{'x-actor':actor,...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    }),env,{});
    return {status:response.status,data:await response.json()};
  }
  return {sql,env,call,originalCalls:()=>originalCount};
}
const base='/admin/product-responsibilities';
const grant=(user,version)=>({responsible_user_id:user,expected_version:version});

test('migration 013 is additive, matches Production SQL and records immutable history',()=>{
  const s=readFileSync(new URL('./migrations/013_product_responsibility_STAGING_REVIEW.sql',import.meta.url),'utf8');
  const p=readFileSync(new URL('./migrations/013_product_responsibility_PRODUCTION_REVIEW.sql',import.meta.url),'utf8');
  assert.equal(s.split('\n').slice(1).join('\n'),p.split('\n').slice(1).join('\n'));
  const {sql}=setup();
  assert.equal(sql.prepare("SELECT created_by FROM products WHERE id='legacy'").get().created_by,'admin');
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_product_responsibility_events').get().n,0);
  assert.equal(sql.prepare('PRAGMA foreign_key_check').all().length,0);
});

test('admin grants original admin-uploaded published SKU to active worker without changing creator',async()=>{
  const {sql,call}=setup();
  const saved=sql.prepare("SELECT * FROM products WHERE id='legacy'").get();
  assert.equal((await call(base,'worker')).status,403);
  assert.equal((await call(base,'anonymous')).status,401);
  const res=await call(base+'/legacy','admin','PUT',grant('worker',0));
  assert.equal(res.status,200,JSON.stringify(res.data));
  assert.equal(res.data.version,1);
  assert.equal(res.data.supervisor_id,'lead');
  assert.deepEqual(sql.prepare("SELECT * FROM products WHERE id='legacy'").get(),saved);
  const record=sql.prepare("SELECT * FROM pz_product_responsibilities WHERE product_id='legacy'").get();
  assert.equal(record.responsible_user_id,'worker');
  assert.equal(record.assigned_by,'admin');
  const history=(await call(base+'/legacy/events')).data.items;
  assert.equal(history.length,1);
  assert.equal(history[0].actor_id,'admin');
  assert.equal(history[0].old_user_id,null);
  assert.equal(history[0].new_user_id,'worker');
});

test('department switch requires administrator CAS and preserves immutable event versions',async()=>{
  const {sql,call}=setup();
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker',0))).status,200);
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker2',0))).status,409);
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker2',1))).status,200);
  const row=sql.prepare("SELECT * FROM pz_product_responsibilities WHERE product_id='legacy'").get();
  assert.equal(row.version,2);
  assert.equal(row.department_id,'d2');
  assert.equal(row.supervisor_id,'lead2');
  const history=sql.prepare("SELECT * FROM pz_product_responsibility_events ORDER BY version").all();
  assert.deepEqual(history.map(h=>[h.old_user_id,h.new_user_id,h.version]),
    [[null,'worker',1],['worker','worker2',2]]);
  assert.throws(()=>sql.prepare("DELETE FROM pz_product_responsibility_events").run(),/Immutable/);
  assert.throws(()=>sql.prepare("UPDATE pz_product_responsibilities SET version=99 WHERE product_id='legacy'").run(),/immutable/i);
  assert.throws(()=>sql.prepare("DELETE FROM pz_product_responsibilities").run(),/cannot be deleted/);
});

test('draft, disabled staff, supervisors and nonexistent users cannot be granted access',async()=>{
  const {sql,call}=setup();
  for(const [product,actor] of [['draft','worker'],['legacy','disabled'],['legacy','lead'],['legacy','missing']])
    assert.equal((await call(base+'/'+product,'admin','PUT',grant(actor,0))).status,409);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_product_responsibilities').get().n,0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_product_responsibility_events').get().n,0);
  assert.equal((await call(base+'/legacy','worker','PUT',grant('worker',0))).status,403);
});

test('active published-product revision locks responsibility transfer',async()=>{
  const {sql,call}=setup();
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker',0))).status,200);
  sql.prepare("INSERT INTO pz_published_product_revisions"+
    "(id,product_id,submitter_id,supervisor_id,department_id,base_updated_at,"+
    "base_snapshot_json,draft_json,status,draft_revision,latest_version,created_at,updated_at) "+
    "VALUES ('rev1','legacy','worker','lead','d1','2026-01-02','{}','{}','draft',1,0,'2026-01-03','2026-01-03')").run();
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker2',1))).status,409);
  assert.equal(sql.prepare("SELECT responsible_user_id FROM pz_product_responsibilities WHERE product_id='legacy'").get().responsible_user_id,'worker');
  sql.prepare("UPDATE pz_published_product_revisions SET status='canceled' WHERE id='rev1'").run();
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker2',1))).status,200);
});

test('feature disabled or wrong runtime does not expose admin assignment API',async()=>{
  const {env,sql,call}=setup();
  env.PZ_PRODUCT_RESPONSIBILITY_ENABLED='false';
  assert.equal((await call(base)).status,404);
  env.PZ_PRODUCT_RESPONSIBILITY_ENABLED='true';
  env.PZ_RUNTIME_ENV='production';
  assert.equal((await call(base)).status,403);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_product_responsibilities').get().n,0);
});

test('stale version and unknown request fields are rejected without mutation',async()=>{
  const {sql,call}=setup();
  assert.equal((await call(base+'/legacy','admin','PUT',grant('worker',2))).status,409);
  assert.equal((await call(base+'/legacy','admin','PUT',{...grant('worker',0),created_by:'worker'})).status,400);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_product_responsibilities').get().n,0);
});


test('both assembled Workers expose only current custodian published SKUs to factory accounts',async()=>{
  const secret='synthetic-test-secret-for-local-jwt-signing';
  const passwordHash='synthetic-password-hash-for-test';
  const phv=createHash('sha256').update(passwordHash).digest('hex').slice(0,32);
  const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
  const jwt=(id)=>{
    const now=Math.floor(Date.now()/1000);
    const header=b64({alg:'HS256',typ:'JWT'});
    const payload=b64({sub:id,username:id,role:'FACTORY',org_id:'org-main',phv,
      iat:now,exp:now+3600});
    return header+'.'+payload+'.'+createHmac('sha256',secret)
      .update(header+'.'+payload).digest('base64url');
  };
  for(const [runtime,file] of [
    ['staging','staging-worker-category-changes-REVIEW.js'],
    ['production','production-worker-category-governance-REVIEW.js']
  ]){
    const {default:worker}=await import('./'+file);
    const {sql,env,call}=setup();
    sql.exec("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT '"+passwordHash+"'; "+
      "ALTER TABLE users ADD COLUMN org_id TEXT DEFAULT 'org-main'; "+
      "ALTER TABLE products ADD COLUMN org_id TEXT DEFAULT 'org-main';");
    // A former creator loses delegated access without altering the original upload record.
    sql.prepare("UPDATE products SET created_by='worker2' WHERE id='legacy'").run();
    assert.equal((await call(base+'/legacy','admin','PUT',grant('worker',0))).status,200);
    Object.assign(env,{JWT_SECRET:secret,PZ_RUNTIME_ENV:runtime,
      PZ_IMAGE_BASE_URL:'https://cdn.peng-zhan.com'});
    async function catalog(id){
      const res=await worker.fetch(new Request('https://workers.example/factory/products?limit=50',{
        method:'GET',headers:{Authorization:'Bearer '+jwt(id)}
      }),env,{});
      const data=await res.json();
      assert.equal(res.status,200,JSON.stringify(data));
      return (data.products||data.items||[]).map(p=>p.id);
    }
    assert.ok((await catalog('worker')).includes('legacy'),runtime+' new custodian');
    assert.ok(!(await catalog('worker2')).includes('legacy'),runtime+' former uploader');
    env.PZ_PRODUCT_RESPONSIBILITY_ENABLED='false';
    assert.ok(!(await catalog('worker')).includes('legacy'),runtime+' flag off fallback');
    assert.ok((await catalog('worker2')).includes('legacy'),runtime+' flag off original owner');
  }
});
