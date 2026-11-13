import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {productBulkFetch,BULK_LIMIT} from '../productBulkCore.mjs';
import {preflightProduct} from '../../utils/productPreflight.js';

const sharedImages=['https://cdn.peng-zhan.com/001.jpg','https://cdn.peng-zhan.com/002.jpg',
  'https://cdn.peng-zhan.com/003.jpg','https://cdn.peng-zhan.com/004.jpg'];
const validSpecs={schema_version:1,packaging:[{carton_no:1,length_cm:100,width_cm:70,height_cm:20}],
  dimensions_cm:{length:180,width:90,height:76},
  media_roles:Object.fromEntries(sharedImages.map((url,i)=>[url,i===0?'main':'detail']))};
let counter=0;
function setup(){
  counter=0;
  const db=new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE users(id TEXT PRIMARY KEY,role TEXT);
    CREATE TABLE pz_departments(id TEXT PRIMARY KEY,is_active INTEGER);
    CREATE TABLE pz_staff_assignments(user_id TEXT PRIMARY KEY,department_id TEXT,job_type TEXT);
    CREATE TABLE products (
      id TEXT PRIMARY KEY,code TEXT UNIQUE,name TEXT,name_cn TEXT,category TEXT,sub_category TEXT,
      material TEXT,size TEXT,finish TEXT,description TEXT,description_cn TEXT,images TEXT,
      production_sites TEXT,specs_json TEXT,created_by TEXT,status TEXT,updated_at TEXT,
      deleted_at TEXT,catalog_hidden INTEGER,archived_at TEXT);
    CREATE TABLE audit_logs(id TEXT PRIMARY KEY,action TEXT,entity_id TEXT,reason TEXT);
    CREATE TABLE reviews(product_id TEXT PRIMARY KEY,status TEXT);
  `);
  for(const row of [['u1','factory'],['u2','factory'],['admin1','admin']])
    db.prepare('INSERT INTO users VALUES(?,?)').run(...row);
  db.prepare('INSERT INTO pz_departments VALUES(?,1)').run('d1');
  db.prepare('INSERT INTO pz_staff_assignments VALUES(?,?,?)').run('u1','d1','staff');
  db.prepare('INSERT INTO pz_staff_assignments VALUES(?,?,?)').run('u2','d1','staff');
  const add=(id,overrides={})=>{
    const p={id,code:'PZ-'+id.toUpperCase(),name:'Solid Oak Dining Table',
      name_cn:'白橡木餐桌',category:'dining-table',sub_category:'tables',
      material:'White Oak',size:'180 × 90 × 76 cm',finish:'Matte PU',
      description:'Solid oak dining table for four people.',
      description_cn:'白橡木餐桌',images:JSON.stringify(sharedImages),
      production_sites:'["zhaoqing"]',specs_json:JSON.stringify(validSpecs),
      created_by:'u1',status:'draft',updated_at:'2026-11-12T10:00:00Z',
      deleted_at:null,catalog_hidden:0,archived_at:null,...overrides};
    db.prepare('INSERT INTO products VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      ...Object.keys(p).map(k=>p[k]));
    return p;
  };
  add('published',{status:'published'});
  add('own',{});
  add('someone',{created_by:'u2',status:'draft'});
  const dbBinding={prepare(sql){
    const stmt=db.prepare(sql);
    return {bind(...args){return{
      first:async()=>stmt.get(...args)||null,
      run:async()=>({meta:{changes:Number(stmt.run(...args).changes)}}),
      all:async()=>({results:stmt.all(...args)})
    };}};
  }};
  const json=(data,status=200)=>Response.json(data,{status});
  const calls=[];
  const upstream=async(request)=>{
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const actor=request.headers.get('x-actor')||'u1';
    const role=request.headers.get('x-role')||'FACTORY';
    const body=method==='POST'||method==='PUT'?await request.json():{};
    calls.push({method,path,body});
    const fail=(error,status=400,issues)=>json({error,...(issues?{issues}:{})},status);
    if(path==='/factory/products'&&method==='POST'){
      const duplicate=db.prepare('SELECT id FROM products WHERE code=?').get(body.code);
      if(duplicate)return fail('SKU already exists',409);
      if(!/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(body.code))return fail('Invalid code');
      const id='copy'+(++counter);
      add(id,{...Object.fromEntries(
        ['name','name_cn','category','sub_category','material','size','finish',
          'description','description_cn'].map(k=>[k,body[k]])),
        id,code:body.code,status:'draft',created_by:actor,
        images:JSON.stringify(body.images),production_sites:JSON.stringify(body.production_sites),
        specs_json:JSON.stringify(body.specifications),updated_at:'2026-11-12T20:00:00Z'});
      return json({success:true,id,status:'draft'},201);
    }
    const item=path.match(/^\/factory\/products\/([^/]+)$/);
    if(item&&method==='PUT'){
      const row=db.prepare('SELECT * FROM products WHERE id=?').get(item[1]);
      if(!row||(!['draft','rejected'].includes(row.status)))return fail('Product state conflict',409);
      if(role!=='ADMIN'&&actor!==row.created_by)return fail('Not owner',403);
      db.prepare('UPDATE products SET category=?,images=?,specs_json=?,updated_at=? WHERE id=?')
        .run(body.category,JSON.stringify(body.images),JSON.stringify(body.specifications),
          '2026-11-12T20:01:00Z',item[1]);
      return json({success:true,id:item[1]});
    }
    const submit=path.match(/^\/factory\/products\/([^/]+)\/submit$/);
    if(submit&&method==='POST'){
      const row=db.prepare('SELECT * FROM products WHERE id=?').get(submit[1]);
      if(!row||actor!==row.created_by)return fail('Not owner',403);
      if(!['draft','rejected','returned_to_uploader'].includes(row.status))
        return fail('Product state conflict',409);
      const issues=preflightProduct({
        ...row,images:JSON.parse(row.images),specifications:JSON.parse(row.specs_json)
      });
      if(issues.errors.length)return fail('Preflight failed',400,issues.errors);
      db.prepare("UPDATE products SET status='pending_supervisor' WHERE id=?").run(submit[1]);
      db.prepare('INSERT OR IGNORE INTO reviews VALUES(?,?)').run(submit[1],'pending_supervisor');
      return json({success:true,status:'pending_supervisor',id:submit[1]});
    }
    const unpublish=path.match(/^\/admin\/products\/([^/]+)\/unpublish$/);
    if(unpublish&&method==='POST'){
      if(role!=='ADMIN')return fail('Forbidden',403);
      const row=db.prepare('SELECT * FROM products WHERE id=?').get(unpublish[1]);
      if(!row||row.status!=='published'||row.archived_at||row.catalog_hidden)
        return fail('Not eligible to unpublish',409);
      db.prepare('UPDATE products SET catalog_hidden=1 WHERE id=?').run(unpublish[1]);
      db.prepare('INSERT INTO audit_logs VALUES(?,?,?,?)')
        .run('a'+(++counter),'product.unpublish',unpublish[1],body.reason||null);
      return json({success:true,id:unpublish[1]});
    }
    return fail('Unexpected legacy route '+path,404);
  };
  const authorize=async(request,env,roles)=>{
    const role=request.headers.get('x-role')||'FACTORY';
    if(!roles.includes(role))return json({error:'Forbidden'},403);
    return {user:{id:request.headers.get('x-actor')||'u1',role}};
  };
  const env={DB:dbBinding,
    SITE_CONFIG_KV:{get:async()=>JSON.stringify({categories:[
      {id:'dining-table',title:'Tables'},{id:'chairs',title:'Chairs'}]})}};
  const execute=productBulkFetch(upstream,{authorize,json});
  const call=async(path,body={},role='FACTORY',actor=role==='ADMIN'?'admin1':'u1',method='POST')=>{
    const res=await execute(new Request('https://api.test'+path,{
      method,headers:{'content-type':'application/json','x-role':role,'x-actor':actor},
      body:JSON.stringify(body)
    }),env,{});
    return {status:res.status,data:await res.json()};
  };
  return {db,env,calls,call,add,close:()=>db.close()};
}
test('duplicate published product makes a new DRAFT owned by copier; packaging and shared images stay intact',async()=>{
  const t=setup();try{
    const source=t.db.prepare("SELECT * FROM products WHERE id='published'").get();
    const result=await t.call('/factory/products/published/duplicate',
      {code:'PZ-PUBLISHED-COPY',draft:{}});
    assert.equal(result.status,200,JSON.stringify(result.data));
    const copy=t.db.prepare('SELECT * FROM products WHERE id=?').get(result.data.id);
    assert.equal(copy.code,'PZ-PUBLISHED-COPY');
    assert.equal(copy.status,'draft');assert.equal(copy.created_by,'u1');
    assert.deepEqual(JSON.parse(copy.images),JSON.parse(source.images));
    assert.deepEqual(JSON.parse(copy.specs_json).packaging,JSON.parse(source.specs_json).packaging);
    assert.equal(JSON.parse(copy.specs_json).provenance.inherited_images_from,source.code);
    assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM reviews WHERE product_id=?').get(copy.id).n,0);
    assert.equal(t.calls.filter(x=>x.path==='/factory/products').length,1);
    // Updating only the duplicate's images/roles never changes the source row/R2 objects.
    const edited={...copy,images:['https://cdn.peng-zhan.com/new.jpg'],
      specifications:{...JSON.parse(copy.specs_json),media_roles:{'https://cdn.peng-zhan.com/new.jpg':'main'}}};
    const update=await t.call('/factory/products/'+copy.id,edited,'FACTORY','u1','PUT');
    assert.equal(update.status,200);
    const sourceAfter=t.db.prepare("SELECT images,specs_json FROM products WHERE id='published'").get();
    assert.equal(sourceAfter.images,source.images);
    assert.equal(sourceAfter.specs_json,source.specs_json);
  }finally{t.close();}
});
test('duplicate rejected if source outside factory ownership, unsafe override or reused/invalid SKU',async()=>{
  const t=setup();try{
    assert.equal((await t.call('/factory/products/someone/duplicate',{code:'PZ-NEW-COPY'})).status,403);
    assert.equal((await t.call('/factory/products/own/duplicate',{code:'PZ-OWN'})).status,409);
    assert.equal((await t.call('/factory/products/own/duplicate',{code:'BAD-SKU'})).status,400);
    assert.equal((await t.call('/factory/products/own/duplicate',{
      code:'PZ-X-001',status:'published'})).status,400);
    assert.equal((await t.call('/factory/products/own/duplicate',{
      code:'PZ-X-001',draft:{created_by:'u2'}})).status,400);
    assert.equal((await t.call('/factory/products/someone/duplicate',{
      code:'PZ-OTHER-001',draft:{}},'ADMIN')).status,200);
  }finally{t.close();}
});
test('bulk submit of 10 own drafts submits exactly 7 and explains three preflight failures',async()=>{
  const t=setup();try{
    const ids=[];
    for(let i=0;i<10;i++){
      const id='draft'+i;ids.push(id);
      t.add(id,{material:i>=7?'':'White Oak'});
    }
    const result=await t.call('/factory/products/bulk',{action:'submit',ids});
    assert.equal(result.status,200);
    assert.equal(result.data.requested,10);
    assert.equal(result.data.succeeded,7);
    assert.equal(result.data.failed,3);
    const failed=result.data.results.filter(x=>!x.ok);
    assert.equal(failed.length,3);
    assert.ok(failed.every(x=>x.issues.some(y=>y.field==='material')));
    const status=t.db.prepare("SELECT COUNT(*) AS n FROM products WHERE status='pending_supervisor'").get();
    assert.equal(status.n,7);
    assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM reviews').get().n,7);
    assert.equal(t.calls.filter(x=>x.path.endsWith('/submit')).length,10);
  }finally{t.close();}
});
test('bulk category only changes own draft products; admin can change a draft owned by others',async()=>{
  const t=setup();try{
    const r=await t.call('/factory/products/bulk',{
      action:'category',category:'chairs',ids:['own','someone','published']
    });
    assert.equal(r.data.succeeded,1);assert.equal(r.data.failed,2);
    assert.equal(t.db.prepare("SELECT category FROM products WHERE id='own'").get().category,'chairs');
    assert.equal(t.db.prepare("SELECT category FROM products WHERE id='someone'").get().category,'dining-table');
    assert.equal(t.db.prepare("SELECT category FROM products WHERE id='published'").get().category,'dining-table');
    const admin=await t.call('/admin/products/bulk',{
      action:'category',category:'chairs',ids:['someone']},'ADMIN');
    assert.equal(admin.data.succeeded,1);
    assert.equal(t.db.prepare("SELECT category FROM products WHERE id='someone'").get().category,'chairs');
    assert.equal((await t.call('/factory/products/bulk',{
      action:'category',category:'unknown',ids:['own']})).status,400);
  }finally{t.close();}
});
test('unpublish requires admin and meaningful reason, audits each successful item and preserves failures',async()=>{
  const t=setup();try{
    t.add('published2',{status:'published'});
    t.add('archived',{status:'published',archived_at:'2026-11-10T00:00:00Z'});
    assert.equal((await t.call('/factory/products/bulk',{
      action:'unpublish',ids:['published'],reason:'停止供应产品'},'FACTORY')).status,403);
    assert.equal((await t.call('/admin/products/bulk',{
      action:'unpublish',ids:['published'],reason:'no'},'ADMIN')).status,400);
    const result=await t.call('/admin/products/bulk',{
      action:'unpublish',ids:['published','published2','archived'],reason:'暂停供货，需重新核对供应链'},'ADMIN');
    assert.equal(result.status,200);
    assert.equal(result.data.succeeded,2);
    assert.equal(result.data.failed,1);
    assert.equal(result.data.results.find(x=>x.id==='archived').ok,false);
    const audits=t.db.prepare("SELECT * FROM audit_logs WHERE action='product.unpublish'").all();
    assert.equal(audits.length,2);
    assert.ok(audits.every(x=>x.reason==='暂停供货，需重新核对供应链'));
    assert.equal(t.db.prepare("SELECT catalog_hidden FROM products WHERE id='published'").get().catalog_hidden,1);
    assert.equal(t.db.prepare("SELECT catalog_hidden FROM products WHERE id='archived'").get().catalog_hidden,0);
  }finally{t.close();}
});
test('batch >50, duplicate IDs, injected IDs and bulk approvals/publish are blocked',async()=>{
  const t=setup();try{
    assert.equal(BULK_LIMIT,50);
    const tooMany=Array.from({length:51},(_,i)=>'x'+i);
    assert.equal((await t.call('/factory/products/bulk',{action:'submit',ids:tooMany})).status,400);
    assert.equal((await t.call('/factory/products/bulk',{action:'submit',ids:['own','own']})).status,400);
    assert.equal((await t.call('/factory/products/bulk',{action:'submit',ids:['own;DELETE']})).status,400);
    assert.equal((await t.call('/admin/products/bulk',{action:'approve',ids:['own']},'ADMIN')).status,400);
    assert.equal((await t.call('/admin/products/bulk',{action:'publish',ids:['own']},'ADMIN')).status,400);
    assert.equal((await t.call('/admin/products/bulk',{action:'submit',ids:['own']},'ADMIN')).status,403);
    assert.equal(t.db.prepare('SELECT COUNT(*) AS n FROM audit_logs').get().n,0);
  }finally{t.close();}
});
test('audit reservation and reason are part of the real Worker source, not a fake bulk success',()=>{
  const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(source,/diff\.push\("bulk_unpublish_reason: "\+reason\)/);
  assert.match(source,/index_default\.fetch=productBulkFetch\(pzProductBulkOriginalFetch,/);
});
