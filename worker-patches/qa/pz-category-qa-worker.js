// ISOLATED QA TEST WORKER — NEVER INSTALL ON Production or Staging.
// This file embeds the Production D1 algorithm with runtime guard changed only to QA.
/**
 * QA isolated Worker exercise of the Production D1 implementation. Atomic, revisioned site-config in D1.
 *
 * Enabled ONLY with env.PZ_D1_SITE_CONFIG_ENABLED === 'true' and after
 * explicit ADMIN bootstrap of current KV draft and published config.
 * No Worker deployment or migration implied by adding this file.
 */
const pzD1SiteEnabled = env =>
  String(env.PZ_D1_SITE_CONFIG_ENABLED || '').toLowerCase() === 'true';

const JSON_MAX_BYTES = 512 * 1024;
const parse = raw => { try { return JSON.parse(raw || 'null'); } catch { return null; } };
const isConfig = v => v && typeof v === 'object' && !Array.isArray(v) &&
  Array.isArray(v.categories) && v.categories.every(c=>c&&typeof c.id==='string'&&typeof c.title==='string');
const cleanField = value => String(value == null ? '' : value);
const editableFields = c => ({
  title:cleanField(c?.title), title_cn:cleanField(c?.title_cn || c?.title_zh),
  subtitle:cleanField(c?.subtitle), description:cleanField(c?.description),
  image:cleanField(c?.image)
});
const jsonResponse=(json,obj,status=200)=>json(obj,status);
const stale=(json,msg='Site configuration changed. Refresh and retry.')=>
  json({error:msg,code:'DRAFT_REVISION_CONFLICT'},409);
const dbRow=env=>env.DB.prepare(
  'SELECT * FROM site_config_state WHERE id=1').first();
