import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SITE_IMAGE_PATHS, getSiteImageChanges, siteImagesMatch, mergeSiteMediaDraft
} from '../utils/siteMediaChanges';

const baseline = {
  home: { hero: { image: 'https://cdn.peng-zhan.com/uploads/old-hero.webp', title: 'Existing' },
    factory: {image: 'https://cdn.peng-zhan.com/uploads/factory.webp'} },
  catalog: {url: 'https://cdn.peng-zhan.com/uploads/old.pdf'},
  categories: [{id: 'butcher-block', title: 'Butcher Block'}]
};

test('media editing only tracks image fields, not website text, PDFs or categories', () => {
  assert.ok(SITE_IMAGE_PATHS.includes('home.hero.image'));
  assert.ok(!SITE_IMAGE_PATHS.includes('home.hero.title'));
  assert.ok(!SITE_IMAGE_PATHS.includes('categories'));
  assert.equal(getSiteImageChanges(baseline, {...baseline, catalog: {url: 'new.pdf'}}).length, 0);
  assert.equal(siteImagesMatch(baseline, {...baseline, home: {...baseline.home, hero: {...baseline.home.hero, title: 'changed'}}}), true);
});

test('merges only changed image references, preserving concurrent category, text, PDF and other image edits', () => {
  const edited = {...baseline, home: {...baseline.home, hero: {...baseline.home.hero, image: 'https://cdn.peng-zhan.com/uploads/new-hero.webp'}}};
  const live = {...baseline,
    home: {...baseline.home, hero: {...baseline.home.hero, title: 'Concurrent Title'},
      factory: {image: 'https://cdn.peng-zhan.com/uploads/new-factory.webp'}},
    catalog: {url: 'https://cdn.peng-zhan.com/uploads/new.pdf'},
    categories: [{id: 'tables', title: 'Tables'}]
  };
  const result = mergeSiteMediaDraft(live, baseline, edited);
  assert.equal(result.home.hero.image, edited.home.hero.image);
  assert.equal(result.home.hero.title, 'Concurrent Title');
  assert.equal(result.home.factory.image, 'https://cdn.peng-zhan.com/uploads/new-factory.webp');
  assert.equal(result.catalog.url, 'https://cdn.peng-zhan.com/uploads/new.pdf');
  assert.deepEqual(result.categories, [{id: 'tables', title: 'Tables'}]);
  assert.equal(live.home.hero.image, baseline.home.hero.image, 'source must not be mutated');
});

test('rejects simultaneous edits of the same image field', () => {
  const edited = {...baseline, home: {...baseline.home, hero: {...baseline.home.hero, image: 'second.webp'}}};
  const live = {...baseline, home: {...baseline.home, hero: {...baseline.home.hero, image: 'other.webp'}}};
  assert.throws(() => mergeSiteMediaDraft(live, baseline, edited), /其他管理员/);
});

test('allows idempotent already-applied image edits, and rejects missing live draft', () => {
  const edited = {...baseline, home: {...baseline.home, hero: {...baseline.home.hero, image: 'new.webp'}}};
  assert.deepEqual(mergeSiteMediaDraft(edited, baseline, edited), edited);
  assert.throws(() => mergeSiteMediaDraft(null, baseline, edited), /草稿读取失败/);
});
