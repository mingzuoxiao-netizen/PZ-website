import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ReviewQueue from '../pages/CreatorPortal/components/ReviewQueue';

test('admin review center keeps one entry and routes products only through two-stage review', () => {
  const source = readFileSync(new URL('../pages/CreatorPortal/AdminWorkspace.tsx', import.meta.url), 'utf8');
  assert.equal((source.match(/label: '审核中心'/g) || []).length, 1);
  assert.doesNotMatch(source, /id: 'product-reviews'/);
  const reviewStart = source.indexOf("{activeTab === 'review' && (");
  const inventoryStart = source.indexOf("{activeTab === 'inventory' && (", reviewStart);
  assert.ok(reviewStart > 0 && inventoryStart > reviewStart);
  const reviewMarkup = source.slice(reviewStart, inventoryStart);
  assert.match(reviewMarkup, /reviewSection === 'products' && <AdminReleaseQueue onQueueChanged={loadReviewQueue}/);
  assert.match(reviewMarkup, /reviewSection === 'new-categories'/);
  assert.match(reviewMarkup, /reviewSection === 'category-changes'/);
  assert.match(reviewMarkup, /<CategoryChangeReview onApproved=\{loadSiteConfig\}/);
  assert.match(reviewMarkup, /categoryOnly/);
  assert.doesNotMatch(reviewMarkup, /admin\/products\//);
  assert.doesNotMatch(reviewMarkup, /autoPublish: action === 'approve'/);
});

test('category-only queue does not expose old single-stage product approval controls', async () => {
  let view: ReturnType<typeof create> | undefined;
  const actions: string[]=[];
  try {
    await act(async()=>{view=create(<ReviewQueue
      categoryOnly
      products={[{id:'p-old',name:'Old Product',image:'',images:[],status:'awaiting_review'}]}
      categoryRequests={[{id:'cat-new',title:'New Furniture Series',image:'',
        status:'pending',created_at:'',user_id:''}]}
      onProcessProduct={async(id,action)=>{actions.push('LEGACY PRODUCT '+id+' '+action);}}
      onProcessCategory={async(id,action)=>{actions.push('CATEGORY '+id+' '+action);}}
      reloadQueue={async()=>{}}
    />);});
    const initial=JSON.stringify(view!.toJSON());
    assert.match(initial,/待终审新品类/);
    assert.match(initial,/New Furniture Series/);
    assert.doesNotMatch(initial,/Old Product/);
    assert.doesNotMatch(initial,/待审核产品/);
    assert.doesNotMatch(initial,/批准产品/);
    const approve=view!.root.findAllByType('button').find(b=>
      b.children.filter((x:unknown):x is string=>typeof x==='string').join(' ').includes('批准并发布分类')
    );
    assert.ok(approve, 'category-only approval button remains available');
    await act(async()=>approve!.props.onClick());
    assert.deepEqual(actions,['CATEGORY cat-new approve']);
  } finally {
    if(view)await act(async()=>view!.unmount());
  }
});


test('admin review tabs show live counts and keep approved unverified category visible for targeted retry',()=>{
  const source=readFileSync(new URL('../pages/CreatorPortal/AdminWorkspace.tsx',import.meta.url),'utf8');
  assert.match(source,/categoryRequests\.length/,'category pending count must come from loaded records');
  assert.match(source,/新增分类申请', actionableCategoryCount/,'new category tab displays pending count');
  assert.match(source,/产品审核与发布', productReviewCount/,'product tab also shows actionable count');
  assert.match(source,/分类修改申请', categoryChangeCount/,'category change tab shows pending count');
  assert.match(source,/已统计 .* 部分队列未完成同步/,'partial data must not be reported as zero');
  assert.match(source,/item\.status==='approved' && item\.published!==true/,'approved records with absent published flag remain visible');
  assert.match(source,/targetedPublishSupported===false/,'legacy Worker mode is surfaced');
  assert.match(source,/categoryQueueError/,'failed category refresh cannot silently appear empty');
  assert.match(source,/categoryQueueLoaded && <ReviewQueue/,'render empty queue only after successful fetch');
  assert.match(source,/action==='approve' && targetedPublishSupported!==true/,'do not approve on a legacy draft-only Worker');
});
