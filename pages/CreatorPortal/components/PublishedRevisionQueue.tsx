import React,{useCallback,useEffect,useState} from 'react';
import {adminFetch} from '../../../utils/adminFetch';

type Role='FACTORY'|'SUPERVISOR'|'ADMIN';
// Completed revisions remain in the audit/product history, never in work queues.
export const isActionableRevisionForRole=(role:Role,status:string):boolean=>{
  if(['published','canceled'].includes(status))return false;
  if(role==='ADMIN')return ['pending_admin','approved_pending_publish'].includes(status);
  if(role==='SUPERVISOR')return ['pending_supervisor','returned_to_supervisor'].includes(status);
  return ['draft','pending_supervisor','pending_admin','returned_to_supervisor',
    'returned_to_uploader','approved_pending_publish'].includes(status);
};
export type RevisionSummary={
  id:string;product_id:string;submitter_id:string;supervisor_id:string;department_id:string;
  name:string;name_cn?:string;code:string;status:string;latest_version:number;
  approved_version:number|null;draft_revision:number;return_reason?:string|null
};
export type RevisionDetail=RevisionSummary&{
  base_snapshot:Record<string,any>;draft:Record<string,any>;
  versions:Array<{version:number;snapshot:Record<string,any>;created_at:string}>;
  events:Array<{id:string;action:string;review_version:number;note:string|null;created_at:string}>
};
interface Props{
  role:Role;onEdit?:(revision:RevisionDetail)=>void;
  onEnabledChange?:(enabled:boolean)=>void;refreshKey?:number
}
const names:Record<string,string>={
  draft:'修改草稿',pending_supervisor:'待主管初审',pending_admin:'待管理员终审',
  returned_to_supervisor:'管理员退回主管',returned_to_uploader:'待员工修改',
  approved_pending_publish:'终审已通过·待发布',published:'修订已发布',canceled:'已取消'
};
const fields:[string,string][]=[
  ['name','英文名称'],['name_cn','中文名称'],['category','分类'],['sub_category','子分类'],
  ['material','材质'],['size','尺寸'],['finish','表面处理'],['description','英文描述'],
  ['description_cn','中文描述'],['images','产品图片'],['production_sites','生产基地']
];
const present=(value:unknown):string=>Array.isArray(value)?value.join('、')||'—':
  value===null||value===undefined||value===''?'—':String(value);
