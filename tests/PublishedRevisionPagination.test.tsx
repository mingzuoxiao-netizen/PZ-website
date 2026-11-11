import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import PublishedRevisionQueue from '../pages/CreatorPortal/components/PublishedRevisionQueue';

test('factory revision search reaches beyond 300 and only renders a bounded page',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const rows=Array.from({length:351},(_,i)=>({id:'r'+i,code:'PZ-R'+i,name:'Revision '+i,status:'draft',latest_version:0,draft_revision:1}));
  globalThis.fetch=(async(input:any)=>{
    const url=new URL(String(input),'https://local.example');
    assert.equal(url.searchParams.get('list_version'),'1');
    const q=url.searchParams.get('q')||'',page=Number(url.searchParams.get('page')||1);
    const items=rows.filter(row=>!q||row.code===q);
    return Response.json({list_version:1,items:items.slice((page-1)*50,page*50),total:items.length,page,page_size:50,has_more:page*50<items.length});
  }) as typeof fetch;
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="FACTORY" paged/>);});
    assert.equal(view!.root.findByProps({'aria-label':'修订申请列表'}).findAllByType('button').length,50);
    await act(async()=>view!.root.findByProps({'aria-label':'搜索我的修订'}).props.onChange({target:{value:'PZ-R350'}}));
    await act(async()=>view!.root.findByProps({'aria-label':'筛选我的修订'}).props.onSubmit({preventDefault(){}}));
    assert.equal(view!.root.findByProps({'aria-label':'修订申请列表'}).findAllByType('button').length,1);
    assert.match(JSON.stringify(view!.toJSON()),/PZ-R350/);
    assert.match(JSON.stringify(view!.toJSON()),/匹配 1 项/);
  }finally{if(view)await act(async()=>view!.unmount());globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;else (globalThis as any).sessionStorage=oldStorage;}
});

test('revision submission error is not erased by a successful list refresh',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage,oldConfirm=(globalThis as any).confirm;
  (globalThis as any).sessionStorage={getItem:()=>null};(globalThis as any).confirm=()=>true;
  const item={id:'draft',code:'PZ-DRAFT',name:'Draft Table',status:'draft',latest_version:0,draft_revision:1};
  let view:ReturnType<typeof create>|undefined;
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const path=String(input);
    if(path.endsWith('/submit'))return Response.json({error:'temporary revision failure'},{status:503});
    if(path.endsWith('/draft'))return Response.json({...item,versions:[],base_snapshot:{},draft:{name:item.name},events:[]});
    return Response.json({items:[item]});
  }) as typeof fetch;
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="FACTORY"/>);});
    await act(async()=>view!.root.findByProps({'aria-label':'修订申请列表'}).findAllByType('button')[0].props.onClick());
    const submit=view!.root.findAllByType('button').find(button=>button.children.join('')==='提交主管初审')!;
    await act(async()=>submit.props.onClick());
    assert.match(JSON.stringify(view!.root.findByProps({role:'alert'}).children),/temporary revision failure/);
  }finally{
    if(view)await act(async()=>view!.unmount());globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;else (globalThis as any).sessionStorage=oldStorage;
    if(oldConfirm===undefined)delete (globalThis as any).confirm;else (globalThis as any).confirm=oldConfirm;
  }
});
