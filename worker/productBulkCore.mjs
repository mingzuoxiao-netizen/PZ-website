// Task 18 — additive product duplication and safe partial-success bulk operations.
// Every item goes through the EXISTING audited single-item Worker workflow.
// No bulk approve or publish endpoint, no new product schema, no R2 copies.
export const BULK_LIMIT=50;
const ID=/^[a-zA-Z0-9_-]{1,120}$/;
const SKU=/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
const CATEGORY=/^[a-z0-9][a-z0-9_-]{0,79}$/i;
const safeJson=(raw,fallback)=>{
  if(raw===null||raw===undefined)return fallback;
  if(typeof raw!=='string')return raw;
  try{return JSON.parse(raw);}catch{return fallback;}
};
const clone=value=>JSON.parse(JSON.stringify(value));
const draftFields=['name','name_cn','category','sub_category','material','size','finish',
  'description','description_cn','images','production_sites','specifications'];
const productView=row=>{
  const imageList=safeJson(row.images,[]),
    sites=safeJson(row.production_sites,[]),specs=safeJson(row.specs_json,{});
  if(!Array.isArray(imageList)||!Array.isArray(sites)||!specs||typeof specs!=='object'||
    Array.isArray(specs))throw Error('INVALID_SOURCE');
  return {...row,images:imageList,production_sites:sites,specifications:specs};
};
const readBody=async request=>{
  try{
    const text=await request.text();
    if(text.length>32000)return null;
    const parsed=JSON.parse(text);
    return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null;
  }catch{return null;}
};
const reasonOf=body=>typeof body.reason==='string'&&body.reason.trim().length>=5&&
  body.reason.trim().length<=500?body.reason.trim():null;
const readProduct=(env,id)=>env.DB.prepare(
  'SELECT id,code,name,name_cn,category,sub_category,material,size,finish,'+
  'description,description_cn,images,production_sites,specs_json,created_by,'+
  'status,updated_at,edit_revision,deleted_at,catalog_hidden,archived_at FROM products WHERE id=? LIMIT 1')
  .bind(id).first();
const activeMember=async(env,id)=>{
  const found=await env.DB.prepare(
    "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d "+
    "ON d.id=a.department_id AND d.is_active=1 WHERE a.user_id=? "+
    "AND a.job_type IN ('staff','secretary','data_entry') LIMIT 1")
    .bind(id).first();
  return Boolean(found);
};
async function publishedCategory(env,id){
  let config=null;
  if(env.PZ_D1_SITE_CONFIG_ENABLED==='true' &&
     (env.PZ_RUNTIME_ENV!=='production'||env.PZ_SITE_CONFIG_D1_CUTOVER_ENABLED==='true')){
    const row=await env.DB.prepare(
      'SELECT published_json FROM site_config_state WHERE id=1 LIMIT 1').first();
    config=safeJson(row?.published_json,null);
  }else if(env.SITE_CONFIG_KV){
    const value=await env.SITE_CONFIG_KV.get('published:site_config');
    config=safeJson(value,null);
  }
  if(!config||typeof config!=='object'||!Array.isArray(config.categories))
    return false;
  return config.categories.some(cat=>cat&&cat.id===id&&cat.hidden!==true&&cat.is_active!==false);
}
function delegatedRequest(request,path,method,body){
  const url=new URL(request.url);
  url.pathname=path;url.search='';
  const headers=new Headers(request.headers);
  headers.set('content-type','application/json');
  return new Request(url.toString(),{method,headers,body:JSON.stringify(body)});
}
const summary=results=>({
  success:true,requested:results.length,
  succeeded:results.filter(x=>x.ok).length,
  failed:results.filter(x=>!x.ok).length,
  results
});
const validation=(json,message,status=400)=>json({error:message},status);
const errorResult=(id,code,reason,issues=[])=>({id,code,ok:false,reason,issues});
const resultOf=async(response,id,code)=>{
  let body={};
  try{body=await response.clone().json();}catch{}
  if(response.ok&&body?.success===true&&!response.headers.has('X-PZ-Audit-State'))
    return {id,code,ok:true,status:body.status||'completed',reason:''};
  const issues=Array.isArray(body?.issues)?body.issues
    .map(x=>({field:String(x.field||''),message:String(x.zh||x.en||x.message||'资料未通过预检')})) :
    Array.isArray(body?.missing_fields)?body.missing_fields.map(field=>({field:String(field),message:'缺少必填资料'})):[];
  return errorResult(id,code,
    response.headers.has('X-PZ-Audit-State')?'审计状态尚未确认，请刷新产品状态后联系管理员。':
    String(body?.error||'操作未确认，请刷新产品列表核对状态。').slice(0,240),issues);
};

