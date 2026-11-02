import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pzValidateTechnicalSpecs } from './productSpecificationsCore.mjs';

test('accept valid template-based technical record and preserve legacy omission',()=>{
  assert.deepEqual(pzValidateTechnicalSpecs(undefined),{json:null,error:null});
  const source={
    schema_version:1,series_id:'MARLOW',color:'Natural Oak',
    dimensions_cm:{length:180,width:90,height:76,thickness:3.8},
    net_weight_kg:45,selling_points_en:['Solid white oak top'],
    materials:[{part:'tabletop',material:'Solid white oak',construction:'Full stave',finish:'Water based'}],
    attributes:{seating_capacity:'6',distance_between_legs:'145'},
    packaging:[{carton_no:1,length_cm:190,width_cm:99,height_cm:15,gross_weight_kg:49,units:1}],
    assembly:{required:true,minutes:30,instructions_file:'MARLOW_ASSEMBLY.pdf'},
    verification:[{claim:'Weight capacity test',status:'verified',evidence_file:'lab-report.pdf'}],
    provenance:{provider:'Factory coordinator',source_factory:'zhaoqing'},
    attachments:[{file_name:'dimension.pdf',type:'dimension',visibility:'internal'}]
  };
  const out=pzValidateTechnicalSpecs(source);
  assert.equal(out.error,null);
  assert.deepEqual(JSON.parse(out.json),source);
});
test('reject financial fields at every level and unknown data',()=>{
  const rejected=[
    {price:100},{cost:4},{factory_price:'10'},{attributes:{purchase_price:'20'}},
    {materials:[{part:'tabletop',material:'oak',unit_cost:5}]},
    {packaging:[{carton_no:1,cost:1}]},{technical_marketing:false}
  ];
  for(const val of rejected)assert.ok(pzValidateTechnicalSpecs(val).error,JSON.stringify(val));
});
test('reject unsafe numeric, unsupported claims and oversize data',()=>{
  assert.match(pzValidateTechnicalSpecs({dimensions_cm:{length:-2}}).error,/nonnegative/);
  assert.match(pzValidateTechnicalSpecs({verification:[{claim:'FSC',status:'verified'}]}).error,/evidence/);
  assert.match(pzValidateTechnicalSpecs({materials:Array.from({length:16},()=>({part:'x',material:'y'}))}).error,/at most/);
  assert.match(pzValidateTechnicalSpecs({description:'x'}).error,/Unsupported/);
  assert.match(pzValidateTechnicalSpecs({construction_en:'a'.repeat(4000)}).error,/3000/);
});
test('both Workers persist specs privately and include them in immutable review snapshots',()=>{
 for(const candidate of ['staging-worker-category-changes-REVIEW.js','production-worker-category-governance-REVIEW.js']){
   const s=readFileSync(new URL('./'+candidate,import.meta.url),'utf8');
   assert.match(s,/function pzValidateTechnicalSpecs\(/);
   assert.match(s,/specs_json = COALESCE\(\?, specs_json\)/);
   assert.match(s,/specs_json,created_by,status,created_at,updated_at/);
   assert.match(s,/specifications:typeof specs_json==='string'\?JSON\.parse/);
   const publicColumns=s.match(/var PZ_PUBLIC_COLUMNS = ([^;]+);/);
   assert.ok(publicColumns,'public columns present');
   assert.doesNotMatch(publicColumns[1],/specs_json|specifications/);
   assert.match(s,/if \(db\.specs_error\) return badRequest\(db\.specs_error\)/);
 }
});
