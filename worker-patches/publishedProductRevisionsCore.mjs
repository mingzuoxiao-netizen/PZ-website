// PZ Phase 3 published-product revisions — add-on for Staging Worker candidates.
// This module NEVER changes live products until a separately authorized publish.
// Migration 012 and PZ_PRODUCT_REVISIONS_ENABLED=true are mandatory.
export function pzPublishedProductRevisionsFetch(originalFetch,{
  authorize,json,validateSpecs,imageBase,expectedRuntime
}) {
  const fail=(error,status=400)=>json({error},status);
  const stamp=()=>new Date().toISOString();
  const productSql="SELECT id,name,name_cn,category,sub_category,material,size,finish,code,"+
    "description,description_cn,images,production_sites,specs_json,created_by,status,created_at,updated_at "+
    "FROM products WHERE id=? LIMIT 1";
  const summarySql="SELECT r.id,r.product_id,r.submitter_id,r.supervisor_id,r.department_id,"+
    "r.status,r.draft_revision,r.latest_version,r.approved_version,r.return_reason,r.created_at,r.updated_at,"+
    "p.name,p.name_cn,p.code,p.category FROM pz_published_product_revisions r "+
    "JOIN products p ON p.id=r.product_id";
  const rowSql="SELECT * FROM pz_published_product_revisions WHERE id=? LIMIT 1";
  const editable=['name','name_cn','category','sub_category','material','size','finish',
    'description','description_cn','images','production_sites','specifications'];
  const textFields=['name','name_cn','category','sub_category','material','size','finish',
    'description','description_cn'];
  const currentAssignment=(env,id)=>env.DB.prepare(
    "SELECT a.department_id,a.supervisor_id FROM pz_staff_assignments a "+
    "JOIN pz_departments d ON d.id=a.department_id AND d.is_active=1 "+
    "JOIN users s ON s.id=a.supervisor_id AND s.is_active=1 "+
    "JOIN pz_staff_assignments sa ON sa.user_id=s.id AND sa.job_type='supervisor' "+
    "AND sa.department_id=a.department_id "+
    "WHERE a.user_id=? AND a.job_type IN ('staff','secretary','data_entry') LIMIT 1"
  ).bind(id).first();
  const supervisorAssigned=(env,id,department)=>env.DB.prepare(
    "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d ON d.id=a.department_id "+
    "WHERE a.user_id=? AND a.department_id=? AND a.job_type='supervisor' AND d.is_active=1 LIMIT 1"
  ).bind(id,department).first();
  const parseArray=(raw,label)=>{
    const data=typeof raw==='string'?JSON.parse(raw||'[]'):raw;
    if(!Array.isArray(data))throw Error('Invalid saved '+label);
    return data;
  };
  const snapshot=product=>({
    id:product.id,code:product.code,created_by:product.created_by,created_at:product.created_at,
    name:product.name,name_cn:product.name_cn||'',category:product.category,
    sub_category:product.sub_category||'',material:product.material||'',size:product.size||'',
    finish:product.finish||'',description:product.description||'',description_cn:product.description_cn||'',
    images:parseArray(product.images,'images'),
    production_sites:parseArray(product.production_sites,'production sites'),
    specifications:typeof product.specs_json==='string'?JSON.parse(product.specs_json||'{}'):(product.specs_json||{})
  });
  const readJson=async request=>{
    if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
      return {error:'Expected application/json',status:415};
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>65536)return {error:'Revision payload too large',status:413};
    try{
      const body=JSON.parse(raw);
      if(!body||typeof body!=='object'||Array.isArray(body))return {error:'Invalid revision body',status:400};
      return {body};
    }catch{return {error:'Invalid JSON',status:400};}
  };
  const currentPublished=async(env,revision)=>env.DB.prepare(
    "SELECT id,updated_at,status FROM products WHERE id=? LIMIT 1"
  ).bind(revision.product_id).first();
  const sameBase=(p,r)=>p?.status==='published'&&p?.updated_at===r.base_updated_at;
  const approvedJson=async(env,revision)=>{
    const version=await env.DB.prepare(
      "SELECT snapshot_json FROM pz_published_revision_versions WHERE revision_id=? AND version=? LIMIT 1"
    ).bind(revision.id,revision.approved_version).first();
    return version ? JSON.parse(version.snapshot_json) : null;
  };
  async function validateDraft(raw,base,env) {
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Provide draft product fields');
    for(const key of Object.keys(raw)){
      if(!editable.includes(key))throw Error('Cannot revise protected or unknown field: '+key);
    }
    const draft={...base};
    for(const key of textFields){
      if(!Object.hasOwn(raw,key))continue;
      if(typeof raw[key]!=='string'||raw[key].length>4000)throw Error('Invalid '+key);
      draft[key]=raw[key];
    }
    if(!draft.name?.trim()||!draft.category?.trim())throw Error('Name and category are required');
    if(!/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(String(draft.code||'')))
      throw Error('Existing SKU is invalid; contact administrator');
    if(Object.hasOwn(raw,'images')){
      if(!Array.isArray(raw.images)||raw.images.length>40||
        raw.images.some(x=>typeof x!=='string'||!x.trim()||x.length>2048))
        throw Error('Invalid product images');
      draft.images=raw.images;
    }
    if(Object.hasOwn(raw,'production_sites')){
      const sites=raw.production_sites;
      if(!Array.isArray(sites)||sites.length>2||
        sites.some(x=>!['zhaoqing','cambodia'].includes(x))||
        new Set(sites).size!==sites.length)throw Error('Invalid production sites');
      draft.production_sites=sites;
    }
    if(Object.hasOwn(raw,'specifications')){
      const result=validateSpecs(raw.specifications);
      if(result.error)throw Error(result.error);
      draft.specifications=JSON.parse(result.json||'{}');
    }
    // Keep pre-existing legacy URLs, but any newly-added URL must be from
    // the current environment's R2 bucket (not an external host or other env).
    const legacy=new Set(base.images);
    const baseUrl=imageBase(env);
    for(const image of draft.images){
      if(legacy.has(image))continue;
      if(!baseUrl||!env.PRODUCT_IMAGES)throw Error('Image storage unavailable');
      let key;
      try{
        const uri=new URL(image);
        if(uri.origin!==baseUrl||uri.search||uri.hash||uri.username||uri.password)throw Error('origin');
        key=decodeURIComponent(uri.pathname.slice(1));
        if(!/^uploads\/[^/]+$/.test(key)||key.includes('..'))throw Error('key');
      }catch{throw Error('New image must use an upload in the current R2 environment');}
      if(!(await env.PRODUCT_IMAGES.head(key)))throw Error('New image not found in R2');
    }
    if(new TextEncoder().encode(JSON.stringify(draft)).length>65536)
      throw Error('Revision draft exceeds size limit');
    return draft;
  }
  async function renderDetail(env,revision){
    const [versions,events]=await Promise.all([
      env.DB.prepare("SELECT version,snapshot_json,submitted_by,created_at FROM pz_published_revision_versions "+
        "WHERE revision_id=? ORDER BY version ASC").bind(revision.id).all(),
      env.DB.prepare("SELECT id,action,actor_id,actor_role,review_version,note,created_at FROM pz_published_revision_events "+
        "WHERE revision_id=? ORDER BY created_at ASC,id ASC").bind(revision.id).all()
    ]);
    return {...revision,base_snapshot:JSON.parse(revision.base_snapshot_json),
      draft:JSON.parse(revision.draft_json),
      versions:(versions.results||[]).map(v=>({...v,snapshot:JSON.parse(v.snapshot_json)})),
      events:events.results||[],
      base_snapshot_json:undefined,draft_json:undefined
    };
  }
  async function transition(env,revision,target,actor,role,action,note=null) {
    const time=stamp();
    try {
      const results=await env.DB.batch([
        env.DB.prepare(
          "UPDATE pz_published_product_revisions SET status=?,return_reason=?,approved_version="+
          (target==='approved_pending_publish'?"latest_version":"approved_version")+
          ",updated_at=? WHERE id=? AND status=? AND latest_version=? "+
          "AND EXISTS(SELECT 1 FROM products WHERE id=? AND status='published' AND updated_at=?)"
        ).bind(target,note,time,revision.id,revision.status,revision.latest_version,
          revision.product_id,revision.base_updated_at),
        env.DB.prepare(
          "INSERT INTO pz_published_revision_events "+
          "(id,revision_id,action,actor_id,actor_role,review_version,note,created_at) "+
          "SELECT ?,id,?,?,?,?,?,? FROM pz_published_product_revisions "+
          "WHERE id=? AND status=? AND latest_version=?"
        ).bind(crypto.randomUUID(),action,actor,role,revision.latest_version,note,time,
          revision.id,target,revision.latest_version)
      ]);
      if(results.some(x=>Number(x.meta?.changes)!==1))
        return fail('Revision changed concurrently; refresh',409);
      return json({success:true,id:revision.id,status:target,version:revision.latest_version});
    }catch(err){
      if(/constraint|stale|unique/i.test(String(err)))return fail('Revision changed; refresh',409);
      throw err;
    }
  }
  return async function publishedRevisionsFetch(request,env,ctx) {
    const path=new URL(request.url).pathname;
    const method=request.method;
    const create=/^\/factory\/products\/([^/]+)\/revisions$/.exec(path);
    const collection=/^\/(factory|supervisor|admin)\/revisions$/.exec(path);
    const item=/^\/(factory|supervisor|admin)\/revisions\/([^/]+)(?:\/(submit|approve|return|request-correction|publish|cancel))?$/.exec(path);
    if(!create&&!collection&&!item)return originalFetch.call(this,request,env,ctx);
    if(!['staging','production'].includes(expectedRuntime) ||
      String(env.PZ_RUNTIME_ENV||'').toLowerCase()!==expectedRuntime)
      return fail('Revision route restricted to its configured runtime',403);
    if(env.PZ_PRODUCT_REVISIONS_ENABLED!=='true')return fail('Published revision workflow is not enabled',404);
    if(env.PZ_TWO_STAGE_REVIEW_ENABLED!=='true'||env.PZ_ORG_RBAC_ENABLED!=='true')
      return fail('Two-stage review and organization permissions must be enabled',503);
    if(!env.DB||!validateSpecs||!imageBase)return fail('Revision service unavailable',503);
    const scope=create?'factory':(collection?.[1]||item?.[1]);
    const auth=await authorize(request,env,scope==='admin'?['ADMIN']:scope==='supervisor'?['SUPERVISOR']:['FACTORY']);
    if(auth instanceof Response)return auth;
    const actor=auth.user.id;
    if(create){
      if(method!=='POST')return fail('Method not allowed',405);
      const id=decodeURIComponent(create[1]);
      const assignment=await currentAssignment(env,actor);
      if(!assignment)return fail('Active staff assignment required',403);
      const product=await env.DB.prepare(productSql).bind(id).first();
      if(!product||product.status!=='published')return fail('Published product not found',404);
      if(product.created_by!==actor)return fail('Only the product owner can request revisions',403);
      if(!product.updated_at)return fail('Published product missing version timestamp',409);
      const parsed=await readJson(request);
      if(parsed.error)return fail(parsed.error,parsed.status);
      let base,draft;
      try {
        base=snapshot(product);
        draft=await validateDraft(parsed.body.draft||{},base,env);
      }catch(e){return fail(String(e.message||e));}
      const now=stamp(),rid=crypto.randomUUID();
      try{
        await env.DB.prepare(
          "INSERT INTO pz_published_product_revisions"+
          "(id,product_id,submitter_id,supervisor_id,department_id,base_updated_at,"+
          "base_snapshot_json,draft_json,status,draft_revision,latest_version,created_at,updated_at) "+
          "SELECT ?,id,?,?,?,?,?,?, 'draft',1,0,?,? FROM products "+
          "WHERE id=? AND status='published' AND updated_at=?"
        ).bind(rid,actor,assignment.supervisor_id,assignment.department_id,product.updated_at,
          JSON.stringify(base),JSON.stringify(draft),now,now,id,product.updated_at).run();
        const exists=await env.DB.prepare(rowSql).bind(rid).first();
        if(!exists)return fail('Product changed while creating revision',409);
      }catch(e){
        if(/unique|constraint|foreign key/i.test(String(e)))return fail('Active revision exists or product changed; reload',409);
        throw e;
      }
      return json({success:true,id:rid,product_id:id,status:'draft',draft_revision:1},201);
    }
    if(collection){
      if(method!=='GET')return fail('Method not allowed',405);
      const where=scope==='factory'?" WHERE r.submitter_id=?":
        scope==='supervisor'?" WHERE r.supervisor_id=?":"";
      const binds=scope==='admin'?[]:[actor];
      const result=await env.DB.prepare(summarySql+where+" ORDER BY r.updated_at DESC LIMIT 300")
        .bind(...binds).all();
      return json({items:result.results||[]});
    }
    if(!item)return fail('Revision route not found',404);
    const id=decodeURIComponent(item[2]),action=item[3];
    const revision=await env.DB.prepare(rowSql).bind(id).first();
    if(!revision)return fail('Revision not found',404);
    if(scope==='factory'&&revision.submitter_id!==actor)return fail('Not your revision',403);
    if(scope==='supervisor'){
      if(revision.supervisor_id!==actor||
        !(await supervisorAssigned(env,actor,revision.department_id)))
        return fail('Supervisor assignment mismatch',403);
    }
    if(method==='GET'&&!action)return json(await renderDetail(env,revision));
    if(method==='PUT'&&scope==='factory'&&!action){
      if(!['draft','returned_to_uploader'].includes(revision.status))
        return fail('Submitted revisions are read-only',409);
      if(!sameBase(await currentPublished(env,revision),revision))
        return fail('Published product changed; revision is stale',409);
      const parsed=await readJson(request);
      if(parsed.error)return fail(parsed.error,parsed.status);
      if(!Number.isSafeInteger(parsed.body.expected_draft_revision)||
        parsed.body.expected_draft_revision!==revision.draft_revision)
        return fail('Draft revision conflict; reload',409);
      let draft;
      try {
        draft=await validateDraft(parsed.body.draft,JSON.parse(revision.base_snapshot_json),env);
      }catch(e){return fail(String(e.message||e));}
      const result=await env.DB.prepare(
        "UPDATE pz_published_product_revisions SET draft_json=?,draft_revision=draft_revision+1,updated_at=? "+
        "WHERE id=? AND submitter_id=? AND draft_revision=? AND status IN ('draft','returned_to_uploader') "+
        "AND EXISTS(SELECT 1 FROM products WHERE id=product_id AND status='published' AND updated_at=base_updated_at)"
      ).bind(JSON.stringify(draft),stamp(),id,actor,revision.draft_revision).run();
      if(Number(result.meta?.changes)!==1)return fail('Draft changed concurrently; reload',409);
      return json({success:true,id,status:revision.status,draft_revision:revision.draft_revision+1});
    }
    if(method!=='POST'||!action)return fail('Method not allowed',405);
    const bodyResult=await readJson(request);
    if(bodyResult.error)return fail(bodyResult.error,bodyResult.status);
    const note=typeof bodyResult.body.note==='string'?bodyResult.body.note.trim():'';
    if(['return','request-correction'].includes(action)&&(note.length<5||note.length>2000))
      return fail('Return reason must be 5–2000 characters',400);
    if(!sameBase(await currentPublished(env,revision),revision)&&action!=='publish')
      return fail('Published product changed; revision is stale',409);
    if(scope==='factory'){
      if(action==='cancel'&&['draft','returned_to_uploader'].includes(revision.status))
        return transition(env,revision,'canceled',actor,'FACTORY','canceled');
      if(action!=='submit'||!['draft','returned_to_uploader'].includes(revision.status))
        return fail('Factory action not allowed in this state',409);
      const assignment=await currentAssignment(env,actor);
      if(!assignment||assignment.supervisor_id!==revision.supervisor_id||
        assignment.department_id!==revision.department_id)
        return fail('Supervisor assignment changed; contact administrator',409);
      const draft=JSON.parse(revision.draft_json);
      if(!Array.isArray(draft.images)||!draft.images.length)
        return fail('At least one image required before review',400);
      const n=revision.latest_version+1,time=stamp();
      try{
        const results=await env.DB.batch([
          env.DB.prepare(
            "UPDATE pz_published_product_revisions SET status='pending_supervisor',latest_version=?,approved_version=NULL,"+
            "return_reason=NULL,updated_at=? WHERE id=? AND submitter_id=? AND status IN ('draft','returned_to_uploader') "+
            "AND latest_version=? AND draft_revision=? AND EXISTS"+
            "(SELECT 1 FROM products WHERE id=product_id AND status='published' AND updated_at=base_updated_at)"
          ).bind(n,time,id,actor,revision.latest_version,revision.draft_revision),
          env.DB.prepare(
            "INSERT INTO pz_published_revision_versions(revision_id,version,snapshot_json,submitted_by,created_at) "+
            "SELECT id,?,draft_json,?,? FROM pz_published_product_revisions "+
            "WHERE id=? AND status='pending_supervisor' AND latest_version=?"
          ).bind(n,actor,time,id,n),
          env.DB.prepare(
            "INSERT INTO pz_published_revision_events(id,revision_id,action,actor_id,actor_role,review_version,note,created_at) "+
            "SELECT ?,id,'submitted',?,'FACTORY',?,NULL,? FROM pz_published_product_revisions "+
            "WHERE id=? AND status='pending_supervisor' AND latest_version=?"
          ).bind(crypto.randomUUID(),actor,n,time,id,n)
        ]);
        if(results.some(x=>Number(x.meta?.changes)!==1))
          return fail('Concurrent revision update; reload',409);
      }catch(err){
        if(/constraint|stale|unique/i.test(String(err)))return fail('Review version conflict; reload',409);
        throw err;
      }
      return json({success:true,id,status:'pending_supervisor',version:n});
    }
    if(scope==='supervisor'){
      if(action==='approve'&&revision.status==='pending_supervisor')
        return transition(env,revision,'pending_admin',actor,'SUPERVISOR','supervisor_approved');
      if(action==='return'&&revision.status==='pending_supervisor')
        return transition(env,revision,'returned_to_uploader',actor,'SUPERVISOR','supervisor_returned',note);
      if(action==='request-correction'&&revision.status==='returned_to_supervisor')
        return transition(env,revision,'returned_to_uploader',actor,'SUPERVISOR','correction_assigned',note);
      return fail('Supervisor action not allowed in this state',409);
    }
    if(actor===revision.submitter_id||actor===revision.supervisor_id)
      return fail('Self-approval prohibited',403);
    if(action==='approve'&&revision.status==='pending_admin')
      return transition(env,revision,'approved_pending_publish',actor,'ADMIN','admin_approved');
    if(action==='return'&&revision.status==='pending_admin')
      return transition(env,revision,'returned_to_supervisor',actor,'ADMIN','admin_returned',note);
    if(action!=='publish')return fail('Admin action not allowed in this state',409);
    if(revision.status==='published'){
      // Retry only the public KV catalog refresh after a previous partial failure.
      const republish=new Request(new URL('/admin/publish/products',request.url),{
        method:'POST',headers:{Authorization:request.headers.get('Authorization')||''}
      });
      const result=await originalFetch.call(this,republish,env,ctx);
      return result.ok?json({success:true,id,status:'published',catalog_published:true}):
        fail('Catalog refresh failed; retry admin publish',503);
    }
    if(revision.status!=='approved_pending_publish'||
      revision.approved_version!==revision.latest_version)
      return fail('Revision not approved for publication',409);
    if(!sameBase(await currentPublished(env,revision),revision))
      return fail('Published product changed; rebase revision required',409);
    const approved=await approvedJson(env,revision);
    if(!approved||approved.id!==revision.product_id)
      return fail('Approved snapshot missing or invalid',409);
    const time=stamp();
    try{
      const results=await env.DB.batch([
        env.DB.prepare(
          "UPDATE pz_published_product_revisions SET status='published',updated_at=? "+
          "WHERE id=? AND status='approved_pending_publish' AND approved_version=latest_version "+
          "AND EXISTS(SELECT 1 FROM products WHERE id=product_id AND status='published' AND updated_at=base_updated_at)"
        ).bind(time,id),
        env.DB.prepare(
          "UPDATE products SET name=?,name_cn=?,category=?,sub_category=?,material=?,size=?,finish=?,"+
          "description=?,description_cn=?,images=?,production_sites=?,specs_json=?,updated_at=? "+
          "WHERE id=? AND status='published' AND updated_at=? AND EXISTS"+
          "(SELECT 1 FROM pz_published_product_revisions WHERE id=? AND status='published')"
        ).bind(approved.name,approved.name_cn,approved.category,approved.sub_category,
          approved.material,approved.size,approved.finish,approved.description,approved.description_cn,
          JSON.stringify(approved.images),JSON.stringify(approved.production_sites),
          JSON.stringify(approved.specifications||{}),time,revision.product_id,revision.base_updated_at,id),
        env.DB.prepare(
          "INSERT INTO pz_published_revision_events(id,revision_id,action,actor_id,actor_role,review_version,note,created_at) "+
          "SELECT ?,id,'published',?,'ADMIN',?,NULL,? FROM pz_published_product_revisions "+
          "WHERE id=? AND status='published' AND latest_version=?"
        ).bind(crypto.randomUUID(),actor,revision.latest_version,time,id,revision.latest_version)
      ]);
      if(results.some(x=>Number(x.meta?.changes)!==1))
        return fail('Product changed during publication; inspect before retry',409);
    }catch(err){
      if(/constraint|stale|unique/i.test(String(err)))return fail('Concurrent publication; inspect state',409);
      throw err;
    }
    const republish=new Request(new URL('/admin/publish/products',request.url),{
      method:'POST',headers:{Authorization:request.headers.get('Authorization')||''}
    });
    const published=await originalFetch.call(this,republish,env,ctx);
    if(!published.ok)return fail('D1 revision published but catalog refresh failed; retry publish to resync',503);
    return json({success:true,id,status:'published',catalog_published:true});
  };
}
