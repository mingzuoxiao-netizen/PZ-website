import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
