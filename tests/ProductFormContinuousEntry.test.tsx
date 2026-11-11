import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import ProductForm from '../pages/CreatorPortal/components/ProductForm';

test('form save intents call one matching workflow and reset before the next ordinary save',async()=>{
  const old=(globalThis as any).alert;(globalThis as any).alert=(message:any)=>{throw Error(message);};
  let view:ReturnType<typeof create>|undefined;const calls:string[]=[];
  try{
    await act(async()=>{view=create(<ProductForm initialData={{name:'Oak Table',category:'tables',code:'PZ-OK',images:['oak0.jpg','oak1.jpg','oak2.jpg','oak3.jpg'],material:'White Oak',description:'Oak dining table',specifications:{schema_version:1,dimensions_cm:{length:180,width:90,height:75},media_roles:{'oak0.jpg':'main','oak1.jpg':'lifestyle','oak2.jpg':'detail','oak3.jpg':'material'}}}}
      categories={[{id:'tables',title:'Tables'}] as any} onSave={async()=>{calls.push('draft');}}
      onSaveAndSubmit={async()=>{calls.push('submit');}} onSaveNext={async()=>{calls.push('next');}}
      onCancel={()=>{}} userRole="FACTORY" lang="zh"/>);});
    const button=(name:string)=>view!.root.findAllByType('button').find(x=>x.children.join('')===name)!;
    await act(async()=>{button('保存并提交审核').props.onClick();await view!.root.findByType('form').props.onSubmit({preventDefault(){}});});
    await act(async()=>{button('保存并新建下一款').props.onClick();await view!.root.findByType('form').props.onSubmit({preventDefault(){}});});
    await act(async()=>{await view!.root.findByType('form').props.onSubmit({preventDefault(){}});});
    assert.deepEqual(calls,['submit','next','draft']);
  }finally{if(view)await act(async()=>view!.unmount());if(old===undefined)delete (globalThis as any).alert;else (globalThis as any).alert=old;}
});

test('form reports unsaved changes and installs unload protection only while dirty',async()=>{
  const oldWindow=(globalThis as any).window,oldAlert=(globalThis as any).alert;
  const listeners=new Map<string,Function>();const states:boolean[]=[];
  (globalThis as any).window={addEventListener:(name:string,fn:Function)=>listeners.set(name,fn),removeEventListener:(name:string)=>listeners.delete(name)};
  (globalThis as any).alert=()=>{};let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<ProductForm initialData={{name:'Oak',code:'PZ-OK',category:'tables',images:[]}}
      categories={[{id:'tables',title:'Tables'}] as any} onSave={async()=>{}} onCancel={()=>{}}
      onDirtyChange={dirty=>states.push(dirty)} userRole="FACTORY" lang="zh"/>);});
    assert.equal(listeners.has('beforeunload'),false);
    const name=view!.root.findAllByType('input').find(x=>x.props.value==='Oak')!;
    await act(async()=>name.props.onChange({target:{value:'Changed Oak'}}));
    assert.equal(states.at(-1),true);assert.equal(listeners.has('beforeunload'),true);
    let prevented=false;const event={preventDefault(){prevented=true;},returnValue:undefined};listeners.get('beforeunload')!(event);
    assert.equal(prevented,true);
    await act(async()=>view!.root.findByType('form').props.onSubmit({preventDefault(){}}));
    assert.equal(states.at(-1),false);assert.equal(listeners.has('beforeunload'),false);
  }finally{
    if(view)await act(async()=>view!.unmount());
    if(oldWindow===undefined)delete (globalThis as any).window;else (globalThis as any).window=oldWindow;
    if(oldAlert===undefined)delete (globalThis as any).alert;else (globalThis as any).alert=oldAlert;
  }
});
