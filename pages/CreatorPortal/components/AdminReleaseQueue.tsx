import React, {useCallback,useEffect,useMemo,useState,useRef} from 'react';
import {adminFetch} from '../../../utils/adminFetch';
import ProductChangeSummary from './ProductChangeSummary';
import ReturnIssueEditor,{defaultReturnIssue,returnIssuesComplete} from './ReturnIssueEditor';
import type {ReturnIssue} from '../../../utils/reviewReturn.mjs';
import {fetchBackofficePage} from '../../../utils/backofficeLists';
import {resolveImage} from '../../../utils/imageResolver';
import StatusChip from '../ui/StatusChip';
import {Button,ListShell,ListSkeleton,EmptyState,Toast} from '../ui/BackofficeComponents';

type Status='pending_admin'|'approved_pending_publish';
type Kind='product'|'revision';
type Summary={
  id:string; product_id:string; name:string; name_cn?:string; code:string;
  category?:string; images?:string|string[]|null;
  status:string;latest_version:number; approved_version:number|null;is_recheck?:boolean|number;
  department_id:string; supervisor_id:string; submitter_id:string;
};
type WorkItem=Summary&{kind:Kind};
type ReviewDetail=Summary&{versions?:{version:number;snapshot:Record<string,unknown>}[];
  base_snapshot?:Record<string,unknown>;draft?:Record<string,unknown>;
  recheck?:{is_recheck:boolean;from_version:number;changed_fields:string[];return_issues?:ReturnIssue[]}|null;
  events?:{id:string;action:string;note?:string|null;created_at:string}[]};
type TeamMember={id:string;username:string;department_id?:string|null;department_name?:string|null;job_type?:string};

const eligible=(status:string):status is Status=>
  status==='pending_admin'||status==='approved_pending_publish';

export const canAdminRelease=(item:{kind:Kind;status:string})=>eligible(item.status);

export const firstImage=(images:unknown):string=>{
  try {
    const value=typeof images==='string'?JSON.parse(images):images;
    return Array.isArray(value) ? String(value.find(x=>typeof x==='string'&&x)||'') : '';
  }catch{return '';}
};

