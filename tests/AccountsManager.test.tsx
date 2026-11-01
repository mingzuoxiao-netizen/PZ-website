import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { create, act } from 'react-test-renderer';
import AccountsManager from '../pages/CreatorPortal/components/AccountsManager';

test('account rename, confirmed delete and server errors work through the actual UI', async () => {
  const savedFetch=globalThis.fetch;
  const savedStorage=(globalThis as any).sessionStorage;
  const requests: {url:string;method:string;body:any}[]=[];
  let username='factory_one';
  let deleted=false;
  let failDelete=true;
  (globalThis as any).sessionStorage={getItem:()=> 'test-token'};
  globalThis.fetch=async (url,config) => {
    const method=config?.method || 'GET';
    requests.push({url:String(url),method,body:config?.body?JSON.parse(String(config.body)):null});
    if (method==='GET') return Response.json({users:deleted?[]:[{id:'factory',username,role:'factory',is_active:1}]});
    if (method==='PUT') {username=JSON.parse(String(config?.body)).username;return Response.json({success:true});}
    if (failDelete) return Response.json({error:'该账号有关联记录，请停用。'},{status:409});
    deleted=true;return Response.json({success:true});
  };
  let view: ReturnType<typeof create> | undefined;
  try {
    await act(async()=> {view=create(<AccountsManager/>);});
    const root=()=>view!.root;
    const clickTitle=async(title:string)=>act(async()=>root().findAllByType('button').find(b=>b.props.title===title)!.props.onClick());
    const submit=async()=>act(async()=>root().findByProps({role:'dialog'}).props.onSubmit({preventDefault(){}}));
    const input=()=>root().findByProps({role:'dialog'}).findByType('input');
    await clickTitle('修改账号名称');
    await act(async()=>input().props.onChange({target:{value:'new_factory'}}));
    await submit();
    assert.ok(requests.some(r=>r.method==='PUT' && r.url==='/api/admin/accounts/factory' && r.body.username==='new_factory'));
    assert.equal(root().findAllByProps({role:'dialog'}).length,0);
    await clickTitle('删除账号');
    assert.equal(root().findByProps({role:'dialog'}).findAllByType('button')[1].props.disabled,true);
    await act(async()=>input().props.onChange({target:{value:'wrong'}}));
    await submit();
    assert.equal(requests.filter(r=>r.method==='DELETE').length,0);
    await act(async()=>input().props.onChange({target:{value:'new_factory'}}));
    await submit();
    assert.match(root().findByProps({role:'alert'}).children.join(''),/关联记录/);
    assert.equal(root().findAllByProps({role:'dialog'}).length,1);
    failDelete=false;
    await submit();
    assert.equal(root().findAllByProps({role:'dialog'}).length,0);
    assert.ok(deleted);
  } finally {
    if(view) await act(async()=>view!.unmount());
    globalThis.fetch=savedFetch;
    if(savedStorage===undefined) delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=savedStorage;
  }
});
