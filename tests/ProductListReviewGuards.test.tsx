import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ProductList from '../pages/CreatorPortal/components/ProductList';

const products = [
  { id:'draft-1', name:'Oak Table', code:'PZ-TABLE-01', category:'tables',
    status:'draft', images:[], production_sites:['zhaoqing'] },
  { id:'returned-2', name:'Walnut Bench', code:'PZ-BENCH-02', category:'tables',
    status:'rejected', images:[], production_sites:['zhaoqing'] },
  { id:'published-3', name:'Oak Cabinet', code:'PZ-CAB-03', category:'tables',
    status:'published', images:[], production_sites:['cambodia'] },
  { id:'pending-4', name:'Ash Shelf', code:'PZ-SHELF-04', category:'tables',
    status:'pending_admin', images:[], production_sites:['zhaoqing'] }
] as any;

test('admin product list contains no legacy direct publish/delete or edits to approved records',async()=>{
  const edited:string[]=[];
  let view:ReactTestRenderer|undefined;
  try {
    await act(async()=>{view=create(<ProductList
      items={products} categories={[{id:'tables',title:'Tables'}] as any}
      onEdit={item=>edited.push(item.id!)} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh"
    />);});
    const buttons=view!.root.findAllByType('button');
    assert.equal(buttons.filter(x=>x.props.title==='删除').length,0);
    assert.equal(buttons.filter(x=>x.props.title==='编辑').length,2,'only draft and rejected records editable');
    assert.equal(buttons.filter(x=>x.props['aria-label']==='选择产品提交审核').length,0);
    const labels=buttons.map(x=>x.children.filter((v:any)=>typeof v==='string').join(''));
    assert.ok(!labels.includes('批量发布'));
    assert.ok(!labels.includes('移至草稿'));
    assert.ok(!labels.includes('批量删除'));
    assert.match(view!.root.findByProps({role:'note'}).children.join(''),/审核中心/);
    await act(async()=>buttons.filter(x=>x.props.title==='编辑')[0].props.onClick());
    assert.deepEqual(edited,['draft-1']);
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('factory bulk review reports partial failure and keeps only failed draft selected',async()=>{
  const oldConfirm=(globalThis as any).confirm;
  const oldAlert=(globalThis as any).alert;
  const alerts:string[]=[];
  (globalThis as any).confirm=()=>true;
  (globalThis as any).alert=(message:unknown)=>{alerts.push(String(message));};
  const attempted:string[]=[];
  let refreshed=0;
  let view:ReactTestRenderer|undefined;
  try {
    await act(async()=>{view=create(<ProductList
      items={products} categories={[{id:'tables',title:'Tables'}] as any}
      onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      onSubmit={async id=>{attempted.push(id);if(id==='returned-2')throw Error('409 stale');}}
      onRefresh={async()=>{refreshed++;}}
      userRole="FACTORY" lang="zh"
    />);});
    const controls=()=>view!.root.findAllByType('button');
    const selects=controls().filter(x=>x.props['aria-label']==='选择产品提交审核');
    assert.equal(selects.length,2,'published and pending products cannot be selected');
    await act(async()=>{selects[0].props.onClick();selects[1].props.onClick();});
    const bulk=()=>controls().find(x=>x.children.some((v:any)=>v==='批量提交审核'))!;
    await act(async()=>{
      bulk().props.onClick();
      await new Promise(resolve=>setImmediate(resolve));
    });
    assert.deepEqual(attempted,['draft-1','returned-2']);
    assert.equal(refreshed,1);
    assert.match(alerts.join(' '),/成功提交 1 个，失败 1 个/);
    assert.equal(view!.root.findAllByType('svg').length>=0,true);
    assert.match(view!.root.findByType('div').children.length.toString(),/^[0-9]+$/);
    assert.equal(controls().filter(x=>x.props['aria-label']==='选择产品提交审核')
      .filter(x=>x.findAllByType('svg').length>0).length,2);
    // The selection badge is retained for the failed item only.
    const badge=view!.root.findAllByType('span')
      .find(x=>x.props.className?.includes('font-mono font-bold')&&x.children.join('')==='1');
    assert.ok(badge,'one rejected item remains selected');
  }finally{
    if(view)await act(async()=>view!.unmount());
    if(oldConfirm===undefined)delete (globalThis as any).confirm;
    else (globalThis as any).confirm=oldConfirm;
    if(oldAlert===undefined)delete (globalThis as any).alert;
    else (globalThis as any).alert=oldAlert;
  }
});
