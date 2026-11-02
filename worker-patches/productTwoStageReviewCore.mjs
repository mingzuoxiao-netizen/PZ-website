// Phase 2 REVIEW-only Worker module. Requires Staging D1 migration 010.
// This workflow handles NEW products; published-product revisions use a later
// separate draft implementation, never direct edits to live product rows.
export function pzTwoStageReviewFetch(originalFetch,{authorize,json}) {
  const fail=(error,status=400)=>json({error},status);
  const now=()=>new Date().toISOString();
  const readBody=async request=>{
    try {const x=await request.json();return x&&typeof x==='object'&&!Array.isArray(x)?x:null;}
    catch{return null;}
  };
  const join="SELECT r.*,p.name,p.name_cn,p.code,p.category,p.images FROM pz_product_reviews r "+
    "JOIN products p ON p.id=r.product_id";
  const productSql="SELECT id,name,name_cn,category,sub_category,material,size,finish,code,"+
    "description,description_cn,images,production_sites,created_by,status,created_at,updated_at "+
    "FROM products WHERE id=? LIMIT 1";
  const staff=async(env,id)=>env.DB.prepare(
    "SELECT a.department_id,a.supervisor_id FROM pz_staff_assignments a "+
    "JOIN pz_departments d ON d.id=a.department_id "+
    "JOIN users s ON s.id=a.supervisor_id AND s.is_active=1 "+
    "JOIN pz_staff_assignments sa ON sa.user_id=s.id "+
    "WHERE a.user_id=? AND a.job_type IN ('secretary','staff','data_entry') "+
    "AND d.is_active=1 AND sa.job_type='supervisor' "+
    "AND sa.department_id=a.department_id LIMIT 1"
  ).bind(id).first();
  const snapshot=product=>{
    const {id,name,name_cn,category,sub_category,material,size,finish,code,
      description,description_cn,images,production_sites,created_by,created_at}=product;
    return JSON.stringify({id,name,name_cn,category,sub_category,material,size,finish,
      code,description,description_cn,images:typeof images==='string'?JSON.parse(images||'[]'):images,
      production_sites:typeof production_sites==='string'?JSON.parse(production_sites||'[]'):production_sites,
      created_by,created_at});
  };
  const hydrate=async(env,review)=>{
    const [vs,es]=await Promise.all([
      env.DB.prepare("SELECT version,snapshot_json,submitted_by,created_at FROM pz_product_review_versions WHERE review_id=? ORDER BY version").bind(review.id).all(),
      env.DB.prepare("SELECT id,action,actor_id,actor_role,review_version,note,created_at FROM pz_product_review_events WHERE review_id=? ORDER BY created_at,id").bind(review.id).all()
    ]);
    return { ...review,
      versions:(vs.results||[]).map(v=>({version:v.version,snapshot:JSON.parse(v.snapshot_json),submitted_by:v.submitted_by,created_at:v.created_at})),
      events:es.results||[]
    };
  };
  async function transition(env,review,target,role,actor,action,note=null){
    const stamp=now();
    const writes=[
      env.DB.prepare("UPDATE pz_product_reviews SET status=?,return_reason=?,approved_version="+
        (target==='approved_pending_publish'?"latest_version":"approved_version")+
        ",updated_at=? WHERE id=? AND status=? AND latest_version=?")
        .bind(target,note,stamp,review.id,review.status,review.latest_version),
      env.DB.prepare("UPDATE products SET status=?,updated_at=? WHERE id=? AND lower(status)=? "+
        "AND EXISTS (SELECT 1 FROM pz_product_reviews WHERE id=? AND status=? AND latest_version=?)")
        .bind(target,stamp,review.product_id,String(review.status).toLowerCase(),review.id,target,review.latest_version),
      env.DB.prepare("INSERT INTO pz_product_review_events"+
        "(id,review_id,action,actor_id,actor_role,review_version,note,created_at) "+
        "SELECT ?,id,?,?,?,?,?,? FROM pz_product_reviews WHERE id=? AND status=? AND latest_version=?")
        .bind(crypto.randomUUID(),action,actor,role,review.latest_version,note,stamp,review.id,target,review.latest_version)
    ];
    const outcome=await env.DB.batch(writes);
    if(outcome.some(x=>Number(x.meta?.changes)!==1))
      return fail('Review changed concurrently; refresh before retry',409);
    return json({success:true,id:review.id,product_id:review.product_id,status:target,version:review.latest_version});
  }
  return async function reviewFetch(request,env,ctx){
    const path=new URL(request.url).pathname,method=request.method;
    if(env.PZ_TWO_STAGE_REVIEW_ENABLED!=='true')return originalFetch.call(this,request,env,ctx);
    if(env.PZ_ORG_RBAC_ENABLED!=='true')return fail('Organization management must be enabled first',503);
    // Existing direct admin mutations can bypass the new approval state machine.
    if((/^\/admin\/products(?:\/[^/]+)?$/.test(path)&&['POST','PUT','DELETE'].includes(method)) ||
      (/^\/(?:admin|factory)\/products\/[^/]+\/remove-image$/.test(path)&&method==='POST'))
      return fail('Legacy direct admin product writes disabled during two-stage review',409);

    const submit=path.match(/^\/factory\/products\/([^/]+)\/submit$/);
    if(submit&&method==='POST'){
      const auth=await authorize(request,env,['FACTORY']);
      if(auth instanceof Response)return auth;
      const actor=auth.user.id,id=decodeURIComponent(submit[1]);
      const assignment=await staff(env,actor);
      if(!assignment)return fail('Active supervisor assignment required',403);
      const product=await env.DB.prepare(productSql).bind(id).first();
      if(!product||product.created_by!==actor)return fail('Not your product',403);
      if(!['draft','rejected','returned_to_uploader'].includes(String(product.status).toLowerCase()))
        return fail('Product is not ready for submission',409);
      if(!String(product.name||'').trim()||!String(product.category||'').trim()||
        !/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(String(product.code||'').trim().toUpperCase()))
        return fail('Name, category and valid SKU are required');
      let copy;
      try{copy=snapshot(product);}catch{return fail('Invalid product image or site JSON');}
      const previous=await env.DB.prepare("SELECT * FROM pz_product_reviews WHERE product_id=?").bind(id).first();
      if(previous&&previous.status!=='returned_to_uploader')return fail('Review cannot be resubmitted in this state',409);
      if(previous&&(previous.submitter_id!==actor||previous.supervisor_id!==assignment.supervisor_id||
        previous.department_id!==assignment.department_id))
        return fail('Review ownership changed: contact administrator',409);
      const stamp=now(),rid=previous?.id||crypto.randomUUID(),version=previous?previous.latest_version+1:1;
      const writes=[];
      if(previous)writes.push(env.DB.prepare(
        "UPDATE pz_product_reviews SET status='pending_supervisor',latest_version=?,return_reason=NULL,approved_version=NULL,updated_at=? "+
        "WHERE id=? AND status='returned_to_uploader' AND latest_version=?"
      ).bind(version,stamp,rid,previous.latest_version));
      else writes.push(env.DB.prepare(
        "INSERT INTO pz_product_reviews(id,product_id,submitter_id,supervisor_id,department_id,status,latest_version,created_at,updated_at) "+
        "SELECT ?,p.id,?,?,?,'pending_supervisor',1,?,? FROM products p "+
        "WHERE p.id=? AND p.created_by=? AND lower(p.status) IN ('draft','rejected')"
      ).bind(rid,actor,assignment.supervisor_id,assignment.department_id,stamp,stamp,id,actor));
      writes.push(env.DB.prepare(
        "UPDATE products SET status='pending_supervisor',updated_at=? WHERE id=? AND created_by=? "+
        "AND lower(status) IN ('draft','rejected','returned_to_uploader') "+
        "AND EXISTS (SELECT 1 FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?)"
      ).bind(stamp,id,actor,rid,version));
      writes.push(env.DB.prepare(
        "INSERT INTO pz_product_review_versions(review_id,version,snapshot_json,submitted_by,created_at) "+
        "SELECT ?,?,?,?,? FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?"
      ).bind(rid,version,copy,actor,stamp,rid,version));
      writes.push(env.DB.prepare(
        "INSERT INTO pz_product_review_events(id,review_id,action,actor_id,actor_role,review_version,note,created_at) "+
        "SELECT ?,?,?,?,?,?,NULL,? FROM pz_product_reviews WHERE id=? AND status='pending_supervisor' AND latest_version=?"
      ).bind(crypto.randomUUID(),rid,'submitted',actor,'FACTORY',version,stamp,rid,version));
      try {
        const outcome=await env.DB.batch(writes);
        if(outcome.some(x=>Number(x.meta?.changes)!==1))return fail('Concurrent product change; check record',409);
      }catch(err){
        if(/UNIQUE|CONSTRAINT|FOREIGN KEY/i.test(String(err)))return fail('Review version conflict; reload',409);
        throw err;
      }
      return json({success:true,id:rid,product_id:id,status:'pending_supervisor',version});
    }
    const supervisor=path==='/supervisor/reviews'||path.startsWith('/supervisor/reviews/');
    const admin=path==='/admin/reviews'||path.startsWith('/admin/reviews/');
    const factoryDetail=/^\/factory\/reviews\/[^/]+$/.test(path)&&method==='GET';
    if(!supervisor&&!admin&&!factoryDetail)return originalFetch.call(this,request,env,ctx);
    const auth=await authorize(request,env,admin?['ADMIN']:supervisor?['SUPERVISOR']:['FACTORY']);
    if(auth instanceof Response)return auth;
    const actor=auth.user.id;
    if((path==='/admin/reviews'||path==='/supervisor/reviews')&&method==='GET'){
      const items=await env.DB.prepare(join+(supervisor?" WHERE r.supervisor_id=?":"")+
        " ORDER BY r.updated_at DESC LIMIT 300").bind(...(supervisor?[actor]:[])).all();
      return json({items:items.results||[]});
    }
    const match=path.match(/^\/(?:admin|supervisor|factory)\/reviews\/([^/]+)(?:\/(approve|return|request-correction|publish))?$/);
    if(!match)return fail('Review endpoint not found',404);
    const id=decodeURIComponent(match[1]),action=match[2];
    const review=await env.DB.prepare(join+" WHERE r.id=? LIMIT 1").bind(id).first();
    if(!review)return fail('Review not found',404);
    if(supervisor){
      if(review.supervisor_id!==actor)return fail('Cannot review another supervisor department',403);
      const assignment=await env.DB.prepare(
        "SELECT user_id FROM pz_staff_assignments WHERE user_id=? AND job_type='supervisor' AND department_id=?"
      ).bind(actor,review.department_id).first();
      if(!assignment)return fail('Supervisor reassigned to another department',403);
    }
    if(factoryDetail&&review.submitter_id!==actor)return fail('Not your review',403);
    if(method==='GET'&&!action)return json(await hydrate(env,review));
    if(method!=='POST'||!action)return fail('Method not allowed',405);
    if(factoryDetail)return fail('Uploader cannot approve',403);
    const body=await readBody(request);
    const note=typeof body?.note==='string'?body.note.trim():'';
    if(['return','request-correction'].includes(action)&&(note.length<5||note.length>2000))
      return fail('Return reason must be 5–2000 characters');
    if(supervisor){
      if(action==='approve'&&review.status==='pending_supervisor')
        return transition(env,review,'pending_admin','SUPERVISOR',actor,'supervisor_approved');
      if(action==='return'&&review.status==='pending_supervisor')
        return transition(env,review,'returned_to_uploader','SUPERVISOR',actor,'supervisor_returned',note);
      if(action==='request-correction'&&review.status==='returned_to_supervisor')
        return transition(env,review,'returned_to_uploader','SUPERVISOR',actor,'correction_assigned',note);
      return fail('Supervisor action not allowed in this state',409);
    }
    if(actor===review.submitter_id||actor===review.supervisor_id)return fail('Self-approval prohibited',403);
    if(action==='approve'&&review.status==='pending_admin')
      return transition(env,review,'approved_pending_publish','ADMIN',actor,'admin_approved');
    if(action==='return'&&review.status==='pending_admin')
      return transition(env,review,'returned_to_supervisor','ADMIN',actor,'admin_returned',note);
    if(action==='publish'&&review.status==='approved_pending_publish'){
      const result=await transition(env,review,'published','ADMIN',actor,'published');
      if(result.status!==200)return result;
      // Republish catalog KV with existing, authenticated admin endpoint.
      const next=new Request(new URL('/admin/publish/products',request.url),{
        method:'POST',headers:{Authorization:request.headers.get('Authorization')||''}
      });
      const published=await originalFetch.call(this,next,env,ctx);
      if(!published.ok)return json({error:'D1 published, catalog snapshot failed: retry admin publish products',review_id:id},503);
      return json({success:true,id,status:'published',catalog_published:true});
    }
    return fail('Admin action not allowed in this state',409);
  };
}
