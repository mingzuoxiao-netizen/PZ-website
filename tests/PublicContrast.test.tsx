import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const luminance = (hex: string) => {
  const [r, g, b] = (hex.match(/[a-f0-9]{2}/gi) || []).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (foreground: string, background: string) => {
  const high = Math.max(luminance(foreground), luminance(background));
  const low = Math.min(luminance(foreground), luminance(background));
  return (high + 0.05) / (low + 0.05);
};

test('public footer, search input, and small homepage copy meet WCAG AA on their backgrounds', () => {
  assert.ok(ratio('d4d4d8', '30221b') >= 4.5);
  assert.ok(ratio('52525b', 'ffffff') >= 4.5);
  assert.ok(ratio('66594f', 'fcfaf7') >= 4.5);
  const layout = source('components/Layout.tsx');
  assert.match(layout, /placeholder-stone-600/);
  assert.doesNotMatch(layout, /placeholder-stone-100|text-stone-800 block|text-stone-700 uppercase/);
  const home = source('pages/Home.tsx');
  assert.match(home, /break-normal/);
  assert.doesNotMatch(home, /break-words|#807a75|#82786f|#77716a/);
});

test('admin homepage title has a non-blocking long-title warning in both languages', () => {
  const editor = source('pages/CreatorPortal/components/SiteBasicsEditor.tsx');
  assert.match(editor, /values\.title\.length > 80/);
  assert.match(editor, /Long headline:/);
  assert.match(editor, /标题较长/);
});
