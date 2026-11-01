// Reusable Worker audit implementation. The complete function is embedded in
// both review Worker bundles because Cloudflare dashboard deploys one pasted file.
// Migration 008 MUST be applied to the correct D1 before deploying that bundle.
// Entries are reserved BEFORE each audited mutation; incomplete entries remain
// visibly "pending" rather than silently claiming successful audit coverage.

export function pzAuditCreateFetch(originalFetch, { authorize, json, runtimeExpected }) {
  const maxLimit = 100;
  const productFields = [
    "name", "name_cn", "category", "sub_category", "material", "size", "finish",
    "code", "status", "images", "production_sites", "created_by", "updated_at"
  ];
  const accountFields = ["username", "role", "is_active"];
  const validStatuses = new Set(["pending", "success", "failed"]);

  function classify(path, method) {
    if (path === "/site-config" && method === "PUT")
      return { action: "site_config.save_draft", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/publish" && method === "POST")
      return { action: "site_config.publish", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/rollback" && method === "POST")
      return { action: "site_config.rollback", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/site-config/bootstrap" && method === "POST")
      return { action: "site_config.bootstrap", entity_type: "site_config", entity_id: "site" };
    if (path === "/admin/publish/products" && method === "POST")
      return { action: "product.publish_catalog", entity_type: "catalog", entity_id: "catalog" };
    if (path === "/admin/upload-pdf" && method === "POST")
      return { action: "media.upload_pdf", entity_type: "media", entity_id: "" };
    if (path === "/upload-image" && method === "POST")
      return { action: "media.upload_image", entity_type: "media", entity_id: "" };
    if (path === "/admin/accounts" && method === "POST")
      return { action: "account.create", entity_type: "account", entity_id: "" };
    let m = path.match(/^\/admin\/accounts\/([^/]+)\/password$/);
    if (m && method === "POST")
      return { action: "account.reset_password", entity_type: "account", entity_id: decodeURIComponent(m[1]) };
    m = path.match(/^\/admin\/accounts\/([^/]+)$/);
    if (m && method === "PUT")
      return { action: "account.update", entity_type: "account", entity_id: decodeURIComponent(m[1]) };
    for (const prefix of ["admin", "factory"]) {
      if (path === `/${prefix}/products` && method === "POST")
        return { action: "product.create", entity_type: "product", entity_id: "" };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)/submit$`));
      if (m && method === "POST")
        return { action: "product.submit", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)/remove-image$`));
      if (m && method === "POST")
        return { action: "product.remove_image", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
      m = path.match(new RegExp(`^/${prefix}/products/([^/]+)$`));
      if (m && (method === "PUT" || method === "DELETE"))
        return { action: method === "DELETE" ? "product.delete" : "product.update", entity_type: "product", entity_id: decodeURIComponent(m[1]) };
    }
    if (path === "/factory/category-requests" && method === "POST")
      return { action: "category.request_create", entity_type: "category_request", entity_id: "" };
    m = path.match(/^\/admin\/category[-_]requests\/([^/]+)\/(approve|reject)$/);
    if (m && method === "POST")
      return { action: `category.${m[2]}`, entity_type: "category_request", entity_id: decodeURIComponent(m[1]) };
    if (path === "/factory/category-change-requests" && method === "POST")
      return { action: "category.change_request", entity_type: "category_change", entity_id: "" };
    m = path.match(/^\/admin\/category-change-requests\/([^/]+)\/(approve|reject|reconcile)$/);
    if (m && method === "POST")
      return { action: `category_change.${m[2]}`, entity_type: "category_change", entity_id: decodeURIComponent(m[1]) };
    return null;
  }

  function safeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }
  function stringifySafe(value) {
    const serialized = JSON.stringify(value ?? {});
    // Do not write potentially huge product descriptions or arbitrary request bodies.
    return serialized.length <= 16000 ? serialized : JSON.stringify({ truncated: true });
  }
  function safeSummary(row, fields) {
    if (!row) return null;
    const result = {};
    for (const key of fields) {
      if (row[key] === undefined) continue;
      if (key === "images" || key === "production_sites") {
        try {
          const v = JSON.parse(row[key] || "[]");
          result[key + "_count"] = Array.isArray(v) ? v.length : 0;
        } catch { result[key + "_count"] = 0; }
      } else if (key === "updated_at") {
        result[key] = row[key] ?? null;
      } else {
        result[key] = typeof row[key] === "string" ? row[key].slice(0, 240) : row[key];
      }
    }
    return result;
  }

  async function snapshot(env, entityType, id) {
    if (!env.DB) return null;
    if (entityType === "product" && id) {
      const row = await env.DB.prepare(
        "SELECT name,name_cn,category,sub_category,material,size,finish,code,status,images,production_sites,created_by,updated_at FROM products WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, productFields);
    }
    if (entityType === "account" && id) {
      const row = await env.DB.prepare(
        "SELECT username,role,is_active FROM users WHERE id=? LIMIT 1"
      ).bind(id).first();
      return safeSummary(row, accountFields);
    }
    if (entityType === "site_config") {
      if (String(env.PZ_D1_SITE_CONFIG_ENABLED || "").toLowerCase() === "true") {
        const row = await env.DB.prepare(
          "SELECT draft_revision,published_revision,published_version FROM site_config_state WHERE id=1"
        ).first();
        return row ? { draft_revision: row.draft_revision, published_revision: row.published_revision,
          published_version: row.published_version } : null;
      }
      return { store: "kv" };
    }
    return null;
  }

  function changes(before, after) {
    if (!before || !after) return [];
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    return [...keys].filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k])).slice(0, 50);
  }

  async function readLogs(request, env) {
    const auth = await authorize(request, env, ["ADMIN"]);
    if (auth instanceof Response) return auth;
    if (!env.DB) return json({ error: "Audit D1 unavailable" }, 503);
    const params = new URL(request.url).searchParams;
    const limit = Math.max(1, Math.min(maxLimit, Number.parseInt(params.get("limit") || "30", 10) || 30));
    const page = Math.max(1, Math.min(10000, Number.parseInt(params.get("page") || "1", 10) || 1));
    const where = [];
    const bindings = [];
    for (const [column, param] of [
      ["actor_username", "actor"], ["action", "action"],
      ["entity_type", "type"], ["status", "status"]
    ]) {
      const value = (params.get(param) || "").trim();
      if (!value) continue;
      if (value.length > 120) return json({ error: "Invalid filter length" }, 400);
      if (param === "status" && !validStatuses.has(value))
        return json({ error: "Invalid audit status" }, 400);
      where.push(column + " = ?");
      bindings.push(value);
    }
    for (const [param, comparator] of [["from", ">="], ["to", "<="]]) {
      const value = (params.get(param) || "").trim();
      if (!value) continue;
      if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value))
        return json({ error: "Invalid date filter" }, 400);
      where.push("created_at " + comparator + " ?");
      bindings.push(value.length === 10 ? value + (param === "from" ? "T00:00:00.000Z" : "T23:59:59.999Z") : value);
    }
    const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";
    try {
      const totalRow = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM audit_logs" + whereSql
      ).bind(...bindings).first();
      const rows = await env.DB.prepare(
        "SELECT id,created_at,actor_id,actor_username,actor_role,action,entity_type,entity_id,status,http_status,before_json,after_json,changes_json FROM audit_logs" +
        whereSql + " ORDER BY created_at DESC,id DESC LIMIT ? OFFSET ?"
      ).bind(...bindings, limit, (page - 1) * limit).all();
      return json({
        items: (rows.results || []).map(row => ({
          id: row.id, created_at: row.created_at, actor_id: row.actor_id,
          actor_username: row.actor_username, actor_role: row.actor_role,
          action: row.action, entity_type: row.entity_type, entity_id: row.entity_id,
          status: row.status, http_status: row.http_status,
          before: safeObject(JSON.parse(row.before_json || "{}")),
          after: safeObject(JSON.parse(row.after_json || "{}")),
          changed_fields: JSON.parse(row.changes_json || "[]")
        })),
        total: Number(totalRow?.total || 0), page, limit
      });
    } catch (err) {
      console.error("Audit log read failed", err);
      return json({ error: "Audit log storage unavailable" }, 503);
    }
  }

  return async function auditFetch(request, env, ctx) {
    // Preserve each standalone Worker's own environment isolation behavior.
    // In particular Staging-only category routes must keep returning 403 in
    // production mode, before audit authentication is even considered.
    if (runtimeExpected && String(env?.PZ_RUNTIME_ENV || "").toLowerCase() !== runtimeExpected) {
      return originalFetch.call(this, request, env, ctx);
    }
    const path = new URL(request.url).pathname;
    if (path === "/admin/audit-logs") {
      if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
      return readLogs(request, env);
    }
    const event = classify(path, request.method);
    if (!event) return originalFetch.call(this, request, env, ctx);

    const roles = path.startsWith("/admin/") || path === "/site-config"
      ? ["ADMIN"] : ["FACTORY", "ADMIN"];
    const auth = await authorize(request, env, roles);
    if (auth instanceof Response) return auth;
    if (!env.DB) return json({ error: "Audit storage unavailable" }, 503);

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    let before = null;
    try {
      before = await snapshot(env, event.entity_type, event.entity_id);
      // Reserve the event before the mutation. A migration/binding failure blocks
      // mutations, rather than permitting unaudited changes.
      await env.DB.prepare(
        "INSERT INTO audit_logs (id,created_at,actor_id,actor_username,actor_role,action,entity_type,entity_id,status,http_status,before_json,after_json,changes_json) " +
        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
      ).bind(id,createdAt,auth.user.id,auth.user.username,auth.user.role,
        event.action,event.entity_type,event.entity_id,"pending",null,
        stringifySafe(before),null,null).run();
    } catch (err) {
      console.error("Audit reservation failed; mutation blocked", err);
      return json({ error: "Audit logging unavailable; no changes applied" }, 503);
    }

    let response;
    try {
      response = await originalFetch.call(this, request, env, ctx);
    } catch (err) {
      console.error("Audited mutation threw", err);
      try {
        await env.DB.prepare(
          "UPDATE audit_logs SET status='failed',http_status=500 WHERE id=? AND status='pending'"
        ).bind(id).run();
      } catch (logError) { console.error("Audit failure finalization failed", logError); }
      throw err;
    }

    // Only post-operation data is captured. No passwords, tokens, customer
    // messages, raw request payloads or customer email addresses are persisted.
    try {
      let body = {};
      if ((response.headers.get("content-type") || "").includes("application/json")) {
        try { body = safeObject(await response.clone().json()); } catch { body = {}; }
      }
      const success = response.ok && body.success !== false && !body.error;
      const entityId = event.entity_id || String(success ? (body.id || body.key || "") : "").slice(0, 200);
      const after = success ? await snapshot(env,event.entity_type,entityId) : null;
      const diff = changes(before, after);
      // When an ID comes back in a create response, the INSERT always stores it.
      await env.DB.prepare(
        "UPDATE audit_logs SET entity_id=?,status=?,http_status=?,after_json=?,changes_json=? WHERE id=? AND status='pending'"
      ).bind(entityId,success?"success":"failed",response.status,
        success?stringifySafe(after):null,JSON.stringify(diff),id).run();
    } catch (err) {
      // An event has already been persisted as pending. Surfacing this state
      // avoids representing an unconfirmed finalization as a successful log.
      console.error("Audit finalization failed; pending event retained", id, err);
      const headers = new Headers(response.headers);
      headers.set("X-PZ-Audit-State", "pending");
      return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
    }
    return response;
  };
}
