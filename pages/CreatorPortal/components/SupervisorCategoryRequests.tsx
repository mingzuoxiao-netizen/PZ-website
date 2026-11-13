import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';
import StatusChip from '../ui/StatusChip';
import {ListShell,ListSkeleton,EmptyState,Toast,Button} from '../ui/BackofficeComponents';

type RequestItem = {
  id:string;title:string;title_cn:string;subtitle:string;image:string;
  status:string;published?:boolean;created_at:string;updated_at:string;
  submitter_name?:string|null;reject_reason?:string|null;
};
const SupervisorCategoryRequests:React.FC=()=>{
  const [items,setItems]=useState<RequestItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [rejectId,setRejectId]=useState<string|null>(null);
  const [reason,setReason]=useState('');
  const refresh=useCallback(async()=>{
    setLoading(true);
    try{
      const result=await adminFetch<{items:RequestItem[]}>('/supervisor/category-requests');
      setItems(result.items||[]);
      setError('');
    }catch(e:any){setError(e?.message||'无法读取新品类申请。');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const act=async(id:string,action:'approve'|'reject')=>{
    if(busy)return;
    const note=reason.trim();
    if(action==='reject'&&!note){setError('请填写退回原因。');return;}
    setBusy(true);setError('');setNotice('');
    try{
      const result=await adminFetch<{success:boolean;status:string}>(
        '/supervisor/category-requests/'+encodeURIComponent(id)+'/'+action,{
          method:'POST',body:JSON.stringify({note:action==='reject'?note:''})
        });
      if(!result.success)throw Error('操作未确认');
      setNotice(action==='approve'?'已提交 Admin 终审。':'已退回员工，并保存了退回原因。');
      setRejectId(null);setReason('');
      await refresh();
    }catch(e:any){setError(e?.message||'审核未完成，请刷新后重试。');}
    finally{setBusy(false);}
  };
  return <ListShell label="新品类初审列表"><div className="space-y-4 p-4 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="font-serif text-2xl">新品类申请 · 主管初审</h1>
      <p className="mt-1 text-sm text-stone-500">仅显示自己部门的申请。主管通过后交给 Admin；退回将保留原因和记录。</p></div>
      <button onClick={()=>void refresh()} disabled={loading||busy} className="rounded border px-4 py-2 text-sm disabled:opacity-50">刷新</button>
    </header>
    {error&&<Toast variant="error" message={error}/>}
    {notice&&<Toast message={notice}/>}
    {loading?<ListSkeleton/>:
      !items.length?<EmptyState message="当前部门没有新品类申请。"/>:
      <div className="space-y-3">{items.map(item=>{
        const reviewable=['pending_supervisor','returned_to_supervisor'].includes(item.status);
        return <article key={item.id} className="rounded border border-stone-200 bg-white p-5">
          <div className="flex flex-wrap justify-between gap-3">
            <div><h2 className="font-semibold">{item.title_cn||item.title} <span className="text-sm text-stone-500">{item.title}</span></h2>
            <p className="mt-1 text-xs text-stone-500">申请人：{item.submitter_name||'—'} · {item.created_at}</p>
            {item.subtitle&&<p className="mt-2 text-sm">{item.subtitle}</p>}
            {item.reject_reason&&<p className="mt-2 text-xs text-red-700">上次退回原因：{item.reject_reason}</p>}</div>
            <StatusChip status={item.status==='approved'&&item.published?'published':item.status}/>
          </div>
          {item.image&&<img src={item.image} alt="拟新增分类封面" className="mt-3 h-28 w-44 rounded object-cover" />}
          {reviewable&&(rejectId===item.id?
            <div className="mt-4 space-y-2">
              <textarea aria-label="新品类退回原因" value={reason} maxLength={500}
                onChange={e=>setReason(e.target.value)}
                className="w-full rounded border p-3 text-sm" placeholder="说明需要修改的内容（必填）"/>
              <div className="flex gap-2">
                <button type="button" disabled={busy||!reason.trim()} onClick={()=>void act(item.id,'reject')}
                  className="rounded bg-red-700 px-4 py-2 text-sm text-white disabled:opacity-50">确认退回员工</button>
                <button type="button" disabled={busy} onClick={()=>{setRejectId(null);setReason('');}}
                  className="rounded border px-4 py-2 text-sm">取消</button>
              </div>
            </div>:
            <div className="mt-4 flex gap-2">
              <button type="button" disabled={busy} onClick={()=>void act(item.id,'approve')}
                className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">初审通过 · 交 Admin</button>
              <button type="button" disabled={busy} onClick={()=>{setRejectId(item.id);setReason('');}}
                className="rounded border border-red-200 px-4 py-2 text-sm text-red-700">退回员工</button>
            </div>)}
        </article>;
      })}</div>}
  </div></ListShell>;
};
export default SupervisorCategoryRequests;
