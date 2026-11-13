import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {create} from 'react-test-renderer';
import StatusChip from '../pages/CreatorPortal/ui/StatusChip';
import {getStatusDefinition,STATUS_DEFINITIONS} from '../pages/CreatorPortal/ui/status';
import {Button,ConfirmDialog,EmptyState,FormField,ListShell,Toast} from '../pages/CreatorPortal/ui/BackofficeComponents';

test('one Chinese state vocabulary for products, inquiries, batches and sampling',()=>{
  assert.equal(getStatusDefinition('draft').label,'草稿');
  assert.equal(getStatusDefinition('pending_supervisor').label,'待初审');
  assert.equal(getStatusDefinition('pending_admin').label,'待终审');
  assert.equal(getStatusDefinition('returned_to_supervisor').label,'已退回');
  assert.equal(getStatusDefinition('returned_to_uploader').label,'已退回');
  assert.equal(getStatusDefinition('rejected').label,'已退回');
  assert.equal(getStatusDefinition('approved_pending_publish').label,'待发布');
  assert.equal(getStatusDefinition('published').tone,'green');
  assert.equal(getStatusDefinition('soft-deleted').label,'回收站');
  assert.equal(getStatusDefinition('quoted').label,'已报价');
  assert.equal(getStatusDefinition('won').label,'已成交');
  assert.equal(getStatusDefinition('import_failed').tone,'red');
  assert.equal(getStatusDefinition('sampled').label,'待抽检');
  assert.ok(Object.keys(STATUS_DEFINITIONS).length>15);
});
test('StatusChip labels and tones come from the dictionary rather than local classes',()=>{
  const view=create(<StatusChip status="pending_admin"/>);
  assert.match(JSON.stringify(view.toJSON()),/待终审/);
  view.update(<StatusChip status="returned_to_supervisor"/>);
  assert.match(JSON.stringify(view.toJSON()),/已退回/);
  view.update(<StatusChip status="new" overdue/>);
  assert.match(JSON.stringify(view.toJSON()),/已超时/);
  view.unmount();
});
test('shared components are controlled by props and preserve required user actions',()=>{
  let confirmed=0,cancelled=0;
  const view=create(<>
    <Button variant="primary" onClick={()=>confirmed++}>提交审核</Button>
    <ListShell label="审核队列" empty emptyMessage="暂无待办"><span>not visible</span></ListShell>
    <Toast message="已保存" />
    <FormField label="产品名称" htmlFor="name"><input id="name" /></FormField>
    <ConfirmDialog open title="永久删除" description="确认" danger requiredText="删除"
      onConfirm={()=>confirmed++} onCancel={()=>cancelled++}/>
  </>);
  assert.match(JSON.stringify(view.toJSON()),/暂无待办/);
  assert.doesNotMatch(JSON.stringify(view.toJSON()),/not visible/);
  const buttons=view.root.findAllByType('button');
  const primary=buttons.find(b=>b.children.includes('提交审核'));
  assert.ok(primary);
  primary?.props.onClick();
  const confirm=buttons.find(b=>b.children.includes('确认'));
  assert.equal(confirm?.props.disabled,true);
  const input=view.root.findAllByType('input').find(x=>!x.props.id);
  input?.props.onChange({target:{value:'删除'}});
  const enabled=view.root.findAllByType('button').find(b=>b.children.includes('确认'));
  assert.equal(enabled?.props.disabled,false);
  enabled?.props.onClick();
  assert.equal(confirmed,2);
  view.unmount();
});
