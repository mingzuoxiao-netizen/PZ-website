import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { act, create, ReactTestRenderer } from 'react-test-renderer';
import BatchCreator from '../pages/CreatorPortal/components/BatchCreator';
import { normalizeProduct } from '../utils/normalizeProduct';

let view: ReactTestRenderer;
let saved: any[];
let uploaded: string[];
let checked: string[][];
let saveImpl: (payload: any) => Promise<void>;
let uploadImpl: (file: File) => Promise<string>;
let checkImpl: (codes: string[]) => Promise<string[]>;
let originalWindow: any;
const text = (node: any): string => typeof node === 'string' ? node : (node.children || []).map(text).join('');
const button = (label: string) => view.root.findAllByType('button').find(node => text(node).includes(label))!;
const fields = () => view.root.findAllByType('fieldset');
const boxes = (index: number) => fields()[index].findAllByType('input');
const toggle = (group: number, site: number) => act(() => boxes(group)[site].props.onChange());
const values = (group: number) => boxes(group).map(node => node.props.checked);
const add = (...names: string[]) => act(() => view.root.findByProps({ type: 'file' }).props.onChange({
  target: { files: names.map(name => new File(['fixture'], name, { type: 'image/png' })) }
}));
const codes = (...codes: string[]) => act(() => {
  const inputs = view.root.findAllByType('input').filter(node => !node.props.type);
  codes.forEach((code, index) => inputs[index * 4 + 1].props.onChange({ target: { value: code } }));
});
const submit = () => act(async () => { await button('Validate & Create Drafts').props.onClick(); });

beforeEach(() => {
  saved = []; uploaded = []; checked = [];
  saveImpl = async payload => { saved.push(structuredClone(payload)); };
  uploadImpl = async file => { uploaded.push(file.name); return 'https://staging.example/' + file.name; };
  checkImpl = async codeList => { checked.push(codeList); return []; };
  originalWindow = globalThis.window;
  (globalThis as any).window = { confirm: () => true };
  act(() => { view = create(<BatchCreator categories={[{ id: 'tables', title: 'Tables' } as any]}
    onCreateDraft={payload => saveImpl(payload)} onUpload={file => uploadImpl(file)}
    onCheckSkuCodes={codeList => checkImpl(codeList)} onCompleted={async () => {}} onCancel={() => {}} />); });
  act(() => view.root.findByType('select').props.onChange({ target: { value: 'tables' } }));
});

afterEach(() => { act(() => view.unmount()); (globalThis as any).window = originalWindow; });

test('independent A/B/C sites persist in individual draft payloads and normalized reloads', async () => {
  toggle(0, 0); add('A.png', 'B.png', 'C.png'); codes('PZ-AA', 'PZ-BB', 'PZ-CC');
  toggle(2, 0); toggle(2, 1); toggle(3, 1);
  assert.deepEqual([values(1), values(2), values(3)], [[true, false], [false, true], [true, true]]);
  await submit();
  assert.deepEqual(saved.map(p => p.production_sites), [['zhaoqing'], ['cambodia'], ['zhaoqing', 'cambodia']]);
  for (const payload of saved) {
    assert.equal(payload.status, 'draft'); assert.equal(payload.is_published, 0);
    assert.deepEqual(normalizeProduct(JSON.parse(JSON.stringify(payload))).production_sites, payload.production_sites);
    assert.deepEqual(normalizeProduct({ ...payload, production_sites: JSON.stringify(payload.production_sites) }).production_sites, payload.production_sites);
  }
  assert.ok(boxes(1).every(input => input.props.disabled));
  await submit(); assert.equal(saved.length, 3);
});

test('changed defaults affect only later additions; valid rows can save with empty default', async () => {
  toggle(0, 0); add('A.png'); codes('PZ-AA');
  toggle(0, 0); toggle(0, 1); add('B.png'); codes('PZ-AA', 'PZ-BB');
  toggle(0, 1);
  assert.deepEqual(values(1), [true, false]); assert.deepEqual(values(2), [false, true]);
  await submit(); assert.deepEqual(saved.map(p => p.production_sites), [['zhaoqing'], ['cambodia']]);
});

