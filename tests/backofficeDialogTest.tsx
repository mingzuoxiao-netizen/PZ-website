import assert from 'node:assert/strict';
import {act,type ReactTestRenderer} from 'react-test-renderer';

/** Confirm a visible, shared ConfirmDialog; exercise the real UI rather than mocking window.confirm. */
export async function acceptBackofficeDialog(view:ReactTestRenderer){
  const dialog=view.root.findByProps({role:'alertdialog'});
  const button=dialog.findAllByType('button').find(item=>
    item.children.some(text=>typeof text==='string'&&
      /^(确认|发布|提交审核|彻底删除|下架|归档|恢复为已下架|取消修订|保存|创建草稿|已核实，重试|离开|切换并清空|清空)$/.test(text.trim())));
  assert.ok(button,'shared ConfirmDialog must expose a confirmation action');
  assert.equal(button.props.disabled,false,'confirmation action must be enabled');
  await act(async()=>{await button.props.onClick();});
}
