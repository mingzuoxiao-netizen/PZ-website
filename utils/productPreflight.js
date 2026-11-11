/**
 * Task 11: framework-free, shared preflight rules used by the React editor and
 * Cloudflare Worker. This module contains no browser or Worker-specific APIs.
 * Saving an incomplete draft is always permitted. Submission is NOT.
 */
const ISSUE = (field,code,en,zh,severity='error')=>({field,code,en,zh,severity});
const ALLOWED_ROLES=new Set(['main','lifestyle','detail','dimension','material','packaging']);
export function preflightProduct(product,{existingSku=false}={}){
  const errors=[],warnings=[];
  const add=(field,code,en,zh,severity='error')=>
    (severity==='warning'?warnings:errors).push(ISSUE(field,code,en,zh,severity));
  const value=(key)=>String(product?.[key]??'').trim();
  const name=value('name'), code=value('code').toUpperCase(),category=value('category');
  if(!name||/^[0-9\s.,+-]+$/.test(name)||/\b(?:test|demo|sample)\b|测试/i.test(name))
    add('name','name_required','Provide a meaningful English product name','请填写有效英文产品名称');
  else if(!/[a-z]{2,}/i.test(name)||/^[A-Z0-9_-]+$/.test(name)||/[\u3400-\u9fff]/u.test(name))
    add('name','name_language','Use descriptive English words, not a SKU or Chinese text','英文名称请使用有意义的英文词语，不要填写SKU或中文');
  else if(name.length>20&&name===name.toUpperCase())
    add('name','name_caps','Check all-caps English product name','英文产品名称全部大写，请核对','warning');
  const cn=value('name_cn');
  if(cn&&/^[a-z0-9\s,._-]+$/i.test(cn))
    add('name_cn','name_cn_language','Chinese product name appears to contain only Latin text','中文产品名称似乎只有英文，请核对','warning');
  if(!/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code))
    add('code','sku_invalid','Use a valid PZ- SKU','SKU 必须使用 PZ- 编号格式');
  if(existingSku)add('code','sku_duplicate','This SKU already exists','SKU 已经存在，请核对编号');
  if(!category)add('category','category_required','Choose a product category','请选择产品分类');
  if(!value('material'))add('material','material_required','Fill primary material','请填写主要材质');
  if(!value('description'))add('description','description_required','Fill English product description','请填写英文产品描述');
  const images=Array.isArray(product?.images)?product.images:[];
  if(images.length<4)
    add('images','images_minimum','Upload at least four product images','请至少上传4张产品图片');
  const raw=product?.specifications??product?.specs_json??{};
  let specs=raw;
  if(typeof raw==='string')try{specs=JSON.parse(raw);}catch{specs={};}
  if(!specs||typeof specs!=='object')specs={};
  const roles=specs.media_roles||{};
  images.forEach((image,i)=>{
    if(typeof image!=='string'||!image.trim())add('images','image_invalid','Remove empty product image references','图片不能是空链接');
    else if(!ALLOWED_ROLES.has(roles[image]))
      add('images','image_role_missing','Assign a role to each image ('+(i+1)+')','请为第'+(i+1)+'张图片设置用途');
  });
  if(images.length&&roles[images[0]]!=='main')
    add('images','image_cover_role','Set the first image role to main','第一张图片必须设置为主图');
  if(images.length!==new Set(images).size)
    add('images','image_duplicate','The same image is attached more than once','同一张图片重复使用，请核对','warning');
  const d=specs.dimensions_cm||{};
  const surface=/butcher|work.surface|countertop|panel|wood.top|cutting.board/i.test(category);
  const chair=/chair|bench|stool|seating/i.test(category);
  const keys=surface?['length','width','thickness']:chair?['width','length','height']:['length','width','height'];
  for(const key of keys){
    const n=d[key];
    if(typeof n!=='number'||!Number.isFinite(n)||n<=0)
      add('dimensions_cm.'+key,'dimension_required','Enter a valid positive '+key+' (cm)','请填写有效的'+key+'尺寸（厘米）');
  }
  for(const [key,n] of Object.entries(d)){
    if(typeof n==='number'&&Number.isFinite(n)&&n>300)
      add('dimensions_cm.'+key,'dimension_units','Dimension over 300 cm; check units','尺寸超过300厘米，请核对单位','warning');
  }
  if(/dining.*table|dining-table|table.dining|(^|[^a-z])table(s)?([^a-z]|$)/i.test(category)){
    const h=d.height;
    if(typeof h==='number'&&Number.isFinite(h)&&(h<68||h>82))
      add('dimensions_cm.height','table_height_range','Table height outside 68–82 cm; check','餐桌高度不在68–82厘米范围内，请核对','warning');
  }
  if(chair){
    const seat=Number(specs.attributes?.seat_height);
    if(Number.isFinite(seat)&&seat>0&&(seat<35||seat>55))
      add('attributes.seat_height','chair_seat_height','Seat height outside 35–55 cm; check','座高不在35–55厘米范围内，请核对','warning');
  }
  return {errors,warnings};
}
