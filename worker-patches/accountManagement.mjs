// Embedded in the standalone Worker bundles used by dashboard deployment.
export async function pzHandleAccountMutation(request, env, { authorize, json, normalizeRole }) {
  const match = new URL(request.url).pathname.match(/^\/admin\/accounts\/([^/]+)$/);
  if (!match || !["PUT", "DELETE"].includes(request.method)) return null;
  const auth = await authorize(request, env, ["ADMIN"]);
  if (auth instanceof Response) return auth;
  const id = decodeURIComponent(match[1]);
  const target = await env.DB.prepare("SELECT id,username,role,is_active FROM users WHERE id=? LIMIT 1").bind(id).first();
  if (!target) return json({ error: "账号不存在。" }, 404);

  if (request.method === "DELETE") {
    if (id === auth.user.id) return json({ error: "不能删除当前登录的管理员账号。" }, 409);
    // Discover foreign keys, including CASCADE/SET NULL, before deleting. Also
    // preserve ownership in legacy tables whose creator columns lack a FK.
    // Every reference check is part of the DELETE itself, avoiding a check/delete race.
    const tables = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const quote = value => '"' + String(value).replace(/"/g, '""') + '"';
    const guards = [];
    const bindings = [id];
    for (const { name } of tables.results || []) {
      if (name === "users") continue;
      const refs = await env.DB.prepare("PRAGMA foreign_key_list(" + quote(name) + ")").all();
      const columns = new Set((refs.results || [])
        .filter(ref => ref.table === "users" && (!ref.to || ref.to === "id")).map(ref => ref.from));
      if (["products", "category_requests", "category_change_requests"].includes(name)) {
        const info = await env.DB.prepare("PRAGMA table_info(" + quote(name) + ")").all();
        for (const col of info.results || []) {
          if (["created_by", "reviewed_by", "updated_by"].includes(col.name)) columns.add(col.name);
        }
      }
      for (const col of columns) {
        guards.push("NOT EXISTS (SELECT 1 FROM " + quote(name) + " WHERE " + quote(col) + "=?)");
        bindings.push(id);
      }
    }
    const result = await env.DB.prepare(
      "DELETE FROM users WHERE id=? AND (lower(role)<>'admin' OR is_active<>1 OR " +
      "(SELECT COUNT(*) FROM users WHERE lower(role)='admin' AND is_active=1)>1)" +
      (guards.length ? " AND " + guards.join(" AND ") : "")
    ).bind(...bindings).run();
    if (!result.meta?.changes) return json({ error: "该账号关联业务记录或是最后一个有效管理员，不能删除；请使用停用账号。" }, 409);
    return json({ success: true });
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: "请求格式不正确。" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式不正确。" }, 400);
  const sets = [];
  const bindings = [];
  if (Object.prototype.hasOwnProperty.call(body, "username")) {
    if (typeof body.username !== "string" || !body.username.trim() ||
        body.username.trim().length > 80 || /[\s\u0000-\u001f\u007f]/u.test(body.username.trim())) {
      return json({ error: "账号名称须为 1–80 个字符，不能包含空格或控制字符。" }, 400);
    }
    const username = body.username.trim();
    sets.push("username=?");
    bindings.push(username);
    // A conditional UPDATE enforces case-insensitive uniqueness even if the
    // legacy users table only has a case-sensitive unique constraint.
    const duplicate = await env.DB.prepare("SELECT id FROM users WHERE lower(username)=lower(?) AND id<>? LIMIT 1").bind(username, id).first();
    if (duplicate) return json({ error: "账号名称已存在。" }, 409);
  }
  if (Object.prototype.hasOwnProperty.call(body, "is_active")) {
    if (typeof body.is_active !== "boolean") return json({ error: "账号状态格式不正确。" }, 400);
    sets.push("is_active=?"); bindings.push(body.is_active ? 1 : 0);
  }
  if (Object.prototype.hasOwnProperty.call(body, "role")) {
    if (!["ADMIN", "FACTORY"].includes(String(body.role).toUpperCase())) return json({ error: "账号角色不正确。" }, 400);
    sets.push("role=?"); bindings.push(normalizeRole(body.role) === "ADMIN" ? "admin" : "factory");
  }
  if (!sets.length) return json({ error: "没有需要修改的内容。" }, 400);
  const removesAdmin = body.is_active === false || (body.role && normalizeRole(body.role) !== "ADMIN");
  if (removesAdmin && id === auth.user.id) return json({ error: "不能停用或降级当前登录的管理员账号。" }, 409);
  let guard = "";
  if (removesAdmin) guard += " AND (lower(role)<>'admin' OR is_active<>1 OR (SELECT COUNT(*) FROM users WHERE lower(role)='admin' AND is_active=1)>1)";
  if (typeof body.username === "string") {
    guard += " AND NOT EXISTS (SELECT 1 FROM users AS other WHERE lower(other.username)=lower(?) AND other.id<>?)";
  }
  bindings.push(id);
  if (typeof body.username === "string") bindings.push(body.username.trim(), id);
  try {
    const result = await env.DB.prepare("UPDATE users SET " + sets.join(",") + " WHERE id=?" + guard).bind(...bindings).run();
    if (!result.meta?.changes) return json({ error: "账号名称已存在，或该操作会移除最后一个有效管理员。" }, 409);
  } catch (error) {
    if (/UNIQUE constraint/i.test(String(error))) return json({ error: "账号名称已存在。" }, 409);
    throw error;
  }
  return json({ success: true });
}
