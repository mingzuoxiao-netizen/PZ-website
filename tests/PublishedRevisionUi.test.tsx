import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import {act,create,type ReactTestRenderer} from 'react-test-renderer';
import PublishedRevisionQueue from '../pages/CreatorPortal/components/PublishedRevisionQueue';
import ProductList from '../pages/CreatorPortal/components/ProductList';

const item={
  id:'revision-1',product_id:'published-1',submitter_id:'factory-1',supervisor_id:'lead-1',
  department_id:'dept-1',name:'Oak Table',name_cn:'橡木餐桌',code:'PZ-01',
  status:'draft',latest_version:0,approved_version:null,draft_revision:1
};
const oldProduct={id:'published-1',name:'Oak Table',status:'published',
  category:'tables',code:'PZ-01',images:[],production_sites:['zhaoqing']} as any;
test('revision queue is hidden when Worker feature flag is OFF (404)',async()=>{
  const previousFetch=globalThis.fetch;
  const enabled:boolean[]=[];
  let view:ReactTestRenderer|undefined;
  (globalThis as any).sessionStorage={getItem:()=>null};
  globalThis.fetch=async()=>Response.json({error:'Feature disabled'},{status:404});
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="FACTORY" onEnabledChange={flag=>enabled.push(flag)}/>);});
    assert.equal(view!.toJSON(),null);
    assert.deepEqual(enabled,[false]);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=previousFetch;
    delete (globalThis as any).sessionStorage;
  }
});

test('factory can open a revision and edit only an isolated draft',async()=>{
  const previousFetch=globalThis.fetch;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const calls:string[]=[];
  globalThis.fetch=async(input:any,init:any)=>{
    const url=String(input);calls.push((init?.method||'GET')+' '+url);
    if(url.endsWith('/factory/revisions'))return Response.json({items:[item]});
    if(url.endsWith('/factory/revisions/revision-1')){
      return Response.json({...item,base_snapshot:{name:'Oak Table'},
        draft:{name:'Updated Table',images:[]},versions:[],events:[]});
    }
    return Response.json({error:'Not expected'},{status:404});
  };
  const edit:any[]=[];
  let view:ReactTestRenderer|undefined;
  try{
    await act(async()=>{view=create(<PublishedRevisionQueue role="FACTORY" onEdit={r=>edit.push(r)}/>);});
    assert.ok(view!.root.findAllByType('button').some(x=>x.children.includes('Oak Table')||
      JSON.stringify(x.children).includes('橡木餐桌')));
    const choose=view!.root.findAllByType('button')
      .find(x=>JSON.stringify(x.children).includes('橡木餐桌'))!;
    await act(async()=>{await choose.props.onClick();});
    assert.ok(view!.root.findAllByType('button').some(x=>x.children.includes('编辑草稿')));
    const editButton=view!.root.findAllByType('button').find(x=>x.children.includes('编辑草稿'))!;
    await act(async()=>editButton.props.onClick());
    assert.equal(edit.length,1);
    assert.equal(edit[0].draft.name,'Updated Table');
    assert.equal(calls.some(s=>s.startsWith('PUT ')||s.startsWith('POST ')),false,'opening preview is read-only');
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=previousFetch;
    delete (globalThis as any).sessionStorage;
  }
});

test('published factory products expose revision action only when explicitly enabled',async()=>{
  let view:ReactTestRenderer|undefined;
  const opened:string[]=[];
  const base={items:[oldProduct],categories:[{id:'tables',title:'Tables'}] as any,
    onEdit:()=>{},onCreate:()=>{},onBack:()=>{},userRole:'FACTORY' as const,lang:'zh' as const};
  try{
    await act(async()=>{view=create(<ProductList {...base}/>);});
    assert.equal(view!.root.findAllByType('button').filter(x=>x.children.includes('申请修改')).length,0);
    await act(async()=>view!.update(<ProductList {...base}
      onStartRevision={p=>opened.push(p.id!)}/>));
    const button=view!.root.findAllByType('button').find(x=>x.children.includes('申请修改'))!;
    assert.ok(button);
    await act(async()=>button.props.onClick());
    assert.deepEqual(opened,['published-1']);
  }finally{if(view)await act(async()=>view!.unmount());}
});
