// Task 17: role-specific homepage and administrator completeness board.
// Data is computed on every authenticated request. Counts stay in D1;
// only a bounded page of missing-field records is sent to the browser.
import {preflightProduct} from '../utils/productPreflight.js';

const DAY_MS=86400000;
const STALE_DAYS=7;
const SCAN_CHUNK=250;
const MAX_PRODUCTS=20000; // Fail closed rather than advertise truncated totals.
const MISSING_KEYS=Object.freeze(['material','description','dimensions','images','name']);
const MISSING_LABELS=Object.freeze({
  material:'主要材质',description:'英文产品描述',dimensions:'产品尺寸（厘米）',
  images:'产品图片与用途',name:'英文产品名称'
});

export function staleDraft(product,at=Date.now()){
  const stamp=Date.parse(product?.updated_at||product?.created_at||'');
  return String(product?.status||'').toLowerCase()==='draft'&&
    Number.isFinite(stamp)&&Number(at)-stamp>STALE_DAYS*DAY_MS;
}
export function completenessGaps(product){
  const errors=preflightProduct(product).errors;
  const found=new Set();
  for(const error of errors){
    const field=String(error.field||'');
    if(field==='material'||field==='description'||field==='name'||field==='images')found.add(field);
    else if(field.startsWith('dimensions_cm.'))found.add('dimensions');
  }
  return MISSING_KEYS.filter(key=>found.has(key));
}
function safeParse(raw,fallback){
  if(raw===null||raw===undefined)return fallback;
  if(typeof raw!=='string')return raw;
  try{return JSON.parse(raw);}catch{return fallback;}
}
function pageInt(raw,fallback,max){
  const n=raw===null?fallback:Number(raw);
  return Number.isSafeInteger(n)&&n>=1&&n<=max?n:null;
}
function count(row){
  const n=Number(row?.n??row?.total??0);
  if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid aggregate count');
  return n;
}
function csvValue(raw){
  let value=String(raw??'').replace(/[\r\n\t]/g,' ').trim();
  if(/^[=+\-@]/.test(value))value="'"+value;
  return '"'+value.replace(/"/g,'""')+'"';
}
export function completenessCsv(items){
  const header=['SKU','产品英文名称','品类','负责人账号','缺失或不合规字段'];
  const lines=items.map(item=>[
    item.code,item.name,item.category,item.owner_name,
    item.missing.map(key=>MISSING_LABELS[key]||key).join('；')
  ].map(csvValue).join(','));
  return '\uFEFF'+[header.map(csvValue).join(','),...lines].join('\r\n')+'\r\n';
}
const cutoff=(days,at=Date.now())=>new Date(at-days*DAY_MS).toISOString();
const queryOne=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).first();
const queryMany=(env,sql,...args)=>env.DB.prepare(sql).bind(...args).all()
  .then(x=>x.results||[]);

