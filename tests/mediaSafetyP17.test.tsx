import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) =>
  readFileSync(new URL('../' + path, import.meta.url), 'utf8');

for (const name of [
  'worker-patches/production-worker-category-governance-REVIEW.js',
  'worker-patches/PZ_Staging_Worker_PR15_Security_Candidate.js',
]) {
  test(name + ': factory image removal never deletes R2', () => {
    const source = read(name);
    const start = source.indexOf('const matchRemoveImage = pathname.match');
    const end = source.indexOf('if (pathname === "/admin/accounts"', start);
    assert.ok(start >= 0 && end > start, 'Worker image route should exist');
    const route = source.slice(start, end);
    for (const expected of [
      '(admin|factory)', '"draft", "rejected"',
      'Image reference not found', 'Product was changed',
      'R2 deletion is forbidden here'
    ]) assert.ok(route.includes(expected), expected);
    assert.ok(!route.includes('PRODUCT_IMAGES.delete('));
    assert.ok(source.includes('pathname === "/admin/media/image-usage"'));
    assert.ok(source.includes('safeToDelete: false'));
  });
}

test('UI only removes an existing image after server success and reordering is local', () => {
  const hook = read('hooks/useProductImageActions.ts');
  const remove = hook.slice(hook.indexOf('const removeImage'), hook.indexOf('const reorderImages'));
  assert.ok(remove.indexOf('await adminFetch') < remove.lastIndexOf('setImages(next)'));
  const reorder = hook.slice(hook.indexOf('const reorderImages'), hook.indexOf('const setMainImage'));
  assert.ok(!reorder.includes('adminFetch'));
  const manager = read('pages/CreatorPortal/components/PZImageManager.tsx');
  assert.ok(manager.includes('图片移除未保存'));
});

test('admin image usage tool is strictly read-only', () => {
  const ui = read('pages/CreatorPortal/components/MediaTools.tsx');
  assert.ok(ui.includes('safeToDelete !== false'));
  assert.ok(!ui.includes('admin/delete-image'));
  assert.ok(!ui.includes('Permanently Delete Images'));
  const page = read('pages/CreatorPortal/AdminWorkspace.tsx');
  assert.ok(page.includes('<MediaTools />'));
});

test('audit log stats never purges the log table', () => {
  const worker = read('worker-patches/production-worker-category-governance-REVIEW.js');
  const start = worker.indexOf('async function readStorageStats');
  const end = worker.indexOf('return async function auditFetch', start);
  assert.ok(start >= 0 && end > start);
  const section = worker.slice(start, end);
  assert.ok(section.includes('FROM audit_logs'));
  assert.ok(!section.includes('DELETE FROM audit_logs'));
  assert.ok(!section.includes('DROP TABLE'));
  assert.ok(worker.includes('path === "/admin/audit-storage"'));
  const ui = read('pages/CreatorPortal/components/AuditTimeline.tsx');
  assert.ok(ui.includes('日志存储概况'));
});
