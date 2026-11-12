// Live API acceptance: isolated Staging only, synthetic accounts, no real email.
import assert from 'node:assert/strict';
import {randomUUID,randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const origin='https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev';
if(process.env.PZ_STAGING_RESOURCES_VERIFIED!=='true'||
  !process.env.PZ_D1_ID||process.env.PZ_D1_ID===process.env.PZ_EXPECTED_PRODUCTION_D1_ID)
  throw Error('Audited independent Staging required');
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
function db(sql){
  try{
    const out=execFileSync('npx',['--yes','wrangler@4.156.0','d1','execute','DB',
      '--config','worker/wrangler.generated.toml','--env','staging','--remote','--command',sql,'--json'],
      {encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
    return JSON.parse(out).flatMap(x=>x.results||[]);
  }catch{throw Error('Staging fixture database operation failed (details suppressed)');}
}
const check=(value,message)=>assert.ok(value,message);
const prefix='PZ-QA-'+Date.now().toString(36).toUpperCase();
const pass=randomBytes(24).toString('base64url')+'aA9!';
console.log('::add-mask::'+pass);
const users=[],products=[],report=[];
let admin,supervisor,operator,other,department,sampleForSync;
const call=async(token,path,body,expected=200)=>{
  const response=await fetch(origin+path,{
    method:body===undefined?'GET':'POST',
    headers:{...(token?{Authorization:'Bearer '+token}:{}),
      ...(body===undefined?{}:{'content-type':'application/json'})},
    ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});
  const data=await response.json().catch(()=>({}));
  assert.equal(response.status,expected,path+': '+JSON.stringify(data).slice(0,400));
  return data;
};
const login=async username=>{
  const data=await call(null,'/login',{username,password:pass});
  check(data.token,'login must return token');
  console.log('::add-mask::'+data.token);
  return data.token;
};
const sourceUrl=new URL('../src/index.js',import.meta.url);
const source=readFileSync(sourceUrl,'utf8').replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,
  (_,q,p)=>'from '+q+new URL(p,sourceUrl).href+q);
const {hash}=await import('data:text/javascript;base64,'+
  Buffer.from(source+'\nexport {hash};').toString('base64'));
const adminId=randomUUID(),adminName='qa-admin-'+Date.now();
const digest=await hash(pass,10);
users.push(adminId);
db("INSERT INTO users(id,username,password_hash,role,is_active,org_id,created_at) VALUES("+
  [adminId,adminName,digest,'admin'].map(quote).join(',')+",1,'org-main',"+quote(new Date().toISOString())+")");
let imageUrls=[];
const item=(n,extra={})=>({
  code:prefix+'-'+n,name:'Marlow Solid Oak Dining Table',name_cn:'橡木餐桌',
  category:'dining-table',material:'White Oak',finish:'Matte',
  description:'Solid oak dining table.',description_cn:'实木餐桌',
  size:'180 × 90 × 75 cm',images:imageUrls,production_sites:['zhaoqing'],
  specifications:{schema_version:1,dimensions_cm:{length:180,width:90,height:75},
    media_roles:Object.fromEntries(imageUrls.map((u,i)=>[u,['main','lifestyle','detail','material'][i]]))},
  ...extra
});
async function createProduct(n,extra={}){
  const body=item(n,extra),r=await call(operator,'/factory/products',body);
  products.push(r.id);return {id:r.id,body};
}
const reviewFor=id=>db('SELECT id FROM pz_product_reviews WHERE product_id='+quote(id))[0]?.id;
async function submit(p,warningCodes=[]){
  await call(operator,'/factory/products/'+p.id+'/submit',{confirmed_warnings:warningCodes});
  return reviewFor(p.id);
}
async function normalPublish(p){
  const rid=await submit(p);
  const sup=await call(supervisor,'/supervisor/reviews/'+rid+'/approve',{});
  assert.equal(sup.status,'pending_admin');
  const adm=await call(admin,'/admin/reviews/'+rid+'/approve',{});
  if(adm.status!=='published')await call(admin,'/admin/reviews/'+rid+'/publish',{});
  assert.equal(db('SELECT status FROM products WHERE id='+quote(p.id))[0].status,'published');
  return rid;
}
try{
  admin=await login(adminName);
  department=(await call(admin,'/admin/org/departments',{
    name:'QA '+prefix,factory_site:'shared'},201)).id;
  const createAccount=async(kind,supervisor_id)=>{
    const username='qa-'+kind+'-'+randomUUID().slice(0,8);
    const res=await call(admin,'/admin/org/accounts',{
      username,password:pass,job_type:kind,department_id:department,supervisor_id},201);
    users.push(res.id);return {id:res.id,token:await login(username)};
  };
  const sup=await createAccount('supervisor');supervisor=sup.token;
  const op=await createAccount('staff',sup.id);operator=op.token;
  const outsider=await createAccount('staff',sup.id);other=outsider.token;
  // Upload four real objects through the existing authenticated R2 route.
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=','base64');
  for(let i=0;i<4;i++){
    const form=new FormData();form.append('file',new Blob([png],{type:'image/png'}),'oak-'+i+'.png');
    const res=await fetch(origin+'/upload-image',{method:'POST',headers:{Authorization:'Bearer '+operator},body:form});
    assert.equal(res.status,200,'R2 upload');
    const data=await res.json();check(data.url,'R2 URL required');imageUrls.push(data.url);
  }
  assert.equal(new Set(imageUrls).size,4,'four distinct uploaded images');
  report.push('Authenticated Admin / Supervisor / Operator login and R2 uploads passed');
  const mutations=[
    p=>p.name='123',p=>p.name='PZ-SKU-001',p=>p.category='',p=>p.material='',
    p=>p.description='',p=>p.images=[],p=>p.images=p.images.slice(0,3),
    p=>p.specifications.media_roles[p.images[0]]='detail',
    p=>delete p.specifications.media_roles[p.images[1]],
    p=>delete p.specifications.dimensions_cm.height
  ];
  for(let i=0;i<mutations.length;i++){
    const p=await createProduct('BAD-'+i);mutations[i](p.body);
    db('UPDATE products SET name='+quote(p.body.name)+',category='+quote(p.body.category)+
      ',material='+quote(p.body.material)+',description='+quote(p.body.description)+
      ',images='+quote(JSON.stringify(p.body.images))+',specs_json='+quote(JSON.stringify(p.body.specifications))+
      ' WHERE id='+quote(p.id));
    const res=await fetch(origin+'/factory/products/'+p.id+'/submit',{
      method:'POST',headers:{Authorization:'Bearer '+operator,'content-type':'application/json'},body:'{}'});
    assert.equal(res.status,400,'invalid product '+i+' must be blocked');
    assert.equal(reviewFor(p.id),undefined);
  }
  report.push('Ten deliberately invalid persisted drafts blocked before supervisor queue');
  const warned=await createProduct('WARN',{
    specifications:{...item('x').specifications,dimensions_cm:{length:180,width:90,height:750}}
  });
  await call(operator,'/factory/products/'+warned.id+'/submit',{},422);
  const wrid=await submit(warned,['dimension_units','table_height_range']);
  const warnDetail=await call(supervisor,'/supervisor/reviews/'+wrid);
  check(warnDetail.versions.at(-1).snapshot.preflight_warnings.length>=2,'warnings visible to reviewer');
  const p=await createProduct('RETURN');
  const rid=await submit(p);
  await call(supervisor,'/supervisor/reviews/'+rid+'/return',{issues:[{field:'images',message:'请更新主图顺序'}]});
  const returnInfo=await call(operator,'/factory/products/'+p.id+'/return-issues');
  assert.equal(returnInfo.issues[0].field,'images');
  await call(other,'/factory/products/'+p.id+'/return-issues',undefined,404);
  p.body.images=[imageUrls[1],imageUrls[0],imageUrls[2],imageUrls[3]];
  p.body.specifications.media_roles=Object.fromEntries(p.body.images.map((u,i)=>[u,['main','lifestyle','detail','material'][i]]));
  const save=await fetch(origin+'/factory/products/'+p.id,{method:'PUT',
    headers:{Authorization:'Bearer '+operator,'content-type':'application/json'},body:JSON.stringify(p.body)});
  assert.equal(save.status,200);
  await submit(p);
  const recheck=await call(supervisor,'/supervisor/reviews/'+rid);
  check(recheck.recheck.changed_fields.includes('images'),'image-only recheck delta');
  check(recheck.recheck.changed_fields.every(x=>x==='images'),'no spurious fields');
  await call(supervisor,'/supervisor/reviews/'+rid+'/approve',{});
  await call(admin,'/admin/reviews/'+rid+'/return',{issues:[{field:'material',message:'请核对橡木材质'}]});
  await call(supervisor,'/supervisor/reviews/'+rid+'/request-correction',{issues:[{field:'material',message:'请补充材质细节'}]});
  const correction=await call(operator,'/factory/products/'+p.id+'/return-issues');
  assert.equal(correction.issues[0].field,'material');
  report.push('Supervisor field return, version recheck, Admin-to-supervisor correction and account isolation passed');
  for(let i=0;i<10;i++)await normalPublish(await createProduct('HISTORY-'+i));
  report.push('Ten clean real two-stage publications completed');
  await call(admin,'/admin/fast-lane/operators/'+op.id+'/trust',{trusted:true,reason:'隔离环境合成账号验收授权'});
  await call(admin,'/admin/fast-lane/settings',{enabled:true,reason:'隔离环境快速通道端到端验收'});
  for(let i=0;i<2;i++){
    const fast=await createProduct('FAST-'+i),frid=await submit(fast);
    const approved=await call(supervisor,'/supervisor/reviews/'+frid+'/approve',{});
    assert.equal(approved.status,'published');assert.equal(approved.lane,'fast');
    const sample=db('SELECT id FROM pz_fast_lane_publications WHERE review_id='+quote(frid))[0].id;
    sampleForSync=sample;
    const removed=await call(admin,'/admin/fast-lane/samples/'+sample+'/unpublish',{reason:'合成样品抽检下架验证'});
    assert.equal(removed.status,'unpublished');
    if(i===1)assert.equal(removed.auto_revoked,true);
  }
  assert.equal(db('SELECT trusted FROM pz_fast_lane_trust WHERE operator_id='+quote(op.id))[0].trusted,0);
  await call(admin,'/admin/fast-lane/operators/'+op.id+'/trust',{trusted:true,reason:'验证认证附件保持两级审核'});
  const risky=await createProduct('CERT',{
    specifications:{...item('x').specifications,attachments:[{type:'certificate',file_name:'report.pdf',visibility:'internal'}]}
  });
  const riskRid=await submit(risky);
  assert.equal((await call(supervisor,'/supervisor/reviews/'+riskRid+'/approve',{})).status,'pending_admin');
  await call(admin,'/admin/fast-lane/settings',{enabled:false,reason:'完成快速通道合成验收恢复关闭'});
  const stopped=await createProduct('STOP'),srid=await submit(stopped);
  assert.equal((await call(supervisor,'/supervisor/reviews/'+srid+'/approve',{})).status,'pending_admin');
  report.push('Trusted direct publish, certificate risk fallback, two sampling retractions and immediate kill switch passed');
  for(const token of [operator,supervisor,admin]){
    const feed=await call(token,'/notifications');
    check(feed.items.length>0,'role notification feed populated');
    const first=feed.items[0];
    await call(token,'/notifications/'+first.id+'/read',{});
    await call(token,'/notifications/read-all',{});
    assert.equal((await call(token,'/notifications/unread-count')).unread_count,0);
  }
  const prefs=await call(operator,'/notifications/email/preferences');
  assert.equal(prefs.verified,false);assert.equal(prefs.enabled,false);
  await call(operator,'/notifications/email/preferences',{enabled:true},409);
  report.push('Three-role in-app notifications, read state and unverified-email prevention passed');
  report.push(prefs.provider_configured?'Live email verification requires mailbox-owner action':'BLOCKED: real email provider / verified sender not configured');
  const rows=Array.from({length:100},(_,i)=>({
    row:i+4,cells:{code:prefix+'-IMPORT-'+i,name:'Marlow Oak Dining Table',
      category:'dining-table',material:'White Oak',description:'Solid oak table',
      production_sites:'zhaoqing','dimensions_cm.length':'180','dimensions_cm.width':'90','dimensions_cm.height':'75'},images:[]
  }));
  rows[0].cells.code='invalid';rows[1].cells.material='';rows[2].cells.name='测试';
  rows[3].cells['dimensions_cm.height']='750cm';rows[4].cells.production_sites='unknown';
  const batch=randomUUID();
  const imported=await call(operator,'/factory/products/import-drafts',{batch_id:batch,rows});
  assert.equal(imported.inserted,95);assert.equal(imported.failed,5);
  const counts=db('SELECT status,COUNT(*) AS n FROM products WHERE import_batch_id='+quote(batch)+' GROUP BY status');
  assert.deepEqual(counts.map(x=>[x.status,x.n]),[['draft',95]]);
  const repeated=await call(operator,'/factory/products/import-drafts',{batch_id:randomUUID(),rows});
  assert.equal(repeated.inserted,0);assert.equal(repeated.skipped,95);
  const list=await call(operator,'/factory/products?list_version=1&import_batch='+batch);
  assert.equal(list.total,95);
  await call(other,'/factory/products/import-batches/'+batch,undefined,404);
  report.push('100 rows / 5 bad / 95 drafts / 0 published; duplicate reimport and SQL batch filtering passed');
}finally{
  // Preserve immutable QA audit evidence, disable every synthetic account and hide its products.
  try{
    db("UPDATE pz_fast_lane_settings SET enabled=0 WHERE id=1");
    if(admin){
      db("UPDATE products SET catalog_hidden=1 WHERE created_by IN ("+users.map(quote).join(',')+")");
      if(sampleForSync)await call(admin,'/admin/fast-lane/samples/'+sampleForSync+'/sync-catalog',{});
      else await call(admin,'/admin/publish/products',{});
    }
    db("UPDATE pz_fast_lane_trust SET trusted=0 WHERE operator_id IN ("+users.map(quote).join(',')+")");
    db("UPDATE users SET is_active=0 WHERE id IN ("+users.map(quote).join(',')+")");
    console.log('Synthetic accounts disabled and fast lane closed; immutable audit retained.');
  }catch{console.error('Fixture cleanup needs administrator reconciliation for prefix '+prefix);process.exitCode=1;}
  for(const line of report)console.log('ACCEPTANCE: '+line);
}