test('empty per-product sites block the whole batch before SKU lookup or upload', async () => {
  add('A.png'); codes('PZ-AA'); toggle(0, 0);
  await submit();
  assert.equal(checked.length, 0); assert.equal(uploaded.length, 0); assert.equal(saved.length, 0);
  assert.match(text(view.root.findByProps({ role: 'alert' })), /each product/);
  toggle(1, 0); await submit(); assert.equal(saved.length, 1);
});

test('duplicate and invalid SKUs still block all uploads', async () => {
  toggle(0, 0); add('A.png', 'B.png'); codes('PZ-AA', 'pz-aa'); await submit();
  assert.equal(checked.length, 0); assert.equal(uploaded.length, 0);
  codes('PZ-AA', 'invalid'); await submit(); assert.equal(uploaded.length, 0);
  codes('PZ-AA', 'PZ-BB'); checkImpl = async () => ['pz-bb']; await submit(); assert.equal(uploaded.length, 0);
  checkImpl = async () => { throw new Error('offline'); }; await submit(); assert.equal(uploaded.length, 0);
});

test('partial upload failure preserves independent sites and skips saved rows on retry', async () => {
  toggle(0, 0); add('A.png', 'B.png'); codes('PZ-AA', 'PZ-BB'); toggle(2, 0); toggle(2, 1);
  const normalUpload = uploadImpl;
  uploadImpl = async file => { if (file.name === 'B.png') throw new Error('offline'); return normalUpload(file); };
  await submit(); assert.equal(saved.length, 1); assert.deepEqual(values(2), [false, true]);
  uploadImpl = normalUpload; await submit();
  assert.deepEqual(saved.map(p => p.production_sites), [['zhaoqing'], ['cambodia']]);
  assert.deepEqual(uploaded, ['A.png', 'B.png']);
});

test('SKU conflict retry reuses image and accepts edited sites', async () => {
  toggle(0, 0); add('A.png'); codes('PZ-AA');
  const normalSave = saveImpl;
  saveImpl = async () => { throw new Error('SKU_CONFLICT'); };
  await submit(); assert.equal(uploaded.length, 1); assert.equal(boxes(1)[0].props.disabled, false);
  toggle(1, 1); codes('PZ-NEW'); saveImpl = normalSave; await submit();
  assert.equal(uploaded.length, 1); assert.deepEqual(saved[0].production_sites, ['zhaoqing', 'cambodia']);
});

test('uncertain save locks sites until explicit verification and reuses upload on retry', async () => {
  toggle(0, 1); add('A.png'); codes('PZ-AA'); const normalSave = saveImpl;
  saveImpl = async () => { throw new Error('network timeout'); }; await submit();
  assert.ok(boxes(1).every(input => input.props.disabled));
  await submit(); assert.equal(uploaded.length, 1);
  act(() => button('I checked Registry; retry').props.onClick());
  saveImpl = normalSave; await submit();
  assert.equal(uploaded.length, 1); assert.deepEqual(saved[0].production_sites, ['cambodia']);
});

test('single-product mode keeps shared sites, image order, and required-site validation', async () => {
  act(() => button('One product, many photos').props.onClick()); add('A.png', 'B.png');
  act(() => {
    const inputs = view.root.findAllByType('input').filter(node => !node.props.type);
    inputs[0].props.onChange({ target: { value: 'Table' } });
    inputs[1].props.onChange({ target: { value: 'PZ-ONE' } });
  });
  await submit(); assert.equal(uploaded.length, 0); toggle(0, 1);
  assert.equal(fields().length, 1); await submit();
  assert.equal(saved.length, 1); assert.deepEqual(saved[0].production_sites, ['cambodia']);
  assert.deepEqual(saved[0].images, ['https://staging.example/A.png', 'https://staging.example/B.png']);
});
