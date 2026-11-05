import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createHmac} from 'node:crypto';
import {readFileSync} from 'node:fs';

const candidates=[
  ['Staging','staging','staging-worker-category-changes-REVIEW.js'],
  ['Production','production','production-worker-category-governance-REVIEW.js']
];
const secret='local-test-HS256-secret-not-a-real-key-2026';
const passwordHash='test-hash-safely-not-a-password';
const base64=obj=>Buffer.from(JSON.stringify(obj)).toString('base64url');
function token(role='ADMIN'){
  const now=Math.floor(Date.now()/1000);
  const phv=createHash('sha256').update(passwordHash).digest('hex').slice(0,32);
  const h=base64({typ:'JWT',alg:'HS256'});
  const p=base64({sub:role==='ADMIN'?'admin-1':'worker-1',
    username:role==='ADMIN'?'admin':'worker',role,org_id:'org-main',phv,
    iat:now,exp:now+3600});
  return h+'.'+p+'.'+createHmac('sha256',secret).update(h+'.'+p).digest('base64url');
}
function fakeEnvironment(runtime,reviewEnabled){
  const product={
    id:'p1',name:'Oak Table',name_cn:'餐桌',category:'tables',
    sub_category:'',material:'oak',size:'180cm',finish:'matte',
    code:'PZ-01',status:'published',created_by:'worker-1',
    images:JSON.stringify(['https://cdn.peng-zhan.com/uploads/old.webp']),
    production_sites:'["zhaoqing"]',updated_at:'2026-11-05T00:00:00Z'
  };
  const original=structuredClone(product);
  let r2DeleteCalls=0,publicKVWrites=0,productWrites=0,otherSkuWrites=0;
  const statements=[];
  const DB={
    prepare(query){
      statements.push(query);
      if(/UPDATE\s+products\b|DELETE\s+FROM\s+products\b/i.test(query))productWrites++;
      if(/UPDATE\s+other_sku\b/i.test(query))otherSkuWrites++;
      return {
        bind(...params){this.params=params;return this;},
        async first(){
          if(query.includes('FROM users WHERE id')){
            const id=this.params?.[0];
            return {id,username:id==='admin-1'?'admin':'worker',
              role:id==='admin-1'?'admin':'factory',is_active:1,
              org_id:'org-main',password_hash:passwordHash};
          }
          if(query.includes('FROM products WHERE id='))return product;
          if(query.includes("name='pz_staff_assignments'"))return null;
          return null;
        },
        async run(){return {meta:{changes:1}};},
        async all(){return {results:[]};}
      };
    }
  };
  const env={
    PZ_RUNTIME_ENV:runtime,JWT_SECRET:secret,DB,
    PZ_TWO_STAGE_REVIEW_ENABLED:reviewEnabled?'true':'false',
    PZ_ORG_RBAC_ENABLED:'true',
    PZ_PRODUCT_REVISIONS_ENABLED:'false',
    PRODUCT_IMAGES:{
      async delete(){r2DeleteCalls++;throw Error('Forbidden physical deletion');},
      async head(){return {size:12}}
    },
    SITE_CONFIG_KV:{
      async put(){publicKVWrites++;throw Error('Forbidden public catalog write');},
      async get(){return null}
    }
  };
  return {env,product,original,statements,
    changed:()=>({r2DeleteCalls,publicKVWrites,productWrites,otherSkuWrites})};
}

for(const [name,runtime,filename] of candidates){
  test(name+' candidate retires R2 physical delete code, preserves product review workflow',()=>{
    const source=readFileSync(new URL(filename,import.meta.url),'utf8');
    assert.doesNotMatch(source,/PRODUCT_IMAGES\.delete\s*\(/);
    assert.doesNotMatch(source,/deleteFromCloud/);
    assert.match(source,/Legacy image removal disabled/);
    assert.match(source,/index_default\.fetch = pzTwoStageReviewFetch\(/);
    assert.match(source,/index_default\.fetch = pzPublishedProductRevisionsFetch\(/);
    assert.match(source,/PZ_PRODUCT_REVISIONS_ENABLED/);
    assert.match(source,/published:products/);
    assert.match(source,/PZ_ORG_RBAC_ENABLED/);
  });
  for(const reviewEnabled of [true,false]){
    test(name+' retired route cannot change D1/R2/KV (review '+(reviewEnabled?'ON':'OFF')+')',async()=>{
      const {default:worker}=await import('./'+filename);
      const store=fakeEnvironment(runtime,reviewEnabled);
      const endpoint='https://worker.example/admin/products/p1/remove-image';
      const body=JSON.stringify({url:'https://cdn.peng-zhan.com/uploads/old.webp',
        deleteFromCloud:true,autoPublish:true,key:'uploads/old.webp'});
      const call=async auth=>{
        const headers={'Content-Type':'application/json'};
        if(auth)headers.Authorization='Bearer '+token(auth);
        const response=await worker.fetch(new Request(endpoint,{method:'POST',headers,body}),store.env,{});
        return {status:response.status,body:await response.text()};
      };
      const anonymous=await call(null);
      assert.equal(anonymous.status,401,anonymous.body);
      const workerRole=await call('FACTORY');
      assert.equal(workerRole.status,403,workerRole.body);
      const admin=await call('ADMIN');
      assert.equal(admin.status,410,admin.body);
      assert.match(admin.body,/Legacy image removal disabled/i);
      assert.deepEqual(store.product,store.original,'approved product is unchanged');
      assert.deepEqual(store.changed(),
        {r2DeleteCalls:0,publicKVWrites:0,productWrites:0,otherSkuWrites:0},
        'retired endpoint cannot delete R2, update products, or publish KV');
    });
  }
}
