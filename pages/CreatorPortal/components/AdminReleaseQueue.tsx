import React, {useCallback,useEffect,useMemo,useState} from 'react';
import {adminFetch} from '../../../utils/adminFetch';
import {resolveImage} from '../../../utils/imageResolver';

type Status='pending_admin'|'approved_pending_publish';
type Kind='product'|'revision';
type Summary={
  id:string; product_id:string; name:string; name_cn?:string; code:string;
  category?:string; images?:string|string[]|null;
  status:string;latest_version:number; approved_version:number|null;
  department_id:string; supervisor_id:string; submitter_id:string;
};
type WorkItem=Summary&{kind:Kind};
type ReviewDetail=Summary&{versions?:{version:number;snapshot:Record<string,unknown>}[];
  base_snapshot?:Record<string,unknown>;draft?:Record<string,unknown>;
  events?:{id:string;action:string;note?:string|null;created_at:string}[]};
type TeamMember={id:string;username:string;department_name?:string|null};

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

  const refresh=useCallback(async()=>{
    const [products,revisions,members]=await Promise.allSettled([
      adminFetch<{items:Summary[]}>('admin/reviews'),
      adminFetch<{items:Summary[]}>('admin/revisions'),
      adminFetch<{users:TeamMember[]}>('admin/org/accounts')
    ]);
    const errors:string[]=[];
    const next:WorkItem[]=[];
    if(products.status==='fulfilled'&&Array.isArray(products.value?.items)){
      next.push(...products.value.items.filter(x=>eligible(x.status)).map(x=>({...x,kind:'product' as const})));
    }else errors.push('新品产品审核队列读取失败');
    if(revisions.status==='fulfilled'&&Array.isArray(revisions.value?.items)){
      next.push(...revisions.value.items.filter(x=>eligible(x.status)).map(x=>({...x,kind:'revision' as const})));
    }else errors.push('已发布产品修订队列读取失败');
    setRows(next);
    setSelected(current=>current.filter(key=>next.some(x=>x.kind+':'+x.id===key)));
    setExpanded(current=>current&&next.some(x=>x.kind+':'+x.id===current)?current:null);
    if(members.status==='fulfilled'&&Array.isArray(members.value?.users))setPeople(members.value.users);
    setPartial(errors);
    setLoading(false);
  },[]);

  useEffect(()=>{void refresh().catch(e=>{setError(e?.message||'审核待办读取失败');setLoading(false);});},[refresh]);
  const nameOf=(id:string)=>people.find(x=>x.id===id)?.username||id.slice(0,8);
  const departmentOf=(id:string)=>people.find(x=>x.id===id)?.department_name||'部门待核实';
  const getKey=(item:WorkItem)=>item.kind+':'+item.id;
  const actionable=useMemo(()=>rows.filter(canAdminRelease),[rows]);

  const inspect=async(item:WorkItem)=>{
    const key=getKey(item);
    if(expanded===key){setExpanded(null);setDetail(null);return;}
    setExpanded(key);setDetail(null);
    try{
      const result=await adminFetch<ReviewDetail>(
        'admin/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id));
      setDetail(result);
    }catch(e:any){setError('差异信息加载失败：'+(e?.message||'请重试'));}
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
    if(busy||!batch.length)return;
    if(!batch.every(canAdminRelease)){
      setError('选中项目存在尚未经过主管初审或不需要发布的记录。');
      return;
    }
    const message=batch.length===1
      ?'确认完成该产品的 Admin 终审并正式发布？'
      :'确认逐项终审并发布 '+batch.length+' 条产品/修订？如有一项失败，后续项目将停止处理。';
    if(!confirm(message))return;
    setBusy(true);setError('');setNotice('');
    let success=0;
    try{
      for(const item of batch){await executeOne(item);success++;}
      setNotice('已发布 '+success+' 项，完成记录已退出审核待办。');
    }catch(e:any){
      setError('已确认完成 '+success+'/'+batch.length+' 项。'+
        (e?.message||'发布中断')+'。请核对网站与产品管理后再操作，不要重复批准。');
    }finally{
      setSelected([]);setExpanded(null);setDetail(null);
      await reconcile();setBusy(false);
    }
  };

  const returnToSupervisor=async(item:WorkItem,note:string)=>{
    if(busy||item.status!=='pending_admin'||note.trim().length<5)return;
    setBusy(true);setError('');setNotice('');
    try{
      const prefix='admin/'+(item.kind==='revision'?'revisions':'reviews')+'/'+encodeURIComponent(item.id);
      const response=await adminFetch<{success:boolean;status:string}>(prefix+'/return',{
        method:'POST',body:JSON.stringify({note:note.trim()})
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
  const pendingCount=actionable.length;
  const unknown=partial.length>0;
  return <section className="space-y-4" aria-label="管理员快捷发布工作台">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-serif text-lg text-stone-900">待发布产品与修订（{unknown?'至少 ':''}{pendingCount}）</h2>
        <p className="mt-1 text-xs text-stone-500">主管负责内容审核，Admin 一键终审并发布。详情仅在需要时展开。</p>
      </div>
      <button type="button" disabled={busy} onClick={()=>void refresh()}
        className="rounded border border-stone-300 px-3 py-2 text-xs">刷新待办</button>
    </div>
    {partial.length>0&&<p role="alert" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      {partial.join('、')}。当前统计不完整，请检查接口；未加载的项目不会被批量发布。
    </p>}
    {error&&<p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice&&<p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm">{notice}</p>}
    {loading?<p className="rounded border bg-white p-8 text-sm text-stone-500">正在读取待发布项目…</p>:
      actionable.length===0&&!unknown?<p className="rounded border bg-white p-8 text-center text-sm text-stone-500">当前没有需要 Admin 发布的产品或修订。</p>:
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-stone-200 bg-stone-50 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" aria-label="全选待发布产品" disabled={busy||!actionable.length}
              checked={!!actionable.length&&selected.length===actionable.length}
              onChange={e=>setSelected(e.target.checked?actionable.map(getKey):[])} />
            选择全部 {actionable.length} 项
          </label>
          <button type="button" disabled={busy||selected.length===0}
            onClick={()=>void release(actionable.filter(item=>selected.includes(getKey(item))))}
            className="rounded bg-stone-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
            发布选中的 {selected.length} 项
          </button>
        </div>
        {actionable.map(item=>{
          const key=getKey(item);
          const image=firstImage(item.images);
          return <article key={key} className="rounded border border-stone-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-3">
              <input type="checkbox" aria-label={'选择发布 '+(item.name_cn||item.name)}
                disabled={busy} checked={selected.includes(key)}
                onChange={e=>setSelected(curr=>e.target.checked?[...curr,key]:curr.filter(x=>x!==key))}/>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-stone-100">
                {image?<img src={resolveImage(image)} alt="" className="h-full w-full object-cover"/>:
                  <span className="flex h-full items-center justify-center text-[10px] text-stone-400">产品</span>}
              </div>
              <div className="min-w-[160px] flex-1 space-y-1">
                <p className="text-sm font-semibold">{item.name_cn||item.name}</p>
                <p className="text-xs text-stone-500">{item.code||'未填写 SKU'} · {item.kind==='revision'?'产品修订':'新品'} · V{item.latest_version}</p>
                <p className="text-xs text-stone-500">{departmentOf(item.supervisor_id)} · 主管：{nameOf(item.supervisor_id)}</p>
              </div>
              <span className="text-xs text-amber-700">{item.status==='pending_admin'?'主管初审通过':'已终审待发布'}</span>
              <button type="button" disabled={busy} onClick={()=>void inspect(item)}
                aria-expanded={expanded===key}
                className="rounded border border-stone-300 px-3 py-2 text-xs text-stone-600">
                {expanded===key?'收起差异':'查看差异'}
              </button>
              {item.status==='pending_admin'&&<button type="button" disabled={busy}
                onClick={()=>{setReturnKey(returnKey===key?null:key);setReason('');}}
                className="rounded border border-red-200 px-3 py-2 text-xs text-red-700">退回主管</button>}
              <button type="button" disabled={busy} onClick={()=>void release([item])}
                className="rounded bg-stone-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">确认发布</button>
            </div>
            {returnKey===key&&item.status==='pending_admin'&&
              <div className="mt-3 space-y-2 border-t pt-3">
                <textarea aria-label="退回主管原因" value={reason} maxLength={2000}
                  onChange={e=>setReason(e.target.value)} rows={2} placeholder="说明需要主管重新核查的内容（至少 5 字）"
                  className="w-full rounded border p-2 text-sm"/>
                <button type="button" disabled={busy||reason.trim().length<5}
                  onClick={()=>void returnToSupervisor(item,reason)}
                  className="rounded bg-red-700 px-4 py-2 text-xs text-white disabled:opacity-40">确认退回主管</button>
              </div>}
            {expanded===key&&<div className="mt-3 rounded border-t border-stone-200 p-3 text-xs">
              {!detail?<p className="text-stone-500">正在加载变更差异…</p>:
                <div className="space-y-2">
                  <p className="font-semibold">提交内容与原版本差异（可选核查）</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all bg-stone-50 p-3">
                      {JSON.stringify(item.kind==='revision'?detail.base_snapshot:
                        detail.versions?.[0]?.snapshot||{},null,2)}
                    </pre>
                    <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-all bg-stone-50 p-3">
                      {JSON.stringify(item.kind==='revision'?detail.draft:
                        detail.versions?.[detail.versions.length-1]?.snapshot||{},null,2)}
                    </pre>
                  </div>
                </div>}
            </div>}
          </article>;
        })}
      </div>}
  </section>;
};
export default AdminReleaseQueue;
