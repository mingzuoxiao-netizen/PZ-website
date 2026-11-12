import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import TwoStageProductReviews,{isActionableProductReview} from '../pages/CreatorPortal/components/TwoStageProductReviews';
import PublishedRevisionQueue,{isActionableRevisionForRole} from '../pages/CreatorPortal/components/PublishedRevisionQueue';

const status=(response:any)=>Response.json(response);
const setup=()=>{
  const oldFetch=globalThis.fetch;
  const oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const calls:string[]=[];
  return {
    calls,
    install(fetcher:(url:string,init?:RequestInit)=>Promise<Response>){
      globalThis.fetch=(async(input:any,init?:RequestInit)=>{
        const url=String(input);calls.push((init?.method||'GET')+' '+url);
        return fetcher(url,init);
      }) as typeof fetch;
    },
    restore(){
      globalThis.fetch=oldFetch;
      if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
      else (globalThis as any).sessionStorage=oldStorage;
    }
  };
};
const getButton=(view:ReturnType<typeof create>,label:string)=>
  view.root.findAllByType('button').find(x=>
    x.children.filter((v):v is string=>typeof v==='string').join('')===label
  );
test('supervisor review prioritizes changed fields and shows return form only after request',async()=>{
  const environment=setup();
  const item={id:'rq1',product_id:'p1',name:'Oak Table',name_cn:'橡木餐桌',
    code:'PZ-001',status:'pending_supervisor',latest_version:2,
    approved_version:null,submitter_id:'staff',supervisor_id:'lead',department_id:'d1'};
  environment.install(async url=>{
    if(url.endsWith('/supervisor/revisions'))return Response.json({error:'disabled'},{status:404});
    if(url.endsWith('/supervisor/reviews/rq1'))return status({...item,versions:[
      {version:1,snapshot:{name:'Oak Table',material:'oak',finish:'matte',code:'PZ-001'},submitted_by:'staff',created_at:'2026-01-01'},
      {version:2,snapshot:{name:'Oak Table',material:'walnut',finish:'matte',code:'PZ-001'},submitted_by:'staff',created_at:'2026-01-02'}
    ],events:[]});
    if(url.includes('/supervisor/release-queue?'))return status({list_version:1,items:[{...item,kind:'product'}],total:1,page:1,page_size:50,has_more:false});
    throw Error('Unexpected request '+url);
  });
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    await act(async()=>{
      const itemButton=view!.root.findAllByType('button').find(x=>
        x.findAllByType('strong').some(y=>y.children.includes('橡木餐桌')));
      assert.ok(itemButton);
      itemButton!.props.onClick();
    });
    assert.ok(getButton(view!,'退回员工'));
    assert.match(JSON.stringify(view!.toJSON()),/本次变更/);
    assert.equal(view!.root.findAllByType('article').length,1,'only the changed material is shown');
    assert.equal(view!.root.findAllByType('textarea').length,0,'reason is not an always-visible field');
    await act(async()=>getButton(view!,'查看全部字段')!.props.onClick());
    assert.ok(view!.root.findAllByType('article').length>1,'all fields remain inspectable');
    await act(async()=>getButton(view!,'退回员工')!.props.onClick());
    assert.equal(view!.root.findAllByType('textarea').length,2,'optional overall note and required field explanation appear only after opting to return');
    assert.ok(getButton(view!,'确认退回员工')!.props.disabled,'no return without enough explanation');
    assert.equal(environment.calls.filter(x=>x.startsWith('POST')).length,0,'opening return form causes no mutation');
  }finally{
    if(view)await act(async()=>view!.unmount());
    environment.restore();
  }
});

test('published revision review shows mobile-friendly changed-field cards and optional return reason',async()=>{
  const environment=setup();
  const item={id:'rv1',product_id:'p1',submitter_id:'staff',supervisor_id:'lead',department_id:'d1',
    name:'Oak Table',name_cn:'橡木餐桌',code:'PZ-001',status:'pending_admin',
    latest_version:2,approved_version:null,draft_revision:2};
  environment.install(async url=>{
    if(url.endsWith('/admin/revisions/rv1'))return status({...item,
      base_snapshot:{name:'Oak Table',material:'oak',code:'PZ-001'},
      draft:{name:'Oak Table',material:'walnut',code:'PZ-001'},
      versions:[{version:2,snapshot:{name:'Oak Table',material:'walnut',code:'PZ-001'},created_at:'2026-01-02'}],
      events:[]});
    if(url.endsWith('/admin/revisions'))return status({items:[item]});
    throw Error('Unexpected request '+url);
  });
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="ADMIN"/>);});
    await act(async()=>{
      const itemButton=view!.root.findAllByType('button').find(x=>
        x.findAllByType('strong').some(y=>y.children.includes('橡木餐桌')));
      assert.ok(itemButton);
      itemButton!.props.onClick();
    });
    assert.equal(view!.root.findAllByType('article').length,1);
    assert.equal(view!.root.findAllByType('table').length,0,'no sideways comparison table');
    assert.ok(view!.root.findAllByType('summary').some(x=>
      x.children.some(v=>typeof v==='string'&&v.includes('退回申请'))));
    assert.ok(getButton(view!,'终审批准（待发布）'));
    assert.equal(environment.calls.filter(x=>x.startsWith('POST')).length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    environment.restore();
  }
});

