import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleD1SiteConfig} from './siteConfigD1Production.mjs';

function fixture({active=true,seeded=true}={}) {
  const original={categories:[{id:'sofa',title:'Sofa',title_cn:'沙发',title_zh:'沙发',subtitle:'Old',
    description:'original',image:'',subCategories:[{name:'Loveseat'}]}],home:{hero:{title:'Home A'}}};
  const state=seeded?{
    id:1,draft_json:JSON.stringify(original),draft_revision:1,
    published_json:JSON.stringify(original),published_revision:1,
    published_version:'old',published_at:'2026-10-01',write_token:'seed',updated_at:'2026-10-01'
  }:null;
  const db={state,changes:[],newRequests:[]};
  const kv={
    'draft:site_config':JSON.stringify(original),
    'published:site_config':JSON.stringify(original),
    'published:meta':JSON.stringify({version:'seed',publishedAt:'2026-10-01'})
  };
  const history=new Map();
  const counters={published:0,draft:0};
  function prepared(sql) {
    let binds=[];
    const stmt={
      bind(...args){binds=args;return this;},
      async first() {
        if(sql.includes('SELECT * FROM site_config_state WHERE id=1'))return db.state?structuredClone(db.state):null;
        if(sql.includes('SELECT id,title,title_cn,subtitle,image,status FROM category_requests'))
          return db.newRequests.find(x=>x.id===binds[0])||null;
        if(sql.includes('SELECT * FROM category_change_requests'))
          return db.changes.find(x=>x.id===binds[0])||null;
        throw Error('Unmocked query '+sql);
      },
      async run(){
        if(sql.includes('INSERT OR IGNORE INTO site_config_state')){
          if(db.state)return {meta:{changes:0}};
          const [draft_json,published_json,published_version,published_at,write_token,updated_at]=binds;
          db.state={id:1,draft_json,draft_revision:1,published_json,published_revision:1,
            published_version,published_at,write_token,updated_at};
          return {meta:{changes:1}};
        }
        if(sql.includes('SET draft_json=?')) {
          const [draft_json,write_token,updated_at,expectedRevision,...condition]=binds;
          if(!db.state || db.state.draft_revision!==expectedRevision)return {meta:{changes:0}};
          if(sql.includes('EXISTS (SELECT 1 FROM')) {
            const [requestId,status]=condition;
            const target=sql.includes('FROM category_requests')?db.newRequests:db.changes;
            if(!target.some(x=>x.id===requestId&&x.status===status))return {meta:{changes:0}};
          }
          Object.assign(db.state,{draft_json,write_token,updated_at,draft_revision:expectedRevision+1});
          counters.draft++;
          return {meta:{changes:1}};
        }
        if(sql.startsWith('UPDATE category_requests SET status=')||
           sql.startsWith('UPDATE category_change_requests SET status=')){
          const [timestamp,requestId,status,token]=binds;
          const target=sql.startsWith('UPDATE category_requests')?db.newRequests:db.changes;
          const match=target.find(x=>x.id===requestId&&x.status===status);
          if(!match || db.state?.write_token!==token)return {meta:{changes:0}};
          match.status='approved';
          match.updated_at=timestamp;
          return {meta:{changes:1}};
        }
        if(sql.includes('SET published_json=?')) {
          const isRollback=sql.includes('WHERE id=1 AND published_revision=?')&&!sql.includes('draft_revision=?');
          if(isRollback) {
            const [published_json,published_version,published_at,updated_at,expectedPub]=binds;
            if(db.state.published_revision!==expectedPub)return {meta:{changes:0}};
            Object.assign(db.state,{published_json,published_version,published_at,updated_at,
              published_revision:expectedPub+1});
          }else{
            const [published_json,published_version,published_at,updated_at,expectedDraft,expectedPub]=binds;
            if(db.state.draft_revision!==expectedDraft||db.state.published_revision!==expectedPub)
              return {meta:{changes:0}};
            Object.assign(db.state,{published_json,published_version,published_at,updated_at,
              published_revision:expectedPub+1});
          }
          counters.published++;
          return {meta:{changes:1}};
        }
        throw Error('Unmocked update '+sql);
      }
    };
    return stmt;
  }
  const env={
    PZ_RUNTIME_ENV:'production',
    PZ_D1_SITE_CONFIG_ENABLED:active?'true':'false',
    PZ_IMAGE_BASE_URL:'https://cdn.peng-zhan.com',
    DB:{
      prepare:prepared,
      // Single transaction: SQL operations in the batch serialize per D1.
      async batch(statements) {
        const results=[];
        for(const s of statements)results.push(await s.run());
        return results;
      }
    },
    SITE_CONFIG_KV:{async get(key){return kv[key]||null}},
    SITE_CONFIG_HISTORY:{
      async put(key,value){history.set(key,value)},
      async get(key){const val=history.get(key);return val?{text:async()=>val}:null}
    }
  };
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json'}});
  const authorize=async (_req,_env,allowed)=>allowed.includes('ADMIN')
    ? {user:{id:'admin-1',role:'ADMIN'}}
    : new Response(JSON.stringify({error:'Forbidden'}),{status:403});
  async function call(path,body,method='POST',role='ADMIN') {
    const auth= role==='ADMIN'?authorize:async()=>new Response('{}',{status:403});
    return handleD1SiteConfig({request:new Request('https://prod.example'+path,{
      method,headers:{'content-type':'application/json'},
      ...(method==='GET'?{}:{body:JSON.stringify(body||{})})
    }),env,pathname:path,authorize:auth,json,publishTransform:c=>c});
  }
  return {env,db,kv,history,counters,original,call};
}

