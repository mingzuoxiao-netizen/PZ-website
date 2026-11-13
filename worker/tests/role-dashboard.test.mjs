import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {
  roleDashboardFetch,staleDraft,completenessGaps,completenessCsv
} from '../dashboardCore.mjs';

const now=Date.parse('2026-11-12T20:00:00.000Z');
const at=(days,hours=0)=>new Date(now-days*86400000-hours*3600000).toISOString();
const pics=['https://cdn.example/a','https://cdn.example/b','https://cdn.example/c','https://cdn.example/d'];
const specs=JSON.stringify({dimensions_cm:{length:180,width:90,height:75},
  media_roles:Object.fromEntries(pics.map((url,i)=>[url,['main','detail','lifestyle','material'][i]]))});
const serialized=JSON.stringify(pics);
function setup(){
  const sql=new DatabaseSync(':memory:');
  sql.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT,role TEXT,is_active INTEGER,deleted_at TEXT);
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY,is_active INTEGER);
    CREATE TABLE pz_staff_assignments(user_id TEXT PRIMARY KEY,department_id TEXT,job_type TEXT);
    CREATE TABLE products(id TEXT PRIMARY KEY,code TEXT,name TEXT,category TEXT,
      material TEXT,description TEXT,images TEXT,specs_json TEXT,created_by TEXT,
      status TEXT,created_at TEXT,updated_at TEXT,deleted_at TEXT,catalog_hidden INTEGER DEFAULT 0);
    CREATE TABLE pz_product_reviews(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,
      supervisor_id TEXT,department_id TEXT,status TEXT,latest_version INTEGER);
    CREATE TABLE pz_published_product_revisions(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,
      supervisor_id TEXT,department_id TEXT,status TEXT,latest_version INTEGER);
    CREATE TABLE pz_fast_lane_publications(id TEXT PRIMARY KEY,status TEXT);
    CREATE TABLE inquiries(id TEXT PRIMARY KEY,status TEXT,created_at TEXT);
  `);
  sql.prepare('INSERT INTO pz_departments VALUES(?,?)').run('dept',1);
  sql.prepare('INSERT INTO pz_departments VALUES(?,?)').run('otherdept',1);
  for(const row of [
    ['staff','员工具体','factory'],['sup','主管','factory'],['adm','管理员','admin'],
    ['other','其他部门','factory']
  ])sql.prepare('INSERT INTO users VALUES(?,?,?,?,NULL)').run(...row,1);
  for(const row of [['staff','dept','staff'],['sup','dept','supervisor'],['other','otherdept','staff']])
    sql.prepare('INSERT INTO pz_staff_assignments VALUES(?,?,?)').run(...row);
  const insert=(id,status,owner='staff',updated=at(1),overrides={})=>{
    const product={id,code:'PZ-'+id.toUpperCase()+'-001',name:'Solid Oak Dining Table',
      category:'dining-table',material:'White Oak',description:'Solid oak dining table',
      images:serialized,specs_json:specs,created_by:owner,status,created_at:at(15),
      updated_at:updated,deleted_at:null,catalog_hidden:0,...overrides};
    sql.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(product.id,product.code,product.name,product.category,product.material,
        product.description,product.images,product.specs_json,product.created_by,
        product.status,product.created_at,product.updated_at,
        product.deleted_at,product.catalog_hidden);
  };
  insert('draftold','draft','staff',at(8),{name:'',material:''});
  insert('draftnew','draft','staff',at(1));
  insert('returned','returned_to_uploader','staff',at(3));
  insert('pending1','pending_supervisor','staff',at(2));
  insert('pending2','pending_supervisor','staff',at(1));
  insert('revproduct','published','staff',at(1));
  insert('adminpending','pending_admin','staff',at(1));
  insert('otherdraft','draft','other',at(10));
  insert('published','published','staff',at(1),{name:'',material:''});
  insert('archived','archived','staff',at(5),{description:''});
  insert('deleted','draft','staff',at(12),{deleted_at:at(1)});
  insert('hiddendraft','published','staff',at(1),{catalog_hidden:1,description:''});
  const review=(id,product,status,version=1,supervisor='sup',department='dept',revision=false)=>{
    const table=revision?'pz_published_product_revisions':'pz_product_reviews';
    sql.prepare('INSERT INTO '+table+' VALUES(?,?,?,?,?,?,?)')
      .run(id,product,'staff',supervisor,department,status,version);
  };
  review('r1','pending1','pending_supervisor');
  review('r2','pending2','pending_supervisor',2);
  review('rv1','revproduct','pending_supervisor',1,'sup','dept',true);
  review('r3','adminpending','pending_admin');
  review('r4','revproduct','approved_pending_publish',1,'sup','dept',true);
  review('r5','otherdraft','pending_supervisor',1,'other','otherdept');
  review('r6','deleted','pending_supervisor',1);
  sql.prepare("INSERT INTO pz_fast_lane_publications VALUES('sample1','published')").run();
  sql.prepare("INSERT INTO pz_fast_lane_publications VALUES('sample2','sampled_ok')").run();
  for(const item of [
    ['recent','New',at(0,2)],['old','new',at(2)],['handled','replied',at(2)],
    ['recentclosed','closed',at(0,1)]
  ])sql.prepare('INSERT INTO inquiries VALUES(?,?,?)').run(...item);
  const env={DB:{prepare(query){
    const stmt=sql.prepare(query);
    return {bind(...args){
      return {
        first:async()=>stmt.get(...args)||null,
        all:async()=>({results:stmt.all(...args).map(row=>({...row}))}),
        run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}})
      };
    }};
  }}};
  const json=(value,status=200)=>Response.json(value,{status});
  const authorize=async request=>{
    const uid=request.headers.get('x-actor')||'staff';
    const role=uid==='adm'?'ADMIN':uid==='sup'?'SUPERVISOR':'FACTORY';
    const scope=new URL(request.url).pathname.split('/')[1];
    if(scope==='admin'&&role!=='ADMIN'||scope==='supervisor'&&role!=='SUPERVISOR'||
       scope==='factory'&&role!=='FACTORY')return json({error:'Forbidden'},403);
    return {user:{id:uid,role}};
  };
  const handle=roleDashboardFetch(async()=>json({legacy:true}),{authorize,json,clock:()=>now});
  const call=async(path,actor='adm')=>{
    const response=await handle(new Request('https://example.test/'+path,{
      headers:{'x-actor':actor}
    }),env,{});
    const type=response.headers.get('content-type')||'';
    return {status:response.status,data:type.includes('application/json')
      ?await response.json():await response.text(),headers:response.headers};
  };
  return {sql,call,close:()=>sql.close(),insert};
}

test('factory cards match all own status rows while old draft list excludes touched-yesterday and deleted',async()=>{
  const t=setup();try{
    const r=await t.call('factory/dashboard/home','staff');
    assert.equal(r.status,200,JSON.stringify(r.data));
    assert.equal(r.data.drafts,2);
    assert.equal(r.data.returned,1);
    assert.equal(r.data.in_review,3);
    assert.equal(r.data.stale_drafts,1);
    assert.equal(r.data.stale_items[0].id,'draftold');
    assert.equal(r.data.oldest_returned_at,at(3));
    assert.equal(staleDraft({status:'draft',updated_at:at(8)},now),true);
    assert.equal(staleDraft({status:'draft',updated_at:at(1)},now),false);
    assert.equal(staleDraft({status:'draft',updated_at:at(7)},now),false);
    assert.equal(staleDraft({status:'returned_to_uploader',updated_at:at(8)},now),false);
    assert.equal((await t.call('factory/dashboard/home','other')).data.stale_drafts,1);
    assert.equal((await t.call('factory/dashboard/home','unassigned')).status,403);
  }finally{t.close();}
});

test('supervisor first-review/recheck counts match the scoped release queue union',async()=>{
  const t=setup();try{
    const r=await t.call('supervisor/dashboard/home','sup');
    assert.equal(r.status,200,JSON.stringify(r.data));
    assert.equal(r.data.first_reviews,2); // product V1 + revision
    assert.equal(r.data.rechecks,1); // product V2
    assert.equal(r.data.total_pending,3);
    assert.equal(r.data.first_reviews+r.data.rechecks,r.data.total_pending);
    assert.equal((await t.call('supervisor/dashboard/home','staff')).status,403);
  }finally{t.close();}
});

test('admin counts final review, pending samples, 24-hour new inquiries, overdue and stale drafts',async()=>{
  const t=setup();try{
    const r=await t.call('admin/dashboard/home','adm');
    assert.equal(r.status,200,JSON.stringify(r.data));
    assert.deepEqual({
      final_review:r.data.final_review,sample_queue:r.data.sample_queue,
      new_inquiries_24h:r.data.new_inquiries_24h,
      overdue_inquiries:r.data.overdue_inquiries,stale_drafts:r.data.stale_drafts
    },{final_review:2,sample_queue:1,new_inquiries_24h:1,
      overdue_inquiries:1,stale_drafts:2});
    assert.equal((await t.call('admin/dashboard/home','staff')).status,403);
  }finally{t.close();}
});

test('exact preflight groups material+EN name on one otherwise-complete table',()=>{
  const product={name:'',code:'PZ-TABLE-001',category:'dining-table',material:'',
    description:'Solid oak dining table',images:pics,specifications:JSON.parse(specs)};
  assert.deepEqual(completenessGaps(product),['material','name']);
  assert.deepEqual(completenessGaps({...product,name:'Solid Oak Dining Table',material:'White Oak'}),[]);
});

test('completeness scan returns bounded page plus category/operator rollups and no published rows',async()=>{
  const t=setup();try{
    const r=await t.call('admin/dashboard/completeness?page=1&page_size=2','adm');
    assert.equal(r.status,200,JSON.stringify(r.data));
    assert.equal(r.data.list_version,1);
    assert.equal(r.data.page_size,2);
    assert.equal(r.data.items.length,2);
    assert.equal(r.data.total_scanned,9); // all nonpublished (and hidden published), excluding deleted/published
    assert.equal(r.data.total_with_gaps,3); // empty material/name, archived description, hidden description
    assert.equal(r.data.total,3);
    assert.equal(r.data.has_more,true);
    assert.equal(r.data.by_category.find(x=>x.category==='dining-table').count,3);
    assert.equal(r.data.by_owner.find(x=>x.owner_id==='staff').count,3);
    const gap=await t.call('admin/dashboard/completeness?category=dining-table&owner=staff&page=1&page_size=100');
    const matching=gap.data.items.find(x=>x.id==='draftold');
    assert.deepEqual(matching.missing,['material','name']);
    assert.ok(!gap.data.items.some(x=>x.id==='published'||x.id==='deleted'));
    const filtered=await t.call('admin/dashboard/completeness?category=not-real&owner=staff');
    assert.equal(filtered.data.total,0);
    assert.equal(filtered.data.by_category[0].count,3); // global summary remains unfiltered
    assert.equal((await t.call('admin/dashboard/completeness','staff')).status,403);
  }finally{t.close();}
});

test('CSV export includes all missing rows with no formula injection and never leaks product message',async()=>{
  const t=setup();try{
    const csv=await t.call('admin/dashboard/completeness?export=csv&page=1&page_size=1');
    assert.equal(csv.status,200);
    // Fetch Response.text() strips the BOM; the exported source still includes one.
    assert.ok(completenessCsv([{code:'PZ-TABLE-001',name:'Oak Table',category:'dining-table',owner_name:'staff',missing:['name']}]).startsWith('\uFEFF'));
    assert.match(csv.data,/主要材质/);
    assert.match(csv.data,/英文产品名称/);
    assert.equal(csv.data.split('\r\n').filter(Boolean).length,4);
    const injection=completenessCsv([{
      code:'=1+2',name:'@SUM(1)',category:'+foo',owner_name:'-bad',
      missing:['name']
    }]);
    assert.match(injection,/"'=1\+2"/);
    assert.match(injection,/"'@SUM\(1\)"/);
    assert.match(injection,/"'\+foo"/);
    assert.match(injection,/"'-bad"/);
  }finally{t.close();}
});

test('bad report params return visible errors rather than truncated or fabricated zero counts',async()=>{
  const t=setup();try{
    assert.equal((await t.call('admin/dashboard/completeness?page=0')).status,400);
    assert.equal((await t.call('admin/dashboard/completeness?page_size=5000')).status,400);
    assert.equal((await t.call('admin/dashboard/completeness?export=json')).status,400);
  }finally{t.close();}
});
