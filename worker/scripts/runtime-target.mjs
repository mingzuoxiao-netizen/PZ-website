// Build-time target selection for the imported production baseline.
// Never derive the expected runtime from a request or from untrusted env values.
export function renderRuntimeTarget(source,target){
  if(!['staging','production'].includes(target))throw Error('Explicit staging or production target required');
  if(target==='production')return source;
  const replace=(before,after,count)=>{
    if(source.split(before).length-1!==count)throw Error('Runtime target anchor changed: '+before);
    source=source.split(before).join(after);
  };
  replace("expectedRuntime:'production'","expectedRuntime:'staging'",4);
  replace("runtimeExpected: 'production'","runtimeExpected: 'staging'",1);
  replace("if (String(env.PZ_RUNTIME_ENV || '').toLowerCase() !== 'production') {",
    "if (String(env.PZ_RUNTIME_ENV || '').toLowerCase() !== 'staging') {",1);
  replace("if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!=='production')",
    "if(String(env.PZ_RUNTIME_ENV||'').toLowerCase()!=='staging')",1);
  replace('if (env.PZ_RUNTIME_ENV !== "production") {',
    'if (env.PZ_RUNTIME_ENV !== "staging") {',1);
  replace("  if (runtime !== 'production' || configured !== 'https://cdn.peng-zhan.com') return null;\n  return configured;",
    "  if (runtime !== 'staging') return null;\n  return pzConfiguredImageBase(env);",1);
  return source;
}