const AdminReleaseQueue:React.FC<{onQueueChanged?:()=>Promise<void>}>=({onQueueChanged})=>{
  const [rows,setRows]=useState<WorkItem[]>([]);
  const [people,setPeople]=useState<TeamMember[]>([]);
  const [selected,setSelected]=useState<string[]>([]);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [detail,setDetail]=useState<ReviewDetail|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [partial,setPartial]=useState<string[]>([]);

  const [query,setQuery]=useState('');
  const [search,setSearch]=useState('');
  const [department,setDepartment]=useState('');
  const [supervisor,setSupervisor]=useState('');
  const [kind,setKind]=useState<''|Kind>('');
  const [page,setPage]=useState(1);
  const [total,setTotal]=useState<number|null>(null);
  const [sort,setSort]=useState<'oldest'|'newest'>('oldest');
  const requestId=useRef(0);
  const detailRequest=useRef(0);
  const refresh=useCallback(async()=>{
    const request=++requestId.current;
    setLoading(true);
    try{
      const result=await fetchBackofficePage<WorkItem>('admin/release-queue',{
        page,q:query,department,supervisor,kind:kind||undefined,sort
      });
      if(request!==requestId.current)return;
      if(page>1&&!result.items.length){
        setPage(Math.max(1,Math.ceil(result.total/result.page_size)));return;
      }
      setRows(result.items);setTotal(result.total);
      setSelected(current=>current.filter(key=>result.items.some(x=>x.kind+':'+x.id===key)));
      setExpanded(current=>current&&result.items.some(x=>x.kind+':'+x.id===current)?current:null);
    }catch(e:any){
      if(request===requestId.current){setRows([]);setTotal(null);setSelected([]);setError(e?.message||'无法读取完整待办');}
    }finally{if(request===requestId.current)setLoading(false);}
  },[page,query,department,supervisor,kind,sort]);
  useEffect(()=>{
    setError('');setSelected([]);setExpanded(null);setDetail(null);setReturnKey(null);setReason('');detailRequest.current++;
    void refresh();
    return ()=>{requestId.current++;};
  },[refresh]);
  useEffect(()=>{
    let active=true;
    void adminFetch<{users:TeamMember[]}>('admin/org/accounts').then(result=>{
      if(!Array.isArray(result.users))throw Error('Invalid team list');
      if(active)setPeople(result.users);
    }).catch(()=>{if(active)setPartial(['部门与主管名称未同步，可继续按 SKU 查找']);});
    return ()=>{active=false;};
  },[]);
  const nameOf=(id:string)=>people.find(x=>x.id===id)?.username||id.slice(0,8);
  const departmentOf=(id:string)=>people.find(x=>x.id===id)?.department_name||'部门待核实';
  const getKey=(item:WorkItem)=>item.kind+':'+item.id;
  const actionable=useMemo(()=>rows.filter(canAdminRelease),[rows]);

  const inspect=async(item:WorkItem)=>{
    const key=getKey(item);
    if(expanded===key){detailRequest.current++;setExpanded(null);setDetail(null);return;}
    const request=++detailRequest.current;
    setExpanded(key);setDetail(null);
    try{
      const result=await adminFetch<ReviewDetail>(
        'admin/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id));
      if(request===detailRequest.current)setDetail(result);
    }catch(e:any){if(request===detailRequest.current)setError('差异信息加载失败：'+(e?.message||'请重试'));}
  };

  const executeOne=async(item:WorkItem)=>{
    const prefix='admin/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id);
    if(!canAdminRelease(item))throw new Error('该申请尚未达到 Admin 发布条件。');
    if(item.status==='pending_admin'){
      const approved=await adminFetch<{success:boolean;status:string}>(prefix+'/approve',{
        method:'POST',body:JSON.stringify({note:''})
      });
      if(!approved.success||approved.status!=='approved_pending_publish')
        throw new Error('终审结果没有确认，已停止发布');
    }
    const published=await adminFetch<{success:boolean;status:string;catalog_published?:boolean}>(prefix+'/publish',{
      method:'POST',body:JSON.stringify({note:''})
    });
    if(!published.success||published.status!=='published'||published.catalog_published!==true)
      throw new Error('产品目录发布结果未确认，请检查产品管理记录');
  };

  const reconcile=async()=>{
    try{await refresh();}
    catch(e:any){setError('操作已结束，但待办刷新失败：'+(e?.message||'请手动刷新'));}
    try{await onQueueChanged?.();}catch{ /* own queue has already refreshed */ }
  };

  const release=async(batch:WorkItem[])=>{
    if(busy||loading||!batch.length)return;
    if(!batch.every(canAdminRelease)){
      setError('选中项目存在尚未经过主管初审或不需要发布的记录。');
      return;
    }
    const message=batch.length===1
      ?'确认完成该产品的 Admin 终审并正式发布？'
      :'确认逐项终审并发布选中的 '+batch.length+' 条产品/修订？如有一项失败，后续项目将停止处理。';
    const preview='\n'+batch.slice(0,10).map(item=>item.code||item.name).join('、')+(batch.length>10?'…':'');
    if(!confirm(message+preview))return;
    setBusy(true);setError('');setNotice('');
    let success=0;
    let current:WorkItem|undefined;
    let remaining:string[]=[];
    try{
      for(const item of batch){current=item;setNotice('正在发布 '+(success+1)+'/'+batch.length+' · '+(item.code||item.name));await executeOne(item);success++;}
      setNotice('已发布 '+success+' 项，完成记录已退出审核待办。');
    }catch(e:any){
      remaining=batch.slice(success).map(getKey);
      setNotice('已确认发布 '+success+' 项；其余项目请核对状态。');
      setError('已确认完成 '+success+'/'+batch.length+' 项。'+(current?'SKU '+(current.code||current.name)+'：':'')+
        (e?.message||'发布中断')+'。请核对网站与产品管理后再操作，不要重复批准。');
    }finally{
      setSelected(remaining);setExpanded(null);setDetail(null);
      await reconcile();setBusy(false);
    }
  };

  const returnToSupervisor=async(item:WorkItem,note:string,issues:ReturnIssue[])=>{
    if(busy||loading||item.status!=='pending_admin'||
       (item.kind==='revision'?note.trim().length<5:!returnIssuesComplete(issues)))return;
    setBusy(true);setError('');setNotice('');
    try{
      const prefix='admin/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id);
      const response=await adminFetch<{success:boolean;status:string}>(prefix+'/return',{
        method:'POST',body:JSON.stringify({note:note.trim(),...(item.kind==='product'?{issues}:{})})
      });
      if(!response.success||response.status!=='returned_to_supervisor')
        throw new Error('退回状态未确认');
      setNotice('已退回主管，当前待办已移除。');
      setSelected([]);setExpanded(null);setDetail(null);
    }catch(e:any){setError(e?.message||'退回失败');}
    finally{await reconcile();setBusy(false);}
  };

  const [returnKey,setReturnKey]=useState<string|null>(null);
  const [reason,setReason]=useState('');
  const [returnIssues,setReturnIssues]=useState<ReturnIssue[]>([defaultReturnIssue()]);
  const pendingCount=total;
  const unknown=total===null;
  return <ListShell label="管理员发布待办"><section className="space-y-4" aria-label="管理员快捷发布工作台">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-serif text-lg text-stone-900">待发布产品与修订（{unknown?'未同步':pendingCount}）</h2>
        <p className="mt-1 text-xs text-stone-500">主管负责内容审核，Admin 一键终审并发布。详情仅在需要时展开。</p>
      </div>
      <button type="button" disabled={busy||loading} onClick={()=>{setError('');void refresh();}}
        className="rounded border border-stone-300 px-3 py-2 text-xs">刷新待办</button>
    </div>
    {partial.length>0&&<p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      {partial.join('、')}。
    </p>}
    {error&&<Toast variant="error" message={error} onClose={()=>setError('')}/>}
    {notice&&<Toast message={notice} onClose={()=>setNotice('')}/>}
    <form className="grid gap-3 rounded border border-stone-200 bg-white p-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="筛选发布待办" onSubmit={event=>{event.preventDefault();setQuery(search.trim());setPage(1);}}>
      <label className="text-xs text-stone-700">SKU 或产品名称
        <input aria-label="搜索发布待办" type="search" maxLength={120} value={search} disabled={busy}
          onChange={e=>setSearch(e.target.value)} placeholder="搜索全部待发布项目"
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"/>
      </label>
      <label className="text-xs text-stone-700">所属部门
        <select aria-label="发布待办部门" value={department} disabled={busy}
          onChange={e=>{setDepartment(e.target.value);setSupervisor('');setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="">全部部门</option>
          {Array.from(new Map(people.filter(p=>p.department_id).map(p=>[p.department_id!,p.department_name||p.department_id!])).entries())
            .map(([id,name])=><option key={id} value={id}>{name}</option>)}
        </select>
      </label>
      <label className="text-xs text-stone-700">审核主管
        <select aria-label="发布待办主管" value={supervisor} disabled={busy}
          onChange={e=>{setSupervisor(e.target.value);setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="">全部主管</option>
          {people.filter(p=>p.job_type==='supervisor'&&(!department||p.department_id===department)).map(p=><option key={p.id} value={p.id}>{p.username}</option>)}
        </select>
      </label>
      <label className="text-xs text-stone-700">申请类型
        <select aria-label="发布待办类型" value={kind} disabled={busy}
          onChange={e=>{setKind(e.target.value as ''|Kind);setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="">新品与修订</option><option value="product">新品</option><option value="revision">修订</option>
        </select>
      </label>
      <label className="text-xs text-stone-700">排序
        <select aria-label="发布待办排序" value={sort} disabled={busy}
          onChange={e=>{setSort(e.target.value as typeof sort);setPage(1);}}
          className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm">
          <option value="oldest">最早待办优先</option><option value="newest">最近更新优先</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" disabled={busy} className="rounded bg-stone-900 px-4 py-2 text-sm text-white">搜索</button>
        <button type="button" disabled={busy} onClick={()=>{setSearch('');setQuery('');setDepartment('');setSupervisor('');setKind('');setPage(1);}}
          className="rounded border px-3 py-2 text-sm">清除筛选</button>
      </div>
    </form>
    {loading?<ListSkeleton rows={4}/>:
      actionable.length===0&&!unknown?<EmptyState message="当前没有需要管理员发布的产品或修订。"/>:
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-200 bg-stone-50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" aria-label="全选本页待发布产品" disabled={busy||loading||!actionable.length}
              checked={!!actionable.length&&selected.length===actionable.length}
              onChange={e=>setSelected(e.target.checked?actionable.map(getKey):[])} />
            选择本页 {actionable.length} 项
          </label>
          <button type="button" disabled={busy||loading||selected.length===0}
            onClick={()=>void release(actionable.filter(item=>selected.includes(getKey(item))))}
            className="rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            发布本页选中的 {selected.length} 项
          </button>
        </div>
        {actionable.map(item=>{
          const key=getKey(item);
          const image=firstImage(item.images);
          return <article key={key} className="rounded border border-stone-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-3">
              <input type="checkbox" aria-label={'选择发布 '+(item.name_cn||item.name)}
                disabled={busy||loading} checked={selected.includes(key)}
                onChange={e=>setSelected(curr=>e.target.checked?[...curr,key]:curr.filter(x=>x!==key))}/>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-stone-100">
                {image?<img src={resolveImage(image)} alt="" className="h-full w-full object-cover"/>:
                  <span className="flex h-full items-center justify-center text-[10px] text-stone-400">产品</span>}
              </div>
              <div className="min-w-[160px] flex-1 space-y-1">
                <p className="text-sm font-semibold">{item.name_cn||item.name}</p>
                <p className="text-xs text-stone-500">{item.code||'未填写 SKU'} · {item.kind==='revision'?'产品修订':'新品'} · V{item.latest_version}</p>
                {!!item.is_recheck&&item.kind==='product'&&<span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">复检 · 优先</span>}
                <p className="text-xs text-stone-500">{departmentOf(item.supervisor_id)} · 主管：{nameOf(item.supervisor_id)}</p>
              </div>
              <StatusChip status={item.status}/>
              <button type="button" disabled={busy||loading} onClick={()=>void inspect(item)}
                aria-expanded={expanded===key}
                className="rounded border border-stone-300 px-3 py-2 text-xs text-stone-600">
                {expanded===key?'收起差异':'查看差异'}
              </button>
              {item.status==='pending_admin'&&<button type="button" disabled={busy||loading}
                onClick={()=>{setReturnKey(returnKey===key?null:key);setReason('');setReturnIssues([defaultReturnIssue()]);}}
                className="rounded border border-red-200 px-3 py-2 text-xs text-red-700">退回主管</button>}
              <button type="button" disabled={busy||loading} onClick={()=>void release([item])}
                className="rounded bg-stone-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认发布</button>
            </div>
            {returnKey===key&&item.status==='pending_admin'&&
              <div className="mt-3 space-y-2 border-t pt-3">
                <textarea aria-label="退回主管原因" value={reason} maxLength={2000}
                  onChange={e=>setReason(e.target.value)} rows={2} placeholder="整体备注（选填）"
                  className="w-full rounded border p-2 text-sm"/>
                {item.kind==='product'&&<ReturnIssueEditor issues={returnIssues} onChange={setReturnIssues} disabled={busy||loading}/>} 
                <button type="button" disabled={busy||loading||(item.kind==='revision'?reason.trim().length<5:!returnIssuesComplete(returnIssues))}
                  onClick={()=>void returnToSupervisor(item,reason,returnIssues)}
                  className="rounded bg-red-700 px-4 py-2 text-xs text-white disabled:opacity-40">确认退回主管</button>
              </div>}
            {expanded===key&&<div className="mt-3 rounded border-t border-stone-200 p-3 text-xs">
              {!detail?<p className="text-stone-500">正在加载变更差异…</p>:
                <div className="space-y-2">
                  {item.kind==='product'&&Array.isArray(detail.versions?.[detail.versions.length-1]?.snapshot?.preflight_warnings)&&
                    <aside className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                      <strong>操作员已确认的机器预警 · Admin 请复核</strong>
                      <ul className="mt-1 list-disc pl-4">
                        {(detail.versions?.[detail.versions.length-1]?.snapshot?.preflight_warnings as Array<{zh?:string;field?:string;code?:string}>).map((warning,i)=>
                          <li key={i}>{warning.zh||warning.code} · {warning.field}</li>)}
                      </ul>
                    </aside>}
                  {item.kind==='product'&&detail.recheck?.is_recheck&&<aside className="rounded border border-amber-300 bg-amber-50 p-3 text-xs">
                    <strong>复检 V{detail.recheck.from_version} → V{item.latest_version}</strong>
                    <p>自退回后修改字段：{detail.recheck.changed_fields?.length?detail.recheck.changed_fields.join('、'):'无变化'}</p>
                    {!!detail.recheck.return_issues?.length&&<ul className="mt-1 list-disc pl-4">
                      {detail.recheck.return_issues.map((issue,i)=><li key={i}>{issue.field}：{issue.message}</li>)}
                    </ul>}
                  </aside>}
                  <ProductChangeSummary
                    original={item.kind==='revision'?detail.base_snapshot||{}:
                      detail.recheck?.is_recheck?detail.versions?.[detail.versions.length-2]?.snapshot||{}:
                      detail.versions?.[0]?.snapshot||{}}
                    proposed={item.kind==='revision'?detail.draft||{}:detail.versions?.[detail.versions.length-1]?.snapshot||{}}
                    isNew={item.kind==='product'&&(detail.versions?.length||0)<=1}/>

                </div>}
            </div>}
          </article>;
        })}
      </div>}
    <nav aria-label="发布待办分页" className="flex flex-wrap items-center justify-end gap-3 text-sm">
      <span role="status">{total===null?'数量未同步':`匹配 ${total} 项 · 第 ${page} 页 · 每页 50 项`}</span>
      <button type="button" disabled={busy||loading||page===1} onClick={()=>setPage(p=>p-1)} className="rounded border px-3 py-2">上一页</button>
      <button type="button" disabled={busy||loading||total===null||page*50>=total} onClick={()=>setPage(p=>p+1)} className="rounded border px-3 py-2">下一页</button>
    </nav>
  </section></ListShell>;
};
export default AdminReleaseQueue;

