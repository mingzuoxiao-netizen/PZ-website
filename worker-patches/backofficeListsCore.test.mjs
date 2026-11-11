import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {pzBackofficeListsFetch} from './backofficeListsCore.mjs';

function setup(){
  const db=new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY,is_active INTEGER);
    CREATE TABLE pz_staff_assignments(user_id TEXT PRIMARY KEY,department_id TEXT,job_type TEXT);
    INSERT INTO pz_departments VALUES('d1',1),('d2',1),('inactive',0);
    INSERT INTO pz_staff_assignments VALUES('lead','d1','supervisor'),('other-lead','d2','supervisor'),
      ('staff','d1','staff'),('other','d2','data_entry'),('inactive','inactive','staff');
    CREATE TABLE products(id TEXT PRIMARY KEY,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,
      material TEXT,size TEXT,finish TEXT,code TEXT,description TEXT,description_cn TEXT,images TEXT,
      production_sites TEXT,specs_json TEXT,created_by TEXT,status TEXT,created_at TEXT,updated_at TEXT,
      deleted_at TEXT,private_legacy_field TEXT);
    CREATE TABLE pz_product_reviews(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,supervisor_id TEXT,
      department_id TEXT,status TEXT,latest_version INTEGER,approved_version INTEGER,return_reason TEXT,
      created_at TEXT,updated_at TEXT);
    CREATE TABLE pz_published_product_revisions(id TEXT PRIMARY KEY,product_id TEXT,submitter_id TEXT,
      supervisor_id TEXT,department_id TEXT,status TEXT,draft_revision INTEGER,latest_version INTEGER,
      approved_version INTEGER,return_reason TEXT,created_at TEXT,updated_at TEXT);
  `);
  const product=(id,owner='staff',status='draft',category='tables',deleted=null)=>db.prepare(
    `INSERT INTO products(id,name,name_cn,code,category,created_by,status,images,production_sites,
     specs_json,created_at,updated_at,deleted_at,private_legacy_field) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id,'Product '+id,'产品 '+id,'PZ-'+id,category,owner,status,'["https://cdn.example/a.jpg"]',
    '["zhaoqing"]','{"color":"oak"}','2026-01-01','2026-01-01',deleted,'do not expose');
  const review=(id,productId,status='pending_supervisor',lead='lead',dept='d1',staff='staff',time='2026-01-01')=>{
    db.prepare('INSERT INTO pz_product_reviews VALUES(?,?,?,?,?,?,1,NULL,NULL,?,?)')
      .run(id,productId,staff,lead,dept,status,time,time);
    db.prepare('INSERT INTO pz_published_product_revisions VALUES(?,?,?,?,?,?,1,1,NULL,NULL,?,?)')
      .run(id,productId,staff,lead,dept,status,time,time);
  };
  const env={PZ_RUNTIME_ENV:'production',PZ_ORG_RBAC_ENABLED:'true',
    PZ_TWO_STAGE_REVIEW_ENABLED:'true',PZ_PRODUCT_REVISIONS_ENABLED:'true',DB:{
      prepare(sql){return {bind(...args){return {
        sql,args,first:async()=>db.prepare(sql).get(...args)||null,
        all:async()=>({success:true,results:db.prepare(sql).all(...args)})
      };}};},
      async batch(statements){
        db.exec('BEGIN');
        try{const data=statements.map(s=>({success:true,results:db.prepare(s.sql).all(...s.args)}));db.exec('COMMIT');return data;}
        catch(e){db.exec('ROLLBACK');throw e;}
      }
    }};
  const roles={admin:'ADMIN',lead:'SUPERVISOR','other-lead':'SUPERVISOR',staff:'FACTORY',other:'FACTORY',inactive:'FACTORY',unassigned:'FACTORY'};
  const json=(body,status=200)=>Response.json(body,{status});
  let delegated=0;
  const handler=pzBackofficeListsFetch(async()=>{delegated++;return json({legacy:true});},{
    expectedRuntime:'production',json,
    authorize:async(request,env,allowed)=>{
      const id=request.headers.get('actor'),role=roles[id];
      return !role?json({error:'unauthenticated'},401):!allowed.includes(role)?json({error:'forbidden'},403):{user:{id,role}};
    }
  });
  const call=async(path,actor='admin',overrides={},method='GET')=>{
    const response=await handler(new Request('https://api.example'+path,{method,headers:{actor}}),{...env,...overrides},{});
    return {status:response.status,data:await response.json()};
  };
  return {db,env,product,review,call,get delegated(){return delegated;}};
}

