// Task 20: authenticated, advisory edit presence and read-only latest draft snapshot.
// These routes DO NOT edit product content and DO NOT override review permissions.
const VALID_ID=/^[A-Za-z0-9_-]{1,120}$/;
const VALID_SESSION=/^[A-Za-z0-9_-]{16,100}$/;
const EDITABLE=new Set(['draft','rejected','returned_to_uploader']);
const EXPIRY_MS=90000;
const toJson=(text,fallback)=>{
  if(Array.isArray(text))return text;
  try{return typeof text==='string'?JSON.parse(text):text??fallback;}
  catch{return fallback;}
};
export const expired=(ping,at)=>Date.parse(ping)+EXPIRY_MS<=at;
function snapshot(row){
  return {
    id:row.id,code:row.code,name:row.name,name_cn:row.name_cn,
    category:row.category,sub_category:row.sub_category,material:row.material,
    finish:row.finish,size:row.size,description:row.description,
    description_cn:row.description_cn,
    images:toJson(row.images,[]),production_sites:toJson(row.production_sites,[]),
    specifications:toJson(row.specs_json,{}),status:row.status,
    updated_at:row.updated_at,edit_revision:Number(row.edit_revision),
    created_by:row.created_by
  };
}
export function productPresenceFetch(upstream,{authorize,json,clock=()=>Date.now()}){
  return async function(request,env,ctx){
    const {pathname}=new URL(request.url);
    const match=/^\/factory\/products\/([^/]+)\/(edit-state|presence)$/.exec(pathname);
    if(!match||!(match[2]==='edit-state'&&request.method==='GET'||
      match[2]==='presence'&&['POST','DELETE'].includes(request.method)))
      return upstream.call(this,request,env,ctx);
    const auth=await authorize(request,env,['FACTORY','ADMIN']);
    if(auth instanceof Response)return auth;
    if(!env.DB)return json({error:'产品数据库不可用'},503);
    let id;try{id=decodeURIComponent(match[1]);}catch{return json({error:'无效产品编号'},400);}
    if(!VALID_ID.test(id))return json({error:'无效产品编号'},400);
    const actor=auth.user.id,isAdmin=auth.user.role==='ADMIN',now=clock();
    const nowIso=new Date(now).toISOString(),validUntil=new Date(now+EXPIRY_MS).toISOString();
    try{
      const row=await env.DB.prepare(
        'SELECT p.id,p.code,p.name,p.name_cn,p.category,p.sub_category,'+
        'p.material,p.size,p.finish,p.description,p.description_cn,p.images,'+
        'p.production_sites,p.specs_json,p.status,p.updated_at,p.edit_revision,'+
        'p.created_by,p.last_editor_id,u.username AS last_editor_name,p.deleted_at '+
        'FROM products p LEFT JOIN users u ON u.id=p.last_editor_id '+
        'WHERE p.id=? LIMIT 1').bind(id).first();
      if(!row||row.deleted_at)return json({error:'该产品不存在或已删除'},404);
      if(!isAdmin){
        const member=await env.DB.prepare(
          "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d "+
          "ON d.id=a.department_id AND d.is_active=1 WHERE a.user_id=? "+
          "AND a.job_type IN ('staff','secretary','data_entry') LIMIT 1"
        ).bind(actor).first();
        if(!member||row.created_by!==actor)return json({error:'只能编辑自己的产品'},403);
      }
      if(!EDITABLE.has(String(row.status||'').toLowerCase())||
         isAdmin&&!['draft','rejected'].includes(String(row.status||'').toLowerCase()))
        return json({error:'产品已进入审核或发布流程，不允许直接编辑'},409);
      if(match[2]==='presence'){
        let body;
        try{body=await request.json();}catch{return json({error:'会话参数无效'},400);}
        if(!body||!VALID_SESSION.test(String(body.session_id||'')))
          return json({error:'会话标识无效'},400);
        if(request.method==='POST'){
          await env.DB.prepare(
            'INSERT INTO pz_product_edit_presence '+
            '(product_id,actor_id,session_id,started_at,heartbeat_at,expires_at) '+
            'VALUES (?,?,?,?,?,?) ON CONFLICT(product_id,actor_id,session_id) '+
            'DO UPDATE SET heartbeat_at=excluded.heartbeat_at,expires_at=excluded.expires_at'
          ).bind(id,actor,body.session_id,nowIso,nowIso,validUntil).run();
        }else await env.DB.prepare(
          'DELETE FROM pz_product_edit_presence WHERE product_id=? AND actor_id=? AND session_id=?'
        ).bind(id,actor,body.session_id).run();
      }
      const active=await env.DB.prepare(
        'SELECT presence.actor_id,u.username,presence.started_at,presence.heartbeat_at '+
        'FROM pz_product_edit_presence presence JOIN users u ON u.id=presence.actor_id '+
        'WHERE presence.product_id=? AND presence.actor_id<>? '+
        'AND presence.expires_at>? AND u.is_active=1 '+
        'ORDER BY presence.started_at ASC LIMIT 8'
      ).bind(id,actor,nowIso).all();
      // Expiry is evaluated at query time; stale rows may be swept separately.
      return json({success:true,
        ...(match[2]==='edit-state'?{product:snapshot(row)}:{}),
        updated_at:row.updated_at,edit_revision:Number(row.edit_revision),
        last_editor_name:row.last_editor_name||null,
        others:(active.results||[]).map(x=>({id:x.actor_id,name:x.username,
          started_at:x.started_at})),checked_at:nowIso});
    }catch(error){
      console.error('Product edit presence unavailable',String(error?.name||'Error'));
      return json({error:'编辑会话不可用，请检查数据库迁移及权限配置'},503);
    }
  };
}
