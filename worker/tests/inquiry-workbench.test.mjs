import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {inquiryWorkbenchFetch,isInquiryOverdue} from '../inquiryWorkbenchCore.mjs';

const migration=readFileSync(
  new URL('../../worker-patches/migrations/021_inquiry_workbench_REVIEW.sql',import.meta.url),'utf8');
const at='2026-11-12T12:00:00.000Z';
const uuid='a1e0f005-0000-4000-8000-000000000001';
function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec('PRAGMA foreign_keys=ON');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE inquiries(id TEXT PRIMARY KEY,name TEXT,email TEXT,company TEXT,
      product_type TEXT,message TEXT,source TEXT,created_at TEXT,status TEXT,website TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,code TEXT,status TEXT,deleted_at TEXT);
    CREATE TABLE pz_notifications(
      id TEXT PRIMARY KEY,recipient_id TEXT,source_event_id TEXT,event_type TEXT,entity_type TEXT,
      entity_id TEXT,title TEXT,message TEXT,created_at TEXT,email_state TEXT,
      UNIQUE(recipient_id,source_event_id));
  `);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('admin1','Admin甲','admin',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('admin2','Admin乙','admin',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('staff','工厂员工','factory',1);
  sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run('inactive','已停用','factory',0);
  sql.prepare("INSERT INTO products VALUES('p1','PZ-TABLE-001','published',NULL)").run();
  sql.prepare("INSERT INTO products VALUES('p2','PZ-SECRET-001','draft',NULL)").run();
  sql.prepare('INSERT INTO inquiries VALUES(?,?,?,?,?,?,?,?,?,?)').run(
    'legacy','Old','legacy@example.test','Old Co','General','Historical contact','website',
    '2026-11-08T01:00:00.000Z','Read','https://example.test/inquire');
  sql.exec(migration);
  const db={prepare(query){
    const stmt=sql.prepare(query);
    const convert=rows=>rows.map(x=>({...x}));
    return{
      bind(...args){return{
        first:async()=>stmt.get(...args)||null,
        all:async()=>({results:convert(stmt.all(...args))}),
        run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})
      };},
      first:async()=>stmt.get()||null,
      all:async()=>({results:convert(stmt.all())}),
      run:async()=>({meta:{changes:Number(stmt.run().changes)}})
    };
  }};
  const env={DB:db};
  const json=(data,status=200)=>Response.json(data,{status});
  const upstream=async(request)=>{
    const url=new URL(request.url);
    if(url.pathname==='/admin/inquiries'&&request.method==='GET')
      return json({inquiries:sql.prepare('SELECT id,name,email,message,created_at FROM inquiries LIMIT 500').all()});
    if(url.pathname==='/inquiries'&&request.method==='POST'){
      const body=await request.json();
      sql.prepare('INSERT INTO inquiries(id,name,email,company,product_type,message,source,created_at,status,website) VALUES(?,?,?,?,?,?,?,?,?,?)')
        .run(uuid,body.name,body.email,body.company,'General',body.message,'website',
          '2026-11-12T11:30:00.000Z','New',body.website||'');
      return json({success:true,id:uuid},201);
    }
    return json({error:'Not found'},404);
  };
  const auth=async request=>request.headers.get('x-test-role')==='ADMIN'
    ?{user:{id:'admin1',role:'ADMIN'}}
    :json({error:'Forbidden'},403);
  const handle=inquiryWorkbenchFetch(upstream,{authorize:auth,json});
  const call=async(path,method='GET',body=null,role='ADMIN')=>{
    const response=await handle(new Request('https://api.example.test/'+path,{
      method,headers:{'x-test-role':role,'content-type':'application/json'},
      ...(body===null?{}:{body:JSON.stringify(body)})
    }),env,{});
    return {status:response.status,data:await response.json()};
  };
  return {sql,env,call,close:()=>sql.close()};
}
test('migration preserves old inquiry and starts untracked entries as new and unassigned',()=>{
  const t=setup();try{
    const row=t.sql.prepare('SELECT status,assignee_id,internal_notes,version FROM inquiries WHERE id=?').get('legacy');
    assert.deepEqual(row,{status:'new',assignee_id:null,internal_notes:'',version:0});
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_inquiry_history").get().n,0);
  }finally{t.close();}
});

test('public inquiry insertion notifies both admins and optional product code/country are verified',async()=>{
  const t=setup();
  try{
    const r=await t.call('inquiries','POST',{
      name:'Client',company:'Acme',email:'client@example.test',message:'Please quote',
      country:'United States',product_code:'PZ-TABLE-001',website:'https://example.test'
    });
    assert.equal(r.status,201);
    const row=t.sql.prepare('SELECT status,country,linked_product_code FROM inquiries WHERE id=?').get(uuid);
    assert.equal(row.country,'United States');
    assert.equal(row.linked_product_code,'PZ-TABLE-001');
    assert.equal(row.status.toLowerCase(),'new');
    const notes=t.sql.prepare('SELECT recipient_id,event_type FROM pz_notifications ORDER BY recipient_id').all();
    assert.deepEqual(notes.map(x=>x.recipient_id),['admin1','admin2']);
    assert.ok(notes.every(x=>x.event_type==='inquiry_received'));
    const list=await t.call('admin/inquiries?list_version=1&page=1&page_size=50');
    assert.equal(list.status,200);
    assert.equal(list.data.total,2);
    assert.equal(list.data.items[0].status,'new');
    assert.equal(list.data.items[0].linked_product_code,'PZ-TABLE-001');
    assert.ok(!Object.hasOwn(list.data.items[0],'internal_notes'));
    assert.ok(!Object.hasOwn(list.data.items[0],'message'));
  }finally{t.close();}
});

test('unverified/draft product code is discarded and legacy read endpoint stays read-only',async()=>{
  const t=setup();try{
    const r=await t.call('inquiries','POST',{name:'Client',email:'a@b.test',
      company:'Acme',message:'Hello',product_code:'PZ-SECRET-001'});
    assert.equal(r.status,201);
    assert.equal(t.sql.prepare('SELECT linked_product_code FROM inquiries WHERE id=?').get(uuid).linked_product_code,null);
    const legacy=await t.call('admin/inquiries');
    assert.equal(legacy.status,200);
    assert.ok(Array.isArray(legacy.data.inquiries));
    assert.deepEqual(Object.keys(legacy.data.inquiries[0]).sort(),['created_at','email','id','message','name']);
    assert.equal((await t.call('admin/inquiries?list_version=1&page=1&page_size=50','GET',null,'FACTORY')).status,403);
    assert.equal((await t.call('admin/inquiries/legacy','GET',null,'FACTORY')).status,403);
    assert.equal((await t.call('admin/inquiries/legacy','PUT',{expected_version:0,status:'won'},'FACTORY')).status,403);
  }finally{t.close();}
});

test('overdue applies only to new inquiries exactly 24h after receipt; filters are server side',async()=>{
  assert.equal(isInquiryOverdue('2026-11-11T12:00:00.000Z','new',Date.parse(at)),true);
  assert.equal(isInquiryOverdue('2026-11-11T12:00:01.000Z','new',Date.parse(at)),false);
  assert.equal(isInquiryOverdue('2026-11-10T12:00:00.000Z','replied',Date.parse(at)),false);
  const t=setup();
  try{
    const old=await t.call('admin/inquiries?list_version=1&page=1&page_size=50&overdue=1');
    assert.equal(old.status,200);
    assert.equal(old.data.total,1);
    assert.equal(old.data.items[0].id,'legacy');
    assert.equal(old.data.items[0].is_overdue,true);
    const filtered=await t.call('admin/inquiries?list_version=1&page=1&page_size=50&status=replied');
    assert.equal(filtered.data.total,0);
    const paged=await t.call('admin/inquiries?list_version=1&page=2&page_size=1');
    assert.equal(paged.data.total,1);
    assert.equal(paged.data.items.length,0);
    assert.equal(paged.data.has_more,false);
  }finally{t.close();}
});

test('admin status+assignee persist with atomic immutable history and first response time',async()=>{
  const t=setup();try{
    const result=await t.call('admin/inquiries/legacy','PUT',{
      expected_version:0,status:'replied',assignee_id:'staff',internal_notes:'内部定价：仅管理员查看'
    });
    assert.equal(result.status,200,JSON.stringify(result.data));
    assert.equal(result.data.version,1);
    assert.equal(result.data.status,'replied');
    assert.ok(result.data.first_response_at);
    const details=await t.call('admin/inquiries/legacy');
    assert.equal(details.status,200);
    assert.equal(details.data.item.internal_notes,'内部定价：仅管理员查看');
    assert.equal(details.data.item.assignee_id,'staff');
    assert.equal(details.data.history.length,2);
    assert.deepEqual(details.data.history.map(x=>x.field).sort(),['assignee_id','status']);
    assert.ok(details.data.history.every(x=>x.actor_id==='admin1'));
    const assigned=t.sql.prepare(
      "SELECT recipient_id,event_type FROM pz_notifications WHERE event_type='inquiry_assigned'").all();
    assert.deepEqual(assigned,[{recipient_id:'staff',event_type:'inquiry_assigned'}]);
    const conflict=await t.call('admin/inquiries/legacy','PUT',{expected_version:0,status:'won'});
    assert.equal(conflict.status,409);
    const updated=await t.call('admin/inquiries/legacy','PUT',{expected_version:1,status:'quoted'});
    assert.equal(updated.status,200);
    const after=await t.call('admin/inquiries/legacy');
    assert.equal(after.data.item.first_response_at,details.data.item.first_response_at);
    assert.equal(after.data.history.length,3);
    assert.throws(()=>t.sql.prepare("DELETE FROM pz_inquiry_history").run(),/append only/);
  }finally{t.close();}
});

test('bad assignees, invalid transitions and note input fail without touching audit history',async()=>{
  const t=setup();try{
    const fail=[
      {body:{expected_version:0,status:'invented'},status:400},
      {body:{expected_version:0,status:'won',assignee_id:'inactive'},status:409},
      {body:{expected_version:0,internal_notes:'x'.repeat(5001)},status:400},
      {body:{expected_version:0,status:'quoted',notes:'leak'},status:400},
      {body:{expected_version:12,status:'won'},status:409}
    ];
    for(const item of fail)assert.equal((await t.call('admin/inquiries/legacy','PUT',item.body)).status,item.status);
    assert.equal(t.sql.prepare("SELECT COUNT(*) AS n FROM pz_inquiry_history").get().n,0);
    assert.equal(t.sql.prepare("SELECT version FROM inquiries WHERE id='legacy'").get().version,0);
    const assignees=await t.call('admin/inquiries/assignees');
    assert.equal(assignees.status,200);
    assert.ok(assignees.data.items.some(x=>x.id==='staff'));
    assert.ok(!assignees.data.items.some(x=>x.id==='inactive'));
  }finally{t.close();}
});

test('internal notes are admin-only; public submission response and notifications omit notes',async()=>{
  const t=setup();try{
    const saved=await t.call('admin/inquiries/legacy','PUT',{
      expected_version:0,internal_notes:'SECRET-PRICING-DO-NOT-PUBLISH'});
    assert.equal(saved.status,200);
    const legacy=await t.call('admin/inquiries');
    assert.doesNotMatch(JSON.stringify(legacy.data),/SECRET-PRICING/);
    const list=await t.call('admin/inquiries?list_version=1&page=1&page_size=50');
    assert.doesNotMatch(JSON.stringify(list.data),/SECRET-PRICING/);
    const publicResponse=await t.call('inquiries','POST',{name:'A',company:'B',
      email:'a@b.test',message:'Public'});
    assert.deepEqual(publicResponse.data,{success:true,id:uuid});
    assert.doesNotMatch(JSON.stringify(t.sql.prepare('SELECT title,message FROM pz_notifications').all()),/SECRET-PRICING/);
  }finally{t.close();}
});
