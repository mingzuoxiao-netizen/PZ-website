import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import NewCategoryRequestHistory from '../pages/CreatorPortal/components/NewCategoryRequestHistory';
import SupervisorCategoryRequests from '../pages/CreatorPortal/components/SupervisorCategoryRequests';

const storage=()=>({getItem:()=>null});
const findButton=(view:ReturnType<typeof create>,name:string)=>
  view.root.findAllByType('button').find(b=>b.children.filter((x):x is string=>typeof x==='string').join('').includes(name));

test('factory request history shows a submitted request and rejection reason, then resubmits same ID',async()=>{
  const originalFetch=globalThis.fetch;
  const originalStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage=storage();
  let rows:any[]=[{
    id:'cat1',title:'Tables',title_cn:'餐桌',subtitle:'',image:'https://example.com/cover.jpg',
    status:'returned_to_uploader',created_at:'2026-11-10',
    updated_at:'2026-11-10',reject_reason:'封面不清晰',supervisor_name:'max'
  }];
  const calls:any[]=[];
  globalThis.fetch=async(url,options)=>{
    const address=String(url);const method=options?.method||'GET';
    if(method==='GET'&&address.endsWith('/factory/category-requests'))return Response.json({items:rows});
    if(method==='POST'&&address.endsWith('/factory/category-requests/cat1/resubmit')){
      const body=JSON.parse(String(options?.body));calls.push(body);
      rows=rows.map(x=>({...x,title_cn:body.title_cn,status:'pending_supervisor',reject_reason:null}));
      return Response.json({success:true,status:'pending_supervisor'});
    }
    throw Error('Unexpected '+method+' '+address);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<NewCategoryRequestHistory onUpload={async()=>''}/>);});
    assert.match(JSON.stringify(view!.toJSON()),/封面不清晰/);
    assert.ok(findButton(view!,'修改并重新提交'));
    await act(async()=>findButton(view!,'修改并重新提交')!.props.onClick());
    const input=view!.root.findByProps({'aria-label':'重新提交中文名称'});
    await act(async()=>input.props.onChange({target:{value:'实木餐桌'}}));
    const form=view!.root.findAllByType('form')[0];
    await act(async()=>form.props.onSubmit({preventDefault(){}}));
    assert.equal(calls.length,1);
    assert.equal(calls[0].title_cn,'实木餐桌');
    assert.match(JSON.stringify(view!.toJSON()),/待初审/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=originalFetch;
    if(originalStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=originalStorage;
  }
});

test('supervisor category queue retains returned requests and requires a reason for rejection',async()=>{
  const originalFetch=globalThis.fetch,originalStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage=storage();
  let rows:any[]=[{
    id:'cat2',title:'Benches',title_cn:'长凳',subtitle:'',image:'',
    status:'pending_supervisor',created_at:'2026-11-10',updated_at:'2026-11-10',
    submitter_name:'staff'
  }];
  const calls:any[]=[];
  globalThis.fetch=async(url,options)=>{
    const method=options?.method||'GET';const address=String(url);
    if(method==='GET'&&address.endsWith('/supervisor/category-requests'))return Response.json({items:rows});
    if(method==='POST'&&address.endsWith('/supervisor/category-requests/cat2/reject')){
      calls.push(JSON.parse(String(options?.body)));
      rows=rows.map(x=>({...x,status:'returned_to_uploader',reject_reason:'请补充木材规格'}));
      return Response.json({success:true,status:'returned_to_uploader'});
    }
    throw Error('Unexpected '+address);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<SupervisorCategoryRequests/>);});
    assert.match(JSON.stringify(view!.toJSON()),/待初审/);
    await act(async()=>findButton(view!,'退回员工')!.props.onClick());
    assert.equal(view!.root.findByProps({'aria-label':'新品类退回原因'}).props.value,'');
    assert.equal(findButton(view!,'确认退回员工')!.props.disabled,true);
    await act(async()=>view!.root.findByProps({'aria-label':'新品类退回原因'}).props.onChange({target:{value:'请补充木材规格'}}));
    await act(async()=>findButton(view!,'确认退回员工')!.props.onClick());
    assert.equal(calls.length,1);assert.equal(calls[0].note,'请补充木材规格');
    assert.match(JSON.stringify(view!.toJSON()),/请补充木材规格/);
    assert.match(JSON.stringify(view!.toJSON()),/已退回/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=originalFetch;
    if(originalStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=originalStorage;
  }
});
