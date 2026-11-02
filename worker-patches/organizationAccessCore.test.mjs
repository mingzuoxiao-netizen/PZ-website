import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { pzOrgEffectiveRole, pzOrgCanManageProduct, pzOrganizationCreateFetch, pzOrgPasswordPolicy } from './organizationAccessCore.mjs';

const json=(data,status=200)=>Response.json(data,{status});
function setup(enabled=true) {
  const sql=new DatabaseSync(':memory:');
  sql.exec("PRAGMA foreign_keys=ON; CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT UNIQUE, role TEXT, password_hash TEXT, is_active INTEGER, org_id TEXT, created_at TEXT); " +
    "CREATE TABLE products (id TEXT PRIMARY KEY, created_by TEXT); " +
    "INSERT INTO users VALUES ('admin','owner','admin','secret',1,'org-main','2026-01-01')," +
    "('legacy','legacy_factory','factory','secret',1,'org-main','2026-01-01');" +
    "INSERT INTO products VALUES ('p','legacy');");
  sql.exec(readFileSync(new URL('./migrations/009_department_accounts_REVIEW.sql',import.meta.url),'utf8'));
  const prepare=query=>{
    let args=[];
    return {
      bind(...values){args=values;return this;},
      async first(){return sql.prepare(query).get(...args)||null;},
      async all(){return {results:sql.prepare(query).all(...args)};},
      async run(){return {meta:{changes:Number(sql.prepare(query).run(...args).changes)}};},
      _run(){return sql.prepare(query).run(...args);}
    };
  };
  const env={PZ_ORG_RBAC_ENABLED:enabled?'true':'false',DB:{
    prepare,
    async batch(statements){
      sql.exec('BEGIN');
      try {
        const results=statements.map(s=>({meta:{changes:Number(s._run().changes)}}));
        sql.exec('COMMIT');return results;
      }catch(error){sql.exec('ROLLBACK');throw error;}
    }
  }};
  const authorize=async(request,scope,roles)=>{
    const id=request.headers.get('X-Actor')||'admin';
    const user=sql.prepare('SELECT * FROM users WHERE id=?').get(id);
    if(!user||!user.is_active)return json({error:'Not logged in'},401);
    const role=await pzOrgEffectiveRole(scope,id,user.role);
    if(!roles.includes(role))return json({error:'Denied'},403);
    return {user:{id,username:user.username,role}};
  };
  const api=pzOrganizationCreateFetch(()=>json({error:'Unknown path'},404),{
    authorize,json,hash:async password=>'hashed:'+password,passwordPolicy:pzOrgPasswordPolicy
  });
  async function call(path,method='GET',body,actor='admin'){
    const request=new Request('https://worker.example'+path,{
      method,headers:{'X-Actor':actor,...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})
    });
    const response=await api(request,env,{});
    return {status:response.status,body:await response.json()};
  }
  return {sql,env,call};
}
const strong='valid-password-12';

test('disabled feature does not create accounts or touch legacy flows',async()=>{
  const {sql,call}=setup(false);
  assert.equal((await call('/admin/org/departments','POST',{name:'Sales',factory_site:'zhaoqing'})).status,404);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM pz_departments').get().n,0);
  assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM users').get().n,2);
});

test('admin creates department, supervisor creates secretary and staff, without role escalation',async()=>{
  const {sql,env,call}=setup();
  const dep=await call('/admin/org/departments','POST',{name:'Product',factory_site:'zhaoqing'});
  assert.equal(dep.status,201);
  const supervisor=await call('/admin/org/accounts','POST',{
    username:'product_lead',password:strong,job_type:'supervisor',department_id:dep.body.id
  });
  assert.equal(supervisor.status,201);
  assert.equal(sql.prepare('SELECT role FROM users WHERE id=?').get(supervisor.body.id).role,'factory');
  assert.equal(await pzOrgEffectiveRole(env,supervisor.body.id,'factory'),'SUPERVISOR');
  const secretary=await call('/supervisor/accounts','POST',{username:'product_sec',password:strong,job_type:'secretary'},supervisor.body.id);
  assert.equal(secretary.status,201);
  assert.equal(secretary.body.supervisor_id,supervisor.body.id);
  assert.equal(await pzOrgEffectiveRole(env,secretary.body.id,'factory'),'FACTORY');
  const direct=await call('/supervisor/accounts','POST',{username:'fake_boss',password:strong,job_type:'supervisor'},supervisor.body.id);
  assert.equal(direct.status,403);
  assert.equal((await call('/supervisor/accounts','GET',undefined,supervisor.body.id)).body.users.length,1);
  assert.equal((await call('/supervisor/accounts','GET',undefined,'legacy')).status,403);
  assert.equal((await call('/supervisor/accounts','GET',undefined,'admin')).status,403);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM users WHERE username='fake_boss'").get().n,0);
});