test('two administrators cannot overwrite drafts using the same revision',async()=>{
  const f=fixture();
  const before=await(await f.call('/admin/draft/site-config',null,'GET')).json();
  const v1=structuredClone(before.draft);v1.home.hero.title='First admin';
  const v2=structuredClone(before.draft);v2.home.hero.title='Second admin';
  const [r1,r2]=await Promise.all([
    f.call('/site-config',{revision:before.revision,config:v1},'PUT'),
    f.call('/site-config',{revision:before.revision,config:v2},'PUT')
  ]);
  assert.deepEqual([r1.status,r2.status].sort(),[200,409]);
  assert.equal(f.db.state.draft_revision,2);
  assert.equal(f.counters.draft,1);
  assert.equal(JSON.parse(f.db.state.draft_json).home.hero.title,'First admin');
});

test('two independent new category approvals preserve both via retry',async()=>{
  const f=fixture();
  for (const [id,title] of [['a','RUGS'],['b','Dresser']])
    f.db.newRequests.push({id,title,title_cn:title,subtitle:'',image:'',status:'pending'});
  const a='/admin/category-requests/a/approve',b='/admin/category-requests/b/approve';
  const [a1,b1]=await Promise.all([f.call(a),f.call(b)]);
  assert.deepEqual([a1.status,b1.status].sort(),[200,409]);
  assert.equal(f.db.state.draft_revision,2);
  const loser=a1.status===409?a:b;
  assert.equal((await f.call(loser)).status,200);
  assert.equal(f.db.state.draft_revision,3);
  assert.deepEqual(new Set(JSON.parse(f.db.state.draft_json).categories.map(x=>x.title)),
    new Set(['Sofa','RUGS','Dresser']));
  assert.deepEqual(f.db.newRequests.map(x=>x.status),['approved','approved']);
  assert.equal(JSON.parse(f.db.state.published_json).categories.length,1);
});

test('stale publish is refused and public data stays unchanged',async()=>{
  const f=fixture();
  const d=JSON.parse(f.db.state.draft_json);
  d.home.hero.title='New draft';
  assert.equal((await f.call('/site-config',{revision:1,config:d},'PUT')).status,200);
  const r=await f.call('/admin/publish',{revision:1});
  assert.equal(r.status,409);
  assert.equal(f.counters.published,0);
  assert.deepEqual(JSON.parse(f.db.state.published_json),f.original);
  assert.equal(f.history.size,0);
  const good=await f.call('/admin/publish',{revision:2});
  assert.equal(good.status,200);
  assert.equal(JSON.parse(f.db.state.published_json).home.hero.title,'New draft');
  assert.equal(f.history.size,1);
});

