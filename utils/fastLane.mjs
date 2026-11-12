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
  for(const [key,value] of Object.entries(specs.attributes||{})){
    if(riskyAttribute.test(key)&&hasValue(value))return true;
  }
  for(const key of ['evidence','certifications','certificates','testing','claims']){
    if(hasValue(specs[key]))return true;
  }
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
