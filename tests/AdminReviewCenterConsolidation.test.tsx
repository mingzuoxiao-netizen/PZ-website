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
  assert.match(reviewMarkup, /reviewSection === 'products' && <TwoStageProductReviews role="ADMIN"/);
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
    assert.match(initial,/新品类申请审核/);
    assert.match(initial,/New Furniture Series/);
    assert.doesNotMatch(initial,/Old Product/);
    assert.doesNotMatch(initial,/待审核产品/);
    assert.doesNotMatch(initial,/批准产品/);
    const approve=view!.root.findAllByType('button').find(b=>
      b.children.filter((x:unknown):x is string=>typeof x==='string').join(' ').includes('批准并保存草稿')
    );
    assert.ok(approve, 'category-only approval button remains available');
    await act(async()=>approve!.props.onClick());
    assert.deepEqual(actions,['CATEGORY cat-new approve']);
  } finally {
    if(view)await act(async()=>view!.unmount());
  }
});