async function factoryHome(env,actor,at){
  const valid=await queryOne(env,
    "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d "+
    "ON d.id=a.department_id AND d.is_active=1 "+
    "WHERE a.user_id=? AND a.job_type IN ('staff','secretary','data_entry') LIMIT 1",actor);
  if(!valid)return null;
  const base=" FROM products WHERE created_by=? AND deleted_at IS NULL";
  const group=await queryMany(env,
    "SELECT status,COUNT(*) AS n"+base+" GROUP BY status",actor);
  const totalByStatus=Object.fromEntries(group.map(row=>[row.status,count(row)]));
  const get=(...statuses)=>statuses.reduce((n,key)=>n+(totalByStatus[key]||0),0);
  const staleAt=cutoff(STALE_DAYS,at);
  const [stale,oldest,items]=await Promise.all([
    queryOne(env,"SELECT COUNT(*) AS n"+base+
      " AND status='draft' AND datetime(COALESCE(updated_at,created_at))<datetime(?)",
      actor,staleAt),
    queryOne(env,"SELECT MIN(COALESCE(updated_at,created_at)) AS oldest"+base+
      " AND status IN ('returned_to_uploader','rejected')",actor),
    queryMany(env,"SELECT id,code,name,category,updated_at,created_at,status"+base+
      " AND status='draft' AND datetime(COALESCE(updated_at,created_at))<datetime(?)"+
      " ORDER BY COALESCE(updated_at,created_at) ASC,id ASC LIMIT 20",actor,staleAt)
  ]);
  return {role:'FACTORY',updated_at:new Date(at).toISOString(),
    drafts:get('draft'),returned:get('returned_to_uploader','rejected'),
    oldest_returned_at:oldest?.oldest||null,
    in_review:get('awaiting_review','pending_supervisor','pending_admin',
      'returned_to_supervisor','approved_pending_publish'),
    stale_drafts:count(stale),stale_items:items};
}
async function supervisorHome(env,actor,at){
  const assignment=await queryOne(env,
    "SELECT a.department_id FROM pz_staff_assignments a JOIN pz_departments d "+
    "ON d.id=a.department_id AND d.is_active=1 WHERE a.user_id=? "+
    "AND a.job_type='supervisor' LIMIT 1",actor);
  if(!assignment)return null;
  // Same union/status/department/supervisor scope as /supervisor/release-queue.
  const summary=await queryOne(env,
    "SELECT COUNT(*) AS n,SUM(CASE WHEN x.kind='product' AND x.latest_version>1 "+
    "THEN 1 ELSE 0 END) AS rechecks FROM ("+
    "SELECT 'product' AS kind,product_id,supervisor_id,department_id,status,latest_version "+
    "FROM pz_product_reviews UNION ALL "+
    "SELECT 'revision' AS kind,product_id,supervisor_id,department_id,status,latest_version "+
    "FROM pz_published_product_revisions) x JOIN products p ON p.id=x.product_id "+
    "WHERE p.deleted_at IS NULL AND x.supervisor_id=? AND x.department_id=? "+
    "AND x.status IN ('pending_supervisor','returned_to_supervisor')",
    actor,assignment.department_id);
  const total=count(summary),rechecks=Number(summary?.rechecks||0);
  return {role:'SUPERVISOR',updated_at:new Date(at).toISOString(),
    first_reviews:total-rechecks,rechecks,total_pending:total};
}
async function adminHome(env,at){
  const final=await queryOne(env,
    "SELECT COUNT(*) AS n FROM ("+
    "SELECT product_id,status FROM pz_product_reviews UNION ALL "+
    "SELECT product_id,status FROM pz_published_product_revisions) r "+
    "JOIN products p ON p.id=r.product_id AND p.deleted_at IS NULL "+
    "WHERE r.status IN ('pending_admin','approved_pending_publish')");
  const [sample,newRecent,overdue,stale]=await Promise.all([
    queryOne(env,"SELECT COUNT(*) AS n FROM pz_fast_lane_publications WHERE status='published'"),
    queryOne(env,"SELECT COUNT(*) AS n FROM inquiries WHERE lower(status)='new' AND "+
      "datetime(created_at)>datetime(?)",cutoff(1,at)),
    queryOne(env,"SELECT COUNT(*) AS n FROM inquiries WHERE lower(status)='new' AND "+
      "datetime(created_at)<=datetime(?)",cutoff(1,at)),
    queryOne(env,"SELECT COUNT(*) AS n FROM products WHERE deleted_at IS NULL "+
      "AND status='draft' AND datetime(COALESCE(updated_at,created_at))<datetime(?)",
      cutoff(STALE_DAYS,at))
  ]);
  return {role:'ADMIN',updated_at:new Date(at).toISOString(),
    final_review:count(final),sample_queue:count(sample),new_inquiries_24h:count(newRecent),
    overdue_inquiries:count(overdue),stale_drafts:count(stale)};
}

