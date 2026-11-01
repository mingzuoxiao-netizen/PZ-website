import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { pzHandleAccountMutation } from './accountManagement.mjs';
import { pzAuditCreateFetch } from './adminAuditLogCore.mjs';

const json = (body, status=200) => new Response(JSON.stringify(body), {status, headers: {'content-type':'application/json'}});
function setup(actor='admin') {
  const sql = new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY, username TEXT UNIQUE, role TEXT, is_active INTEGER); INSERT INTO users VALUES ('admin','owner','admin',1),('second','manager','admin',1),('factory','factory_one','factory',1); CREATE TABLE products(id TEXT PRIMARY KEY,created_by TEXT REFERENCES users(id) ON DELETE CASCADE);");
  const env = {DB:{prepare(query) {
    let binds=[];
    return {bind(...values){binds=values;return this;},
      async first(){return sql.prepare(query).get(...binds) || null;},
      async all(){return {results:sql.prepare(query).all(...binds)};},
      async run(){return {meta:{changes:Number(sql.prepare(query).run(...binds).changes)}};}
    };
  }}};
  const deps = {json, normalizeRole:r=>String(r).toUpperCase(),
    authorize:async (_r,_e,roles)=>actor==='anonymous'?json({error:'Unauthorized'},401):
      actor==='factory'?json({error:'Forbidden'},403):{user:{id:actor,username:'owner',role:'ADMIN'}}};
  const call = (id,method,body) => pzHandleAccountMutation(new Request('https://test/admin/accounts/'+id, {
    method, ...(body === undefined?{}:{body:JSON.stringify(body),headers:{'content-type':'application/json'}})
  }),env,deps);
  return {sql,env,deps,call};
}

