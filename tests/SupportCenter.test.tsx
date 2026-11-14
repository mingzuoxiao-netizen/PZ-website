import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { MemoryRouter } from 'react-router-dom';
import PortalLayout from '../pages/CreatorPortal/PortalLayout';
import SupportCenter from '../pages/CreatorPortal/components/SupportCenter';
import { searchSupportTopics, supportSections, supportTopics, type SupportRole } from '../pages/CreatorPortal/supportContent';

test('every support topic is in a valid role-specific module and has numbered steps', () => {
  const ids = new Set<string>();
  const destinations: Record<SupportRole, string[]> = {
    FACTORY: ['inventory', 'categories', 'bulk-import'],
    SUPERVISOR: ['team', 'reviews', 'categories'],
    ADMIN: ['review', 'inventory', 'bulk-import', 'inquiries', 'categories', 'media', 'basics', 'accounts', 'organization', 'audit'],
  };
  for (const topic of supportTopics) {
    assert.equal(ids.has(topic.id), false, topic.id);
    ids.add(topic.id);
    assert.ok(supportSections[topic.role].some(section => section.id === topic.section), topic.id);
    assert.ok(topic.steps.length >= 2, topic.id);
    assert.ok(topic.steps.every(step => step.trim().length > 0), topic.id);
    if (topic.destination) assert.ok(destinations[topic.role].includes(topic.destination), topic.id);
  }
  assert.ok(supportTopics.length >= 30);
});

test('natural-language search finds ZIP upload, SKU image matching, approvals and deletion', () => {
  assert.equal(searchSupportTopics('FACTORY', 'ZIP文件如何上传')[0]?.id, 'factory-zip-upload');
  assert.ok(searchSupportTopics('FACTORY', '图片没有匹配SKU').some(item => item.id === 'factory-zip-images'));
  assert.ok(searchSupportTopics('FACTORY', 'Excel模板').some(item => item.id === 'factory-zip-template'));
  assert.ok(searchSupportTopics('SUPERVISOR', '安全批量初审').some(item => item.id === 'supervisor-batch'));
  assert.ok(searchSupportTopics('ADMIN', '永久删除SKU').some(item => item.id === 'admin-product-delete'));
});

test('role and module filtering do not leak other backoffice instructions', () => {
  for (const role of ['FACTORY', 'SUPERVISOR', 'ADMIN'] as SupportRole[]) {
    assert.ok(searchSupportTopics(role).every(topic => topic.role === role));
    for (const section of supportSections[role]) {
      assert.ok(searchSupportTopics(role, '', section.id).every(topic => topic.section === section.id));
    }
  }
  assert.equal(searchSupportTopics('SUPERVISOR', 'ZIP文件如何上传').length, 0);
  assert.equal(searchSupportTopics('FACTORY', '管理员终审').length, 0);
});

test('support UI filters articles, expands steps and navigates to the current role function', async () => {
  let destination = '';
  let view: ReturnType<typeof create> | undefined;
  try {
    await act(async () => { view = create(<SupportCenter role="FACTORY" onNavigate={tab => { destination = tab; }} />); });
    assert.match(JSON.stringify(view!.toJSON()), /支持中心/);
    const search = view!.root.findByProps({ id: 'pz-support-search' });
    await act(async () => { search.props.onChange({ target: { value: 'ZIP文件如何上传' } }); });
    const articles = view!.root.findAllByType('article');
    assert.ok(articles.length >= 1);
    assert.match(JSON.stringify(view!.toJSON()), /产品资料\.xlsx/);
    const navigate = view!.root.findAllByType('button').find(button => button.children.some(child => child === '打开 ZIP 一键导入'));
    assert.ok(navigate);
    await act(async () => { navigate!.props.onClick(); });
    assert.equal(destination, 'bulk-import');
    const module = view!.root.findByProps({ 'aria-label': '支持中心模块' }).findAllByType('button')
      .find(button => button.findAllByType('span').some(span => span.children.includes('提交审核与退回修改')));
    assert.ok(module);
    await act(async () => { module!.props.onClick(); });
    assert.equal(view!.root.findAllByType('article').length, 0);
    const reset = view!.root.findAllByType('button').find(button => button.children.includes('查看全部指南'));
    assert.ok(reset);
    await act(async () => { reset!.props.onClick(); });
    assert.ok(view!.root.findAllByType('article').length > 5);
  } finally { if (view) await act(async () => { view!.unmount(); }); }
});

test('support renders through the shared portal shell and does not show workspace children', async () => {
  let view: ReturnType<typeof create> | undefined;
  try {
    await act(async () => {
      view = create(<MemoryRouter><PortalLayout role="SUPERVISOR" userName="测试主管"
        navItems={[{ id: 'reviews', label: '产品初审', icon: <span /> }, { id: 'support', label: '支持 / Support', icon: <span /> }]}
        activeTab="support" onTabChange={() => {}}><p>原本的审核页面</p></PortalLayout></MemoryRouter>);
    });
    const content = JSON.stringify(view!.toJSON());
    assert.match(content, /支持中心/);
    assert.match(content, /如何在卡片上核对产品图片/);
    assert.doesNotMatch(content, /原本的审核页面/);
  } finally { if (view) await act(async () => { view!.unmount(); }); }
});
