import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { categoryImageAlt } from '../utils/categoryImageText';
import { DEFAULT_CONFIG } from '../utils/siteConfig';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('category image alt is localized, with the visible category title as fallback', () => {
  const category = { title:'Dining Tables',title_cn:'餐桌',alt_en:'Round oak table with four legs',alt_zh:'圆形橡木餐桌' };
  assert.equal(categoryImageAlt(category,'en'),'Round oak table with four legs');
  assert.equal(categoryImageAlt(category,'zh'),'圆形橡木餐桌');
  assert.equal(categoryImageAlt({...category,alt_en:' ',alt_zh:''},'en'),'Dining Tables');
  assert.equal(categoryImageAlt({...category,alt_en:'',alt_zh:' '},'zh'),'餐桌');
});

test('empty About and capacity image fields use branded nonempty defaults', () => {
  assert.ok(DEFAULT_CONFIG.about.banner);
  assert.ok(DEFAULT_CONFIG.about.gallery.raw);
  assert.ok(DEFAULT_CONFIG.capacity.card_cn);
  assert.ok(DEFAULT_CONFIG.capacity.card_kh);
  assert.ok(DEFAULT_CONFIG.capacity.map_bg);
  assert.match(source('../pages/About.tsx'), /site\.about\?\.banner\?\.trim\(\) \|\| DEFAULT_CONFIG\.about\.banner/);
  assert.match(source('../pages/About.tsx'), /alt=""/);
  assert.doesNotMatch(source('../pages/About.tsx'), /alt="Factory Floor"/);
  assert.match(source('../pages/GlobalCapacity.tsx'), /config\.capacity\?\.card_cn\?\.trim\(\) \|\| DEFAULT_CONFIG\.capacity\.card_cn/);
  assert.match(source('../pages/GlobalCapacity.tsx'), /config\.capacity\?\.map_bg\?\.trim\(\) \|\| DEFAULT_CONFIG\.capacity\.map_bg/);
});

test('category metadata inputs exist in both admin and factory editors', () => {
  const admin = source('../pages/CreatorPortal/components/CategoryManagement.tsx');
  const factory = source('../pages/CreatorPortal/components/FactoryCategoryManagement.tsx');
  for(const field of ['alt_en','alt_zh','caption']) {
    assert.ok(admin.includes(field));
    assert.ok(factory.includes(field));
  }
  assert.match(source('../pages/Portfolio.tsx'), /categoryImageAlt\(cat, language\)/);
  assert.doesNotMatch(source('../pages/Home.tsx'), /manufacturing facility'}/);
});
