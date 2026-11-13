import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import React from 'react';
import {act,create} from 'react-test-renderer';
import {MemoryRouter} from 'react-router-dom';
import PortalLayout from '../pages/CreatorPortal/PortalLayout';
import ProductList from '../pages/CreatorPortal/components/ProductList';

const read=(path:string)=>readFileSync(new URL(path,import.meta.url),'utf8');
test('admin navigation prioritizes daily tasks while retaining all protected functions',()=>{
  const admin=read('../pages/CreatorPortal/AdminWorkspace.tsx');
  for(const id of ['review','inventory','inquiries','categories','media','basics','organization','accounts','audit'])
    assert.match(admin,new RegExp("id: '"+id+"'"));
  assert.match(admin,/group: '网站内容'/);
  assert.match(admin,/group: '系统管理'/);
  assert.match(admin,/<AdminReleaseQueue onQueueChanged={loadReviewQueue}/);
  assert.match(admin,/<AuditTimeline \/>/);
  assert.match(admin,/admin\/publish\/products/);
});

test('grouped navigation is expandable on desktop and selectable on mobile',async()=>{
  let view:ReturnType<typeof create>|undefined;
  let selected='review';
  const items=[
    {id:'review',label:'审核中心',icon:React.createElement('span',null,'A')},
    {id:'media',label:'网站图片管理',icon:React.createElement('span',null,'B'),group:'网站内容'}
  ];
  try{
    await act(async()=>{view=create(<MemoryRouter><PortalLayout
      role="ADMIN" userName="测试管理员" navItems={items}
      activeTab={selected} onTabChange={id=>{selected=id;}}>
      <p>页面内容</p>
    </PortalLayout></MemoryRouter>);});
    assert.ok(view!.root.findAllByType('details').some(x=>x.props.className.includes('group')));
    const mobile=view!.root.findAllByType('select').find(x=>x.props['aria-label']==='手机端后台功能');
    assert.ok(mobile);
    await act(async()=>mobile!.props.onChange({target:{value:'media'}}));
    assert.equal(selected,'media');
    const labels=JSON.stringify(view!.toJSON());
    assert.match(labels,/审核中心/);
    assert.match(labels,/网站图片管理/);
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('factory enters product catalog directly; new-category and batch actions remain available',()=>{
  const factory=read('../pages/CreatorPortal/FactoryWorkspace.tsx');
  assert.match(factory,/aria-label="筛选产品分类"/);
  assert.match(factory,/onClick=\{\(\)=>setIsRequestingCategory\(true\)\}/);
  assert.match(factory,/onClick=\{\(\)=>setActiveTab\('bulk-import'\)\}/);
  assert.match(factory,/label: 'ZIP 一键导入草稿'/);
  assert.match(factory,/<BulkZipImporter role="FACTORY"/);
  assert.match(factory,/onClick=\{\(\)=>setIsCreating\(true\)\}/);
  assert.doesNotMatch(factory,/<CategoryGrid/);
  assert.match(factory,/<ProductList/);
  assert.match(factory,/<PublishedRevisionQueue role="FACTORY"/);
  assert.match(factory,/<FactoryCategoryManagement/);
});

test('product list searches Chinese names and uses quick filters without hiding record actions',async()=>{
  const items=[
    {id:'p1',name:'Oak table',name_cn:'白橡木餐桌',code:'PZ-001',
      category:'tables',status:'draft',images:[],production_sites:['zhaoqing']},
    {id:'p2',name:'Walnut bench',name_cn:'胡桃木长凳',code:'PZ-002',
      category:'tables',status:'published',images:[],production_sites:['cambodia']}
  ];
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<ProductList items={items as any}
      categories={[]} onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      userRole="FACTORY" lang="zh"/>);});
    const input=view!.root.findByProps({placeholder:'搜索中文名、英文名或 SKU'});
    await act(async()=>input.props.onChange({target:{value:'白橡'}}));
    let text=JSON.stringify(view!.toJSON());
    assert.match(text,/白橡木餐桌/);
    assert.doesNotMatch(text,/胡桃木长凳/);
    await act(async()=>input.props.onChange({target:{value:''}}));
    const published=view!.root.findAllByType('button').find(x=>x.props['aria-pressed']!==undefined &&
      x.children.join('')==='已发布');
    assert.ok(published);
    await act(async()=>published!.props.onClick());
    text=JSON.stringify(view!.toJSON());
    assert.doesNotMatch(text,/白橡木餐桌/);
    assert.match(text,/胡桃木长凳/);
    const expand=view!.root.findAllByType('button').find(x=>x.props['aria-expanded']===false);
    assert.ok(expand);
    await act(async()=>expand!.props.onClick());
    assert.ok(view!.root.findAllByType('select').some(x=>x.props['aria-label']==='生产基地'));
  }finally{if(view)await act(async()=>view!.unmount());}
});

test('required image roles are visible while optional packaging and care remain collapsible',()=>{
  const form=read('../pages/CreatorPortal/components/ProductForm.tsx');
  assert.match(form,/必填：图片用途标签/);
  assert.doesNotMatch(form,/高级选项：图片用途标签/);
  assert.match(form,/补充信息：包装、组装与保养（按需展开）/);
  assert.match(form,/ProductSpecificationsEditor mode="factory"/);
  assert.match(form,/onChange=\{changeSpecs\}/);
  assert.match(form,/onSubmit=\{save\}/);
  assert.match(form,/onClick=\{submitReview\}/);
  assert.match(form,/onCancel/);
});
