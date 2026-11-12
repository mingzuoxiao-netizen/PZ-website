/**
 * Render a temporary Wrangler config from GitHub Environment-scoped variables.
 * Intentionally fail closed: no secret/token, real resource ID or .env file is read.
 * Usage: node worker/scripts/prepare-deployment.mjs staging dry-run|deploy
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const [environment, mode] = process.argv.slice(2);
if (!['staging', 'production'].includes(environment) || !['dry-run', 'deploy'].includes(mode)) {
  throw Error('Usage: prepare-deployment.mjs staging|production dry-run|deploy');
}
if (mode === 'deploy') {
  const gate = environment === 'staging' ? 'PZ_STAGING_SOURCE_REVIEWED' : 'PZ_PRODUCTION_APPROVAL_CONFIRMED';
  if (process.env[gate] !== 'true') throw Error('Safety gate missing: ' + gate);
}
const worker = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let config = readFileSync(resolve(worker, 'wrangler.toml'), 'utf8');

// Placeholder values for BUILD-ONLY dry runs; never use them for live deployment.
const dummy = {
  D1_NAME: 'pz-dry-run-only',
  D1_ID: '00000000-0000-0000-0000-000000000000',
  KV_ID: '00000000000000000000000000000000',
  ASSETS_KV_ID: '00000000000000000000000000000000',
  IMAGES_BUCKET: 'pz-dry-run-images',
  HISTORY_BUCKET: 'pz-dry-run-history'
};
const getBindings = (target) => {
  if (mode === 'dry-run' || target !== environment) return dummy;
  const result = {
    D1_NAME: process.env.PZ_D1_NAME,
    D1_ID: process.env.PZ_D1_ID,
    KV_ID: process.env.PZ_SITE_CONFIG_KV_ID,
    ASSETS_KV_ID: process.env.PZ_ASSETS_KV_ID,
    IMAGES_BUCKET: process.env.PZ_PRODUCT_IMAGES_BUCKET,
    HISTORY_BUCKET: process.env.PZ_SITE_CONFIG_HISTORY_BUCKET
  };
  for (const [key, value] of Object.entries(result)) {
    if (!value || !String(value).trim()) throw Error('Missing required binding variable: ' + key);
  }
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(result.D1_ID)) throw Error('Invalid D1 ID format');
  if (!/^[a-f0-9]{32}$/i.test(result.KV_ID)) throw Error('Invalid KV namespace ID format');
  if (!/^[a-f0-9]{32}$/i.test(result.ASSETS_KV_ID)) throw Error('Invalid assets KV namespace ID format');
  if (result.ASSETS_KV_ID === dummy.ASSETS_KV_ID) throw Error('Dry-run assets KV ID is forbidden for deploy');
  for (const key of ['D1_NAME', 'IMAGES_BUCKET', 'HISTORY_BUCKET']) {
    if (!/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(result[key])) throw Error('Invalid binding name: ' + key);
  }
  if (result.D1_ID === dummy.D1_ID || result.KV_ID === dummy.KV_ID) throw Error('Dry-run binding ID is forbidden for deploy');
  if (target === 'staging') {
    // Verifying formats is insufficient: a correctly formatted production ID in
    // staging can expose or mutate live business data. Require an independent
    // Cloudflare resource audit AND explicit comparison to production bindings.
    if (process.env.PZ_STAGING_RESOURCES_VERIFIED !== 'true')
      throw Error('Safety gate missing: PZ_STAGING_RESOURCES_VERIFIED (confirm Cloudflare isolation first)');
    const productionReferences = {
      D1_ID: process.env.PZ_EXPECTED_PRODUCTION_D1_ID,
      KV_ID: process.env.PZ_EXPECTED_PRODUCTION_KV_ID,
      ASSETS_KV_ID: process.env.PZ_EXPECTED_PRODUCTION_ASSETS_KV_ID,
      IMAGES_BUCKET: process.env.PZ_EXPECTED_PRODUCTION_IMAGES_BUCKET,
      HISTORY_BUCKET: process.env.PZ_EXPECTED_PRODUCTION_HISTORY_BUCKET
    };
    for (const [key, expected] of Object.entries(productionReferences)) {
      if (!expected || !String(expected).trim())
        throw Error('Missing production comparison reference for staging: ' + key);
      if (String(result[key]).trim().toLowerCase() === String(expected).trim().toLowerCase())
        throw Error('Staging binding matches PRODUCTION ' + key + '; deployment blocked');
    }
    const productionKv = [productionReferences.KV_ID, productionReferences.ASSETS_KV_ID].map(x=>String(x).trim().toLowerCase());
    if ([result.KV_ID, result.ASSETS_KV_ID].some(x=>productionKv.includes(String(x).trim().toLowerCase())))
      throw Error('Staging binding matches PRODUCTION KV; deployment blocked');
    if (result.IMAGES_BUCKET.toLowerCase() === result.HISTORY_BUCKET.toLowerCase())
      throw Error('Staging R2 images/history must use distinct buckets');
  }
  return result;
};
for (const target of ['staging','production']) {
  const replacements = getBindings(target);
  for (const [key, value] of Object.entries(replacements)) {
    const marker = '__' + target.toUpperCase() + '_' + key + '__';
    if (!config.includes(marker)) throw Error('Missing Wrangler template marker: ' + marker);
    config = config.replaceAll(marker, value);
  }
}
if (/__[A-Z0-9_]+__/.test(config)) throw Error('Unresolved Wrangler placeholders');
const dest = resolve(worker, 'wrangler.generated.toml');
writeFileSync(dest, config, { mode: 0o600 });
console.log('Wrangler configuration prepared for ' + environment + ' (' + mode + ')');
