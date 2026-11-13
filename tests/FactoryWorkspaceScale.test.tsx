import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import FactoryWorkspace from '../pages/CreatorPortal/FactoryWorkspace';
import ProductForm from '../pages/CreatorPortal/components/ProductForm';

function setup(failSubmit=false){
  const old={fetch:globalThis.fetch,storage:(globalThis as any).sessionStorage,
    window:(globalThis as any).window,document:(globalThis as any).document,alert:(globalThis as any).alert};
  (globalThis as any).sessionStorage={getItem:()=>null};
  (globalThis as any).alert=()=>{};
  (globalThis as any).window={addEventListener(){},removeEventListener(){},confirm:()=>true};
  (globalThis as any).document={visibilityState:'visible'};
  const rows=Array.from({length:10005},(_,i)=>({id:'p'+i,name:'Table '+i,name_cn:'餐桌 '+i,
    code:'PZ-'+String(i).padStart(5,'0'),category:'tables',status:'draft',
    images:['https://cdn.example/table.jpg'],production_sites:['zhaoqing'],material:'oak'}));
  const requests:{path:string;method:string;body?:any}[]=[];
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const url=new URL(String(input),'https://local.example');
    const method=init?.method||'GET';const body=init?.body?JSON.parse(String(init.body)):undefined;
    requests.push({path:url.pathname+url.search,method,body});
    if(url.pathname==='/api/factory/dashboard/home')return Response.json({role:'FACTORY',
      updated_at:'2026-11-12T20:00:00Z',drafts:rows.length,returned:0,
      oldest_returned_at:null,in_review:0,stale_drafts:0,stale_items:[]});
    if(url.pathname==='/api/site-config')return Response.json({categories:[{id:'tables',title:'Tables',title_cn:'餐桌',subCategories:[]}]});
    if(url.pathname==='/api/factory/revisions')return Response.json({error:'disabled'},{status:404});
    if(url.pathname==='/api/factory/products'&&method==='GET'){
      const params=url.searchParams;assert.equal(params.get('list_version'),'1');
      let items=rows.filter(row=>{
        const q=(params.get('q')||'').toLowerCase();
        const state=params.get('status')||'all';
        return (!q||[row.name,row.code,row.name_cn].some(text=>text.toLowerCase().includes(q)))&&
          (state==='all'||state==='action'?state==='all'||['draft','returned_to_uploader','rejected'].includes(row.status):row.status===state);
      });
      if(params.has('categories')){const categories=JSON.parse(params.get('categories')!);items=items.filter(row=>categories.includes(row.category));}
      const page=Number(params.get('page')||1),size=Number(params.get('page_size')||50),total=items.length;
      const counts=new Map<string,number>();for(const row of rows)counts.set(row.status,(counts.get(row.status)||0)+1);
      return Response.json({list_version:1,items:items.slice((page-1)*size,page*size),total,page,page_size:size,has_more:page*size<total,
        status_counts:[...counts].map(([status,count])=>({status,count})),category_counts:[{category:'tables',count:rows.length}]});
    }
    if(url.pathname==='/api/factory/products'&&method==='POST'){
      const row={...body,id:'created-'+rows.length};rows.unshift(row);return Response.json({success:true,id:row.id});
    }
    if(/\/factory\/products\/[^/]+\/submit$/.test(url.pathname)&&method==='POST'){
      if(failSubmit)return Response.json({error:'Submission outcome unavailable'},{status:503});
      const id=url.pathname.split('/').at(-2)!;rows.find(row=>row.id===id)!.status='pending_supervisor';
      return Response.json({success:true,status:'pending_supervisor'});
    }
    throw Error('Unexpected '+method+' '+url);
  }) as typeof fetch;
  return {requests,rows,restore(){
    globalThis.fetch=old.fetch;
    for(const [key,value] of [['sessionStorage',old.storage],['window',old.window],['document',old.document],['alert',old.alert]]){
      if(value===undefined)delete (globalThis as any)[key as string];else (globalThis as any)[key as string]=value;
    }
  }};
}
const openInventory=async(view:ReturnType<typeof create>)=>{
  const nav=view.root.findAllByType('button').find(button=>button.findAllByType('span').some(
    span=>span.children.some(child=>child==='工厂产品管理')));
  assert.ok(nav,'product queue must remain reachable from role home');
  await act(async()=>nav!.props.onClick());
};

