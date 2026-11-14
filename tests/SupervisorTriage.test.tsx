import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {act,create} from 'react-test-renderer';
import TwoStageProductReviews,{reviewCardImages,groupSupervisorReviews,canBatchInitialReview,cardAnomalies}
  from '../pages/CreatorPortal/components/TwoStageProductReviews';
import {supervisorReviewFacts,reviewSizeLabel} from '../pages/CreatorPortal/components/SupervisorReviewSummary';

const photos=['https://example.com/a.jpg','https://example.com/b.jpg',
  'https://example.com/c.jpg','https://example.com/d.jpg'];
const valid={name:'White Oak Butcher Block',name_cn:'白橡木台面',code:'PZ-OAK-120',
  category:'butcher-block',material:'White Oak',finish:'unfinished',
  description:'Solid white oak butcher block.',production_sites:['zhaoqing'],
  images:photos,specifications:{dimensions_cm:{length:180,width:65,thickness:3.8},
    media_roles:{[photos[0]]:'main',[photos[1]]:'lifestyle',
      [photos[2]]:'detail',[photos[3]]:'material'}}};

const prepare=(versions:{version:number;snapshot:Record<string,unknown>}[],status='pending_supervisor')=>{
  const previousFetch=globalThis.fetch,previousStorage=(globalThis as any).sessionStorage;
  const calls:string[]=[];
  (globalThis as any).sessionStorage={getItem:()=>null};
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const url=String(input);calls.push((init?.method||'GET')+' '+url);
    if(url.includes('/supervisor/release-queue?'))return Response.json({list_version:1,total:1,page:1,page_size:50,
      has_more:false,items:[{id:'rq',product_id:'p1',kind:'product',name:valid.name,name_cn:valid.name_cn,
        code:valid.code,category:valid.category,images:JSON.stringify(photos),
        material:valid.material,finish:valid.finish,dimensions_cm:JSON.stringify(valid.specifications.dimensions_cm),
        status,latest_version:versions.at(-1)?.version||1}]});
    if(url.endsWith('/supervisor/reviews/rq'))return Response.json({
      id:'rq',product_id:'p1',kind:'product',name:valid.name,name_cn:valid.name_cn,
      code:valid.code,status,latest_version:versions.at(-1)?.version||1,
      versions:versions.map(item=>({...item,submitted_by:'staff',created_at:'2026-11-13'})),events:[]
    });
    throw Error('Unexpected request '+url);
  }) as typeof fetch;
  return {calls,restore:()=>{
    globalThis.fetch=previousFetch;
    if(previousStorage===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=previousStorage;
  }};
};

const clickReview=async(view:ReturnType<typeof create>)=>{
  await act(async()=>view.root.findByProps({'aria-label':'审核申请列表'}).findAllByType('button')[0].props.onClick());
};

test('supervisor summary reads stored JSON and reuses shared preflight without approving',()=>{
  const facts=supervisorReviewFacts({...valid,images:JSON.stringify(photos),
    production_sites:JSON.stringify(['zhaoqing','cambodia']),
    specifications:JSON.stringify(valid.specifications)});
  assert.equal(facts.category,'butcher-block');
  assert.equal(facts.material,'White Oak');
  assert.equal(facts.size,'180 × 65 × 3.8 cm');
  assert.equal(facts.sites,'肇庆、柬埔寨');
  assert.equal(facts.images.length,4);
  assert.deepEqual(facts.errors,[]);
  assert.deepEqual(facts.warnings,[]);
});

test('review card previews parse queue image JSON without loading product detail',()=>{
  assert.deepEqual(reviewCardImages(JSON.stringify(photos)),photos);
  assert.deepEqual(reviewCardImages(photos),photos);
  assert.deepEqual(reviewCardImages('{broken'),[]);
  assert.deepEqual(reviewCardImages(null),[]);
  assert.deepEqual(reviewCardImages('[null,"",12,"/uploads/a.jpg"]'),['/uploads/a.jpg']);
});

