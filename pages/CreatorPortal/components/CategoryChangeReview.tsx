import React, { useEffect, useState } from 'react';
import { CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';
import { resolveImage } from '../../../utils/imageResolver';

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
    <section className="bg-white border border-stone-200 p-6 mb-8">
      <header className="flex items-center justify-between gap-4 mb-4">
        <div><h3 className="font-serif text-xl">待审核 · 已有分类修改（{rows.length}）</h3>
        <p className="text-xs text-stone-500 mt-1">对比原值与工厂申请值；批准仅更新网站草稿，不直接发布。</p></div>
        <button disabled={busy} className="border px-3 py-2 text-xs flex gap-2 items-center" onClick={()=>void load()}><RefreshCw size={14}/>刷新</button>
      </header>
      {error && <div role="alert" className="bg-amber-50 text-amber-900 text-sm p-3 mb-3">{error}</div>}
      {notice && <div role="status" className="bg-green-50 text-green-800 text-sm p-3 mb-3">{notice}</div>}
      {!rows.length&&!error&&<div className="text-stone-500 text-sm py-5">目前没有待审核的分类修改。</div>}
      <div className="space-y-5">{rows.map(request=>{
        const altered=Object.keys(labels).filter(key=>request.base?.[key as keyof Payload]!==request.proposed?.[key as keyof Payload]);
        return <article key={request.id} className="border border-stone-200 p-5">
          <div className="flex flex-wrap justify-between gap-2 mb-4">
            <div><h4 className="font-semibold text-stone-900">{request.category_id}</h4>
              <p className="text-xs text-stone-500">申请人：{request.created_by} · {request.created_at}</p>
            </div>
            <span className="text-xs text-amber-800">pending</span>
          </div>
          <div className="grid lg:grid-cols-2 gap-5">
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
          <div className="flex justify-end gap-3 mt-4">
            <button disabled={busy} onClick={()=>void review(request,'reject')} className="border border-red-200 px-4 py-2 text-sm text-red-700 flex items-center gap-2"><XCircle size={15}/>驳回</button>
            <button disabled={busy} onClick={()=>void review(request,'approve')} className="bg-stone-900 px-4 py-2 text-white text-sm flex items-center gap-2"><CheckCircle size={15}/>批准并保存草稿</button>
          </div>
        </article>;
      })}</div>
    </section>
  );
};
export default CategoryChangeReview;