const product={name:'New Oak Table',name_cn:'新餐桌',code:'PZ-NEW-ONE',category:'tables',
  images:['https://cdn.example/new.jpg'],image:'',production_sites:['zhaoqing'],material:'oak',status:'draft'};

test('factory complete SKU search finds a record beyond 500 while rendering at most one page',async t=>{
  t.mock.timers.enable({apis:['setInterval','setTimeout']});
  const env=setup();let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter><FactoryWorkspace/></MemoryRouter>);});
    await openInventory(view!);
    assert.match(JSON.stringify(view!.toJSON()),/匹配 10005 件/);
    assert.equal(view!.root.findAllByProps({'aria-label':'选择产品提交审核'}).length,50);
    await act(async()=>view!.root.findByProps({'aria-label':'搜索全部我的产品'}).props.onChange({target:{value:'PZ-10004'}}));
    await act(async()=>view!.root.findByProps({'aria-label':'筛选我的产品'}).props.onSubmit({preventDefault(){}}));
    assert.match(JSON.stringify(view!.toJSON()),/匹配 1 件/);
    assert.match(JSON.stringify(view!.toJSON()),/PZ-10004/);
    assert.equal(view!.root.findAllByProps({'aria-label':'选择产品提交审核'}).length,1);
    assert.ok(env.requests.every(request=>!request.path.includes('limit=500')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('factory saves once before submission and continuous entry clears identity but preserves common material',async t=>{
  t.mock.timers.enable({apis:['setInterval','setTimeout']});
  const env=setup();let view:ReturnType<typeof create>|undefined;
  const button=(label:string)=>view!.root.findAllByType('button').find(x=>x.children.join('')===label)!;
  try{
    await act(async()=>{view=create(<MemoryRouter><FactoryWorkspace/></MemoryRouter>);});
    await openInventory(view!);
    await act(async()=>button('+ 新建产品').props.onClick());
    await act(async()=>view!.root.findByType(ProductForm).props.onSaveNext(product));
    const next=view!.root.findByType(ProductForm).props.initialData;
    assert.equal(next.id,undefined);assert.equal(next.code,'');assert.deepEqual(next.images,[]);assert.equal(next.material,'oak');
    await act(async()=>view!.root.findByType(ProductForm).props.onSaveAndSubmit({...product,code:'PZ-NEW-TWO'}));
    const writes=env.requests.filter(request=>request.method==='POST');
    assert.equal(writes.length,3);
    assert.equal(writes[0].path,'/api/factory/products');assert.equal(writes[1].path,'/api/factory/products');
    assert.match(writes[2].path,/\/submit$/);
    assert.equal(env.rows.filter(row=>row.code==='PZ-NEW-TWO').length,1);
    assert.equal(env.rows.find(row=>row.code==='PZ-NEW-TWO')!.status,'pending_supervisor');
    assert.equal(view!.root.findAllByType(ProductForm).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('saved draft survives a failed submission without a second create',async t=>{
  t.mock.timers.enable({apis:['setInterval','setTimeout']});
  const env=setup(true);let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter><FactoryWorkspace/></MemoryRouter>);});
    await openInventory(view!);
    const createButton=view!.root.findAllByType('button').find(x=>x.children.join('')==='+ 新建产品')!;
    await act(async()=>createButton.props.onClick());
    await act(async()=>{await assert.rejects(view!.root.findByType(ProductForm).props.onSaveAndSubmit(product),/草稿已保存/);});
    assert.equal(env.requests.filter(request=>request.method==='POST'&&request.path==='/api/factory/products').length,1);
    assert.equal(env.rows.filter(row=>row.code==='PZ-NEW-ONE').length,1);
    assert.equal(env.rows.find(row=>row.code==='PZ-NEW-ONE')!.status,'draft');
    assert.equal(view!.root.findAllByType(ProductForm).length,0);
    assert.match(JSON.stringify(view!.toJSON()),/PZ-NEW-ONE/);
    assert.match(JSON.stringify(view!.toJSON()),/草稿已保存/,'the saved-draft message survives editor unmount and list refresh');
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
