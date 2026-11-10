// Additive two-stage category proposals. Legacy category_requests stays the
// published-draft source; review ownership and history are recorded separately.
// Enabled only after migration 015 with PZ_CATEGORY_TWO_STAGE_ENABLED=true.
// This module is inlined into the complete Staging and Production Worker candidates.
export function pzCategoryTwoStageReviewFetch(originalFetch, { authorize, json, expectedRuntime, imageBase }) {
  const respond=(error,status=400)=>json({error},status);
  const iso=()=>new Date().toISOString();
  const validStatuses=new Set(['pending_supervisor','pending_admin','returned_to_supervisor','returned_to_uploader','approved']);
  const maxRequestBytes=12000;
  const norm=value=>String(value||'').trim().toLowerCase();
  const event=(id,rev,action,actor,note,now)=>[
    crypto.randomUUID(),id,rev,action,actor,note||null,now
  ];
  async function bodyOf(request) {
    if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
      return {error:respond('请使用 JSON 提交申请。',415)};
    const raw=await request.text();
    if(new TextEncoder().encode(raw).byteLength>maxRequestBytes)
      return {error:respond('申请内容过长。',413)};
    let body;
    try { body=JSON.parse(raw); } catch { return {error:respond('JSON 格式不正确。',400)}; }
    if(!body||typeof body!=='object'||Array.isArray(body))
      return {error:respond('申请内容格式不正确。',400)};
    return {body};
  }
  async function validatePayload(body,env) {
    for(const field of ['title','title_cn','subtitle','image']) {
      if(typeof body[field]!=='string')return {error:respond('缺少或无效字段：'+field,400)};
    }
    const value={
      title:body.title.trim(),title_cn:body.title_cn.trim(),
      subtitle:body.subtitle.trim(),image:body.image.trim()
    };
    if(value.title.length<2 || value.title.length>100 ||
      !/^[a-z0-9][a-z0-9 .&_-]*$/i.test(value.title) ||
      !value.title_cn || value.title_cn.length>100 || value.subtitle.length>200)
      return {error:respond('请填写有效的中英文名称（英文 2–100 字）及副标题。',400)};
    const base=imageBase(env);
    if(!base||!value.image||value.image.length>2048)
      return {error:respond('请上传当前环境的分类封面。',400)};
    try {
      const u=new URL(value.image),b=new URL(base);
      if(u.origin!==b.origin ||
        u.search||u.hash||u.username||u.password||u.protocol!=='https:')
        return {error:respond('分类封面必须来自当前环境的图片存储。',400)};
      // The existing /upload-image endpoint returns encodeURIComponent(key),
      // e.g. /uploads%2Ffilename.jpg. Support that legacy encoding, alongside
      // /uploads/filename.jpg, without allowing arbitrary or double-encoded paths.
      const key=decodeURIComponent(u.pathname.slice(1));
      if(!/^uploads\/[^/]+$/.test(key)||key.includes('..')||
        (u.pathname!==('/'+encodeURIComponent(key)) && u.pathname!==('/'+key)))
        return {error:respond('图片存储路径无效。',400)};
      if(!env.PRODUCT_IMAGES || !(await env.PRODUCT_IMAGES.head(key)))
        return {error:respond('分类封面未在当前环境的 R2 中找到。',409)};
    } catch { return {error:respond('分类封面 URL 无效。',400)}; }
    return {value};
  }
  async function checkCategoryConflict(env,value,exceptId=null) {
    const slug=norm(value.title).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    const rows=await env.DB.prepare(
      "SELECT 1 AS found FROM category_requests WHERE lower(trim(title))=lower(?) " +
      "AND status NOT IN ('rejected') AND id<>? LIMIT 1"
    ).bind(value.title,exceptId||'').first();
    if(rows)return respond('该英文分类名称已有申请，请检查现有记录。',409);
    let raw;
    if(String(env.PZ_D1_SITE_CONFIG_ENABLED||'').toLowerCase()==='true' &&
       String(env.PZ_SITE_CONFIG_D1_CUTOVER_ENABLED||'').toLowerCase()==='true') {
      const rec=await env.DB.prepare("SELECT draft_json FROM site_config_state WHERE id=1").first();
      raw=rec?.draft_json;
    } else {
      raw=await env.SITE_CONFIG_KV?.get('draft:site_config');
    }
    if(!raw)return respond('无法读取网站分类草稿，申请未保存。',503);
    let config;
    try{config=JSON.parse(raw);}catch{return respond('网站分类草稿损坏，申请未保存。',503);}
    if(!Array.isArray(config?.categories))return respond('网站分类草稿不可用。',503);
    if(config.categories.some(c=>c.id===slug||norm(c.title)===norm(value.title)))
      return respond('网站配置中已存在同名分类。',409);
    return null;
  }
  async function actorAssignment(env,actor) {
    return env.DB.prepare(
      "SELECT a.department_id,a.supervisor_id,a.job_type FROM pz_staff_assignments a "+
      "JOIN pz_departments d ON d.id=a.department_id AND d.is_active=1 "+
      "WHERE a.user_id=? LIMIT 1"
    ).bind(actor).first();
  }
  async function activeSupervisor(env,id,dept) {
    return env.DB.prepare(
      "SELECT 1 AS found FROM users u "+
      "JOIN pz_staff_assignments a ON a.user_id=u.id "+
      "JOIN pz_departments d ON d.id=a.department_id "+
      "WHERE u.id=? AND u.is_active=1 AND lower(u.role)='factory' "+
      "AND a.job_type='supervisor' AND a.department_id=? AND d.is_active=1 LIMIT 1"
    ).bind(id,dept).first();
  }

  // Publish only the approved category into the live registry. NEVER publish
  // unrelated pending homepage/catalog/media draft edits.
  const d1Cutover=env=>
    String(env.PZ_D1_SITE_CONFIG_ENABLED||'').toLowerCase()==='true' &&
    String(env.PZ_SITE_CONFIG_D1_CUTOVER_ENABLED||'').toLowerCase()==='true';
  const validConfig=x=>x && typeof x==='object' && !Array.isArray(x) &&
    Array.isArray(x.categories) && x.categories.every(c=>c && typeof c.id==='string');
  const parseConfig=raw=>{
    try {const x=JSON.parse(raw||'null');return validConfig(x)?x:null;}
    catch {return null;}
  };
  async function publishedConfig(env) {
    if(d1Cutover(env)){
      const row=await env.DB.prepare("SELECT published_json FROM site_config_state WHERE id=1").first();
      return parseConfig(row?.published_json);
    }
    return parseConfig(await env.SITE_CONFIG_KV?.get('published:site_config'));
  }
  const categorySlug=title=>norm(title).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
  const isAlreadyPublished=(config,requestId)=>
    Boolean(config?.categories.some(c=>c.proposal_id===requestId));
  // Return a status object rather than throw after approval: approval is
  // irreversible, and the admin needs a distinct publication-retry path.
  async function publishApprovedCategory(env,requestId){
    let proposal;
    try {
      proposal=await env.DB.prepare(
        "SELECT id,title,title_cn,subtitle,image,status,created_at FROM category_requests "+
        "WHERE id=? LIMIT 1"
      ).bind(requestId).first();
    }catch(error){
      console.error('Category publication request read failed',String(error));
      return {published:false,publishError:'读取已批准分类失败，请在审核中心重试发布。'};
    }
    if(!proposal || proposal.status!=='approved')
      return {published:false,publishError:'只有 Admin 已批准的新品类可以发布。'};
    // A new workflow request cannot be published from the legacy status alone;
    // its supervisor/admin event chain must also have reached approved.
    const flow=await env.DB.prepare(
      "SELECT status FROM pz_category_request_flow WHERE request_id=? LIMIT 1"
    ).bind(requestId).first();
    if(flow && flow.status!=='approved')
      return {published:false,publishError:'新品类双级审核状态未完成，请先核对审批事件。'};
    const slug=categorySlug(proposal.title);
    if(!slug)return {published:false,publishError:'分类英文名称无法生成有效编号。'};
    const proposed={
      id:slug,title:proposal.title,title_cn:proposal.title_cn||'',
      title_zh:proposal.title_cn||'',subtitle:proposal.subtitle||'',
      image:proposal.image||'',source:'proposal',proposal_id:requestId,
      created_at:proposal.created_at||iso()
    };
    for(let attempt=0;attempt<3;attempt++){
      try{
        const usingD1=d1Cutover(env);
        let row=null,raw;
        if(usingD1){
          row=await env.DB.prepare(
            "SELECT published_json,published_revision FROM site_config_state WHERE id=1"
          ).first();
          raw=row?.published_json;
        }else raw=await env.SITE_CONFIG_KV?.get('published:site_config');
        const current=parseConfig(raw);
        if(!current)return {published:false,publishError:'网站已发布配置不存在，已保留批准记录。'};
        const existing=current.categories.find(c=>c.proposal_id===requestId);
        if(existing) {
          const correct=existing.id===slug &&
            norm(existing.title)===norm(proposal.title) &&
            existing.image===proposal.image;
          return correct?{published:true,alreadyPublished:true,categoryId:slug}:
            {published:false,publishError:'该申请已存在不同的公开内容，需要人工核对。'};
        }
        if(current.categories.some(c=>c.id===slug ||
          norm(c.title)===norm(proposal.title)))
          return {published:false,publishError:'公开网站已有同名或同编号分类，不能覆盖。'};
        const snapshot={...current,categories:[proposed,...current.categories]};
        const serialized=JSON.stringify(snapshot);
        if(serialized.length>512*1024)
          return {published:false,publishError:'公开分类数据超过存储限制。'};
        const version=String(Date.now())+'-'+crypto.randomUUID();
        const publishedAt=iso();
        if(!usingD1){
          // Advisory reread prevents stale read-modify-write in normal cases;
          // KV does not provide compare-and-swap. No unrelated *draft* content
          // is ever copied to the public snapshot.
          const latest=await env.SITE_CONFIG_KV.get('published:site_config');
          if(latest!==raw)continue;
        }
        if(env.SITE_CONFIG_HISTORY?.put){
          // Save the intended live snapshot before making it public.
          await env.SITE_CONFIG_HISTORY.put(
            'snapshots/site_config/'+version+'.json',serialized,
            {httpMetadata:{contentType:'application/json'}}
          );
        }else if(usingD1) {
          return {published:false,publishError:'D1 发布要求配置历史 R2 绑定。'};
        }
        if(usingD1){
          const result=await env.DB.prepare(
            'UPDATE site_config_state SET published_json=?,published_revision=published_revision+1,'+
            'published_version=?,published_at=?,updated_at=? WHERE id=1 AND published_revision=?'
          ).bind(serialized,version,publishedAt,publishedAt,row.published_revision).run();
          if(Number(result?.meta?.changes)!==1)continue;
        }else{
          await env.SITE_CONFIG_KV.put('published:site_config',serialized);
          await env.SITE_CONFIG_KV.put('published:meta',JSON.stringify({version,publishedAt}));
        }
        return {published:true,categoryId:slug,version,publishedAt};
      }catch(error){
        console.error('Targeted category publication failed',requestId,String(error));
        return {published:false,publishError:'分类已批准，但发布失败。可在审核中心单独重试。'};
      }
    }
    return {published:false,publishError:'公开配置在发布期间发生变化，请重试该分类。'};
  }
  async function publicationResponse(env,requestId,result){
    const pub=await publishApprovedCategory(env,requestId);
    return json({...result,...pub,needsPublish:!pub.published,
      publicationMode:'category_only'});
  }
  const tableListSql=
    "SELECT c.id,c.title,c.title_cn,c.subtitle,c.image,c.created_at,c.updated_at,"+
    "c.status AS legacy_status,COALESCE(f.status,c.status) AS status,"+
    "f.request_id,f.submitter_id,f.supervisor_id,f.department_id,"+
    "f.last_reason AS reject_reason,f.revision,"+
    "u.username AS submitter_name,s.username AS supervisor_name "+
    "FROM category_requests c LEFT JOIN pz_category_request_flow f ON f.request_id=c.id "+
    "LEFT JOIN users u ON u.id=f.submitter_id LEFT JOIN users s ON s.id=f.supervisor_id";
  async function list(env,where='',params=[],limit=300) {
    const rows=await env.DB.prepare(tableListSql+where+
      " ORDER BY COALESCE(f.updated_at,c.updated_at) DESC LIMIT "+limit).bind(...params).all();
    const records=rows.results||[];
    const ids=records.filter(x=>x.request_id).map(x=>x.id);
    const history=new Map();
    if(ids.length){
      const sql="SELECT request_id,revision,action,actor_id,note,created_at "+
        "FROM pz_category_request_events WHERE request_id IN ("+
        ids.map(()=>"?").join(",")+") ORDER BY revision ASC";
      const events=await env.DB.prepare(sql).bind(...ids).all();
      for(const entry of events.results||[]){
        if(!history.has(entry.request_id))history.set(entry.request_id,[]);
        history.get(entry.request_id).push({
          revision:entry.revision,action:entry.action,actor_id:entry.actor_id,
          note:entry.note,created_at:entry.created_at
        });
      }
    }
    let publicConfig=null;
    try{publicConfig=await publishedConfig(env);}catch(error){
      console.error('Category publication status check failed',String(error));
    }
    return records.map(x=>({
      ...x,
      status:x.legacy_status==='approved'?'approved':x.status,
      legacy:!x.request_id,
      events:history.get(x.id)||[],
      published:x.legacy_status==='approved' && isAlreadyPublished(publicConfig,x.id)
    }));
  }
  async function writeTransition(env,{id,actor,from,to,action,note,revision}) {
    const now=iso(),next=revision+1;
    const statements=[
      env.DB.prepare("UPDATE pz_category_request_flow SET status=?,revision=revision+1,"+
        "last_reason=?,updated_at=? WHERE request_id=? AND status=? AND revision=?")
        .bind(to,note||null,now,id,from,revision),
      env.DB.prepare(
        "INSERT INTO pz_category_request_events "+
        "(id,request_id,revision,action,actor_id,note,created_at) "+
        "SELECT ?,?,?,?,?,?,? WHERE EXISTS "+
        "(SELECT 1 FROM pz_category_request_flow WHERE request_id=? AND status=? AND revision=?)"
      ).bind(...event(id,next,action,actor,note,now),id,to,next)
    ];
    try{
      const results=await env.DB.batch(statements);
      if(Number(results[0]?.meta?.changes)!==1 || Number(results[1]?.meta?.changes)!==1)
        return respond('申请状态已变化，请刷新后重试。',409);
    }catch(error){
      if(/constraint|unique/i.test(String(error)))return respond('重复审批，请刷新记录。',409);
      console.error('Category workflow transition error',String(error));
      return respond('申请更新失败，未完成审批。',503);
    }
    return json({success:true,id,status:to});
  }
  const getFlow=(env,id)=>env.DB.prepare(
    'SELECT * FROM pz_category_request_flow WHERE request_id=? LIMIT 1').bind(id).first();
  return async function categoryTwoStageFetch(request,env,ctx) {
    const path=new URL(request.url).pathname;
    const method=request.method;
    const isCategoryRoute=path==='/factory/category-requests'||
      path==='/supervisor/category-requests'||path==='/admin/category-requests'||
      /^\/factory\/category-requests\/[^/]+\/resubmit$/.test(path)||
      /^\/supervisor\/category-requests\/[^/]+\/(approve|reject)$/.test(path)||
      /^\/admin\/category[-_]requests\/[^/]+\/(approve|reject|publish)$/.test(path);
    if(!isCategoryRoute || String(env.PZ_CATEGORY_TWO_STAGE_ENABLED||'').toLowerCase()!=='true')
      return originalFetch.call(this,request,env,ctx);
    if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!==expectedRuntime)
      return respond('该分类申请接口只允许在配置的环境运行。',403);
    if(!env.DB)return respond('D1 未配置。',503);
    // Authenticate before inspecting schema to avoid disclosing deployment state.
    const roles=path.startsWith('/admin/')?['ADMIN']:
      path.startsWith('/supervisor/')?['SUPERVISOR']:['FACTORY'];
    const auth=await authorize(request,env,roles);
    if(auth instanceof Response)return auth;
    const actor=auth.user.id;
    // Fail closed if migration is not installed; never silently submit legacy single-stage.
    try{
      const schema=await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pz_category_request_flow'"
      ).first();
      if(!schema)return respond('分类双级审核迁移 015 尚未执行。',503);
    }catch{return respond('无法验证分类审核数据库结构。',503);}
    if(method==='GET'&&path==='/factory/category-requests') {
      return json({items:await list(env,' WHERE f.submitter_id=?',[actor],200)});
    }
    if(method==='GET'&&path==='/supervisor/category-requests') {
      const assigned=await actorAssignment(env,actor);
      if(!assigned||assigned.job_type!=='supervisor')return respond('主管部门未分配。',403);
      return json({items:await list(env,' WHERE f.supervisor_id=? AND f.department_id=?',
        [actor,assigned.department_id],300)});
    }
    if(method==='GET'&&path==='/admin/category-requests') {
      return json({items:await list(env,'',[],500)});
    }
    if(method==='POST'&&path==='/factory/category-requests') {
      const assignment=await actorAssignment(env,actor);
      if(!assignment||!['staff','secretary','data_entry'].includes(assignment.job_type)||
        !assignment.supervisor_id || !(await activeSupervisor(env,assignment.supervisor_id,assignment.department_id)))
        return respond('请先由管理员分配所属部门及有效主管，再提交新品类申请。',409);
      const parsed=await bodyOf(request);
      if(parsed.error)return parsed.error;
      const checked=await validatePayload(parsed.body,env);
      if(checked.error)return checked.error;
      const conflict=await checkCategoryConflict(env,checked.value);
      if(conflict)return conflict;
      const v=checked.value,id=crypto.randomUUID(),now=iso();
      try{
        const result=await env.DB.batch([
          env.DB.prepare("INSERT INTO category_requests "+
            "(id,title,title_cn,subtitle,image,status,created_at,updated_at) "+
            "VALUES(?,?,?,?,?,'pending',?,?)")
            .bind(id,v.title,v.title_cn,v.subtitle,v.image,now,now),
          env.DB.prepare("INSERT INTO pz_category_request_flow "+
            "(request_id,submitter_id,supervisor_id,department_id,status,revision,created_at,updated_at) "+
            "VALUES(?,?,?,?,'pending_supervisor',1,?,?)")
            .bind(id,actor,assignment.supervisor_id,assignment.department_id,now,now),
          env.DB.prepare("INSERT INTO pz_category_request_events "+
            "(id,request_id,revision,action,actor_id,note,created_at) VALUES(?, ?,1,'submitted',?,NULL,?)")
            .bind(crypto.randomUUID(),id,actor,now)
        ]);
        if(result.some(x=>Number(x.meta?.changes)!==1))
          return respond('申请保存未确认，请刷新查看记录。',503);
      }catch(error){
        console.error('Category request create failed',String(error));
        return respond('新品类申请保存失败，请刷新后检查记录。',503);
      }
      return json({success:true,id,status:'pending_supervisor'},201);
    }
    const resubmit=path.match(/^\/factory\/category-requests\/([^/]+)\/resubmit$/);
    if(method==='POST'&&resubmit) {
      const id=resubmit[1];
      const f=await getFlow(env,id);
      if(!f)return respond('找不到你的新品类申请。',404);
      if(f.submitter_id!==actor)return respond('无权修改其他员工的申请。',403);
      if(f.status!=='returned_to_uploader')return respond('只有退回员工的申请可以修改并重新提交。',409);
      const assignment=await actorAssignment(env,actor);
      if(!assignment || !['staff','secretary','data_entry'].includes(assignment.job_type) ||
         !assignment.supervisor_id || !(await activeSupervisor(env,assignment.supervisor_id,assignment.department_id)))
        return respond('当前无有效部门及主管，请联系管理员重新分配。',409);
      const parsed=await bodyOf(request);
      if(parsed.error)return parsed.error;
      const checked=await validatePayload(parsed.body,env);
      if(checked.error)return checked.error;
      const conflict=await checkCategoryConflict(env,checked.value,id);
      if(conflict)return conflict;
      const v=checked.value,now=iso(),next=f.revision+1;
      try{
        const results=await env.DB.batch([
          env.DB.prepare("UPDATE category_requests "+
            "SET title=?,title_cn=?,subtitle=?,image=?,updated_at=? "+
            "WHERE id=? AND status='pending' AND EXISTS("+
            "SELECT 1 FROM pz_category_request_flow WHERE request_id=? "+
            "AND status='returned_to_uploader' AND revision=?)")
            .bind(v.title,v.title_cn,v.subtitle,v.image,now,id,id,f.revision),
          env.DB.prepare("UPDATE pz_category_request_flow "+
            "SET supervisor_id=?,department_id=?,status='pending_supervisor',revision=revision+1,"+
            "last_reason=NULL,updated_at=? WHERE request_id=? "+
            "AND status='returned_to_uploader' AND revision=?")
            .bind(assignment.supervisor_id,assignment.department_id,now,id,f.revision),
          env.DB.prepare("INSERT INTO pz_category_request_events "+
            "(id,request_id,revision,action,actor_id,note,created_at) "+
            "SELECT ?,?,?,'resubmitted',?,NULL,? WHERE EXISTS("+
            "SELECT 1 FROM pz_category_request_flow WHERE request_id=? "+
            "AND status='pending_supervisor' AND revision=?)")
            .bind(crypto.randomUUID(),id,next,actor,now,id,next)
        ]);
        if(results.some(x=>Number(x.meta?.changes)!==1))
          return respond('申请状态已变化，请刷新后重试。',409);
      }catch(error){console.error('Category resubmit error',String(error));return respond('重新提交失败，请刷新核对记录。',503);}
      return json({success:true,id,status:'pending_supervisor'});
    }
    const supervisorAction=path.match(/^\/supervisor\/category-requests\/([^/]+)\/(approve|reject)$/);
    if(method==='POST'&&supervisorAction) {
      const [,id,action]=supervisorAction;
      const f=await getFlow(env,id);
      if(!f)return respond('申请不存在。',404);
      const assignment=await actorAssignment(env,actor);
      if(!assignment || assignment.job_type!=='supervisor' ||
         assignment.department_id!==f.department_id || f.supervisor_id!==actor)
        return respond('只能审批自己部门的新品类申请。',403);
      if(!['pending_supervisor','returned_to_supervisor'].includes(f.status))
        return respond('申请当前不在主管初审队列中。',409);
      const parsed=await bodyOf(request);
      if(parsed.error)return parsed.error;
      const note=String(parsed.body.note||'').trim();
      if(note.length>500 || (action==='reject'&&!note))
        return respond('退回必须填写 1–500 字的原因。',400);
      return writeTransition(env,{id,actor,from:f.status,
        to:action==='approve'?'pending_admin':'returned_to_uploader',
        action:action==='approve'?'supervisor_approved':'supervisor_returned',
        note,revision:f.revision});
    }
    const adminAction=path.match(/^\/admin\/category[-_]requests\/([^/]+)\/(approve|reject|publish)$/);
    if(method==='POST'&&adminAction) {
      const [,id,action]=adminAction;
      if(action==='publish'){
        // No additional approval needed: retry publication of an already
        // Admin-approved category, and never re-run the approval transition.
        return publicationResponse(env,id,{success:true,id,status:'approved'});
      }
      const f=await getFlow(env,id);
      if(!f) {
        // Legacy requests have no known submitter; keep their existing approval
        // semantics, but publish this single category after successful approval.
        const upstream=await originalFetch.call(this,request,env,ctx);
        if(action!=='approve'||!upstream.ok)return upstream;
        const result=await upstream.clone().json().catch(()=>null);
        if(result?.success!==true||result.status!=='approved')return upstream;
        return publicationResponse(env,id,{...result,approval:'legacy'});
      }
      if(f.status!=='pending_admin')
        return respond('该申请尚未通过部门主管初审，Admin 不可终审。',409);
      const parsed=await bodyOf(request);
      if(parsed.error)return parsed.error;
      const note=String(parsed.body.note||'').trim();
      if(note.length>500||(action==='reject'&&!note))
        return respond('Admin 退回必须填写 1–500 字的原因。',400);
      if(action==='reject')
        return writeTransition(env,{id,actor,from:'pending_admin',
          to:'returned_to_supervisor',action:'admin_returned',note,revision:f.revision});
      const upstream=await originalFetch.call(this,request,env,ctx);
      if(!upstream.ok)return upstream;
      const result=await upstream.clone().json().catch(()=>null);
      if(result?.success!==true || result.status!=='approved')
        return respond('后台未确认分类保存草稿，审批状态未更新。',503);
      const done=await writeTransition(env,{id,actor,from:'pending_admin',
        to:'approved',action:'admin_approved',note,revision:f.revision});
      if(!done.ok) {
        console.error('Category approved in legacy table but workflow reconciliation required',id);
        return respond('分类草稿已批准，但审核日志同步失败，请管理员核对，勿重复批准。',503);
      }
      return publicationResponse(env,id,{...result,approval:'two_stage'});
    }
    return originalFetch.call(this,request,env,ctx);
  };
}
