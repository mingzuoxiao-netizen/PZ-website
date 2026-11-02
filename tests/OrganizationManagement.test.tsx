import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import OrganizationManagement from '../pages/CreatorPortal/components/OrganizationManagement';

type RequestLog = {url:string;method:string;body:Record<string,unknown>|null};

test('department-first setup guides the admin and auto-selects new department and supervisor',async()=>{
  const oldFetch=globalThis.fetch;
  const oldStorage=(globalThis as any).sessionStorage;
  const requests:RequestLog[]=[];
  let departments:any[]=[];
  let members:any[]=[];
  (globalThis as any).sessionStorage={getItem:()=> 'staging-admin-token'};
  globalThis.fetch=async (url,config)=>{
    const method=config?.method||'GET';
    const body=config?.body?JSON.parse(String(config.body)):null;
    requests.push({url:String(url),method,body});
    if(method==='GET'&&String(url)==='/api/admin/org/departments')return Response.json({items:departments});
    if(method==='GET'&&String(url)==='/api/admin/org/accounts')return Response.json({users:members});
    if(method==='POST'&&String(url)==='/api/admin/org/departments'){
      const id='department-1';
      departments=[{id,name:body.name,factory_site:body.factory_site,is_active:1}];
      return Response.json({success:true,id},{status:201});
    }
    if(method==='POST'&&String(url)==='/api/admin/org/accounts'){
      const id='supervisor-1';
      members=[...members,{id,username:body.username,role:'factory',is_active:1,job_type:body.job_type,department_id:body.department_id}];
      return Response.json({success:true,id},{status:201});
    }
    throw Error('Unexpected API '+method+' '+url);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<OrganizationManagement/>);});
    const root=()=>view!.root;
    const form=(n:number)=>root().findAllByType('form')[n];
    const control=(label:string)=>root().findByProps({'aria-label':label});
    assert.match(root().findAllByProps({role:'status'}).map(e=>e.children.join(' ')).join(' '),/先完成第一步/);
    assert.equal(root().findAllByType('fieldset')[0].props.disabled,true);
    assert.equal(control('所属部门').props.value,'');

    await act(async()=>control('部门名称').props.onChange({target:{value:'肇庆产品部'}}));
    await act(async()=>form(0).props.onSubmit({preventDefault(){}}));
    assert.equal(control('所属部门').props.value,'department-1');
    assert.equal(root().findAllByType('fieldset')[0].props.disabled,false);
    assert.equal(control('职位').props.value,'supervisor');
    assert.ok(requests.some(r=>r.url==='/api/admin/org/departments'&&r.method==='POST'));

    await act(async()=>control('新账号名称').props.onChange({target:{value:'team_lead'}}));
    await act(async()=>control('初始密码').props.onChange({target:{value:'strong-staging-1234'}}));
    await act(async()=>form(1).props.onSubmit({preventDefault(){}}));
    assert.equal(control('职位').props.value,'secretary');
    assert.equal(control('直属主管').props.value,'supervisor-1');
    assert.equal(control('新账号名称').props.value,'');
    assert.equal(control('初始密码').props.value,'');
    assert.ok(requests.some(r=>r.url==='/api/admin/org/accounts'&&r.body?.department_id==='department-1'&&r.body?.job_type==='supervisor'));
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});

test('failed department creation keeps input so the user can correct it',async()=>{
  const oldFetch=globalThis.fetch;
  const oldStorage=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=> 'staging-admin-token'};
  globalThis.fetch=async (url,config)=>{
    if(config?.method==='POST')return Response.json({error:'Department already exists'},{status:409});
    return Response.json(String(url).endsWith('departments')?{items:[]}:{users:[]});
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<OrganizationManagement/>);});
    const root=()=>view!.root;
    await act(async()=>root().findByProps({'aria-label':'部门名称'}).props.onChange({target:{value:'Existing Team'}}));
    await act(async()=>root().findAllByType('form')[0].props.onSubmit({preventDefault(){}}));
    assert.equal(root().findByProps({'aria-label':'部门名称'}).props.value,'Existing Team');
    assert.match(root().findByProps({role:'alert'}).children.join(' '),/Department already exists/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }
});
