import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create, type ReactTestRenderer} from 'react-test-renderer';
import ProductList from '../pages/CreatorPortal/components/ProductList';
import {normalizeAdminInventoryProducts} from '../utils/normalizeAdminInventoryProducts';

const products=[
  {id:'d1',code:'PZ-DRAFT-1',name:'Draft table',status:'draft',images:[],production_sites:[]},
  {id:'d2',code:'PZ-REJECT-2',name:'Rejected chair',status:'rejected',images:[],production_sites:[]},
  {id:'p3',code:'PZ-PUBLISHED-3',name:'Public stool',status:'published',images:[],production_sites:[]},
  {id:'w4',code:'PZ-WAITING-4',name:'Pending product',status:'pending_admin',images:[],production_sites:[]}
] as any;

function setup(){
  const previous={
    confirm:(globalThis as any).confirm,
    alert:(globalThis as any).alert,
    prompt:(globalThis as any).prompt
  };
  const confirmations:string[]=[],alerts:string[]=[];
  (globalThis as any).confirm=(message:string)=>{confirmations.push(String(message));return true;};
  (globalThis as any).alert=(message:string)=>{alerts.push(String(message));};
  (globalThis as any).prompt=()=>{throw Error('Manual SKU prompt must never be used');};
  return {confirmations,alerts,restore:()=>{
    for(const [key,value] of Object.entries(previous)){
      if(value===undefined)delete (globalThis as any)[key];
      else (globalThis as any)[key]=value;
    }
  }};
}
function getButton(view:ReactTestRenderer,label:string){
  return view.root.findAllByType('button').find(b=>
    b.children.filter((x):x is string=>typeof x==='string').join('').includes(label));
}

test('Admin deletion UI supports a single confirmation for selected products, no SKU typing, and reports partial failure',async()=>{
  const env=setup(),calls:string[]=[];
  let refreshed=0,view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<ProductList
      items={products} categories={[] as any} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh"
      onRefresh={()=>{refreshed++;}}
      onPermanentDelete={async item=>{
        calls.push(item.id!);
        if(item.id==='d2')throw Error('409 PRODUCT_HAS_HISTORY');
      }}
    />);});
    assert.ok(view!.root.findByProps({'aria-label':'管理员批量删除产品'}));
    assert.equal(view!.root.findAllByProps({'aria-label':'选择永久删除 PZ-PUBLISHED-3'}).length,0);
    assert.equal(view!.root.findAllByProps({'aria-label':'选择永久删除 PZ-WAITING-4'}).length,0);
    await act(async()=>{
      view!.root.findByProps({'aria-label':'选择永久删除 PZ-DRAFT-1'}).props.onClick();
      view!.root.findByProps({'aria-label':'选择永久删除 PZ-REJECT-2'}).props.onClick();
    });
    assert.equal(getButton(view!,'批量删除')!.props.disabled,false);
    await act(async()=>{
      await getButton(view!,'批量删除')!.props.onClick();
    });
    assert.deepEqual(calls,['d1','d2']);
    assert.equal(env.confirmations.length,1,'one confirmation for a batch');
    assert.ok(env.confirmations[0].includes('2 件产品'));
    assert.ok(env.confirmations[0].includes('不需要输入 SKU'));
    assert.equal(refreshed,1,'refresh only once at batch completion');
    assert.match(env.alerts.join(' '),/成功 1 件，失败 1 件/);
    assert.match(env.alerts.join(' '),/PRODUCT_HAS_HISTORY/);
    const failed=view!.root.findByProps({'aria-label':'选择永久删除 PZ-REJECT-2'});
    assert.equal(failed.props['aria-pressed'],true);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('Admin single product delete also uses only a confirmation, never a SKU prompt',async()=>{
  const env=setup(),called:string[]=[];
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<ProductList
      items={[products[0]]} categories={[] as any} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh"
      onPermanentDelete={async item=>{called.push(item.id!);}} onRefresh={()=>{}}
    />);});
    const single=view!.root.findByProps({'aria-label':'永久删除 SKU'});
    await act(async()=>{await single.props.onClick();});
    assert.deepEqual(called,['d1']);
    assert.equal(env.confirmations.length,1);
    assert.match(env.alerts.join(' '),/产品已从管理及公开目录移除/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('Admin product status follows current D1 status, not stale is_published values',()=>{
  const rows=[
    {...products[0],status:'pending_admin',is_published:1},
    {...products[2],status:'published',is_published:1},
    {...products[1],status:'archived',is_published:1}
  ] as any;
  const result=normalizeAdminInventoryProducts(rows);
  assert.equal(result[0].status,'pending_admin');
  assert.equal(result[1].status,'published');
  assert.equal(result[2].status,'archived');
});
