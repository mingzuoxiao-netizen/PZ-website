import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {saveDraftWithCas,validEditToken} from '../productDraftCas.mjs';
import {productPresenceFetch,expired} from '../productPresenceCore.mjs';

const BASE_TIME='2026-11-12T10:00:00.000Z';
const COLUMNS=[
  'name','name_cn','category','sub_category','material','size','finish','code',
  'description','description_cn','images_json','production_sites_json','specs_json'
];
function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY,is_active INTEGER);
    CREATE TABLE pz_staff_assignments(user_id TEXT,department_id TEXT,job_type TEXT);
    CREATE TABLE products(
      id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,material TEXT,
      size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,images TEXT,
      production_sites TEXT,specs_json TEXT,created_by TEXT,status TEXT,updated_at TEXT,
      deleted_at TEXT
    );
  `);
  const migration=readFileSync(new URL('../../worker-patches/migrations/022_product_edit_presence_REVIEW.sql',import.meta.url),'utf8');
  sql.exec(migration);
  for(const row of [['alice','员工甲'],['bob','员工乙'],['admin','管理员']])
    sql.prepare('INSERT INTO users VALUES(?,?,1,NULL)').run(...row);
  sql.prepare("INSERT INTO pz_departments VALUES('dept',1)").run();
  for(const person of ['alice','bob'])sql.prepare(
    "INSERT INTO pz_staff_assignments VALUES(?,'dept','staff')").run(person);
  const orig={
    name:'Oak Table',name_cn:'橡木餐桌',category:'dining-table',sub_category:'tables',
    material:'White Oak',size:'180 × 90 × 76 cm',finish:'Matte',
    code:'PZ-OAK-001',description:'Original product',description_cn:'原有描述',
    images:'["https://cdn.peng-zhan.com/1.jpg"]',
    production_sites:'["zhaoqing"]',specs_json:'{"schema_version":1}',
    created_by:'alice',status:'draft',updated_at:BASE_TIME,deleted_at:null
  };
  sql.prepare('INSERT INTO products(id,'+Object.keys(orig).join(',')+
    ') VALUES('+Array(1+Object.keys(orig).length).fill('?').join(',')+')')
    .run('p1',...Object.values(orig));
  const env={DB:{prepare(sqlText){
    const stmt=sql.prepare(sqlText);
    return {bind(...args){return{
      first:async()=>stmt.get(...args)||null,
      all:async()=>({results:stmt.all(...args).map(x=>({...x}))}),
      run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})
    };}};
  }}};
  const dbFields={name:'Oak Table',name_cn:'橡木餐桌',category:'dining-table',
    sub_category:'tables',material:'White Oak',size:'180 × 90 × 76 cm',
    finish:'Matte',code:'PZ-OAK-001',description:'Original product',description_cn:'原有描述',
    images_json:orig.images,production_sites_json:orig.production_sites,specs_json:orig.specs_json};
  return {sql,env,dbFields,close:()=>sql.close()};
}

test('two editing sessions: only the first CAS succeeds; second keeps unsaved changes for merge',async()=>{
  const t=setup();try{
    assert.equal(validEditToken(BASE_TIME,0),true);
    assert.equal(validEditToken('',0),false);
    assert.equal(validEditToken(BASE_TIME,-1),false);
    const first=await saveDraftWithCas(t.env,{id:'p1',actor:'alice',
      expectedUpdatedAt:BASE_TIME,expectedRevision:0,
      db:{...t.dbFields,description:'Edited by Alice'},
      now:'2026-11-12T10:05:00.000Z'});
    assert.equal(first.status,200);
    assert.equal(first.body.edit_revision,1);
    const loserLocal={...t.dbFields,description:'Edited by Bob but NOT overwritten'};
    const second=await saveDraftWithCas(t.env,{id:'p1',actor:'bob',
      expectedUpdatedAt:BASE_TIME,expectedRevision:0,db:loserLocal,
      now:'2026-11-12T10:06:00.000Z'});
    assert.equal(second.status,409);
    assert.equal(second.body.code,'PRODUCT_EDIT_CONFLICT');
    assert.match(second.body.error,/员工甲/);
    assert.match(second.body.error,/2026-11-12T10:05/);
    const stored=t.sql.prepare('SELECT description,edit_revision,last_editor_id FROM products WHERE id=?').get('p1');
    assert.deepEqual({...stored},{description:'Edited by Alice',edit_revision:1,last_editor_id:'alice'});
    assert.equal(loserLocal.description,'Edited by Bob but NOT overwritten');
    const resolved=await saveDraftWithCas(t.env,{id:'p1',actor:'alice',
      expectedUpdatedAt:first.body.updated_at,expectedRevision:first.body.edit_revision,
      db:loserLocal,now:'2026-11-12T10:07:00.000Z'});
    assert.equal(resolved.status,200);
    assert.equal(t.sql.prepare("SELECT description FROM products WHERE id='p1'").get().description,
      loserLocal.description);
  }finally{t.close();}
});

test('missing version is refused; status transition also prevents outdated draft saves',async()=>{
  const t=setup();try{
    const notVersioned=await saveDraftWithCas(t.env,{id:'p1',actor:'alice',
      expectedUpdatedAt:undefined,expectedRevision:0,db:t.dbFields});
    assert.equal(notVersioned.status,428);
    assert.equal(notVersioned.body.code,'PRODUCT_EDIT_VERSION_REQUIRED');
    t.sql.prepare("UPDATE products SET status='pending_supervisor',updated_at=? WHERE id='p1'")
      .run('2026-11-12T10:01:00.000Z');
    const after=await saveDraftWithCas(t.env,{id:'p1',actor:'alice',
      expectedUpdatedAt:BASE_TIME,expectedRevision:0,db:t.dbFields});
    assert.equal(after.status,409);
    assert.equal(after.body.current_status,'pending_supervisor');
    assert.equal(t.sql.prepare("SELECT description FROM products WHERE id='p1'").get().description,
      'Original product');
  }finally{t.close();}
});

test('server checks 90s presence expiry and access; warning is not a lock',async()=>{
  const t=setup();let at=Date.parse('2026-11-12T10:00:00Z');
  try{
    const authorize=async request=>{
      const actor=request.headers.get('x-actor');
      if(!['alice','bob','admin'].includes(actor))return Response.json({error:'Forbidden'},{status:403});
      return {user:{id:actor,role:actor==='admin'?'ADMIN':'FACTORY'}};
    };
    const handle=productPresenceFetch(async()=>Response.json({legacy:true}),{
      authorize,json:(body,status=200)=>Response.json(body,{status}),clock:()=>at
    });
    const call=async(path,method,actor,body=null)=>{
      const res=await handle(new Request('https://test.example/'+path,{
        method,headers:{'x-actor':actor,'content-type':'application/json'},
        ...(body===null?{}:{body:JSON.stringify(body)})
      }),t.env,{});
      return {status:res.status,body:await res.json()};
    };
    const sessA='alice-session-123456',sessB='admin-session-123456';
    const first=await call('factory/products/p1/presence','POST','alice',{session_id:sessA});
    assert.equal(first.status,200);assert.equal(first.body.others.length,0);
    const second=await call('factory/products/p1/presence','POST','admin',{session_id:sessB});
    assert.equal(second.status,200);
    assert.equal(second.body.others[0].name,'员工甲');
    const state=await call('factory/products/p1/edit-state','GET','admin');
    assert.equal(state.body.product.edit_revision,0);
    assert.equal(state.body.others.length,1);
    // Unauthorized factory employee cannot snoop another operator's editor.
    assert.equal((await call('factory/products/p1/edit-state','GET','bob')).status,403);
    assert.equal((await call('factory/products/p1/presence','POST','bob',
      {session_id:'bob-session-123456'})).status,403);
    assert.equal(expired('2026-11-12T10:00:00.000Z',at+89999),false);
    assert.equal(expired('2026-11-12T10:00:00.000Z',at+90000),true);
    at+=90001;
    const expiredState=await call('factory/products/p1/edit-state','GET','admin');
    assert.equal(expiredState.body.others.length,0);
    // No hard lock: an expired presence cannot stop an independent CAS save.
    const saved=await saveDraftWithCas(t.env,{id:'p1',actor:'alice',
      expectedUpdatedAt:BASE_TIME,expectedRevision:0,db:t.dbFields,
      now:'2026-11-12T10:03:00.000Z'});
    assert.equal(saved.status,200);
    const cleared=await call('factory/products/p1/presence','DELETE','alice',{session_id:sessA});
    assert.equal(cleared.status,200);
  }finally{t.close();}
});

test('product photo references remain product-owned: no editing coordination deletes R2 objects',()=>{
  const worker=readFileSync(new URL('../productPresenceCore.mjs',import.meta.url),'utf8');
  const cas=readFileSync(new URL('../productDraftCas.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(worker+cas,/\.delete\(/);
  assert.match(cas,/edit_revision=edit_revision\+1/);
  assert.match(cas,/AND updated_at=\?/);
});
