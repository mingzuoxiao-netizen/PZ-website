// Opt-in, read-only list contract. Install the Worker before enabling its clients.
// Legacy routes and every mutation continue through the original state machines.
export function pzBackofficeListsFetch(originalFetch, {authorize, json, expectedRuntime}) {
  const fail=(error,status=400)=>json({error,code:'BACKOFFICE_LIST_ERROR'},status);
  const activeStatuses=scope=>scope==='admin'
    ? ['pending_admin','approved_pending_publish']
    : scope==='supervisor' ? ['pending_supervisor','returned_to_supervisor']
    : ['draft','returned_to_uploader','pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish'];
  const integer=(params,key,fallback,max)=>{
    const raw=params.get(key);
    const value=raw===null?fallback:Number(raw);
    if(!Number.isSafeInteger(value)||value<1||value>max)throw Error('Invalid '+key);
    return value;
  };
  return async function(request,env,ctx) {
    const url=new URL(request.url),params=url.searchParams;
    const match=url.pathname.match(/^\/(admin|supervisor|factory)\/(reviews|revisions|products|release-queue)$/);
    if(request.method!=='GET'||params.get('list_version')!=='1'||!match||
       (match[2]==='products'&&match[1]!=='factory')||
       (match[2]==='release-queue'&&match[1]==='factory')||
       (match[2]==='reviews'&&match[1]==='factory'))
      return originalFetch.call(this,request,env,ctx);
    if(!['staging','production'].includes(expectedRuntime)||env.PZ_RUNTIME_ENV!==expectedRuntime)
      return fail('List service restricted to its configured runtime',403);
    const [,scope,kind]=match;
    const roles=scope==='admin'?['ADMIN']:scope==='supervisor'?['SUPERVISOR']:
      kind==='products'?['FACTORY','ADMIN']:['FACTORY'];
    const auth=await authorize(request,env,roles);
    if(auth instanceof Response)return auth;
    if(!env.DB)return fail('List service unavailable',503);
    if(env.PZ_ORG_RBAC_ENABLED!=='true')return fail('Organization permissions must be enabled',503);
    if(kind!=='products'&&env.PZ_TWO_STAGE_REVIEW_ENABLED!=='true')
      return fail('Two-stage review is not enabled',503);
    if(['revisions','release-queue'].includes(kind)&&env.PZ_PRODUCT_REVISIONS_ENABLED!=='true')
      return fail('Published revision workflow is not enabled',404);
    const actor=auth.user.id;
    // Do not let reassigned or inactive team members browse historical scope.
    let department;
    if(scope!=='admin'&&auth.user.role!=='ADMIN'){
      const member=await env.DB.prepare(
        "SELECT a.user_id,a.department_id FROM pz_staff_assignments a "+
        "JOIN pz_departments d ON d.id=a.department_id AND d.is_active=1 "+
        "WHERE a.user_id=? AND a.job_type IN ("+
        (scope==='supervisor'?"'supervisor'":"'staff','secretary','data_entry'")+") LIMIT 1"
      ).bind(actor).first();
      if(!member)return fail('Active team assignment required',403);
      department=member.department_id;
    }
    let page,pageSize,q;
    try{
      page=integer(params,'page',1,100000);
      pageSize=integer(params,'page_size',50,100);
      q=(params.get('q')||'').trim();
      if(q.length>120)throw Error('Search is too long');
      for(const key of ['status','category','department','supervisor','submitter','site','kind'])
        if((params.get(key)||'').length>120)throw Error('Filter is too long');
    }catch(error){return fail(error.message);}
    const product=kind==='products';
    const table=kind==='reviews'?'pz_product_reviews':'pz_published_product_revisions';
    const release=kind==='release-queue';
    const common='id,product_id,submitter_id,supervisor_id,department_id,status,latest_version,approved_version,return_reason,created_at,updated_at';
    const releaseTable="(SELECT 'product' AS kind,"+common+",NULL AS draft_revision,NULL AS draft_json FROM pz_product_reviews "+
      "UNION ALL SELECT 'revision' AS kind,"+common+",draft_revision,draft_json FROM pz_published_product_revisions)";
    const from=product?' FROM products p':
      ' FROM '+(release?releaseTable:table)+' r JOIN products p ON p.id=r.product_id';
    const base=['p.deleted_at IS NULL'];
    const bindings=[];
    if(product){
      if(auth.user.role!=='ADMIN'){base.push('p.created_by=?');bindings.push(actor);}
    }else if(scope==='supervisor'){
      base.push('r.supervisor_id=?','r.department_id=?');bindings.push(actor,department);
    }else if(scope==='factory'){
      base.push('r.submitter_id=?');bindings.push(actor);
    }
    const scopeWhere=' WHERE '+base.join(' AND ');
    const scopeBindings=[...bindings];
    const statusColumn=product?'p.status':'r.status';
    const status=params.get('status')||(product?'all':'action');
    if(product){
      const allowed=['all','action','waiting','draft','rejected','returned_to_uploader','awaiting_review',
        'pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish','published','unpublished','inactive','archived'];
      if(!allowed.includes(status))return fail('Invalid status');
      if(status==='action')base.push("p.status IN ('draft','rejected','returned_to_uploader')");
      else if(status==='waiting')base.push("p.status IN ('awaiting_review','pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish')");
      else if(status!=='all'){base.push('p.status=?');bindings.push(status);}
    }else{
      const actionable=activeStatuses(scope);
      const allowed=scope==='supervisor'? [...actionable,'returned_to_uploader','pending_admin','approved_pending_publish']:actionable;
      // Even explicit filters cannot turn an operational queue into an audit export.
      if(status==='action'){
        base.push(statusColumn+' IN ('+actionable.map(()=>'?').join(',')+')');bindings.push(...actionable);
      }else if(allowed.includes(status)){base.push(statusColumn+'=?');bindings.push(status);}
      else return fail('Invalid work queue status');
    }
    if(q){
      base.push("(instr(lower(coalesce(p.code,'')),lower(?))>0 OR "+
        "instr(lower(coalesce(p.name,'')),lower(?))>0 OR instr(lower(coalesce(p.name_cn,'')),lower(?))>0)");
      bindings.push(q,q,q);
    }
    if(params.get('category')){base.push('p.category=?');bindings.push(params.get('category'));}
    if(params.has('categories')){
      let values;
      if(params.get('categories').length>10000)return fail('Invalid categories');
      try{values=JSON.parse(params.get('categories'));}catch{return fail('Invalid categories');}
      if(params.get('category')||!Array.isArray(values)||values.length>50||
         values.some(value=>typeof value!=='string'||value.length>120))return fail('Invalid categories');
      if(!values.length)base.push('0=1');
      else{base.push("coalesce(p.category,'') IN ("+values.map(()=>'?').join(',')+')');bindings.push(...values);}
    }
    if(params.get('kind')){
      if(!release||!['product','revision'].includes(params.get('kind')))return fail('Invalid kind');
      base.push('r.kind=?');bindings.push(params.get('kind'));
    }
    if(!product){
      for(const [key,col] of [['department','department_id'],['supervisor','supervisor_id'],['submitter','submitter_id']]){
        if(params.get(key)){base.push('r.'+col+'=?');bindings.push(params.get(key));}
      }
    }
    if(product&&params.get('site')){
      const site=params.get('site');
      if(!['zhaoqing','cambodia','unassigned'].includes(site))return fail('Invalid site');
      const array="CASE WHEN json_valid(p.production_sites) THEN p.production_sites ELSE '[]' END";
      if(site==='unassigned')base.push('NOT EXISTS (SELECT 1 FROM json_each('+array+'))');
      else {base.push('EXISTS (SELECT 1 FROM json_each('+array+') WHERE value=?)');bindings.push(site);}
    }
    const where=' WHERE '+base.join(' AND ');
    if(product&&['department','supervisor','submitter'].some(key=>params.get(key)))
      return fail('Unsupported product filter');
    if(!product&&params.get('site'))return fail('Unsupported review filter');
    const productSeries="CASE WHEN json_valid(p.specs_json) THEN json_extract(p.specs_json,'$.series_id') END";
    const productDimensions="CASE WHEN json_valid(p.specs_json) THEN json_extract(p.specs_json,'$.dimensions_cm') END";
    const draftField=key=>"CASE WHEN r.kind='revision' AND json_valid(r.draft_json) THEN json_extract(r.draft_json,'$."+key+"') END";
    const columns=product?'p.id,p.name,p.name_cn,p.category,p.sub_category,p.material,p.size,p.finish,p.code,'+
      'p.description,p.description_cn,p.images,p.production_sites,p.specs_json,p.created_by,p.status,p.created_at,p.updated_at'+
      (env.PZ_TWO_STAGE_REVIEW_ENABLED==='true'?",(SELECT return_reason FROM pz_product_reviews WHERE product_id=p.id AND submitter_id=p.created_by ORDER BY updated_at DESC,id DESC LIMIT 1) AS return_reason":''):
      release?'r.kind,'+common.split(',').map(key=>'r.'+key).join(',')+',r.draft_revision,'+
        ['name','name_cn','category','sub_category','images','material','size','finish'].map(key=>
        'COALESCE('+draftField(key)+',p.'+key+') AS '+key).join(',')+
        ',p.code,COALESCE('+draftField('specifications.series_id')+','+productSeries+') AS series_id'+
        ',COALESCE('+draftField('specifications.dimensions_cm')+','+productDimensions+') AS dimensions_cm':
      kind==='reviews'?'r.*,p.name,p.name_cn,p.code,p.category,p.images,p.material,p.size,p.finish,p.sub_category,'+
        productSeries+' AS series_id,'+productDimensions+' AS dimensions_cm':
      'r.id,r.product_id,r.submitter_id,r.supervisor_id,r.department_id,r.status,r.draft_revision,'+
      'r.latest_version,r.approved_version,r.return_reason,r.created_at,r.updated_at,p.name,p.name_cn,p.code,p.category,p.images,p.material,p.size,p.finish,p.sub_category,'+
      productSeries+' AS series_id,'+productDimensions+' AS dimensions_cm';
    const order=(params.get('sort')||'newest');
    if(!['oldest','newest'].includes(order))return fail('Invalid sort');
    const alias=product?'p':'r';
    const sort=(q?"CASE WHEN lower(p.code)=lower(?) THEN 0 ELSE 1 END, ":'')+
      alias+'.updated_at '+(order==='oldest'?'ASC':'DESC')+','+alias+'.id '+(order==='oldest'?'ASC':'DESC')+
      (release?',r.kind ASC':'');
    try{
      // D1 batch reads share one snapshot: matching total and page are consistent.
      const statements=[
        env.DB.prepare('SELECT '+columns+from+where+' ORDER BY '+sort+' LIMIT ? OFFSET ?')
          .bind(...bindings,...(q?[q]:[]),pageSize,(page-1)*pageSize),
        env.DB.prepare('SELECT COUNT(*) AS total'+from+where).bind(...bindings)
      ];
      if(product){
        statements.push(env.DB.prepare('SELECT p.status,COUNT(*) AS count'+from+scopeWhere+' GROUP BY p.status').bind(...scopeBindings));
        statements.push(env.DB.prepare('SELECT p.category,COUNT(*) AS count'+from+scopeWhere+' GROUP BY p.category').bind(...scopeBindings));
      }
      const results=await env.DB.batch(statements);
      if(results.some(result=>result.success===false||!Array.isArray(result.results)))throw Error('List query failed');
      const total=Number(results[1].results[0]?.total);
      if(!Number.isSafeInteger(total)||total<0)throw Error('Invalid total');
      const parse=(raw,fallback)=>{
        if(typeof raw!=='string')return raw??fallback;
        try{return JSON.parse(raw);}catch{return fallback;}
      };
      const items=results[0].results.map(row=>product?{
        ...row,images:parse(row.images,[]),production_sites:parse(row.production_sites,[]),
        specifications:parse(row.specs_json,{}),specs_json:undefined
      }:row);
      return json({list_version:1,items,...(product?{products:items}:{}),total,page,page_size:pageSize,
        has_more:page*pageSize<total,
        ...(product?{status_counts:results[2].results,category_counts:results[3].results}:{} )});
    }catch(error){
      console.error('Backoffice paginated list failed',String(error));
      return fail('无法读取完整列表，请刷新重试。',503);
    }
  };
}
