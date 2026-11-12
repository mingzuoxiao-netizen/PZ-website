import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderRuntimeTarget} from '../scripts/runtime-target.mjs';
const sourceUrl=new URL('../src/index.js',import.meta.url);
const source=readFileSync(sourceUrl,'utf8');
test('production stays byte-for-byte intact and target is mandatory',()=>{
  assert.equal(renderRuntimeTarget(source,'production'),source);
  assert.throws(()=>renderRuntimeTarget(source,''),/Explicit/);
  assert.throws(()=>renderRuntimeTarget(source.replaceAll("expectedRuntime:'production'","expectedRuntime:'unknown'"),'staging'),/anchor/);
});
test('staging resolves guarded routes to authentication, never production image origin',async()=>{
  const rendered=renderRuntimeTarget(source,'staging');
  const absolute=rendered.replace(/from (['"])(\.{1,2}\/[^'"]+)\1/g,
    (_,quote,path)=>'from '+quote+new URL(path,sourceUrl).href+quote);
  const worker=(await import('data:text/javascript;base64,'+Buffer.from(absolute).toString('base64'))).default;
  const env={DB:{},PZ_RUNTIME_ENV:'staging',PZ_TWO_STAGE_REVIEW_ENABLED:'true',
    PZ_ORG_RBAC_ENABLED:'true',PZ_PRODUCT_REVISIONS_ENABLED:'true',
    PZ_CATEGORY_TWO_STAGE_ENABLED:'true',PZ_IMAGE_BASE_URL:'https://staging-assets.example.com'};
  for(const path of ['/admin/products','/admin/revisions','/admin/product-delete/capabilities',
    '/admin/category-change-requests']){
    const response=await worker.fetch(new Request('https://staging.example'+path),env,{});
    assert.equal(response.status,401,path);
  }
  const wrong=await worker.fetch(new Request('https://staging.example/admin/products'),
    {...env,PZ_RUNTIME_ENV:'production'},{});
  assert.equal(wrong.status,403);
  assert.ok(rendered.includes("if (runtime !== 'staging') return null;\n  return pzConfiguredImageBase(env);"));
});
