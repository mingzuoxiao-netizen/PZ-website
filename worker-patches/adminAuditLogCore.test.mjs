import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pzAuditCreateFetch } from './adminAuditLogCore.mjs';

function mockEnv({ migrated = true } = {}) {
  const events = [];
  const products = new Map();
  const users = new Map();
  const env = {
    events, products, users,
    DB: {
      prepare(sql) {
        const query = String(sql);
        return {
          bind(...args) {
            return {
              async run() {
                if (query.includes('INSERT INTO audit_logs')) {
                  if (!migrated) throw Error('no such table: audit_logs');
                  const keys = ['id','created_at','actor_id','actor_username','actor_role','action',
                    'entity_type','entity_id','status','http_status','before_json','after_json','changes_json'];
                  events.push(Object.fromEntries(keys.map((key,i) => [key,args[i]])));
                  return { meta: { changes: 1 } };
                }
                if (query.includes('UPDATE audit_logs SET')) {
                  const row = events.find(e => e.id === args.at(-1));
                  if (!row) throw Error('Audit event missing');
                  if (query.includes("status='failed'")) {
                    row.status = 'failed'; row.http_status = 500;
                  } else {
                    [row.entity_id,row.status,row.http_status,row.after_json,row.changes_json] = args;
                  }
                  return { meta: { changes: 1 } };
                }
                throw Error('Unexpected audit SQL: ' + query);
              },
              async first() {
                if (query.includes('FROM products')) return products.get(args[0]) || null;
                if (query.includes('FROM users')) return users.get(args[0]) || null;
                if (query.includes('COUNT(*) AS total')) return { total: events.length };
                return null;
              },
              async all() {
                if (query.includes('FROM audit_logs')) return { results: events.slice().reverse() };
                return { results: [] };
              }
            };
          },
          first() { return this.bind().first(); },
          all() { return this.bind().all(); }
        };
      }
    }
  };
  return env;
}
const json = (obj,status=200) => new Response(JSON.stringify(obj),{status,headers:{'Content-Type':'application/json'}});
async function authorize(req,_env,roles) {
  const token = req.headers.get('Authorization');
  if (token !== 'Bearer admin' && token !== 'Bearer factory') return json({error:'Unauthorized'},401);
  if (token === 'Bearer factory' && !roles.includes('FACTORY')) return json({error:'Forbidden'},403);
  return {user:{id:token==='Bearer admin'?'admin-id':'factory-id',username:token==='Bearer admin'?'管理员甲':'工厂人员乙',role:token==='Bearer admin'?'ADMIN':'FACTORY'}};
}
const request = (path,method='GET',token='admin') =>
  new Request('https://audit.test'+path,{method,headers:{Authorization:'Bearer '+token}});

test('admin-only audit listing; factory and unauthenticated forbidden', async () => {
  const env=mockEnv();
  const handler=pzAuditCreateFetch(async()=>json({error:'Fallback called'},404),{authorize,json});
  assert.equal((await handler(request('/admin/audit-logs','GET','none'),env)).status,401);
  assert.equal((await handler(request('/admin/audit-logs','GET','factory'),env)).status,403);
  const res=await handler(request('/admin/audit-logs'),env);
  assert.equal(res.status,200);
  assert.deepEqual((await res.json()).items,[]);
});

test('audit missing migration blocks tracked operations before mutation', async () => {
  const env=mockEnv({migrated:false});
  let mutated=false;
  const handler=pzAuditCreateFetch(async()=>{mutated=true;return json({success:true});},{authorize,json});
  const res=await handler(request('/admin/products','POST'),env);
  assert.equal(res.status,503);
  assert.equal(mutated,false);
});

test('successful create and update preserve the actor, target and safe change summary', async () => {
  const env=mockEnv();
  let count=0;
  const handler=pzAuditCreateFetch(async req=>{
    count++;
    if(req.method==='POST'){
      env.products.set('p-1',{name:'Oak top',category:'butcher-block',code:'PZ-OAK-001',status:'draft',images:'[]'});
      return json({success:true,id:'p-1'},201);
    }
    env.products.set('p-1',{name:'Oak top updated',category:'butcher-block',code:'PZ-OAK-001',status:'awaiting_review',images:'[]'});
    return json({success:true,id:'p-1'});
  },{authorize,json});
  assert.equal((await handler(request('/factory/products','POST','factory'),env)).status,201);
  assert.equal((await handler(request('/admin/products/p-1','PUT'),env)).status,200);
  assert.equal(count,2);
  assert.equal(env.events.length,2);
  assert.equal(env.events[0].actor_username,'工厂人员乙');
  assert.equal(env.events[0].action,'product.create');
  assert.equal(env.events[0].entity_id,'p-1');
  assert.equal(env.events[0].status,'success');
  assert.equal(env.events[1].action,'product.update');
  assert.equal(env.events[1].status,'success');
  assert.deepEqual(JSON.parse(env.events[1].changes_json),['name','status']);
  const list=await handler(request('/admin/audit-logs'),env);
  const data=await list.json();
  assert.equal(data.total,2);
  assert.equal(data.items[0].actor_username,'管理员甲');
  assert.equal(data.items[0].after.name,'Oak top updated');
});

test('failed operations are not presented as successful changes',async()=>{
  const env=mockEnv();
  const handler=pzAuditCreateFetch(async()=>json({error:'Not found'},404),{authorize,json});
  const res=await handler(request('/admin/products/no-such-item','DELETE'),env);
  assert.equal(res.status,404);
  assert.equal(env.events[0].status,'failed');
  assert.equal(env.events[0].http_status,404);
});

test('account password reset never stores incoming password or hash',async()=>{
  const env=mockEnv();
  env.users.set('u-1',{username:'tester',role:'factory',is_active:1});
  const handler=pzAuditCreateFetch(async()=>json({success:true}),{authorize,json});
  const req=new Request('https://audit.test/admin/accounts/u-1/password',{method:'POST',headers:{Authorization:'Bearer admin','Content-Type':'application/json'},body:JSON.stringify({password:'secret-not-for-logs'})});
  assert.equal((await handler(req,env)).status,200);
  const e=env.events[0];
  assert.equal(e.action,'account.reset_password');
  assert.equal(e.status,'success');
  assert.ok(!JSON.stringify(e).includes('secret-not-for-logs'));
});

test('non-audited GET routes continue to original Worker handler',async()=>{
  let hits=0;
  const handler=pzAuditCreateFetch(async()=>{hits++;return json({ok:true});},{authorize,json});
  assert.equal((await handler(new Request('https://audit.test/public/products'),mockEnv())).status,200);
  assert.equal(hits,1);
});
