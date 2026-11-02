// PZ V2 phase-2: unauthenticated, read-only Staging gate.
// No credentials, writes, production endpoints or mutation requests.
const preview=process.env.PZ_PHASE2_PREVIEW_URL||'https://feature-pz-v2-two-stage-prod.pz-website-lw7.pages.dev';
const parsed=new URL(preview);
if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.pz-website-lw7.pages.dev')||
  parsed.hostname==='pz-website-lw7.pages.dev'||parsed.username||parsed.password||
  parsed.pathname!=='/'||parsed.search||parsed.hash) throw Error('Refusing non-Preview URL: '+preview);
const worker='https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev';
const cases=[
 [parsed.origin+'/api/site-config',200,'Preview public configuration'],
 [parsed.origin+'/api/admin/org/departments',401,'Phase-1 organization roles preserved'],
 [parsed.origin+'/api/admin/reviews',401,'Preview admin final review'],
 [parsed.origin+'/api/supervisor/reviews',401,'Preview supervisor first review'],
 [worker+'/admin/org/departments',401,'Direct Staging organization roles'],
 [worker+'/admin/reviews',401,'Direct Staging final-review API'],
 [worker+'/supervisor/reviews',401,'Direct Staging first-review API']
];
let failed=0;
for(const [url,expected,label] of cases){
 let actual=0,body='';
 try{
  const response=await fetch(url,{method:'GET',redirect:'manual',
    headers:{Accept:'application/json','Cache-Control':'no-store'},
    signal:AbortSignal.timeout(12000)});
  actual=response.status;
  if(actual!==expected){
   body=(await response.text().catch(()=>'')).replace(/\s+/g,' ').slice(0,260);
  }
 }catch(error){body=String(error).slice(0,180);}
 const ok=actual===expected;
 if(!ok)failed++;
 console.log((ok?'PASS':'FAIL')+' '+label+' expected='+expected+' actual='+actual+
   (body?' response='+body:''));
}
console.log('PHASE2_STAGING_RESULT '+(failed===0?'READ_ONLY_GATE_PASS':'NOT_READY')+
  ' failures='+failed);
if(failed)process.exitCode=1;
