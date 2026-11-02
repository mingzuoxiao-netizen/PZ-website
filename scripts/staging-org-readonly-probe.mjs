// Read-only live Staging probe: safe to run from CI without credentials.
// Never posts / changes Cloudflare data; never falls back to Production.
const DEFAULT_BASE='https://feature-pz-v2-organization-r.pz-website-lw7.pages.dev';
const base=process.env.PZ_ORG_STAGING_PREVIEW_URL||DEFAULT_BASE;
const target=new URL(base);
if(target.protocol!=='https:' ||
   !target.hostname.endsWith('.pz-website-lw7.pages.dev') ||
   target.hostname==='pz-website-lw7.pages.dev' ||
   target.username||target.password||target.pathname!=='/'||target.search||target.hash)
   throw Error('Refusing non-Preview or non-HTTPS target: '+base);
const cases=[
  ['/api/site-config',200,'Public Staging configuration'],
  ['/api/admin/products',401,'Admin auth isolation'],
  ['/api/admin/org/departments',401,'Organization management route installed'],
  ['/api/supervisor/accounts',401,'Supervisor management route installed'],
];
let failures=0;
for(const [path,expected,label] of cases){
  const uri=target.origin+path;
  let status=0,detail='';
  try{
    const response=await fetch(uri,{
      method:'GET',redirect:'manual',
      headers:{'Accept':'application/json','Cache-Control':'no-store'},
      signal:AbortSignal.timeout(12000)
    });
    status=response.status;
    if(status!==expected){
      const raw=await response.text().catch(()=>'');
      detail=raw.replace(/\s+/g,' ').slice(0,220);
      failures++;
    }
  }catch(error){failures++;detail=String(error).slice(0,180);}
  console.log((status===expected?'PASS':'FAIL')+' '+label+' '+path+' expected='+expected+' actual='+status+(detail?' detail='+detail:''));
}
// Isolate Cloudflare Pages routing from the dedicated Staging Worker deployment.
const stagingWorker='https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev';
for(const [path,label] of [
  ['/admin/org/departments','Direct Staging Worker organization route'],
  ['/supervisor/accounts','Direct Staging Worker supervisor route']
]){
  let status=0,detail='';
  try{
    const response=await fetch(stagingWorker+path,{
      method:'GET',redirect:'manual',
      headers:{'Accept':'application/json','Cache-Control':'no-store'},
      signal:AbortSignal.timeout(12000)
    });
    status=response.status;
    if(status!==401){
      const raw=await response.text().catch(()=>'');
      detail=raw.replace(/\s+/g,' ').slice(0,220);
      failures++;
    }
  }catch(error){failures++;detail=String(error).slice(0,180);}
  console.log((status===401?'PASS':'FAIL')+' '+label+' '+path+' expected=401 actual='+status+(detail?' detail='+detail:''));
}
if(failures){
  console.error(
    'Staging smoke check is NOT ready. Verify Pages Preview PZ_BACKEND_WORKER uses the dedicated Staging Worker;'+
    ' apply migration 009 to Staging D1 and deploy the staging REVIEW Worker. Do not switch to Production.'
  );
  process.exitCode=1;
}else console.log('Staging read-only API smoke check passed (no authenticated data changed).');