const sha256=async text=>{
  const bin=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bin),b=>b.toString(16).padStart(2,'0')).join('');
};
async function readJsonBody(request,json) {
  if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
    return {error:json({error:'JSON required'},415)};
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>JSON_MAX_BYTES)
    return {error:json({error:'Request body too large'},413)};
  const value=parse(raw);
  if(!value || typeof value!=='object' || Array.isArray(value))
    return {error:json({error:'Invalid request body'},400)};
  return {value};
}
async function guardedWrite(env,{expectedRevision,nextConfig,token,requestKind,requestId,status='pending'}) {
  const timestamp=new Date().toISOString();
  const update=env.DB.prepare(
    'UPDATE site_config_state SET draft_json=?, draft_revision=draft_revision+1, write_token=?, updated_at=? '+
    'WHERE id=1 AND draft_revision=?'+
    (requestKind ? ' AND EXISTS (SELECT 1 FROM '+(requestKind==='new'?'category_requests':'category_change_requests')+
      ' WHERE id=? AND status=?)' : '')
  ).bind(...(requestKind
    ?[JSON.stringify(nextConfig),token,timestamp,expectedRevision,requestId,status]
    :[JSON.stringify(nextConfig),token,timestamp,expectedRevision]));
  if(!requestKind) {
    const written=await update.run();
    return {ok:written?.meta?.changes===1,revision:expectedRevision+1};
  }
  // D1 batch is a single SQLite transaction. The transition can only
  // complete if the exact write token from our D1 draft mutation matches.
  const table=requestKind==='new'?'category_requests':'category_change_requests';
  const final=env.DB.prepare(
    'UPDATE '+table+" SET status='approved', updated_at=? WHERE id=? AND status=? AND "+
    '(SELECT write_token FROM site_config_state WHERE id=1)=?'
  ).bind(timestamp,requestId,status,token);
  const [saveResult,transitionResult]=await env.DB.batch([update,final]);
  const ok=saveResult?.meta?.changes===1 && transitionResult?.meta?.changes===1;
  if(!ok && saveResult?.meta?.changes===1) {
    throw new Error('Unexpected D1 transaction mismatch; investigate before retrying');
  }
  return {ok,revision:expectedRevision+1};
}
async function requireRow(env,json) {
  const row=await dbRow(env);
  if(!row) return {error:json({error:'D1 site config not bootstrapped; release blocked'},503)};
  const draft=parse(row.draft_json), published=parse(row.published_json);
  if(!isConfig(draft)||!isConfig(published))
    return {error:json({error:'Invalid stored site configuration'},503)};
  return {row,draft,published};
}
async function pzReadPublishedConfig(env) {
  if(!pzD1SiteEnabled(env)) {
    return parse(await env.SITE_CONFIG_KV.get('published:site_config'));
  }
  const row=await dbRow(env);
  return row?parse(row.published_json):null;
}
async function pzReadDraftConfig(env) {
  if(!pzD1SiteEnabled(env)) {
    return parse(await env.SITE_CONFIG_KV.get('draft:site_config'));
  }
  const row=await dbRow(env);
  return row?parse(row.draft_json):null;
}
async function approveNewCategory(env,json,id) {
  const proposal=await env.DB.prepare(
    'SELECT id,title,title_cn,subtitle,image,status FROM category_requests WHERE id=? LIMIT 1'
  ).bind(id).first();
  if(!proposal)return json({error:'Category request not found'},404);
  if(!['pending','awaiting_review'].includes(proposal.status))
    return stale(json,'Only pending category requests may be approved');
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft}=state;
  const slug=cleanField(proposal.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||
    ('cat-'+id.slice(0,6));
  if(draft.categories.some(c=>c.id===slug||c.proposal_id===id||c.title.toLowerCase()===proposal.title.toLowerCase()))
    return stale(json,'Category already exists in the draft');
  const next={...draft,categories:[{
    id:slug,title:proposal.title,title_cn:proposal.title_cn||'',
    title_zh:proposal.title_cn||'',subtitle:proposal.subtitle||'',image:proposal.image||'',
    source:'proposal',proposal_id:id,created_at:new Date().toISOString()
  },...draft.categories]};
  const result=await guardedWrite(env,{expectedRevision:row.draft_revision,nextConfig:next,
    token:crypto.randomUUID(),requestKind:'new',requestId:id,status:proposal.status});
  if(!result.ok)return stale(json);
  return json({success:true,id,action:'approve',status:'approved',published:false,
    needsPublish:true,categoryId:slug,draftUpdated:true,revision:result.revision});
}
async function approveCategoryChange(env,json,id) {
  const change=await env.DB.prepare('SELECT * FROM category_change_requests WHERE id=? LIMIT 1')
    .bind(id).first();
  if(!change)return json({error:'Category change request not found'},404);
  if(change.status!=='pending')return stale(json,'Only pending modifications can be approved');
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft,published}=state;
  const old=published.categories.find(c=>c.id===change.category_id);
  const current=draft.categories.find(c=>c.id===change.category_id);
  const base=parse(change.base_json),proposed=parse(change.proposed_json);
  if(!old||!current||!base||!proposed||
     JSON.stringify(editableFields(old))!==JSON.stringify(base)||
     JSON.stringify(editableFields(current))!==JSON.stringify(base))
    return stale(json,'Category data changed since factory submitted the request');
  if(draft.categories.some(c=>c.id!==change.category_id &&
    cleanField(c.title).trim().toLowerCase()===cleanField(proposed.title).trim().toLowerCase()))
    return stale(json,'Proposed category title already exists');
  if(proposed.image && proposed.image!==base.image) {
    const cdn=String(env.PZ_IMAGE_BASE_URL||'').replace(/\/+$/,'');
    if(cdn!=='https://cdn.peng-zhan.com'||!env.PRODUCT_IMAGES)
      return json({error:'Production image configuration unavailable'},503);
    let key;
    try{
      const u=new URL(proposed.image);
      if(u.origin!==cdn||u.search||u.hash||u.username||u.password)
        return json({error:'Invalid Production cover URL'},400);
      key=decodeURIComponent(u.pathname.slice(1));
      if(!/^uploads\/[^/]+$/.test(key)||key.includes('..'))
        return json({error:'Invalid cover key'},400);
    }catch{return json({error:'Invalid cover URL'},400);}
    if(!(await env.PRODUCT_IMAGES.head(key)))return json({error:'Cover missing from Production R2'},400);
  }
  const next={...draft,categories:draft.categories.map(c=>c.id===change.category_id
    ?{...c,...proposed,title_zh:proposed.title_cn}:c)};
  const result=await guardedWrite(env,{expectedRevision:row.draft_revision,nextConfig:next,
    token:crypto.randomUUID(),requestKind:'change',requestId:id});
  if(!result.ok)return stale(json);
  return json({success:true,id,status:'approved',published:false,
    needsPublish:true,revision:result.revision});
}
const categoryNewApprove=/^\/admin\/category[-_]requests\/([^/]+)\/approve$/;
const categoryChangeApprove=/^\/admin\/category-change-requests\/([^/]+)\/approve$/;
const protectedRoutes=new Set(['/admin/draft/site-config','/site-config','/admin/publish',
  '/admin/rollback','/admin/preview/site-config','/api/site-config']);
