import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('HTML source exposes real metadata, crawler fallback and social preview image', () => {
  const html = read('index.html');
  assert.match(html, /Solid Wood &amp; Upholstered Furniture OEM\/ODM Manufacturer/);
  for (const meta of ['name="description"', 'property="og:title"', 'property="og:image"', 'name="twitter:card"', '<noscript>']) {
    assert.ok(html.includes(meta), `${meta} must be in the server-delivered HTML`);
  }
  assert.match(html, /photo-1622372738946-62e02505feb3/);
  assert.match(html, /cdn\.tailwindcss\.com/);
  assert.match(html, /type="importmap"/);
});

test('public routes have bilingual titles and a discoverable sitemap', () => {
  const app = read('App.tsx');
  for (const route of ['collections', 'capabilities', 'manufacturing', 'capacity', 'materials', 'about', 'inquire']) {
    assert.ok(app.includes(`'/${route}':`), `${route} title should exist`);
    assert.ok(read('public/sitemap.xml').includes(`/#/${route}`), `${route} in sitemap`);
  }
  assert.match(app, /document\.title = item/);
  assert.match(read('public/robots.txt'), /Sitemap: https:\/\/www\.peng-zhan\.com\/sitemap\.xml/);
});
