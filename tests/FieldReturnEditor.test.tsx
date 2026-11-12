import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import ProductForm from '../pages/CreatorPortal/components/ProductForm';
import PZImageManager from '../pages/CreatorPortal/components/PZImageManager';

const images=['oak1.jpg','oak2.jpg','oak3.jpg','oak4.jpg'];
const specs={schema_version:1 as const,
  dimensions_cm:{length:180,width:90,height:75},
  media_roles:{'oak1.jpg':'main' as const,'oak2.jpg':'lifestyle' as const,
    'oak3.jpg':'detail' as const,'oak4.jpg':'material' as const}
};
const product={id:'p1',name:'Marlow Oak Dining Table',category:'tables',code:'PZ-MARLOW-01',
  material:'White Oak',description:'Oak dining table',status:'returned_to_uploader',
  images,specifications:specs};
const categories=[{id:'tables',title:'Dining Tables'}] as any;
const printed=(view:ReactTestRenderer)=>JSON.stringify(view.toJSON());

test('returned operator sees clickable field issue and clear corrected-field marking',async()=>{
  const saved:any[]=[];let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{
      view=create(<ProductForm initialData={product}
        returnReview={{issues:[{field:'images',message:'替换模糊主图'}],
          return_reason:'请检查图片质量',baseline:product,version:1}}
        categories={categories} onSave={async data=>{saved.push(data);}}
        onCancel={()=>{}} userRole="FACTORY" lang="zh"/>);
    });
    assert.ok(view!.root.findByProps({'data-testid':'field-return-panel'}));
    assert.match(printed(view!),/替换模糊主图/);
    assert.doesNotMatch(printed(view!),/已修改/);
    const issueButton=view!.root.findAllByType('button').find(x=>JSON.stringify(x.children).includes('替换模糊主图'));
    assert.ok(issueButton,'return field can be clicked to jump to images');
    assert.equal(typeof issueButton!.props.onClick,'function');
    await act(async()=>{
      const manager=view!.root.findByType(PZImageManager);
      manager.props.onUpdate(['new-oak1.jpg',...images.slice(1)]);
    });
    assert.match(printed(view!),/已修改/);
    await act(async()=>{
      await view!.root.findByType('form').props.onSubmit({preventDefault(){}});
    });
    assert.equal(saved.length,1,'correcting a return does not break draft saves');
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('older note-only return remains readable without structured issues',async()=>{
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{
      view=create(<ProductForm initialData={product}
        returnReview={{issues:[],return_reason:'旧版退回：请核对产品信息',baseline:product,legacy:true}}
        categories={categories} onSave={async()=>{}} onCancel={()=>{}} userRole="FACTORY" lang="zh"/>);
    });
    assert.match(printed(view!),/旧版退回：请核对产品信息/);
    assert.match(printed(view!),/历史退回记录仅有文字说明/);
  }finally{if(view)await act(async()=>view!.unmount());}
});