export function productBulkFetch(upstream,{authorize,json}){
  return async function(request,env,ctx){
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const duplicate=path.match(/^\/factory\/products\/([^/]+)\/duplicate$/);
    const batch=path==='/factory/products/bulk'||path==='/admin/products/bulk';
    if((!duplicate&&!batch)||method!=='POST')return upstream.call(this,request,env,ctx);
    const roles=path==='/admin/products/bulk'?['ADMIN']:['FACTORY','ADMIN'];
    const auth=await authorize(request,env,roles);
    if(auth instanceof Response)return auth;
    if(!env.DB)return validation(json,'产品数据暂不可用。',503);
    const actor=auth.user.id,isAdmin=auth.user.role==='ADMIN';
    const body=await readBody(request);
    if(!body)return validation(json,'请求内容不正确或过大。');
    if(duplicate){
      const id=decodeURIComponent(duplicate[1]);
      const code=String(body.code||'').trim().toUpperCase();
      if(!ID.test(id)||!SKU.test(code))
        return validation(json,'新产品必须填写有效且不同的 PZ- SKU。');
      if(Object.keys(body).some(key=>!['code','draft'].includes(key)))
        return validation(json,'复制操作只接受新 SKU，不接受修改审核记录或发布状态。');
      try{
        const source=await readProduct(env,id);
        if(!source||source.deleted_at)return validation(json,'源产品不存在。',404);
        if(!isAdmin&&(source.created_by!==actor||!(await activeMember(env,actor))))
          return validation(json,'不能复制其他员工的产品。',403);
        if(String(source.code).toUpperCase()===code)
          return validation(json,'复制产品必须使用新的 SKU。',409);
        const collision=await env.DB.prepare(
          'SELECT id FROM products WHERE upper(trim(code))=? LIMIT 1')
          .bind(code).first();
        if(collision)return validation(json,'该 SKU 已经存在，请换一个新编号。',409);
        const value=productView(source);
        const overrides=body.draft??{};
        if(!overrides||typeof overrides!=='object'||Array.isArray(overrides)||
          Object.keys(overrides).some(key=>!draftFields.includes(key)))
          return validation(json,'复制草稿包含不允许的字段。');
        if(Object.hasOwn(overrides,'images')){
          const next=overrides.images;
          const original=new Set(value.images);
          if(!Array.isArray(next)||next.length>40||next.some(url=>
            typeof url!=='string'||url.length>2048||
            (!original.has(url)&&!/^https:\/\/cdn\.peng-zhan\.com\//i.test(url))))
            return validation(json,'图片只能引用源产品已有图片或 PZ 官方 R2 CDN。');
        }
        const sourceSpecs=Object.hasOwn(overrides,'specifications')
          ?clone(overrides.specifications):clone(value.specifications);
        if(!sourceSpecs||typeof sourceSpecs!=='object'||Array.isArray(sourceSpecs))
          return validation(json,'复制产品技术资料格式不正确。');
        const sourceProvenance=sourceSpecs.provenance&&
          typeof sourceSpecs.provenance==='object'&&!Array.isArray(sourceSpecs.provenance)
          ?sourceSpecs.provenance:{};
        const proposed={
          ...Object.fromEntries(draftFields.map(field=>[field,
            field==='specifications'?sourceSpecs:clone(
              Object.hasOwn(overrides,field)?overrides[field]:
              (value[field]??(field==='images'||field==='production_sites'?[]:'')))])),
          code,status:'draft',is_published:0,id:undefined,created_by:undefined,
          specifications:{...sourceSpecs,provenance:{
            ...sourceProvenance,inherited_images_from:source.code,
            inherited_product_id:source.id
          }}
        };
        // Creating through the guarded POST ensures fresh owner, fresh status,
        // no copied review history and an independently audited D1 row.
        const forwarded=delegatedRequest(request,'/factory/products','POST',proposed);
        const response=await upstream.call(this,forwarded,env,ctx);
        if(!response.ok)return response;
        let data={};try{data=await response.clone().json();}catch{}
        if(data.success!==true||!data.id||response.headers.has('X-PZ-Audit-State'))
          return validation(json,'复制提交结果未确认，请按新 SKU 核对后再试。',503);
        return json({success:true,id:data.id,code,status:'draft',
          inherited_images_from:source.code,source_id:source.id});
      }catch(error){
        console.error('Duplicate product failed',String(error?.name||'Error'));
        return validation(json,'产品复制未完成，请检查 SKU 和源产品状态。',503);
      }
    }
    const action=body.action;
    if(!['category','submit','unpublish'].includes(action))
      return validation(json,'不支持该批量操作（审核批准与发布必须逐件完成）。');
    if(path==='/admin/products/bulk'&&action==='submit')
      return validation(json,'管理员不能代替工厂员工批量提交审核。',403);
    if(action==='unpublish'&&(path!=='/admin/products/bulk'||!isAdmin))
      return validation(json,'只有管理员可批量下架。',403);
    if(action==='submit'&&isAdmin)
      return validation(json,'请由原上传员工提交审核。',403);
    if(!Array.isArray(body.ids)||body.ids.length<1||body.ids.length>BULK_LIMIT||
       body.ids.some(id=>typeof id!=='string'||!ID.test(id))||
       new Set(body.ids).size!==body.ids.length)
      return validation(json,'每次只能选择 1–50 个不同的有效产品编号。');
    const category=typeof body.category==='string'?body.category.trim():'';
    if(action==='category'&&(!CATEGORY.test(category)||
       !(await publishedCategory(env,category))))
      return validation(json,'只能选择当前网站已发布的有效品类。');
    const reason=action==='unpublish'?reasonOf(body):null;
    if(action==='unpublish'&&!reason)
      return validation(json,'批量下架必须填写 5–500 字的原因。');
    if(Object.keys(body).some(key=>!['action','ids','category','reason'].includes(key)))
      return validation(json,'批量操作包含不支持的字段。');
    const results=[];
    for(const id of body.ids){
      let code=id;
      try{
        const source=await readProduct(env,id);
        if(!source||source.deleted_at){results.push(errorResult(id,code,'产品不存在或已删除。'));continue;}
        code=source.code||id;
        if(!isAdmin&&(source.created_by!==actor||!(await activeMember(env,actor)))){
          results.push(errorResult(id,code,'无权限操作其他员工的产品。'));continue;
        }
        const state=String(source.status||'').toLowerCase();
        if(action==='category'&&!(state==='draft'||state==='rejected')){
          results.push(errorResult(id,code,'只能批量调整未进入审核流程的草稿；已发布产品请走修订审核。'));continue;
        }
        if(action==='submit'&&!['draft','rejected','returned_to_uploader'].includes(state)){
          results.push(errorResult(id,code,'当前状态不可提交审核。'));continue;
        }
        if(action==='unpublish'&&(state!=='published'||source.archived_at||
          Number(source.catalog_hidden)===1)){
          results.push(errorResult(id,code,'仅允许下架正在公开展示、未归档的已发布产品。'));continue;
        }
        let forwarded;
        if(action==='category'){
          const existing=productView(source);
          forwarded=delegatedRequest(request,'/factory/products/'+encodeURIComponent(id),'PUT',{
            ...Object.fromEntries(draftFields.map(field=>[field,existing[field]])),
            code:existing.code,status:'draft',
            expected_updated_at:source.updated_at,expected_revision:Number(source.edit_revision)
          });
          // Set new category last to prevent client-supplied category from winning.
          const payload=await forwarded.json();
          payload.category=category;
          forwarded=delegatedRequest(request,'/factory/products/'+encodeURIComponent(id),'PUT',payload);
        }else if(action==='submit'){
          forwarded=delegatedRequest(request,'/factory/products/'+encodeURIComponent(id)+'/submit','POST',
            {confirmed_warnings:[]});
        }else{
          forwarded=delegatedRequest(request,'/admin/products/'+encodeURIComponent(id)+'/unpublish','POST',{reason});
        }
        const response=await upstream.call(this,forwarded,env,ctx);
        results.push(await resultOf(response,id,code));
      }catch(error){
        console.error('Product bulk item failed',String(error?.name||'Error'));
        results.push(errorResult(id,code,'本条操作结果未确认，请刷新产品状态后再尝试。'));
      }
    }
    return json(summary(results));
  };
}
