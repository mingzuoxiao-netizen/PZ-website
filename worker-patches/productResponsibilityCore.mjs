// PZ Phase 4 — admin delegates published-product maintenance without
// altering products.created_by, historical approval records or live products.
// Requires migration 013 and PZ_PRODUCT_RESPONSIBILITY_ENABLED=true.
export function pzProductResponsibilityFetch(originalFetch,{authorize,json,expectedRuntime}){
  const fail=(error,status=400)=>json({error},status);
  const activeRevision="r.status NOT IN ('published','canceled')";
  const listSql="SELECT a.product_id,a.responsible_user_id,a.department_id,a.supervisor_id,"+
    "a.assigned_by,a.version,a.assigned_at,a.updated_at,u.username AS responsible_username,"+
    "p.created_by,p.code,p.name,p.status FROM pz_product_responsibilities a "+
    "JOIN products p ON p.id=a.product_id JOIN users u ON u.id=a.responsible_user_id "+
    "ORDER BY a.updated_at DESC LIMIT 1000";
  return async function productResponsibilityFetch(request,env,ctx){
    const path=new URL(request.url).pathname,method=request.method;
    const collection=path==='/admin/product-responsibilities';
    const events=path.match(/^\/admin\/product-responsibilities\/([^/]+)\/events$/);
    const item=path.match(/^\/admin\/product-responsibilities\/([^/]+)$/);
    if(!collection&&!events&&!item)return originalFetch.call(this,request,env,ctx);
    if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!==expectedRuntime)
      return fail('Product responsibility route restricted to its configured runtime',403);
    if(env.PZ_PRODUCT_RESPONSIBILITY_ENABLED!=='true')return fail('Product responsibility feature not enabled',404);
    if(env.PZ_ORG_RBAC_ENABLED!=='true'||env.PZ_TWO_STAGE_REVIEW_ENABLED!=='true'||
       env.PZ_PRODUCT_REVISIONS_ENABLED!=='true')return fail('Org and review workflow must be enabled',503);
    if(!env.DB)return fail('D1 is unavailable',503);
    const auth=await authorize(request,env,['ADMIN']);
    if(auth instanceof Response)return auth;
    const actor=auth.user.id;
    if(collection){
      if(method!=='GET')return fail('Method not allowed',405);
      const rows=await env.DB.prepare(listSql).all();
      return json({items:rows.results||[]});
    }
    if(events){
      if(method!=='GET')return fail('Method not allowed',405);
      const id=decodeURIComponent(events[1]);
      const rows=await env.DB.prepare(
        "SELECT e.id,e.product_id,e.old_user_id,e.new_user_id,e.department_id,"+
        "e.supervisor_id,e.actor_id,e.version,e.created_at "+
        "FROM pz_product_responsibility_events e WHERE e.product_id=? "+
        "ORDER BY e.version DESC LIMIT 100"
      ).bind(id).all();
      return json({items:rows.results||[]});
    }
    if(method!=='PUT')return fail('Method not allowed',405);
    const productId=decodeURIComponent(item[1]);
    if(!productId||productId.length>128)return fail('Invalid product ID',400);
    if(!(request.headers.get('content-type')||'').toLowerCase().includes('application/json'))
      return fail('Expected application/json',415);
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>2048)return fail('Request too large',413);
    let payload;
    try{payload=JSON.parse(raw);}catch{return fail('Invalid JSON');}
    if(!payload||typeof payload!=='object'||Array.isArray(payload)||
       Object.keys(payload).some(k=>!['responsible_user_id','expected_version'].includes(k)))
      return fail('Invalid assignment fields');
    const userId=payload.responsible_user_id, expected=payload.expected_version;
    if(typeof userId!=='string'||!userId.trim()||userId.length>128||
       !Number.isSafeInteger(expected)||expected<0)return fail('Invalid assignee/version');

    // INSERT..ON CONFLICT is one atomic CAS. Both paths recheck eligibility,
    // active published status and absence of any in-flight revision in SQL.
    // Migration 013 database triggers write immutable assignment history.
    const now=new Date().toISOString();
    const query="INSERT INTO pz_product_responsibilities "+
      "(product_id,responsible_user_id,department_id,supervisor_id,assigned_by,version,assigned_at,updated_at) "+
      "SELECT p.id,a.user_id,a.department_id,a.supervisor_id,?,1,?,? FROM products p "+
      "JOIN users u ON u.id=? AND u.is_active=1 AND lower(u.role)='factory' "+
      "JOIN pz_staff_assignments a ON a.user_id=u.id AND a.job_type IN ('staff','secretary','data_entry') "+
      "JOIN pz_departments d ON d.id=a.department_id AND d.is_active=1 "+
      "JOIN users boss ON boss.id=a.supervisor_id AND boss.is_active=1 "+
      "JOIN pz_staff_assignments sa ON sa.user_id=boss.id AND sa.job_type='supervisor' "+
      "AND sa.department_id=a.department_id "+
      "WHERE p.id=? AND lower(p.status)='published' "+
      "AND NOT EXISTS(SELECT 1 FROM pz_published_product_revisions r "+
      "WHERE r.product_id=p.id AND "+activeRevision+") "+
      "ON CONFLICT(product_id) DO UPDATE SET "+
      "responsible_user_id=excluded.responsible_user_id,"+
      "department_id=excluded.department_id,supervisor_id=excluded.supervisor_id,"+
      "assigned_by=excluded.assigned_by,updated_at=excluded.updated_at,"+
      "version=pz_product_responsibilities.version+1 "+
      "WHERE pz_product_responsibilities.version=? "+
      "AND EXISTS(SELECT 1 FROM products p WHERE p.id=pz_product_responsibilities.product_id "+
      "AND lower(p.status)='published' AND NOT EXISTS("+
      "SELECT 1 FROM pz_published_product_revisions r WHERE r.product_id=p.id AND "+activeRevision+"))";
    try{
      const result=await env.DB.prepare(query).bind(actor,now,now,userId.trim(),productId,expected).run();
      if(Number(result.meta?.changes)!==1)
        return fail('Product unavailable, active revision, invalid staff assignment or stale version; refresh',409);
    }catch(error){
      if(/constraint|foreign key|unique|immutable/i.test(String(error)))
        return fail('Product responsibility conflict; refresh',409);
      throw error;
    }
    const row=await env.DB.prepare(
      "SELECT product_id,responsible_user_id,department_id,supervisor_id,version,updated_at "+
      "FROM pz_product_responsibilities WHERE product_id=?"
    ).bind(productId).first();
    return json({success:true,...row});
  };
}
