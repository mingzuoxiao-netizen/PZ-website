import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';

type Role = 'ADMIN' | 'SUPERVISOR';
type Review = {
  id:string; product_id:string; name:string; name_cn?:string; code:string;category:string;
  status:string;latest_version:number;approved_version:number|null;
  submitter_id:string;supervisor_id:string;department_id:string;return_reason?:string|null;
};
type Version = {version:number;snapshot:Record<string,unknown>;submitted_by:string;created_at:string};
type ReviewDetail = Review & {
  versions:Version[];
  events:{id:string;action:string;actor_id:string;actor_role:string;review_version:number;note:string|null;created_at:string}[];
};

const statusLabels:Record<string,string>={
  pending_supervisor:'待主管初审',pending_admin:'待管理员终审',
  returned_to_supervisor:'管理员已退回主管',returned_to_uploader:'待员工修改',
  approved_pending_publish:'已批准待发布',published:'已发布'
};
const actionLabels:Record<string,string>={
  submitted:'员工提交',supervisor_approved:'主管初审通过',
  supervisor_returned:'主管退回员工',admin_approved:'管理员终审通过',
  admin_returned:'管理员退回主管',correction_assigned:'主管安排修改',published:'管理员发布'
};
const present=(v:unknown):string=>{
  if(v===null||v===undefined)return '—';
  if(Array.isArray(v))return v.map(x=>typeof x==='string'?x:JSON.stringify(x)).join('、')||'—';
  return typeof v==='object'?JSON.stringify(v):String(v);
};
const fields:[string,string][]=[
  ['name','英文名称'],['name_cn','中文名称'],['code','SKU'],
  ['category','所属分类'],['sub_category','子分类'],['material','材质'],
  ['size','尺寸'],['finish','表面处理'],['description','英文描述'],
  ['description_cn','中文描述'],['images','产品图片'],['production_sites','生产工厂']
];
const TwoStageProductReviews:React.FC<{role:Role}>=({role})=>{
  const base=role==='ADMIN'?'admin':'supervisor';
  const [reviews,setReviews]=useState<Review[]>([]);
  const [selected,setSelected]=useState<ReviewDetail|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [reason,setReason]=useState('');
  const refresh=useCallback(async()=>{
    const result=await adminFetch<{items:Review[]}('/'+base+'/reviews');
    setReviews(result.items||[]);
  },[base]);
  useEffect(()=>{void refresh().catch(e=>setError(e?.message||'读取审核列表失败')).finally(()=>setLoading(false));},[refresh]);
  const inspect=async(id:string)=>{
    setBusy(true);setError('');setReason('');
    try{setSelected(await adminFetch<ReviewDetail>('/'+base+'/reviews/'+encodeURIComponent(id)));}
    catch(e:any){setError(e?.message||'无法读取审核详情');}
    finally{setBusy(false);}
  };
  const action=async(name:'approve'|'return'|'request-correction'|'publish')=>{
    if(!selected||busy)return;
    if(name==='return'||name==='request-correction'){
      if(reason.trim().length<5){setError('请填写至少 5 个字符的明确退回原因');return;}
    }
    if(name==='publish'&&!confirm('确认将此产品正式发布到网站吗？'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await adminFetch<{success:boolean;status:string}>('/'+base+'/reviews/'+encodeURIComponent(selected.id)+'/'+name,{
        method:'POST',body:JSON.stringify({note:reason.trim()})
      });
      if(!result.success)throw Error('审核状态未确认');
      setNotice(name==='publish'?'产品已发布':name==='approve'?'审核已通过':'已退回并记录原因');
      setReason('');
      const [detail]=await Promise.all([
        adminFetch<ReviewDetail>('/'+base+'/reviews/'+encodeURIComponent(selected.id)),
        refresh()
      ]);
      setSelected(detail);
    }catch(e:any){setError(e?.message||'操作未完成，请刷新检查');await refresh().catch(()=>{});}
    finally{setBusy(false);}
  };
  const original=selected?.versions?.[0]?.snapshot||{};
  const latest=selected?.versions?.[selected.versions.length-1]?.snapshot||{};
  const canApprove=selected&&(role==='ADMIN'?selected.status==='pending_admin':selected.status==='pending_supervisor');
  const canReturn=canApprove;
  const canCorrection=role==='SUPERVISOR'&&selected?.status==='returned_to_supervisor';
  const canPublish=role==='ADMIN'&&selected?.status==='approved_pending_publish';

  return <div className="space-y-5 p-4 md:p-8">
    <div>
      <h2 className="font-serif text-2xl text-stone-900">{role==='ADMIN'?'产品终审与发布':'产品初审队列'}</h2>
      <p className="mt-2 text-sm text-stone-500">
        {role==='ADMIN'?'核对原始提交与最新版本；终审退回会返回直属主管，不会直接返回员工。':
          '仅可审核本部门提交的产品；管理员退回后由主管安排员工修改。'}
      </p>
    </div>
    {error&&<div role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice&&<div role="status" className="border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
    <button type="button" onClick={()=>void refresh().catch(e=>setError(e?.message||'刷新失败'))}
      className="border px-4 py-2 text-sm hover:bg-stone-50">刷新审核列表</button>
    <div className="grid gap-4 lg:grid-cols-[minmax(270px,1fr)_minmax(0,2fr)]">
      <section className="space-y-2 rounded border bg-white p-3">
        <h3 className="px-2 py-2 text-sm font-semibold">产品申请（{reviews.length}）</h3>
        {loading&&<p className="p-3 text-sm text-stone-500">加载中…</p>}
        {!loading&&!reviews.length&&<p className="p-3 text-sm text-stone-500">暂无产品审核申请。</p>}
        {reviews.map(item=><button key={item.id} type="button" onClick={()=>void inspect(item.id)}
          aria-current={selected?.id===item.id?'true':undefined}
          className={'w-full border p-3 text-left hover:bg-stone-50 '+(selected?.id===item.id?'border-stone-900':'border-stone-100')}>
          <div className="flex justify-between gap-2"><strong className="text-sm">{item.name_cn||item.name}</strong>
            <span className="text-[11px] text-stone-500">V{item.latest_version}</span></div>
          <p className="mt-1 text-xs text-stone-500">{item.code||'未设置 SKU'}</p>
          <p className="mt-2 text-xs text-amber-700">{statusLabels[item.status]||item.status}</p>
        </button>)}
      </section>
      <section className="space-y-4 rounded border bg-white p-5">
        {!selected?<p className="py-16 text-center text-sm text-stone-500">点击左侧产品，查看初始资料、修改版本与审核记录。</p>:<>
          <div className="flex flex-wrap justify-between gap-3">
            <div><h3 className="font-serif text-xl">{selected.name_cn||selected.name}</h3>
              <p className="text-xs text-stone-500">{selected.code} · {statusLabels[selected.status]||selected.status}</p>
            </div>
            <span className="text-sm text-stone-500">最初 V1 / 当前 V{selected.latest_version}</span>
          </div>
          {selected.return_reason&&<p className="border-l-2 border-amber-400 bg-amber-50 p-3 text-sm">最近退回原因：{selected.return_reason}</p>}
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs">
            <thead><tr className="border-b"><th className="p-2">项目</th><th className="p-2">最初提交 V1</th><th className="p-2">最新提交 V{selected.latest_version}</th></tr></thead>
            <tbody>{fields.map(([field,label])=>{
              const before=present(original[field]),after=present(latest[field]);
              return <tr key={field} className={'border-b align-top '+(before!==after?'bg-amber-50':'')}>
                <th className="w-28 p-2 font-medium">{label}</th><td className="max-w-[250px] break-words p-2">{before}</td>
                <td className="max-w-[250px] break-words p-2">{after}</td>
              </tr>;
            })}</tbody>
          </table></div>
          <details><summary className="cursor-pointer text-sm font-semibold">所有版本（{selected.versions.length}）</summary>
            <div className="space-y-2 pt-2">{selected.versions.map(v=><details key={v.version} className="rounded border p-2 text-xs">
              <summary className="cursor-pointer font-semibold">V{v.version} · {v.created_at}</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all">{JSON.stringify(v.snapshot,null,2)}</pre>
            </details>)}</div>
          </details>
          <details><summary className="cursor-pointer text-sm font-semibold">审核历史（{selected.events.length}）</summary>
            <ol className="mt-2 space-y-2">{selected.events.map(ev=><li className="border-l-2 border-stone-300 pl-3 text-xs" key={ev.id}>
              {actionLabels[ev.action]||ev.action} · {ev.actor_id} · V{ev.review_version}
              <span className="ml-2 text-stone-500">{ev.created_at}</span>
              {ev.note&&<p className="mt-1 text-stone-700">原因：{ev.note}</p>}
            </li>)}</ol>
          </details>
          {(canReturn||canCorrection)&&<label className="block space-y-1 text-sm">
            <span>退回 / 修改说明（必填，不少于 5 字）</span>
            <textarea value={reason} onChange={e=>setReason(e.target.value)}
              className="w-full border p-3 text-sm" rows={3} maxLength={2000} placeholder="写明需要修改的字段、问题和要求…" />
          </label>}
          <div className="flex flex-wrap gap-2">
            {canApprove&&<button disabled={busy} onClick={()=>void action('approve')} className="bg-stone-900 px-5 py-2 text-sm text-white disabled:opacity-50">
              {role==='ADMIN'?'终审批准（待发布）':'初审通过'}
            </button>}
            {canReturn&&<button disabled={busy||reason.trim().length<5} onClick={()=>void action('return')} className="border border-red-300 px-5 py-2 text-sm text-red-700 disabled:opacity-50">
              {role==='ADMIN'?'退回主管':'退回员工'}
            </button>}
            {canCorrection&&<button disabled={busy||reason.trim().length<5} onClick={()=>void action('request-correction')} className="border border-amber-400 px-5 py-2 text-sm text-amber-800 disabled:opacity-50">
              安排员工修改
            </button>}
            {canPublish&&<button disabled={busy} onClick={()=>void action('publish')} className="bg-green-800 px-5 py-2 text-sm text-white disabled:opacity-50">确认正式发布</button>}
          </div>
        </>}
      </section>
    </div>
  </div>;
};
export default TwoStageProductReviews;
