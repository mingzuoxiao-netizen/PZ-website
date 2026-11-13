import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ProductList,{type BulkAction,type BulkResponse} from '../pages/CreatorPortal/components/ProductList';
import {acceptBackofficeDialog} from './backofficeDialogTest';

const product=(id:string,status='draft')=>({
  id,code:'PZ-'+id.toUpperCase(),name:'Solid Oak Table '+id,
  name_cn:'实木餐桌 '+id,status,category:'dining-table',material:'White Oak',
  images:[],production_sites:['zhaoqing']
});
const button=(view:ReturnType<typeof create>,label:string)=>
  view.root.findAllByType('button').find(x=>x.children.filter(
    (n):n is string=>typeof n==='string').join('').includes(label));
function confirmAll(){
  const previous=globalThis.confirm;
  (globalThis as any).confirm=()=>true;
  return ()=>{if(previous)globalThis.confirm=previous;else delete (globalThis as any).confirm;};
}
test('admin bulk selection sends checked products, requires unpublish reason, shows every outcome',async()=>{
  const restore=confirmAll(),calls:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    const items=[product('published1','published'),product('published2','published')];
    await act(async()=>{view=create(<ProductList
      items={items as any} categories={[{id:'dining-table',title:'Dining'}] as any}
      lang="zh" userRole="ADMIN" serverFiltered
      onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      onBulkAction={async(action,ids,category,reason)=>{
        calls.push({action,ids,category,reason});
        return {success:true,requested:2,succeeded:1,failed:1,results:[
          {id:ids[0],code:'PZ-PUBLISHED1',ok:true,status:'completed'},
          {id:ids[1],code:'PZ-PUBLISHED2',ok:false,reason:'抽检待完成，不允许下架'}
        ]};
      }}/>);});
    for(const sku of ['PZ-PUBLISHED1','PZ-PUBLISHED2']){
      const selection=view!.root.findByProps({'aria-label':'选择批量操作 '+sku});
      await act(async()=>selection.props.onClick());
    }
    const unpublish=button(view!,'批量下架')!;
    assert.equal(unpublish.props.disabled,true);
    const reason=view!.root.findByProps({'aria-label':'批量下架原因'});
    await act(async()=>reason.props.onChange({target:{value:'暂停销售，等待内部复核'}}));
    assert.equal(button(view!,'批量下架')!.props.disabled,false);
    await act(async()=>{void button(view!,'批量下架')!.props.onClick();});
    await acceptBackofficeDialog(view!);
    assert.deepEqual(calls,[{action:'unpublish',
      ids:['published1','published2'],category:undefined,reason:'暂停销售，等待内部复核'}]);
    const ui=JSON.stringify(view!.toJSON());
    const summary=view!.root.findAllByType('strong').map(x=>x.children.join(' ')).join(' ');
    assert.match(summary,/成功\s+1\s+件/);assert.match(summary,/失败\s+1\s+件/);
    assert.match(ui,/抽检待完成/);
    assert.ok(!view!.root.findAllByType('button').some(b=>
      /批量审核批准|批量发布/.test(b.children.filter(
        (n):n is string=>typeof n==='string').join(''))));
  }finally{if(view)await act(async()=>view!.unmount());restore();}
});
test('factory bulk submit shows 2 successful items + one preflight failure and keeps failed selected',async()=>{
  const restore=confirmAll(),calls:any[]=[];let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<ProductList items={[
      product('draft1'),product('draft2'),product('draft3')
    ] as any} categories={[]} userRole="FACTORY" lang="zh" serverFiltered
      onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}} onSubmit={async()=>{}}
      onBulkAction={async(action,ids)=>{
        calls.push({action,ids});
        return {success:true,requested:3,succeeded:2,failed:1,results:[
          {id:ids[0],code:'PZ-DRAFT1',ok:true},
          {id:ids[1],code:'PZ-DRAFT2',ok:true},
          {id:ids[2],code:'PZ-DRAFT3',ok:false,reason:'Product preflight failed',
            issues:[{field:'material',message:'请填写主要材质'}]}
        ]} as BulkResponse;
      }}/>);});
    await act(async()=>view!.root.findByProps({'aria-label':'全选本页可提交产品'}).props.onChange({target:{checked:true}}));
    await act(async()=>{void button(view!,'批量提交审核')!.props.onClick();});
    await acceptBackofficeDialog(view!);
    assert.deepEqual(calls,[{action:'submit',ids:['draft1','draft2','draft3']}]);
    const ui=JSON.stringify(view!.toJSON());
    const summary=view!.root.findAllByType('strong').map(x=>x.children.join(' ')).join(' ');
    assert.match(summary,/成功\s+2\s+件/);assert.match(summary,/失败\s+1\s+件/);
    assert.match(ui,/请填写主要材质/);
    assert.ok(view!.root.findAllByType('label').some(x=>x.children.filter(
      (n):n is string=>typeof n==='string').join('').includes('已选 1 件')));
    assert.ok(!view!.root.findAllByType('button').some(b=>
      /批量审核批准|批量发布/.test(b.children.filter(
        (n):n is string=>typeof n==='string').join(''))));
  }finally{if(view)await act(async()=>view!.unmount());restore();}
});
test('product duplication remains an explicit single-item action, never a bulk approval',async()=>{
  let selected='';let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<ProductList items={[product('source','published')] as any}
      categories={[]} userRole="FACTORY" lang="zh" serverFiltered
      onEdit={()=>{}} onCreate={()=>{}} onBack={()=>{}}
      onDuplicate={item=>{selected=item.code;}}/>);});
    await act(async()=>button(view!,'复制为新产品')!.props.onClick());
    assert.equal(selected,'PZ-SOURCE');
  }finally{if(view)await act(async()=>view!.unmount());}
});
