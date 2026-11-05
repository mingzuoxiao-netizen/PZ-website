import React,{useCallback,useEffect,useState} from 'react';
import {adminFetch} from '../../../utils/adminFetch';

type Role='FACTORY'|'SUPERVISOR'|'ADMIN';
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
      setEnabled(true);onEnabledChange?.(true);setItems(response.items||[]);
    }catch(e:any){
      if(/404|not found/i.test(String(e?.message||''))){
        setEnabled(false);onEnabledChange?.(false);setItems([]);setSelected(null);return;
      }
      setError(e?.message||'无法读取修订申请');
    }
  },[prefix,onEnabledChange]);
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
    try{
      const result=await adminFetch<{success?:boolean}>(
        '/'+prefix+'/revisions/'+encodeURIComponent(selected.id)+'/'+action,
        {method:'POST',body:JSON.stringify({note:reason.trim()})}
      );
      if(result.success!==true)throw Error('修订结果未确认，请刷新核对');
      setNotice(action==='publish'?'已发布并同步目录':'修订审核状态已更新');
    }catch(e:any){setError(e?.message||'操作未完成，请核对状态');}
    finally{
      // D1 publish can succeed before a KV refresh error: always read state.
      await Promise.all([refresh(),inspect(selected.id)]);
      setBusy(false);
    }
  };
  if(!enabled)return null;
  const original=selected?.base_snapshot||{};
  const proposed=selected?.versions?.[selected.versions.length-1]?.snapshot||selected?.draft||{};
  const diff=fields.filter(([key])=>JSON.stringify(original[key])!==JSON.stringify(proposed[key]));
  const canEdit=role==='FACTORY'&&!!selected&&['draft','returned_to_uploader'].includes(selected.status);
  const canSupervisorApprove=role==='SUPERVISOR'&&selected?.status==='pending_supervisor';
  const canSupervisorCorrect=role==='SUPERVISOR'&&selected?.status==='returned_to_supervisor';
  const canAdminApprove=role==='ADMIN'&&selected?.status==='pending_admin';
  const canPublish=role==='ADMIN'&&['approved_pending_publish','published'].includes(selected?.status||'');
  const actionButton=(label:string,kind:'submit'|'approve'|'return'|'request-correction'|'publish'|'cancel',disabled=false)=>
    <button type="button" disabled={busy||disabled} onClick={()=>void act(kind)}
      className="rounded border border-stone-400 px-3 py-2 text-xs disabled:opacity-40">{label}</button>;
  return <section aria-label="已发布产品修订" className="space-y-4 rounded border border-stone-200 bg-white p-5">
    <div><h2 className="font-serif text-xl">已发布产品修订（{items.length}）</h2>
      <p className="text-xs text-stone-500">审核期间官网保持旧版；仅在管理员最终发布后替换正式产品。</p></div>
    {error&&<p role="alert" className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    {notice&&<p role="status" className="rounded bg-green-50 p-2 text-xs text-green-700">{notice}</p>}
    <button type="button" className="rounded border px-3 py-2 text-xs" onClick={()=>void refresh()}>刷新列表</button>
    {!items.length&&<p className="text-xs text-stone-500">暂无修订申请</p>}
    <div className="grid gap-4 lg:grid-cols-[minmax(210px,1fr)_minmax(0,2fr)]">
      <div className="space-y-2">
        {items.map(item=><button key={item.id} type="button" onClick={()=>void inspect(item.id)}
          className="w-full rounded border p-3 text-left text-xs hover:border-stone-900">
          <strong className="block text-sm">{item.name_cn||item.name}</strong>
          <span className="text-stone-500">{item.code} · V{item.latest_version}</span>
          <span className="block text-amber-700">{names[item.status]||item.status}</span>
        </button>)}
      </div>
      {selected&&<div className="space-y-3 rounded border p-4">
        <h3 className="text-base font-semibold">{selected.name_cn||selected.name} · {names[selected.status]||selected.status}</h3>
        {selected.return_reason&&<p className="text-xs text-amber-800">退回原因：{selected.return_reason}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-xs">
            <thead><tr><th className="p-2">字段</th><th className="p-2">当前官网</th><th className="p-2">修订版</th></tr></thead>
            <tbody>{diff.map(([key,label])=><tr key={key} className="border-t align-top">
              <th className="p-2">{label}</th>
              <td className="max-w-40 break-words p-2">{present(original[key])}</td>
              <td className="max-w-40 break-words bg-amber-50 p-2">{present(proposed[key])}</td>
            </tr>)}</tbody>
          </table>
          {!diff.length&&<p className="text-xs text-stone-500">公开字段未改变，可能仅修改了后台技术资料。</p>}
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
        {(canSupervisorApprove||canSupervisorCorrect||canAdminApprove)&&<label className="block text-xs">
          退回原因（至少 5 字）
          <textarea className="mt-1 w-full rounded border p-2" rows={2} maxLength={2000}
            value={reason} onChange={e=>setReason(e.target.value)}/>
        </label>}
        <div className="flex flex-wrap gap-2">
          {canEdit&&<button type="button" disabled={busy} className="rounded border px-3 py-2 text-xs"
            onClick={()=>onEdit?.(selected)}>编辑草稿</button>}
          {canEdit&&actionButton('提交主管初审','submit')}
          {canEdit&&actionButton('取消修订','cancel')}
          {canSupervisorApprove&&actionButton('初审通过','approve')}
          {canSupervisorApprove&&actionButton('退回员工','return',reason.trim().length<5)}
          {canSupervisorCorrect&&actionButton('安排员工修改','request-correction',reason.trim().length<5)}
          {canAdminApprove&&actionButton('终审通过（待发布）','approve')}
          {canAdminApprove&&actionButton('退回主管','return',reason.trim().length<5)}
          {canPublish&&actionButton(selected.status==='published'?'重新同步官网目录':'确认发布修订','publish')}
        </div>
      </div>}
    </div>
  </section>;
};
export default PublishedRevisionQueue;
