import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';

const worker = readFileSync(new URL('../worker-patches/PZ_Staging_Worker_PR15_Security_Candidate.js', import.meta.url), 'utf8');

type MetaResult = { version?: string; publishedAt?: string | null; source?: string; error?: string };
function getMetaHandler(): (env: any) => Promise<Response> {
  const start = worker.indexOf('async function pzStagingSiteConfigMeta(env)');
  const end = worker.indexOf('\nvar index_default = {', start);
  assert.ok(start > 0 && end > start, 'Staging Worker must contain the read-only metadata handler');
  const fn = new Function('crypto', 'safeJsonParse', 'json', worker.slice(start, end) +
    '\nreturn pzStagingSiteConfigMeta;')(
      webcrypto,
      (raw: string | null, fallback: any) => {
        try { return typeof raw === 'string' ? JSON.parse(raw) : fallback; } catch { return fallback; }
      },
      (obj: unknown, status = 200) =>
        new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
    );
  return fn as (env: any) => Promise<Response>;
}
function stagingEnv(kv = new Map<string, string>()) {
  return {
    PZ_RUNTIME_ENV: 'staging',
    SITE_CONFIG_KV: { get: async (key: string) => kv.get(key) ?? null },
    kv
  };
}

test('staging meta route exists and is GET-only', () => {
  assert.ok(worker.includes('pathname === "/site-config/meta"'));
  assert.ok(worker.includes('pathname === "/api/site-config/meta"'));
  assert.ok(worker.includes('if (request.method !== "GET") return json({ error: "Method not allowed" }, 405)'));
});

test('returns actual published KV version if valid', async () => {
  const kv = new Map([
    ['published:meta', JSON.stringify({ version: 'test-version-123', publishedAt: '2026-10-31T00:00:00Z' })]
  ]);
  const r = await getMetaHandler()(stagingEnv(kv));
  const obj = await r.json() as MetaResult;
  assert.equal(r.status, 200);
  assert.equal(r.headers.get('Cache-Control'), 'no-store');
  assert.equal(obj.version, 'test-version-123');
  assert.equal(obj.source, 'kv-meta');
});

test('falls back to stable published-content SHA when metadata missing', async () => {
  const kv = new Map([['published:site_config', JSON.stringify({ categories: [{ id: 'chairs' }] })]]);
  const handler = getMetaHandler();
  const first = await (await handler(stagingEnv(kv))).json() as MetaResult;
  const second = await (await handler(stagingEnv(kv))).json() as MetaResult;
  assert.match(String(first.version), /^kv-sha256-[a-f0-9]{64}$/);
  assert.equal(first.version, second.version);
  kv.set('published:site_config', JSON.stringify({ categories: [{ id: 'tables' }] }));
  const third = await (await handler(stagingEnv(kv))).json() as MetaResult;
  assert.notEqual(first.version, third.version);
});

test('fails closed on missing published config, never mutates KV, rejects production mode', async () => {
  const handler = getMetaHandler();
  const env = stagingEnv(new Map());
  assert.equal((await handler(env)).status, 503);
  assert.equal((await handler({ ...env, PZ_RUNTIME_ENV: 'production' })).status, 403);
});
