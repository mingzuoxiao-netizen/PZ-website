import React, { useCallback, useEffect, useState, useRef } from 'react';
import { adminFetch } from '../../../utils/adminFetch';
import {resolveImage} from '../../../utils/imageResolver';
import {preflightProduct} from '../../../utils/productPreflight.js';
import ProductChangeSummary from './ProductChangeSummary';
import SupervisorReviewSummary,{reviewSizeLabel} from './SupervisorReviewSummary';
import ReturnIssueEditor,{defaultReturnIssue,returnIssuesComplete} from './ReturnIssueEditor';
import type {ReturnIssue} from '../../../utils/reviewReturn.mjs';
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
  images?:string[]|string;material?:string;size?:string;finish?:string;sub_category?:string;
  series_id?:string;dimensions_cm?:string|Record<string,number>;
  kind?:'product'|'revision';status:string;latest_version:number;approved_version:number|null;
  submitter_id:string;supervisor_id:string;department_id:string;return_reason?:string|null;
  is_recheck?:number|boolean;
};
type Version = {version:number;snapshot:Record<string,unknown>;submitted_by:string;created_at:string};
type ReviewDetail = Review & {
  base_snapshot?:Record<string,unknown>;draft?:Record<string,unknown>;versions:Version[];
  events:{id:string;action:string;actor_id:string;actor_role:string;review_version:number;note:string|null;created_at:string;return_issues?:ReturnIssue[]}[];
  return_issues?:ReturnIssue[];
  recheck?:{is_recheck:boolean;from_version:number;changed_fields:string[];return_issues?:ReturnIssue[]}|null;
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
// The paged queue already includes product images, but its D1 column can be
// either JSON text or a parsed array. Do not fetch every full review just to
// show a preview in each card.
export const reviewCardImages=(raw:unknown):string[]=>{
  let value=raw;
  if(typeof value==='string'){
    try{value=JSON.parse(value);}catch{return [];}
  }
  return Array.isArray(value)?value.filter((url):url is string=>typeof url==='string'&&url.trim().length>0):[];
};
const reviewKey=(item:Review):string=>(item.kind||'product')+':'+item.id;
export const canBatchInitialReview=(item:Review):boolean=>
  item.kind==='product'&&item.status==='pending_supervisor'&&item.latest_version===1&&!item.is_recheck;
export const groupSupervisorReviews=(items:Review[]):Array<{name:string;key:string;items:Review[];grouped:boolean}>=>{
  const groups:Array<{name:string;key:string;items:Review[];grouped:boolean}>=[];
  const bySeries=new Map<string,number>();
  for(const item of items){
    // A subcategory or SKU prefix is not proof of common series ownership.
    // Only the explicit series_id stored in the product specifications is safe.
    const series=typeof item.series_id==='string'?item.series_id.trim():'';
    if(!series){groups.push({name:'',key:reviewKey(item),items:[item],grouped:false});continue;}
    const key=String(item.category||'').trim().toLocaleLowerCase()+'\u0000'+series.toLocaleLowerCase();
    const existing=bySeries.get(key);
    if(existing===undefined){bySeries.set(key,groups.length);
      groups.push({name:series,key,items:[item],grouped:true});}
    else groups[existing].items.push(item);
  }
  return groups;
};
export const cardAnomalies=(item:Review):string[]=>{
  const alerts:string[]=[];
  const photos=reviewCardImages(item.images);
  if(photos.length<4)alerts.push('图片不足 4 张');
  if(photos.length!==new Set(photos).size)alerts.push('图片链接重复');
  if(!String(item.material||'').trim())alerts.push('材质未填写');
  if(!String(item.finish||'').trim())alerts.push('表面处理未填写');
  if(reviewSizeLabel(item.size,item.dimensions_cm)==='未填写')alerts.push('尺寸未填写');
  const dims=typeof item.dimensions_cm==='string'?(()=>{
    try{return JSON.parse(item.dimensions_cm);}catch{return {};}
  })():item.dimensions_cm;
  if(dims&&typeof dims==='object'&&Object.values(dims).some(n=>typeof n==='number'&&n>300))
    alerts.push('部分尺寸超过 300 cm，请核对单位');
  return alerts;
};
const SupervisorCardImage:React.FC<{raw:unknown;name:string;revision:boolean}>=({raw,name,revision})=>{
  const images=reviewCardImages(raw),main=images[0];
  return <div className="min-w-0">
    {main?<a href={resolveImage(main)} target="_blank" rel="noopener noreferrer"
      title="查看产品主图" aria-label={'查看 '+name+' 的产品主图'}
      className="block aspect-[4/3] w-full overflow-hidden rounded border border-stone-200 bg-stone-50 sm:aspect-square">
      <img src={resolveImage(main)} alt={name+' 产品主图'} loading="lazy" className="h-full w-full object-cover"/>
    </a>:<div className="flex aspect-[4/3] items-center justify-center rounded border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-500 sm:aspect-square">暂无产品图片</div>}
    <p className="mt-1 text-[11px] text-stone-500">{images.length} 张图片{revision?' · 修订提交图片':''}</p>
  </div>;
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
  const actionPanel=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(selected&&typeof window!=='undefined'&&typeof window.matchMedia==='function'&&window.matchMedia('(max-width: 1023px)').matches)
      detailPanel.current?.scrollIntoView({block:'start'});
  },[selected]);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [reason,setReason]=useState('');
  const [returnIssues,setReturnIssues]=useState<ReturnIssue[]>([defaultReturnIssue()]);
  const [showAllFields,setShowAllFields]=useState(false);
  const [returnAction,setReturnAction]=useState<'return'|'request-correction'|null>(null);
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState<number|null>(null);
  const [search,setSearch]=useState('');
  const [query,setQuery]=useState('');
  const [employee,setEmployee]=useState('');
  const [kind,setKind]=useState<''|'product'|'revision'>('');
  const [status,setStatus]=useState('action');
  const [batchSelection,setBatchSelection]=useState<string[]>([]);
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
      setBatchSelection(current=>current.filter(key=>result.items.some(item=>
        reviewKey(item)===key&&canBatchInitialReview(item))));
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
  useEffect(()=>{setBatchSelection([]);},[role,page,query,employee,kind,status]);
  const inspect=async(item:Review)=>{
    const request=++detailGeneration.current;
    setBusy(true);setSelected(null);setError('');setReason('');setReturnIssues([defaultReturnIssue()]);setReturnAction(null);
    try{
      const detail=await adminFetch<ReviewDetail>('/'+base+'/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id));
      if(request!==detailGeneration.current)return;
      // Supervisors start with the focused snapshot; administrators retain
      // their existing complete first-submission view before final release.
      setShowAllFields(role==='ADMIN'&&item.kind!=='revision'&&detail.versions.length===1);
      setSelected({...detail,kind:item.kind});
    }catch(e:any){if(request===detailGeneration.current)setError(e?.message||'无法读取审核详情');}
    finally{if(request===detailGeneration.current)setBusy(false);}
  };
  const action=async(name:'approve'|'return'|'request-correction'|'publish')=>{
    if(!selected||busy)return;
    if(name==='return'||name==='request-correction'){
      if(selected.kind==='revision'&&reason.trim().length<5){setError('产品修订退回仍需至少 5 字文字说明');return;}
      if(selected.kind!=='revision'&&!returnIssuesComplete(returnIssues)){setError('请填写要退回的字段及具体修改要求');return;}
    }
    if(name==='publish'&&!confirm('确认将此产品正式发布到网站吗？'))return;
    setBusy(true);setError('');setNotice('');
    try{
      const result=await adminFetch<{success:boolean;status:string}>('/'+base+'/'+(selected.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(selected.id)+'/'+name,{
        method:'POST',body:JSON.stringify({note:reason.trim(),expected_version:selected.latest_version,
          ...(selected.kind!=='revision'&&(name==='return'||name==='request-correction')?{issues:returnIssues}:{})})
      });
      if(!result.success)throw Error('审核状态未确认');
      setNotice(name==='publish'?'产品已发布':name==='approve'?'审核已通过':'已退回并记录原因');
      setReason('');setReturnIssues([defaultReturnIssue()]);setReturnAction(null);
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
  const groupedReviews=role==='SUPERVISOR'?groupSupervisorReviews(reviews):[];
  const orderedReviews=role==='SUPERVISOR'?groupedReviews.flatMap(group=>group.items):reviews;
  const groupStarts=new Map(groupedReviews.filter(group=>group.grouped&&group.items.length>1)
    .map(group=>[reviewKey(group.items[0]),group] as const));
  const toggleBatch=(item:Review)=>{
    const key=reviewKey(item);
    setBatchSelection(previous=>previous.includes(key)?previous.filter(value=>value!==key):
      previous.length>=10?previous:[...previous,key]);
  };
  const selectGroup=(group:{items:Review[]})=>{
    const candidates=group.items.filter(canBatchInitialReview).map(reviewKey);
    setBatchSelection(previous=>{
      const missing=candidates.filter(key=>!previous.includes(key));
      return missing.length===0?previous.filter(key=>!candidates.includes(key)):
        [...previous,...missing].slice(0,10);
    });
  };
  const batchApprove=async()=>{
    if(role!=='SUPERVISOR'||busy||loading||!batchSelection.length)return;
    const candidates=orderedReviews.filter(item=>batchSelection.includes(reviewKey(item))&&canBatchInitialReview(item));
    if(!candidates.length||candidates.length!==batchSelection.length||candidates.length>10){
      setError('待办已变化，请刷新列表并重新选择。');return;
    }
    setBusy(true);setError('');setNotice('');
    let completed=0;
    try{
      // Fetch the submitted version before any write. A batch is blocked in
      // its entirety if even one candidate has an error, warning, or stale V1.
      for(const item of candidates){
        const detail=await adminFetch<ReviewDetail>('/supervisor/reviews/'+encodeURIComponent(item.id));
        const snapshot=detail.versions?.at(-1)?.snapshot;
        const validation=snapshot?preflightProduct(snapshot):null;
        const issues=(validation?.errors.length||0)+(validation?.warnings.length||0);
        if(!snapshot||detail.status!=='pending_supervisor'||detail.latest_version!==1||
          detail.supervisor_id!==item.supervisor_id||detail.product_id!==item.product_id||
          detail.code!==item.code||detail.versions.length!==1||issues>0||
          (Array.isArray(snapshot.preflight_warnings)&&snapshot.preflight_warnings.length>0)){
          throw Error('批量预检未通过（'+item.code+'）：可能有字段/图片异常、资料已修改或版本不一致。请单独展开核对。');
        }
      }
      if(typeof confirm!=='function'||!confirm('即将对 '+candidates.length+' 个首次新品逐条初审通过：\n'+
        candidates.map(item=>'• '+item.code+' · '+(item.name_cn||item.name)).join('\n')+
        '\n\n请确认已逐项查看卡片规格和图片。系统会再次校验版本并保留每条独立审核日志。')){
        setNotice('已取消批量初审，未修改任何审核状态。');return;
      }
      for(const item of candidates){
        const result=await adminFetch<{success:boolean;status:string}>(
          '/supervisor/reviews/'+encodeURIComponent(item.id)+'/approve',{
            method:'POST',body:JSON.stringify({expected_version:item.latest_version,
              batch_initial_review:true})
          });
        if(!result.success||result.status!=='pending_admin')throw Error('审核结果未确认：'+item.code);
        completed++;
      }
      setNotice('批量初审完成：'+completed+' 条已提交管理员终审；每条均有独立审核记录。');
    }catch(e:any){
      setError('批量初审已停止：'+(e?.message||'请求失败')+'。本次已通过 '+completed+
        ' 条，其余未执行；请刷新逐项核实。');
    }finally{
      setBatchSelection([]);
      setSelected(null);
      await refresh();
      setBusy(false);
    }
  };
  const previousVersion=selected?.versions?.length&&selected.versions.length>1?
    selected.versions[selected.versions.length-2]:null;
  const original=selected?.kind==='revision'?selected.base_snapshot||{}:
    previousVersion?.snapshot||selected?.versions?.[0]?.snapshot||{};
  const latest=selected?.versions?.[selected.versions.length-1]?.snapshot||selected?.draft||{};
  const recheckFields=selected?.recheck?.is_recheck?selected.recheck.changed_fields||[]:[];
  const recheckChanged=(field:string)=>recheckFields.some(change=>change===field||change.startsWith(field+'.'));
  const confirmedPreflightWarnings=Array.isArray(latest.preflight_warnings)?
    latest.preflight_warnings as Array<{field?:string;zh?:string;en?:string;code?:string}>:[];
  const canApprove=selected&&(role==='ADMIN'?selected.status==='pending_admin':selected.status==='pending_supervisor');
  const canReturn=canApprove;
  const canCorrection=role==='SUPERVISOR'&&selected?.status==='returned_to_supervisor';
  const canPublish=role==='ADMIN'&&selected?.status==='approved_pending_publish';
  const isFirstSubmission=selected?.kind!=='revision'&&selected?.versions.length===1;
  const changedFields=fields.filter(([key])=>recheckFields.length
    ?recheckChanged(key)||key==='size'&&recheckFields.some(field=>field.startsWith('dimensions_cm.'))
    :JSON.stringify(original[key])!==JSON.stringify(latest[key]));
  const visibleFields=showAllFields?fields:changedFields;
  const technicalChanged=JSON.stringify(original.specifications||{})!==JSON.stringify(latest.specifications||{});
  const selectedIndex=orderedReviews.findIndex(item=>item.id===selected?.id&&item.kind===selected?.kind);
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
    <div className={role==='SUPERVISOR'?'grid grid-cols-1 gap-y-0':'grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]'}>
      <section className={role==='SUPERVISOR'?'contents':'space-y-2 rounded border border-stone-200 bg-white p-3 lg:max-h-[76vh] lg:overflow-y-auto '+(selected?'hidden lg:block':'')} aria-label="审核申请列表">
        <h3 className={role==='SUPERVISOR'?'order-[-3] mb-3 px-2 py-2 text-sm font-semibold':'px-2 py-2 text-sm font-semibold'}>产品申请（{total===null?'未同步':total}）</h3>
        {loading&&<p className="p-3 text-sm text-stone-500">加载中…</p>}
        {!loading&&total===0&&<p className="p-3 text-sm text-stone-500">暂无产品审核申请。</p>}
        {orderedReviews.map((item,index)=>role==='SUPERVISOR'?<React.Fragment key={reviewKey(item)}>
          {groupStarts.has(reviewKey(item))&&<div style={{order:index*2-1}}
            className="mb-2 mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-sky-200 bg-sky-50 px-4 py-3" role="group"
            aria-label={'产品系列 '+groupStarts.get(reviewKey(item))!.name}>
            <div><strong className="text-sm text-sky-900">同系列：{groupStarts.get(reviewKey(item))!.name}</strong>
              <span className="ml-2 text-xs text-sky-700">本页 {groupStarts.get(reviewKey(item))!.items.length} 条独立 SKU</span></div>
            {groupStarts.get(reviewKey(item))!.items.some(canBatchInitialReview)&&<button type="button"
              disabled={busy||loading} onClick={()=>selectGroup(groupStarts.get(reviewKey(item))!)}
              className="rounded border border-sky-300 bg-white px-3 py-2 text-xs font-semibold text-sky-900">
              选择本系列可批量初审的新品（最多 10 条）
            </button>}
          </div>}
          <article
          style={{order:index*2}}
          className={'border border-stone-200 bg-white p-4 sm:p-5 '+
            (selectedIndex===index?'rounded-t border-b-0 bg-stone-50':'mb-3 rounded')}>
          <div className="grid gap-4 sm:grid-cols-[144px_minmax(0,1fr)]">
            <SupervisorCardImage raw={item.images} name={item.name_cn||item.name} revision={item.kind==='revision'}/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><h4 className="text-base font-semibold text-stone-900">{item.name_cn||item.name}</h4>
                  <p className="mt-1 break-all text-xs text-stone-500">{item.code||'未设置 SKU'} · V{item.latest_version}</p>
                </div>
                <span className="rounded bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{statusLabels[item.status]||item.status}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                <div><dt className="text-stone-500">产品分类</dt><dd className="mt-1 break-words font-medium text-stone-900">{item.category||'未填写'}</dd></div>
                <div><dt className="text-stone-500">提交员工</dt><dd className="mt-1 font-medium text-stone-900">{members.find(member=>member.id===item.submitter_id)?.username||'提交员工'}</dd></div>
                <div><dt className="text-stone-500">申请类型</dt><dd className="mt-1 font-medium text-stone-900">{item.kind==='revision'?'产品修订':'新品申请'}</dd></div>
                <div><dt className="text-stone-500">材质</dt><dd className="mt-1 break-words font-medium text-stone-900">{item.material||'未填写'}</dd></div>
                <div><dt className="text-stone-500">尺寸</dt><dd className="mt-1 break-words font-medium text-stone-900">{reviewSizeLabel(item.size,item.dimensions_cm)}</dd></div>
                <div><dt className="text-stone-500">表面处理</dt><dd className="mt-1 break-words font-medium text-stone-900">{item.finish||'未填写'}</dd></div>
              </dl>
              {!!item.series_id&&<p className="mt-2 text-xs text-sky-800">系列编号：{item.series_id}</p>}
              {cardAnomalies(item).length>0&&<div className="mt-3 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
                aria-label="卡片规则异常提醒">规则提示（需人工确认）：{cardAnomalies(item).join('；')}</div>}
              {!!item.is_recheck&&item.kind!=='revision'&&<span className="mt-3 inline-flex rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">复检 · 优先</span>}
            </div>
          </div>
          {canBatchInitialReview(item)&&<label className="mt-3 flex items-center gap-2 text-xs text-stone-700">
            <input type="checkbox" aria-label={'选择批量初审 '+item.code} checked={batchSelection.includes(reviewKey(item))}
              disabled={busy||loading||(!batchSelection.includes(reviewKey(item))&&batchSelection.length>=10)}
              onChange={()=>toggleBatch(item)} className="h-4 w-4 accent-stone-900"/>
            加入安全批量初审（仅首次新品 · 无预检异常才可通过）
          </label>}
          <button type="button" disabled={busy||loading} aria-expanded={selectedIndex===index}
            aria-controls="supervisor-inline-review-detail"
            onClick={()=>{if(selectedIndex===index){setSelected(null);setReturnAction(null);}else void inspect(item);}}
            className="mt-4 rounded bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
            {selectedIndex===index?'收起审核详情':'查看审核详情 · 展开核对'}
          </button>
        </article></React.Fragment>:<button key={(item.kind||'product')+':'+item.id} type="button" disabled={busy||loading} onClick={()=>void inspect(item)}
          aria-current={selected?.id===item.id&&selected?.kind===item.kind?'true':undefined}
          className={'w-full rounded border p-3 text-left transition-colors hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900 '+(selected?.id===item.id&&selected?.kind===item.kind?'border-stone-900 bg-stone-50':'border-stone-100')}>
          <div className="flex justify-between gap-2"><strong className="text-sm">{item.name_cn||item.name}</strong>
            <span className="text-[11px] text-stone-500">V{item.latest_version}</span></div>
          {!!item.is_recheck&&item.kind!=='revision'&&<span className="inline-flex rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">复检 · 优先</span>}
          <p className="mt-1 text-xs text-stone-500">{item.code||'未设置 SKU'} · {item.kind==='revision'?'修订':'新品'}</p>
          <p className="mt-2 text-xs text-amber-700">{statusLabels[item.status]||item.status}</p>
        </button>)}
        {role==='SUPERVISOR'&&<div style={{order:-2}}
          className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded border border-stone-200 bg-white px-4 py-3"
          aria-label="安全批量初审工具栏">
          <p className="text-xs leading-5 text-stone-600">已选 <strong>{batchSelection.length}</strong> / 10 条 ·
            仅首次新品；全量预检与版本校验后，逐条提交并记录日志。</p>
          <div className="flex gap-2">
            {batchSelection.length>0&&<button type="button" disabled={busy||loading}
              onClick={()=>setBatchSelection([])} className="rounded border px-3 py-2 text-xs">清空选择</button>}
            <button type="button" disabled={busy||loading||!batchSelection.length}
              onClick={()=>void batchApprove()}
              className="rounded bg-stone-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">
              预检并批量初审
            </button>
          </div>
        </div>}
      </section>
      <section ref={detailPanel} id={role==='SUPERVISOR'?'supervisor-inline-review-detail':undefined}
        style={role==='SUPERVISOR'?{order:selectedIndex*2+1}:undefined}
        className={role==='SUPERVISOR'
          ?'mb-3 min-w-0 space-y-4 rounded-b border border-t-0 border-stone-200 bg-white p-4 sm:p-5 '+(!selected?'hidden':'')
          :'min-w-0 space-y-4 rounded border border-stone-200 bg-white p-4 sm:p-5'} aria-label="审核详情">
        {selected&&role==='ADMIN'&&<button type="button" disabled={busy} onClick={()=>setSelected(null)} className="rounded border px-3 py-2 text-sm lg:hidden">返回申请列表</button>}
        {!selected?<p className="py-12 text-center text-sm text-stone-500">选择一条审核申请，先查看变更，再进行操作。</p>:<>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><h3 className="font-serif text-lg font-semibold">{selected.name_cn||selected.name}</h3>
              <p className="mt-1 text-xs text-stone-500">{selected.code} · {statusLabels[selected.status]||selected.status}</p>
            </div>
            <span className="rounded bg-stone-100 px-3 py-1.5 text-xs text-stone-600">{isFirstSubmission?'首次提交 V1':`V1 → V${selected.latest_version}`}</span>
          </div>
          {selected.return_reason&&<p className="rounded border-l-2 border-amber-400 bg-amber-50 p-3 text-sm">最近退回原因：{selected.return_reason}</p>}
          {selected.recheck?.is_recheck&&<aside className="rounded border border-amber-300 bg-amber-50 p-3" aria-label="复检变更字段">
            <strong className="text-sm text-amber-950">复检 V{selected.recheck.from_version} → V{selected.latest_version}</strong>
            <p className="mt-1 text-xs">自上次退回后修改：{recheckFields.length?recheckFields.join('、'):'未检测到字段变化'}</p>
            {!!selected.recheck.return_issues?.length&&<ul className="mt-1 list-disc pl-5 text-xs">
              {selected.recheck.return_issues.map((issue,i)=><li key={i}>{issue.field} · {issue.message}</li>)}
            </ul>}
          </aside>}
          {selected.return_issues?.length>0&&<aside className="rounded border border-stone-200 p-3 text-xs" aria-label="退回问题记录">
            {selected.return_issues.map((issue,i)=><div key={i}>{issue.field}：{issue.message}</div>)}
          </aside>}
          {role==='SUPERVISOR'&&<SupervisorReviewSummary snapshot={latest} isFirstSubmission={!!isFirstSubmission}/>}
          {role==='ADMIN'&&confirmedPreflightWarnings.length>0&&<aside className="rounded border border-amber-300 bg-amber-50 p-3" aria-label="机器预警复核">
            <h4 className="text-sm font-semibold text-amber-950">操作员已确认的机器预警 · 请复核</h4>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-amber-900">
              {confirmedPreflightWarnings.map((warning,i)=><li key={warning.code+'-'+i}>
                {(warning.zh||warning.en||warning.code||'待核查项目')} · {warning.field}
              </li>)}
            </ul>
          </aside>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-stone-900">
              {isFirstSubmission?(role==='SUPERVISOR'?'新品关键字段 · 完整资料按需查看':'新品完整资料'):
                `${showAllFields?'全部公开字段':'本次变更'} · ${changedFields.length} 项变化`}
              {technicalChanged?' · 技术资料有更新':''}
            </h4>
            {role==='SUPERVISOR'&&(canApprove||canCorrection)&&<button type="button"
              onClick={()=>{actionPanel.current?.scrollIntoView({behavior:'smooth',block:'start'});
                actionPanel.current?.focus({preventScroll:true});}}
              className="rounded bg-stone-900 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-800">前往审核操作 ↓</button>}
            {(role==='SUPERVISOR'||!isFirstSubmission)&&<button type="button" aria-pressed={showAllFields}
              onClick={()=>setShowAllFields(value=>!value)}
              className="rounded border border-stone-300 px-3 py-2 text-xs text-stone-700 hover:bg-stone-50">
              {showAllFields?(isFirstSubmission?'收起完整资料':'只看变更'):
                isFirstSubmission?'查看完整资料':'查看全部字段'}
            </button>}
          </div>
          {isFirstSubmission?(role==='SUPERVISOR'&&!showAllFields?
            <p className="rounded bg-stone-50 p-3 text-xs text-stone-600" role="note">完整的中英文描述、逐张图片与技术资料没有被隐藏或删除；点击「查看完整资料」即可展开核查。</p>:
            <ProductChangeSummary original={{}} proposed={latest} isNew/>):visibleFields.length===0?<p className="rounded bg-stone-50 p-4 text-sm text-stone-600">
            公开字段没有变化。{technicalChanged?'请展开下方技术资料核对内部信息。':'请核对版本记录后再决定审核。'}
          </p>:<div className="space-y-3" aria-label="初始与提交版本字段比较">
            {visibleFields.map(([field,label])=>{
              const changed=JSON.stringify(original[field])!==JSON.stringify(latest[field]);
              return <article key={field} className={'rounded border p-3 sm:p-4 '+
                (changed||recheckChanged(field)?'border-amber-300 bg-amber-50':'border-stone-200 bg-stone-50')}>
                <h5 className="mb-2 text-xs font-semibold text-stone-800">{label}{changed?' · 已修改':''}</h5>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="mb-1 text-[11px] font-semibold text-stone-500">{selected.kind==='revision'?'修改前已发布版本':`变更前 V${previousVersion?.version||1}`}</p>
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
              {ev.note&&<p className="mt-1 text-stone-700">备注：{ev.note}</p>}
              {!!ev.return_issues?.length&&<ul className="mt-1 list-disc pl-4 text-amber-900">
                {ev.return_issues.map((issue,i)=><li key={i}>{issue.field}：{issue.message}</li>)}
              </ul>}
            </li>)}</ol>
          </details>
          {(canApprove||canCorrection||canPublish)&&<div ref={role==='SUPERVISOR'?actionPanel:undefined}
            id={role==='SUPERVISOR'?'supervisor-review-actions':undefined}
            tabIndex={role==='SUPERVISOR'?-1:undefined}
            className="rounded border border-stone-200 bg-stone-50 p-3 sm:p-4" aria-label="当前审核操作">
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
                onClick={()=>{setReturnAction(current=>current==='return'?null:'return');setReason('');setReturnIssues([defaultReturnIssue()]);}}
                className="w-full rounded border border-red-300 bg-white px-4 py-3 text-sm font-medium text-red-800 sm:w-auto">
                {role==='ADMIN'?'退回主管':'退回员工'}
              </button>}
              {canCorrection&&<button type="button" disabled={busy} aria-expanded={returnAction==='request-correction'}
                onClick={()=>{setReturnAction(current=>current==='request-correction'?null:'request-correction');setReason('');setReturnIssues([defaultReturnIssue()]);}}
                className="w-full rounded border border-amber-400 bg-white px-4 py-3 text-sm font-medium text-amber-900 sm:w-auto">
                安排员工修改
              </button>}
            </div>
            {canPublish&&<p className="mt-2 text-xs text-stone-600">发布会更新公开网站，和终审批准是两个独立步骤。</p>}
            {returnAction&&(canReturn||canCorrection)&&<div className="mt-4 space-y-3 rounded border border-amber-200 bg-white p-3">
              <label className="block text-sm font-semibold text-stone-800">
                整体说明（选填）
                <textarea value={reason} onChange={e=>setReason(e.target.value)}
                  className="mt-2 w-full rounded border border-stone-300 p-3 text-sm font-normal"
                  rows={3} maxLength={2000} placeholder="说明需要调整的字段和具体要求"/>
              </label>
              {selected.kind!=='revision'&&<ReturnIssueEditor issues={returnIssues} onChange={setReturnIssues} disabled={busy}/>} 
              <div className="flex flex-wrap gap-2" aria-label="常用退回说明">
                {['请补充清晰的产品主图','请核对尺寸及计量单位','请确认材质和表面处理','请调整产品所属分类'].map(text=><button key={text} type="button" disabled={busy}
                  onClick={()=>{setReason(text);setReturnIssues([{field:text.includes('主图')?'images':text.includes('尺寸')?'dimensions_cm.height':text.includes('材质')?'material':'category',message:text}]);}} className="rounded border px-3 py-2 text-xs">{text}</button>)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={busy||(selected.kind==='revision'?reason.trim().length<5:!returnIssuesComplete(returnIssues))}
                  onClick={()=>void action(returnAction)}
                  className="rounded bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
                  确认{role==='ADMIN'?'退回主管':returnAction==='return'?'退回员工':'安排修改'}
                </button>
                <button type="button" onClick={()=>{setReturnAction(null);setReason('');setReturnIssues([defaultReturnIssue()]);}}
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

