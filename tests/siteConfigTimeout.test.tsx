import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchSiteConfig } from '../utils/siteConfig';

test('healthy site config returns its published envelope', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (_url, init) => {
    assert.equal(init?.cache, 'no-store');
    assert.ok(init?.signal instanceof AbortSignal);
    return new Response(JSON.stringify({ config: { categories: [] }, version: '2.0.1' }));
  };
  try {
    const result = await fetchSiteConfig(30);
    assert.deepEqual(result?.config.categories, []);
    assert.equal(result?.version, '2.0.1');
  } finally {
    globalThis.fetch = original;
  }
});

test('hung site config request aborts and returns null for the public fallback', async () => {
  const original = globalThis.fetch;
  let aborted = false;
  globalThis.fetch = (_url, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => {
      aborted = true;
      reject(new DOMException('aborted', 'AbortError'));
    }, { once: true });
  });
  try {
    const start = Date.now();
    const result = await fetchSiteConfig(20);
    assert.equal(result, null);
    assert.equal(aborted, true);
    assert.ok(Date.now() - start < 1000, 'timeout must release the public loader');
  } finally {
    globalThis.fetch = original;
  }
});
