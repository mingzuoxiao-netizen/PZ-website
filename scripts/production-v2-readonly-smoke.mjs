// PZ V2 Production cutover smoke: unauthenticated GET ONLY, never writes.
// Runs from GitHub Actions; intentionally cannot access passwords, D1 or KV.
// This does NOT prove deployment source/version, flags or authenticated workflows.
const cases=[
  ['https://www.peng-zhan.com/','html','Production homepage'],
  ['https://www.peng-zhan.com/api/site-config','config','Public Pages site config'],
  ['https://www.peng-zhan.com/api/products','products','Public Pages catalog'],
  ['https://pz-inquiry-api.mingzuoxiao29.workers.dev/api/site-config','config','Direct Worker site config'],
  ['https://pz-inquiry-api.mingzuoxiao29.workers.dev/public/products','products','Direct Worker published catalog'],
  ['https://pz-inquiry-api.mingzuoxiao29.workers.dev/admin/org/departments','protected','Unauthenticated organization admin'],
  ['https://pz-inquiry-api.mingzuoxiao29.workers.dev/admin/reviews','protected','Unauthenticated admin product review'],
  ['https://pz-inquiry-api.mingzuoxiao29.workers.dev/supervisor/reviews','protected','Unauthenticated supervisor product review']
];
const allowed=new Set([
 'https://www.peng-zhan.com',
 'https://pz-inquiry-api.mingzuoxiao29.workers.dev'
]);
let failures=0, unverified=0;
for(const [url,kind,name] of cases){
  const parsed=new URL(url);
  if(!allowed.has(parsed.origin)||parsed.username||parsed.password||parsed.hash||parsed.search)
    throw Error('Unsafe smoke URL rejected');
  let status=0,reason='';
  try{
    const response=await fetch(url,{method:'GET',redirect:'manual',
      headers:{Accept:kind==='html'?'text/html':'application/json','Cache-Control':'no-store'},
      signal:AbortSignal.timeout(12000)});
    status=response.status;
    // GitHub-hosted runners are sometimes blocked by the website's Cloudflare
    // bot/WAF rules. A 403 on the public Pages domain is INCONCLUSIVE,
    // not evidence that a real visitor is blocked or that the endpoint is healthy.
    if(parsed.hostname==='www.peng-zhan.com'&&status===403){
      console.log('UNVERIFIED '+name+' HTTP 403 (CI runner blocked; confirm in normal browser)');
      unverified++;
      continue;
    }
    const safe=kind==='protected'?[401,403,404,405].includes(status):status===200;
    if(!safe){reason='unexpected HTTP status';}
    else if(kind==='config'){
      const body=await response.json();
      const config=body?.config??body;
      if(!Array.isArray(config?.categories))reason='missing categories array';
    }else if(kind==='products'){
      const body=await response.json();
      if(!Array.isArray(body?.items))reason='missing items array';
    }else if(kind==='html'){
      const html=await response.text();
      if(!html.toLowerCase().includes('<html'))reason='missing HTML document';
    }
  }catch(e){reason=String(e).replace(/https?:\/\/[^\s]+/g,'<URL>').slice(0,200);}
  const ok=!reason;
  console.log((ok?'PASS':'FAIL')+' '+name+' HTTP '+status+(reason?' '+reason:''));
  failures+=Number(!ok);
}
console.log('PZ_PRODUCTION_READ_ONLY '+(failures===0?'WORKER_PASS':'FAIL')+
  ' failures='+failures+' browser_checks_unverified='+unverified);
if(unverified)console.log('ACTION_REQUIRED: test Production homepage and Pages /api in a regular browser');
if(failures)process.exitCode=1;
