import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { create, act, ReactTestRenderer } from 'react-test-renderer';
import ReviewQueue from '../pages/CreatorPortal/components/ReviewQueue';
import { homepageSiteCategories, publishedSiteCategories } from '../utils/catalogCategories';

test('approved Worker category with title_cn and no subCategories is normalized and shown on homepage', () => {
  const approved = { id: 'design-studio', title: 'Design Studio', title_cn: '设计系列',
    image: 'https://example.com/category.jpg', source: 'proposal', proposal_id: 'req-1' };
  const configured = [
    { id: 'tables', title: 'Tables', image: 'https://example.com/t.jpg' },
    { id: 'cabinetry', title: 'Cabinetry', image: 'https://example.com/c.jpg' },
    { id: 'butcher-block', title: 'Butcher Block', image: 'https://example.com/b.jpg' },
    approved
  ];
  const all = publishedSiteCategories(configured);
  const category = all.find(x => x.id === 'design-studio');
  assert.equal(category?.title_zh, '设计系列');
  assert.deepEqual(category?.subCategories, []);
  assert.equal(category?.image, approved.image);
  assert.ok(homepageSiteCategories(configured).some(x => x.id === 'design-studio'));
  assert.deepEqual(homepageSiteCategories(configured).slice(0, 3).map(x => x.id),
    ['butcher-block', 'tables', 'cabinetry']);
});

test('category proposals are absent until included in the published website configuration', () => {
  const published = [{ id: 'tables', title: 'Tables', image: 'https://example.com/t.jpg' }];
  const awaitingReview = { id: 'req-pending', title: 'Future Series', image: 'https://example.com/p.jpg' };
  assert.ok(!publishedSiteCategories(published).some(x => x.id === awaitingReview.id));
  assert.ok(!homepageSiteCategories(published).some(x => x.id === awaitingReview.id));
});

test('rejecting a new category calls category rejection, never product rejection', async () => {
  let view: ReactTestRenderer | null = null;
  const events: string[] = [];
  const previousWindow = globalThis.window;
  (globalThis as any).window = { confirm: () => true };
  try {
    await act(async () => {
      view = create(<ReviewQueue
        products={[]}
        categoryRequests={[{ id: 'req-1', title: 'New Series', image: '',
          description: 'Test', status: 'awaiting_review', created_at: '', user_id: '' }]}
        onProcessProduct={async (id, action) => { events.push('product:' + action + ':' + id); }}
        onProcessCategory={async (id, action) => { events.push('category:' + action + ':' + id); }}
        reloadQueue={async () => {}} />);
    });
    const findButton = (label: string) => view!.root.findAllByType('button')
      .find(x => (x.children || []).flat(Infinity).join(' ').includes(label));
    await act(async () => { findButton('待审核新品类')!.props.onClick(); });
    await act(async () => { findButton('驳回申请')!.props.onClick(); });
    await act(async () => { findButton('确认驳回')!.props.onClick(); });
    assert.deepEqual(events, ['category:reject:req-1']);
  } finally {
    if (view) act(() => view!.unmount());
    (globalThis as any).window = previousWindow;
  }
});
