// Task 13: risk-based, audit-gated fast lane. Pure policy functions.
// Fast lane is NEVER implicit: requires explicit Worker flag, DB setting,
// Admin-granted trust, reviewed publication history, and a safe product.
const riskyAttribute=/^(tested_load|shelf_load|certification|certificate|certifications|evidence_file|load_test|tested_|certified_|verified_|compliance_|safety_test)/i;
const hasValue=value=>{
  if(value==null)return false;
  if(typeof value==='string')return value.trim().length>0;
  if(Array.isArray(value))return value.some(hasValue);
  if(typeof value==='object')return Object.values(value).some(hasValue);
  return value!==false;
};
export function hasEvidenceClaims(product){
  let specs=product?.specifications??product?.specs_json??{};
  if(typeof specs==='string'){try{specs=JSON.parse(specs);}catch{return true;}}
  if(!specs||typeof specs!=='object'||Array.isArray(specs))return true;
  // Even unverified/canceled declarations carry compliance context and
  // must go through independent Admin review.
  if(Array.isArray(specs.verification)?specs.verification.length>0:hasValue(specs.verification))
    return true;
  // Certificate attachments require independent Admin review, including internal files.
  if(Array.isArray(specs.attachments)&&specs.attachments.some(file=>
    file?.type==='certificate'||/certif|evidence|load[ _-]?test|认证|检测|承重/i.test(String(file?.file_name||''))))
    return true;
  for(const [key,value] of Object.entries(specs.attributes||{})){
    if(riskyAttribute.test(key)&&hasValue(value))return true;
  }
  for(const key of ['evidence','certifications','certificates','testing','claims']){
    if(hasValue(specs[key]))return true;
  }
  // Claim language can also be entered as free text instead of the structured
  // verification/attribute fields; require Admin review rather than guessing.
  const claims=[
    product?.name,product?.name_cn,product?.description,product?.description_cn,
    specs?.selling_points_en,specs?.selling_points_cn,specs?.selling_points_zh
  ].flatMap(value=>Array.isArray(value)?value:[value]).filter(x=>typeof x==='string').join(' ');
  if(/\b(?:tested\s+(?:load|capacity)|load[\s-]?bearing|weight\s+capacity|certif(?:ied|ication)|lab[\s-]?tested|FSC|BIFMA|ASTM|UL\s?\d{2,})\b|承重|检测报告|认证|载重测试|安全测试/i.test(claims))
    return true;
  return false;
}
export function trustedHistory({clean=0,audited=0,legacy=0}={}){
  const cleanCount=Number(clean)||0,auditedCount=Number(audited)||0,legacyCount=Number(legacy)||0;
  const fallback=auditedCount<10&&legacyCount>0;
  return {qualifies:cleanCount>=10||fallback,history_fallback:fallback,clean_publishes:cleanCount,
    audited_publishes:auditedCount,legacy_publishes:legacyCount};
}
export function fastLaneDecision({workerEnabled=false,siteEnabled=false,adminTrusted=false,
  history={qualifies:false},categoryPreviouslyPublished=false,product={}}={}){
  if(workerEnabled!==true)return {eligible:false,reason:'worker_disabled'};
  if(siteEnabled!==true)return {eligible:false,reason:'admin_disabled'};
  if(adminTrusted!==true)return {eligible:false,reason:'not_admin_trusted'};
  if(history.qualifies!==true)return {eligible:false,reason:'insufficient_clean_history'};
  if(categoryPreviouslyPublished!==true)return {eligible:false,reason:'unfamiliar_category'};
  if(hasEvidenceClaims(product))return {eligible:false,reason:'verification_or_load_claim'};
  return {eligible:true,reason:'eligible',history_fallback:history.history_fallback===true};
}