/** Display only real product/packing fields; omit legacy document/evidence placeholders. */
const visibleInternalSpecs=(input:unknown)=>{
  const specs=input&&typeof input==='object'&&!Array.isArray(input)?input as Record<string,any>:{};
  const fields=['dimensions_cm','net_weight_kg','color','materials','attributes',
    'packaging','care_en','warnings_en','construction_en'];
  const view:Record<string,unknown>={};
  for(const field of fields){
    if(specs[field]!==undefined)view[field]=specs[field];
  }
  if(specs.assembly){
    view.assembly={required:specs.assembly.required,minutes:specs.assembly.minutes};
  }
  return view;
};
const PublishedRevisionQueue:React.FC<Props>=({role,onEdit,onEnabledChange,refreshKey=0})=>{
  const prefix=role.toLowerCase();
  const [enabled,setEnabled]=useState(false);
  const [items,setItems]=useState<RevisionSummary[]>([]);
  const [selected,setSelected]=useState<RevisionDetail|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [reason,setReason]=useState('');
  const refresh=useCallback(async()=>{
    try{
      const response=await adminFetch<{items:RevisionSummary[]}>('/'+prefix+'/revisions');
      const actionable=(response.items||[]).filter(item=>
        isActionableRevisionForRole(role,item.status));
      setEnabled(true);onEnabledChange?.(true);setItems(actionable);
      setSelected(current=>current && !actionable.some(item=>item.id===current.id) ? null : current);
    }catch(e:any){
      if(/404|not found/i.test(String(e?.message||''))){
        setEnabled(false);onEnabledChange?.(false);setItems([]);setSelected(null);return;
      }
      setError(e?.message||'无法读取修订申请');
    }
  },[prefix,onEnabledChange,role]);
  useEffect(()=>{void refresh();},[refresh,refreshKey]);
  const inspect=async(id:string)=>{
    setError('');
    try{
      const detail=await adminFetch<RevisionDetail>('/'+prefix+'/revisions/'+encodeURIComponent(id));
      setSelected(detail);
    }catch(e:any){setError(e?.message||'无法读取修订详情');}
  };
  const act=async(action:'submit'|'approve'|'return'|'request-correction'|'publish'|'cancel')=>{
    if(!selected||busy)return;
    if(['return','request-correction'].includes(action)&&reason.trim().length<5){
      setError('请填写不少于 5 个字符的明确退回原因');return;
    }
    if(action==='publish'&&!confirm('确认用已批准的版本替换官网现有产品吗？'))return;
    if(action==='submit'&&!confirm('确认提交主管初审吗？'))return;
    if(action==='cancel'&&!confirm('确认取消修订草稿吗？'))return;
    setBusy(true);setError('');setNotice('');
    let updated=false;
    try{
      const result=await adminFetch<{success?:boolean}>(
        '/'+prefix+'/revisions/'+encodeURIComponent(selected.id)+'/'+action,
        {method:'POST',body:JSON.stringify({note:reason.trim()})}
      );
      if(result.success!==true)throw Error('修订结果未确认，请刷新核对');
      updated=true;
      setNotice(action==='publish'
        ? '修订已发布并退出待办；可在产品管理中查看已发布产品。'
        : '修订审核状态已更新');
    }catch(e:any){setError(e?.message||'操作未完成，请核对状态');}
    finally{
      // D1 publish may commit before catalog sync fails; always reconcile state.
      // Never reselect a completed revision in the review center.
      try{
        await refresh();
        const detail=await adminFetch<RevisionDetail>(
          '/'+prefix+'/revisions/'+encodeURIComponent(selected.id));
        setSelected(isActionableRevisionForRole(role,detail.status)?detail:null);
      }catch(e:any){
        setSelected(null);
        setError(updated ? '操作已成功，但刷新修订列表失败，请手动刷新核对。' :
          (e?.message||'无法刷新修订状态。'));
      }
      setBusy(false);
    }
  };
  if(!enabled || (role!=='FACTORY' && !items.length && !error))return null;
  const original=selected?.base_snapshot||{};
  const proposed=selected?.versions?.[selected.versions.length-1]?.snapshot||selected?.draft||{};
  const diff=fields.filter(([key])=>JSON.stringify(original[key])!==JSON.stringify(proposed[key]));
  const canEdit=role==='FACTORY'&&!!selected&&['draft','returned_to_uploader'].includes(selected.status);
  const canSupervisorApprove=role==='SUPERVISOR'&&selected?.status==='pending_supervisor';
  const canSupervisorCorrect=role==='SUPERVISOR'&&selected?.status==='returned_to_supervisor';
  const canAdminApprove=role==='ADMIN'&&selected?.status==='pending_admin';
  const canPublish=role==='ADMIN'&&selected?.status==='approved_pending_publish';
  const actionButton=(label:string,kind:'submit'|'approve'|'return'|'request-correction'|'publish'|'cancel',disabled=false)=>{
    const primary=['submit','approve','publish'].includes(kind);
    return <button type="button" disabled={busy||disabled} onClick={()=>void act(kind)}
      className={'w-full rounded px-4 py-2.5 text-sm font-semibold disabled:opacity-40 sm:w-auto '+
        (primary?'bg-stone-900 text-white hover:bg-stone-800':
          'border border-stone-300 bg-white text-stone-700 hover:bg-stone-50')}>{label}</button>;
  };
  return <section aria-label={role==='FACTORY'?'我的产品修订':'产品修订待办'} className="space-y-4 rounded border border-stone-200 bg-white p-3 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="font-serif text-lg">{role==='FACTORY'?'我的产品修订':'产品修订待办'}（{items.length}）</h2>
        <p className="mt-1 text-xs leading-5 text-stone-500">这里只显示当前需要处理的修订。已发布记录保留在产品与审批历史中。</p>
      </div>
      <button type="button" className="rounded border border-stone-300 px-3 py-2 text-xs" onClick={()=>void refresh()}>刷新列表</button>
    </div>
    {error&&<p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="rounded bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    {!items.length&&<p className="rounded bg-stone-50 p-4 text-sm text-stone-500">当前没有需要处理的修订。</p>}
    <div className="grid gap-4 lg:grid-cols-[minmax(210px,1fr)_minmax(0,2fr)]">
      <div className="space-y-2 lg:max-h-[70vh] lg:overflow-y-auto" aria-label="修订申请列表">
        {items.map(item=><button key={item.id} type="button" onClick={()=>void inspect(item.id)}
          aria-current={selected?.id===item.id?'true':undefined}
          className={'w-full rounded border p-3 text-left text-xs hover:border-stone-900 '+
            (selected?.id===item.id?'border-stone-900 bg-stone-50':'border-stone-200')}>
          <strong className="block text-sm">{item.name_cn||item.name}</strong>
          <span className="text-stone-500">{item.code} · V{item.latest_version}</span>
          <span className="block text-amber-700">{names[item.status]||item.status}</span>
        </button>)}
      </div>
      {selected&&<div className="space-y-3 rounded border p-4">
        <h3 className="text-base font-semibold">{selected.name_cn||selected.name} · {names[selected.status]||selected.status}</h3>
        {selected.return_reason&&<p className="text-xs text-amber-800">退回原因：{selected.return_reason}</p>}
        <div className="space-y-2" aria-label="修订内容对比">
          <p className="text-xs font-semibold text-stone-800">本次修改 · {diff.length} 项公开字段变化</p>
          {diff.map(([key,label])=><article key={key} className="rounded border border-amber-200 p-3">
            <h4 className="mb-2 text-xs font-semibold text-stone-900">{label}</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-stone-500">当前官网</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-stone-700 [overflow-wrap:anywhere]">{present(original[key])}</p>
              </div>
              <div className="min-w-0 sm:border-l sm:border-stone-200 sm:pl-3">
                <p className="text-[11px] font-semibold text-stone-500">申请修改为</p>
                <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-stone-900 [overflow-wrap:anywhere]">{present(proposed[key])}</p>
              </div>
            </div>
          </article>)}
          {!diff.length&&<p className="rounded bg-stone-50 p-3 text-xs text-stone-600">公开字段未改变，请展开下方技术资料检查内部变更。</p>}
        </div>
        <details><summary className="cursor-pointer text-xs font-semibold">后台技术和包装资料变化</summary>
          <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-all bg-stone-50 p-2 text-xs">
            {JSON.stringify({original:visibleInternalSpecs(original.specifications),draft:visibleInternalSpecs(proposed.specifications)},null,2)}
          </pre>
        </details>
        <details><summary className="cursor-pointer text-xs font-semibold">审核记录（{selected.events.length}）</summary>
          <ul className="space-y-2 p-2 text-xs">{selected.events.map(e=><li key={e.id}>
            {e.action} · V{e.review_version} · {e.created_at}{e.note?' · '+e.note:''}</li>)}</ul>
        </details>
        <div className="space-y-3 rounded border border-stone-200 bg-stone-50 p-3" aria-label="修订操作">
          <div className="flex flex-wrap gap-2">
            {canEdit&&<button type="button" disabled={busy}
              className="w-full rounded border border-stone-300 bg-white px-4 py-2.5 text-sm sm:w-auto"
              onClick={()=>onEdit?.(selected)}>编辑草稿</button>}
            {canEdit&&actionButton('提交主管初审','submit')}
            {canEdit&&actionButton('取消修订','cancel')}
            {canSupervisorApprove&&actionButton('初审通过','approve')}
            {canAdminApprove&&actionButton('终审批准（待发布）','approve')}
            {canPublish&&actionButton('确认发布修订','publish')}
          </div>
          {(canSupervisorApprove||canSupervisorCorrect||canAdminApprove)&&<details className="rounded border border-stone-200 bg-white p-3">
            <summary className="cursor-pointer text-sm font-medium text-stone-800">
              {canSupervisorCorrect?'安排员工修改（填写原因）':'退回申请（填写原因）'}
            </summary>
            <div className="mt-3 space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                原因（至少 5 个字符）
                <textarea className="mt-2 w-full rounded border border-stone-300 p-3 text-sm font-normal"
                  rows={3} maxLength={2000} value={reason}
                  onChange={e=>setReason(e.target.value)} placeholder="明确需要修改的字段和要求"/>
              </label>
              <div>
                {canSupervisorApprove&&actionButton('确认退回员工','return',reason.trim().length<5)}
                {canSupervisorCorrect&&actionButton('确认安排员工修改','request-correction',reason.trim().length<5)}
                {canAdminApprove&&actionButton('确认退回主管','return',reason.trim().length<5)}
              </div>
            </div>
          </details>}
          {canPublish&&<p className="text-xs text-stone-600">审批通过后仍需单独发布，官网不会自动更新。</p>}
        </div>
      </div>}
    </div>
  </section>;
};
export default PublishedRevisionQueue;
