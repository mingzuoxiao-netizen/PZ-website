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

test('imported Worker exactly matches unified V2 baseline except read-only version endpoint', () => {
  assert.equal(patch.split(anchor).length, 2, 'entrypoint must remain unique');
  assert.equal(imported, prefix + patch.replace(anchor, anchor + versionRoute));
});

test('new GET /version returns deployment marker without credentials or database bindings', async () => {
  const module = await import('../src/index.js');
  const response = await module.default.fetch(new Request('https://example.test/version'), {});
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { git_sha: '__PZ_GIT_SHA__' });
});
