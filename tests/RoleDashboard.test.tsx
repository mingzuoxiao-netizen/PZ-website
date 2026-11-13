import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import RoleHome from '../pages/CreatorPortal/components/RoleHome';
import CompletenessBoard from '../pages/CreatorPortal/components/CompletenessBoard';

const FACTORY={role:'FACTORY',updated_at:'2026-11-12T20:00:00Z',
  drafts:3,returned:2,oldest_returned_at:'2026-11-10T08:00:00Z',
  in_review:1,stale_drafts:1,
  stale_items:[{id:'prod1',code:'PZ-TABLE-001',name:'Solid Oak Table',status:'draft',
    created_at:'2026-10-30T00:00:00Z',updated_at:'2026-11-01T00:00:00Z'}]};
const SUPERVISOR={role:'SUPERVISOR',updated_at:'2026-11-12T20:00:00Z',
  first_reviews:2,rechecks:1,total_pending:3};
const ADMIN={role:'ADMIN',updated_at:'2026-11-12T20:00:00Z',
  final_review:5,sample_queue:2,new_inquiries_24h:3,overdue_inquiries:1,stale_drafts:9};
const REPORT={list_version:1,updated_at:'2026-11-12T20:00:00Z',
  total_scanned:10,total_with_gaps:1,total:1,page:1,page_size:50,has_more:false,
  items:[{id:'prod1',code:'PZ-TABLE-001',name:'',category:'dining-table',
    owner_id:'staff',owner_name:'Operator',missing:['name','material'],updated_at:'2026-11-01T00:00:00Z'}],
  by_category:[{category:'dining-table',count:1,fields:{name:1,material:1}}],
  by_owner:[{owner_id:'staff',owner_name:'Operator',count:1,fields:{name:1,material:1}}]};
const Button=(view:ReturnType<typeof create>,text:string)=>
  view.root.findAllByType('button').find(b=>
    b.children.filter((x):x is string=>typeof x==='string').join('').includes(text)||
    b.props['aria-label']?.includes(text));
function setup(){
  const original=globalThis.fetch,storage=(globalThis as any).sessionStorage;
  const calls:string[]=[];
  (globalThis as any).sessionStorage={getItem:()=>null};
  globalThis.fetch=(async(input:any)=>{
    const url=new URL(String(input),'https://example.test');
    calls.push(url.pathname+url.search);
    if(url.pathname==='/api/factory/dashboard/home')return Response.json(FACTORY);
    if(url.pathname==='/api/supervisor/dashboard/home')return Response.json(SUPERVISOR);
    if(url.pathname==='/api/admin/dashboard/home')return Response.json(ADMIN);
    if(url.pathname==='/api/admin/dashboard/completeness')return Response.json(REPORT);
    throw Error('unexpected request '+url.pathname);
  }) as typeof fetch;
  return {calls,restore(){
    globalThis.fetch=original;
    if(storage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=storage;
  }};
}
test('factory home renders live counts and navigates to stale SKU and returned filter',async()=>{
  const env=setup(),targets:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<RoleHome role="FACTORY" onNavigate={x=>targets.push(x)}/>);});
    const html=JSON.stringify(view!.toJSON());
    for(const text of ['我的进行中草稿','退回待我修改','超过 7 天未更新的草稿','PZ-TABLE-001'])
      assert.ok(html.includes(text),text);
    await act(async()=>Button(view!,'退回待我修改')!.props.onClick());
    assert.deepEqual(targets[0],{tab:'inventory',status:'returned'});
    await act(async()=>Button(view!,'PZ-TABLE-001')!.props.onClick());
    assert.deepEqual(targets[1],{tab:'inventory',status:'draft',stale:true,sku:'PZ-TABLE-001'});
    assert.equal(env.calls.filter(x=>x==='/api/factory/dashboard/home').length,1);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
test('supervisor homepage sends same recheck keys as server-side review list',async()=>{
  const env=setup(),targets:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<RoleHome role="SUPERVISOR" onNavigate={x=>targets.push(x)}/>);});
    await act(async()=>Button(view!,'等待我的首次初审')!.props.onClick());
    await act(async()=>Button(view!,'退回后待复检')!.props.onClick());
    assert.deepEqual(targets,[{tab:'reviews',recheck:0},{tab:'reviews',recheck:1}]);
    assert.match(JSON.stringify(view!.toJSON()),/主管全部待办/);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
test('admin homepage links final review, sample queue, inquiries and stale inventory',async()=>{
  const env=setup(),targets:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<RoleHome role="ADMIN" onNavigate={x=>targets.push(x)}/>);});
    for(const label of ['待我终审与发布','快速通道待抽检','24 小时内新询盘',
      '已超过 24 小时未处理询盘','全站 7 天未更新草稿','产品资料完整度'])
      await act(async()=>Button(view!,label)!.props.onClick());
    assert.deepEqual(targets,[
      {tab:'review',section:'products'},{tab:'review',section:'fast-lane'},
      {tab:'inquiries',inquiryPreset:'new'},{tab:'inquiries',inquiryPreset:'overdue'},
      {tab:'inventory',status:'draft',stale:true},{tab:'completeness'}
    ]);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
test('completeness board shows only a page, rollups and SKU navigation',async()=>{
  const env=setup(),targets:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<CompletenessBoard onNavigate={x=>targets.push(x)}/>);});
    const html=JSON.stringify(view!.toJSON());
    assert.match(html,/资料完整度/);
    assert.match(html,/PZ-TABLE-001/);
    assert.match(html,/主要材质/);
    assert.match(html,/英文产品名称/);
    await act(async()=>Button(view!,'定位产品')!.props.onClick());
    assert.deepEqual(targets,[{tab:'inventory',sku:'PZ-TABLE-001'}]);
    const category=view!.root.findByProps({'aria-label':'完整度按品类筛选'});
    await act(async()=>category.props.onChange({target:{value:'dining-table'}}));
    assert.ok(env.calls.some(x=>x.includes('category=dining-table')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
