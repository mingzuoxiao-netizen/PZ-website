import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProduct } from '../utils/normalizeProduct';

test('two-stage review statuses remain visible instead of becoming draft', () => {
  const statuses = [
    'pending_supervisor','pending_admin','returned_to_supervisor',
    'returned_to_uploader','approved_pending_publish'
  ];
  for (const status of statuses) {
    const product = normalizeProduct({
      id: 'p1', name: 'Oak Counter', code: 'PZ-OAK-01',
      category: 'countertops', status, images: ['test.jpg']
    });
    assert.equal(product.status, status);
  }
});

test('legacy product statuses retain their previous interpretation', () => {
  assert.equal(normalizeProduct({status:'awaiting_review',name:'Old'}).status,'awaiting_review');
  assert.equal(normalizeProduct({status:'rejected',name:'Old'}).status,'rejected');
  assert.equal(normalizeProduct({status:'published',name:'Old'}).status,'published');
  assert.equal(normalizeProduct({status:'draft',name:'Old'}).status,'draft');
});
