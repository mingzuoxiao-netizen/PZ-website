import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker from './pz-category-qa-worker.js';
const qaHost='https://pz-category-qa.mingzuoxiao29.workers.dev';
const env=()=>({PZ_RUNTIME_ENV:'qa',PZ_D1_SITE_CONFIG_ENABLED:'false',DB:{},QA_TEST_KEY:'long-qa-only-test-key-over-24-characters'});
async function call(url,options={},e=env()){const res=await worker.fetch(new Request(url,options),e);return {status:res.status,body:await res.text()};}
test('standalone QA harness serves no admin production endpoints',async()=>{
  const r=await call(qaHost+'/admin/publish',{method:'POST'});
  assert.equal(r.status,404);
});
test('QA host and runtime guards fail closed',async()=>{
  assert.equal((await call('https://pz-inquiry-api.mingzuoxiao29.workers.dev/qa/run',{method:'POST'})).status,403);
  const e=env();e.PZ_RUNTIME_ENV='production';
  assert.equal((await call(qaHost+'/qa/run',{method:'POST'},e)).status,403);
  e.PZ_RUNTIME_ENV='staging';
  assert.equal((await call(qaHost+'/qa/run',{method:'POST'},e)).status,403);
});
test('health is safe and reports flag off',async()=>{
  const r=await call(qaHost+'/qa/health');assert.equal(r.status,200);
  const v=JSON.parse(r.body);assert.equal(v.qa,true);assert.equal(v.d1FlagEnabled,false);
  assert.equal(v.testKeyConfigured,true);
});
test('test runner requires a configured 24+ character secret',async()=>{
  const e=env();delete e.QA_TEST_KEY;
  assert.equal((await call(qaHost+'/qa/run',{method:'POST'},e)).status,503);
  e.QA_TEST_KEY='short';
  assert.equal((await call(qaHost+'/qa/run',{method:'POST'},e)).status,503);
});
test('test runner rejects anonymous callers and does not mutate DB',async()=>{
  assert.equal((await call(qaHost+'/qa/run',{method:'POST'})).status,401);
  assert.equal((await call(qaHost+'/qa/run',{method:'POST',headers:{'x-qa-test-key':'wrong'}})).status,401);
});
test('test runner refuses mutation while QA D1 flag is disabled',async()=>{
  const e=env();const r=await call(qaHost+'/qa/run',{
    method:'POST',headers:{'x-qa-test-key':e.QA_TEST_KEY}
  },e);
  assert.equal(r.status,503);
  assert.match(r.body,/QA Worker only/);
});
