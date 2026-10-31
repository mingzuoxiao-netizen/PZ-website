/**
 * PZ Factory Category Requests — STAGING ONLY candidate patch.
 *
 * Integrate into the existing V3.2 Worker fetch() after its try {:
 *
 *   const categoryResult = await handleFactoryCategoryRequests({
 *     request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
 *   });
 *   if (categoryResult) return categoryResult;
 *
 * When pasting this into a single-file Worker, remove "export" below.
 * If bundling modules, import this function normally.
 *
 * Preconditions: review the actual Staging D1 category_requests schema against
 * worker-patches/migrations/003_factory_category_requests_staging.sql.
 * DO NOT deploy this candidate to Production.
 */
export async function handleFactoryCategoryRequests({
  request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
}) {
  const create = pathname === '/factory/category-requests' && request.method === 'POST';
  const submitMatch = pathname.match(/^\/factory\/category-requests\/([^/]+)\/submit$/);
  if (!create && !(submitMatch && request.method === 'POST')) return null;

  // Fail closed: this patch is designed exclusively for isolated Staging QA.
  if (String(env.PZ_RUNTIME_ENV || '').toLowerCase() !== 'staging') {
    return json({ error: 'Category request patch restricted to Staging' }, 403);
  }
  const auth = await authorize(request, env, ['FACTORY', 'ADMIN']);
  if (auth instanceof Response) return auth;

  if (create) {
    if (!(request.headers.get('content-type') || '').toLowerCase().includes('application/json')) {
      return json({ error: 'JSON request required' }, 415);
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 12000) {
      return json({ error: 'Request too large' }, 413);
    }
    let body;
    try { body = JSON.parse(raw); } catch { return badRequest('Invalid JSON'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return badRequest('Invalid category request');
    }
    for (const key of ['title', 'title_cn', 'subtitle', 'description', 'image']) {
      if (body[key] != null && typeof body[key] !== 'string') {
        return badRequest('Invalid field: ' + key);
      }
    }
    const title = (body.title || '').trim();
    const titleCn = (body.title_cn || '').trim();
    const subtitle = (body.subtitle || '').trim();
    const description = (body.description || '').trim();
    const image = (body.image || '').trim();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (title.length < 2 || title.length > 100 || !slug || slug.length > 100) {
      return badRequest('Valid English category title (2-100 characters) is required');
    }
    if (titleCn.length > 100 || subtitle.length > 200 || description.length > 2000) {
      return badRequest('Category field is too long');
    }

    // Accept only an image that exists in THIS staging R2 bucket.
    const imageBase = pzConfiguredImageBase(env);
    if (!imageBase || !image || image.length > 2048) {
      return badRequest('A Staging R2 cover image is required');
    }
    let imageKey;
    try {
      const uri = new URL(image);
      imageKey = decodeURIComponent(uri.pathname.replace(/^\/+/, ''));
      if (uri.origin !== imageBase || uri.search || uri.hash ||
          !imageKey.startsWith('uploads/') || imageKey.includes('..')) {
        return badRequest('Cover image must use the current Staging R2 upload URL');
      }
    } catch {
      return badRequest('Invalid cover image URL');
    }
    if (!env.PRODUCT_IMAGES || !(await env.PRODUCT_IMAGES.head(imageKey))) {
      return badRequest('Cover image not found in Staging R2');
    }

    // Reject duplicates already approved or awaiting review.
    const draftRaw = await env.SITE_CONFIG_KV.get('draft:site_config');
    if (!draftRaw) {
      return json({ error: 'Staging draft site config is missing; initialize it in Admin before accepting new categories' }, 503);
    }
    let draftConfig;
    try { draftConfig = JSON.parse(draftRaw); } catch { draftConfig = null; }
    if (!draftConfig || !Array.isArray(draftConfig.categories)) {
      return json({ error: 'Staging draft site config lacks category registry; initialize in Admin first' }, 503);
    }
    const publicRaw = await env.SITE_CONFIG_KV.get('published:site_config');
    for (const rawConfig of [draftRaw, publicRaw]) {
      let parsed = {};
      try { parsed = JSON.parse(rawConfig || '{}'); } catch {}
      if (Array.isArray(parsed?.categories) &&
          parsed.categories.some(c => String(c.id || '').toLowerCase() === slug)) {
        return json({ error: 'Category already exists', code: 'CATEGORY_CONFLICT' }, 409);
      }
    }
    const pending = await env.DB.prepare(
      "SELECT id FROM category_requests WHERE lower(title) = lower(?) AND status IN ('draft','awaiting_review','approved') LIMIT 1"
    ).bind(title).first();
    if (pending) {
      return json({ error: 'Category request already exists', code: 'CATEGORY_CONFLICT' }, 409);
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const inserted = await env.DB.prepare(
      "INSERT INTO category_requests (id, title, title_cn, subtitle, description, image, status, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, title, titleCn, subtitle, description, image, 'draft', auth.user.id, now, now).run();
    if (inserted?.meta?.changes !== 1) {
      return json({ error: 'Category draft creation not confirmed' }, 500);
    }
    return json({ success: true, id, status: 'draft' }, 201);
  }

  let id;
  try { id = decodeURIComponent(submitMatch[1]); } catch { return badRequest('Invalid category request ID'); }
  if (!/^[a-f0-9-]{36}$/i.test(id)) return badRequest('Invalid category request ID');
  const now = new Date().toISOString();
  const updated = await env.DB.prepare(
    "UPDATE category_requests SET status = 'awaiting_review', updated_at = ? WHERE id = ? AND status = 'draft' AND user_id = ?"
  ).bind(now, id, auth.user.id).run();
  if (updated?.meta?.changes !== 1) {
    return json({ error: 'Draft not found, not owned by this account, or already submitted' }, 409);
  }
  return json({ success: true, id, status: 'awaiting_review' });
}
