import test from 'node:test';
import assert from 'node:assert/strict';
import { productReviewSubmissionHint } from '../utils/productReviewSubmission';
import { factoryFetch } from '../utils/factoryFetch';

test('submission guidance distinguishes saved drafts from already-reviewed products',()=>{
  for(const status of ['draft','rejected','returned_to_uploader']){
    assert.equal(productReviewSubmissionHint(status),null);
  }
  for(const status of ['pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish','published','awaiting_review']){
    const hint=productReviewSubmissionHint(status);
    assert.ok(hint && hint.includes('无法重复提交'),status);
  }
  assert.match(productReviewSubmissionHint('pending_supervisor')||'',/待主管初审/);
});

test('factory API formats a real 409 conflict status and never retries its POST',async()=>{
  const oldFetch=globalThis.fetch;
  const oldStorage=(globalThis as any).sessionStorage;
  let calls=0;
  (globalThis as any).sessionStorage={getItem:()=> 'test-jwt'};
  globalThis.fetch=async()=>{
    calls++;
    return Response.json({
      error:'Product is not ready for submission',
      code:'PRODUCT_REVIEW_STATE_CONFLICT',
      current_status:'pending_supervisor'
    },{status:409});
  };
  try{
    await assert.rejects(
      factoryFetch('factory/products/test-1/submit',{method:'POST'}),
      /待主管初审.*无法重复提交/
    );
    assert.equal(calls,1);
  }finally{
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});