test('older pending reviews survive 350 newer completed records; totals apply before pagination',async()=>{
  const s=setup();
  try{
    s.product('old');s.review('old','old','pending_admin');
    for(let i=0;i<350;i++){s.product('done'+i);s.review('done'+i,'done'+i,'published','lead','d1','staff','2026-11-10');}
    for(const kind of ['reviews','revisions']){
      const r=await s.call('/admin/'+kind+'?list_version=1&page_size=1');
      assert.equal(r.status,200);assert.equal(r.data.total,1);assert.equal(r.data.items[0].id,'old');
      assert.equal(r.data.has_more,false);assert.equal(r.data.list_version,1);
    }
  }finally{s.db.close();}
});

test('10,005 SKU pagination and search cover the full owner scope, not the old 500-row window',async()=>{
  const s=setup();
  try{
    s.db.exec('BEGIN');
    for(let i=0;i<10005;i++)s.product('SKU'+String(i).padStart(5,'0'));
    s.product('foreign','other');s.product('removed','staff','draft','tables','2026-11-01');
    s.db.exec('COMMIT');
    const page=await s.call('/factory/products?list_version=1&page=101&page_size=100','staff');
    assert.equal(page.status,200);assert.equal(page.data.total,10005);assert.equal(page.data.items.length,5);
    assert.equal(page.data.has_more,false);
    assert.equal(page.data.status_counts[0].count,10005);
    assert.equal(page.data.category_counts[0].count,10005);
    const found=await s.call('/factory/products?list_version=1&q=PZ-SKU00000','staff');
    assert.equal(found.data.total,1);assert.equal(found.data.items[0].id,'SKU00000');
    assert.deepEqual(found.data.items[0].images,['https://cdn.example/a.jpg']);
    assert.deepEqual(found.data.items[0].specifications,{color:'oak'});
    assert.equal(found.data.items[0].private_legacy_field,undefined);
    assert.equal(found.data.items[0].specs_json,undefined);
    const empty=await s.call('/factory/products?list_version=1&q=foreign','staff');
    assert.equal(empty.data.total,0);
  }finally{s.db.close();}
});

test('unified Admin release queue paginates both types together with a stable tie-breaker',async()=>{
  const s=setup();
  try{
    s.product('a');s.review('same-id','a','pending_admin');
    const first=await s.call('/admin/release-queue?list_version=1&page_size=1');
    const next=await s.call('/admin/release-queue?list_version=1&page_size=1&page=2');
    assert.equal(first.data.total,2);assert.equal(first.data.items[0].kind,'product');
    assert.equal(next.data.items[0].kind,'revision');assert.equal(next.data.has_more,false);
    const revisions=await s.call('/admin/release-queue?list_version=1&kind=revision');
    assert.equal(revisions.data.total,1);assert.equal(revisions.data.items[0].kind,'revision');
    assert.equal((await s.call('/admin/release-queue?list_version=1','lead')).status,403);
    assert.equal((await s.call('/admin/release-queue?list_version=1&kind=invalid')).status,400);
  }finally{s.db.close();}
});

test('same-time pagination is deterministic, exact SKU ranks first and SQL input stays data',async()=>{
  const s=setup();
  try{
    for(const id of ['a','b','c','a-extra'])s.product(id);
    const one=await s.call('/factory/products?list_version=1&page_size=2','staff');
    const two=await s.call('/factory/products?list_version=1&page_size=2&page=2','staff');
    assert.equal(new Set([...one.data.items,...two.data.items].map(x=>x.id)).size,4);
    assert.equal(one.data.has_more,true);assert.equal(two.data.has_more,false);
    const exact=await s.call('/factory/products?list_version=1&q=PZ-a','staff');
    assert.equal(exact.data.items[0].id,'a');
    const quoted=await s.call('/factory/products?list_version=1&q='+encodeURIComponent("' OR 1=1 --"),'staff');
    assert.equal(quoted.data.total,0);
  }finally{s.db.close();}
});

test('role, current department and ownership cannot be widened by caller filters',async()=>{
  const s=setup();
  try{
    s.product('mine');s.product('foreign','other');s.product('old-department');
    s.review('mine','mine');s.review('foreign','foreign','pending_supervisor','other-lead','d2','other');
    s.review('old-department','old-department','pending_supervisor','lead','d2');
    for(const kind of ['reviews','revisions']){
      const r=await s.call('/supervisor/'+kind+'?list_version=1','lead');
      assert.equal(r.data.total,1);assert.equal(r.data.items[0].id,'mine');
      const bypass=await s.call('/supervisor/'+kind+'?list_version=1&supervisor=other-lead','lead');
      assert.equal(bypass.data.total,0);
      assert.equal((await s.call('/admin/'+kind+'?list_version=1','staff')).status,403);
    }
    for(const actor of ['unassigned','inactive'])
      assert.equal((await s.call('/factory/products?list_version=1',actor)).status,403);
    const staff=await s.call('/factory/revisions?list_version=1','staff');
    assert.equal(staff.data.total,2);
    assert.equal((await s.call('/admin/reviews?list_version=1','anonymous')).status,401);
  }finally{s.db.close();}
});

