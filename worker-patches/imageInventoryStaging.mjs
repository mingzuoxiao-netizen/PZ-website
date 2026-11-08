// Staging-only inventory. Optional D1 tracking records observations for review.
const imageKey = /uploads\/\d{13}-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-[a-z0-9-]{1,40}\.(?:jpg|png|webp)/gi;
const tables = [
  "products", "category_requests", "category_change_requests", "audit_logs",
  "pz_product_review_versions", "pz_published_product_revisions",
  "pz_published_revision_versions", "site_config_state",
];
const kvKeys = ["draft:site_config", "published:site_config", "published:products"];
const maxReferencesPerTable = 5_000;
const maxHistoryObjects = 100;
const maxImageObjects = 5_000;

function collectReferences(text, references) {
  // The uploader returns URLs with the full key encoded. Also accept raw keys
  // and slash escapes in stored JSON. Match conservatively regardless of origin.
  const normalized = text.replace(/%2f|\\u002f|\\\//gi, "/");
  for (const match of normalized.matchAll(imageKey)) references.add(match[0]);
}

async function* listObjects(bucket, prefix, maximum) {
  let cursor;
  let count = 0;
  do {
    const page = await bucket.list({ prefix, cursor, limit: 100 });
    count += page.objects.length;
    if (count > maximum) throw new Error(`Inventory limit reached for ${prefix}`);
    yield* page.objects;
    if (page.truncated && (!page.cursor || page.cursor === cursor)) {
      throw new Error(`Invalid inventory cursor for ${prefix}`);
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export async function scan(env, now = new Date()) {
  if (env.PZ_RUNTIME_ENV !== "staging") throw new Error("Staging runtime required");
  if (!env.DB || !env.PRODUCT_IMAGES || !env.SITE_CONFIG_KV || !env.SITE_CONFIG_HISTORY) {
    throw new Error("Missing staging inventory bindings");
  }

  const references = new Set();
  const unavailableSources = [];
  const schema = await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  const installed = new Set(schema.results.map(({ name }) => name));

  for (const table of tables) {
    if (!installed.has(table)) {
      if (table === "products") throw new Error("Missing products table");
      // Staging uses KV until D1 site configuration is explicitly enabled.
      if (table === "site_config_state" && env.PZ_D1_SITE_CONFIG_ENABLED !== "true") continue;
      unavailableSources.push(table);
      continue;
    }
    // Static allowlist above is the only source of SQL identifiers.
    const { results } = await env.DB.prepare(`SELECT * FROM ${table} LIMIT ?`)
      .bind(maxReferencesPerTable + 1).all();
    if (results.length > maxReferencesPerTable) throw new Error(`Inventory limit reached for ${table}`);
    for (const row of results) collectReferences(JSON.stringify(row), references);
  }

  for (const key of kvKeys) {
    const value = await env.SITE_CONFIG_KV.get(key);
    if (value === null) unavailableSources.push(key);
    else collectReferences(value, references);
  }

  for (const prefix of ["snapshots/site_config/", "snapshots/products/"]) {
    for await (const entry of listObjects(env.SITE_CONFIG_HISTORY, prefix, maxHistoryObjects)) {
      const object = await env.SITE_CONFIG_HISTORY.get(entry.key);
      if (!object) throw new Error("History snapshot disappeared during inventory");
      collectReferences(await object.text(), references);
    }
  }

  const candidates = [];
  const candidateVersions = {};
  let scanned = 0;
  for await (const entry of listObjects(env.PRODUCT_IMAGES, "uploads/", maxImageObjects)) {
    const [matchedKey] = entry.key.match(imageKey) ?? [];
    if (matchedKey !== entry.key) continue;
    scanned++;
    if (!references.has(entry.key)) {
      candidates.push(entry.key);
      candidateVersions[entry.key] = entry.version ?? null;
    }
  }

  return {
    observedAt: now.toISOString(),
    unavailableSources,
    scanned,
    candidates,
    candidateVersions,
  };
}

export async function recordObservations(db, report, generation) {
  // A failed or incomplete sweep must not create an observation window.
  const complete = report.unavailableSources.length === 0 &&
    report.candidates.every((key) => report.candidateVersions[key]);
  const observedAt = report.observedAt;
  const previousCutoff = new Date(Date.parse(observedAt) - 15 * 60_000).toISOString();
  const fresh = "EXISTS (SELECT 1 FROM pz_image_inventory_checkpoint WHERE id=1 AND observed_at < ?) " +
    "AND EXISTS (SELECT 1 FROM pz_product_image_generation WHERE id=1 AND generation = ?) " +
    "AND NOT EXISTS (SELECT 1 FROM pz_image_reference_writes)";
  const writes = [];
  if (complete) {
    // Keep each JSON parameter small enough for D1. All writes share one transaction.
    for (let i = 0; i < report.candidates.length; i += 100) {
      const objects = report.candidates.slice(i, i + 100).map((key) => ({
        key, version: report.candidateVersions[key],
      }));
      writes.push(db.prepare(`
        INSERT INTO pz_image_inventory_candidates
          (object_key, object_version, first_observed_at, last_observed_at)
        SELECT json_extract(value, '$.key'), json_extract(value, '$.version'), ?, ?
        FROM json_each(?) WHERE ${fresh}
        ON CONFLICT(object_key) DO UPDATE SET
          object_version = excluded.object_version,
          first_observed_at = CASE
            WHEN object_version = excluded.object_version AND last_observed_at >= ?
              THEN first_observed_at
            ELSE excluded.first_observed_at END,
          last_observed_at = excluded.last_observed_at
      `).bind(observedAt, observedAt, JSON.stringify(objects), observedAt, generation, previousCutoff));
    }
  }
  // Remove entries that are referenced, have disappeared, or could not be checked.
  writes.push(db.prepare(`
    DELETE FROM pz_image_inventory_candidates
    WHERE last_observed_at < ? AND ${fresh}
  `).bind(observedAt, observedAt, generation));
  writes.push(db.prepare(`
    UPDATE pz_image_inventory_checkpoint SET observed_at = ?
    WHERE id=1 AND ${fresh}
  `).bind(observedAt, observedAt, generation));
  const results = await db.batch(writes);
  return { complete, recorded: results.at(-1).meta?.changes === 1 };
}

export async function reviewMatureCandidates(env, report, generation) {
  const cutoff = new Date(Date.parse(report.observedAt) - 30 * 24 * 60 * 60_000).toISOString();
  const { results } = await env.DB.prepare(`
    SELECT object_key, object_version, first_observed_at
    FROM pz_image_inventory_candidates
    WHERE first_observed_at <= ? AND last_observed_at = ?
      AND EXISTS (SELECT 1 FROM pz_product_image_generation WHERE id=1 AND generation=?)
      AND NOT EXISTS (SELECT 1 FROM pz_image_reference_writes)
    ORDER BY first_observed_at, object_key LIMIT 20
  `).bind(cutoff, report.observedAt, generation).all();
  for (const row of results) {
    const object = await env.PRODUCT_IMAGES.head(row.object_key);
    if (object?.version === row.object_version) {
      console.log(JSON.stringify({ event: "pz_image_mature_candidate", ...row }));
    }
  }
  return results.length;
}

export default {
  async scheduled(_controller, env) {
    if (env.PZ_RUNTIME_ENV !== "staging") throw new Error("Staging runtime required");
    const trackingEnabled = env.PZ_IMAGE_OBSERVATION_TRACKING !== "false";
    const checkpoint = trackingEnabled ? await env.DB.prepare(
      "SELECT generation FROM pz_product_image_generation WHERE id=1"
    ).first() : null;
    if (trackingEnabled && !Number.isSafeInteger(checkpoint?.generation)) {
      throw new Error("Missing product image generation checkpoint");
    }
    const result = await scan(env);
    const tracking = trackingEnabled ? await recordObservations(env.DB, result, checkpoint.generation) : null;
    const { candidates, candidateVersions: _versions, ...report } = result;
    if (tracking?.complete && tracking.recorded) {
      await reviewMatureCandidates(env, result, checkpoint.generation);
    }
    console.log(JSON.stringify({ event: "pz_image_observation_tracking", trackingEnabled, ...tracking, unavailableSources: report.unavailableSources.join(", ") }));
    console.log(JSON.stringify({ event: "pz_image_inventory", ...report, candidateCount: candidates.length }));
    for (const key of candidates) {
      console.log(JSON.stringify({ event: "pz_image_inventory_candidate", observedAt: report.observedAt, key }));
    }
  },
};
