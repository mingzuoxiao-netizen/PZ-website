import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const worker=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const root=resolve(worker,'..');
const baseline=readFileSync(resolve(root,'worker-patches/pz-production-unified-v2-2026-11-10.js'),'utf8');
const imported=readFileSync(resolve(worker,'src/index.js'),'utf8');
const prefix=`// Deployment provenance: replaced in CI with the verified Git commit SHA.
// The full inlined patch bundle below is preserved until live Worker parity is proven.
const PZ_DEPLOY_SHA = "__PZ_GIT_SHA__";
`;
const anchor='    const { pathname } = new URL(request.url);';
const versionRoute=`
    // Read-only deployment metadata; leave all existing endpoint logic unchanged.
    if (pathname === "/version" && request.method === "GET") {
      return new Response(JSON.stringify({ git_sha: PZ_DEPLOY_SHA }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
      });
    }`;
const one=(source,fragment)=>{
  assert.equal(source.split(fragment).length,2,'expected one instance of '+fragment.slice(0,80));
  return source;
};
function restoreLegacyBlock(current,previous,start,end){
  const at=current.indexOf(start),stop=current.indexOf(end,at);
  const from=previous.indexOf(start),until=previous.indexOf(end,from);
  assert.ok(at>=0&&stop>at&&from>=0&&until>from,'reviewed function boundary missing: '+start);
  return current.slice(0,at)+previous.slice(from,until)+current.slice(stop);
}
test('baseline parity is strict outside explicitly changed product-review and list modules',()=>{
  one(baseline,anchor);
  const expected=prefix+baseline.replace(anchor,anchor+versionRoute);
  const preflightImport="import { preflightProduct } from '../../utils/productPreflight.js';\n";
  const notifyImport="import {notificationMiddleware} from '../notificationCore.mjs';\n";
  const returnsImport="import { validateReturnIssues, serializeReturnEvent, readReturnEvent, changedProductFields, isRecheck } from '../../utils/reviewReturn.mjs';\n";
  const fastLaneImport="import {approveFastLane,handleFastLaneAdmin} from '../fastLaneCore.mjs';\n";
  assert.ok(imported.startsWith(preflightImport+notifyImport+fastLaneImport+returnsImport));
  let restored=imported.slice(preflightImport.length+notifyImport.length+fastLaneImport.length+returnsImport.length);
  const outerNotice="\n// BEGIN TASK 14: isolated notification middleware, no audit/approval route rewrites.";
  const wrapperAt=restored.indexOf(outerNotice);
  assert.ok(wrapperAt>0,'notification middleware must be appended after all original route wrappers');
  assert.match(restored.slice(wrapperAt),/index_default.fetch=notificationMiddleware\(pzNotifyOriginalFetch,\{authorize,json\}\);/);
  restored=restored.slice(0,wrapperAt);
  for(const [start,end] of [
    ['function pzTwoStageReviewFetch(','function normalizeRole(role)'],
    ['function pzBackofficeListsFetch(','index_default.fetch = pzBackofficeListsFetch(']
  ])restored=restoreLegacyBlock(restored,expected,start,end);
  assert.equal(restored.trimEnd(),expected.trimEnd(),'unexpected changes outside the approved review/list modules');
});
test('review changes retain RBAC, status transition guards and immutable version snapshots',()=>{
  for(const text of [
    "PZ_TWO_STAGE_REVIEW_ENABLED!=='true'",
    "PZ_ORG_RBAC_ENABLED!=='true'",
    'Legacy direct admin product writes disabled',
    'PREFLIGHT_FAILED','PREFLIGHT_CONFIRMATION_REQUIRED',
    'RETURN_FIELDS_REQUIRED','return-issues','approveFastLane','handleFastLaneAdmin',
    'serializeReturnEvent(note','changedProductFields(prior,reviewSnapshot)',
    'pz_product_review_versions','pz_product_review_events',
    "review.status==='approved_pending_publish'"
  ]) assert.ok(imported.includes(text),text);
  assert.match(imported,/r\.latest_version>1 AND r\.status IN/);
  assert.match(imported,/ORDER BY '\+sort\+' LIMIT \? OFFSET \?/);
});
test('GET /version returns build marker without touching D1',async()=>{
  const module=await import('../src/index.js');
  const response=await module.default.fetch(new Request('https://example.test/version'),{});
  assert.equal(response.status,200);
  assert.equal(response.headers.get('cache-control'),'no-store');
  assert.deepEqual(await response.json(),{git_sha:'__PZ_GIT_SHA__'});
});
