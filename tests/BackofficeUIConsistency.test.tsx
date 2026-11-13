import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {backofficeError} from '../pages/CreatorPortal/ui/feedback';
import {getStatusDefinition} from '../pages/CreatorPortal/ui/status';

function luminance(color:string){
  const channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255)
    .map(value=>value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4);
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
}
function contrast(a:string,b:string){
  const x=luminance(a),y=luminance(b);
  return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);
}
test('staff error feedback translates transport failures and preserves actionable Chinese messages',()=>{
  assert.match(backofficeError(new Error('Failed to fetch')),/网络/);
  assert.match(backofficeError(new Error('PRODUCT_EDIT_CONFLICT')),/其他人修改/);
  assert.match(backofficeError(new Error('HTTP 403')),/权限/);
  assert.match(backofficeError(new Error('HTTP 503'), '请刷新核对状态。'),/请刷新核对状态/);
  assert.equal(backofficeError(new Error('请补充产品材质。')),'请补充产品材质。');
  assert.doesNotMatch(backofficeError(new Error('TypeError: undefined')),/TypeError/);
});
test('all status-bearing backoffice surfaces use the same vocabulary',()=>{
  assert.equal(getStatusDefinition('new').label,'新询盘');
  assert.equal(getStatusDefinition('returned_to_uploader').label,'已退回');
  assert.equal(getStatusDefinition('Active').label,'已启用');
  assert.equal(getStatusDefinition('Disabled').label,'已停用');
  assert.equal(getStatusDefinition('verify').label,'保存待核对');
  assert.equal(getStatusDefinition('sampled_ok').label,'抽检通过');
  assert.equal(getStatusDefinition('audit_failed').label,'失败');
});
test('backoffice primary, danger, success and neutral tokens meet WCAG AA on white',()=>{
  for(const fg of ['#385575','#b91c1c','#166534','#292524'])
    assert.ok(contrast(fg,'#ffffff')>=4.5,fg+' must have at least 4.5:1 contrast');
  assert.ok(contrast('#ffffff','#385575')>=4.5);
  const sheet=readFileSync(new URL('../pages/CreatorPortal/backoffice.css',import.meta.url),'utf8');
  assert.match(sheet,/\.pz-backoffice button\s*\{\s*min-height:\s*44px/);
  assert.match(sheet,/focus-visible/);
});
