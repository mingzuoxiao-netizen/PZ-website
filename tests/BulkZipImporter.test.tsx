import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import BulkZipImporter from '../pages/CreatorPortal/components/BulkZipImporter';

test('the new importer accepts ONE ZIP instead of separate CSV and images',async()=>{
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<BulkZipImporter role="FACTORY"
      categories={[{id:'dining-table',title:'Dining Tables'}] as any}/>);});
    const pickers=view!.root.findAllByType('input').filter(x=>x.props.type==='file');
    assert.equal(pickers.length,1,'there must be one ZIP picker only');
    assert.match(pickers[0].props.accept,/\.zip/);
    assert.doesNotMatch(pickers[0].props.accept,/\.csv|\.xlsx/i);
    const rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/Excel \+ 图片文件夹一键导入/);
    assert.match(rendered,/SKU/);
    assert.match(rendered,/只保存草稿/);
    assert.doesNotMatch(rendered,/选择 CSV 文件/);
    assert.ok(view!.root.findAllByType('button').some(node=>
      JSON.stringify(node.children).includes('下载示例 ZIP')));
  }finally{if(view)await act(async()=>view!.unmount());}
});
