import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ProductGallery from '../components/catalog/ProductGallery';

test('gallery only shows provided approved product images and changes selected image', () => {
  let renderer!: ReactTestRenderer;
  const first = 'https://cdn.peng-zhan.com/uploads/first.webp';
  const second = 'https://cdn.peng-zhan.com/uploads/second.webp';
  act(() => {
    renderer = create(<ProductGallery name="Test table" language="en" images={[first, second]} />);
  });
  const mainImage = () => renderer.root.findAllByType('img')[0];
  assert.equal(mainImage().props.src, first);
  const next = renderer.root.findAllByType('button')
    .find(b => b.props['aria-label'] === 'Next product image');
  assert.ok(next);
  act(() => next.props.onClick());
  assert.equal(mainImage().props.src, second);
  assert.equal(renderer.root.findAllByType('button').filter(b => b.props['aria-pressed'] === true).length, 1);
  act(() => renderer.unmount());
});

test('gallery with a single picture does not show navigation arrows', () => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<ProductGallery name="A table" language="zh" images={['https://cdn.peng-zhan.com/uploads/item.png']} />);
  });
  assert.equal(renderer.root.findAllByType('button').length, 0);
  assert.equal(renderer.root.findAllByType('img').length, 1);
  act(() => renderer.unmount());
});

test('gallery never substitutes an unrelated image when nothing was uploaded', () => {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = create(<ProductGallery name="Missing" language="zh" images={[]} />);
  });
  assert.equal(renderer.root.findAllByType('img').length, 0);
  assert.ok(renderer.root.findAllByProps({role: 'status'}).length > 0);
  act(() => renderer.unmount());
});
