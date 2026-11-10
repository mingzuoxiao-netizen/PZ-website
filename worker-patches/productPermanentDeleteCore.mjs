// PZ Admin deletion V3.
// Unreferenced SKUs: physical deletion. Referenced/published SKUs: scrubbed
// audit tombstone + SKU release, WITHOUT modifying immutable review history.
// Neither route deletes R2 images. Requires migration 016 before enabling
// PZ_FORCE_PRODUCT_RETIRE_ENABLED. Staging and Production require separate flags.
export function pzProductPermanentDeleteFetch(originalFetch,{authorize,json,expectedRuntime}){
  const fail=(error,status=400,code)=>json({error,...(code?{code}:{})},status);
  const allowStatuses=['draft','rejected','unpublished','inactive','archived'];
  const references=[
    ['pz_product_reviews','product_id','product review'],
    ['pz_published_product_revisions','product_id','published revision'],
    ['pz_product_responsibilities','product_id','responsibility'],
    ['pz_product_responsibility_events','product_id','responsibility history']
  ];
  const statementNames=references.map(([name])=>name);
  const productSql="SELECT id,code,name,status,updated_at FROM products WHERE id=? LIMIT 1";
  const isValidId=id=>typeof id==='string'&&id.length>0&&id.length<=128;

  async function forceAvailable(env){
    if(env.PZ_FORCE_PRODUCT_RETIRE_ENABLED!=='true'||!env.DB)return false;
    try{
      const table=await env.DB.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='pz_product_retirements'"
      ).first();
      if(!table)return false;
      const columns=await env.DB.prepare('PRAGMA table_info(products)').all();
      const names=new Set((columns.results||[]).map(c=>c.name));
      return names.has('deleted_at')&&names.has('deleted_by');
    }catch(error){
      console.error('Force product retirement schema verification failed',String(error));
      return false;
    }
  }

  async function inspect(env,id,force=false){
    const product=await env.DB.prepare(productSql).bind(id).first();
    if(!product)return {status:404,error:'Product not found',code:'PRODUCT_NOT_FOUND'};
    if(force){
      const removed=await env.DB.prepare(
        "SELECT product_id FROM pz_product_retirements WHERE product_id=? LIMIT 1"
      ).bind(id).first();
      if(removed)return {status:410,error:'产品已永久移除，请刷新。',code:'PRODUCT_ALREADY_REMOVED'};
    }
    const status=String(product.status||'').toLowerCase();
    if(!force&&!allowStatuses.includes(status))
      return {status:409,error:'该产品仍在发布或审核流程中。需管理员强制移除权限。',code:'PRODUCT_NOT_ELIGIBLE',product};
    const tables=await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name IN ("+
      statementNames.map(()=>'?').join(',')+")"
    ).bind(...statementNames).all();
    const existing=new Set((tables.results||[]).map(row=>row.name));
    const linked=[];
    for(const [table,col,label] of references){
      if(!existing.has(table))continue;
      const found=await env.DB.prepare(
        "SELECT 1 AS found FROM "+table+" WHERE "+col+"=? LIMIT 1"
      ).bind(id).first();
      if(found){
        linked.push(label);
        if(!force)return {
          status:409,error:'该 SKU 有'+label+'，必须保留关联记录，不能直接永久删除。',
          code:'PRODUCT_HAS_HISTORY',product
        };
      }
    }
    return {status:200,product,existing:[...existing],linked};
  }

  async function retireWithAudit(env,product,actor){
    const at=new Date().toISOString();
    // A stable opaque replacement SKU releases the original unique SKU, but
    // preserves the ID required by immutable FK-linked audit histories.
    const tombstone='PZ-DEL-'+crypto.randomUUID().replace(/-/g,'').toUpperCase();
    let batchError=null;
    try{
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE products SET code=?,status='archived',catalog_hidden=1,archived_at=?,"+
          "deleted_at=?,deleted_by=?,name='已移除产品',name_cn='已移除产品',"+
          "category='',sub_category='',material='',size='',finish='',"+
          "description='',description_cn='',images='[]',production_sites='[]',"+
          "specs_json='{}',updated_at=? "+
          "WHERE id=? AND code=? AND updated_at=? AND deleted_at IS NULL"
        ).bind(tombstone,at,at,actor,at,product.id,product.code,product.updated_at),
        env.DB.prepare(
          "INSERT INTO pz_product_retirements "+
          "(product_id,original_sku,tombstone_sku,actor_id,retired_at,disposal_mode) "+
          "SELECT id,?,?,?,?,'audit_tombstone' FROM products "+
          "WHERE id=? AND code=? AND deleted_at=?"
        ).bind(product.code,tombstone,actor,at,product.id,tombstone,at)
      ]);
    }catch(error){
      batchError=error;
      console.error('Admin audited product retirement batch failed',String(error));
    }
    try{
      const [current,receipt]=await Promise.all([
        env.DB.prepare("SELECT code,status,deleted_at,catalog_hidden FROM products WHERE id=?").bind(product.id).first(),
        env.DB.prepare("SELECT product_id,original_sku,tombstone_sku,actor_id FROM pz_product_retirements WHERE product_id=?")
          .bind(product.id).first()
      ]);
      if(current&&receipt&&current.code===tombstone&&current.deleted_at===at &&
        current.status==='archived'&&Number(current.catalog_hidden)===1 &&
        receipt.tombstone_sku===tombstone&&receipt.original_sku===product.code&&receipt.actor_id===actor){
        return json({success:true,id:product.id,deleted_sku:product.code,
          sku_reusable:true,disposal_mode:'audit_tombstone',physically_removed:false,
          history_retained:true,r2_preserved:true});
      }
    }catch(error){
      console.error('Audited product retirement confirmation failed',String(error));
    }
    return fail(batchError?'无法安全移除产品，事务失败，请刷新检查。':
      '无法确认产品移除结果，请刷新核对后再重试。',503,'PRODUCT_RETIREMENT_UNCONFIRMED');
  }

  return async function permanentDeleteFetch(request,env,ctx){
    const path=new URL(request.url).pathname;
    const match=path.match(/^\/admin\/products\/([^/]+)\/permanent-delete$/);
    const capability=path==='/admin/product-delete/capabilities';
    if(!match&&!capability)return originalFetch.call(this,request,env,ctx);
    if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!==expectedRuntime)
      return fail('Wrong Worker environment',403);
    if(capability?request.method!=='GET':!['GET','POST'].includes(request.method))
      return fail('Method not allowed',405);
    const auth=await authorize(request,env,['ADMIN']);
    if(auth instanceof Response)return auth;
    if(env.PZ_PERMANENT_SKU_DELETE_ENABLED!=='true')
      return capability?json({force_available:false,reason:'Permanent deletion not enabled'}):
        fail('Permanent deletion is not enabled',404);
    if(!env.DB)return fail('D1 is unavailable',503);
    const canForce=await forceAvailable(env);
    if(capability){
      return json({force_available:canForce,
        strategy:canForce?'physical_or_audit_tombstone':'guarded_physical_only',
        r2_policy:'retain_shared_images'});
    }
    let id;
    try{id=decodeURIComponent(match[1]);}catch{return fail('Invalid product ID');}
    if(!isValidId(id))return fail('Invalid product ID');
    const force=request.method==='GET'?canForce:false;
    let body=null,forceRequested=false;
    if(request.method==='POST'){
      if(!(request.headers.get('Content-Type')||'').toLowerCase().includes('application/json'))
        return fail('Expected application/json',415);
      const raw=await request.text();
      if(new TextEncoder().encode(raw).length>2048)return fail('Payload too large',413);
      try{body=JSON.parse(raw);}catch{return fail('Invalid JSON');}
      if(!body||typeof body!=='object'||Array.isArray(body)||
        Object.keys(body).some(key=>!['confirm_sku','expected_updated_at','force'].includes(key)))
        return fail('Invalid deletion confirmation');
      forceRequested=body.force===true;
      if('force' in body&&body.force!==true)return fail('Invalid force option');
      if(forceRequested&&!canForce)
        return fail('管理员强制删除尚未启用，须先执行迁移 016 并启用开关。',503,'FORCE_DELETE_NOT_READY');
    }
    let result;
    try{result=await inspect(env,id,force||forceRequested);}catch(error){
      console.error('Permanent SKU deletion safety check failed',String(error));
      return fail('无法验证产品关联记录，未执行删除。',503);
    }
    if(request.method==='GET'){
      return json(result.status===200?{eligible:true,product:result.product,
        force_enabled:canForce,disposal_mode:result.linked.length?'audit_tombstone':'physical_or_audit_tombstone'}:
        {eligible:false,error:result.error,code:result.code,product:result.product,
          force_enabled:canForce},result.status===404?404:200);
    }
    if(result.status!==200)return fail(result.error,result.status,result.code);
    if(body.confirm_sku!==result.product.code||
      !body.confirm_sku||typeof body.expected_updated_at!=='string'||
      body.expected_updated_at!==result.product.updated_at)
      return fail('SKU confirmation or version mismatch; refresh',409,'DELETE_CONFIRMATION_MISMATCH');

    // Unreferenced rows may be truly deleted. FK protection is still active;
    // if a previously unknown FK exists, privileged requests safely fall back
    // to an audit tombstone instead of disabling triggers or foreign keys.
    if(!result.linked?.length){
      const guards=(result.existing||[]).map(table=>
        " AND NOT EXISTS(SELECT 1 FROM "+table+" WHERE product_id=products.id)");
      const sql="DELETE FROM products WHERE id=? AND code=? AND updated_at=? "+
        (forceRequested?"":"AND lower(status) IN ("+allowStatuses.map(()=>'?').join(',')+")")+
        guards.join('');
      try{
        const args=[id,result.product.code,result.product.updated_at,
          ...(forceRequested?[]:allowStatuses)];
        const deleted=await env.DB.prepare(sql).bind(...args).run();
        if(Number(deleted.meta?.changes)===1)
          return json({success:true,id,deleted_sku:result.product.code,
            sku_reusable:true,disposal_mode:'physical',physically_removed:true,
            r2_preserved:true});
        // Metadata may be wrong; inspect actual row before concluding.
        const exists=await env.DB.prepare("SELECT id FROM products WHERE id=?").bind(id).first();
        if(!exists)return json({success:true,id,deleted_sku:result.product.code,
          sku_reusable:true,disposal_mode:'physical',physically_removed:true,r2_preserved:true});
        if(!forceRequested)return fail('Product changed or has related history; refresh',409,'PRODUCT_DELETE_CONFLICT');
      }catch(error){
        if(!forceRequested){
          if(/constraint|foreign key|immutable|trigger/i.test(String(error)))
            return fail('关联数据受保护，无法安全删除此 SKU。',409,'PRODUCT_DELETE_REFERENCED');
          console.error('Permanent product deletion failed',String(error));
          return fail('删除操作失败，未确认完成。请刷新产品列表。',503);
        }
        if(!/constraint|foreign key|immutable|trigger/i.test(String(error))){
          console.error('Privileged physical delete failed',String(error));
          return fail('无法确认物理删除是否完成，请刷新核对。',503);
        }
      }
    }
    if(!forceRequested)return fail('产品有关联记录，不能使用普通删除。',409,'PRODUCT_HAS_HISTORY');
    return retireWithAudit(env,result.product,auth.user.id);
  };
}
