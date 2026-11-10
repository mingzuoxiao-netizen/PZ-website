import React, {useCallback,useEffect,useState} from 'react';
import {factoryFetch} from '../../../utils/factoryFetch';
import PZImageManager from './PZImageManager';

export type NewCategoryItem={
  id:string;title:string;title_cn:string;subtitle:string;image:string;
  status:string;created_at:string;updated_at:string;
  reject_reason?:string|null;supervisor_name?:string|null;legacy?:boolean;
  events?:{revision:number;action:string;actor_id:string;note?:string|null;created_at:string}[];
};
const labels:Record<string,string>={
  pending_supervisor:'待部门主管初审',
  pending_admin:'主管已通过 · 待 Admin 终审',
  returned_to_supervisor:'Admin 已退回主管',
  returned_to_uploader:'已退回 · 请修改后重提',
  approved:'Admin 已批准 · 待网站发布',
  published:'已发布',pending:'历史申请 · 待 Admin 审核',
  awaiting_review:'历史申请 · 待 Admin 审核',
  rejected:'历史申请 · 已驳回'
};
type Props={onUpload:(file:File)=>Promise<string>;refreshKey?:number};
const NewCategoryRequestHistory:React.FC<Props>=({onUpload,refreshKey})=>{
  const [items,setItems]=useState<NewCategoryItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [editing,setEditing]=useState<NewCategoryItem|null>(null);
  const [draft,setDraft]=useState({title:'',title_cn:'',subtitle:'',image:''});
  const refresh=useCallback(async()=>{
    setLoading(true);
    try {
      const res=await factoryFetch<{items:NewCategoryItem[]}>('factory/category-requests');
      setItems(res.items||[]);
      setError('');
    }catch(e:any){setError('暂时无法读取新品类申请记录：'+(e?.message||'请检查接口')); }
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh,refreshKey]);
  const edit=(item:NewCategoryItem)=>{
    setEditing(item);
    setDraft({title:item.title,title_cn:item.title_cn,subtitle:item.subtitle||'',image:item.image||''});
    setError('');setMessage('');
  };
  const resubmit=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!editing||busy)return;
    if(!draft.title.trim()||!draft.title_cn.trim()||!draft.image){setError('中英文名称和封面不能为空。');return;}
    setBusy(true);setError('');setMessage('');
    try {
      const result=await factoryFetch<{success:boolean;status:string}>(
        'factory/category-requests/'+encodeURIComponent(editing.id)+'/resubmit',
        {method:'POST',body:JSON.stringify(draft)}
      );
      if(!result.success||result.status!=='pending_supervisor')throw Error('服务器没有确认主管待审状态。');
      setEditing(null);
      setMessage('已按原申请重新提交，正在等待主管初审。');
      await refresh();
    }catch(e:any){setError(e?.message||'重新提交失败，请刷新确认状态。');}
    finally{setBusy(false);}
  };
  return <section className="space-y-4 border border-stone-200 bg-white p-5">
    <div className="flex items-center justify-between gap-3">
      <div><h3 className="font-semibold">我的新品类申请（{items.length}）</h3>
        <p className="mt-1 text-xs text-stone-500">提交、主管初审、Admin 终审及退回记录均在这里查看。</p></div>
      <button disabled={busy||loading} type="button" onClick={()=>void refresh()}
        className="rounded border px-3 py-2 text-xs disabled:opacity-50">刷新申请</button>
    </div>
    {error&&<p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message&&<p role="status" className="rounded border border-green-200 bg-green-50 p-3 text-sm">{message}</p>}
    {loading?<p className="text-sm text-stone-500">正在读取申请…</p>:
      items.length===0?<p className="text-sm text-stone-500">暂无可以归属到当前账号的新品类申请。</p>:
      <div className="space-y-3">{items.map(item=>
        <div key={item.id} className="rounded border border-stone-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div><p className="font-semibold">{item.title_cn||item.title} <span className="text-sm font-normal text-stone-500">{item.title}</span></p>
              <p className="mt-1 text-xs text-stone-500">{item.created_at}
                {item.supervisor_name?' · 主管：'+item.supervisor_name:''}</p></div>
            <span className={item.status.startsWith('returned')?'text-sm text-red-700':'text-sm text-amber-800'}>
              {labels[item.status]||item.status}</span>
          </div>
          {item.reject_reason&&<p className="mt-2 text-sm text-red-700">退回原因：{item.reject_reason}</p>}
          {item.events?.length ? <details className="mt-3 rounded border border-stone-100 bg-stone-50 p-3">
            <summary className="cursor-pointer text-xs font-medium text-stone-700">
              查看历次审核记录（{item.events.length}）
            </summary>
            <ol className="mt-3 space-y-2">
              {item.events.map((ev,index)=><li key={ev.revision+'-'+ev.action+'-'+index}
                className="border-l-2 border-stone-300 pl-3 text-xs text-stone-600">
                <span className="font-medium">{({
                  submitted:'首次提交',supervisor_approved:'主管通过',supervisor_returned:'主管退回',
                  admin_approved:'管理员批准',admin_returned:'管理员退回',resubmitted:'修改后重提'
                } as Record<string,string>)[ev.action]||ev.action}</span>
                <span className="ml-2">{ev.created_at}</span>
                {ev.note&&<p className="mt-1 text-red-700">审核意见：{ev.note}</p>}
              </li>)}
            </ol>
          </details> : null}
          {item.status==='returned_to_uploader'&&
            <button type="button" onClick={()=>edit(item)}
              className="mt-3 rounded bg-stone-900 px-4 py-2 text-sm text-white">修改并重新提交</button>}
        </div>)}</div>}
    {editing&&<form onSubmit={e=>void resubmit(e)} className="space-y-3 rounded border border-amber-300 bg-amber-50 p-4">
      <h4 className="font-semibold">修改被退回的新品类：{editing.title_cn||editing.title}</h4>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs">英文名称
          <input aria-label="重新提交英文名称" required maxLength={100} value={draft.title}
            onChange={e=>setDraft(s=>({...s,title:e.target.value}))}
            className="mt-1 w-full rounded border p-2 text-sm"/></label>
        <label className="text-xs">中文名称
          <input aria-label="重新提交中文名称" required maxLength={100} value={draft.title_cn}
            onChange={e=>setDraft(s=>({...s,title_cn:e.target.value}))}
            className="mt-1 w-full rounded border p-2 text-sm"/></label>
      </div>
      <label className="block text-xs">副标题
        <textarea aria-label="重新提交副标题" maxLength={200} value={draft.subtitle}
          onChange={e=>setDraft(s=>({...s,subtitle:e.target.value}))}
          className="mt-1 block w-full rounded border p-2 text-sm"/></label>
      <PZImageManager images={draft.image?[draft.image]:[]}
        onUpdate={images=>setDraft(s=>({...s,image:images[0]||''}))}
        onUpload={onUpload} onError={setError} maxImages={1}/>
      <div className="flex gap-2">
        <button disabled={busy||!draft.image} className="rounded bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-50">重新提交主管初审</button>
        <button type="button" disabled={busy} onClick={()=>setEditing(null)} className="rounded border px-4 py-2 text-sm">取消</button>
      </div>
    </form>}
  </section>;
};
export default NewCategoryRequestHistory;