test('role-based product and revision review queues exclude completed and other-role work',()=>{
  assert.equal(isActionableProductReview('ADMIN','pending_admin'),true);
  assert.equal(isActionableProductReview('ADMIN','approved_pending_publish'),true);
  assert.equal(isActionableProductReview('ADMIN','published'),false);
  assert.equal(isActionableProductReview('ADMIN','pending_supervisor'),false);
  assert.equal(isActionableProductReview('SUPERVISOR','pending_supervisor'),true);
  assert.equal(isActionableProductReview('SUPERVISOR','returned_to_supervisor'),true);
  assert.equal(isActionableProductReview('SUPERVISOR','published'),false);
  assert.equal(isActionableRevisionForRole('ADMIN','pending_admin'),true);
  assert.equal(isActionableRevisionForRole('ADMIN','approved_pending_publish'),true);
  assert.equal(isActionableRevisionForRole('ADMIN','published'),false);
  assert.equal(isActionableRevisionForRole('ADMIN','canceled'),false);
  assert.equal(isActionableRevisionForRole('SUPERVISOR','pending_supervisor'),true);
  assert.equal(isActionableRevisionForRole('SUPERVISOR','returned_to_supervisor'),true);
  assert.equal(isActionableRevisionForRole('SUPERVISOR','published'),false);
  assert.equal(isActionableRevisionForRole('FACTORY','returned_to_uploader'),true);
  assert.equal(isActionableRevisionForRole('FACTORY','published'),false);
});

test('admin product review excludes published records and removes item and detail immediately after publishing',async()=>{
  const environment=setup();
  const priorConfirm=(globalThis as any).confirm;
  (globalThis as any).confirm=()=>true;
  const make=(id:string,status:string)=>({
    id,product_id:id,name:id==='new'?'Pending Product':'Completed Product',
    name_cn:id==='new'?'待发布产品':'已发布产品',
    code:'PZ-'+id,status,latest_version:2,approved_version:2,
    submitter_id:'staff',supervisor_id:'lead',department_id:'d1'
  });
  let current='approved_pending_publish';
  environment.install(async(url,init)=>{
    if(url.endsWith('/admin/revisions'))return Response.json({error:'disabled'},{status:404});
    if(url.endsWith('/admin/reviews/new/publish')&&(init?.method==='POST')){
      current='published';
      return status({success:true,status:'published'});
    }
    if(url.endsWith('/admin/reviews/new'))return status({
      ...make('new',current),
      versions:[{version:1,snapshot:{name:'Pending Product'},created_at:'2026-10-01'},
        {version:2,snapshot:{name:'Pending Product'},created_at:'2026-10-02'}],
      events:[]
    });
    if(url.includes('/admin/release-queue?')){const items=current==='published'?[]:[{...make('new',current),kind:'product'}];return status({list_version:1,items,total:items.length,page:1,page_size:50,has_more:false});}
    throw Error('Unexpected '+url);
  });
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="ADMIN"/>);});
    let rendered=JSON.stringify(view!.toJSON());
    assert.equal(view!.root.findAllByType('h3').find(x=>x.children.join('').startsWith('产品申请'))?.children.join(''),'产品申请（1）');
    assert.match(rendered,/待发布产品/);
    assert.doesNotMatch(rendered,/已发布产品/);
    assert.doesNotMatch(rendered,/待主管初审产品/);
    const list=view!.root.findByProps({'aria-label':'审核申请列表'});
    await act(async()=>list.findAllByType('button')[0].props.onClick());
    assert.ok(getButton(view!,'确认正式发布'));
    await act(async()=>getButton(view!,'确认正式发布')!.props.onClick());
    rendered=JSON.stringify(view!.toJSON());
    assert.equal(view!.root.findAllByType('h3').find(x=>x.children.join('').startsWith('产品申请'))?.children.join(''),'产品申请（0）');
    assert.doesNotMatch(rendered,/待发布产品/);
    assert.doesNotMatch(rendered,/已发布产品/);
    assert.match(rendered,/选择一条审核申请/);
    assert.ok(environment.calls.some(x=>x==='POST /api/admin/reviews/new/publish'));
  }finally{
    if(view)await act(async()=>view!.unmount());
    if(priorConfirm===undefined)delete (globalThis as any).confirm;
    else (globalThis as any).confirm=priorConfirm;
    environment.restore();
  }
});

