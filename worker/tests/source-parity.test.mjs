import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const workerDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = resolve(workerDir, '..');
const patch = readFileSync(resolve(rootDir, 'worker-patches/pz-production-unified-v2-2026-11-10.js'), 'utf8');
const imported = readFileSync(resolve(workerDir, 'src/index.js'), 'utf8');
const prefix = `// Deployment provenance: replaced in CI with the verified Git commit SHA.
// The full inlined patch bundle below is preserved until live Worker parity is proven.
const PZ_DEPLOY_SHA = "__PZ_GIT_SHA__";
`;
const anchor = '    const { pathname } = new URL(request.url);';
const versionRoute = `
    // Read-only deployment metadata; leave all existing endpoint logic unchanged.
    if (pathname === "/version" && request.method === "GET") {
      return new Response(JSON.stringify({ git_sha: PZ_DEPLOY_SHA }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
      });
    }`;

test('original Worker routes still match imported baseline outside reviewed preflight insertion', () => {
  assert.equal(patch.split(anchor).length, 2, 'entrypoint must remain unique');
  const importLine="import { preflightProduct } from '../../utils/productPreflight.js';\n";
  const start="      const reviewSnapshot=JSON.parse(copy);";
  const end='      const previous=await env.DB.prepare("SELECT * FROM pz_product_reviews WHERE product_id=?").bind(id).first();';
  const oldGate=`      const missing=readinessIssues(JSON.parse(copy));
      if(missing.length)return json({error:'Product is not ready for review',missing_fields:missing},400);
`;
  assert.ok(imported.startsWith(importLine), 'single shared validator import required');
  const from=imported.indexOf(start),to=imported.indexOf(end,from);
  assert.ok(from>0&&to>from,'preflight guard must sit immediately before review creation');
  const restored=imported.slice(importLine.length,from)+oldGate+imported.slice(to);
  assert.equal(restored,prefix + patch.replace(anchor, anchor + versionRoute));
  assert.match(imported.slice(from,to),/PREFLIGHT_FAILED/);
  assert.match(imported.slice(from,to),/PREFLIGHT_CONFIRMATION_REQUIRED/);
  assert.match(imported.slice(from,to),/LIMIT 1/);
});

test('new GET /version returns deployment marker without credentials or database bindings', async () => {
  const module = await import('../src/index.js');
  const response = await module.default.fetch(new Request('https://example.test/version'), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { git_sha: '__PZ_GIT_SHA__' });
});