test('status, Chinese name, category and site filters agree with matching total',async()=>{
  const s=setup();
  try{
    s.product('a');s.product('b','staff','published','chairs');s.product('c','staff','rejected');
    s.db.exec("UPDATE products SET production_sites='[]' WHERE id='c'");
    const match=await s.call('/factory/products?list_version=1&q='+encodeURIComponent('产品')+'&category=tables&site=unassigned&status=action','staff');
    assert.equal(match.data.total,1);assert.equal(match.data.items[0].id,'c');
    assert.equal(match.data.status_counts.reduce((n,x)=>n+x.count,0),3,'facets are complete owner-scope totals');
    assert.equal((await s.call('/factory/products?list_version=1&page=99','staff')).data.items.length,0);
  }finally{s.db.close();}
});

test('invalid filters, runtime mismatches and unavailable services fail explicitly',async()=>{
  const s=setup();
  try{
    for(const query of ['page=0','page=-1','page=1.5','page=100001','page_size=101','page_size=NaN',
      'q='+ 'x'.repeat(121),'sort=random','status=published','site=zhaoqing']){
      assert.equal((await s.call('/admin/reviews?list_version=1&'+query)).status,400,query);
    }
    assert.equal((await s.call('/factory/products?list_version=1&site=else','staff')).status,400);
    assert.equal((await s.call('/factory/products?list_version=1&department=d2','staff')).status,400);
    assert.equal((await s.call('/admin/reviews?list_version=1','admin',{PZ_RUNTIME_ENV:'staging'})).status,403);
    assert.equal((await s.call('/admin/reviews?list_version=1','admin',{PZ_TWO_STAGE_REVIEW_ENABLED:'false'})).status,503);
    assert.equal((await s.call('/factory/revisions?list_version=1','staff',{PZ_PRODUCT_REVISIONS_ENABLED:'false'})).status,404);
    assert.equal((await s.call('/factory/products?list_version=1','staff',{DB:null})).status,503);
    const badDB={prepare:()=>({bind:()=>({first:async()=>({department_id:'d1'})})}),batch:async()=>[{success:false}]};
    const failed=await s.call('/admin/reviews?list_version=1','admin',{DB:badDB});
    assert.equal(failed.status,503);assert.equal(failed.data.total,undefined);
  }finally{s.db.close();}
});

test('legacy reads, mutations and unrelated routes keep their original handlers',async()=>{
  const s=setup();
  try{
    for(const [path,method] of [['/admin/reviews','GET'],['/admin/reviews?list_version=1','POST'],
      ['/admin/reviews/one/approve?list_version=1','POST'],['/products?list_version=1','GET'],
      ['/admin/products?list_version=1','GET']]){
      assert.equal((await s.call(path,'admin',{},method)).data.legacy,true);
    }
    assert.equal(s.delegated,5);
  }finally{s.db.close();}
});

test('both copy-ready runtime candidates embed the exact tested implementation',()=>{
  const module=readFileSync(new URL('./backofficeListsCore.mjs',import.meta.url),'utf8')
    .replace('export function pzBackofficeListsFetch','function pzBackofficeListsFetch');
  for(const [name,runtime] of [['production-worker-admin-delete-v2-COPY.js','production'],
    ['staging-worker-category-changes-REVIEW.js','staging']]){
    const source=readFileSync(new URL('./'+name,import.meta.url),'utf8');
    assert.ok(source.includes('// BEGIN PAGINATED BACKOFFICE LISTS V1\n'+module));
    assert.ok(source.includes("pzBackofficeListsFetch(index_default.fetch, {authorize,json,expectedRuntime:'"+runtime+"'})"));
  }
});

test('optional list indexes apply repeatedly without changing product or review records',()=>{
  const s=setup();
  try{
    s.product('unchanged');s.review('unchanged','unchanged');
    const before=s.db.prepare('SELECT * FROM products').all();
    const migration=readFileSync(new URL('./migrations/017_backoffice_list_indexes_REVIEW.sql',import.meta.url),'utf8');
    s.db.exec(migration);s.db.exec(migration);
    assert.deepEqual(s.db.prepare('SELECT * FROM products').all(),before);
    assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%_list'").get().n,7);
  }finally{s.db.close();}
});