async function scanCompleteness(env,query,at){
  const page=pageInt(query.get('page'),1,100000);
  const pageSize=pageInt(query.get('page_size'),50,100);
  if(page===null||pageSize===null)throw Error('Invalid pagination');
  const category=(query.get('category')||'').trim();
  const owner=(query.get('owner')||'').trim();
  if(category.length>120||owner.length>120)throw Error('Filter too long');
  const exportCsv=query.get('export')==='csv';
  if(query.has('export')&&!exportCsv)throw Error('Invalid export mode');
  const totalRow=await queryOne(env,
    "SELECT COUNT(*) AS n FROM products p WHERE p.deleted_at IS NULL AND "+
    "(lower(COALESCE(p.status,'draft'))<>'published' OR COALESCE(p.catalog_hidden,0)=1)");
  const scanned=count(totalRow);
  if(scanned>MAX_PRODUCTS)throw Error('TOO_MANY_PRODUCTS');
  const where=" WHERE p.deleted_at IS NULL AND "+
    "(lower(COALESCE(p.status,'draft'))<>'published' OR COALESCE(p.catalog_hidden,0)=1)";
  const byCategory=new Map(),byOwner=new Map();
  const all=[],filtered=[];
  let lastId='',seen=0;
  while(seen<scanned){
    const part=await queryMany(env,
      "SELECT p.id,p.code,p.name,p.category,p.material,p.description,p.images,"+
      "p.specs_json,p.created_by,p.status,p.updated_at,p.created_at,"+
      "COALESCE(u.username,'已注销账号') AS owner_name FROM products p "+
      "LEFT JOIN users u ON u.id=p.created_by"+where+
      " AND p.id>? ORDER BY p.id LIMIT ?",lastId,SCAN_CHUNK);
    if(!part.length)throw Error('DATA_CHANGED_DURING_SCAN');
    seen+=part.length;lastId=String(part[part.length-1].id);
    for(const row of part){
      const missing=completenessGaps({...row,
        images:safeParse(row.images,[]),specifications:safeParse(row.specs_json,{})});
      if(!missing.length)continue;
      const gap={id:row.id,code:row.code||'',name:row.name||'',
        category:row.category||'未分类',owner_id:row.created_by||'',
        owner_name:row.owner_name||'已注销账号',missing,
        updated_at:row.updated_at||row.created_at||null};
      all.push(gap);
      for(const [map,key,label] of [[byCategory,gap.category,'category'],[byOwner,gap.owner_id||'未分配','owner_id']]){
        const existing=map.get(key)||{[label]:key,owner_name:gap.owner_name,count:0,fields:{}};
        existing.count++;
        for(const field of missing)existing.fields[field]=(existing.fields[field]||0)+1;
        map.set(key,existing);
      }
      if((!category||gap.category===category)&&(!owner||gap.owner_id===owner))filtered.push(gap);
    }
  }
  // If writes race with this untransactional scan, fail closed rather than claim exact totals.
  const later=await queryOne(env,"SELECT COUNT(*) AS n FROM products p"+where);
  if(count(later)!==scanned)throw Error('DATA_CHANGED_DURING_SCAN');
  const sort=(a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||''))||
    String(a.id).localeCompare(String(b.id));
  if(exportCsv)return {csv:completenessCsv(filtered)};
  filtered.sort(sort);
  return {list_version:1,updated_at:new Date(at).toISOString(),
    total_scanned:scanned,total_with_gaps:all.length,total:filtered.length,page,
    page_size:pageSize,has_more:page*pageSize<filtered.length,
    items:filtered.slice((page-1)*pageSize,page*pageSize),
    by_category:[...byCategory.values()].sort((a,b)=>b.count-a.count),
    by_owner:[...byOwner.values()].sort((a,b)=>b.count-a.count)};
}
export function roleDashboardFetch(upstream,{authorize,json,clock=()=>Date.now()}){
  return async function(request,env,ctx){
    const {pathname,searchParams}=new URL(request.url);
    const paths=['/factory/dashboard/home','/supervisor/dashboard/home',
      '/admin/dashboard/home','/admin/dashboard/completeness'];
    if(!paths.includes(pathname)||request.method!=='GET')
      return upstream.call(this,request,env,ctx);
    const roles=pathname.startsWith('/factory/')?['FACTORY']:
      pathname.startsWith('/supervisor/')?['SUPERVISOR']:['ADMIN'];
    const auth=await authorize(request,env,roles);
    if(auth instanceof Response)return auth;
    if(!env.DB)return json({error:'数据库连接不可用'},503);
    const at=clock();
    try{
      if(pathname==='/factory/dashboard/home'){
        const data=await factoryHome(env,auth.user.id,at);
        return data?json(data):json({error:'账号尚未归属有效部门'},403);
      }
      if(pathname==='/supervisor/dashboard/home'){
        const data=await supervisorHome(env,auth.user.id,at);
        return data?json(data):json({error:'主管账号未关联有效部门'},403);
      }
      if(pathname==='/admin/dashboard/home')return json(await adminHome(env,at));
      const data=await scanCompleteness(env,searchParams,at);
      if(data.csv!==undefined)return new Response(data.csv,{status:200,
        headers:{'content-type':'text/csv; charset=utf-8',
          'content-disposition':'attachment; filename="pz-product-gaps.csv"',
          'cache-control':'no-store','x-content-type-options':'nosniff'}});
      return json(data);
    }catch(error){
      if(String(error?.message)==='TOO_MANY_PRODUCTS')
        return json({error:'产品数据量超过完整扫描安全上限，未生成截断结果，请联系管理员分批处理。',
          code:'COMPLETENESS_TOO_LARGE'},503);
      if(String(error?.message)==='DATA_CHANGED_DURING_SCAN')
        return json({error:'统计期间产品发生变化，请刷新重试。'},409);
      if(/Invalid pagination|Filter too long|Invalid export mode/.test(String(error?.message)))
        return json({error:'筛选参数不正确。'},400);
      // Deliberately no partial counts, no unscoped data fallback.
      console.error('Role dashboard query failed',String(error?.name||'Error'));
      return json({error:'工作台统计尚不可用，请检查 Worker 和数据库迁移。'},503);
    }
  };
}
