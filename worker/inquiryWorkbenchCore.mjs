// Task 16: additive inquiry workbench routes. Legacy public submit and unversioned
// read-only /admin/inquiries remain owned by the original Worker for compatibility.
export const INQUIRY_STATUSES=Object.freeze(['new','replied','quoted','won','closed']);
const statusOK=value=>typeof value==='string'&&INQUIRY_STATUSES.includes(value);
const now=()=>new Date().toISOString();
const SAFE_ID=/^[a-zA-Z0-9_-]{1,120}$/;
const SKU=/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/;
const DAYS_1=24*60*60*1000;

export function isInquiryOverdue(createdAt,status,at=Date.now()){
  const time=Date.parse(String(createdAt||''));
  return String(status||'').toLowerCase()==='new'&&Number.isFinite(time)&&
    Number.isFinite(Number(at))&&Number(at)-time>=DAYS_1;
}
const effectiveStatus=value=>{
  const key=String(value||'new').toLowerCase();
  return INQUIRY_STATUSES.includes(key)?key:'new';
};
const normalizeItem=row=>({...row,status:effectiveStatus(row.status),
  is_overdue:Number(row.is_overdue||0)===1});
const absent={error:'询盘不存在或已被移除。'};
const invalidParam=(json,name)=>json({error:name+'不合法，请检查输入后重试。'},400);
const errBody=async request=>{
  try{
    const content=await request.text();
    if(content.length>10000)return null;
    const data=JSON.parse(content);
    return data&&typeof data==='object'&&!Array.isArray(data)?data:null;
  }catch{return null;}
};

