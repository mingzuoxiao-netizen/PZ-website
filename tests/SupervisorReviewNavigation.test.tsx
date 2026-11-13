import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
import SupervisorWorkspace from '../pages/CreatorPortal/SupervisorWorkspace';

test('supervisors land in role home, then can reach first-review and team accounts', async () => {
  const oldFetch=globalThis.fetch;
  const oldStorage=(globalThis as any).sessionStorage;
  const paths:string[]=[];
  (globalThis as any).sessionStorage={getItem:()=> 'staging-test-session'};
  globalThis.fetch=async(url)=>{
    paths.push(String(url));
    if(String(url).includes('/supervisor/dashboard/home'))return Response.json({
      role:'SUPERVISOR',updated_at:'2026-11-12T20:00:00Z',first_reviews:0,rechecks:0,total_pending:0});
    if(String(url).includes('/supervisor/release-queue'))return Response.json({list_version:1,items:[],total:0,page:1,page_size:50,has_more:false});
    if(String(url).includes('/supervisor/accounts'))return Response.json({users:[]});
    throw Error('Unexpected request '+url);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<MemoryRouter><SupervisorWorkspace/></MemoryRouter>);});
    const root=()=>view!.root;
    const buttons=()=>root().findAllByType('button');
    const nav=(label:string)=>buttons().find(x=>x.findAllByType('span').some(
      span=>span.children.some(child=>typeof child==='string'&&child===label)
    ));
    const heading=()=>root().findAllByType('h2').map(x=>x.children.join(' ')).join(' ');
    assert.match(root().findAllByType('h1').map(x=>x.children.join(' ')).join(' '),/我的待办/);
    await act(async()=>nav('产品初审')!.props.onClick());
    assert.match(heading(),/产品初审队列/);
    assert.ok(paths.some(p=>p.includes('/supervisor/release-queue?')),'review list loads after navigating from home');
    await act(async()=>nav('团队账号管理')!.props.onClick());
    assert.match(root().findAllByType('h1').map(x=>x.children.join(' ')).join(' '),/团队成员管理/);
    assert.ok(buttons().some(b=>b.children.join('')==='前往产品初审'));
    await act(async()=>buttons().find(b=>b.children.join('')==='前往产品初审')!.props.onClick());
    assert.match(heading(),/产品初审队列/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete(globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});

