/**
 * Read-only / non-destructive Staging authentication smoke checks.
 * Run only after the PR #15 Worker candidate is deployed to an isolated
 * staging Worker with staging D1, KV, and R2 bindings.
 *
 * node scripts/staging-security-smoke.mjs
 *
 * Optional credentials (environment variables only; NEVER commit passwords):
 * PZ_STAGING_ADMIN_USER, PZ_STAGING_ADMIN_PASSWORD
 * PZ_STAGING_FACTORY_USER, PZ_STAGING_FACTORY_PASSWORD
 *
 * The script does not create, edit, publish, or delete any business records.
 * The only state created is a short-lived KV rate-limit counter for a randomly
 * named, NON-EXISTENT synthetic username (8 failed login probes).
 */
import { randomUUID } from 'node:crypto';

const STAGING_WORKER = 'https://pz-inquiry-api-staging.mingzuoxiao29.workers.dev';
const target = new URL(process.env.PZ_STAGING_URL || STAGING_WORKER);
if (target.origin !== STAGING_WORKER || target.pathname !== '/' || target.search || target.hash) {
  throw new Error('Safety stop: Staging tests may ONLY contact the exact isolated staging Worker origin.');
}

const errors = [];
const checked = [];
const request = async (path, { method = 'GET', body, token, contentType = 'application/json' } = {}) => {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = contentType;
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(new URL(path, STAGING_WORKER), {
    method,
    headers,
    body: body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body)),
    redirect: 'manual',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000)
  });
  return response;
};
async function verify(label, expected, run) {
  try {
    const response = await run();
    const status = response.status;
    if (status !== expected) {
      errors.push(`${label}: expected HTTP ${expected}, received HTTP ${status}`);
      console.error(`FAIL ${label}: expected ${expected}, got ${status}`);
    } else {
      checked.push(label);
      console.log(`PASS ${label}: HTTP ${status}`);
    }
  } catch (error) {
    errors.push(`${label}: ${error instanceof Error ? error.name : 'request error'}`);
    console.error(`FAIL ${label}: request error`);
  }
}
await verify('anonymous admin products denied', 401, () => request('/admin/products'));
await verify('anonymous factory products denied', 401, () => request('/factory/products'));
// Some existing Staging Worker bundles have no audit-log endpoint (HTTP 404).
// That is not a failed auth check; do not treat an absent route as insecure.
const auditResponse = await request('/admin/audit-logs');
if (auditResponse.status === 404) {
  console.log('SKIP audit endpoint: not implemented by this Staging Worker bundle');
} else if (auditResponse.status === 401) {
  checked.push('anonymous audit logs denied');
  console.log('PASS anonymous audit logs denied: HTTP 401');
} else {
  errors.push('anonymous audit logs: expected 401 or 404, got ' + auditResponse.status);
  console.error('FAIL anonymous audit logs: HTTP ' + auditResponse.status);
}
await verify('login rejects non-JSON requests', 415,
  () => request('/login', { method: 'POST', body: 'not-json', contentType: 'text/plain' }));

// This deliberately does NOT use a real username and will not lock a legitimate account.
const fakeUsername = `pz-security-probe-${randomUUID()}`;
for (let i = 1; i <= 8; i++) {
  await verify(`synthetic login attempt ${i}`, i <= 7 ? 401 : 429,
    () => request('/login', {
      method: 'POST',
      body: { username: fakeUsername, password: 'intentionally-wrong-password' }
    }));
}

const checks = [
  { role: 'admin', username: process.env.PZ_STAGING_ADMIN_USER, password: process.env.PZ_STAGING_ADMIN_PASSWORD,
    route: '/admin/products', expected: 200 },
  { role: 'factory', username: process.env.PZ_STAGING_FACTORY_USER, password: process.env.PZ_STAGING_FACTORY_PASSWORD,
    route: '/factory/products', expected: 200 }
];
for (const check of checks) {
  if (!check.username && !check.password) {
    console.log(`SKIP optional ${check.role} authenticated test (no test credentials supplied)`);
    continue;
  }
  if (!check.username || !check.password) {
    errors.push(`optional ${check.role}: supply BOTH username and password`);
    continue;
  }
  try {
    const response = await request('/login', {
      method: 'POST',
      body: { username: check.username, password: check.password }
    });
    if (response.status !== 200) {
      errors.push(`${check.role} test account login: HTTP ${response.status}`);
      continue;
    }
    const payload = await response.json();
    if (typeof payload?.token !== 'string' || !payload.token) {
      errors.push(`${check.role} test account login: no token`);
      continue;
    }
    await verify(`${check.role} read own route`, check.expected,
      () => request(check.route, { token: payload.token }));
    if (check.role === 'factory') {
      await verify('factory token cannot read admin products', 403,
        () => request('/admin/products', { token: payload.token }));
    }
  } catch (error) {
    errors.push(`${check.role} test account: ${error instanceof Error ? error.name : 'error'}`);
  }
}
console.log(`\nStaging checks passed: ${checked.length}; failed: ${errors.length}`);
if (errors.length) {
  console.error('Staging security smoke FAILED. Keep PR #15 unmerged and Production unchanged.');
  process.exitCode = 1;
} else {
  console.log('Read-only staging smoke passed. This does NOT verify WAF, Access/MFA, image uploads, or publishing.');
}
