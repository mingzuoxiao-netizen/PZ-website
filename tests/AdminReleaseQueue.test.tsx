import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import AdminReleaseQueue from '../pages/CreatorPortal/components/AdminReleaseQueue';

type Item={id:string;product_id:string;name:string;name_cn:string;code:string;
  category:string;status:string;latest_version:number;approved_version:number|null;
  department_id:string;supervisor_id:string;submitter_id:string;images:string};
const mk=(id:string,status:string):Item=>({
  id,product_id:'product-'+id,name:'Product '+id,name_cn:'产品 '+id,code:'PZ-'+id,
  category:'tables',status,latest_version:2,approved_version:1,
  department_id:'department-A',supervisor_id:'lead',submitter_id:'factory',
  images:JSON.stringify(['https://cdn.peng-zhan.com/uploads%2Ftest.jpg'])
});
const setup=(products:Item[],revisions:Item[])=>{
  const old=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage,oldConfirm=(globalThis as any).confirm;
  const requests:string[]=[];
  let dataProducts=products.map(x=>({...x})),dataRevisions=revisions.map(x=>({...x}));
  let callbackCount=0;
  (globalThis as any).sessionStorage={getItem:()=>null};
  (globalThis as any).confirm=()=>true;
  globalThis.fetch=(async(url:any,options?:RequestInit)=>{
    const path=String(url).replace(/^.*?\/api\//,'');
    const method=options?.method||'GET';
    const route=path.split('?')[0];
    const params=new URLSearchParams(path.split('?')[1]||'');
    requests.push(method+' '+path);
    if(method==='GET'&&route==='admin/release-queue'){
      let rows=[...dataProducts.map(x=>({...x,kind:'product'})),...dataRevisions.map(x=>({...x,kind:'revision'}))]
        .filter(x=>['pending_admin','approved_pending_publish'].includes(x.status));
      const q=(params.get('q')||'').toLowerCase();
      if(q)rows=rows.filter(x=>[x.code,x.name,x.name_cn].some(v=>v.toLowerCase().includes(q)));
      if(params.get('department'))rows=rows.filter(x=>x.department_id===params.get('department'));
      if(params.get('supervisor'))rows=rows.filter(x=>x.supervisor_id===params.get('supervisor'));
      if(params.get('kind'))rows=rows.filter(x=>x.kind===params.get('kind'));
      const page=Number(params.get('page')||1),size=Number(params.get('page_size')||50);
      return Response.json({list_version:1,total:rows.length,page,page_size:size,
        has_more:page*size<rows.length,items:rows.slice((page-1)*size,page*size)});
    }
    if(method==='GET'&&route==='admin/org/accounts')return Response.json({
      users:[{id:'lead',username:'主管甲',department_id:'department-A',department_name:'肇庆产品部',job_type:'supervisor'},
        {id:'factory',username:'员工甲',department_id:'department-A',department_name:'肇庆产品部',job_type:'staff'}]});
    const match=path.match(/^admin\/(reviews|revisions)\/([^/]+)(?:\/(approve|return|publish))?$/);
    if(match){
      const pool=match[1]==='reviews'?dataProducts:dataRevisions;
      const found=pool.find(x=>x.id===match[2]);
      if(!found)return Response.json({error:'not found'},{status:404});
      if(method==='GET')return Response.json({
        ...found,versions:[{version:1,snapshot:{material:'oak'}},{version:2,snapshot:{material:'walnut'}}],
        base_snapshot:{material:'oak'},draft:{material:'walnut'},events:[]});
      if(match[3]==='approve' && found.status==='pending_admin'){
        found.status='approved_pending_publish';
        return Response.json({success:true,status:'approved_pending_publish'});
      }
      if(match[3]==='publish' && found.status==='approved_pending_publish'){
        found.status='published';
        return Response.json({success:true,status:'published',catalog_published:true});
      }
      if(match[3]==='return' && found.status==='pending_admin'){
        found.status='returned_to_supervisor';
        return Response.json({success:true,status:'returned_to_supervisor'});
      }
      return Response.json({error:'invalid transition'},{status:409});
    }
    throw Error('Unexpected '+method+' '+path);
  }) as typeof fetch;
  return {requests,onQueueChanged:async()=>{callbackCount++;},get calls(){return callbackCount;},
    restore(){
      globalThis.fetch=old;
      if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
      else (globalThis as any).sessionStorage=oldStorage;
      if(oldConfirm===undefined)delete (globalThis as any).confirm;
      else (globalThis as any).confirm=oldConfirm;
    }
  };
};
const findButton=(view:ReturnType<typeof create>,label:string)=>
  view.root.findAllByType('button').find(b=>
    b.children.filter((x):x is string=>typeof x==='string').join('').includes(label));

test('admin list is compact; no forced detail; single click runs guarded approve then publish',async()=>{
  const env=setup([mk('new','pending_admin'),mk('done','published')],[]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<AdminReleaseQueue onQueueChanged={env.onQueueChanged}/>);});
    let rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/产品 new/);
    assert.doesNotMatch(rendered,/产品 done/);
    assert.match(rendered,/肇庆产品部/);
    assert.equal(view!.root.findAllByType('pre').length,0);
    const button=findButton(view!,'确认发布');
    assert.ok(button);
    await act(async()=>button!.props.onClick());
    assert.deepEqual(env.requests.filter(x=>x.startsWith('POST')),[
      'POST admin/reviews/new/approve','POST admin/reviews/new/publish'
    ]);
    rendered=JSON.stringify(view!.toJSON());
    assert.doesNotMatch(rendered,/产品 new/);
    assert.match(rendered,/当前没有需要 Admin 发布的产品或修订/);
    assert.ok(env.calls>0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('Admin safe batch handles approved product and revision sequentially without republishing completed records',async()=>{
  const env=setup([mk('p','pending_admin'),mk('published','published')],
    [mk('r','approved_pending_publish')]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<AdminReleaseQueue onQueueChanged={env.onQueueChanged}/>);});
    const select=view!.root.findByProps({'aria-label':'全选本页待发布产品'});
    await act(async()=>select.props.onChange({target:{checked:true}}));
    assert.ok(findButton(view!,'发布本页选中的 2 项'));
    await act(async()=>findButton(view!,'发布本页选中的 2 项')!.props.onClick());
    assert.deepEqual(env.requests.filter(x=>x.startsWith('POST')),[
      'POST admin/reviews/p/approve','POST admin/reviews/p/publish',
      'POST admin/revisions/r/publish'
    ]);
    assert.equal(view!.root.findAllByProps({'aria-label':'选择发布 产品 published'}).length,0);
    assert.match(JSON.stringify(view!.toJSON()),/当前没有需要 Admin 发布的产品或修订/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('Admin return requires a reason; optional difference view does not block publishing',async()=>{
  const env=setup([mk('return','pending_admin')],[]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<AdminReleaseQueue/>);});
    assert.equal(view!.root.findAllByType('pre').length,0);
    await act(async()=>findButton(view!,'查看差异')!.props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/walnut/);
    assert.match(JSON.stringify(view!.toJSON()),/修改前/);
    await act(async()=>findButton(view!,'退回主管')!.props.onClick());
    const confirm=findButton(view!,'确认退回主管')!;
    assert.equal(confirm.props.disabled,true);
    const reason=view!.root.findByProps({'aria-label':'退回主管原因'});
    await act(async()=>reason.props.onChange({target:{value:'请核对木种和图片信息'}}));
    await act(async()=>findButton(view!,'确认退回主管')!.props.onClick());
    assert.ok(env.requests.includes('POST admin/reviews/return/return'));
    assert.match(JSON.stringify(view!.toJSON()),/当前没有需要 Admin 发布的产品或修订/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    env.restore();
  }
});

