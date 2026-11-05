import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import ProductForm from '../pages/CreatorPortal/components/ProductForm';
import PZImageManager from '../pages/CreatorPortal/components/PZImageManager';

const first = 'https://cdn.peng-zhan.com/uploads/first.webp';
const second = 'https://cdn.peng-zhan.com/uploads/second.webp';
const third = 'https://cdn.peng-zhan.com/uploads/third.webp';

const initialData = {
  id: 'product-123',
  name: 'Oak Dining Table',
  code: 'PZ-TABLE-001',
  category: 'tables',
  material: 'White Oak',
  description: 'Original approved description',
  status: 'draft',
  images: [first, second, third],
  production_sites: ['zhaoqing'],
};

const categories = [{id: 'tables', title: 'Dining Tables'}] as any;
const text = (node: any): string => typeof node === 'string'
  ? node : (node.children || []).map(text).join('');

test('image remove, reorder and cover selection remain local until the full product draft is saved', async () => {
  const previousFetch = globalThis.fetch;
  const previousAlert = (globalThis as any).alert;
  const unexpectedRequests: string[] = [];
  (globalThis as any).alert = (message: unknown) => { throw Error('Unexpected alert: ' + String(message)); };
  globalThis.fetch = async (url) => {
    unexpectedRequests.push(String(url));
    throw Error('Unexpected media API call');
  };
  let view: ReactTestRenderer | undefined;
  const saved: any[] = [];
  try {
    await act(async () => {
      view = create(<ProductForm
        initialData={initialData as any}
        categories={categories}
        onSave={async (payload) => { saved.push(structuredClone(payload)); }}
        onCancel={() => {}}
        userRole="FACTORY"
        lang="zh"
      />);
    });
    const media = () => view!.root.findByType(PZImageManager);
    assert.deepEqual(media().props.images, [first, second, third]);

    await act(async () => { await media().props.onDelete(first); });
    assert.deepEqual(media().props.images, [second, third], 'deletion is only a draft edit');

    await act(async () => { media().props.onSetMain(1); });
    assert.deepEqual(media().props.images, [third, second], 'cover selection changes draft order');

    await act(async () => { media().props.onUpdate([second, third]); });
    assert.deepEqual(media().props.images, [second, third], 'reordering changes draft order');

    assert.deepEqual(unexpectedRequests, [], 'no remove-image or partial PUT request');
    assert.equal(saved.length, 0, 'changes are not persisted automatically');

    await act(async () => {
      await view!.root.findByType('form').props.onSubmit({preventDefault() {}});
    });
    assert.equal(saved.length, 1);
    assert.deepEqual(saved[0].images, [second, third]);
    assert.equal(saved[0].description, initialData.description);
    assert.equal(saved[0].material, initialData.material);
    assert.deepEqual(saved[0].production_sites, ['zhaoqing']);
    assert.equal(saved[0].status, 'draft');
    assert.equal(saved[0].is_published, 0);
    assert.deepEqual(unexpectedRequests, [], 'only the ProductForm onSave callback persists changes');
  } finally {
    if (view) await act(async () => view!.unmount());
    globalThis.fetch = previousFetch;
    if (previousAlert === undefined) delete (globalThis as any).alert;
    else (globalThis as any).alert = previousAlert;
  }
});

test('failed full save keeps the image edit unsaved and prevents review submission', async () => {
  const originalAlert = (globalThis as any).alert;
  const alerts: string[] = [];
  (globalThis as any).alert = (message: unknown) => alerts.push(String(message));
  let view: ReactTestRenderer | undefined;
  let saveAttempts = 0;
  const submitted: string[] = [];
  try {
    await act(async () => {
      view = create(<ProductForm
        initialData={initialData as any}
        categories={categories}
        onSave={async () => { saveAttempts++; throw Error('Network unavailable'); }}
        onSubmit={async (id) => { submitted.push(id); }}
        onCancel={() => {}}
        userRole="FACTORY"
        lang="zh"
      />);
    });
    const media = () => view!.root.findByType(PZImageManager);
    await act(async () => { await media().props.onDelete(first); });
    const submitButton = () => view!.root.findAllByType('button')
      .find(button => text(button).includes('提交审核'))!;
    assert.equal(submitButton().props.disabled, true, 'dirty draft blocks review');

    await act(async () => {
      await view!.root.findByType('form').props.onSubmit({preventDefault() {}});
    });
    assert.equal(saveAttempts, 1);
    assert.match(alerts.join(' '), /Network unavailable/);
    assert.deepEqual(media().props.images, [second, third], 'failed save does not discard edits');
    assert.equal(submitButton().props.disabled, true, 'failed save must not unlock review');
    assert.deepEqual(submitted, []);
  } finally {
    if (view) await act(async () => view!.unmount());
    if (originalAlert === undefined) delete (globalThis as any).alert;
    else (globalThis as any).alert = originalAlert;
  }
});
