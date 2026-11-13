import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import InquiryManager from '../pages/CreatorPortal/components/InquiryManager';

const example={
  id:'i1',name:'Buyer',email:'buyer@example.test',company:'Example Co',
  product_type:'Trade Program',country:'United States',linked_product_code:'PZ-TABLE-001',
  created_at:'2026-11-09T09:00:00.000Z',status:'new',
  assignee_id:null,assignee_name:null,first_response_at:null,is_overdue:true,version:0
};
function setup(){
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  let row={...example},notes='Initial internal',history:any[]=[];
  const calls:string[]=[];
  (globalThis as any).sessionStorage={getItem:()=>null};
  globalThis.fetch=(async(input:any,options?:RequestInit)=>{
    const url=new URL(String(input),'https://example.test');
    const path=url.pathname.replace(/^\/api\//,'');
    const method=options?.method||'GET';
    calls.push(method+' '+url.pathname+url.search);
    if(path==='admin/inquiries/assignees')return Response.json({items:[
      {id:'admin1',username:'Admin',role:'admin'},{id:'staff',username:'Staff',role:'factory'}
    ]});
    if(path==='admin/inquiries'&&url.searchParams.get('list_version')==='1'){
      const overdue=url.searchParams.get('overdue');
      const status=url.searchParams.get('status');
      const filtered=(!status||status===row.status)&&(!overdue||row.is_overdue)?[row]:[];
      return Response.json({list_version:1,items:filtered,total:filtered.length,
        page:1,page_size:50,has_more:false});
    }
    if(path==='admin/inquiries/i1'&&method==='GET'){
      return Response.json({item:{...row,message:'Need 200 tables',source:'website',
        website:'https://example.test',updated_at:null,internal_notes:notes},history});
    }
    if(path==='admin/inquiries/i1'&&method==='PUT'){
      const data=JSON.parse(String(options?.body||'{}'));
      assert.equal(data.expected_version,row.version);
      row={...row,status:data.status,assignee_id:data.assignee_id,
        assignee_name:data.assignee_id?'Staff':null,first_response_at:'2026-11-12T11:00:00Z',
        is_overdue:false,version:row.version+1};
      notes=data.internal_notes;
      history=[
        {id:'e1',field:'status',old_value:'new',new_value:'replied',
          actor_name:'Admin',created_at:'2026-11-12T11:00:00Z'},
        {id:'e2',field:'assignee_id',old_value:null,new_value:'staff',
          actor_name:'Admin',created_at:'2026-11-12T11:00:00Z'}
      ];
      return Response.json({success:true,version:row.version});
    }
    throw Error('Unexpected request '+method+' '+url);
  }) as typeof fetch;
  return {calls,restore(){
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }};
}
const findButton=(view:ReturnType<typeof create>,fragment:string)=>
  view.root.findAllByType('button').find(b=>
    b.children.filter((x):x is string=>typeof x==='string').join('').includes(fragment));

test('inquiry list shows server-derived overdue flag and filters without client-side truncation',async()=>{
  const env=setup();let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter initialEntries={['/creator/admin']}>
      <InquiryManager/></MemoryRouter>);});
    assert.match(JSON.stringify(view!.toJSON()),/Example Co/);
    assert.match(JSON.stringify(view!.toJSON()),/PZ-TABLE-001/);
    assert.match(JSON.stringify(view!.toJSON()),/已超时/);
    const checkbox=view!.root.findAllByType('input').find(x=>x.props.type==='checkbox');
    assert.ok(checkbox);
    await act(async()=>checkbox!.props.onChange({target:{checked:true}}));
    assert.ok(env.calls.some(x=>x.includes('overdue=1')));
    const status=view!.root.findByProps({'aria-label':'询盘状态筛选'});
    await act(async()=>status.props.onChange({target:{value:'quoted'}}));
    assert.match(JSON.stringify(view!.toJSON()),/当前没有符合条件的询盘/);
    assert.ok(env.calls.some(x=>x.includes('status=quoted')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('admin opens detail, assigns existing staff, saves status/notes and sees timestamped history',async()=>{
  const env=setup();let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter initialEntries={['/creator/admin']}>
      <InquiryManager/></MemoryRouter>);});
    await act(async()=>findButton(view!,'查看与跟进')!.props.onClick());
    let rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/Need 200 tables/);
    assert.match(rendered,/Initial internal/);
    const status=view!.root.findByProps({'aria-label':'修改询盘状态'});
    const assignee=view!.root.findByProps({'aria-label':'修改询盘负责人'});
    const notes=view!.root.findByProps({'aria-label':'内部备注'});
    await act(async()=>{
      status.props.onChange({target:{value:'replied'}});
      assignee.props.onChange({target:{value:'staff'}});
      notes.props.onChange({target:{value:'Called the customer'}});
    });
    await act(async()=>findButton(view!,'保存')!.props.onClick());
    rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/已保存询盘 Buyer 的跟进状态/);
    assert.match(rendered,/Called the customer/);
    assert.match(rendered,/跟进历史/);
    assert.match(rendered,/已回复/);
    assert.ok(env.calls.some(x=>x.startsWith('PUT /api/admin/inquiries/i1')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('admin notification deep-link opens the correct inquiry in the workbench',async()=>{
  const env=setup();let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter initialEntries={['/creator/admin?inquiryId=i1']}>
      <InquiryManager/></MemoryRouter>);});
    assert.match(JSON.stringify(view!.toJSON()),/Need 200 tables/);
    assert.ok(env.calls.some(x=>x.includes('GET /api/admin/inquiries/i1')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
