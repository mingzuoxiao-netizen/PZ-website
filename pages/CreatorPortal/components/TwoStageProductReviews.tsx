import React, { useCallback, useEffect, useState, useRef } from 'react';
import { adminFetch } from '../../../utils/adminFetch';
import ProductChangeSummary from './ProductChangeSummary';
import {fetchBackofficePage} from '../../../utils/backofficeLists';

type Role = 'ADMIN' | 'SUPERVISOR';

// Keep the operational review queue limited to work for the current role.
// Published products and completed returns remain in catalog/history, not here.
export const isActionableProductReview = (role:Role,status:string):boolean =>
  role==='ADMIN'
    ? ['pending_admin','approved_pending_publish'].includes(status)
    : ['pending_supervisor','returned_to_supervisor'].includes(status);
type Review = {
  id:string; product_id:string; name:string; name_cn?:string; code:string;category:string;
  kind?:'product'|'revision';status:string;latest_version:number;approved_version:number|null;
  submitter_id:string;supervisor_id:string;department_id:string;return_reason?:string|null;
};
type Version = {version:number;snapshot:Record<string,unknown>;submitted_by:string;created_at:string};
type ReviewDetail = Review & {
  base_snapshot?:Record<string,unknown>;draft?:Record<string,unknown>;versions:Version[];
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
const TwoStageProductReviews:React.FC<{role:Role;members?:{id:string;username:string}[]}>=({role,members=[]})=>{
  const base=role==='ADMIN'?'admin':'supervisor';
  const [reviews,setReviews]=useState<Review[]>([]);
  const [selected,setSelected]=useState<ReviewDetail|null>(null);
  const detailPanel=useRef<HTMLElement>(null);
  useEffect(()=>{
    if(selected&&typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 1023px)').matches)
      detailPanel.current?.scrollIntoView({block:'start'});
  },[selected]);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [reason,setReason]=useState('');
  const [showAllFields,setShowAllFields]=useState(false);
  const [returnAction,setReturnAction]=useState<'return'|'request-correction'|null>(null);
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState<number|null>(null);
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [employee,setEmployee]=useState('');
  const [kind,setKind]=useState<''|'product'|'revision'>('');
  const [status,setStatus]=useState('action');
  const generation=useRef(0);
  const detailGeneration=useRef(0);
  const refresh=useCallback(async()=>{
    const request=++generation.current;
    setLoading(true);
    try{
      const result=await fetchBackofficePage<Review>(role==='ADMIN'?'admin/release-queue':'supervisor/release-queue',{
        page,q:query,submitter:employee,kind:kind||undefined,status,sort:'oldest'
      });
      if(request!==generation.current)return [];
      if(page>1&&!result.items.length){setPage(Math.max(1,Math.ceil(result.total/50)));return [];}
      setReviews(result.items);setTotal(result.total);
      setSelected(current=>current&&!result.items.some(item=>item.id===current.id&&item.kind===current.kind)?null:current);
      return result.items;
    }catch(e:any){
      if(request===generation.current){setError(e?.message||'读取完整审核列表失败');setReviews([]);setTotal(null);setSelected(null);}
      return [];
    }finally{if(request===generation.current)setLoading(false);}
  },[role,page,query,employee,kind,status]);
  useEffect(()=>{
    setError('');setSelected(null);detailGeneration.current++;void refresh();
    return ()=>{generation.current++;detailGeneration.current++;};
  },[refresh]);
  const inspect=async(item:Review)=>{
    const request=++detailGeneration.current;
    setBusy(true);setSelected(null);setError('');setReason('');setReturnAction(null);
    try{
      const detail=await adminFetch<ReviewDetail>('/'+base+'/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id));
      if(request!==detailGeneration.current)return;
      setShowAllFields(item.kind!=='revision'&&detail.versions.length===1);
      setSelected({...detail,kind:item.kind});
    }catch(e:any){if(request===detailGeneration.current)setError(e?.message||'无法读取审核详情');}
    finally{if(request===detailGeneration.current)setBusy(false);}
  };
  const action=async(name:'approve'|'return'|'request-correction'|'publish')=>{
    if(!selected||busy)return;
    if(name==='return'||name==='request-correction'){
      if(reason.trim().length<5){setError('请填写至少 5 个字符的明确退回原因');return;}
    }
    if(name==='publish'&&!confirm('确认将此产品正式发布到网站吗？'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await adminFetch<{success:boolean;status:string}>('/'+base+'/'+(selected.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(selected.id)+'/'+name,{
        method:'POST',body:JSON.stringify({note:reason.trim()})
      });
      if(!result.success)throw Error('审核状态未确认');
      setNotice(name==='publish'?'产品已发布':name==='approve'?'审核已通过':'已退回并记录原因');
      setReason('');setReturnAction(null);
      // A successful publish or handoff must immediately leave this role's
      // queue, even if a legacy endpoint still includes completed records.
      setSelected(null);
      try {
        const refreshed=await refresh();
        if(isActionableProductReview(role,result.status)){
          const detail=await adminFetch<ReviewDetail>(
            '/'+base+'/'+(selected.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(selected.id));
          setSelected({...detail,kind:selected.kind});
        }else{
          const next=refreshed.find(item=>isActionableProductReview(role,item.status));
          if(next)await inspect(next);
        }
      }catch(refreshError:any){
        setError('操作已成功，但列表刷新失败：'+
          (refreshError?.message||'请点击刷新列表核对状态。'));
      }
    }catch(e:any){setError(e?.message||'操作未完成，请刷新检查');await refresh().catch(()=>{});}
    finally{setBusy(false);}
  };
  const original=selected?.kind==='revision'?selected.base_snapshot||{}:selected?.versions?.[0]?.snapshot||{};
  const latest=selected?.versions?.[selected.versions.length-1]?.snapshot||selected?.draft||{};
  const canApprove=selected&&(role==='ADMIN'?selected.status==='pending_admin':selected.status==='pending_supervisor');
  const canReturn=canApprove;
  const canCorrection=role==='SUPERVISOR'&&selected?.status==='returned_to_supervisor';
  const canPublish=role==='ADMIN'&&selected?.status==='approved_pending_publish';
  const isFirstSubmission=selected?.kind!=='revision'&&selected?.versions.length===1;
  const changedFields=fields.filter(([key])=>JSON.stringify(original[key])!==JSON.stringify(latest[key]));
  const visibleFields=showAllFields?fields:changedFields;
  const technicalChanged=JSON.stringify(original.specifications||{})!==JSON.stringify(latest.specifications||{});
  const renderValue=(key:string,value:unknown):React.ReactNode=>{
    if(key==='images'&&Array.isArray(value)){
      const images=value.filter((url):url is string=>typeof url==='string'&&!!url);
      return <div className="space-y-2">
        <span className="text-xs text-stone-600">{images.length} 张图片</span>
        {images.length>0&&<div className="flex flex-wrap gap-2">
          {images.map((url,i)=><a key={i} href={url} target="_blank" rel="noopener noreferrer"
            aria-label={'查看图片 '+(i+1)} title="查看原图"
            className="block h-14 w-14 shrink-0 overflow-hidden rounded border border-stone-200 bg-stone-100">
            <img src={url} alt={'图片 '+(i+1)} loading="lazy" className="h-full w-full object-cover"/>
          </a>)}
        </div>}
      </div>;
    }
    return <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{present(value)}</span>;
  };

  return <div className="space-y-4 p-3 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-serif text-xl text-stone-900">{role==='ADMIN'?'产品终审与发布':'产品初审队列'}</h2>
        <p className="mt-1 text-xs leading-5 text-stone-500">
          {role==='ADMIN'?'核对变更后决定批准或退回；批准后仍须单独发布。':'核对本部门产品变更，批准或退回给上传员工。'}
        </p>
      </div>
      <button type="button" disabled={busy||loading} onClick={()=>{setError('');void refresh();}}
        className="rounded border border-stone-300 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-white">刷新列表</button>
    </div>
    {error&&<div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice&&<div role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</div>}
    <form aria-label="筛选部门审核待办" onSubmit={event=>{event.preventDefault();setQuery(search.trim());setPage(1);}}
      className="grid gap-3 rounded border bg-white p-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-xs">SKU 或产品名称<input aria-label="搜索部门待办" type="search" maxLength={120}
        disabled={busy} value={search} onChange={e=>setSearch(e.target.value)} className="mt-1 w-full rounded border px-3 py-2 text-sm"/></label>
      <label className="text-xs">提交员工<select aria-label="部门待办员工" disabled={busy} value={employee}
        onChange={e=>{setEmployee(e.target.value);setPage(1);}} className="mt-1 w-full rounded border px-3 py-2 text-sm">
        <option value="">全部员工</option>{members.map(member=><option key={member.id} value={member.id}>{member.username}</option>)}
      </select></label>
      <label className="text-xs">申请类型<select aria-label="部门待办类型" disabled={busy} value={kind}
        onChange={e=>{setKind(e.target.value as typeof kind);setPage(1);}} className="mt-1 w-full rounded border px-3 py-2 text-sm">
        <option value="">新品与修订</option><option value="product">新品</option><option value="revision">修订</option>
      </select></label>
      <label className="text-xs">处理状态<select aria-label="部门待办状态" disabled={busy} value={status}
        onChange={e=>{setStatus(e.target.value);setPage(1);}} className="mt-1 w-full rounded border px-3 py-2 text-sm">
        <option value="action">需要我处理</option><option value="pending_supervisor">待初审</option>
        <option value="returned_to_supervisor">管理员退回</option>
        {role==='SUPERVISOR'&&<><option value="returned_to_uploader">等待员工补正</option><option value="pending_admin">等待管理员终审</option><option value="approved_pending_publish">等待正式发布</option></>}
      </select></label>
      <div className="flex gap-2"><button type="submit" disabled={busy} className="rounded bg-stone-900 px-4 py-2 text-sm text-white">搜索</button>
        <button type="button" disabled={busy} onClick={()=>{setSearch('');setQuery('');setEmployee('');setKind('');setStatus('action');setPage(1);}}
          className="rounded border px-3 py-2 text-sm">清除筛选</button></div>
    </form>
    <div className="grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
      <section className={'space-y-2 rounded border border-stone-200 bg-white p-3 lg:max-h-[76vh] lg:overflow-y-auto '+(selected?'hidden lg:block':'')} aria-label="审核申请列表">
        <h3 className="px-2 py-2 text-sm font-semibold">产品申请（{total===null?'未同步':total}）</h3>
        {loading&&<p className="p-3 text-sm text-stone-500">加载中…</p>}
        {!loading&&total===0&&<p className="p-3 text-sm text-stone-500">暂无产品审核申请。</p>}
        {reviews.map(item=><button key={(item.kind||'product')+':'+item.id} type="button" disabled={busy||loading} onClick={()=>void inspect(item)}
          aria-current={selected?.id===item.id&&selected?.kind===item.kind?'true':undefined}
          className={'w-full rounded border p-3 text-left transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900 '+(selected?.id===item.id&&selected?.kind===item.kind?'border-stone-900 bg-stone-50':'border-stone-100')}>
          <div className="flex justify-between gap-2"><strong className="text-sm">{item.name_cn||item.name}</strong>
            <span className="text-[11px] text-stone-500">V{item.latest_version}</span></div>
          <p className="mt-1 text-xs text-stone-500">{item.code||'未设置 SKU'} · {item.kind==='revision'?'修订':'新品'}</p>
          <p className="mt-2 text-xs text-amber-700">{statusLabels[item.status]||item.status}</p>
        </button>)}
      </section>
      <section ref={detailPanel} className="min-w-0 space-y-4 rounded border border-stone-200 bg-white p-4 sm:p-5" aria-label="审核详情">
        {selected&&<button type="button" disabled={busy} onClick={()=>setSelected(null)} className="rounded border px-3 py-2 text-sm lg:hidden">返回申请列表</button>}
        {!selected?<p className="py-12 text-center text-sm text-stone-500">选择一条审核申请，先查看变更，再进行操作。</p>:<>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="font-serif text-lg font-semibold">{selected.name_cn||selected.name}</h3>
              <p className="mt-1 text-xs text-stone-500">{selected.code} · {statusLabels[selected.status]||selected.status}</p>
            </div>
            <span className="rounded bg-stone-100 px-3 py-1.5 text-xs text-stone-600">{isFirstSubmission?'首次提交 V1':`V1 → V${selected.latest_version}`}</span>
          </div>
          {selected.return_reason&&<p className="rounded border-l-2 border-amber-400 bg-amber-50 p-3 text-sm">最近退回原因：{selected.return_reason}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-stone-900">
              {isFirstSubmission?'新品完整资料':`${showAllFields?'全部公开字段':'本次变更'} · ${changedFields.length} 项变化`}
              {technicalChanged?' · 技术资料有更新':''}
            </h4>
            {!isFirstSubmission&&<button type="button" aria-pressed={showAllFields}
              onClick={()=>setShowAllFields(value=>!value)}
              className="rounded border border-stone-300 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">
              {showAllFields?'只看变更':'查看全部字段'}
            </button>}
          </div>
          {isFirstSubmission?<ProductChangeSummary original={{}} proposed={latest} isNew/>:visibleFields.length===0?<p className="rounded bg-stone-50 p-4 text-sm text-stone-600">
            公开字段没有变化。{technicalChanged?'请展开下方技术资料核对内部信息。':'请核对版本记录后再决定审核。'}
          </p>:<div className="space-y-3" aria-label="初始与提交版本字段比较">
            {visibleFields.map(([field,label])=>{
              const changed=JSON.stringify(original[field])!==JSON.stringify(latest[field]);
              return <article key={field} className={'rounded border p-3 sm:p-4 '+
                (changed?'border-amber-200 bg-amber-50/30':'border-stone-200 bg-stone-50')}>
                <h5 className="mb-2 text-xs font-semibold text-stone-800">{label}{changed?' · 已修改':''}</h5>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold text-stone-500">初始版本 V1</p>
                    <div className="text-xs leading-5 text-stone-700">{renderValue(field,original[field])}</div>
                  </div>
                  <div className="min-w-0 sm:border-l sm:border-stone-200 sm:pl-3">
                    <p className="mb-1 text-[11px] font-semibold text-stone-500">本次提交 V{selected.latest_version}</p>
                    <div className="text-xs leading-5 text-stone-900">{renderValue(field,latest[field])}</div>
                  </div>
                </div>
              </article>;
            })}
          </div>}
          <details className="rounded border border-stone-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold">技术资料与包装附件 · V1 / V{selected.latest_version}</summary>
            <p className="my-2 text-xs text-stone-500">以下为审核时的内部技术数据快照，不代表已公开或上传附件文件。</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div><h4 className="mb-2 text-xs font-semibold">最初提交 V1</h4>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-stone-50 p-3 text-xs">{JSON.stringify(original.specifications||{},null,2)}</pre>
              </div>
              <div><h4 className="mb-2 text-xs font-semibold">最新 V{selected.latest_version}</h4>
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all bg-stone-50 p-3 text-xs">{JSON.stringify(latest.specifications||{},null,2)}</pre>
              </div>
            </div>
          </details>
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
          {(canApprove||canCorrection||canPublish)&&<div className="rounded border border-stone-200 bg-stone-50 p-3 sm:p-4" aria-label="当前审核操作">
            <div className="flex flex-wrap items-center gap-2">
              {canApprove&&<button type="button" disabled={busy} onClick={()=>void action('approve')}
                className="w-full rounded bg-stone-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
                {role==='ADMIN'?'终审批准（待发布）':'初审通过并查看下一条'}
              </button>}
              {canPublish&&<button type="button" disabled={busy} onClick={()=>void action('publish')}
                className="w-full rounded bg-green-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">
                确认正式发布
              </button>}
              {canReturn&&<button type="button" disabled={busy} aria-expanded={returnAction==='return'}
                onClick={()=>{setReturnAction(current=>current==='return'?null:'return');setReason('');}}
                className="w-full rounded border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-800 sm:w-auto">
                {role==='ADMIN'?'退回主管':'退回员工'}
              </button>}
              {canCorrection&&<button type="button" disabled={busy} aria-expanded={returnAction==='request-correction'}
                onClick={()=>{setReturnAction(current=>current==='request-correction'?null:'request-correction');setReason('');}}
                className="w-full rounded border border-amber-400 bg-white px-4 py-3 text-sm font-medium text-amber-900 sm:w-auto">
                安排员工修改
              </button>}
            </div>
            {canPublish&&<p className="mt-2 text-xs text-stone-600">发布会更新公开网站，和终审批准是两个独立步骤。</p>}
            {returnAction&&(canReturn||canCorrection)&&<div className="mt-4 space-y-3 rounded border border-amber-200 bg-white p-3">
              <label className="block text-sm font-semibold text-stone-800">
                修改说明（不少于 5 个字符）
                <textarea value={reason} onChange={e=>setReason(e.target.value)}
                  className="mt-2 w-full rounded border border-stone-300 p-3 text-sm font-normal"
                  rows={3} maxLength={2000} placeholder="说明需要调整的字段和具体要求"/>
              </label>
              <div className="flex flex-wrap gap-2" aria-label="常用退回说明">
                {['请补充清晰的产品主图','请核对尺寸及计量单位','请确认材质和表面处理','请调整产品所属分类'].map(text=><button key={text} type="button" disabled={busy}
                  onClick={()=>setReason(text)} className="rounded border px-3 py-2 text-xs">{text}</button>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy||reason.trim().length<5}
                  onClick={()=>void action(returnAction)}
                  className="rounded bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                  确认{role==='ADMIN'?'退回主管':returnAction==='return'?'退回员工':'安排修改'}
                </button>
                <button type="button" onClick={()=>{setReturnAction(null);setReason('');}}
                  className="rounded border border-stone-300 px-4 py-2.5 text-sm">取消</button>
              </div>
            </div>}
          </div>}

        </>}
      </section>
    </div>
    <nav aria-label="部门待办分页" className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <span role="status">{total===null?'数量未同步':`匹配 ${total} 项 · 第 ${page} 页 · 每页 50 项`}</span>
      <button type="button" disabled={busy||loading||page===1} onClick={()=>setPage(p=>p-1)} className="rounded border px-3 py-2">上一页</button>
      <button type="button" disabled={busy||loading||total===null||page*50>=total} onClick={()=>setPage(p=>p+1)} className="rounded border px-3 py-2">下一页</button>
    </nav>
  </div>;
};
export default TwoStageProductReviews;