test('explicit series_id groups only matching category and SKU; never infer a series from code prefix',()=>{
  const row=(id:string,series_id?:string,category='tables')=>({id,kind:'product' as const,
    product_id:id,name:id,code:'PZ-SERIES-'+id,category,series_id,status:'pending_supervisor',
    latest_version:1,approved_version:null,submitter_id:'staff',supervisor_id:'lead',department_id:'d1'});
  const rows=[row('one','Marlow'),row('none'),row('two','marlow'),row('chair','Marlow','chairs')];
  const groups=groupSupervisorReviews(rows);
  assert.deepEqual(groups.map(group=>group.items.map(item=>item.id)),[['one','two'],['none'],['chair']]);
  assert.equal(groups[0].grouped,true);
  assert.equal(groups[1].grouped,false);
  assert.equal(canBatchInitialReview(rows[0]),true);
  assert.equal(canBatchInitialReview({...rows[0],latest_version:2}),false);
  assert.equal(canBatchInitialReview({...rows[0],kind:'revision'}),false);
  assert.equal(canBatchInitialReview({...rows[0],status:'returned_to_supervisor'}),false);
  assert.equal(reviewSizeLabel('',JSON.stringify({length:120,width:60,thickness:4})),'120 × 60 × 4 cm');
  assert.deepEqual(cardAnomalies({...rows[0],material:'oak',finish:'PU',size:'120 × 60',images:photos,dimensions_cm:{length:360,width:60,height:75}}),
    ['部分尺寸超过 300 cm，请核对单位']);
});

