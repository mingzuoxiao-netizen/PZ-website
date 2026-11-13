// Atomic draft update shared by Worker and regression tests.
// CAS must be enforced in SQL, not a browser/SELECT pre-check. Review transitions
// may update timestamp without incrementing edit_revision: require BOTH tokens.
export function validEditToken(value,revision){
  return typeof value==='string'&&value.length>0&&value.length<=64&&
    Number.isSafeInteger(revision)&&revision>=0;
}
export async function saveDraftWithCas(env,{
  id,actor,expectedUpdatedAt,expectedRevision,db,
  allowReturned=false,now=new Date().toISOString()
}){
  if(!validEditToken(expectedUpdatedAt,expectedRevision))
    return {status:428,body:{error:'缺少编辑版本信息，请重新打开产品后保存。',
      code:'PRODUCT_EDIT_VERSION_REQUIRED'}};
  const result=await env.DB.prepare(
    "UPDATE products SET "+
    "name=?,name_cn=?,category=?,sub_category=?,material=?,size=?,finish=?,code=?,"+
    "description=?,description_cn=?,images=?,"+
    "production_sites=COALESCE(?,production_sites),specs_json=COALESCE(?,specs_json),"+
    "updated_at=?,edit_revision=edit_revision+1,last_editor_id=? "+
    "WHERE id=? AND edit_revision=? AND updated_at=? AND deleted_at IS NULL "+
    "AND (lower(status) IN ('draft','rejected') "+
    "OR (lower(status)='returned_to_uploader' AND ?='true'))"
  ).bind(db.name,db.name_cn,db.category,db.sub_category,db.material,db.size,
    db.finish,db.code,db.description,db.description_cn,db.images_json,
    db.production_sites_json,db.specs_json,now,actor,id,expectedRevision,
    expectedUpdatedAt,allowReturned?'true':'false').run();
  if(Number(result?.meta?.changes)>=1)return {
    status:200,body:{success:true,id,updated_at:now,edit_revision:expectedRevision+1}
  };
  const latest=await env.DB.prepare(
    "SELECT p.updated_at,p.edit_revision,p.status,p.last_editor_id,"+
    "COALESCE(u.username,'其他用户') AS editor_name FROM products p "+
    "LEFT JOIN users u ON u.id=p.last_editor_id "+
    "WHERE p.id=? AND p.deleted_at IS NULL"
  ).bind(id).first();
  if(!latest)return {status:404,body:{error:'产品已被删除，无法保存',code:'PRODUCT_NOT_FOUND'}};
  const editor=latest.last_editor_id?latest.editor_name:'其他用户或审核流程';
  return {status:409,body:{
    error:'已被 '+editor+' 在 '+latest.updated_at+' 修改，请查看最新版本后人工合并。',
    code:'PRODUCT_EDIT_CONFLICT',editor_name:editor,changed_at:latest.updated_at,
    current_revision:latest.edit_revision,current_status:latest.status
  }};
}
