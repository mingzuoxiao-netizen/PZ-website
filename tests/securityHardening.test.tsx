import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { adminFetch } from '../utils/adminFetch';
import { factoryFetch } from '../utils/factoryFetch';

const worker = readFileSync(new URL('../worker-patches/production-worker-category-governance-REVIEW.js', import.meta.url), 'utf8');
const authGuard = readFileSync(new URL('../components/AuthGuard.tsx', import.meta.url), 'utf8');

function workerPasswordPolicy() {
  const start = worker.indexOf('function pzAuthPasswordPolicyError(');
  const end = worker.indexOf('async function pzAuthDigest(', start);
  assert.ok(start >= 0 && end > start, 'password validation must be present in the actual Worker bundle');
  const source = worker.slice(start, end);
  return new Function(source + '\nreturn pzAuthPasswordPolicyError;')() as
    (password: string, username?: string) => string | null;
}

test('Worker rejects short, common, username-containing and bcrypt-truncated passwords', () => {
  const check = workerPasswordPolicy();
  assert.match(String(check('short123')), /12 characters/);
  assert.match(String(check('password123456')), /common/);
  assert.match(String(check('myfactoryuser-secret-123', 'factoryuser')), /username/);
  assert.match(String(check('x'.repeat(73))), /72 UTF-8/);
  assert.equal(check('a  very unusual long passphrase #2026!', 'factory'), null);
});

test('Worker uses short-lived, password-reset-revocable JWT and rate-limits login failures', () => {
  assert.ok(worker.includes('setExpirationTime("12h")'));
  assert.ok(worker.includes('phv: await pzAuthPasswordVersion(row.password_hash)'));
  assert.ok(worker.includes('user.phv !== await pzAuthPasswordVersion(current.password_hash)'));
  assert.ok(worker.includes('await pzAuthLoginTooMany(env, rateKey)'));
  assert.ok(worker.includes('await pzAuthLoginFailure(env, rateKey)'));
  assert.ok(worker.includes('await env.SITE_CONFIG_KV.delete(rateKey)'));
  assert.ok(worker.includes('pzAuthPasswordPolicyError(body.password, body.username)'));
  assert.ok(worker.includes('pzAuthPasswordPolicyError(password, target.username)'));
});

test('public pages no longer rely on a browser-side password for access control', () => {
  assert.ok(!authGuard.includes('const PASSWORD'));
  assert.ok(!authGuard.includes('sessionStorage.setItem'));
  assert.ok(authGuard.includes('children'));
});

test('admin and factory clients refuse remote endpoints before sending any token', async () => {
  const savedStorage = (globalThis as any).sessionStorage;
  const savedFetch = globalThis.fetch;
  let calls = 0;
  (globalThis as any).sessionStorage = { getItem: () => 'test-secret-token' };
  (globalThis as any).fetch = async () => {
    calls++;
    throw new Error('External network must not be reached');
  };
  try {
    await assert.rejects(adminFetch('https://attacker.example/collect'), /not allowed/);
    await assert.rejects(factoryFetch('https://attacker.example/collect'), /not allowed/);
    await assert.rejects(adminFetch('//attacker.example/collect'), /not allowed/);
    assert.equal(calls, 0);
  } finally {
    if (savedStorage === undefined) delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage = savedStorage;
    globalThis.fetch = savedFetch;
  }
});

test('Pages gateway does not leak underlying fetch errors to anonymous clients', () => {
  const gateway = readFileSync(new URL('../functions/api/[[path]].ts', import.meta.url), 'utf8');
  assert.ok(gateway.includes('Upstream service temporarily unavailable'));
  assert.ok(!gateway.includes('err?.message ?? String(err)'));
  assert.ok(gateway.includes('X-Content-Type-Options'));
});

test('the standalone Worker security patch is valid ECMAScript module syntax', () => {
  const url = new URL('../worker-patches/production-worker-category-governance-REVIEW.js', import.meta.url);
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', fileURLToPath(url)], { stdio: 'pipe' }));
});

test('KV login failure threshold prevents additional attempts without leaking account/IP in the key', async () => {
  const start = worker.indexOf('function pzAuthPasswordPolicyError(');
  const end = worker.indexOf('async function getUserFromRequest(', start);
  assert.ok(start > 0 && end > start);
  const helpers = new Function('crypto', 'safeJsonParse', worker.slice(start, end) +
    '\nreturn {pzAuthLoginRateKey,pzAuthLoginTooMany,pzAuthLoginFailure};')(
      webcrypto,
      (raw: string | null, fallback: Record<string, unknown>) => {
        try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
      }
    ) as {
      pzAuthLoginRateKey: (req: Request, username: string) => Promise<string>;
      pzAuthLoginTooMany: (env: any, key: string) => Promise<boolean>;
      pzAuthLoginFailure: (env: any, key: string) => Promise<void>;
    };
  const store = new Map<string, string>();
  const env = { SITE_CONFIG_KV: {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => { store.set(key, value); },
    delete: async (key: string) => { store.delete(key); }
  }};
  const req = new Request('https://example.test/login', { headers: {'CF-Connecting-IP': '203.0.113.7'} });
  const key = await helpers.pzAuthLoginRateKey(req, 'Factory-Test');
  assert.ok(key.startsWith('pz:auth:login:v1:'));
  assert.ok(!key.includes('Factory-Test') && !key.includes('203.0.113.7'));
  for (let n = 0; n < 7; n++) {
    assert.equal(await helpers.pzAuthLoginTooMany(env, key), false);
    await helpers.pzAuthLoginFailure(env, key);
  }
  assert.equal(await helpers.pzAuthLoginTooMany(env, key), true);
  await env.SITE_CONFIG_KV.delete(key);
  assert.equal(await helpers.pzAuthLoginTooMany(env, key), false);
});

test('staging verification is pinned to isolated Worker and valid Node syntax', () => {
  const url = new URL('../scripts/staging-security-smoke.mjs', import.meta.url);
  const source = readFileSync(url, 'utf8');
  assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', fileURLToPath(url)], { stdio: 'pipe' }));
  assert.ok(source.includes('pz-inquiry-api-staging.mingzuoxiao29.workers.dev'));
  assert.ok(source.includes('target.origin !== STAGING_WORKER'));
  assert.ok(source.includes('pz-security-probe-'));
  assert.ok(!source.includes('admin/accounts') && !source.includes('admin/publish'));
});