test('admin completed revision disappears from review list and does not retain stale detail',async()=>{
  const environment=setup();
  const priorConfirm=(globalThis as any).confirm;
  (globalThis as any).confirm=()=>true;
  const make=(id:string,status:string)=>({
    id,product_id:'p-'+id,submitter_id:'staff',supervisor_id:'lead',department_id:'d1',
    name:id==='r1'?'Updated Table':'Old Table',
    name_cn:id==='r1'?'待发布修订':'已完成修订',
    code:id,status,latest_version:2,approved_version:2,draft_revision:2
  });
  let current='approved_pending_publish';
  environment.install(async(url,init)=>{
    if(url.endsWith('/admin/revisions/r1/publish')&&(init?.method==='POST')){
      current='published';
      return status({success:true,status:'published'});
    }
    if(url.endsWith('/admin/revisions/r1'))return status({
      ...make('r1',current),base_snapshot:{name:'Updated Table'},
      draft:{name:'Updated Table',material:'walnut'},versions:[],events:[]
    });
    if(url.endsWith('/admin/revisions'))return status({items:[
      make('r1',current),make('old','published'),
      {...make('supervisor','pending_supervisor'),name_cn:'主管审批中的修订'}
    ]});
    throw Error('Unexpected '+url);
  });
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="ADMIN"/>);});
    let rendered=JSON.stringify(view!.toJSON());
    assert.equal(view!.root.findAllByType('h2').find(x=>x.children.join('').startsWith('产品修订待办'))?.children.join(''),'产品修订待办（1）');
    assert.match(rendered,/待发布修订/);
    assert.doesNotMatch(rendered,/已完成修订|主管审批中的修订/);
    const row=view!.root.findByProps({'aria-label':'修订申请列表'}).findAllByType('button')[0];
    await act(async()=>row.props.onClick());
    assert.ok(getButton(view!,'确认发布修订'));
    await act(async()=>getButton(view!,'确认发布修订')!.props.onClick());
    rendered=JSON.stringify(view!.toJSON());
    assert.doesNotMatch(rendered,/已完成修订|待发布修订|修订已发布/);
    assert.equal(view!.root.findAllByProps({'aria-label':'产品修订待办'}).length,0,
      'the completed revision work section should disappear when nothing remains');
  }finally{
    if(view)await act(async()=>view!.unmount());
    if(priorConfirm===undefined)delete (globalThis as any).confirm;
    else (globalThis as any).confirm=priorConfirm;
    environment.restore();
  }
});

test('supervisor action error stays visible after the successful reconciliation read',async()=>{
  const environment=setup();let view:ReturnType<typeof create>|undefined;
  const item={id:'failed',kind:'product',name:'Pending Table',code:'PZ-FAILED',status:'pending_supervisor',latest_version:1};
  environment.install(async(url,init)=>{
    if(url.includes('/supervisor/release-queue?'))return status({list_version:1,items:[item],total:1,page:1,page_size:50,has_more:false});
    if(url.endsWith('/supervisor/reviews/failed/approve'))return Response.json({error:'temporary review failure'},{status:503});
    if(url.endsWith('/supervisor/reviews/failed'))return status({...item,versions:[{version:1,snapshot:{name:item.name}}],events:[]});
    throw Error('Unexpected '+url+' '+init?.method);
  });
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    const row=view!.root.findByProps({'aria-label':'审核申请列表'}).findAllByType('button')[0];
    await act(async()=>row.props.onClick());
    await act(async()=>getButton(view!,'初审通过并查看下一条')!.props.onClick());
    assert.match(JSON.stringify(view!.root.findByProps({role:'alert'}).children),/temporary review failure/);
    assert.equal(environment.calls.filter(call=>call.startsWith('POST')).length,1);
  }finally{if(view)await act(async()=>view!.unmount());environment.restore();}
});

