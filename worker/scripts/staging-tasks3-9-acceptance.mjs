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
let originalDraft, originalPublished, configTouched=false;
const unwrap=x=>x.config||x;
const put=async(path,body)=>{const r=await fetch(origin+path,{method:'PUT',headers:{Authorization:'Bearer '+admin,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});const d=await r.json();assert.equal(r.status,200,path+': '+JSON.stringify(d));return d;};
const saveConfig=async(config)=>{const d=await call(admin,'/admin/draft/site-config');return put('/site-config',Number.isInteger(d.revision)?{revision:d.revision,config}:config);};
const publishConfig=async()=>{const d=await call(admin,'/admin/draft/site-config');return call(admin,'/admin/publish',Number.isInteger(d.revision)?{revision:d.revision}:{});};
const eventually=async(fn,label)=>{for(let i=0;i<18;i++){if(await fn())return;await new Promise(r=>setTimeout(r,5000));}throw Error('Readback timeout: '+label);};
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

  // Opt in only this audited Staging Worker after a recovery checkpoint,
  // one additive table, exact KV/D1 snapshot comparison, and verified R2 bootstrap.
  const beforeCutover=await call(admin,'/admin/draft/site-config');
  if(!Number.isInteger(beforeCutover.revision)){
    const cli=parts=>execFileSync('npx',['--yes','wrangler@4.156.0',...parts],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
    const cfg=['--config','worker/wrangler.generated.toml','--env','staging'];
    console.log('Staging D1 recovery checkpoint: '+cli(['d1','time-travel','info','DB',...cfg,'--json']));
    console.log(cli(['d1','execute','DB',...cfg,'--remote','--file','worker-patches/migrations/006_site_config_d1_versioned_REVIEW.sql','--json']));
    const existingState=db('SELECT draft_json,published_json FROM site_config_state WHERE id=1')[0];
    if(existingState){
      assert.deepEqual(JSON.parse(existingState.draft_json),beforeCutover.draft,'Existing D1 draft must match current KV before cutover');
      assert.deepEqual(JSON.parse(existingState.published_json),unwrap(await call(null,'/api/site-config')),'Existing D1 published must match current KV before cutover');
    }else{
      const ready=await call(admin,'/admin/site-config/bootstrap');
      const seeded=await call(admin,'/admin/site-config/bootstrap',{draftSha:ready.draftSha,publishedSha:ready.publishedSha});
      assert.equal(seeded.initialSnapshotVerified,true,'R2 backup required before D1 opt in');
    }
    console.log(cli(['deploy',...cfg,'--var','PZ_D1_SITE_CONFIG_ENABLED:true','--var','PZ_SITE_CONFIG_D1_CUTOVER_ENABLED:true']));
    await eventually(async()=>Number.isInteger((await call(admin,'/admin/draft/site-config')).revision),'D1 config authority active');
    console.log('ACCEPTANCE: Staging D1 config opted in after verified bootstrap; original KV retained');
  }
  const draftBefore=await call(admin,'/admin/draft/site-config');
  originalDraft=draftBefore.draft;
  if(typeof originalDraft==='string')originalDraft=JSON.parse(originalDraft);
  originalPublished=unwrap(await call(null,'/api/site-config'));
  check(originalDraft?.categories&&originalPublished?.categories,'baseline config snapshots');
  const contacts={salesEmail:'staging-qa@example.com',phone:'+1 202 555 0147',whatsapp:'+12025550147',wechatId:'pz_staging_qa'};
  configTouched=true;
  await saveConfig({...originalPublished,contact:contacts});
  assert.deepEqual((await call(admin,'/admin/draft/site-config')).draft.contact,contacts);
  assert.deepEqual(unwrap(await call(null,'/api/site-config')).contact,originalPublished.contact);
  await publishConfig();
  await eventually(async()=>JSON.stringify(unwrap(await call(null,'/api/site-config')).contact)===JSON.stringify(contacts),'contact publish');
  report.push('Contact draft isolation, save, publish and public readback passed');
  console.log('ACCEPTANCE: '+report.at(-1));
  const categoryTitle='QA Furniture '+Date.now();
  const newCat=await call(operator,'/factory/category-requests',{
    title:categoryTitle,title_cn:'隔离验收家具',subtitle:'Staging acceptance only',image:imageUrls[0]},201);
  await call(admin,'/admin/category-requests/'+newCat.id+'/approve',{},409);
  await call(supervisor,'/supervisor/category-requests/'+newCat.id+'/approve',{});
  await call(admin,'/admin/category-requests/'+newCat.id+'/approve',{});
  let categoryId;
  await eventually(async()=>{categoryId=unwrap(await call(null,'/api/site-config')).categories.find(x=>x.proposal_id===newCat.id)?.id;return !!categoryId;},'category targeted publish');
  report.push('Factory category submission, supervisor approval, Admin approval and targeted public publication passed');
  console.log('ACCEPTANCE: '+report.at(-1));
  const metadata={alt_en:'White oak dining furniture QA',alt_zh:'白橡木家具验收封面',caption:'Internal staging QA caption',image:imageUrls[1]};
  const change=await call(operator,'/factory/category-change-requests',{category_id:categoryId,proposed:metadata},201);
  const saved=db('SELECT proposed_json FROM category_change_requests WHERE id='+quote(change.id))[0];
  for(const [k,v]of Object.entries(metadata))assert.equal(JSON.parse(saved.proposed_json)[k],v,'persist '+k);
  await call(admin,'/admin/category-change-requests/'+change.id+'/approve',{});
  await publishConfig();
  await eventually(async()=>{const cat=unwrap(await call(null,'/api/site-config')).categories.find(x=>x.id===categoryId);return Object.entries(metadata).every(([k,v])=>cat?.[k]===v);},'category image metadata approval');
  report.push('Factory category alt EN/ZH, internal caption and R2 replacement image survive Admin approval and publication');
  console.log('ACCEPTANCE: '+report.at(-1));
  const table=await createProduct('BILINGUAL',{category:'tables',name:'Oak Dining Furniture',name_cn:'实木家具',description:'Solid wood furniture'});
  await normalPublish(table);
  for(const q of ['餐桌','table','tables',table.body.code]){
    const found=await call(null,'/public/products?v=2&limit=100&q='+encodeURIComponent(q));
    check(JSON.stringify(found).includes(table.id),'Public search must find fixture: '+q);
  }
  report.push('Published D1 catalog matches Chinese/English category synonyms and SKU');
  console.log('ACCEPTANCE: '+report.at(-1));
}finally{
  try{
    if(configTouched&&originalPublished&&originalDraft){
      await saveConfig(originalPublished);await publishConfig();await saveConfig(originalDraft);
      await eventually(async()=>JSON.stringify(unwrap(await call(null,'/api/site-config')).contact)===JSON.stringify(originalPublished.contact),'original public contact restored');
      console.log('ACCEPTANCE: Original published config and pending draft restored');
    }
    if(admin){db("UPDATE products SET catalog_hidden=1 WHERE created_by IN ("+users.map(quote).join(',')+")");await call(admin,'/admin/publish/products',{});}
    db("UPDATE users SET is_active=0 WHERE id IN ("+users.map(quote).join(',')+")");
    console.log('ACCEPTANCE: Synthetic accounts disabled; QA products hidden; audit retained');
  }catch(e){console.error('Cleanup failed: '+e.message);process.exitCode=1;}
}
