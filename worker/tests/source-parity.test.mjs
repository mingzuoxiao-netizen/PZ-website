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
// D1 metadata includes trigger side effects. Uniquely guarded mutations
// require positive changes; zero still signals a stale or missing row.
const normalizedD1Counts=source=>source.split('\n').map(line=>
  line.includes('meta')&&line.includes('changes')
    ?line.replace(/!==\s*1\b/g,'<1').replace(/===\s*1\b/g,'>=1'):line
).join('\n');
test('baseline parity is strict outside explicitly changed product-review and list modules',()=>{
  one(baseline,anchor);
  const expected=prefix+baseline.replace(anchor,anchor+versionRoute);
  const preflightImport="import { preflightProduct } from '../../utils/productPreflight.js';\n";
  const notifyImport="import {notificationMiddleware} from '../notificationCore.mjs';\n";
  const bulkImport="import {bulkImportFetch} from '../bulkImportCore.mjs';\n";
  const inquiryImport="import {inquiryWorkbenchFetch} from '../inquiryWorkbenchCore.mjs';\n";
  const dashImport="import {roleDashboardFetch} from '../dashboardCore.mjs';\n";
  const productBulkImport="import {productBulkFetch} from '../productBulkCore.mjs';\n";
  const presenceImport="import {productPresenceFetch} from '../productPresenceCore.mjs';\n";
  const casImport="import {saveDraftWithCas} from '../productDraftCas.mjs';\n";
  const returnsImport="import { validateReturnIssues, serializeReturnEvent, readReturnEvent, changedProductFields, isRecheck } from '../../utils/reviewReturn.mjs';\n";
  const fastLaneImport="import {approveFastLane,handleFastLaneAdmin} from '../fastLaneCore.mjs';\n";
  assert.ok(imported.startsWith(preflightImport+notifyImport+bulkImport+inquiryImport+dashImport+productBulkImport+presenceImport+casImport+fastLaneImport+returnsImport));
  let restored=imported.slice(preflightImport.length+notifyImport.length+bulkImport.length+inquiryImport.length+dashImport.length+productBulkImport.length+presenceImport.length+casImport.length+fastLaneImport.length+returnsImport.length);
  const outerNotice="\n// BEGIN TASK 14: isolated notification middleware, no audit/approval route rewrites.";
  const wrapperAt=restored.indexOf(outerNotice);
  assert.ok(wrapperAt>0,'notification middleware must be appended after all original route wrappers');
  assert.match(restored.slice(wrapperAt),/index_default.fetch=notificationMiddleware\(pzNotifyOriginalFetch,\{authorize,json\}\);/);
  assert.match(restored.slice(wrapperAt),/index_default.fetch=bulkImportFetch\(pzImportOriginalFetch,/);
  assert.ok(restored.slice(wrapperAt).includes('index_default.fetch=inquiryWorkbenchFetch(pzInquiryOriginalFetch,'));
  assert.ok(restored.slice(wrapperAt).includes('index_default.fetch=roleDashboardFetch(pzRoleDashboardOriginalFetch,'));
  assert.ok(restored.slice(wrapperAt).includes('index_default.fetch=productBulkFetch(pzProductBulkOriginalFetch,'));
  assert.ok(restored.slice(wrapperAt).includes('index_default.fetch=productPresenceFetch(pzProductEditOriginalFetch,'));
  assert.match(imported,/await saveDraftWithCas\(env,/);
  restored=restored.slice(0,wrapperAt);
  for(const [start,end] of [
    ['function pzTwoStageReviewFetch(','function normalizeRole(role)'],
    ['function pzPublishedProductRevisionsFetch(','const pzPublishedRevisionsOriginalFetch'],
    ['function pzBackofficeListsFetch(','index_default.fetch = pzBackofficeListsFetch(']
  ])restored=restoreLegacyBlock(restored,expected,start,end);
  // Task 18 extends only two existing guards: the bounded, validated provenance
  // allow-list and the existing audit log's per-item unpublish reason. Normalize
  // these EXACT additive blocks; all other legacy Worker bytes stay protected.
  // Task20 changes are restricted to the pre-existing factory draft update block
  // and product list's explicit edit revision column; all other legacy bytes retain parity.
  restored=restoreLegacyBlock(restored,expected,
    '        const m = pathname.match(/^\\/factory\\/products\\/([^/]+)$/);',
    '      // Admin-only catalog documents:');
  restored=restored.replace(
    "p.specs_json,p.created_by,p.status,p.created_at,p.updated_at,p.edit_revision'+",
    "p.specs_json,p.created_by,p.status,p.created_at,p.updated_at'+");
  restored=restored.replace(
    "      updated_at: r.updated_at ?? null,\n      edit_revision: Number(r.edit_revision ?? 0)",
    "      updated_at: r.updated_at ?? null");
  const extendedProvenance="provenance:['provider','reviewer','source_factory','inherited_images_from','inherited_product_id']";
  one(restored,extendedProvenance);
  restored=restored.replace(extendedProvenance,"provenance:['provider','reviewer','source_factory']");
  const auditAddon=`      // Task 18: retain the reason on EACH audited single-item unpublish.
      // The bulk endpoint delegates each item to this existing audit wrapper;
      // no audit is inferred from a failed or unconfirmed operation.
      if(success && event.action === "product.unpublish"){
        const input=await request.clone().json().catch(()=>null);
        const reason=typeof input?.reason==="string"?input.reason.trim():"";
        if(reason.length>=5&&reason.length<=500)
          diff.push("bulk_unpublish_reason: "+reason);
      }
`;
  one(restored,auditAddon);
  restored=restored.replace(auditAddon,'');
  assert.equal(normalizedD1Counts(restored).trimEnd(),normalizedD1Counts(expected).trimEnd(),'unexpected changes outside the approved review/list modules');
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

test('no uniquely guarded mutation mistakes trigger side effects for a failed write',()=>{
  for(const line of imported.split('\n')){
    if(line.includes('meta')&&line.includes('changes'))
      assert.doesNotMatch(line,/!==\s*1\b|===\s*1\b/);
  }
});
