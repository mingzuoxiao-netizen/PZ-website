import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create, type ReactTestRenderer} from 'react-test-renderer';
import ProductList from '../pages/CreatorPortal/components/ProductList';
import {normalizeAdminInventoryProducts} from '../utils/normalizeAdminInventoryProducts';
import {acceptBackofficeDialog} from './backofficeDialogTest';

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
    await act(async()=>{void getButton(view!,'批量删除')!.props.onClick();});
    await acceptBackofficeDialog(view!);
    assert.deepEqual(calls,['d1','d2']);
    assert.equal(env.confirmations.length,0,'uses the shared dialog, not a browser-native confirmation');
    assert.equal(refreshed,1,'refresh only once at batch completion');
    assert.match(JSON.stringify(view!.toJSON()),/成功 1 件，失败 1 件/);
    assert.match(JSON.stringify(view!.toJSON()),/删除失败，请刷新核对该产品状态/);
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
    await act(async()=>{void single.props.onClick();});
    await acceptBackofficeDialog(view!);
    assert.deepEqual(called,['d1']);
    assert.equal(env.confirmations.length,0);
    assert.match(JSON.stringify(view!.toJSON()),/已彻底删除 PZ-DRAFT-1/);
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


test('Admin force mode can select published and in-review SKUs for one-confirmation bulk removal',async()=>{
  const env=setup(),called:string[]=[];
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<ProductList
      items={products} categories={[] as any} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh" forceDeleteEnabled
      onRefresh={()=>{}}
      onPermanentDelete={async item=>{called.push(item.id!);}}
    />);});
    const published=view!.root.findByProps({'aria-label':'选择永久删除 PZ-PUBLISHED-3'});
    const reviewing=view!.root.findByProps({'aria-label':'选择永久删除 PZ-WAITING-4'});
    await act(async()=>{
      published.props.onClick();
      reviewing.props.onClick();
    });
    assert.equal(getButton(view!,'批量删除')!.props.disabled,false);
    await act(async()=>{void getButton(view!,'批量删除')!.props.onClick();});
    assert.match(JSON.stringify(view!.toJSON()),/必要审计历史/);
    await acceptBackofficeDialog(view!);
    assert.deepEqual(called,['p3','w4']);
    assert.equal(env.confirmations.length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});


test('Admin sees a disabled published deletion action with a clear readiness label when Worker force delete is off',async()=>{
  const env=setup();
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<ProductList
      items={[products[2]]} categories={[] as any} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh" forceDeleteEnabled={false}
      onPermanentDelete={async()=>{throw Error('Should never execute disabled action');}}
    />);});
    const disabled=view!.root.findByProps({'aria-label':'强制删除尚未启用'});
    assert.equal(disabled.props.disabled,true);
    assert.match(disabled.props.title,/D1 016/);
    assert.equal(view!.root.findAllByProps({'aria-label':'管理员批量删除产品'}).length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('batch deletion reports confirmed success separately from already-absent records and real failures',async()=>{
  const env=setup();
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<ProductList
      items={products} categories={[] as any} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="ADMIN" lang="zh" forceDeleteEnabled
      onPermanentDelete={async item=>{
        if(item.id==='d1')return {state:'deleted' as const};
        if(item.id==='d2')return {state:'verified_removed' as const};
        if(item.id==='p3')return {state:'already_absent' as const};
        throw Error('Unrelated record is still in review');
      }}
      onRefresh={()=>{}}
    />);});
    await act(async()=>{
      view!.root.findByProps({'aria-label':'全选本页可删除产品'}).props.onChange({target:{checked:true}});
    });
    await act(async()=>{void getButton(view!,'批量删除')!.props.onClick();});
    await acceptBackofficeDialog(view!);
    const summary=JSON.stringify(view!.toJSON());
    assert.match(summary,/成功 2 件，失败 1 件/);
    assert.match(summary,/数据库中已不存在 1 件/);
    assert.match(summary,/其中 1 件经状态复查确认已移除/);
    assert.match(summary,/删除失败，请刷新核对该产品状态/);
    assert.doesNotMatch(summary,/HTTP 409/);
    assert.equal(env.confirmations.length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});
