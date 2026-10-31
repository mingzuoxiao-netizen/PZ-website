/**
 * PZ Factory Category Requests — PRODUCTION CANDIDATE (NOT DEPLOYED).
 * Adapted to the VERIFIED existing Production D1 table:
 * id, title, title_cn, subtitle, image, status, created_at, updated_at.
 *
 * No database migration, draft/submit endpoint, description/user_id columns
 * or public KV write. POST creates an immediately reviewable "pending" request.
 *
 * Integration in CURRENT Production Worker fetch() try block:
 *
 * const response = await handleFactoryCategoryRequests({
 *   request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
 * });
 * if (response) return response;
 *
 * Remove "export" only if pasting into a single-file Worker editor.
 * Never deploy without separate review of current Production Worker, bindings, and D1.
 */
export async function handleFactoryCategoryRequests({
  request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
}) {
  if (pathname !== '/factory/category-requests' || request.method !== 'POST') {
    return null;
  }
  if (String(env.PZ_RUNTIME_ENV || '').trim().toLowerCase() !== 'production') {
    return json({ error: 'This category request handler requires Production runtime' }, 403);
  }
  const auth = await authorize(request, env, ['FACTORY', 'ADMIN']);
  if (auth instanceof Response) return auth;

  const contentType = (request.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    return json({ error: 'Expected application/json' }, 415);
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
  for (const field of ['title', 'title_cn', 'subtitle', 'description', 'image']) {
    if (body[field] != null && typeof body[field] !== 'string') {
      return badRequest('Invalid field: ' + field);
    }
  }
  const title = String(body.title || '').trim();
  const titleCn = String(body.title_cn || '').trim();
  const subtitle = String(body.subtitle || '').trim();
  const image = String(body.image || '').trim();
  const slug = title.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (title.length < 2 || title.length > 100 || !slug) {
    return badRequest('English category name must be 2–100 characters');
  }
  if (titleCn.length > 100 || subtitle.length > 200) {
    return badRequest('Category field too long');
  }
  // The legacy D1 table has no description column. Never falsely claim the
  // description is persisted. Keep this input out of INSERT until migrated.
  if (String(body.description || '').length > 2000) {
    return badRequest('Description too long');
  }

  // Cover must come from THIS Staging R2 bucket, not an arbitrary URL.
  const imageBase = pzConfiguredImageBase(env);
  if (imageBase !== 'https://cdn.peng-zhan.com' || !image || image.length > 2048) {
    return badRequest('A Production R2 cover image is required');
  }
  let imageKey = '';
  try {
    const uri = new URL(image);
    if (uri.origin !== imageBase || uri.username || uri.password ||
        uri.search || uri.hash || !uri.pathname.startsWith('/')) {
      return badRequest('Cover image must be a Production R2 upload');
    }
    imageKey = decodeURIComponent(uri.pathname.substring(1));
    if (!/^uploads\/[^/]+$/.test(imageKey) || imageKey.includes('..')) {
      return badRequest('Invalid cover image key');
    }
  } catch (_) {
    return badRequest('Invalid cover image URL');
  }
  if (!env.PRODUCT_IMAGES || !(await env.PRODUCT_IMAGES.head(imageKey))) {
    return badRequest('Cover image not found in Production R2');
  }

  // A configured draft must exist. The older Admin approval route publishes
  // from draft KV; an absent draft could overwrite other categories.
  const draftRaw = await env.SITE_CONFIG_KV.get('draft:site_config');
  let draft;
  try { draft = JSON.parse(draftRaw || 'null'); } catch { draft = null; }
  if (!draft || !Array.isArray(draft.categories)) {
    return json({ error: 'Initialize the Production website draft category registry first' }, 503);
  }
  const publishedRaw = await env.SITE_CONFIG_KV.get('published:site_config');
  for (const rawConfig of [draftRaw, publishedRaw]) {
    let parsed = null;
    try { parsed = JSON.parse(rawConfig || 'null'); } catch (_) {}
    if (Array.isArray(parsed?.categories) && parsed.categories.some(c =>
      String(c.id || '').toLowerCase() === slug ||
      String(c.title || '').trim().toLowerCase() === title.toLowerCase()
    )) {
      return json({ error: 'Category already exists', code: 'CATEGORY_CONFLICT' }, 409);
    }
  }
  const existing = await env.DB.prepare(
    "SELECT title FROM category_requests WHERE status IN ('pending', 'awaiting_review', 'approved')"
  ).all();
  if ((existing?.results || []).some(row => {
    const oldTitle = String(row.title || '').trim().toLowerCase();
    const oldSlug = oldTitle.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return oldTitle === title.toLowerCase() || oldSlug === slug;
  })) {
    return json({ error: 'Category request already exists', code: 'CATEGORY_CONFLICT' }, 409);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  // The verified legacy table has only eight columns and defaults to pending.
  const inserted = await env.DB.prepare(
    "INSERT INTO category_requests (id, title, title_cn, subtitle, image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)"
  ).bind(id, title, titleCn, subtitle, image, now, now).run();
  if (inserted?.meta?.changes !== 1) {
    return json({ error: 'Category request save not confirmed' }, 500);
  }
  return json({ success: true, id, status: 'pending' }, 201);
}
