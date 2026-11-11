import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = readFileSync(resolve(root, '.github/workflows/pz-worker-ci-cd.yml'), 'utf8');
const prepare = resolve(root, 'worker/scripts/prepare-deployment.mjs');

const stagingEnvironment = {
  PZ_STAGING_PARITY_CONFIRMED: 'true',
  PZ_STAGING_RESOURCES_VERIFIED: 'true',
  PZ_D1_NAME: 'staging-synthetic-db',
  PZ_D1_ID: '11111111-1111-1111-1111-111111111111',
  PZ_SITE_CONFIG_KV_ID: '1'.repeat(32),
  PZ_PRODUCT_IMAGES_BUCKET: 'staging-synthetic-images',
  PZ_SITE_CONFIG_HISTORY_BUCKET: 'staging-synthetic-history',
  PZ_EXPECTED_PRODUCTION_D1_ID: '22222222-2222-2222-2222-222222222222',
  PZ_EXPECTED_PRODUCTION_KV_ID: '2'.repeat(32),
  PZ_EXPECTED_PRODUCTION_IMAGES_BUCKET: 'production-synthetic-images',
  PZ_EXPECTED_PRODUCTION_HISTORY_BUCKET: 'production-synthetic-history'
};
const dryPreparation = (target, vars) => spawnSync(process.execPath, [prepare, target, 'deploy'], {
  encoding: 'utf8',
  // These fake IDs exist only inside unit tests. No real Cloudflare credentials.
  env: { PATH: process.env.PATH || '', ...vars }
});

test('manual dispatch defaults to staging; staging never qualifies for production job', () => {
  assert.match(workflow, /workflow_dispatch:\s*\n\s*inputs:\s*\n\s*target:/);
  assert.match(workflow, /type: choice[\s\S]*?default: staging[\s\S]*?options:\s*\n\s*- staging\s*\n\s*- production/);
  const stage = workflow.split('\n  staging:\n')[1]?.split('\n  production:\n')[0] || '';
  const prod = workflow.split('\n  production:\n')[1] || '';
  assert.match(stage, /inputs\.target == 'staging'/);
  assert.match(stage, /vars\.PZ_STAGING_CI_ENABLED == 'true'/);
  assert.match(prod, /inputs\.target == 'production'/);
  assert.match(prod, /github\.ref == 'refs\/heads\/main'/);
  assert.match(prod, /environment: production/);
  assert.doesNotMatch(stage, /inputs\.target == 'production'/);
  assert.doesNotMatch(prod, /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/main'/);
});

test('deploy credentials use unique environment-only secret names', () => {
  assert.match(workflow, /secrets\.PZ_STAGING_CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /secrets\.PZ_PRODUCTION_CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow, /secrets\.CLOUDFLARE_API_TOKEN/);
  assert.match(workflow, /PZ_PRODUCTION_APPROVAL_CONFIRMED: \$\{\{ vars\.PZ_PRODUCTION_APPROVAL_CONFIRMED \}\}/);
});

test('staging deploy refuses unconfirmed independent Cloudflare resources', () => {
  const without = dryPreparation('staging', {
    ...stagingEnvironment,
    PZ_STAGING_RESOURCES_VERIFIED: ''
  });
  assert.notEqual(without.status, 0);
  assert.match(without.stderr, /PZ_STAGING_RESOURCES_VERIFIED/);
  const missingComparison = dryPreparation('staging', {
    ...stagingEnvironment,
    PZ_EXPECTED_PRODUCTION_D1_ID: ''
  });
  assert.notEqual(missingComparison.status, 0);
  assert.match(missingComparison.stderr, /Missing production comparison reference/);
});

test('staging deploy rejects any D1, KV, images or history binding shared with production', () => {
  const pairs = [
    ['PZ_D1_ID', 'PZ_EXPECTED_PRODUCTION_D1_ID'],
    ['PZ_SITE_CONFIG_KV_ID', 'PZ_EXPECTED_PRODUCTION_KV_ID'],
    ['PZ_PRODUCT_IMAGES_BUCKET', 'PZ_EXPECTED_PRODUCTION_IMAGES_BUCKET'],
    ['PZ_SITE_CONFIG_HISTORY_BUCKET', 'PZ_EXPECTED_PRODUCTION_HISTORY_BUCKET']
  ];
  for (const [staging, production] of pairs) {
    const res = dryPreparation('staging', {
      ...stagingEnvironment,
      [staging]: stagingEnvironment[production]
    });
    assert.notEqual(res.status, 0, 'isolation must fail for ' + staging);
    assert.match(res.stderr, /matches PRODUCTION/, staging);
  }
});

test('production deploy requires secondary approval flag, not automatically populated', () => {
  const result = dryPreparation('production', {
    PZ_D1_NAME: 'production-synthetic-db',
    PZ_D1_ID: '22222222-2222-2222-2222-222222222222',
    PZ_SITE_CONFIG_KV_ID: '2'.repeat(32),
    PZ_PRODUCT_IMAGES_BUCKET: 'production-synthetic-images',
    PZ_SITE_CONFIG_HISTORY_BUCKET: 'production-synthetic-history'
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PZ_PRODUCTION_APPROVAL_CONFIRMED/);
});