test('Admin pagination renders at most 50 mixed requests and only publishes the selected visible page',async()=>{
  const env=setup(Array.from({length:60},(_,i)=>mk('p'+i,'pending_admin')),
    Array.from({length:60},(_,i)=>mk('r'+i,'approved_pending_publish')));
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<AdminReleaseQueue/>);});
    assert.equal(view!.root.findAllByType('article').length,50);
    assert.match(JSON.stringify(view!.toJSON()),/匹配 120 项/);
    await act(async()=>view!.root.findByProps({'aria-label':'全选本页待发布产品'}).props.onChange({target:{checked:true}}));
    assert.ok(findButton(view!,'发布本页选中的 50 项'));
    await act(async()=>findButton(view!,'下一页')!.props.onClick());
    assert.equal(findButton(view!,'发布本页选中的 0 项')!.props.disabled,true,'page change clears hidden selections');
    assert.equal(view!.root.findAllByType('article').length,50);
    assert.equal(view!.root.findAllByProps({'aria-label':'选择发布 产品 p0'}).length,0);
    await act(async()=>view!.root.findByProps({'aria-label':'发布待办类型'}).props.onChange({target:{value:'revision'}}));
    assert.match(JSON.stringify(view!.toJSON()),/匹配 60 项/);
    assert.match(JSON.stringify(view!.toJSON()),/第 1 页/);
    await act(async()=>view!.root.findByProps({'aria-label':'全选本页待发布产品'}).props.onChange({target:{checked:true}}));
    await act(async()=>findButton(view!,'发布本页选中的 50 项')!.props.onClick());
    const posts=env.requests.filter(x=>x.startsWith('POST'));
    assert.equal(posts.length,50);assert.ok(posts.every(x=>x.startsWith('POST admin/revisions/')));
    assert.match(JSON.stringify(view!.toJSON()),/匹配 10 项/);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('Admin searches complete queue, resets selection on filters and only lists supervisors in supervisor filter',async()=>{
  const env=setup([mk('one','pending_admin'),mk('two','pending_admin')],[]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<AdminReleaseQueue/>);});
    const leads=view!.root.findByProps({'aria-label':'发布待办主管'});
    assert.equal(leads.findAllByType('option').length,2,'all plus the supervisor, not employee accounts');
    await act(async()=>view!.root.findByProps({'aria-label':'全选本页待发布产品'}).props.onChange({target:{checked:true}}));
    await act(async()=>view!.root.findByProps({'aria-label':'搜索发布待办'}).props.onChange({target:{value:'PZ-two'}}));
    await act(async()=>view!.root.findByProps({'aria-label':'筛选发布待办'}).props.onSubmit({preventDefault(){}}));
    assert.match(JSON.stringify(view!.toJSON()),/匹配 1 项/);
    assert.equal(view!.root.findAllByType('article').length,1);
    assert.equal(findButton(view!,'发布本页选中的 0 项')!.props.disabled,true);
    assert.ok(env.requests.some(x=>x.includes('q=PZ-two')));
    assert.equal(env.requests.filter(x=>x.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('Admin refuses legacy unversioned counts rather than claiming the queue is empty',async()=>{
  const env=setup([],[]);
  let view:ReturnType<typeof create>|undefined;
  const mock=globalThis.fetch;
  try{
    globalThis.fetch=(async(input:any,init?:RequestInit)=>String(input).includes('admin/release-queue')
      ?Response.json({items:[]}):mock(input,init)) as typeof fetch;
    await act(async()=>{view=create(<AdminReleaseQueue/>);});
    const rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/当前列表服务需要更新/);
    assert.match(rendered,/数量未同步/);
    assert.doesNotMatch(rendered,/当前没有需要 Admin 发布/);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

