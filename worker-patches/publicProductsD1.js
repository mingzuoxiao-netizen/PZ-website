/**
 * PZ Product Catalog V2: D1-backed, cursor-paginated PUBLIC reads.
 *
 * INTEGRATION (Cloudflare Worker pz-inquiry-api, NOT currently in this repo):
 * Within existing GET /public/products handler, BEFORE its legacy KV branch:
 *    if (new URL(request.url).searchParams.get("v") === "2") {
 *      return handlePublicProductsD1(request, env);
 *    }
 *
 * Keep legacy KV behavior for callers without v=2 until the website moves over.
 * This helper requires the existing D1 binding env.DB and products columns
 * currently present in production. No 'is_published' column is used.
 * Do not deploy before the PZ-111 test jewelry product is un-published.
 */

const PUBLIC_SELECT = [
  "id", "name", "name_cn", "category", "sub_category", "material",
  "size", "code", "description", "description_cn", "images",
  "status", "created_at", "updated_at"
].join(", ");

// A malformed / empty JSON array never qualifies as a public product.
// SQLite CASE avoids throwing on invalid legacy image JSON.
const PUBLIC_WHERE = "status = 'published' AND length(trim(coalesce(json_extract(CASE WHEN json_valid(images) THEN images ELSE '[]' END, '$[0]'), ''))) > 0";

function publicJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Start with a short TTL; the Pages proxy must preserve it for public reads.
      // Caching at Cloudflare edge must be enabled/configured separately.
      "cache-control": "public, max-age=0, s-maxage=15",
      "x-content-type-options": "nosniff",
    }
  });
}

function normalizePublicRow(row) {
  let images = [];
  try {
    const value = typeof row.images === "string"
      ? JSON.parse(row.images)
      : row.images;
    if (Array.isArray(value)) {
      images = value.filter((s) => typeof s === "string" && s.trim());
    }
  } catch (_) {}
  return { ...row, images, image: images[0] || "", status: "published" };
}

function encodePublicCursor(row) {
  return btoa(JSON.stringify({ t: row.updated_at, id: row.id }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodePublicCursor(cursor) {
  if (!cursor) return null;
  if (cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) {
    throw new Error("Invalid cursor");
  }
  const normalized = cursor.replace(/-/g, "+").replace(/_/g, "/");
  const value = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
  if (!value || typeof value.t !== "string" || typeof value.id !== "string"
    || value.t.length > 80 || value.id.length > 100) throw new Error("Invalid cursor");
  return value;
}

function escapeLike(term) {
  return term.replace(/[\\%_]/g, "\\$&");
}

export async function handlePublicProductsD1(request, env) {
  const url = new URL(request.url);
  const sp = url.searchParams;
  const category = (sp.get("category") || "").trim().toLowerCase();
  const sub = (sp.get("sub") || "").trim().toLowerCase();
  const q = (sp.get("q") || "").trim();
  const exact = (sp.get("id") || "").trim();
  if (category.length > 100 || sub.length > 150 || q.length > 100 || exact.length > 150) {
    return publicJson({ error: "Invalid filter" }, 400);
  }

  if (sp.get("summary") === "categories") {
    // Facets are computed from D1, not the first loaded product page.
    const cats = await env.DB.prepare(
      "SELECT category, COUNT(*) AS count FROM products WHERE " + PUBLIC_WHERE +
      " GROUP BY category ORDER BY category"
    ).all();
    const subs = await env.DB.prepare(
      "SELECT category, sub_category, COUNT(*) AS count FROM products WHERE " + PUBLIC_WHERE +
      " AND sub_category IS NOT NULL AND sub_category <> '' " +
      " GROUP BY category, sub_category ORDER BY sub_category"
    ).all();
    const categories = (cats.results || []).map((c) => ({
      id: c.category,
      count: Number(c.count) || 0,
      subCategories: (subs.results || []).filter(s => s.category === c.category)
        .map((s) => ({ name: s.sub_category, count: Number(s.count) || 0 }))
    }));
    return publicJson({ categories });
  }

  if (exact) {
    const row = await env.DB.prepare(
      "SELECT " + PUBLIC_SELECT + " FROM products WHERE " + PUBLIC_WHERE +
      " AND (id = ? OR code = ?) LIMIT 1"
    ).bind(exact, exact).first();
    return row
      ? publicJson({ item: normalizePublicRow(row) })
      : publicJson({ error: "Not found" }, 404);
  }

  const requestedLimit = Number(sp.get("limit") || 24);
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 48) {
    return publicJson({ error: "limit must be 1–48" }, 400);
  }

  let cursor;
  try {
    cursor = decodePublicCursor(sp.get("cursor"));
  } catch (_) {
    return publicJson({ error: "Invalid cursor" }, 400);
  }

  const predicates = [PUBLIC_WHERE];
  const binds = [];
  if (category && category !== "all") {
    predicates.push("category = ?");
    binds.push(category);
  }
  if (sub && sub !== "all") {
    predicates.push("sub_category = ?");
    binds.push(sub);
  }
  if (q) {
    predicates.push("(name LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    const like = "%" + escapeLike(q) + "%";
    binds.push(like, like, like);
  }
  if (cursor) {
    predicates.push("(updated_at < ? OR (updated_at = ? AND id < ?))");
    binds.push(cursor.t, cursor.t, cursor.id);
  }

  const sql = "SELECT " + PUBLIC_SELECT + " FROM products WHERE " +
    predicates.join(" AND ") + " ORDER BY updated_at DESC, id DESC LIMIT ?";
  binds.push(requestedLimit + 1);
  const results = await env.DB.prepare(sql).bind(...binds).all();
  const rows = results.results || [];
  const hasMore = rows.length > requestedLimit;
  const pageRows = rows.slice(0, requestedLimit);
  return publicJson({
    items: pageRows.map(normalizePublicRow),
    nextCursor: hasMore && pageRows.length
      ? encodePublicCursor(pageRows[pageRows.length - 1])
      : null,
    hasMore
  });
}
