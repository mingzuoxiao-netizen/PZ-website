import test from 'node:test';
import assert from 'node:assert/strict';
import React,{useState} from 'react';
import {act,create} from 'react-test-renderer';
import {useProductEditCoordination} from '../hooks/useProductEditCoordination';
import PZImageManager from '../pages/CreatorPortal/components/PZImageManager';

const ORIGINAL_TIME='2026-11-12T10:00:00.000Z';
function session(){
  const oldFetch=globalThis.fetch,oldStorage=(globalThis as any).sessionStorage;
  const calls:string[]=[];
  (globalThis as any).sessionStorage={getItem:()=>null};
  globalThis.fetch=(async(input:any,options?:RequestInit)=>{
    const url=new URL(String(input),'https://api.example.test');
    const route=(options?.method||'GET')+' '+url.pathname;
    calls.push(route);
    if(url.pathname.endsWith('/edit-state'))return Response.json({
      product:{id:'p1',status:'draft',name:'Oak Table',code:'PZ-OAK-001',
        updated_at:ORIGINAL_TIME,edit_revision:0,images:[]},
      updated_at:ORIGINAL_TIME,edit_revision:0,last_editor_name:null,
      others:[],checked_at:ORIGINAL_TIME
    });
    if(url.pathname.endsWith('/presence'))return Response.json({success:true,others:[]});
    throw Error('unexpected API request '+route);
  }) as typeof fetch;
  return {calls,restore(){
    globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStorage;
  }};
}
test('draft autosave transitions dirty -> saving -> saved, sends initial CAS token, never submits',async()=>{
  const env=session(),payloads:any[]=[];
  let view:ReturnType<typeof create>|undefined;
  function Harness(){
    const [dirty,setDirty]=useState(true);
    const coord=useProductEditCoordination({
      productId:'p1',status:'draft',initialUpdatedAt:ORIGINAL_TIME,
      initialRevision:0,enabled:true,dirty,busy:false,
      getDraft:()=>({id:'p1',name:'Updated Oak Table',code:'PZ-OAK-001'}),
      saveDraft:async payload=>{
        payloads.push(payload);
        return {success:true,updated_at:'2026-11-12T10:01:00.000Z',edit_revision:1};
      },
      onSaved:(_result,stillDirty)=>setDirty(stillDirty)
    });
    return <div>
      <span>{coord.displayStatus}</span><span>{coord.revision}</span>
      <button type="button" onClick={()=>void coord.autosave()}>auto</button>
    </div>;
  }
  try{
    await act(async()=>{view=create(<Harness/>);});
    assert.match(JSON.stringify(view!.toJSON()),/尚有未保存|未保存/);
    await act(async()=>view!.root.findByType('button').props.onClick());
    assert.equal(payloads.length,1);
    assert.equal(payloads[0].expected_updated_at,ORIGINAL_TIME);
    assert.equal(payloads[0].expected_revision,0);
    assert.match(JSON.stringify(view!.toJSON()),/已自动保存/);
    assert.match(JSON.stringify(view!.toJSON()),/2026-11-12/,{});
    assert.ok(!env.calls.some(x=>x.includes('/submit')));
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('conflict blocks autosave retries without discarding unsaved local form fields',async()=>{
  const env=session();let attempts=0;
  let view:ReturnType<typeof create>|undefined;
  function Harness(){
    const [name,setName]=useState('Local edits preserved');
    const coord=useProductEditCoordination({
      productId:'p1',status:'draft',initialUpdatedAt:ORIGINAL_TIME,
      initialRevision:0,enabled:true,dirty:true,busy:false,
      getDraft:()=>({id:'p1',name}),
      saveDraft:async()=>{
        attempts++;throw Error('已被 员工乙 在 10:04 修改，请比较后再保存');
      },onSaved:()=>{}
    });
    return <div><span>{name}</span><span>{coord.conflict}</span>
      <button type="button" onClick={()=>void coord.autosave()}>auto</button>
      <button type="button" onClick={()=>setName('Second local edit')}>change</button>
    </div>;
  }
  try{
    await act(async()=>{view=create(<Harness/>);});
    await act(async()=>view!.root.findAllByType('button')[0].props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/已被 员工乙/);
    await act(async()=>view!.root.findAllByType('button')[1].props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/Second local edit/);
    await act(async()=>view!.root.findAllByType('button')[0].props.onClick());
    assert.equal(attempts,1,'no second write after conflict until explicit merge');
    assert.ok(env.calls.filter(x=>x.endsWith('/edit-state')).length>=1);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('mobile photo library accepts multiple=4, reports per-file stages, retries only failed image',async()=>{
  const selected=[
    new File(['1'],'front.jpg',{type:'image/jpeg'}),
    new File(['2'],'detail.jpg',{type:'image/jpeg'}),
    new File(['3'],'room.jpg',{type:'image/jpeg'}),
    new File(['4'],'material.jpg',{type:'image/jpeg'})
  ];
  const attempts=new Map<string,number>(),errors:string[]=[];
  let view:ReturnType<typeof create>|undefined;
  function Harness(){
    const [images,setImages]=useState<string[]>([]);
    return <PZImageManager images={images} lang="zh" onUpdate={setImages}
      onError={message=>errors.push(message)}
      onUpload={async file=>{
        const n=(attempts.get(file.name)||0)+1;attempts.set(file.name,n);
        if(file.name==='detail.jpg'&&n===1)throw Error('模拟网络断线');
        return 'https://cdn.peng-zhan.com/'+file.name;
      }}/>;
  }
  try{
    await act(async()=>{view=create(<Harness/>);});
    const input=view!.root.findByType('input');
    assert.equal(input.props.type,'file');
    assert.equal(input.props.accept,'image/*');
    assert.equal(input.props.multiple,true);
    await act(async()=>input.props.onChange({target:{files:selected}}));
    let rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/上传完成/);
    assert.match(rendered,/上传失败/);
    assert.ok(errors.some(x=>x.includes('detail.jpg')));
    assert.equal(view!.root.findAllByType('img').length,3);
    const retry=view!.root.findAllByType('button').find(b=>b.children.join('')==='重试此图');
    assert.ok(retry);
    await act(async()=>retry!.props.onClick({stopPropagation(){}}));
    rendered=JSON.stringify(view!.toJSON());
    assert.equal(view!.root.findAllByType('img').length,4);
    assert.ok(!rendered.includes('上传失败'));
    assert.equal(attempts.get('detail.jpg'),2);
    for(const name of ['front.jpg','room.jpg','material.jpg'])assert.equal(attempts.get(name),1);
  }finally{if(view)await act(async()=>view!.unmount());}
});
