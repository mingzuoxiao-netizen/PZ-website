// Production review candidate: NOT DEPLOYED. Requires full-worker integration,
// schema migration, regression tests and explicit release approval.
// This module NEVER writes published:site_config or edits legacy category_requests.
/**
 * Production category amendment routes — REVIEW ONLY. Integrate into the PRODUCTION Worker after explicit review
 * fetch() after existing authentication helpers, before the 404 fallback:
 *
 * const response = await handleCategoryChanges({
 *   request, env, pathname, authorize, json, badRequest
 * });
 * if (response) return response;
 *
 * Never deploy without Production migration, concurrency review and approval.
 */
const EDITABLE = ['title','title_cn','subtitle','description','image'];
const MAX = { title: 120, title_cn: 120, subtitle: 500, description: 2000, image: 2048 };
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const serial = (value) => JSON.stringify(value);

function fields(category) {
  const out = {};
  for (const key of EDITABLE) out[key] = String(category?.[key] ?? '');
  // Some existing categories use title_zh as the Chinese display name.
  if (!out.title_cn) out.title_cn = String(category?.title_zh ?? '');
  return out;
}

function conflict(message, json) {
  return json({ error: message, code: 'CATEGORY_CONFLICT' }, 409);
}

function parseRows(result) {
  return (result?.results ?? []).map(row => ({
    ...row,
    base: JSON.parse(row.base_json),
    proposed: JSON.parse(row.proposed_json)
  }));
}

function parseConfig(raw) {
  try {
    const config = JSON.parse(raw || 'null');
    return config && Array.isArray(config.categories) ? config : null;
  } catch { return null; }
}

function validateProposed(input, base, badRequest) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return badRequest('Invalid category changes');
  if (Object.keys(input).some(k => !EDITABLE.includes(k))) return badRequest('Unsupported category field');
  const next = { ...base };
  for (const key of EDITABLE) {
    if (!own(input, key)) continue;
    if (typeof input[key] !== 'string') return badRequest('Invalid field: ' + key);
    next[key] = input[key].trim();
    if (next[key].length > MAX[key]) return badRequest('Field too long: ' + key);
  }
  if (!next.title) return badRequest('English title required');
  if (serial(next) === serial(base)) return badRequest('No changes submitted');
  return next;
}

/**
 * Production images must be from the configured Production CDN and their
 * upload object must exist in the Production PRODUCT_IMAGES R2 bucket.
 */
export function productionCategoryImageBase(env) {
  const runtime = String(env.PZ_RUNTIME_ENV || '').trim().toLowerCase();
  const configured = String(env.PZ_IMAGE_BASE_URL || '').trim().replace(/\/+$/, '');
  if (runtime !== 'production' || configured !== 'https://cdn.peng-zhan.com') return null;
  return configured;
}

async function validateReplacementImage(image, currentImage, env, imageBase, badRequest) {
  if (image === currentImage || image === '') return null;
  if (!imageBase || !env.PRODUCT_IMAGES) return badRequest('Staging image storage unavailable');
  let key;
  try {
    const url = new URL(image);
    if (url.origin !== imageBase || url.search || url.hash || url.username || url.password) {
      return badRequest('Cover must come from Production R2');
    }
    key = decodeURIComponent(url.pathname.slice(1));
    if (!/^uploads\/[^/]+$/.test(key) || key.includes('..')) return badRequest('Invalid image key');
  } catch { return badRequest('Invalid image URL'); }
  if (!(await env.PRODUCT_IMAGES.head(key))) return badRequest('Cover not found in Production R2');
  return null;
}

