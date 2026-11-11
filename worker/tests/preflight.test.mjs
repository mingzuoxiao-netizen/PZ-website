import test from 'node:test';
import assert from 'node:assert/strict';
import { preflightProduct } from '../../utils/productPreflight.js';

const images = Array.from({length:4},(_,i)=>'https://cdn.peng-zhan.com/uploads/oak-'+i+'.jpg');
const roles=Object.fromEntries(images.map((url,i)=>[url,i===0?'main':i===1?'lifestyle':i===2?'detail':'material']));
const full = {
  name:'Marlow Solid Oak Dining Table',name_cn:'橡木餐桌',
  code:'PZ-TABLE-001',category:'tables',material:'White Oak',
  description:'A solid oak dining table.',
  images, specifications:{
    schema_version:1,dimensions_cm:{length:180,width:90,height:75},
    media_roles:roles
  }
};
const clone=()=>structuredClone(full);
const hasError=(p,field)=>preflightProduct(p).errors.some(x=>x.field===field);
test('a valid, complete product passes preflight',()=>{
  assert.deepEqual(preflightProduct(full),{errors:[],warnings:[]});
});
test('ten deliberately defective products fail before review submission',()=>{
  const cases=[
    ['numeric English name',p=>{p.name='123';},'name'],
    ['SKU as English name',p=>{p.name='PZ-TABLE-001';},'name'],
    ['missing category',p=>{p.category='';},'category'],
    ['missing primary material',p=>{p.material='';},'material'],
    ['missing English description',p=>{p.description='';},'description'],
    ['no images',p=>{p.images=[];},'images'],
    ['only three images',p=>{p.images=p.images.slice(0,3);},'images'],
    ['first image not main',p=>{p.specifications.media_roles[p.images[0]]='detail';},'images'],
    ['missing second image role',p=>{delete p.specifications.media_roles[p.images[1]];},'images'],
    ['missing table height',p=>{delete p.specifications.dimensions_cm.height;},'dimensions_cm.height']
  ];
  for(const [name,mutate,field] of cases){
    const product=clone();mutate(product);
    assert.ok(hasError(product,field),String(name)+' was not blocked');
  }
  assert.equal(cases.length,10);
});
test('duplicate SKU is a hard error but frontend and Worker both run this rule',()=>{
  assert.ok(preflightProduct(full,{existingSku:true}).errors.some(x=>x.code==='sku_duplicate'));
});
test('dimension plausibility produces warnings that require explicit operator confirmation',()=>{
  const table=clone();table.specifications.dimensions_cm.height=750;
  const t=preflightProduct(table);
  assert.equal(t.errors.length,0);
  assert.ok(t.warnings.some(x=>x.code==='dimension_units'));
  assert.ok(t.warnings.some(x=>x.code==='table_height_range'));
  const good=clone();
  assert.equal(preflightProduct(good).warnings.length,0);
  const chair=clone();chair.category='chairs';chair.specifications.dimensions_cm.height=90;
  chair.specifications.attributes={seat_height:'65'};
  assert.ok(preflightProduct(chair).warnings.some(x=>x.code==='chair_seat_height'));
});
test('duplicate image and non-Chinese localised name are flagged, not silently accepted',()=>{
  const bad=clone();bad.images[2]=bad.images[1];bad.name_cn='Only English';
  const p=preflightProduct(bad);
  assert.ok(p.warnings.some(x=>x.code==='image_duplicate'));
  assert.ok(p.warnings.some(x=>x.code==='name_cn_language'));
});
