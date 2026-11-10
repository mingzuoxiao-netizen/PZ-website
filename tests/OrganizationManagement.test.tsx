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


test('admin removes department without deleting accounts and can restore the former supervisor assignment',async()=>{
  const originalFetch=globalThis.fetch;
  const originalStorage=(globalThis as any).sessionStorage;
  let departments:any[]=[{id:'old',name:'原产品部',factory_site:'zhaoqing',is_active:1}];
  let members:any[]=[
    {id:'lead',username:'old_lead',role:'factory',is_active:1,job_type:'supervisor',department_id:'old',department_name:'原产品部'},
    {id:'staff',username:'old_staff',role:'factory',is_active:1,job_type:'staff',department_id:'old',department_name:'原产品部',supervisor_id:'lead'},
  ];
  const calls:RequestLog[]=[];
  (globalThis as any).sessionStorage={getItem:()=> 'staging-admin-token'};
  globalThis.fetch=async(url,options)=>{
    const method=options?.method||'GET';
    const address=String(url);
    const body=options?.body?JSON.parse(String(options.body)):null;
    calls.push({url:address,method,body});
    if(method==='GET'&&address==='/api/admin/org/departments')return Response.json({items:departments});
    if(method==='GET'&&address==='/api/admin/org/accounts')return Response.json({users:members});
    if(method==='DELETE'&&address==='/api/admin/org/departments/old'){
      departments=[]; members=members.map(m=>({...m,job_type:null,department_id:null,department_name:null,supervisor_id:null}));
      return Response.json({success:true,unassigned_count:2});
    }
    if(method==='POST'&&address==='/api/admin/org/departments'){
      departments=[{id:'new',name:body.name,factory_site:body.factory_site,is_active:1}];
      return Response.json({success:true,id:'new'},{status:201});
    }
    if(method==='POST'&&address==='/api/admin/org/assignments'){
      members=members.map(m=>m.id!==body.user_id?m:
        {...m,department_id:body.department_id,department_name:'新产品部',
          supervisor_id:body.supervisor_id||null,job_type:body.job_type});
      return Response.json({success:true,id:body.user_id,job_type:body.job_type});
    }
    throw Error('Unexpected API '+method+' '+address);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<OrganizationManagement/>);});
    const root=()=>view!.root;
    const control=(name:string)=>root().findByProps({'aria-label':name});
    await act(async()=>control('删除部门 原产品部').props.onClick());
    assert.equal(root().findByProps({role:'dialog'}).findAllByType('button').at(-1)!.props.disabled,true);
    await act(async()=>control('确认删除部门名称').props.onChange({target:{value:'原产品部'}}));
    await act(async()=>root().findByProps({role:'dialog'}).props.onSubmit({preventDefault(){}}));
    assert.ok(calls.some(c=>c.method==='DELETE'&&c.url.endsWith('/departments/old')));
    assert.equal(members.length,2);
    assert.equal(members.filter(m=>!m.job_type).length,2);
    assert.equal(control('待分配账号岗位').props.value,'staff');
    await act(async()=>control('部门名称').props.onChange({target:{value:'新产品部'}}));
    await act(async()=>root().findAllByType('form')[0].props.onSubmit({preventDefault(){}}));
    await act(async()=>control('待分配目标部门').props.onChange({target:{value:'new'}}));
    await act(async()=>control('待分配账号岗位').props.onChange({target:{value:'supervisor'}}));
    await act(async()=>control('待分配工厂账号').props.onChange({target:{value:'lead'}}));
    const assignForm=root().findAllByType('form').find(form=>form.findAllByProps({'aria-label':'待分配工厂账号'}).length>0)!;
    await act(async()=>assignForm.props.onSubmit({preventDefault(){}}));
    assert.ok(calls.some(c=>c.method==='POST'&&c.url.endsWith('/assignments')&&c.body?.job_type==='supervisor'));
    assert.equal(members.find(m=>m.id==='lead').job_type,'supervisor');
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=originalFetch;
    if(originalStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=originalStorage;
  }
});


