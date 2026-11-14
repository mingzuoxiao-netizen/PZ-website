import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import TwoStageProductReviews from '../pages/CreatorPortal/components/TwoStageProductReviews';

test('supervisor sees complete first submission, then reviews the next revision; tracking never grants approval',async()=>{
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const requests:string[]=[];
  const rows=[
    {id:'first',kind:'product',code:'PZ-FIRST',name:'First Table',status:'pending_supervisor',latest_version:1},
    {id:'second',kind:'revision',code:'PZ-SECOND',name:'Second Table',status:'pending_supervisor',latest_version:1}
  ];
  let view:ReturnType<typeof create>|undefined;
  const button=(label:string)=>view!.root.findAllByType('button').find(x=>x.children.join('')===label)!;
  const reviewCardButton=(name:string)=>view!.root.findAllByType('article')
    .find(article=>article.findAllByType('h4').some(heading=>heading.children.includes(name)))!.findByType('button');
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const url=new URL(String(input),'https://local.example');requests.push((init?.method||'GET')+' '+url.pathname);
    if(url.pathname==='/api/supervisor/release-queue'){
      const state=url.searchParams.get('status')||'action';
      const items=rows.filter(row=>state==='action'?row.status==='pending_supervisor':row.status===state);
      return Response.json({list_version:1,items,total:items.length,page:1,page_size:50,has_more:false});
    }
    const match=url.pathname.match(/^\/api\/supervisor\/(reviews|revisions)\/(first|second)(\/approve)?$/);
    if(match){
      const row=rows.find(x=>x.id===match[2])!;
      if(init?.method==='POST'){row.status='pending_admin';return Response.json({success:true,status:'pending_admin'});}
      return Response.json({...row,
        versions:[{version:1,snapshot:{name:row.name,code:row.code,material:'oak',size:'120 cm',images:[]}}],
        base_snapshot:{name:row.name,material:'pine'},draft:{name:row.name,material:'oak'},events:[]});
    }
    throw Error('Unexpected '+url);
  }) as typeof fetch;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    const first=reviewCardButton('First Table');
    await act(async()=>first.props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/主管审核摘要|新品关键字段/);
    assert.match(JSON.stringify(view!.toJSON()),/120 cm/);
    assert.match(JSON.stringify(view!.toJSON()),/oak/);
    await act(async()=>button('初审通过并查看下一条').props.onClick());
    assert.ok(requests.includes('POST /api/supervisor/reviews/first/approve'));
    assert.ok(requests.includes('GET /api/supervisor/revisions/second'));
    assert.match(JSON.stringify(view!.toJSON()),/pine/);
    await act(async()=>button('初审通过并查看下一条').props.onClick());
    assert.ok(requests.includes('POST /api/supervisor/revisions/second/approve'));
    await act(async()=>view!.root.findByProps({'aria-label':'部门待办状态'}).props.onChange({target:{value:'pending_admin'}}));
    assert.match(JSON.stringify(view!.toJSON()),/匹配 2 项/);
    const pending=reviewCardButton('First Table');
    await act(async()=>pending.props.onClick());
    assert.equal(button('初审通过并查看下一条'),undefined);
    assert.equal(requests.filter(x=>x.startsWith('POST')).length,2);
  }finally{
    if(view)await act(async()=>view!.unmount());globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});
