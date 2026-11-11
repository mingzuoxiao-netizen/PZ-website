import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('both Worker bundles use D1 readback and idempotent outcomes for archive/restore',()=>{
  for(const file of ['staging-worker-category-changes-REVIEW.js',
    'production-worker-admin-delete-v2-COPY.js']){
    const source=read('../worker-patches/'+file);
    const route=source.slice(source.indexOf('const catalogState=pathname.match('),
      source.indexOf('const hidden = action === "unpublish"'));
    assert.ok(route.length>1200,file+' archive route found');
    assert.match(route,/catalog-state/,'Admin can inspect current state');
    assert.match(route,/request.method==="GET"/,'state inspection must be read only');
    assert.match(route,/authorize\(request,env,\["ADMIN"\]\)/,'state inspection remains Admin-only');
    assert.match(route,/Number\(result.meta\?\.changes\)===1/,'metadata is diagnostic only');
    assert.match(route,/const current=await env.DB.prepare/,'read back actual persisted row');
    assert.match(route,/return json\(\{success:true,id,archived:archive/);
    assert.match(route,/already_in_state:!updated/,'idempotent target outcome');
    assert.match(route,/deleted_at IS NULL/,'retired products cannot be restored');
    assert.match(route,/actual_status:current.status/,'stale state gives a meaningful failure');
    assert.doesNotMatch(route,/result\.meta\?\.changes !== 1\) return json/,
      'do not report false 409 using D1 metadata alone');
  }
});

test('Admin front end reconciles uncertain archive/restore without re-sending the mutation',()=>{
  const source=read('../pages/CreatorPortal/AdminWorkspace.tsx');
  const section=source.slice(source.indexOf('const handleArchive ='),
    source.indexOf('const handlePermanentDelete=',source.indexOf('const handleArchive =')));
  assert.match(section,/admin\/products\/'\+id\+'\/catalog-state'/);
  assert.match(section,/current.archived===!restore/);
  assert.match(section,/current.catalog_hidden/);
  assert.match(section,/current.deleted/);
  assert.match(section,/reconciled\+\+/);
  assert.match(section,/失败 '\+failures.length/);
  assert.doesNotMatch(section,/catch \{ failed\+\+; \}/);
  assert.equal((section.match(/method:'POST'/g)||[]).length,1,
    'one request per item; reconciliation must be GET only');
});
