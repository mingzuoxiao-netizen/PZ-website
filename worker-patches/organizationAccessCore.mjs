// PZ V2 organization / delegated accounts. Embedded verbatim in review Worker bundles.
// IMPORTANT: env.PZ_ORG_RBAC_ENABLED must be "true" and migration 009 must exist.
// The existing users.role stays admin/factory; supervisor identity is derived from D1.
export async function pzOrgEffectiveRole(env, userId, baseRole) {
  const role = String(baseRole || '').toLowerCase();
  if (role === 'admin') return 'ADMIN';
  if (role !== 'factory') return null; // never turn an unknown role into FACTORY
  // Before migration, preserve existing factory accounts.
  const schema = await env.DB.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='pz_staff_assignments' LIMIT 1"
  ).first();
  if (!schema) return 'FACTORY';
  const assignment = await env.DB.prepare(
    "SELECT job_type FROM pz_staff_assignments WHERE user_id=? LIMIT 1"
  ).bind(userId).first();
  // Rollback safety: disabling the feature cannot turn newly delegated
  // supervisors/secretaries into unrestricted legacy factory accounts.
  if (env.PZ_ORG_RBAC_ENABLED !== 'true') return assignment ? null : 'FACTORY';
  return assignment?.job_type === 'supervisor' ? 'SUPERVISOR' : 'FACTORY';
}

export async function pzOrgCanManageProduct(env, userId, productId=null) {
  if (env.PZ_ORG_RBAC_ENABLED !== 'true') return true;
  const assigned = await env.DB.prepare(
    "SELECT a.user_id FROM pz_staff_assignments a JOIN pz_departments d ON d.id=a.department_id " +
    "WHERE a.user_id=? AND a.job_type IN ('secretary','staff','data_entry') AND d.is_active=1 LIMIT 1"
  ).bind(userId).first();
  if (!assigned) return false;
  if (!productId) return true;
  const owned = await env.DB.prepare(
    "SELECT id FROM products WHERE id=? AND created_by=? LIMIT 1"
  ).bind(productId,userId).first();
  return Boolean(owned);
}

export function pzOrgPasswordPolicy(password,username='') {
  if (typeof password!=='string' || password.length<12 ||
      new TextEncoder().encode(password).length>72 || !password.trim()) return 'Password must be 12-72 UTF-8 bytes';
  if (username.length>=3 && password.toLowerCase().includes(username.toLowerCase()))
    return 'Password must not contain account name';
  return null;
}

