// Task 15: D1-only, idempotent bulk CSV -> DRAFT product importer.
// No direct product-update, submit-for-review, publish, or public-catalog mutation.
import {mapImportRow,attachImageRoles,normalizeSku,IMPORT_LIMIT} from '../utils/bulkImportCore.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fail=(json,error,status=400)=>json({error},status);
const now=()=>new Date().toISOString();
const safeCode=value=>String(value||'').slice(0,80);
const validFiles=(raw,imageBase)=>{
  if(!Array.isArray(raw)||raw.length>12)return false;
  if(!imageBase&&raw.length)return false;
  const seen=new Set();
  return raw.every(x=>{
    if(!x||typeof x.url!=='string'||typeof x.role!=='string'||
       !['main','lifestyle','detail','material','dimension','packaging'].includes(x.role))return false;
    if(seen.has(x.url))return false;
    seen.add(x.url);
    try{
      const url=new URL(x.url);
      const key=decodeURIComponent(url.pathname.replace(/^\//,''));
      return url.origin===imageBase&&!url.search&&!url.hash&&
        /^uploads\/[a-zA-Z0-9_-]{1,120}\.(jpe?g|png|webp)$/.test(key);
    }catch{return false;}
  });
};
const mappedRow=(row,imageBase,validateSpecs)=>{
  if(!row||!Number.isSafeInteger(row.row)||row.row<=1||
    !row.cells||typeof row.cells!=='object'||Array.isArray(row.cells)||
    Object.keys(row.cells).length>80||
    Object.values(row.cells).some(v=>typeof v!=='string'||v.length>3000))
    return {row:row?.row||0,code:'',valid:false,issues:[{
      row:row?.row||0,field:'row',severity:'error',message:'Invalid CSV source row'
    }]};
  const base=mapImportRow(row);
  const images=Array.isArray(row.images)?row.images:[];
  if(!validFiles(images,imageBase)){
    return {...base,valid:false,issues:[...base.issues,{
      row:row.row,field:'images',severity:'error',message:'Image must use the existing R2 upload URL'
    }]};
  }
  const normalized=attachImageRoles(base,images);
  const specs=validateSpecs(normalized.product.specifications);
  if(specs.error)normalized.issues.push({
    row:row.row,field:'specifications',severity:'error',message:specs.error
  });
  normalized.valid=!normalized.issues.some(x=>x.severity==='error');
  return normalized;
};
async function resultsForBatch(env,id){
  const rows=await env.DB.prepare(
    'SELECT row_number AS row,code,disposition,product_id,reason FROM pz_product_import_rows '+
    'WHERE batch_id=? ORDER BY row_number'
  ).bind(id).all();
  const batch=await env.DB.prepare(
    'SELECT id,owner_id,imported_by,input_count,inserted_count,skipped_count,failed_count,finished_at '+
    'FROM pz_product_import_batches WHERE id=?'
  ).bind(id).first();
  return {batch_id:id,owner_id:batch?.owner_id,inserted:Number(batch?.inserted_count||0),
    skipped:Number(batch?.skipped_count||0),failed:Number(batch?.failed_count||0),
    completed:!!batch?.finished_at,rows:rows.results||[]};
}
export function bulkImportFetch(originalFetch,{authorize,json,canManageProduct,validateSpecs,imageBase}){
  return async function(request,env,ctx){
    const url=new URL(request.url),path=url.pathname,method=request.method;
    const adminRoute=path==='/admin/products/import-drafts';
    const factoryRoute=path==='/factory/products/import-drafts';
    const operators=path==='/admin/products/import-operators';
    const batchDetail=path.match(/^\/(admin|factory)\/products\/import-batches\/([0-9a-f-]{36})$/i);
    if(!adminRoute&&!factoryRoute&&!operators&&!batchDetail)
      return originalFetch.call(this,request,env,ctx);
    const roles=adminRoute||operators||batchDetail?.[1]==='admin'?['ADMIN']:['FACTORY'];
    const auth=await authorize(request,env,roles);
    if(auth instanceof Response)return auth;
    if(env.PZ_BULK_IMPORT_ENABLED!=='true')
      return fail(json,'Bulk draft import is disabled for this Worker environment',503);
    if(env.PZ_ORG_RBAC_ENABLED!=='true')
      return fail(json,'Organization RBAC is required',503);
    const actor=auth.user.id;
    try{
      if(operators&&method==='GET'){
        const staff=await env.DB.prepare(
          "SELECT u.id,u.username,a.department_id FROM users u "+
          "JOIN pz_staff_assignments a ON a.user_id=u.id "+
          "JOIN pz_departments d ON d.id=a.department_id AND d.is_active=1 "+
          "JOIN users s ON s.id=a.supervisor_id AND s.is_active=1 AND s.deleted_at IS NULL "+
          "JOIN pz_staff_assignments sa ON sa.user_id=s.id AND sa.job_type='supervisor' "+
          "AND sa.department_id=a.department_id "+
          "WHERE u.is_active=1 AND u.deleted_at IS NULL "+
          "AND a.job_type IN ('staff','secretary','data_entry') ORDER BY u.username LIMIT 500"
        ).all();
        return json({operators:staff.results||[]});
      }
      if(batchDetail&&method==='GET'){
        if(!uuid.test(batchDetail[2]))return fail(json,'Invalid batch ID');
        const batch=await env.DB.prepare(
          'SELECT imported_by,owner_id,finished_at FROM pz_product_import_batches WHERE id=?'
        ).bind(batchDetail[2]).first();
        if(!batch)return fail(json,'Import batch not found',404);
        if(auth.user.role!=='ADMIN'&&batch.imported_by!==actor&&batch.owner_id!==actor)
          return fail(json,'Import batch not found',404);
        return json(await resultsForBatch(env,batchDetail[2]));
      }
      if(method!=='POST'||(!adminRoute&&!factoryRoute))return fail(json,'Method not allowed',405);
      const length=Number(request.headers.get('content-length')||0);
      if(length>1_500_000)return fail(json,'Import payload exceeds 1.5 MB',413);
      const text=await request.text();
      if(text.length>1_500_000)return fail(json,'Import payload exceeds 1.5 MB',413);
      let data;try{data=JSON.parse(text);}catch{return fail(json,'Invalid import JSON');}
      if(!data||!uuid.test(String(data.batch_id||''))||
         !Array.isArray(data.rows)||data.rows.length<1||data.rows.length>IMPORT_LIMIT)
        return fail(json,'Send 1–100 CSV rows and a UUID batch ID');
      const owner=adminRoute?String(data.owner_id||''):actor;
      if(!owner||owner.length>128||(factoryRoute&&data.owner_id&&data.owner_id!==actor))
        return fail(json,'Owner does not match authenticated operator',403);
      const assigned=await env.DB.prepare(
        "SELECT u.id FROM users u JOIN pz_staff_assignments a ON a.user_id=u.id "+
        "JOIN pz_departments d ON d.id=a.department_id "+
        "JOIN users s ON s.id=a.supervisor_id "+
        "JOIN pz_staff_assignments sa ON sa.user_id=s.id AND sa.job_type='supervisor' "+
        "AND sa.department_id=a.department_id "+
        "WHERE u.id=? AND u.is_active=1 AND u.deleted_at IS NULL "+
        "AND a.job_type IN ('staff','secretary','data_entry') AND d.is_active=1 "+
        "AND s.is_active=1 AND s.deleted_at IS NULL LIMIT 1"
      ).bind(owner).first();
      if(!assigned||(!adminRoute&&!(await canManageProduct(env,actor))))
        return fail(json,'Active operator and supervisor assignment required',403);
      const existing=await env.DB.prepare(
        'SELECT id,imported_by,owner_id,finished_at FROM pz_product_import_batches WHERE id=?'
      ).bind(data.batch_id).first();
      if(existing){
        if(existing.imported_by!==actor||existing.owner_id!==owner)return fail(json,'Batch ID belongs to another owner',409);
        if(!existing.finished_at)return fail(json,'Import is incomplete; reconcile this batch before retrying',409);
        return json({...await resultsForBatch(env,existing.id),already_processed:true});
      }
      const numberSet=new Set(),codeSet=new Set(),mapped=[];
      for(const entry of data.rows){
        const row=mappedRow(entry,imageBase(env),validateSpecs);
        if(!Number.isSafeInteger(row.row)||row.row<=1||numberSet.has(row.row))
          return fail(json,'Duplicate or invalid CSV source row number');
        numberSet.add(row.row);
        if(row.valid&&codeSet.has(row.code)){
          row.valid=false;row.issues.push({row:row.row,field:'code',severity:'error',message:'Duplicate SKU within this CSV batch'});
        }
        if(row.valid)codeSet.add(row.code);
        mapped.push(row);
      }
      const at=now();
      await env.DB.prepare(
        "INSERT INTO pz_product_import_batches (id,imported_by,owner_id,created_at,input_count) VALUES(?,?,?,?,?)"
      ).bind(data.batch_id,actor,owner,at,mapped.length).run();
      let inserted=0,skipped=0,failed=0;
      const outcomes=[];
      for(const entry of mapped){
        const issues=entry.issues||[];
        let disposition='invalid',productId=null;
        let reason=issues.filter(x=>x.severity==='error').map(x=>x.field+': '+x.message).join('；').slice(0,1000);
        if(entry.valid){
          const p=entry.product,id=crypto.randomUUID();
          try{
            const result=await env.DB.prepare(
              'INSERT INTO products (id,name,name_cn,category,sub_category,material,size,finish,code,'+
              'description,description_cn,images,status,created_at,updated_at,production_sites,org_id,'+
              'created_by,specs_json,import_batch_id) '+
              'SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? '+
              'WHERE NOT EXISTS (SELECT 1 FROM products WHERE UPPER(TRIM(code))=?)'
            ).bind(
              id,p.name,p.name_cn,p.category,p.sub_category,p.material,
              p.specifications.dimensions_cm?[
                p.specifications.dimensions_cm.length,p.specifications.dimensions_cm.width,
                p.specifications.dimensions_cm.height||p.specifications.dimensions_cm.thickness
              ].filter(x=>x!==undefined).join(' × ')+' cm':'',
              p.finish,p.code,p.description,p.description_cn,JSON.stringify(p.images),
              'draft',at,at,JSON.stringify(p.production_sites),'org-main',owner,
              JSON.stringify(p.specifications),data.batch_id,normalizeSku(p.code)
            ).run();
            if(Number(result.meta?.changes)===1){disposition='imported';productId=id;inserted++;}
            else{disposition='existing';reason='SKU already exists (not overwritten)';skipped++;}
          }catch(error){
            if(/UNIQUE|constraint/i.test(String(error))){disposition='existing';reason='SKU already exists (not overwritten)';skipped++;}
            else{disposition='invalid';reason='Database save failed; check batch before retry';failed++;}
          }
        }else failed++;
        await env.DB.prepare(
          'INSERT INTO pz_product_import_rows(batch_id,row_number,code,disposition,product_id,reason,created_at) '+
          'VALUES(?,?,?,?,?,?,?)'
        ).bind(data.batch_id,entry.row,safeCode(entry.code),disposition,productId,reason,at).run();
        outcomes.push({row:entry.row,code:entry.code,disposition,product_id:productId,reason,issues});
      }
      await env.DB.prepare(
        'UPDATE pz_product_import_batches SET finished_at=?,inserted_count=?,skipped_count=?,failed_count=? WHERE id=?'
      ).bind(now(),inserted,skipped,failed,data.batch_id).run();
      return json({batch_id:data.batch_id,owner_id:owner,inserted,skipped,failed,
        completed:true,rows:outcomes},200);
    }catch(error){
      if(/no such table|no such column/i.test(String(error)))
        return fail(json,'Staging D1 migration 020 required',503);
      if(/UNIQUE|constraint/i.test(String(error)))
        return fail(json,'Import conflict; inspect recorded batch before retry',409);
      console.error('Bulk draft import failed; batch may be partially committed',String(error?.name||'Error'));
      return fail(json,'Bulk import state uncertain: inspect batch ID before retry',503);
    }
  };
}
