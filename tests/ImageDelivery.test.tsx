import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveImage, cdnImageVariant } from '../utils/imageResolver';

test('only the managed CDN receives Cloudflare resizing URLs and queries are preserved', () => {
  const cdn = 'https://cdn.peng-zhan.com/uploads/example.jpg?rev=2';
  assert.equal(cdnImageVariant(cdn, 400), 'https://cdn.peng-zhan.com/cdn-cgi/image/width=400,quality=80,format=auto/uploads/example.jpg?rev=2');
  assert.equal(cdnImageVariant(cdn, 0), cdn);
  assert.equal(cdnImageVariant('https://images.unsplash.com/img?w=1000', 400), 'https://images.unsplash.com/img?w=1000');
  assert.equal(cdnImageVariant('https://cdn.peng-zhan.com/cdn-cgi/image/width=200/a.jpg', 400), 'https://cdn.peng-zhan.com/cdn-cgi/image/width=200/a.jpg');
  assert.equal(resolveImage('data:image/jpeg;base64,AA==', { width: 400 }), 'data:image/jpeg;base64,AA==');
  // Feature flag defaults off until the real CDN transformation endpoint is verified.
  assert.equal(resolveImage(cdn, { width: 400 }), cdn);
});

test('product image uploads are processed without requiring a crop aspect ratio', () => {
  const manager = readFileSync(new URL('../pages/CreatorPortal/components/PZImageManager.tsx', import.meta.url), 'utf8');
  assert.match(manager, /if \(file\.type\.startsWith\('image\/'\)\)/);
  assert.match(manager, /processImage\(file, aspectRatio\)/);
  const processor = readFileSync(new URL('../utils/imageHelpers.ts', import.meta.url), 'utf8');
  assert.match(processor, /aspect\?: number/);
  assert.match(processor, /Math\.max\(dstW, dstH\)/);
});