export function inquiryWorkbenchFetch(upstream,{authorize,json}){
  return async function(request,env,ctx){
    const url=new URL(request.url),path=url.pathname,method=request.method;
    if(path==='/admin/inquiries'&&method==='GET'&&
      url.searchParams.get('list_version')!=='1')
      return upstream.call(this,request,env,ctx);
    const detailPath=path.match(/^\/admin\/inquiries\/([^/]+)$/);
    const workbench=path==='/admin/inquiries'||detailPath!==null;
    if(workbench){
      const auth=await authorize(request,env,['ADMIN']);
      if(auth instanceof Response)return auth;
      try{
        if(path==='/admin/inquiries'&&method==='GET'){
          const params=url.searchParams;
          const page=Number(params.get('page')||1),
            size=Number(params.get('page_size')||50);
          if(!Number.isSafeInteger(page)||page<1||page>100000||
            !Number.isSafeInteger(size)||size<1||size>100)
            return invalidParam(json,'分页');
          const status=params.get('status')||'';
          if(status&&!statusOK(status))return invalidParam(json,'状态');
          const assignee=params.get('assignee')||'';
          if(assignee&&assignee!=='unassigned'&&!SAFE_ID.test(assignee))
            return invalidParam(json,'负责人');
          const overdue=params.get('overdue')||'';
          if(overdue&&!['0','1'].includes(overdue))return invalidParam(json,'超时筛选');
          const query=(params.get('q')||'').trim();
          if(query.length>120)return invalidParam(json,'搜索内容');
          const where=[],args=[];
          if(status){where.push('lower(i.status)=?');args.push(status);}
          if(assignee){where.push(assignee==='unassigned'?'i.assignee_id IS NULL':'i.assignee_id=?');
            if(assignee!=='unassigned')args.push(assignee);}
          const cutoff=new Date(Date.now()-DAYS_1).toISOString();
          if(overdue==='1'){where.push("lower(i.status)='new' AND datetime(i.created_at)<=datetime(?)");args.push(cutoff);}
          if(query){
            where.push("(instr(lower(COALESCE(i.name,'')),lower(?))>0 OR "+
              "instr(lower(COALESCE(i.company,'')),lower(?))>0 OR "+
              "instr(lower(COALESCE(i.email,'')),lower(?))>0 OR "+
              "instr(lower(COALESCE(i.linked_product_code,'')),lower(?))>0)");
            args.push(query,query,query,query);
          }
          const filter=where.length?' WHERE '+where.join(' AND '):'';
          const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM inquiries i'+filter)
            .bind(...args).first();
          const total=Number(count?.n||0);
          const rows=await env.DB.prepare(
            'SELECT i.id,i.name,i.email,i.company,i.product_type,i.created_at,'+
            'i.country,i.linked_product_code,i.status,i.assignee_id,'+
            'u.username AS assignee_name,i.first_response_at,i.version,'+
            "CASE WHEN lower(i.status)='new' AND datetime(i.created_at)<=datetime(?) "+
            'THEN 1 ELSE 0 END AS is_overdue FROM inquiries i '+
            'LEFT JOIN users u ON u.id=i.assignee_id'+filter+
            ' ORDER BY i.created_at DESC,i.id DESC LIMIT ? OFFSET ?')
            .bind(cutoff,...args,size,(page-1)*size).all();
          return json({list_version:1,items:(rows.results||[]).map(normalizeItem),
            total,page,page_size:size,has_more:page*size<total});
        }
        if(path==='/admin/inquiries/assignees'&&method==='GET'){
          const result=await env.DB.prepare(
            "SELECT id,username,role FROM users WHERE is_active=1 AND deleted_at IS NULL "+
            "AND lower(role) IN ('admin','factory','supervisor') ORDER BY username,id").all();
          return json({items:result.results||[]});
        }
        if(detailPath){
          const id=decodeURIComponent(detailPath[1]);
          if(!SAFE_ID.test(id))return invalidParam(json,'询盘编号');
          if(method==='GET'){
            const item=await env.DB.prepare(
              'SELECT i.id,i.name,i.email,i.company,i.product_type,i.message,'+
              'i.source,i.website,i.created_at,i.updated_at,i.country,'+
              'i.linked_product_code,i.status,i.assignee_id,'+
              'u.username AS assignee_name,i.first_response_at,'+
              'i.internal_notes,i.version FROM inquiries i '+
              'LEFT JOIN users u ON u.id=i.assignee_id WHERE i.id=? LIMIT 1')
              .bind(id).first();
            if(!item)return json(absent,404);
            const history=await env.DB.prepare(
              'SELECT h.id,h.field,h.old_value,h.new_value,h.actor_id,'+
              'u.username AS actor_name,h.created_at FROM pz_inquiry_history h '+
              'LEFT JOIN users u ON u.id=h.actor_id WHERE h.inquiry_id=? '+
              'ORDER BY h.created_at DESC,h.id DESC LIMIT 100')
              .bind(id).all();
            return json({item:normalizeItem(item),history:history.results||[]});
          }
          if(method==='PUT'){
            const body=await errBody(request);
            if(!body)return invalidParam(json,'请求内容');
            const keys=Object.keys(body);
            if(keys.some(key=>!['expected_version','status','assignee_id','internal_notes'].includes(key))||
              !Number.isSafeInteger(body.expected_version)||body.expected_version<0||
              !keys.some(key=>key!=='expected_version'))
              return invalidParam(json,'变更字段');
            const old=await env.DB.prepare(
              'SELECT id,status,assignee_id,internal_notes,first_response_at,version '+
              'FROM inquiries WHERE id=? LIMIT 1').bind(id).first();
            if(!old)return json(absent,404);
            if(old.version!==body.expected_version)
              return json({error:'其他管理员已修改这条询盘，请刷新后再保存。'},409);
            const status=Object.hasOwn(body,'status')?body.status:effectiveStatus(old.status);
            if(!statusOK(status))return invalidParam(json,'状态');
            let assignee=Object.hasOwn(body,'assignee_id')?body.assignee_id:old.assignee_id;
            if(assignee!==null&&assignee!==undefined){
              if(typeof assignee!=='string'||!SAFE_ID.test(assignee))
                return invalidParam(json,'负责人');
              const user=await env.DB.prepare(
                "SELECT id FROM users WHERE id=? AND is_active=1 AND deleted_at IS NULL "+
                "AND lower(role) IN ('admin','factory','supervisor') LIMIT 1")
                .bind(assignee).first();
              if(!user)return json({error:'负责人账号不可用，请重新选择。'},409);
            }else assignee=null;
            const notes=Object.hasOwn(body,'internal_notes')?body.internal_notes:old.internal_notes||'';
            if(typeof notes!=='string'||notes.length>5000)
              return invalidParam(json,'内部备注');
            const rawStatus=effectiveStatus(old.status)===status?old.status:status;
            if(rawStatus===old.status&&assignee===old.assignee_id&&notes===(old.internal_notes||''))
              return json({success:true,unchanged:true,version:old.version});
            const stamp=now();
            const previous=effectiveStatus(old.status);
            // A notes-only edit or an old Replied record must not fabricate a first reply.
            const responseTransition=previous!==status&&
              !['replied','quoted','won'].includes(previous)&&
              ['replied','quoted','won'].includes(status);
            const statusToStamp=responseTransition?status:'new';
            const result=await env.DB.prepare(
              'UPDATE inquiries SET status=?,assignee_id=?,internal_notes=?,'+
              'updated_at=?,last_modified_by=?,version=version+1,'+
              "first_response_at=CASE WHEN first_response_at IS NULL AND ? IN ('replied','quoted','won') "+
              'THEN ? ELSE first_response_at END WHERE id=? AND version=?')
              .bind(rawStatus,assignee,notes,stamp,auth.user.id,statusToStamp,stamp,id,body.expected_version).run();
            if(Number(result.meta?.changes)<1)
              return json({error:'询盘已被其他管理员更新，请刷新重试。'},409);
            return json({success:true,version:body.expected_version+1,status:effectiveStatus(rawStatus),
              first_response_at:old.first_response_at||(responseTransition?stamp:null)});
          }
        }
        return json({error:'不支持的询盘操作。'},405);
      }catch(error){
        if(/no such table|no such column/i.test(String(error)))
          return json({error:'询盘工作台尚未完成数据库迁移 021，请联系管理员。',
            code:'INQUIRY_MIGRATION_REQUIRED'},503);
        // Do not expose DB schema, internal notes, contact information or stack traces.
        console.error('Inquiry workbench failed:',String(error?.name||'UnknownError'));
        return json({error:'询盘操作未完成，请刷新并联系管理员。'},503);
      }
    }
    if(path==='/inquiries'&&method==='POST'){
      // The legacy endpoint owns Turnstile/rate validation and the INSERT.
      // Optional metadata can never cause an already-created inquiry to be resubmitted.
      const copy=request.clone();
      const result=await upstream.call(this,request,env,ctx);
      if(result.status!==201||!env.DB)return result;
      try{
        const body=await copy.json(),ack=await result.clone().json();
        if(typeof ack?.id!=='string'||!SAFE_ID.test(ack.id))return result;
        const country=typeof body?.country==='string'&&body.country.trim().length<=80&&
          !/[\x00-\x1f\x7f]/.test(body.country)?body.country.trim():null;
        const requested=typeof body?.product_code==='string'?body.product_code.trim().toUpperCase():'';
        let product=null;
        if(SKU.test(requested)){
          const found=await env.DB.prepare(
            "SELECT code FROM products WHERE upper(trim(code))=? AND status='published' "+
            'AND deleted_at IS NULL AND COALESCE(catalog_hidden,0)=0 LIMIT 1').bind(requested).first();
          product=found?.code||null;
        }
        if(country||product)await env.DB.prepare(
          'UPDATE inquiries SET country=?,linked_product_code=? WHERE id=?')
          .bind(country,product,ack.id).run();
      }catch(error){
        // Customer submission already succeeded. Avoid a false failure and duplicate follow-up.
        console.warn('Inquiry optional metadata not saved:',String(error?.name||'UnknownError'));
      }
      return result;
    }
    return upstream.call(this,request,env,ctx);
  };
}
