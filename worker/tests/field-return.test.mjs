import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {
  RETURN_PREFIX,validateReturnIssues,serializeReturnEvent,readReturnEvent,
  changedProductFields,isRecheck
} from '../../utils/reviewReturn.mjs';

test('structured return rejects missing, repeated and invented fields',()=>{
  assert.deepEqual(validateReturnIssues([{field:'images',message:'Replace blurry cover photo'}]),
    [{field:'images',message:'Replace blurry cover photo'}]);
  for(const cases of [
    [],[{field:'images',message:'x'}],
    [{field:'images',message:'Fix'},{field:'images',message:'Fix again'}],
    [{field:'DROP TABLE products',message:'bad'}],
    [{field:'dimensions_cm.height); DELETE',message:'bad'}]
  ])assert.throws(()=>validateReturnIssues(cases));
});
test('existing plain text reasons are preserved; structured event is reversible and auditable',()=>{
  const old=readReturnEvent('请补充尺寸');
  assert.deepEqual(old,{note:'请补充尺寸',issues:[],legacy:true});
  const issues=[{field:'images',message:'请更换模糊主图'}];
  const encoded=serializeReturnEvent('总体备注',issues);
  assert.ok(encoded.startsWith(RETURN_PREFIX));
  assert.deepEqual(readReturnEvent(encoded),{note:'总体备注',issues,legacy:false});
  assert.equal(readReturnEvent('PZ_FIELD_RETURN_V1:broken').legacy,true);
});
test('resubmit diff uses only reviewable fields and detects image and structured size changes',()=>{
  const before={id:'p1',status:'returned_to_uploader',created_by:'u1',
    name:'Marlow Table',images:['old.jpg'],material:'Oak',
    specifications:{dimensions_cm:{length:120,width:70,height:75},media_roles:{'old.jpg':'main'}}};
  const after={...before,created_by:undefined,status:'pending_supervisor',
    images:['new.jpg'],specifications:{dimensions_cm:{length:120,width:70,height:75},
      media_roles:{'new.jpg':'main'}},review_metadata:{is_recheck:true}};
  const fields=changedProductFields(before,after);
  assert.ok(fields.includes('images'));
  assert.deepEqual(fields,['images'],'media-role changes are summarized under the image field');
  assert.equal(fields.some(field=>field==='created_by'||field==='status'||field==='review_metadata'),false);
  assert.deepEqual(changedProductFields(before,{...before,specifications:{
    ...before.specifications,dimensions_cm:{...before.specifications.dimensions_cm,height:80}
  }}),['dimensions_cm.height']);
});
test('recheck requires an actual resubmission in an actionable queue',()=>{
  assert.equal(isRecheck({latest_version:1,status:'pending_supervisor'}),false);
  assert.equal(isRecheck({latest_version:2,status:'pending_supervisor'}),true);
  assert.equal(isRecheck({latest_version:3,status:'pending_admin'}),true);
  assert.equal(isRecheck({latest_version:2,status:'published'}),false);
});
test('server-side SQL priority places returned items ahead of first submissions across pages',()=>{
  const worker=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(worker,/recheckPriority[\s\S]+?r\.latest_version>1 AND r\.status IN/);
  assert.match(worker,/recheckPriority\+[\s\S]+?LIMIT \? OFFSET \?/);
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE queue(id TEXT,latest_version INTEGER,status TEXT,updated_at TEXT)");
  const rows=[['first','1','pending_supervisor','2026-11-11T10:00:00'],
    ['second','1','pending_supervisor','2026-11-11T11:00:00'],
    ['returned','2','pending_supervisor','2026-11-11T12:00:00']];
  for(const row of rows)db.prepare('INSERT INTO queue VALUES(?,?,?,?)').run(...row);
  const sql="SELECT id FROM queue ORDER BY CASE WHEN latest_version>1 AND status IN ('pending_supervisor','pending_admin','approved_pending_publish') THEN 0 ELSE 1 END,updated_at ASC,id ASC LIMIT ? OFFSET ?";
  assert.deepEqual(db.prepare(sql).all(1,0).map(x=>x.id),['returned']);
  assert.deepEqual(db.prepare(sql).all(2,1).map(x=>x.id),['first','second']);
  db.close();
});
test('new return routes never override legacy published-product revision flow',()=>{
  const code=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(code,/code:'RETURN_FIELDS_REQUIRED'/);
  assert.match(code,/readReturnEvent\(event\?\.note\)/);
  assert.match(code,/return_issues:parsed\.issues/);
  assert.match(code,/review_metadata:\{/);
});