export async function handleProductionCategoryChanges({ request, env, pathname, authorize, json, badRequest }) {
  const root = '/factory/category-change-requests';
  const adminRoot = '/admin/category-change-requests';
  const matchAction = pathname.match(/^\/admin\/category-change-requests\/([^/]+)\/(approve|reject|reconcile)$/);
  if (pathname !== root && pathname !== adminRoot && !matchAction) return null;

  // Explicit environment guard: never handle Production traffic with this module.
  if (String(env.PZ_RUNTIME_ENV || '').toLowerCase() !== 'production') {
    return json({ error: 'Production-only category change handler' }, 403);
  }
  const isAdmin = pathname.startsWith('/admin/');
  const auth = await authorize(request, env, isAdmin ? ['ADMIN'] : ['FACTORY','ADMIN']);
  if (auth instanceof Response) return auth;
  const actor = auth.user?.id;
  if (!actor) return json({ error: 'Missing authenticated account' }, 401);

  if (request.method === 'GET' && !matchAction) {
    const sql = isAdmin
      ? "SELECT * FROM category_change_requests ORDER BY created_at DESC LIMIT 500"
      : "SELECT * FROM category_change_requests WHERE created_by = ? ORDER BY created_at DESC LIMIT 100";
    const query = env.DB.prepare(sql);
    const rows = isAdmin ? await query.all() : await query.bind(actor).all();
    return json({ items: parseRows(rows) });
  }

  if (pathname === root && request.method === 'POST') {
    if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'JSON required' }, 415);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 12000) return json({ error: 'Request too large' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON'); }
    const categoryId = typeof body?.category_id === 'string' ? body.category_id.trim() : '';
    if (!categoryId || categoryId.length > 120) return badRequest('Missing category_id');
    const published = parseConfig(await env.SITE_CONFIG_KV.get('published:site_config'));
    if (!published) return json({ error: 'Published category registry unavailable' }, 503);
    const existing = published.categories.find(c => c?.id === categoryId);
    if (!existing) return json({ error: 'Published category not found' }, 404);
    const base = fields(existing);
    const proposed = validateProposed(body.proposed, base, badRequest);
    if (proposed instanceof Response) return proposed;
    const requestedTitle = proposed.title.toLowerCase();
    if (published.categories.some(c => c?.id !== categoryId &&
      String(c?.title || '').trim().toLowerCase() === requestedTitle)) {
      return conflict('Another published category already uses this English title', json);
    }
    const imgError = await validateReplacementImage(proposed.image, base.image, env, productionCategoryImageBase(env), badRequest);
    if (imgError) return imgError;

    // Exactly one pending request per category, enforced by the partial unique index.
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      const inserted = await env.DB.prepare(
        "INSERT INTO category_change_requests (id,category_id,base_json,proposed_json,status,created_by,created_at,updated_at) VALUES (?,?,?,?, 'pending',?,?,?)"
      ).bind(id,categoryId,serial(base),serial(proposed),actor,now,now).run();
      if (inserted?.meta?.changes !== 1) return json({ error: 'Request not saved' }, 500);
    } catch (error) {
      if (/UNIQUE|CONSTRAINT/i.test(String(error?.message ?? error))) return conflict('Category already has a pending change request',json);
      throw error;
    }
    return json({ success: true, id, category_id: categoryId, status: 'pending' }, 201);
  }

  if (matchAction && request.method === 'POST') {
    const [, id, action] = matchAction;
    const row = await env.DB.prepare('SELECT * FROM category_change_requests WHERE id = ? LIMIT 1').bind(id).first();
    if (!row) return json({ error: 'Request not found' }, 404);
    if (action === 'reconcile') {
      if (row.status !== 'applying') return conflict('Request is not awaiting reconciliation', json);
      // Only confirm completion if the D1 proposal is already reflected in KV.
      // Do not reset an unknown partial commit based on potentially stale KV reads.
      const draft = parseConfig(await env.SITE_CONFIG_KV.get('draft:site_config'));
      const actual = draft?.categories.find(c => c.id === row.category_id);
      const proposed = JSON.parse(row.proposed_json);
      if (!actual || serial(fields(actual)) !== serial(proposed)) {
        return json({ error: 'Draft has not confirmed the proposal; keep applying and investigate', status:'applying' }, 409);
      }
      const done = await env.DB.prepare(
        "UPDATE category_change_requests SET status='approved', reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='applying'"
      ).bind(actor,now,now,id).run();
      if (done?.meta?.changes !== 1) return conflict('Request state changed during reconciliation', json);
      return json({ success:true, id, status:'approved', needsPublish:true, published:false, reconciled:true });
    }
    if (row.status !== 'pending') return conflict('Request has already been processed', json);
    const now = new Date().toISOString();
    if (action === 'reject') {
      const body = await request.json().catch(() => ({}));
      const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0,1000) : '';
      const result = await env.DB.prepare(
        "UPDATE category_change_requests SET status='rejected', reject_reason=?, reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='pending'"
      ).bind(reason,actor,now,now,id).run();
      if (result?.meta?.changes !== 1) return conflict('Request was processed elsewhere',json);
      return json({ success:true, id, status:'rejected' });
    }

    // Claim request first to prevent two admins applying the same proposal.
    const claim = await env.DB.prepare(
      "UPDATE category_change_requests SET status='applying', updated_at=? WHERE id=? AND status='pending'"
    ).bind(now,id).run();
    if (claim?.meta?.changes !== 1) return conflict('Request was processed elsewhere',json);
    let savedDraft = false;
    try {
      const [publishedRaw,draftRaw] = await Promise.all([
        env.SITE_CONFIG_KV.get('published:site_config'),
        env.SITE_CONFIG_KV.get('draft:site_config')
      ]);
      const published = parseConfig(publishedRaw);
      const draft = parseConfig(draftRaw);
      if (!published || !draft) return conflict('Site configuration draft is unavailable',json);
      const live = published.categories.find(c => c.id === row.category_id);
      const editable = draft.categories.find(c => c.id === row.category_id);
      const base = JSON.parse(row.base_json);
      if (!live || !editable || serial(fields(live)) !== serial(base) ||
          serial(fields(editable)) !== serial(base)) {
        return conflict('Category changed since submission; review and resubmit',json);
      }
      const proposed = JSON.parse(row.proposed_json);
      const requestedTitle = String(proposed.title || '').trim().toLowerCase();
      if ([...draft.categories, ...published.categories].some(c =>
        c?.id !== row.category_id && String(c?.title || '').trim().toLowerCase() === requestedTitle)) {
        return conflict('Another category now uses the proposed English title', json);
      }
      const err = await validateReplacementImage(proposed.image,base.image,env,productionCategoryImageBase(env),badRequest);
      if (err) return err;
      // Preserve id, subCategories, product relationships, and all unedited fields.
      draft.categories = draft.categories.map(c => c.id === row.category_id
        ? { ...c, ...proposed, title_zh: proposed.title_cn }
        : c);
      await env.SITE_CONFIG_KV.put('draft:site_config',JSON.stringify(draft));
      savedDraft = true;
      const completed = await env.DB.prepare(
        "UPDATE category_change_requests SET status='approved', reviewed_by=?, reviewed_at=?, updated_at=? WHERE id=? AND status='applying'"
      ).bind(actor,now,now,id).run();
      if (completed?.meta?.changes !== 1) {
        // Draft may already contain the change. Leave 'applying' for review.
        return json({ error: 'Draft saved but approval status not confirmed. Manual reconciliation required.' }, 503);
      }
      return json({ success:true, id, status:'approved', needsPublish:true, published:false });
    } finally {
      // On validation errors reset the claim. After a successful KV write,
      // leave 'applying' for manual reconciliation instead of reapplying blindly.
      if (!savedDraft) {
        await env.DB.prepare("UPDATE category_change_requests SET status='pending' WHERE id=? AND status='applying'").bind(id).run();
      }
    }
  }

  return json({ error:'Method not allowed' }, 405);
}