test('assignment destination is independent of step two; supervisor options follow selected department',async()=>{
  const savedFetch=globalThis.fetch;
  const savedStorage=(globalThis as any).sessionStorage;
  const assignments:Record<string,unknown>[]=[];
  const depts=[
    {id:'products',name:'肇庆产品部',factory_site:'zhaoqing',is_active:1},
    {id:'sales',name:'肇庆业务部',factory_site:'zhaoqing',is_active:1},
  ];
  let users:any[]=[
    {id:'lead-products',username:'HenryWang',role:'factory',is_active:1,job_type:'supervisor',department_id:'products',department_name:'肇庆产品部'},
    {id:'lead-sales',username:'max',role:'factory',is_active:1,job_type:'supervisor',department_id:'sales',department_name:'肇庆业务部'},
    {id:'unassigned',username:'waiting_staff',role:'factory',is_active:1,job_type:null,department_id:null,department_name:null},
  ];
  (globalThis as any).sessionStorage={getItem:()=> 'staging-admin-token'};
  globalThis.fetch=async(url,config)=>{
    const address=String(url);
    const method=config?.method||'GET';
    if(method==='GET'&&address==='/api/admin/org/departments')return Response.json({items:depts});
    if(method==='GET'&&address==='/api/admin/org/accounts')return Response.json({users});
    if(method==='POST'&&address==='/api/admin/org/assignments'){
      const payload=JSON.parse(String(config?.body));
      assignments.push(payload);
      users=users.map(u=>u.id==='unassigned'?{...u,job_type:payload.job_type,department_id:payload.department_id,
        department_name:'肇庆业务部',supervisor_id:payload.supervisor_id}:u);
      return Response.json({success:true,id:payload.user_id});
    }
    throw new Error('Unexpected '+method+' '+address);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<OrganizationManagement/>);});
    const root=()=>view!.root;
    const input=(name:string)=>root().findByProps({'aria-label':name});
    assert.equal(input('所属部门').props.value,'products');
    assert.equal(input('待分配目标部门').props.value,'');
    await act(async()=>input('待分配目标部门').props.onChange({target:{value:'sales'}}));
    assert.equal(input('所属部门').props.value,'products');
    const supervisors=input('旧账号直属主管').findAllByType('option').map(x=>x.children.join(''));
    assert.ok(supervisors.includes('max'));
    assert.ok(!supervisors.includes('HenryWang'));
    await act(async()=>input('待分配工厂账号').props.onChange({target:{value:'unassigned'}}));
    const assignForm=root().findAllByType('form').find(
      form=>form.findAllByProps({'aria-label':'待分配工厂账号'}).length>0)!;
    await act(async()=>assignForm.props.onSubmit({preventDefault(){}}));
    assert.equal(assignments.length,1);
    assert.equal(assignments[0].department_id,'sales');
    assert.equal(assignments[0].supervisor_id,'lead-sales');
    assert.equal(assignments[0].job_type,'staff');
    assert.equal(input('所属部门').props.value,'products');
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=savedFetch;
    if(savedStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=savedStorage;
  }
});

test('department cards show supervisors first; members render only for the opened department',async()=>{
  const savedFetch=globalThis.fetch;
  const savedStorage=(globalThis as any).sessionStorage;
  const departments=[
    {id:'products',name:'肇庆产品部',factory_site:'zhaoqing',is_active:1},
    {id:'sales',name:'肇庆业务部',factory_site:'zhaoqing',is_active:1},
  ];
  const users=[
    {id:'admin',username:'staging_admin',role:'admin',is_active:1,job_type:null,department_id:null,department_name:null,supervisor_id:null},
    {id:'lead-p',username:'HenryWang',role:'factory',is_active:1,job_type:'supervisor',department_id:'products',department_name:'肇庆产品部',supervisor_id:null},
    {id:'staff-p',username:'mishu',role:'factory',is_active:1,job_type:'secretary',department_id:'products',department_name:'肇庆产品部',supervisor_id:'lead-p'},
    {id:'lead-s',username:'max',role:'factory',is_active:1,job_type:'supervisor',department_id:'sales',department_name:'肇庆业务部',supervisor_id:null},
    {id:'staff-s',username:'PZ03',role:'factory',is_active:1,job_type:'data_entry',department_id:'sales',department_name:'肇庆业务部',supervisor_id:'lead-s'},
  ];
  (globalThis as any).sessionStorage={getItem:()=> 'staging-admin-token'};
  globalThis.fetch=async(url)=>{
    if(String(url)==='/api/admin/org/departments')return Response.json({items:departments});
    if(String(url)==='/api/admin/org/accounts')return Response.json({users});
    throw Error('Unexpected '+url);
  };
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<OrganizationManagement/>);});
    const root=()=>view!.root;
    const card=(name:string)=>root().findByProps({'aria-label':'查看部门成员 '+name});
    assert.equal(root().findAllByType('tbody').length,0);
    assert.equal(card('肇庆产品部').props['aria-expanded'],false);
    assert.equal(card('肇庆业务部').props['aria-expanded'],false);
    assert.match(card('肇庆产品部').findAllByType('span').map(x=>x.children.join('')).join(' '),/HenryWang/);
    assert.match(card('肇庆业务部').findAllByType('span').map(x=>x.children.join('')).join(' '),/max/);
    await act(async()=>card('肇庆产品部').props.onClick());
    assert.equal(card('肇庆产品部').props['aria-expanded'],true);
    let rows=root().findAllByType('tbody')[0].findAllByType('tr');
    assert.equal(rows.length,2);
    assert.match(JSON.stringify(rows.map(x=>x.children)),/mishu/);
    assert.doesNotMatch(JSON.stringify(rows.map(x=>x.children)),/PZ03/);
    await act(async()=>card('肇庆业务部').props.onClick());
    assert.equal(card('肇庆产品部').props['aria-expanded'],false);
    assert.equal(card('肇庆业务部').props['aria-expanded'],true);
    rows=root().findAllByType('tbody')[0].findAllByType('tr');
    assert.equal(rows.length,2);
    assert.match(JSON.stringify(rows.map(x=>x.children)),/PZ03/);
    assert.doesNotMatch(JSON.stringify(rows.map(x=>x.children)),/mishu/);
    await act(async()=>card('肇庆业务部').props.onClick());
    assert.equal(root().findAllByType('tbody').length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=savedFetch;
    if(savedStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=savedStorage;
  }
});
