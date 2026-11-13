import test from 'node:test';
import assert from 'node:assert/strict';
import { searchCategoryAlias, productMatchesPublicSearch } from '../utils/publicSearch';
import { filterRegistry } from '../utils/extractProducts';

const products = [
  { name: 'Marlow', name_cn: '马洛', code: 'PZ-TABLE-01', description: 'Oak top',
    description_cn: '木制桌面', category: 'tables', sub_category: 'Dining', material: 'White Oak',
    status: 'published', images: ['https://cdn.peng-zhan.com/1.jpg'], image: '' },
  { name: 'Caven', name_cn: '胡桃木茶几', code: 'PZ-CAB-01', description: 'Media unit',
    category: 'cabinetry', material: 'Walnut', status: 'published', images: ['https://cdn.peng-zhan.com/2.jpg'], image: '' },
] as any[];

test('browser legacy fallback matches same catalog fields and synonyms as Worker', () => {
  for (const q of ['table', 'tables', '餐桌', '桌', 'PZ-TABLE-01', 'oak']) {
    assert.equal(filterRegistry(products, { search: q, onlyPublished: true })[0]?.code, 'PZ-TABLE-01', q);
  }
  assert.equal(filterRegistry(products, { search: '胡桃木茶几' })[0]?.code, 'PZ-CAB-01');
  assert.equal(searchCategoryAlias('餐桌'), 'tables');
  assert.ok(productMatchesPublicSearch(products[0], 'dining'));
  assert.equal(filterRegistry(products, { search: 'irrelevant' }).length, 0);
});
