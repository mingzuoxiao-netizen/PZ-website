// PZ safe, auditable permanent SKU deletion for NEVER-PUBLISHED,
 // unreferenced, non-reviewing products. Physical R2 files are NEVER deleted.
 // Embed in both standalone Worker candidates BEFORE the audit middleware.
export function pzProductPermanentDeleteFetch(originalFetch,{authorize,json,expectedRuntime}){
  const fail=(error,status=400,code)=>json({error,...(code?{code}:{})},status);
  const allowStatuses=['draft','rejected','unpublished','inactive','archived'];
  const references=[
    ['pz_product_reviews','product_id','new-product review history'],
    ['pz_published_product_revisions','product_id','published-product revision history'],
    ['pz_product_responsibilities','product_id','historical product responsibility'],
    ['pz_product_responsibility_events','product_id','responsibility audit history']
  ];
  const statementNames=references.map(([name])=>name);
  const productSql="SELECT id,code,name,name_cn,status,updated_at FROM products WHERE id=? LIMIT 1";
  const isValidId=id=>typeof id==='string'&&id.length>0&&id.length<=128;

  async function inspect(env,id){
    const product=await env.DB.prepare(productSql).bind(id).first();
    if(!product)return {status:404,error:'Product not found'};
    const status=String(product.status||'').toLowerCase();
    if(!allowStatuses.includes(status))
      return {status:409,error:'该产品仍在发布或审核流程中，不能永久删除。请先停止公开展示并结束审核。',code:'PRODUCT_NOT_ELIGIBLE',product};
    const tables=await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+
      statementNames.map(()=>'?').join(',')+")"
    ).bind(...statementNames).all();
    const existing=new Set((tables.results||[]).map(row=>row.name));
    for(const [table,col,label] of references){
      if(!existing.has(table))continue;
      const link=await env.DB.prepare(
        "SELECT 1 AS found FROM "+table+" WHERE "+col+"=? LIMIT 1"
      ).bind(id).first();
      if(link)
        return {status:409,error:'该 SKU 有'+label+'，必须保留关联记录，不能直接永久删除。',code:'PRODUCT_HAS_HISTORY',product};
    }
    return {status:200,product,existing:[...existing]};
  }

  return async function permanentDeleteFetch(request,env,ctx){
    const match=new URL(request.url).pathname.match(/^\/admin\/products\/([^/]+)\/permanent-delete$/);
    if(!match)return originalFetch.call(this,request,env,ctx);
    if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!==expectedRuntime)
      return fail('Wrong Worker environment',403);
    if(!['GET','POST'].includes(request.method))
      return fail('Method not allowed',405);
    const auth=await authorize(request,env,['ADMIN']);
    if(auth instanceof Response)return auth;
    if(env.PZ_PERMANENT_SKU_DELETE_ENABLED!=='true')
      return fail('Permanent deletion is not enabled',404);
    if(!env.DB)return fail('D1 is unavailable',503);
    let id;
    try{id=decodeURIComponent(match[1]);}catch{return fail('Invalid product ID');}
    if(!isValidId(id))return fail('Invalid product ID');
    let result;
    try{result=await inspect(env,id);}catch(error){
      console.error('Permanent SKU deletion safety check failed',String(error));
      return fail('无法验证产品关联记录，未执行删除。',503);
    }
    if(request.method==='GET'){
      return json(result.status===200?{eligible:true,product:result.product}:
        {eligible:false,error:result.error,code:result.code,product:result.product},result.status===404?404:200);
    }
    if(result.status!==200)
      return fail(result.error,result.status,result.code);
    if(!(request.headers.get('Content-Type')||'').toLowerCase().includes('application/json'))
      return fail('Expected application/json',415);
    const raw=await request.text();
    if(new TextEncoder().encode(raw).length>2048)return fail('Payload too large',413);
    let body;
    try{body=JSON.parse(raw);}catch{return fail('Invalid JSON');}
    if(!body||typeof body!=='object'||Array.isArray(body)||
      Object.keys(body).some(key=>!['confirm_sku','expected_updated_at'].includes(key)))
      return fail('Invalid deletion confirmation');
    if(body.confirm_sku!==result.product.code||
       !body.confirm_sku||typeof body.expected_updated_at!=='string'||
       body.expected_updated_at!==result.product.updated_at)
      return fail('SKU confirmation or version mismatch; refresh',409,'DELETE_CONFIRMATION_MISMATCH');

    // Single conditional DELETE is atomic. Recheck status/version/code, plus
    // historical references in SQL to close the preflight/DELETE race.
    // Foreign keys independently fail closed for any future referencing tables.
    const guards=(result.existing||[]).map(table=>
      " AND NOT EXISTS(SELECT 1 FROM "+table+" WHERE product_id=products.id)");
    const sql="DELETE FROM products WHERE id=? AND code=? AND updated_at=? "+
      "AND lower(status) IN ("+allowStatuses.map(()=>'?').join(',')+")"+guards.join('');
    try{
      const deleted=await env.DB.prepare(sql).bind(
        id,result.product.code,result.product.updated_at,...allowStatuses
      ).run();
      if(Number(deleted.meta?.changes)!==1)
        return fail('Product changed or has related history; refresh',409,'PRODUCT_DELETE_CONFLICT');
    }catch(error){
      if(/constraint|foreign key|immutable|trigger/i.test(String(error)))
        return fail('关联数据受保护，无法安全删除此 SKU。',409,'PRODUCT_DELETE_REFERENCED');
      console.error('Permanent product deletion failed',String(error));
      return fail('删除操作失败，未确认完成。请刷新产品列表。',503);
    }
    return json({success:true,id,deleted_sku:result.product.code,sku_reusable:true});
  };
}
