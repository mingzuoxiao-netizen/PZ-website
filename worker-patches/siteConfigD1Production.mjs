/**
 * Production review only. Atomic, revisioned site-config in D1.
 *
 * Enabled ONLY with env.PZ_D1_SITE_CONFIG_ENABLED === 'true' and after
 * explicit ADMIN bootstrap of current KV draft and published config.
 * No Worker deployment or migration implied by adding this file.
 */
export const pzD1SiteEnabled = env =>
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
export async function pzReadPublishedConfig(env) {
  if(!pzD1SiteEnabled(env)) {
    return parse(await env.SITE_CONFIG_KV.get('published:site_config'));
  }
  const row=await dbRow(env);
  return row?parse(row.published_json):null;
}
export async function pzReadDraftConfig(env) {
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
export async function handleD1SiteConfig({request,env,pathname,authorize,json,publishTransform}) {
  const boot='/admin/site-config/bootstrap';
  const isBootstrap=pathname===boot;
  if(!isBootstrap&&!protectedRoutes.has(pathname)&&!unsafeLegacyApprovals(pathname))return null;
  if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!=='production')
    return isBootstrap?json({error:'Production only'},403):null;
  const active=pzD1SiteEnabled(env);
  if(!active&&!isBootstrap) {
    // Keep existing new-category approval available during the short opt-in
    // window. Only the newly introduced modification approval/reconciliation
    // requires a bootstrapped D1 state.
    return categoryChangeApprove.test(pathname)||reconcileChange.test(pathname)
      ?json({error:'D1 category changes are not activated'},503)
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
      // Preserve the pre-cutover public version *before* the D1 cutover.
      // A D1 bootstrap without this R2 snapshot could not roll back to the
      // last published KV site after the very first D1-backed publish.
      if(!env.SITE_CONFIG_HISTORY ||
         typeof env.SITE_CONFIG_HISTORY.put!=='function' ||
         typeof env.SITE_CONFIG_HISTORY.get!=='function')
        return json({error:'Site config history R2 binding required for safe cutover'},503);
      const bootstrapVersion='bootstrap-'+publishedSha;
      const snapshotKey='snapshots/site_config/'+bootstrapVersion+'.json';
      const preexisting=await env.SITE_CONFIG_HISTORY.get(snapshotKey);
      if(preexisting) {
        if(await preexisting.text()!==publishedRaw)
          return stale(json,'Bootstrap R2 snapshot conflicts with current KV published content');
      }else{
        await env.SITE_CONFIG_HISTORY.put(snapshotKey,publishedRaw,{
          httpMetadata:{contentType:'application/json'}
        });
      }
      const verified=await env.SITE_CONFIG_HISTORY.get(snapshotKey);
      if(!verified || await verified.text()!==publishedRaw)
        return json({error:'Bootstrap snapshot was not verified in R2; D1 untouched'},503);
      const timestamp=new Date().toISOString();
      const installed=await env.DB.prepare(
        'INSERT OR IGNORE INTO site_config_state (id,draft_json,draft_revision,published_json,'+
        'published_revision,published_version,published_at,write_token,updated_at) '+
        'VALUES(1,?,1,?,1,?,?,?,?)'
      ).bind(draftRaw,publishedRaw,bootstrapVersion,
        String(meta.publishedAt||timestamp),crypto.randomUUID(),timestamp).run();
      if(installed?.meta?.changes!==1)return stale(json,'Site config bootstrapped by another request');
      return json({success:true,revision:1,draftSha,publishedSha,
        publishedVersion:bootstrapVersion,initialSnapshotVerified:true});
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
