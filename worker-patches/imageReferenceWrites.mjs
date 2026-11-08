// Wrap the PZ Worker bindings so reference-bearing KV and R2 writes reset observation.
const keyPattern = /uploads\/\d{13}-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}-[a-z0-9-]{1,40}\.(?:jpg|png|webp)/gi;
const trackedKV = new Set(["draft:site_config", "published:site_config", "published:products"]);

async function withImageReferenceWrite(db, payload, write) {
  if (typeof payload !== "string") throw new TypeError("Expected a serialized image reference payload");
  const normalized = payload.replace(/%2f|\\u002f|\\\//gi, "/");
  const keys = [...new Set([...normalized.matchAll(keyPattern)].map(([key]) => key.toLowerCase()))];
  const id = crypto.randomUUID();
  const startedAt = new Date().toISOString();
  const begin = [
    db.prepare("INSERT INTO pz_image_reference_writes (id, started_at) VALUES (?, ?)").bind(id, startedAt),
    db.prepare("UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id=1"),
  ];
  for (let i = 0; i < keys.length; i += 50) {
    begin.push(db.prepare(
      "DELETE FROM pz_image_inventory_candidates WHERE lower(object_key) IN (SELECT value FROM json_each(?))"
    ).bind(JSON.stringify(keys.slice(i, i + 50))));
  }
  await db.batch(begin);
  try {
    return await write();
  } finally {
    await db.batch([
      db.prepare("UPDATE pz_product_image_generation SET generation = generation + 1 WHERE id=1"),
      db.prepare("DELETE FROM pz_image_reference_writes WHERE id=?").bind(id),
    ]);
  }
}

function guardBinding(binding, db, tracksKey) {
  return new Proxy(binding, {
    get(target, property) {
      if (property === "put") {
        return (key, payload, ...rest) => {
          const write = () => target.put(key, payload, ...rest);
          return tracksKey(key) ? withImageReferenceWrite(db, payload, write) : write();
        };
      }
      const value = Reflect.get(target, property);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export function withImageReferenceBindings(env) {
  return {
    ...env,
    SITE_CONFIG_KV: guardBinding(env.SITE_CONFIG_KV, env.DB, (key) => trackedKV.has(key)),
    SITE_CONFIG_HISTORY: guardBinding(env.SITE_CONFIG_HISTORY, env.DB,
      (key) => key.startsWith("snapshots/site_config/") || key.startsWith("snapshots/products/")),
  };
}