test('cross-department changes denied; supervisor can only disable and reset own subordinate',async()=>{
  const {sql,call}=setup();
  const a=(await call('/admin/org/departments','POST',{name:'A',factory_site:'zhaoqing'})).body.id;
  const b=(await call('/admin/org/departments','POST',{name:'B',factory_site:'kandal'})).body.id;
  const leadA=(await call('/admin/org/accounts','POST',{username:'lead_a',password:strong,job_type:'supervisor',department_id:a})).body.id;
  const leadB=(await call('/admin/org/accounts','POST',{username:'lead_b',password:strong,job_type:'supervisor',department_id:b})).body.id;
  const member=(await call('/supervisor/accounts','POST',{username:'assistant_b',password:strong,job_type:'secretary'},leadB)).body.id;
  assert.equal((await call('/supervisor/accounts/'+member,'PATCH',{is_active:false},leadA)).status,403);
  assert.equal((await call('/supervisor/accounts/'+member+'/password','POST',{password:'other-password-123'},leadA)).status,403);
  assert.equal((await call('/supervisor/accounts','POST',{username:'outsider',password:strong,job_type:'secretary',department_id:b,supervisor_id:leadB},leadA)).status,201);
  assert.equal(sql.prepare("SELECT department_id FROM pz_staff_assignments WHERE user_id=(SELECT id FROM users WHERE username='outsider')").get().department_id,a);
  assert.equal((await call('/supervisor/accounts/'+member,'PATCH',{is_active:false},leadB)).status,200);
  assert.equal(sql.prepare('SELECT is_active FROM users WHERE id=?').get(member).is_active,0);
  assert.equal((await call('/supervisor/accounts/'+member+'/password','POST',{password:'renewed-password-23'},leadB)).status,200);
  assert.equal(sql.prepare('SELECT password_hash FROM users WHERE id=?').get(member).password_hash,'hashed:renewed-password-23');
});

test('admin may assign legacy accounts but not admin identities; factory product ownership enforced',async()=>{
  const {sql,env,call}=setup();
  const dep=(await call('/admin/org/departments','POST',{name:'Global',factory_site:'shared'})).body.id;
  const leader=(await call('/admin/org/accounts','POST',{username:'division_lead',password:strong,job_type:'supervisor',department_id:dep})).body.id;
  assert.equal(await pzOrgCanManageProduct(env,'legacy','p'),false);
  assert.equal((await call('/admin/org/assignments','POST',{user_id:'admin',department_id:dep,supervisor_id:leader})).status,403);
  const assignment=await call('/admin/org/assignments','POST',{user_id:'legacy',department_id:dep,supervisor_id:leader,job_type:'staff'});
  assert.equal(assignment.status,200);
  assert.equal(await pzOrgCanManageProduct(env,'legacy','p'),true);
  assert.equal(await pzOrgCanManageProduct(env,'legacy','missing'),false);
  assert.equal(await pzOrgCanManageProduct(env,'legacy'),true);
  assert.equal(await pzOrgCanManageProduct(env,'admin'),false);
  assert.equal(await pzOrgEffectiveRole(env,'legacy','other'),null);
  assert.equal(sql.prepare("SELECT COUNT(*) AS n FROM pz_staff_assignments WHERE user_id='admin'").get().n,0);
});

test('passwords and duplicate departments rejected',async()=>{
  const {call}=setup();
  assert.ok(pzOrgPasswordPolicy('123','user'));
  assert.ok(pzOrgPasswordPolicy('membername-123456','membername'));
  assert.equal(pzOrgPasswordPolicy(strong,'account'),null);
  assert.equal((await call('/admin/org/departments','POST',{name:'One',factory_site:'shared'})).status,201);
  assert.equal((await call('/admin/org/departments','POST',{name:'ONE',factory_site:'shared'})).status,409);
});

test('both candidate bundles contain new org routes and feature flag',()=>{
  for(const name of ['production-worker-category-governance-REVIEW.js','staging-worker-category-changes-REVIEW.js']){
    const content=readFileSync(new URL('./'+name,import.meta.url),'utf8');
    assert.match(content,/pzOrganizationCreateFetch\(pzOrgOriginalFetch/);
    assert.match(content,/PZ_ORG_RBAC_ENABLED/);
    assert.match(content,/pzOrgCanManageProduct/);
    assert.match(content,/role: await pzOrgEffectiveRole/);
    assert.match(content,/account.delegated_create/);
  }
});
