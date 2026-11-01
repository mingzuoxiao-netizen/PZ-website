import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) =>
  readFileSync(new URL('../' + path, import.meta.url), 'utf8');

for (const name of [
  'worker-patches/production-worker-category-governance-REVIEW.js',
  'worker-patches/PZ_Staging_Worker_PR15_Security_Candidate.js',
]) {
  test(name + ': factory removal is persisted but R2 deletion stays disabled', () => {
    const source = read(name);
    const start = source.indexOf('const matchRemoveImage = pathname.match');
    const end = source.indexOf('if (pathname === "/admin/accounts"', start);
    assert.ok(start >= 0 && end > start, 'Worker image route should be present');
    const route = source.slice(start, end);
    assert.match(route, /\\/\\(admin\\|factory\\)/);
    assert.match(route, /"draft", "rejected"/);
    assert.match(route, /Image reference not found/);
    assert.match(route, /Product was changed/);
    assert.match(route, /R2 deletion is forbidden here/);
    assert.doesNotMatch(route, /PRODUCT_IMAGES\\.delete\\(/);
    assert.ok(source.includes('pathname === "/admin/media/image-usage"'));
    assert.ok(source.includes('safeToDelete: false'));
  });
}

test('product editor awaits successful server removal and never issues partial reorder PUT', () => {
  const hook = read('hooks/useProductImageActions.ts');
  assert.ok(hook.indexOf('await adminFetch') < hook.indexOf('setImages(next);\n  };'));
  const section = hook.slice(hook.indexOf('const reorderImages'), hook.indexOf('const setMainImage'));
  assert.doesNotMatch(section, /adminFetch/);
  const manager = read('pages/CreatorPortal/components/PZImageManager.tsx');
  assert.match(manager, /图片移除未保存/);
});

test('admin media inspection cannot permanently delete images', () => {
  const ui = read('pages/CreatorPortal/components/MediaTools.tsx');
  assert.match(ui, /safeToDelete !== false/);
  assert.doesNotMatch(ui, /admin\\/delete-image|Permanently Delete Images/);
  const page = read('pages/CreatorPortal/AdminWorkspace.tsx');
  assert.match(page, /<MediaTools \\/>/);
});

test('audit log stats are read-only and log entries are not purged', () => {
  const worker = read('worker-patches/production-worker-category-governance-REVIEW.js');
  const section = worker.slice(worker.indexOf('async function readStorageStats'), worker.indexOf('return async function auditFetch'));
  assert.match(section, /SELECT COUNT\\(\\*\\)/);
  assert.match(section, /FROM audit_logs/);
  assert.doesNotMatch(section, /DELETE FROM audit_logs|DROP TABLE/);
  assert.match(worker, /path === "\/admin\/audit-storage"/);
  const ui = read('pages/CreatorPortal/components/AuditTimeline.tsx');
  assert.match(ui, /日志存储概况/);
});
