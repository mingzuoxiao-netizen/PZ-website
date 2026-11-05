import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import TwoStageProductReviews from '../pages/CreatorPortal/components/TwoStageProductReviews';
import PublishedRevisionQueue from '../pages/CreatorPortal/components/PublishedRevisionQueue';

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
    if(url.endsWith('/supervisor/reviews'))return status({items:[item]});
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
    assert.equal(view!.root.findAllByType('textarea').length,1,'reason appears only after opting to return');
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