test('rename preserves ID, status and product ownership; rejects duplicate and invalid names',async()=>{
  const {sql,call}=setup();
  sql.exec("INSERT INTO products VALUES('p','factory')");
  assert.equal((await call('factory','PUT',{username:'  renamed  '})).status,200);
  assert.deepEqual({...sql.prepare("SELECT * FROM users WHERE id='factory'").get()},
    {id:'factory',username:'renamed',role:'factory',is_active:1});
  assert.equal(sql.prepare("SELECT created_by FROM products").get().created_by,'factory');
  assert.equal((await call('factory','PUT',{username:'OWNER'})).status,409);
  for(const username of ['', 'x y', 'x\ny', 'x'.repeat(81), null, 123]) {
    assert.equal((await call('factory','PUT',{username})).status,400);
  }
  sql.close();
});
test('unused account deletion removes login identity and nonexistent account returns 404',async()=>{
  const {sql,call}=setup();
  assert.equal((await call('factory','DELETE')).status,200);
  assert.equal(sql.prepare("SELECT * FROM users WHERE id='factory'").get(),undefined);
  assert.equal((await call('factory','DELETE')).status,404);
  assert.equal((await call('missing','PUT',{username:'new'})).status,404);
  sql.close();
});
test('deletion cannot cascade products or erase legacy ownership/reviewer references',async()=>{
  const {sql,call}=setup();
  sql.exec("INSERT INTO products VALUES('p','factory')");
  assert.equal((await call('factory','DELETE')).status,409);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM products").get().n,1);
  sql.exec("DELETE FROM products; CREATE TABLE category_requests(created_by TEXT, reviewed_by TEXT); INSERT INTO category_requests VALUES('other','factory')");
  assert.equal((await call('factory','DELETE')).status,409);
  assert.ok(sql.prepare("SELECT * FROM users WHERE id='factory'").get());
  sql.close();
});
test('self deletion/disable/demotion and removal of last active admin are blocked',async()=>{
  const {sql,call}=setup();
  for(const [method,body] of [['DELETE',undefined],['PUT',{is_active:false}],['PUT',{role:'FACTORY'}]]) {
    assert.equal((await call('admin',method,body)).status,409);
  }
  sql.exec("UPDATE users SET is_active=0 WHERE id='admin'");
  assert.equal((await call('second','DELETE')).status,409);
  assert.equal((await call('second','PUT',{is_active:false})).status,409);
  assert.equal((await call('second','PUT',{role:'FACTORY'})).status,409);
  sql.close();
});
test('unused second admin can be deleted; normal disable and restore continue working',async()=>{
  const {sql,call}=setup();
  assert.equal((await call('second','DELETE')).status,200);
  assert.equal((await call('factory','PUT',{is_active:false})).status,200);
  assert.equal(sql.prepare("SELECT is_active FROM users WHERE id='factory'").get().is_active,0);
  assert.equal((await call('factory','PUT',{is_active:true})).status,200);
  sql.close();
});
test('anonymous and factory accounts cannot mutate accounts',async()=>{
  for(const actor of ['anonymous','factory']) {
    const {sql,call}=setup(actor);
    for(const method of ['DELETE','PUT']) assert.equal((await call('second',method,{username:'changed'})).status,actor==='anonymous'?401:403);
    assert.equal(sql.prepare("SELECT username FROM users WHERE id='second'").get().username,'manager');
    sql.close();
  }
});
test('malformed payloads and unsupported fields do not mutate the target',async()=>{
  const {sql,call,env,deps}=setup();
  for(const body of [null,[],{}, {role:'ROOT'}, {is_active:'false'}]) assert.equal((await call('factory','PUT',body)).status,400);
  const r=await pzHandleAccountMutation(new Request('https://test/admin/accounts/factory',{method:'PUT',body:'{'}),env,deps);
  assert.equal(r.status,400);
  sql.close();
});
test('delete logs before snapshot, success/failure and blocks mutation if audit storage fails',async()=>{
  const {sql,call,env,deps}=setup();
  sql.exec("CREATE TABLE audit_logs(id TEXT PRIMARY KEY,created_at TEXT,actor_id TEXT,actor_username TEXT,actor_role TEXT,action TEXT,entity_type TEXT,entity_id TEXT,status TEXT,http_status INTEGER,before_json TEXT,after_json TEXT,changes_json TEXT)");
  const fetch=pzAuditCreateFetch((r,e)=>pzHandleAccountMutation(r,e,deps),deps);
  const req=id=>new Request('https://test/admin/accounts/'+id,{method:'DELETE'});
  assert.equal((await fetch(req('factory'),env)).status,200);
  const log=sql.prepare("SELECT * FROM audit_logs WHERE entity_id='factory'").get();
  assert.equal(log.action,'account.delete'); assert.equal(log.status,'success');
  assert.equal(JSON.parse(log.before_json).username,'factory_one');
  assert.equal((await fetch(req('admin'),env)).status,409);
  assert.equal(sql.prepare("SELECT status FROM audit_logs WHERE entity_id='admin'").get().status,'failed');
  sql.exec("DROP TABLE audit_logs");
  assert.equal((await fetch(req('second'),env)).status,503);
  assert.ok(sql.prepare("SELECT * FROM users WHERE id='second'").get());
  sql.close();
});
test('both deployable bundles contain exactly the tested implementation and enforce anonymous auth',async()=>{
  const helper=readFileSync(new URL('./accountManagement.mjs',import.meta.url),'utf8').replace('export async function','async function');
  for(const file of ['production-worker-category-governance-REVIEW.js','staging-worker-category-changes-REVIEW.js']) {
    const source=readFileSync(new URL(file,import.meta.url),'utf8');
    assert.ok(source.endsWith(helper),file+' must embed tested account handler');
    assert.ok(source.includes('action: "account.delete"'));
    const mod=await import(new URL(file,import.meta.url));
    for(const method of ['PUT','DELETE']) {
      const r=await mod.default.fetch(new Request('https://test/admin/accounts/factory',{method, ...(method==='PUT'?{body:'{"username":"x"}'}:{})}),
        {PZ_RUNTIME_ENV:file.startsWith('production')?'production':'staging'});
      assert.equal(r.status,401);
    }
  }
});
