import test from 'node:test';
import assert from 'node:assert/strict';
import { publishReadinessIssues } from '../utils/publishReadiness';
import { categoriesWithPublishedItems } from '../utils/catalogCategories';

const validProduct = {
  name: 'Solid Oak Dining Table',
  code: 'PZ-TABLE-01',
  category: 'tables',
  images: ['https://cdn.peng-zhan.com/uploads/table.jpg'],
  material: 'White Oak',
  description: 'Solid white oak dining table with matte finish.',
  specifications: { schema_version: 1 as const, dimensions_cm: { length: 180, width: 90, height: 75 } }
};

test('publish readiness permits complete legitimate product records', () => {
  assert.deepEqual(publishReadinessIssues(validProduct), []);
});

test('publish readiness blocks placeholder names, images and incomplete structured dimensions', () => {
  const incomplete = {
    ...validProduct, name: '123', images: [], material: '', description: '',
    specifications: { schema_version: 1 as const, dimensions_cm: { length: 180 } }
  };
  assert.deepEqual(publishReadinessIssues(incomplete), [
    'name', 'images', 'material', 'description', 'dimensions'
  ]);
  for (const name of ['Test', 'Demo Oak Table', 'Sample Chair', '测试产品']) {
    assert.ok(publishReadinessIssues({ ...validProduct, name }).includes('name'), name);
  }
});

test('surface panels require thickness while chairs require height', () => {
  const panel = { ...validProduct, category: 'butcher-block',
    specifications: { schema_version: 1 as const, dimensions_cm: { length: 180, width: 70, thickness: 4 } } };
  assert.deepEqual(publishReadinessIssues(panel), []);
  assert.ok(publishReadinessIssues({ ...panel, specifications: {
    schema_version: 1 as const, dimensions_cm: { length: 180, width: 70 }
  } }).includes('dimensions'));
  const chair = { ...validProduct, category: 'chairs',
    specifications: { schema_version: 1 as const, dimensions_cm: { width: 50, length: 60, height: 90 } } };
  assert.deepEqual(publishReadinessIssues(chair), []);
});

test('catalog categories use published full-scope facets, not current-page counts', () => {
  const categories = [
    { id: 'tables', title: 'Tables' },
    { id: 'chairs', title: 'Chairs' },
    { id: 'cabinets', title: 'Cabinets' }
  ] as any;
  const facets = [{ id: 'tables', count: 25 }, { id: 'chairs', count: 0 }];
  assert.deepEqual(categoriesWithPublishedItems(categories, facets).map(c => c.id), ['tables']);
  assert.deepEqual(categoriesWithPublishedItems(categories, []).map(c => c.id), []);
});
