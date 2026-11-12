import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import ProductForm from '../pages/CreatorPortal/components/ProductForm';

const images=['oak-1.jpg','oak-2.jpg','oak-3.jpg','oak-4.jpg'];
const base={
  name:'Marlow Oak Dining Table',category:'tables',code:'PZ-MARLOW-01',
  material:'White Oak',description:'Solid oak dining table.',
  images,
  specifications:{schema_version:1 as const,
    dimensions_cm:{length:180,width:90,height:75},
    media_roles:{'oak-1.jpg':'main' as const,'oak-2.jpg':'lifestyle' as const,
      'oak-3.jpg':'detail' as const,'oak-4.jpg':'material' as const}}
};
const categories=[{id:'tables',title:'Dining Tables'}] as any;
const button=(view:ReactTestRenderer,title:string)=>view.root.findAllByType('button')
  .find(node=>node.children.join('').includes(title))!;

test('an incomplete draft can be saved but cannot be submitted for review',async()=>{
  const saved:any[]=[];const submitted:any[]=[];let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{
      view=create(<ProductForm initialData={{...base,material:'',images:['oak-1.jpg']}}
        categories={categories} onSave={async data=>{saved.push(data);}}
        onSaveAndSubmit={async data=>{submitted.push(data);}}
        onCancel={()=>{}} userRole="FACTORY" lang="zh"/>);
    });
    assert.ok(view!.root.findByProps({'data-testid':'pz-preflight-panel'}));
    assert.equal(button(view!,'保存并提交审核').props.disabled,true);
    await act(async()=>{
      button(view!,'保存草稿').props.onClick();
      await view!.root.findByType('form').props.onSubmit({preventDefault(){}});
    });
    assert.equal(saved.length,1);
    assert.equal(submitted.length,0);
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('out-of-range dimensions need acknowledgment and are sent to Worker as warning codes',async()=>{
  let payload:any=null;let codes:string[]=[];let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{
      view=create(<ProductForm initialData={{...base,specifications:{
        ...base.specifications,dimensions_cm:{length:180,width:90,height:750}}}}
        categories={categories} onSave={async()=>{}}
        onSaveAndSubmit={async(data,acknowledged)=>{payload=data;codes=acknowledged||[];}}
        onCancel={()=>{}} userRole="FACTORY" lang="zh"/>);
    });
    assert.equal(button(view!,'保存并提交审核').props.disabled,true);
    assert.ok(button(view!,'确认并继续'));
    await act(async()=>{button(view!,'确认并继续').props.onClick();});
    assert.equal(button(view!,'保存并提交审核').props.disabled,false);
    await act(async()=>{
      button(view!,'保存并提交审核').props.onClick();
      await view!.root.findByType('form').props.onSubmit({preventDefault(){}});
    });
    assert.ok(payload);
    assert.equal(payload.specifications.dimensions_cm.height,750);
    assert.ok(codes.includes('dimension_units'));
    assert.ok(codes.includes('table_height_range'));
  }finally{if(view)await act(async()=>view!.unmount());}
});
