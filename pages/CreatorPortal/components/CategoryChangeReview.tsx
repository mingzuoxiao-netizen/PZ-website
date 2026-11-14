import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';
import { resolveImage } from '../../../utils/imageResolver';
import {ListShell,EmptyState,Toast} from '../ui/BackofficeComponents';
import StatusChip from '../ui/StatusChip';

type Payload = { title: string; title_cn: string; subtitle: string; description: string; image: string };
type RequestItem = { id: string; category_id: string; status: string; base: Payload; proposed: Payload; created_by: string; created_at: string };
const labels: Record<string,string> = { title:'英文名称', title_cn:'中文名称', subtitle:'副标题', description:'说明', image:'分类封面' };
interface Props { onApproved: () => Promise<void> }

const CategoryChangeReview: React.FC<Props> = ({ onApproved }) => {
  const [rows,setRows] = useState<RequestItem[]>([]);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const load = async () => {
    try {
      const response = await adminFetch<{ items: RequestItem[] }>('admin/category-change-requests');
      setRows((response.items || []).filter(item => item.status === 'pending'));
      setError('');
    } catch (e:any) { setError('分类修改申请接口未就绪：'+(e?.message||'未知错误')); }
  };
  useEffect(()=>{void load();},[]);
  const review = async (request: RequestItem, action:'approve'|'reject') => {
    if (busy) return;
    if (!confirm(action==='approve'?'批准修改并保存到网站草稿？不会自动发布。':'确认驳回此分类修改申请？')) return;
    const reason = action==='reject' ? (prompt('填写驳回原因（可留空）') || '') : '';
    setBusy(true);setError('');setNotice('');
    try {
      const result = await adminFetch<{ success: boolean; status: string; needsPublish?: boolean }>(
        'admin/category-change-requests/'+encodeURIComponent(request.id)+'/'+action,
        { method:'POST', body:JSON.stringify({reason}) }
      );
      if (!result.success || result.status!==(action==='approve'?'approved':'rejected')) throw new Error('审核状态未确认，请刷新核对。');
      setNotice(action==='approve' ? '修改已批准并写入草稿。请在分类管理中核对，再独立发布网站。':'申请已驳回。');
      await Promise.all([load(),onApproved()]);
    } catch (e:any) { setError(e?.message||'审核失败');await load(); }
    finally {setBusy(false);}
  };
  return (
    <ListShell label="分类修改审核列表"><section className="bg-white border border-stone-200 p-6 mb-8">
      <header className="flex items-center justify-between gap-4 mb-4">
        <div><h3 className="font-serif text-xl">待审核 · 已有分类修改（{rows.length}）</h3>
        <p className="text-xs text-stone-500 mt-1">管理员可在简洁列表中直接处理；需要时再展开差异。当前分类修改接口只保存草稿，不会自动发布。</p></div>
        <button disabled={busy} className="border px-3 py-2 text-xs flex gap-2 items-center" onClick={()=>void load()}><RefreshCw size={14}/>刷新</button>
      </header>
      {error && <Toast variant="error" message={error}/>}
      {notice && <Toast message={notice}/>}
      {!rows.length&&!error&&<EmptyState message="目前没有待审核的分类修改。"/>}
      <div className="space-y-5">{rows.map(request=>{
        const altered=Object.keys(labels).filter(key=>request.base?.[key as keyof Payload]!==request.proposed?.[key as keyof Payload]);
        return <article key={request.id} className="rounded border border-stone-200 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-stone-100">
                {request.proposed?.image?<img src={resolveImage(request.proposed.image)} alt="" className="h-full w-full object-cover"/>:
                  <span className="flex h-full items-center justify-center text-[10px] text-stone-400">分类</span>}
              </div>
              <div><h4 className="text-sm font-semibold text-stone-900">{request.category_id}</h4>
                <p className="mt-1 text-xs text-stone-500">申请人：{request.created_by} · 修改 {altered.length} 项</p><StatusChip status="pending_admin"/></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button disabled={busy} onClick={()=>void review(request,'reject')}
                className="rounded border border-red-200 px-3 py-2 text-xs text-red-700">退回</button>
              <button disabled={busy} onClick={()=>void review(request,'approve')}
                className="rounded bg-stone-900 px-3 py-2 text-xs text-white">批准修改（保存草稿）</button>
            </div>
          </div>
          <details className="mt-3 border-t border-stone-100 pt-2">
            <summary className="cursor-pointer text-xs text-stone-600">查看修改前后差异（可选）</summary>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="border p-4 bg-stone-50">
              <h5 className="text-xs font-semibold mb-3 text-stone-500">原始内容</h5>
              {altered.map(key=><div key={key} className="mb-3">
                <p className="text-xs font-semibold text-stone-500 mb-1">{labels[key]}</p>
                {key==='image'?request.base.image?<img src={resolveImage(request.base.image)} alt="原封面" className="h-36 w-full object-cover"/>:'无封面'
                  :<p className="text-sm whitespace-pre-wrap break-words">{request.base[key as keyof Payload]||'（空）'}</p>}
              </div>)}
            </div>
            <div className="border p-4 bg-amber-50/50">
              <h5 className="text-xs font-semibold mb-3 text-amber-800">申请修改为</h5>
              {altered.map(key=><div key={key} className="mb-3">
                <p className="text-xs font-semibold text-stone-500 mb-1">{labels[key]}</p>
                {key==='image'?request.proposed.image?<img src={resolveImage(request.proposed.image)} alt="申请新封面" className="h-36 w-full object-cover"/>:'无封面'
                  :<p className="text-sm whitespace-pre-wrap break-words">{request.proposed[key as keyof Payload]||'（空）'}</p>}
              </div>)}
            </div>
          </div>
          </details>
        </article>;
      })}</div>
    </section></ListShell>
  );
};
export default CategoryChangeReview;
