import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act, create, type ReactTestRenderer} from 'react-test-renderer';
import LivePreview from '../pages/CreatorPortal/components/LivePreview';
import ProductDetailModal from '../components/catalog/ProductDetailModal';
import ProductGallery from '../components/catalog/ProductGallery';

const draft = {
  id:'draft-123', code:'PZ-OAK-001', category:'tables', sub_category:'Marlow',
  name:'Oak Table', name_cn:'白橡木餐桌',
  description:'Public description', description_cn:'客户可见描述',
  material:'White Oak', size:'180 × 90 × 75 cm', finish:'Matte lacquer',
  images:['https://cdn.peng-zhan.com/uploads/one.webp'],
  production_sites:['zhaoqing'],
  status:'draft',
  specifications:{
    schema_version:1, color:'Secret internal color',
    construction_en:'PRIVATE JOINERY DATA',
    warnings_en:'INTERNAL WARNING TEXT',
    packaging:[{carton_no:1,length_cm:190,width_cm:100,height_cm:20,
      gross_weight_kg:49,units:1,packing_method:'PRIVATE PACKING METHOD'}]
  }
} as any;

test('customer preview uses the actual public detail renderer and never shows private technical fields',async()=>{
  let view:ReactTestRenderer|undefined;
  try{
    // A standalone React test has no Router/document. Inline mode must not
    // navigate, trap focus or access document.body.
    await act(async()=>{view=create(<LivePreview formData={draft} lang="zh"/>);});
    const preview=view!.root.findByType(ProductDetailModal);
    assert.equal(preview.props.displayMode,'inline');
    assert.equal(view!.root.findAllByType(ProductGallery).length,1);
    const rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/白橡木餐桌/);
    assert.match(rendered,/客户可见描述/);
    assert.match(rendered,/White Oak/);
    assert.match(rendered,/180 × 90 × 75 cm/);
    assert.match(rendered,/Matte lacquer/);
    assert.match(rendered,/中国肇庆/);
    assert.doesNotMatch(rendered,/PRIVATE JOINERY DATA|INTERNAL WARNING TEXT|PRIVATE PACKING METHOD|Secret internal color|49 kg/);
    assert.equal(view!.root.findAllByProps({role:'dialog'}).length,0,'inline preview is not a blocking dialog');
    assert.equal(view!.root.findAllByType('a').length,0,'preview never navigates to the inquiry form');
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('internal preview retains packing, care and warnings without publishing them',async()=>{
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<LivePreview formData={draft} lang="zh"/>);});
    const tabs=view!.root.findAllByProps({role:'tab'});
    assert.equal(tabs.length,2);
    await act(async()=>{tabs[1].props.onClick();});
    assert.equal(view!.root.findAllByType(ProductDetailModal).length,0);
    const internal=JSON.stringify(view!.toJSON());
    assert.match(internal,/PRIVATE PACKING METHOD/);
    assert.match(internal,/INTERNAL WARNING TEXT/);
    assert.match(internal,/49 kg/);
    assert.match(internal,/包装箱资料/);
  }finally{if(view)await act(async()=>view!.unmount());}
});