test('legacy requests without revision are rejected (428)',async()=>{
  const f=fixture();
  const r=await f.call('/site-config',f.original,'PUT');
  assert.equal(r.status,428);
  assert.equal(f.db.state.draft_revision,1);
});

test('factory cannot call protected site-config mutations',async()=>{
  const f=fixture();
  const r=await f.call('/site-config',{revision:1,config:f.original},'PUT','FACTORY');
  assert.equal(r.status,403);
  assert.equal(f.counters.draft,0);
});

test('bootstrap requires hash preflight and is one-time only',async()=>{
  const f=fixture({active:false,seeded:false});
  const status=await(await f.call('/admin/site-config/bootstrap',null,'GET')).json();
  assert.equal(status.ready,true);
  assert.match(status.draftSha,/^[0-9a-f]{64}$/);
  assert.equal((await f.call('/admin/site-config/bootstrap',{draftSha:'bad',publishedSha:status.publishedSha})).status,409);
  assert.equal(f.db.state,null);
  const seededResponse=await f.call('/admin/site-config/bootstrap',
    {draftSha:status.draftSha,publishedSha:status.publishedSha});
  assert.equal(seededResponse.status,200);
  const seededBody=await seededResponse.json();
  assert.equal(seededBody.initialSnapshotVerified,true);
  assert.equal(seededBody.publishedVersion,'bootstrap-'+status.publishedSha);
  assert.equal(f.db.state.published_version,seededBody.publishedVersion);
  const initialR2='snapshots/site_config/'+seededBody.publishedVersion+'.json';
  assert.equal(f.history.get(initialR2),f.kv['published:site_config']);
  assert.equal((await f.call('/admin/site-config/bootstrap',
    {draftSha:status.draftSha,publishedSha:status.publishedSha})).status,409);
  f.env.PZ_D1_SITE_CONFIG_ENABLED='true';
  const result=await(await f.call('/api/site-config',null,'GET')).json();
  assert.equal(result.config.categories[0].title,'Sofa');
});

test('bootstrap refuses to initialize D1 without pre-cutover R2 snapshot',async()=>{
  const f=fixture({active:false,seeded:false});
  const preflight=await(await f.call('/admin/site-config/bootstrap',null,'GET')).json();
  delete f.env.SITE_CONFIG_HISTORY;
  const r=await f.call('/admin/site-config/bootstrap',{
    draftSha:preflight.draftSha,publishedSha:preflight.publishedSha
  });
  assert.equal(r.status,503);
  assert.equal(f.db.state,null);
});

test('bootstrap refuses mismatched stored R2 snapshot, without modifying D1',async()=>{
  const f=fixture({active:false,seeded:false});
  const preflight=await(await f.call('/admin/site-config/bootstrap',null,'GET')).json();
  const collisionKey='snapshots/site_config/bootstrap-'+preflight.publishedSha+'.json';
  f.history.set(collisionKey,'{"categories":[]}');
  assert.equal(await (await f.env.SITE_CONFIG_HISTORY.get(collisionKey)).text(),'{"categories":[]}');
  const r=await f.call('/admin/site-config/bootstrap',{
    draftSha:preflight.draftSha,publishedSha:preflight.publishedSha
  });
  assert.equal(r.status,409);
  assert.equal(f.db.state,null);
});

test('bootstrap initial public snapshot can be restored after first D1 publish',async()=>{
  const f=fixture({active:false,seeded:false});
  const preflight=await(await f.call('/admin/site-config/bootstrap',null,'GET')).json();
  const bootstrap=await(await f.call('/admin/site-config/bootstrap',{
    draftSha:preflight.draftSha,publishedSha:preflight.publishedSha
  })).json();
  const original=f.db.state.published_json;
  f.env.PZ_D1_SITE_CONFIG_ENABLED='true';
  const draft=JSON.parse(f.db.state.draft_json);
  draft.home.hero.title='Publish after bootstrap';
  const changed=await f.call('/site-config',{revision:1,config:draft},'PUT');
  assert.equal(changed.status,200);
  const published=await f.call('/admin/publish',{revision:2});
  assert.equal(published.status,200);
  assert.notEqual(f.db.state.published_json,original);
  const rollback=await f.call('/admin/rollback',{
    version:bootstrap.publishedVersion,publishedRevision:2
  });
  assert.equal(rollback.status,200);
  assert.equal(f.db.state.published_json,original);
});

