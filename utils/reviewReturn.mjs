// Field-level return protocol for two-stage NEW-product reviews.
// Uses existing immutable review events and version snapshots: no D1 migration.
export const RETURN_PREFIX='PZ_FIELD_RETURN_V1:';
const ROOTS=new Set(['name','name_cn','code','category','sub_category','material','finish',
  'size','description','description_cn','images','production_sites','specifications',
  'dimensions_cm','attributes','packaging','verification','media_roles']);
const isField=value=>typeof value==='string'&&value.length<=100&&
  /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*){0,3}$/.test(value)&&
  ROOTS.has(value.split('.')[0]);
export function validateReturnIssues(raw){
  if(!Array.isArray(raw)||raw.length<1||raw.length>20)
    throw Error('Choose 1–20 fields to return');
  const issues=[],used=new Set();
  for(const item of raw){
    const field=String(item?.field??'').trim();
    const message=String(item?.message??'').trim();
    if(!isField(field)||message.length<3||message.length>500||used.has(field))
      throw Error('Each return issue needs a unique product field and a 3–500 character message');
    used.add(field);issues.push({field,message});
  }
  return issues;
}
export function serializeReturnEvent(note,issues){
  const text=String(note||'').trim();
  return RETURN_PREFIX+JSON.stringify({note:text,issues:validateReturnIssues(issues)});
}
export function readReturnEvent(note){
  if(typeof note==='string'&&note.startsWith(RETURN_PREFIX)){
    try{
      const raw=JSON.parse(note.slice(RETURN_PREFIX.length));
      const issues=validateReturnIssues(raw.issues);
      return {note:String(raw.note||''),issues,legacy:false};
    }catch{/* malformed historical notes are displayed, never executed */}
  }
  return {note:typeof note==='string'?note:'',issues:[],legacy:true};
}
export function normalizeIssueField(field){
  if(typeof field!=='string')return '';
  return field.startsWith('specifications.')?field.slice('specifications.'.length):field;
}
// Avoid ephemeral review/audit fields when computing the return-version delta.
const EXCLUDED=new Set(['preflight_warnings','review_metadata','return_issues','updated_at','status']);
export function changedProductFields(previous,next){
  const out=new Set();
  const visit=(a,b,prefix='',depth=0)=>{
    if(depth>6){if(JSON.stringify(a)!==JSON.stringify(b))out.add(prefix);return;}
    if(a===b)return;
    const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
    if(object(a)&&object(b)){
      const keys=new Set([...Object.keys(a),...Object.keys(b)]);
      for(const key of keys){
        if(!prefix&&(!ROOTS.has(key)||EXCLUDED.has(key)))continue;
        visit(a[key],b[key],prefix?prefix+'.'+key:key,depth+1);
      }
      return;
    }
    if(JSON.stringify(a)!==JSON.stringify(b)&&prefix)out.add(normalizeIssueField(prefix));
  };
  visit(previous||{},next||{});
  return [...out].filter(Boolean).sort();
}
export function isRecheck(review){
  return Number(review?.latest_version||0)>1 &&
    ['pending_supervisor','pending_admin','approved_pending_publish'].includes(String(review?.status||''));
}