test('collapsed supervisor card shows submitted material, dimensions, finish and advisory warnings without detail request',async()=>{
  const env=prepare([{version:1,snapshot:valid}]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    // A valid first-submission fixture has its facts visible before clicking.
    const card=view!.root.findByProps({'aria-label':'审核申请列表'}).findByType('article');
    assert.ok(card.findAllByType('dt').some(node=>node.children.includes('材质')));
    assert.ok(card.findAllByType('dt').some(node=>node.children.includes('尺寸')));
    assert.ok(card.findAllByType('dt').some(node=>node.children.includes('表面处理')));
    assert.match(JSON.stringify(view!.toJSON()),/White Oak|180 × 65 × 3\.8 cm|unfinished/);
    assert.equal(env.calls.filter(call=>call.includes('/supervisor/reviews/rq')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('safe batch prechecks every V1 product then confirms, approves separately and retains audit endpoints',async()=>{
  const prevFetch=globalThis.fetch,prevStore=(globalThis as any).sessionStorage,
    prevConfirm=globalThis.confirm;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const approvals:string[]=[],confirmationTexts:string[]=[];
  const rows=['a','b'].map(id=>({id,product_id:id,kind:'product',name:'White Oak '+id,
    name_cn:'橡木 '+id,code:'PZ-OAK-'+id.toUpperCase(),category:'butcher-block',
    material:'White Oak',finish:'Water Based',images:JSON.stringify(photos),
    series_id:'Marlow',dimensions_cm:JSON.stringify({length:180,width:65,thickness:3.8}),
    status:'pending_supervisor',latest_version:1,submitter_id:'staff',supervisor_id:'lead',department_id:'d1'}));
  globalThis.confirm=(message?:string)=>{confirmationTexts.push(String(message));return true;};
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const url=String(input),post=init?.method==='POST';
    if(url.includes('/supervisor/release-queue?')){
      const items=rows.filter(row=>row.status==='pending_supervisor');
      return Response.json({list_version:1,total:items.length,page:1,page_size:50,has_more:false,items});
    }
    const match=url.match(/\/supervisor\/reviews\/([ab])(\/approve)?$/);
    if(match){
      const row=rows.find(item=>item.id===match[1])!;
      if(post){
        assert.equal(JSON.parse(String(init?.body)).expected_version,1);
        assert.equal(JSON.parse(String(init?.body)).batch_initial_review,true);
        approvals.push(row.code);row.status='pending_admin';
        return Response.json({success:true,status:'pending_admin'});
      }
      return Response.json({...row,versions:[{version:1,snapshot:{...valid,code:row.code,
        specifications:{...valid.specifications,series_id:'Marlow'}},submitted_by:'staff',created_at:'2026-11-13'}],events:[]});
    }
    throw Error('unexpected '+url);
  }) as typeof fetch;
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    assert.equal(view!.root.findAllByProps({'aria-label':'产品系列 Marlow'}).length,1,
      JSON.stringify(view!.toJSON()).slice(0,1000));
    const cards=view!.root.findByProps({'aria-label':'审核申请列表'}).findAllByType('article');
    assert.match(JSON.stringify(view!.toJSON()),/White Oak|180 × 65 × 3\.8 cm|Water Based/);
    for(const checkbox of view!.root.findAllByType('input').filter(x=>x.props.type==='checkbox')){
      await act(async()=>checkbox.props.onChange());
    }
    assert.equal(approvals.length,0);
    const button=view!.root.findAllByType('button').find(x=>x.children.join('')==='预检并批量初审')!;
    await act(async()=>button.props.onClick());
    assert.deepEqual(approvals,['PZ-OAK-A','PZ-OAK-B']);
    assert.equal(confirmationTexts.length,1);
    assert.match(confirmationTexts[0],/PZ-OAK-A[\s\S]*PZ-OAK-B/);
    assert.match(JSON.stringify(view!.toJSON()),/批量初审完成：2 条/);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=prevFetch;globalThis.confirm=prevConfirm;
    if(prevStore===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=prevStore;
  }
});

test('one anomalous snapshot blocks the entire batch before confirmation or approval',async()=>{
  const oldFetch=globalThis.fetch,oldConfirm=globalThis.confirm,oldStore=(globalThis as any).sessionStorage;
  (globalThis as any).sessionStorage={getItem:()=>null};
  const rows=['good','bad'].map(id=>({id,kind:'product',product_id:id,
    code:'PZ-OAK-'+id.toUpperCase(),name:'White Oak '+id,category:'butcher-block',
    material:'oak',finish:'matte',size:'180 × 65',series_id:'Marlow',images:photos,
    status:'pending_supervisor',latest_version:1,supervisor_id:'lead',department_id:'d1'}));
  const requests:string[]=[];
  globalThis.confirm=()=>{throw Error('should not ask confirmation after a preflight failure');};
  globalThis.fetch=(async(input:any,init?:RequestInit)=>{
    const url=String(input);requests.push((init?.method||'GET')+' '+url);
    if(url.includes('/supervisor/release-queue?'))return Response.json({
      list_version:1,items:rows,total:2,page:1,page_size:50,has_more:false});
    const row=rows.find(x=>url.endsWith('/supervisor/reviews/'+x.id));
    if(row)return Response.json({...row,versions:[{version:1,
      snapshot:{...valid,code:row.code,specifications:{...valid.specifications,
        ...(row.id==='bad'?{media_roles:{}}:{})}},submitted_by:'staff',created_at:'2026-11-13'}],events:[]});
    throw Error('unexpected request '+url);
  }) as typeof fetch;
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    const select=view!.root.findAllByType('input').filter(node=>node.props.type==='checkbox');
    for(const box of select)await act(async()=>box.props.onChange());
    const approve=view!.root.findAllByType('button').find(node=>node.children.join('')==='预检并批量初审')!;
    await act(async()=>approve.props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/批量预检未通过/);
    assert.equal(requests.filter(x=>x.startsWith('POST')).length,0);
  }finally{
    if(view)await act(async()=>view!.unmount());
    globalThis.fetch=oldFetch;globalThis.confirm=oldConfirm;
    if(oldStore===undefined)delete (globalThis as any).sessionStorage;
    else (globalThis as any).sessionStorage=oldStore;
  }
});

test('new product is compact by default; all fields remain available on demand',async()=>{
  const env=prepare([{version:1,snapshot:valid}]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    assert.equal(view!.root.findByProps({'aria-label':'审核申请列表'}).findAllByType('img').length,1);
    assert.equal(env.calls.filter(call=>call.includes('/supervisor/reviews/rq')).length,0,
      'cover preview comes from paged queue, not one extra detail request per card');
    await clickReview(view!);
    const card=view!.root.findByProps({'aria-label':'审核申请列表'}).findByType('article');
    assert.match(JSON.stringify(card.props.className),/rounded-t/);
    assert.ok(card.findAllByType('button').some(node=>node.props['aria-expanded']===true));
    assert.equal(card.findAllByType('img').length,1,'review card shows the cover before opening detail');
    assert.match(JSON.stringify(view!.toJSON()),/4 张图片|产品分类/);
    const summary=view!.root.findByProps({'aria-label':'主管审核摘要'});
    assert.match(JSON.stringify(view!.toJSON()),/White Oak|180 × 65 × 3\.8 cm|基础字段规则检查未发现问题/);
    assert.ok(view!.root.findByProps({'aria-label':'审核图片预览'}).findAllByType('img').length===4);
    assert.match(JSON.stringify(view!.toJSON()),/完整的中英文描述/);
    assert.doesNotMatch(JSON.stringify(view!.toJSON()),/新品提交资料/);
    assert.equal(view!.root.findAllByProps({'aria-label':'产品字段差异'}).length,0);
    assert.equal(view!.root.findAllByProps({'aria-label':'当前审核操作'}).length,1);
    const expand=view!.root.findAllByType('button').find(node=>node.children.join('')==='查看完整资料');
    assert.ok(expand);
    await act(async()=>expand!.props.onClick());
    assert.match(JSON.stringify(view!.toJSON()),/新品提交资料/);
    assert.ok(view!.root.findAllByType('button').some(node=>node.children.join('')==='收起完整资料'));
    assert.equal(env.calls.filter(call=>call.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('latest resubmission compares with prior version and highlights warning without hiding audit',async()=>{
  const initial={...valid,material:'Rubberwood',finish:'unfinished'};
  const prior={...valid,material:'White Oak',finish:'unfinished'};
  const latest={...valid,finish:'water-based',specifications:{...valid.specifications,
    dimensions_cm:{length:350,width:65,thickness:3.8}}};
  const env=prepare([{version:1,snapshot:initial},{version:2,snapshot:prior},{version:3,snapshot:latest}]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    await clickReview(view!);
    const rendered=JSON.stringify(view!.toJSON());
    assert.match(rendered,/变更前 V2/);
    assert.match(rendered,/辅助预检提示 1 项需人工核对/);
    const comparison=view!.root.findByProps({'aria-label':'初始与提交版本字段比较'});
    assert.equal(comparison.findAllByType('article').length,1,'only changed finish is shown as a public-field card');
    assert.ok(view!.root.findAllByType('summary').some(node=>node.children.join('').includes('所有版本')));
    assert.equal(env.calls.filter(call=>call.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('supervisor cards expand in place and collapse without changing review state',async()=>{
  const env=prepare([{version:1,snapshot:valid}]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR" members={[{id:'staff',username:'PZ03'}]}/>);});
    const list=view!.root.findByProps({'aria-label':'审核申请列表'});
    assert.equal(list.findAllByType('article').length,1);
    assert.equal(view!.root.findAllByProps({'aria-label':'审核详情'})[0].props.className.includes('hidden'),true);
    await clickReview(view!);
    const detail=view!.root.findByProps({'aria-label':'审核详情'});
    assert.equal(detail.props.style.order,1);
    assert.equal(detail.props.className.includes('hidden'),false);
    assert.ok(list.findAllByType('button').some(node=>node.children.join('')==='收起审核详情'));
    await act(async()=>list.findAllByType('button').find(node=>node.children.join('')==='收起审核详情')!.props.onClick());
    assert.equal(view!.root.findByProps({'aria-label':'审核详情'}).props.className.includes('hidden'),true);
    assert.equal(env.calls.filter(call=>call.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('review action shortcut scrolls and focuses without changing a HashRouter route',async()=>{
  const env=prepare([{version:1,snapshot:valid}]);
  const calls:string[]=[];
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>,{
      createNodeMock:(element:any)=>element.props?.id==='supervisor-review-actions'?{
        scrollIntoView:()=>calls.push('scroll'),focus:()=>calls.push('focus')
      }:null
    });});
    await clickReview(view!);
    assert.equal(view!.root.findAllByType('a').some(link=>link.props.href==='#supervisor-review-actions'),false,
      'a hash-only anchor would overwrite #/creator/supervisor and show an empty page');
    const shortcut=view!.root.findAllByType('button').find(node=>node.children.join('')==='前往审核操作 ↓');
    assert.ok(shortcut,'shortcut is a button, not a navigation link');
    await act(async()=>shortcut!.props.onClick());
    assert.deepEqual(calls,['scroll','focus']);
    assert.equal(env.calls.filter(call=>call.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});

test('legacy snapshot with incomplete data is flagged but does not trigger an automatic mutation',async()=>{
  const env=prepare([{version:1,snapshot:{name:'Old Table',code:'PZ-LEGACY'}}]);
  let view:ReturnType<typeof create>|undefined;
  try{
    await act(async()=>{view=create(<TwoStageProductReviews role="SUPERVISOR"/>);});
    await clickReview(view!);
    assert.match(JSON.stringify(view!.toJSON()),/辅助预检发现/);
    assert.ok(view!.root.findAllByType('button').some(node=>node.children.join('')==='初审通过并查看下一条'));
    assert.equal(env.calls.filter(call=>call.startsWith('POST')).length,0);
  }finally{if(view)await act(async()=>view!.unmount());env.restore();}
});
