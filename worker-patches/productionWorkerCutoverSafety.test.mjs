import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const code=readFileSync(new URL('./production-worker-category-governance-REVIEW.js',import.meta.url),'utf8');

test('production site config keeps current KV authority until explicit opt-in to D1',()=>{
  assert.match(code,/const pzD1SiteEnabled = env =>[\s\S]{0,200}PZ_D1_SITE_CONFIG_ENABLED[\s\S]{0,200}PZ_SITE_CONFIG_D1_CUTOVER_ENABLED/);
  assert.match(code,/if\(!pzD1SiteEnabled\(env\)\) \{[\s\S]{0,200}SITE_CONFIG_KV\.get\('published:site_config'\)/);
  assert.match(code,/if\(!pzD1SiteEnabled\(env\)\) \{[\s\S]{0,200}SITE_CONFIG_KV\.get\('draft:site_config'\)/);
  assert.match(code,/PZ_D1_SITE_CONFIG_ENABLED[\s\S]{0,200}PZ_RUNTIME_ENV[\s\S]{0,200}PZ_SITE_CONFIG_D1_CUTOVER_ENABLED/);
});

test('production bundle has both review stages, production auditing, and fail-closed route guards',()=>{
  assert.match(code,/index_default\.fetch = pzOrganizationCreateFetch\(/);
  assert.match(code,/index_default\.fetch = pzTwoStageReviewFetch\(/);
  assert.match(code,/runtimeExpected: 'production'/);
  assert.doesNotMatch(code,/runtimeExpected: 'staging'/);
  assert.match(code,/PZ_TWO_STAGE_REVIEW_ENABLED/);
  assert.match(code,/PZ_ORG_RBAC_ENABLED/);
  assert.match(code,/PZ_RUNTIME_ENV/);
  assert.match(code,/Legacy direct admin product writes disabled/);
  assert.match(code,/PZ_SITE_CONFIG_D1_CUTOVER_ENABLED/);
});