const reconcileChange=/^\/admin\/category-change-requests\/([^/]+)\/reconcile$/;
const unsafeLegacyApprovals=path=>categoryNewApprove.test(path)||
  categoryChangeApprove.test(path)||reconcileChange.test(path);
async function handleD1SiteConfig({request,env,pathname,authorize,json,publishTransform}) {
  const boot='/admin/site-config/bootstrap';
  const isBootstrap=pathname===boot;
  if(!isBootstrap&&!protectedRoutes.has(pathname)&&!unsafeLegacyApprovals(pathname))return null;
  if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!=='qa')
    return isBootstrap?json({error:'QA only'},403):null;
  const active=pzD1SiteEnabled(env);
  if(!active&&!isBootstrap) {
    // Existing site config routes are temporarily preserved during opt-in.
    // Both approval paths are intentionally blocked until the D1 cutover.
    return unsafeLegacyApprovals(pathname)
      ?json({error:'D1 approval migration is not activated'},503)
      :null;
  }
  if(!isBootstrap&&pathname==='/api/site-config'&&request.method==='GET') {
    const state=await requireRow(env,json);
    if(state.error)return state.error;
    return json({config:state.published});
  }
  const auth=await authorize(request,env,['ADMIN']);
  if(auth instanceof Response)return auth;
  if(isBootstrap) {
    if(active) return json({error:'Turn off bootstrap after D1 cutover'},409);
    const old=await dbRow(env);
    if(old)return json({error:'D1 site configuration already initialized'},409);
    const [draftRaw,publishedRaw,metaRaw]=await Promise.all([
      env.SITE_CONFIG_KV.get('draft:site_config'),
      env.SITE_CONFIG_KV.get('published:site_config'),
      env.SITE_CONFIG_KV.get('published:meta')
    ]);
    const draft=parse(draftRaw),published=parse(publishedRaw),meta=parse(metaRaw)||{};
    if(!isConfig(draft)||!isConfig(published))
      return json({error:'Existing KV site configuration missing or invalid'},503);
    const draftSha=await sha256(draftRaw),publishedSha=await sha256(publishedRaw);
    if(request.method==='GET')
      return json({ready:true,draftSha,publishedSha,
        draftCategories:draft.categories.length,publishedCategories:published.categories.length});
    if(request.method==='POST'){
      const body=await readJsonBody(request,json);
      if(body.error)return body.error;
      if(body.value.draftSha!==draftSha||body.value.publishedSha!==publishedSha)
        return stale(json,'KV values changed since bootstrap preflight');
      const timestamp=new Date().toISOString();
      const installed=await env.DB.prepare(
        'INSERT OR IGNORE INTO site_config_state (id,draft_json,draft_revision,published_json,'+
        'published_revision,published_version,published_at,write_token,updated_at) '+
        'VALUES(1,?,1,?,1,?,?,?,?)'
      ).bind(draftRaw,publishedRaw,String(meta.version||'legacy'),
        String(meta.publishedAt||timestamp),crypto.randomUUID(),timestamp).run();
      if(installed?.meta?.changes!==1)return stale(json,'Site config bootstrapped by another request');
      return json({success:true,revision:1,draftSha,publishedSha});
    }
    return json({error:'Method not allowed'},405);
  }
  const state=await requireRow(env,json);
  if(state.error)return state.error;
  const {row,draft,published}=state;
  if(pathname==='/admin/draft/site-config'&&request.method==='GET')
    return json({draft,revision:row.draft_revision});
  if(pathname==='/admin/preview/site-config'&&request.method==='GET')
    return json({preview:publishTransform(draft,env),revision:row.draft_revision});
  if(pathname==='/site-config'&&request.method==='PUT'){
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    if(!Number.isSafeInteger(body.value.revision)||body.value.revision<1)
      return json({error:'Draft revision required; refresh the editor'},428);
    const config=body.value.config;
    if(!isConfig(config))return json({error:'Valid site config with categories required'},400);
    const result=await guardedWrite(env,{expectedRevision:body.value.revision,
      nextConfig:config,token:crypto.randomUUID()});
    if(!result.ok)return stale(json);
    return json({success:true,draft:true,revision:result.revision});
  }
  const newMatch=pathname.match(categoryNewApprove);
  if(newMatch&&request.method==='POST')return approveNewCategory(env,json,newMatch[1]);
  const changeMatch=pathname.match(categoryChangeApprove);
  if(changeMatch&&request.method==='POST')return approveCategoryChange(env,json,changeMatch[1]);
  if(reconcileChange.test(pathname)&&request.method==='POST') {
    // Under D1 transactional approvals there is no split KV/D1 'applying'
    // step, so the legacy KV-based repair route must not execute.
    return json({error:'Legacy KV reconciliation disabled under D1 mode'},409);
  }
  if(pathname==='/admin/publish'&&request.method==='POST') {
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    const rev=body.value.revision;
    if(!Number.isSafeInteger(rev)||rev<1)return json({error:'Draft revision required'},428);
    if(row.draft_revision!==rev)return stale(json);
    const snapshot=publishTransform(draft,env);
    if(!isConfig(snapshot))return json({error:'Invalid publish snapshot'},503);
    const version=String(Date.now())+'-'+crypto.randomUUID();
    const publishedAt=new Date().toISOString();
    // R2 snapshot first. A failed D1 CAS can leave an orphan R2 object,
    // which is safe; no public change is made.
    if(!env.SITE_CONFIG_HISTORY)return json({error:'R2 history binding missing'},503);
    await env.SITE_CONFIG_HISTORY.put('snapshots/site_config/'+version+'.json',
      JSON.stringify(snapshot),{httpMetadata:{contentType:'application/json'}});
    const saved=await env.DB.prepare(
      'UPDATE site_config_state SET published_json=?, published_revision=published_revision+1,'+
      'published_version=?, published_at=?, updated_at=? '+
      'WHERE id=1 AND draft_revision=? AND published_revision=?'
    ).bind(JSON.stringify(snapshot),version,publishedAt,publishedAt,rev,row.published_revision).run();
    if(saved?.meta?.changes!==1)return stale(json,'Published or draft version changed during review');
    return json({success:true,version,publishedAt,revision:rev});
  }
  if(pathname==='/admin/rollback'&&request.method==='POST'){
    const body=await readJsonBody(request,json);
    if(body.error)return body.error;
    const version=cleanField(body.value.version).trim();
    const priorRev=body.value.publishedRevision;
    if(!version||!Number.isSafeInteger(priorRev))return json({error:'Version and publishedRevision required'},428);
    if(!env.SITE_CONFIG_HISTORY)return json({error:'R2 history unavailable'},503);
    const obj=await env.SITE_CONFIG_HISTORY.get('snapshots/site_config/'+version+'.json');
    if(!obj)return json({error:'Snapshot not found'},404);
    const snapshot=parse(await obj.text());
    if(!isConfig(snapshot))return json({error:'Invalid snapshot'},500);
    const now=new Date().toISOString();
    const saved=await env.DB.prepare(
      'UPDATE site_config_state SET published_json=?,published_revision=published_revision+1,'+
      'published_version=?,published_at=?,updated_at=? WHERE id=1 AND published_revision=?'
    ).bind(JSON.stringify(snapshot),version,now,now,priorRev).run();
    if(saved?.meta?.changes!==1)return stale(json,'Published revision changed; rollback aborted');
    return json({success:true,version,rolledAt:now});
  }
  return json({error:'Method not allowed'},405);
}