test('D1 flag off preserves old new-category approval and blocks new modification approval',async()=>{
  const f=fixture({active:false,seeded:false});
  const oldCategory=await f.call('/admin/category-requests/example/approve');
  assert.equal(oldCategory,null,'New-category approval must fall through to legacy route before cutover');
  const change=await f.call('/admin/category-change-requests/example/approve');
  assert.equal(change.status,503,'New modification approval must remain inactive until cutover');
  const repair=await f.call('/admin/category-change-requests/example/reconcile');
  assert.equal(repair.status,503);
});

test('site-config meta uses KV metadata while D1 cutover flag is off',async()=>{
  const f=fixture({active:false,seeded:false});
  const res=await f.call('/site-config/meta',null,'GET');
  assert.equal(res.status,200);
  const meta=await res.json();
  assert.equal(meta.version,'seed');
  assert.equal(meta.publishedAt,'2026-10-01');
});

test('KV meta read miss gets a stable published-content version without writing KV',async()=>{
  const f=fixture({active:false,seeded:false});
  delete f.kv['published:meta'];
  const originalSnapshot=f.kv['published:site_config'];
  const first=await f.call('/site-config/meta',null,'GET');
  assert.equal(first.status,200);
  const meta=await first.json();
  assert.match(meta.version,/^kv-sha256-[a-f0-9]{64}$/);
  assert.equal(meta.publishedAt,null);
  assert.equal(meta.source,'kv-published-content-fallback');
  assert.equal(meta.metaStatus,'kv-read-null');
  const second=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.equal(second.version,meta.version);
  assert.equal(f.kv['published:site_config'],originalSnapshot);
  assert.equal(f.kv['published:meta'],undefined);
});

test('KV metadata fallback tracks public changes, not draft-only edits',async()=>{
  const f=fixture({active:false,seeded:false});
  f.kv['published:meta']='not-valid-json';
  const before=await(await f.call('/api/site-config/meta',null,'GET')).json();
  assert.equal(before.metaStatus,'kv-invalid-or-incomplete');
  f.kv['draft:site_config']=JSON.stringify({categories:[],home:{hero:{title:'Draft edit'}}});
  const draftOnly=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.equal(draftOnly.version,before.version);
  f.kv['published:site_config']=JSON.stringify({categories:[],home:{hero:{title:'New public release'}}});
  const after=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.notEqual(after.version,before.version);
});

test('KV metadata fallback fails closed if published site config is also unavailable',async()=>{
  const f=fixture({active:false,seeded:false});
  delete f.kv['published:meta'];
  delete f.kv['published:site_config'];
  const res=await f.call('/site-config/meta',null,'GET');
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'SITE_CONFIG_META_AND_CONTENT_UNAVAILABLE');
});

test('site-config meta reflects D1 publish and rollback, not stale KV',async()=>{
  const f=fixture();
  const initial=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.equal(initial.version,'old');
  assert.equal(initial.publishedRevision,1);
  const published=await(await f.call('/admin/publish',{revision:1})).json();
  const after=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.equal(after.version,published.version);
  assert.equal(after.publishedRevision,2);
  assert.notEqual(after.version,f.kv['published:meta']);
  const roll=await f.call('/admin/rollback',{version:published.version,publishedRevision:2});
  assert.equal(roll.status,200);
  const meta=await(await f.call('/site-config/meta',null,'GET')).json();
  assert.equal(meta.version,published.version);
  assert.equal(meta.publishedRevision,3);
  const alias=await(await f.call('/api/site-config/meta',null,'GET')).json();
  assert.equal(alias.publishedRevision,3);
});

test('versioned mode keeps bootstrap closed and legacy reconciliation unavailable',async()=>{
  const f=fixture();
  assert.equal((await f.call('/admin/site-config/bootstrap',null,'GET')).status,409);
  assert.equal((await f.call('/admin/category-change-requests/x/reconcile')).status,409);
});
