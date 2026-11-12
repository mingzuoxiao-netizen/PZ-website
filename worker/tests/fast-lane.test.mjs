import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {hasEvidenceClaims,trustedHistory,fastLaneDecision} from '../../utils/fastLane.mjs';
import {fastLaneEligibility,approveFastLane,handleFastLaneAdmin} from '../fastLaneCore.mjs';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const request=(path,method='GET',body)=>new Request('https://worker.example'+path,{
  method,headers:{'content-type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})
});
const source=readFileSync(new URL('../../worker-patches/migrations/018_trusted_operator_fast_lane_REVIEW.sql',import.meta.url),'utf8');

function setup({clean=10,legacy=0}={}){
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON;');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER DEFAULT 1,deleted_at TEXT);
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY);
    CREATE TABLE pz_staff_assignments(user_id TEXT,department_id TEXT,job_type TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,created_by TEXT,category TEXT,name TEXT,name_cn TEXT,code TEXT,
      sub_category TEXT,material TEXT,size TEXT,finish TEXT,description TEXT,description_cn TEXT,
      images TEXT,production_sites TEXT,status TEXT,created_at TEXT,updated_at TEXT,
      deleted_at TEXT,catalog_hidden INTEGER DEFAULT 0);
    CREATE TABLE pz_product_reviews(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,supervisor_id TEXT,
      department_id TEXT,status TEXT,latest_version INTEGER,approved_version INTEGER,return_reason TEXT,
      created_at TEXT,updated_at TEXT);
    CREATE TABLE pz_product_review_events(id TEXT PRIMARY KEY,review_id TEXT,action TEXT,actor_id TEXT,actor_role TEXT,
      review_version INTEGER,note TEXT,created_at TEXT);
    CREATE TABLE pz_product_review_versions(review_id TEXT,version INTEGER,snapshot_json TEXT,submitted_by TEXT,
      created_at TEXT,PRIMARY KEY(review_id,version));
  `);
  sql.exec(source);
  const at='2026-11-12T00:00:00Z';
  for(const [id,role] of [['op','FACTORY'],['sup','SUPERVISOR'],['adm','ADMIN']])
    sql.prepare('INSERT INTO users(id,username,role,is_active) VALUES(?,?,?,1)').run(id,id,role);
  sql.prepare("INSERT INTO pz_departments VALUES('d1')").run();
  sql.prepare("INSERT INTO pz_staff_assignments VALUES('op','d1','staff')").run();
  sql.prepare("INSERT INTO pz_staff_assignments VALUES('sup','d1','supervisor')").run();
  const images=['a','b','c','d'];
  const specs={verification:[],attributes:{wood_type:'Oak'}};
  const product=(id,status='pending_supervisor',category='tables')=>({
    id,created_by:'op',category,name:'Oak Table',name_cn:'橡木餐桌',code:'PZ-'+id.toUpperCase(),
    sub_category:'',material:'Oak',size:'150x90x75 cm',finish:'Matte',description:'Oak dining table',
    description_cn:'橡木',images:JSON.stringify(images),production_sites:'["zhaoqing"]',status,
    created_at:at,updated_at:at,deleted_at:null,catalog_hidden:0,specs_json:JSON.stringify(specs)
  });
  const putProduct=(record)=>{
    sql.prepare(
      "INSERT INTO products(id,created_by,category,name,name_cn,code,sub_category,material,size,finish,"+
      "description,description_cn,images,production_sites,status,created_at,updated_at,deleted_at,catalog_hidden) "+
      "VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).run(...['id','created_by','category','name','name_cn','code','sub_category','material','size','finish',
      'description','description_cn','images','production_sites','status','created_at','updated_at','deleted_at','catalog_hidden']
      .map(k=>record[k]));
  };
  const putReview=(id,status='pending_supervisor')=>{
    sql.prepare(
      'INSERT INTO pz_product_reviews(id,product_id,submitter_id,supervisor_id,department_id,status,latest_version,created_at,updated_at) '+
      'VALUES(?,?,?, ?,?, ?,1,?,?)'
    ).run('r-'+id,id,'op','sup','d1',status,at,at);
    sql.prepare(
      'INSERT INTO pz_product_review_versions VALUES(?,1,?,?,?)'
    ).run('r-'+id,JSON.stringify({...product(id),images,specifications:specs}), 'op',at);
  };
  for(let i=0;i<clean;i++){
    const id='old-'+i;
    putProduct(product(id,'published'));
    putReview(id,'published');
  }
  for(let i=0;i<legacy;i++)putProduct(product('legacy-'+i,'published'));
  for(const id of ['p1','p2']){putProduct(product(id));putReview(id);}
  sql.prepare(
    "INSERT INTO pz_fast_lane_trust(operator_id,trusted,updated_by,updated_at) VALUES('op',1,'adm',?)"
  ).run(at);
  sql.prepare("UPDATE pz_fast_lane_settings SET enabled=1,updated_by='adm' WHERE id=1").run();

  // D1 connector mock: execute the batch sequentially within one SQLite transaction.
  const db={
    prepare(text){
      return {
        bind(...args){
          const statement=sql.prepare(text);
          return {
            async first(){return statement.get(...args)||null;},
            async all(){return {results:statement.all(...args)};},
            async run(){const r=statement.run(...args);return {meta:{changes:Number(r.changes)}};},
            async execute(){
              if(/^\s*SELECT\b/i.test(text))return {results:statement.all(...args)};
              const r=statement.run(...args);return {meta:{changes:Number(r.changes)}};
            }
          };
        },
        async first(){return sql.prepare(text).get()||null;},
        async all(){return {results:sql.prepare(text).all()};}
      };
    },
    async batch(items){
      sql.exec('BEGIN');
      try{
        const result=[];
        for(const item of items)result.push(await item.execute());
        sql.exec('COMMIT');return result;
      }catch(error){sql.exec('ROLLBACK');throw error;}
    }
  };
  const kv=new Map();
  const env={DB:db,PZ_FAST_LANE_ENABLED:'true',SITE_CONFIG_KV:{
    async put(key,value){kv.set(key,value);}
  }};
  const authorize=async()=>({user:{id:'adm',role:'ADMIN'}});
  const admin=(path,method='GET',body)=>
    handleFastLaneAdmin(request(path,method,body),env,{authorize,json,normalizeProductRows:rows=>rows});
  const getProduct=id=>({ ...sql.prepare('SELECT * FROM products WHERE id=?').get(id),specs_json:JSON.stringify(specs) });
  const getReview=id=>sql.prepare('SELECT * FROM pz_product_reviews WHERE id=?').get('r-'+id);
  const snapshot=id=>({...product(id),images,specifications:specs});
  const approve=id=>approveFastLane({env,review:getReview(id),actor:'sup',
    product:getProduct(id),snapshot:snapshot(id),readinessIssues:()=>[],json,
    normalizeProductRows:rows=>rows});
  return {sql,db,env,kv,admin,getProduct,getReview,snapshot,approve,close:()=>sql.close()};
}

test('fast lane blocks load, test, evidence and verification claims',()=>{
  const baseline={specifications:{verification:[],attributes:{finish:'matte'}}};
  assert.equal(hasEvidenceClaims(baseline),false);
  for(const specs of [
    {verification:[{claim:'FSC',status:'unverified'}]},
    {attributes:{tested_load:'100 kg'}},
    {attributes:{shelf_load:30}},
    {attributes:{certification:'FSC'}},
    {claims:{safety:'passed'}},
    {evidence:{file:'lab.pdf'}}
  ])assert.equal(hasEvidenceClaims({specifications:specs}),true,JSON.stringify(specs));
  assert.equal(hasEvidenceClaims({specs_json:'not JSON'}),true,'malformed specs fail closed');
});

test('flag, kill switches, prior-category and minimum history are all required',()=>{
  const product={specifications:{verification:[],attributes:{}}};
  const base={workerEnabled:true,siteEnabled:true,adminTrusted:true,
    history:{qualifies:true},categoryPreviouslyPublished:true,product};
  assert.equal(fastLaneDecision(base).eligible,true);
  for(const key of ['workerEnabled','siteEnabled','adminTrusted','categoryPreviouslyPublished'])
    assert.equal(fastLaneDecision({...base,[key]:false}).eligible,false,key);
  assert.equal(fastLaneDecision({...base,history:{qualifies:false}}).eligible,false);
  assert.equal(fastLaneDecision({...base,product:{specifications:{verification:[{claim:'tested'}]}}}).eligible,false);
  assert.equal(trustedHistory({clean:9,audited:9,legacy:0}).qualifies,false);
  assert.equal(trustedHistory({clean:10,audited:10,legacy:0}).qualifies,true);
  assert.deepEqual(trustedHistory({clean:0,audited:0,legacy:3}),{
    qualifies:true,history_fallback:true,clean_publishes:0,audited_publishes:0,legacy_publishes:3
  });
});

test('migration only permits the direct state edge when matching sampling record exists',()=>{
  const t=setup();
  try{
    assert.throws(()=>t.sql.prepare(
      "UPDATE pz_product_reviews SET status='published' WHERE id='r-p1'"
    ).run(),/Invalid or stale product review transition/);
  }finally{t.close();}
});

test('eligible supervisor publish atomically records fast lane, audit, and catalog snapshot',async()=>{
  const t=setup();
  try{
    const eligibility=await fastLaneEligibility(t.env,t.getReview('p1'),t.snapshot('p1'));
    assert.equal(eligibility.eligible,true);
    const response=await t.approve('p1');
    assert.equal(response.status,200);
    const result=await response.json();
    assert.equal(result.lane,'fast');
    assert.equal(result.catalog_published,true);
    assert.equal(t.getReview('p1').status,'published');
    assert.equal(t.getProduct('p1').status,'published');
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_fast_lane_publications WHERE status='published'").get().n,1);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_fast_lane_events WHERE event_type='published'").get().n,1);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_product_review_events WHERE action='fast_published'").get().n,1);
    assert.ok(t.kv.get('published:products')?.includes('PZ-P1'));
    const queue=await (await t.admin('/admin/fast-lane/samples')).json();
    assert.equal(queue.items.length,1);
  }finally{t.close();}
});

test('untrusted users, new categories and active kill switches retain normal two-stage route',async()=>{
  const t=setup();
  try{
    t.sql.prepare("UPDATE pz_fast_lane_trust SET trusted=0 WHERE operator_id='op'").run();
    assert.equal((await fastLaneEligibility(t.env,t.getReview('p1'),t.snapshot('p1'))).eligible,false);
    t.sql.prepare("UPDATE pz_fast_lane_trust SET trusted=1 WHERE operator_id='op'").run();
    const unknown=await fastLaneEligibility(t.env,t.getReview('p1'),{...t.snapshot('p1'),category:'beds'});
    assert.equal(unknown.eligible,false);
    t.sql.prepare('UPDATE pz_fast_lane_settings SET enabled=0 WHERE id=1').run();
    assert.equal((await fastLaneEligibility(t.env,t.getReview('p1'),t.snapshot('p1'))).eligible,false);
    t.env.PZ_FAST_LANE_ENABLED='false';
    assert.equal((await fastLaneEligibility(t.env,t.getReview('p1'),t.snapshot('p1'))).eligible,false);
  }finally{t.close();}
});

test('second distinct sampled unpublish auto-revokes trust; admin can disable and explicitly revoke',async()=>{
  const t=setup();
  try{
    for(const id of ['p1','p2']){
      const published=await t.approve(id);
      assert.equal((await published.json()).status,'published');
      const sample=t.sql.prepare('SELECT id FROM pz_fast_lane_publications WHERE product_id=?').get(id);
      const hidden=await t.admin('/admin/fast-lane/samples/'+sample.id+'/unpublish','POST',{
        reason:'Image quality rejected during review'
      });
      assert.equal((await hidden.json()).status,'unpublished');
      assert.equal(t.getProduct(id).catalog_hidden,1);
    }
    assert.equal(t.sql.prepare("SELECT trusted FROM pz_fast_lane_trust WHERE operator_id='op'").get().trusted,0);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_fast_lane_events WHERE event_type='trust_auto_revoked'").get().n,1);
    const changed=await t.admin('/admin/fast-lane/settings','POST',{enabled:false,reason:'Emergency hold'});
    assert.equal((await changed.json()).enabled,false);
    const state=await (await t.admin('/admin/fast-lane/state')).json();
    assert.equal(state.enabled,false);
    const restored=await t.admin('/admin/fast-lane/operators/op/trust','POST',{trusted:false,reason:'Manual revocation'});
    assert.equal((await restored.json()).trusted,false);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_fast_lane_events").get().n>=5,true);
  }finally{t.close();}
});

test('Admin endpoints never accept a non-admin caller',async()=>{
  const t=setup();
  try{
    const response=await handleFastLaneAdmin(request('/admin/fast-lane/state'),t.env,{
      authorize:async()=>json({error:'Forbidden'},403),json,normalizeProductRows:rows=>rows});
    assert.equal(response.status,403);
  }finally{t.close();}
});