/* Standalone QA runtime. Deploy ONLY to pz-category-qa worker. */
const QA_DOMAIN_PREFIX='pz-category-qa.';
function qaJson(data,status=200){return new Response(JSON.stringify(data,null,2),{
  status, headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',
    'x-content-type-options':'nosniff','access-control-allow-origin':'null'}
});}
function qaSecureEquals(a,b){
  if(typeof a!=='string'||typeof b!=='string')return false;
  let x=a.length^b.length;
  for(let i=0;i<Math.max(a.length,b.length);i++)x|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);
  return x===0;
}
function qaEnabled(env,host){
  return host.startsWith(QA_DOMAIN_PREFIX)&&
    String(env.PZ_RUNTIME_ENV||'').toLowerCase()==='qa'&&!!env.DB;
}
async function qaState(env){
  return env.DB.prepare('SELECT * FROM site_config_state WHERE id=1').first();
}
const qaAuthorize=async (_request,_env,allowed)=>
  allowed.includes('ADMIN')?{user:{id:'qa-operator',role:'ADMIN'}}:qaJson({error:'Role not allowed'},403);
async function qaCall(path,method,body,env){
  const request=new Request('https://pz-category-qa.internal'+path,{
    method,
    headers:{'content-type':'application/json'},
    ...(method==='GET'?{}:{body:JSON.stringify(body??{})})
  });
  const response=await handleD1SiteConfig({
    request,env,pathname:path,authorize:qaAuthorize,json:qaJson,
    publishTransform:source=>structuredClone(source)
  });
  if(!(response instanceof Response))throw Error('D1 handler did not respond to '+path);
  return {status:response.status,body:await response.json()};
}
async function qaCheckState(env){
  const row=await qaState(env);
  if(!row)throw Error('QA D1 site_config_state row id=1 not initialized');
  const draft=JSON.parse(row.draft_json);
  const published=JSON.parse(row.published_json);
  if(!Array.isArray(draft.categories)||!Array.isArray(published.categories)||
    !draft.categories.some(c=>c.id==='qa-sofa')||
    !draft.categories.some(c=>c.id==='qa-table')||
    !published.categories.some(c=>c.id==='qa-sofa')||
    !published.categories.some(c=>c.id==='qa-table')){
    throw Error('QA seed marker missing. Refusing to mutate an unknown database.');
  }
  return {row,draft,published};
}
function qaAssert(ok,message){if(!ok)throw Error(message);}
async function qaRun(env){
  const results=[];
  const first=await qaCheckState(env);
  const runId=crypto.randomUUID().replace(/-/g,'').slice(0,10);
  const publicBefore=first.row.published_json;
  const initialRevision=first.row.draft_revision;
  const beforeCats=first.draft.categories.length;

  const writerConfig=(name)=>{
    const copy=structuredClone(first.draft);
    copy.home={...(copy.home||{}),hero:{...(copy.home?.hero||{}),title:'QA concurrent '+name+' '+runId}};
    return copy;
  };
  // Real concurrent requests: both must use exactly the same revision.
  const [a,b]=await Promise.all([
    qaCall('/site-config','PUT',{revision:initialRevision,config:writerConfig('A')},env),
    qaCall('/site-config','PUT',{revision:initialRevision,config:writerConfig('B')},env)
  ]);
  qaAssert([a.status,b.status].sort().join(',')==='200,409',
    'Concurrent draft CAS expected [200,409], got ['+a.status+','+b.status+']');
  let mid=await qaCheckState(env);
  qaAssert(mid.row.draft_revision===initialRevision+1,'Concurrent draft revision did not increment once');
  qaAssert(mid.row.published_json===publicBefore,'Public config changed before explicit publish');
  results.push({name:'管理员同时保存',passed:true,http:[a.status,b.status],
    revision:mid.row.draft_revision,publicUnchanged:true});

  // One request per new category; exercise D1 transactional approval logic,
  // not a mock database. Keep QA-only IDs and titles.
  const ids=['qa-'+runId+'-a','qa-'+runId+'-b'];
  const titles=['QA Concurrent A '+runId,'QA Concurrent B '+runId];
  for(let i=0;i<2;i++){
    const added=await env.DB.prepare(
      'INSERT INTO category_requests (id,title,title_cn,subtitle,image,status,created_at,updated_at)'+
      ' VALUES(?,?,?,?,?,?,?,?)'
    ).bind(ids[i],titles[i],'测试分类','QA only','', 'pending',
      new Date().toISOString(),new Date().toISOString()).run();
    qaAssert(added?.meta?.changes===1,'Cannot insert QA-only test category');
  }
  const urls=ids.map(id=>'/admin/category-requests/'+id+'/approve');
  const outcomes=await Promise.all(urls.map(url=>qaCall(url,'POST',{},env)));
  qaAssert(outcomes.every(x=>x.status===200||x.status===409),
    'Concurrent approve unexpected HTTP ['+outcomes.map(x=>x.status)+']');
  for(let i=0;i<2;i++){
    if(outcomes[i].status===409){
      const retry=await qaCall(urls[i],'POST',{},env);
      qaAssert(retry.status===200,'Retry of independent category approval failed '+retry.status);
    }
  }
  mid=await qaCheckState(env);
  const rows=await Promise.all(ids.map(id=>env.DB.prepare(
    'SELECT status FROM category_requests WHERE id=?').bind(id).first()));
  qaAssert(rows.every(row=>row?.status==='approved'),'Approval/request status diverged');
  qaAssert(titles.every(title=>mid.draft.categories.filter(c=>c.title===title).length===1),
    'Approved categories lost or duplicated in draft');
  qaAssert(mid.draft.categories.length===beforeCats+2,
    'Concurrent approval unexpectedly changed other categories');
  qaAssert(mid.row.published_json===publicBefore,'Approval automatically published a category');
  results.push({name:'两个分类同时审核',passed:true,http:outcomes.map(x=>x.status),
    requestStatus:rows.map(x=>x.status),draftCount:mid.draft.categories.length,
    publicUnchanged:true});

  const stalePublish=await qaCall('/admin/publish','POST',{revision:initialRevision},env);
  qaAssert(stalePublish.status===409,'Stale publish should return 409');
  qaAssert((await qaState(env)).published_json===publicBefore,
    'Stale publish modified public config');
  results.push({name:'过期版本拒绝发布',passed:true,http:409,publicUnchanged:true});

  // No QA R2 history binding by design. Failure must leave public D1 untouched.
  const current=await qaState(env);
  qaAssert(!env.SITE_CONFIG_HISTORY,'This QA test must have no R2 history binding');
  const failedPublish=await qaCall('/admin/publish','POST',
    {revision:current.draft_revision},env);
  qaAssert(failedPublish.status===503,'Missing history R2 must return 503');
  qaAssert((await qaState(env)).published_json===publicBefore,
    'Failed publish modified public config');
  results.push({name:'发布依赖缺失时安全失败',passed:true,http:503,publicUnchanged:true});

  return {success:true,environment:'QA ONLY',runId,results,
    revisionBefore:initialRevision,revisionAfter:(await qaState(env)).draft_revision,
    publishedUnchanged:true,
    note:'The QA database has new draft-only test records; public snapshot unchanged.'};
}
function qaHtml(){
  return '<!doctype html><html lang="zh"><head><meta charset="utf-8">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<title>PZ QA 并发测试</title><style>body{font-family:system-ui,sans-serif;'+
   'max-width:720px;margin:50px auto;padding:0 16px;color:#222}button,input{'+
   'font:inherit;padding:10px}input{width:100%;box-sizing:border-box}button{margin-top:12px;'+
   'background:#222;color:white;border:0;border-radius:6px;cursor:pointer}'+
   'pre{white-space:pre-wrap;overflow-wrap:anywhere;background:#f2f2f2;padding:16px;'+
   'border-radius:6px}small{color:#666}</style></head><body>'+
   '<h2>PZ 分类 QA：D1 并发与审批测试</h2>'+
   '<p>此页面只操作独立的 <b>pz-category-qa-db</b>。不连接网站正式环境或 Staging。</p>'+
   '<p>请先配置 QA Worker 的 <code>QA_TEST_KEY</code> Secret，'+
   '并将 <code>PZ_D1_SITE_CONFIG_ENABLED</code> 设置为 <code>true</code>（仅 QA）。</p>'+
   '<label>QA 测试密钥（不会保存）<input id="key" type="password" autocomplete="off"'+
   ' placeholder="输入你设置的 QA_TEST_KEY"></label>'+
   '<button id="run">运行真实 D1 测试</button>'+
   '<p><small>测试会给 QA 数据库增加草稿和申请记录，不修改公开快照。</small></p>'+
   '<pre id="out">尚未运行</pre>'+
   '<script>document.getElementById("run").addEventListener("click",async()=>{'+
   'const btn=document.getElementById("run");btn.disabled=true;'+
   'document.getElementById("out").textContent="正在运行 QA 测试...";'+
   'try{const res=await fetch("/qa/run",{method:"POST",headers:{'+
   '"x-qa-test-key":document.getElementById("key").value}});'+
   'document.getElementById("out").textContent=JSON.stringify(await res.json(),null,2);}'+
   'catch(e){document.getElementById("out").textContent=String(e)}'+
   'finally{btn.disabled=false;}});</script></body></html>';
}
export default {
  async fetch(request,env) {
    const url=new URL(request.url);
    if(!qaEnabled(env,url.hostname))
      return qaJson({error:'QA worker/environment guard failed'},403);
    if(url.pathname==='/qa/health'&&request.method==='GET')
      return qaJson({qa:true,worker:'pz-category-qa',d1Bound:!!env.DB,
        d1FlagEnabled:pzD1SiteEnabled(env),testKeyConfigured:!!env.QA_TEST_KEY});
    if(url.pathname==='/'&&request.method==='GET'){
      return new Response(qaHtml(),{headers:{
        'content-type':'text/html; charset=utf-8','cache-control':'no-store',
        'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
        'x-content-type-options':'nosniff'
      }});
    }
    if(url.pathname!=='/qa/run'||request.method!=='POST')
      return qaJson({error:'Not found'},404);
    if(!env.QA_TEST_KEY||String(env.QA_TEST_KEY).length<24)
      return qaJson({error:'QA_TEST_KEY Secret missing or too short (24+ chars)'},503);
    if(!qaSecureEquals(request.headers.get('x-qa-test-key')||'',String(env.QA_TEST_KEY)))
      return qaJson({error:'QA test key invalid'},401);
    if(!pzD1SiteEnabled(env))
      return qaJson({error:'Enable PZ_D1_SITE_CONFIG_ENABLED=true on QA Worker only'},503);
    try{return qaJson(await qaRun(env));}
    catch(error){
      // The test may have partially modified QA-only rows. Do not auto-reset.
      return qaJson({success:false,qa:true,error:String(error?.message||error),
        note:'QA-only data may be partially modified. Inspect D1 before rerun.'},500);
    }
  }
};