export function pzOrganizationCreateFetch(originalFetch, { authorize, json, hash, passwordPolicy }) {
  const fail = (message, status=400) => json({ error: message }, status);
  const safeName = value => typeof value === 'string' &&
    value.trim().length >= 2 && value.trim().length <= 80 &&
    !/[\s\u0000-\u001f\u007f]/u.test(value.trim());
  const jobTypes = new Set(['supervisor','secretary','staff','data_entry']);
  const createRoles = new Set(['secretary','staff','data_entry']);
  const jsonBody = async request => {
    try {
      const body = await request.json();
      return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
    } catch { return null; }
  };
  async function actorAssignment(env, id) {
    return env.DB.prepare(
      "SELECT a.department_id, a.job_type, d.is_active FROM pz_staff_assignments a " +
      "JOIN pz_departments d ON d.id=a.department_id WHERE a.user_id=? LIMIT 1"
    ).bind(id).first();
  }
  async function validSupervisor(env,id,departmentId) {
    const user = await env.DB.prepare(
      "SELECT u.id FROM users u JOIN pz_staff_assignments a ON a.user_id=u.id " +
      "JOIN pz_departments d ON d.id=a.department_id " +
      "WHERE u.id=? AND lower(u.role)='factory' AND u.is_active=1 " +
      "AND a.job_type='supervisor' AND a.department_id=? AND d.is_active=1 LIMIT 1"
    ).bind(id,departmentId).first();
    return Boolean(user);
  }
  async function managedTarget(env,id,supervisorId) {
    return env.DB.prepare(
      "SELECT u.id,u.username,u.is_active,a.job_type,a.department_id FROM users u " +
      "JOIN pz_staff_assignments a ON a.user_id=u.id " +
      "WHERE u.id=? AND a.supervisor_id=? AND a.job_type IN ('secretary','staff','data_entry') LIMIT 1"
    ).bind(id,supervisorId).first();
  }
  return async function organizationFetch(request,env,ctx) {
    const path = new URL(request.url).pathname;
    const admin = path.startsWith('/admin/org/');
    const supervisor = path === '/supervisor/accounts' || /^\/supervisor\/accounts\/[^/]+(?:\/password)?$/.test(path);
    if (!admin && !supervisor) return originalFetch.call(this,request,env,ctx);
    if (env.PZ_ORG_RBAC_ENABLED !== 'true') return fail('Organization management not enabled',404);
    if (!env.DB) return fail('D1 unavailable',503);
    const auth = await authorize(request,env,admin?['ADMIN']:['SUPERVISOR']);
    if (auth instanceof Response) return auth;
    const actor = auth.user.id;
    const method = request.method;
    const now = new Date().toISOString();

    if (path === '/admin/org/departments' && method === 'GET') {
      const result = await env.DB.prepare(
        "SELECT id,name,factory_site,is_active,created_at FROM pz_departments ORDER BY name"
      ).all();
      return json({ items: result.results || [] });
    }
    if (path === '/admin/org/departments' && method === 'POST') {
      const body=await jsonBody(request);
      if (!body || typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length>100 ||
        !['zhaoqing','kandal','shared'].includes(body.factory_site)) return fail('Invalid department');
      const id=crypto.randomUUID();
      try {
        await env.DB.prepare(
          "INSERT INTO pz_departments (id,name,factory_site,created_by,created_at) VALUES (?,?,?,?,?)"
        ).bind(id,body.name.trim(),body.factory_site,actor,now).run();
      } catch (err) {
        if (/UNIQUE|CONSTRAINT/i.test(String(err))) return fail('Department already exists',409);
        throw err;
      }
      return json({success:true,id},201);
    }
    if (path === '/admin/org/accounts' && method === 'GET') {
      const rows=await env.DB.prepare(
        "SELECT u.id,u.username,u.role,u.is_active,a.department_id,a.supervisor_id,a.job_type," +
        "d.name AS department_name FROM users u LEFT JOIN pz_staff_assignments a ON a.user_id=u.id " +
        "LEFT JOIN pz_departments d ON d.id=a.department_id ORDER BY u.username LIMIT 1000"
      ).all();
      return json({users:rows.results||[]});
    }
    if (path === '/supervisor/accounts' && method === 'GET') {
      const rows=await env.DB.prepare(
        "SELECT u.id,u.username,u.is_active,a.job_type,a.department_id,a.supervisor_id " +
        "FROM users u JOIN pz_staff_assignments a ON a.user_id=u.id " +
        "WHERE a.supervisor_id=? AND a.job_type IN ('secretary','staff','data_entry') " +
        "ORDER BY u.username LIMIT 500"
      ).bind(actor).all();
      return json({users:rows.results||[]});
    }
    if ((path === '/admin/org/accounts' || path === '/supervisor/accounts') && method === 'POST') {
      const body=await jsonBody(request);
      if (!body || !safeName(body.username) || typeof body.password !== 'string') return fail('Invalid account fields');
      const passwordError=passwordPolicy(body.password,body.username.trim());
      if (passwordError) return fail(passwordError);
      const kind=String(body.job_type||'').toLowerCase();
      if (!jobTypes.has(kind) || (!admin && !createRoles.has(kind))) return fail('Cannot grant requested role',403);
      const own = admin ? null : await actorAssignment(env,actor);
      if (!admin && (!own || own.job_type!=='supervisor' || own.is_active!==1)) return fail('Supervisor assignment unavailable',403);
      const departmentId=admin ? String(body.department_id||'') : own.department_id;
      const department=await env.DB.prepare("SELECT id FROM pz_departments WHERE id=? AND is_active=1").bind(departmentId).first();
      if (!department) return fail('Department missing or disabled',409);
      const supervisorId=kind==='supervisor' ? null : admin ? String(body.supervisor_id||'') : actor;
      if (kind!=='supervisor' && !(await validSupervisor(env,supervisorId,departmentId))) return fail('Invalid supervisor for department',409);
      const existing=await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?) LIMIT 1").bind(body.username.trim()).first();
      if (existing) return fail('Account name already exists',409);
      const id=crypto.randomUUID();
      const passwordHash=await hash(body.password,10);
      // D1 batch is atomic. Do not leave orphaned users on a failed assignment.
      try {
        await env.DB.batch([
          env.DB.prepare("INSERT INTO users (id,username,password_hash,role,is_active,org_id,created_at) VALUES (?,?,?,?,1,?,?)")
            .bind(id,body.username.trim(),passwordHash,'factory','org-main',now),
          env.DB.prepare("INSERT INTO pz_staff_assignments (user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?)")
            .bind(id,departmentId,supervisorId,kind,actor,now,now)
        ]);
      } catch (err) {
        if (/UNIQUE|CONSTRAINT|FOREIGN KEY/i.test(String(err))) return fail('Account conflict; no account created',409);
        throw err;
      }
      return json({success:true,id,job_type:kind,department_id:departmentId,supervisor_id:supervisorId},201);
    }
    if (path === '/admin/org/assignments' && method === 'POST') {
      const body=await jsonBody(request);
      const userId=typeof body?.user_id==='string'?body.user_id:'';
      const departmentId=typeof body?.department_id==='string'?body.department_id:'';
      const supervisorId=typeof body?.supervisor_id==='string'?body.supervisor_id:'';
      const kind=String(body?.job_type||'staff').toLowerCase();
      if (!userId || !createRoles.has(kind) || !(await validSupervisor(env,supervisorId,departmentId)))
        return fail('Invalid assignment',409);
      const target=await env.DB.prepare("SELECT id FROM users WHERE id=? AND lower(role)='factory' AND is_active=1").bind(userId).first();
      if (!target || userId===supervisorId) return fail('Only active factory users can be assigned',403);
      const existing=await env.DB.prepare("SELECT job_type FROM pz_staff_assignments WHERE user_id=?").bind(userId).first();
      if (existing?.job_type==='supervisor') return fail('Cannot reassign supervisor as staff',403);
      await env.DB.prepare(
        "INSERT INTO pz_staff_assignments (user_id,department_id,supervisor_id,job_type,created_by,created_at,updated_at) " +
        "VALUES (?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET department_id=excluded.department_id," +
        "supervisor_id=excluded.supervisor_id,job_type=excluded.job_type,updated_at=excluded.updated_at"
      ).bind(userId,departmentId,supervisorId,kind,actor,now,now).run();
      return json({success:true,id:userId});
    }
    const match=path.match(/^\/supervisor\/accounts\/([^/]+)(?:\/(password))?$/);
    if (match && (method==='PATCH' || (method==='POST' && match[2]==='password'))) {
      const id=decodeURIComponent(match[1]);
      const target=await managedTarget(env,id,actor);
      if (!target) return fail('Account not in your team',403);
      const own=await actorAssignment(env,actor);
      if (!own || own.job_type!=='supervisor' || own.department_id!==target.department_id || own.is_active!==1)
        return fail('Department permission denied',403);
      const body=await jsonBody(request);
      if (!body) return fail('Invalid request');
      if (match[2]==='password') {
        if (typeof body.password!=='string') return fail('Missing password');
        const error=passwordPolicy(body.password,target.username);
        if (error) return fail(error);
        const digest=await hash(body.password,10);
        await env.DB.prepare("UPDATE users SET password_hash=? WHERE id=?").bind(digest,id).run();
      } else {
        if (typeof body.is_active!=='boolean' || Object.keys(body).some(k=>k!=='is_active'))
          return fail('Only account activation may be changed');
        await env.DB.prepare("UPDATE users SET is_active=? WHERE id=?").bind(body.is_active?1:0,id).run();
      }
      return json({success:true,id});
    }
    return fail('Method or organization endpoint not found',405);
  };
}
