import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../utils/adminFetch';

type Product = {
  id?: string; name?: string; name_cn?: string; code?: string;
  status?: string; created_by?: string;
};
type Member = {
  id: string; username: string; role: string; is_active: number;
  job_type: string | null; department_id: string | null;
  supervisor_id: string | null; department_name: string | null;
};
type Responsibility = {
  product_id: string; responsible_user_id: string; responsible_username: string;
  department_id: string; supervisor_id: string; assigned_by: string;
  version: number; updated_at: string;
};
type History = {
  id: number; old_user_id: string | null; new_user_id: string;
  actor_id: string; version: number; created_at: string;
};

const ProductResponsibilityManager: React.FC<{products: Product[]}> = ({products}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [responsibilities, setResponsibilities] = useState<Responsibility[]>([]);
  const [productId, setProductId] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [search, setSearch] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<History[] | null>(null);

  const refresh = useCallback(async () => {
    const [assigned, users] = await Promise.all([
      adminFetch<{items: Responsibility[]}>('/admin/product-responsibilities'),
      adminFetch<{users: Member[]}>('/admin/org/accounts'),
    ]);
    setResponsibilities(assigned.items || []);
    setMembers(users.users || []);
    setEnabled(true);
  }, []);
  useEffect(() => {
    void refresh().catch(e => {
      setEnabled(false);
      setError(e?.message || '产品负责人授权暂不可用。请先完成 Migration 013 和 Worker 功能开关。');
    });
  }, [refresh]);

  const published = useMemo(() => products.filter(p =>
    p.id && p.status === 'published' &&
    [p.code, p.name, p.name_cn].some(v => (v || '').toLowerCase().includes(search.trim().toLowerCase()))
  ), [products,search]);

  const staff = useMemo(() => members.filter(m =>
    m.is_active === 1 && ['staff','secretary','data_entry'].includes(m.job_type || '') &&
    !!m.department_id && !!m.supervisor_id &&
    members.some(supervisor => supervisor.id === m.supervisor_id &&
      supervisor.department_id === m.department_id && supervisor.job_type === 'supervisor' &&
      supervisor.is_active === 1)
  ), [members]);

  const product = products.find(p => p.id === productId);
  const current = responsibilities.find(r => r.product_id === productId);
  const selectedStaff = staff.find(m => m.id === responsibleId);
  const creator = members.find(m => m.id === product?.created_by);
  const currentName = current?.responsible_username || '未指定';
  const selectProduct = (next: string) => {
    setProductId(next);
    setResponsibleId(responsibilities.find(r => r.product_id === next)?.responsible_user_id || '');
    setMessage('');
    setError('');
    setHistory(null);
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if(!productId || !responsibleId || busy || !selectedStaff) return;
    if(current?.responsible_user_id === responsibleId){
      setMessage('当前负责人已经是该业务人员，无需重复授权。');return;
    }
    const confirmText = `确认将 ${product?.code || '该产品'} 授权给 ${selectedStaff.username}？\n`+
      '原始上传人不会改变。新的负责人可发起修订申请，主管仍需初审、管理员终审后才能发布。';
    if(!window.confirm(confirmText))return;
    setBusy(true);setError('');setMessage('');
    try{
      const response=await adminFetch<{success:boolean}>(
        '/admin/product-responsibilities/'+encodeURIComponent(productId),{
        method:'PUT',
        body:JSON.stringify({responsible_user_id:responsibleId,expected_version:current?.version || 0}),
      });
      if(response.success!==true)throw Error('服务器未确认授权，请刷新核实。');
      await refresh();
      setHistory(null);
      setMessage('负责人授权成功。产品原始上传记录与已发布内容保持不变。');
    }catch(e:any){
      setError(e?.message || '负责人授权失败，请刷新后重新核对。');
    }finally{setBusy(false);}
  };
  const showHistory = async () => {
    if(!productId)return;
    setError('');
    try{
      const response=await adminFetch<{items:History[]}>(
        '/admin/product-responsibilities/'+encodeURIComponent(productId)+'/events');
      setHistory(response.items || []);
    }catch(e:any){setError(e?.message || '无法读取授权记录。');}
  };

  return <section className="rounded border border-stone-200 bg-white p-5 space-y-4" aria-label="历史产品负责人授权">
    <header>
      <h2 className="font-serif text-xl text-stone-900">历史产品负责人授权</h2>
      <p className="mt-2 text-sm text-stone-600">
        为已发布产品指定后续维护人员。原始上传人不变；授权只决定谁能提交修订申请，
        不会直接修改官网产品，审批与发布流程照旧。
      </p>
    </header>
    {!enabled && <p role="status" className="rounded bg-amber-50 p-3 text-sm text-amber-900">
      第四阶段功能尚未启用。先在 Staging 完成 Migration 013 并启用对应 Worker 开关。
    </p>}
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {enabled && <form className="space-y-3" onSubmit={e=>{void submit(e);}}>
      <label className="block text-sm font-medium text-stone-800">查找已发布产品
        <input aria-label="搜索已发布产品" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="输入 SKU、中文名或英文名" className="mt-1 w-full border border-stone-300 p-3 text-sm" />
      </label>
      <label className="block text-sm font-medium text-stone-800">选择产品
        <select aria-label="选择负责人授权产品" value={productId}
          onChange={e=>selectProduct(e.target.value)} className="mt-1 w-full border border-stone-300 p-3 text-sm">
          <option value="">请选择已发布产品（共 {published.length} 件匹配）</option>
          {published.map(p=><option key={p.id} value={p.id}>
            {p.code || p.id} — {p.name_cn || p.name}
          </option>)}
        </select>
      </label>
      {product && <div className="rounded bg-stone-50 p-3 text-sm text-stone-700">
        <div>原始上传人：<strong>{creator?.username || product.created_by || '历史记录缺失'}</strong>（不修改）</div>
        <div>当前授权负责人：<strong>{currentName}</strong></div>
        {current && <div>授权版本：V{current.version}</div>}
      </div>}
      <label className="block text-sm font-medium text-stone-800">指定维护负责人
        <select aria-label="指定业务人员" disabled={!productId} value={responsibleId}
          onChange={e=>setResponsibleId(e.target.value)} className="mt-1 w-full border border-stone-300 p-3 text-sm">
          <option value="">请选择在职的部门业务人员</option>
          {staff.map(m=><option key={m.id} value={m.id}>
            {m.username} — {m.department_name || m.department_id}（{m.job_type==='secretary'?'秘书':m.job_type==='data_entry'?'资料录入员':'业务人员'}）
          </option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy || !productId || !selectedStaff || current?.responsible_user_id===responsibleId}
          className="rounded bg-stone-900 px-5 py-3 text-sm text-white disabled:opacity-40">
          {busy?'正在保存…':'确认授权'}
        </button>
        <button type="button" disabled={!productId} onClick={()=>void showHistory()}
          className="rounded border border-stone-300 px-5 py-3 text-sm text-stone-700 disabled:opacity-40">
          查看授权历史
        </button>
      </div>
      {history && <div className="rounded border border-stone-200 p-3 text-xs text-stone-700">
        <p className="mb-2 font-semibold">授权历史（不可修改）</p>
        {!history.length && <p>暂无授权记录。</p>}
        {history.map(h=><p key={h.id} className="border-t border-stone-100 py-2">
          V{h.version}：{members.find(m=>m.id===h.old_user_id)?.username || '未指定'} →
          {members.find(m=>m.id===h.new_user_id)?.username || h.new_user_id}，
          操作人 {members.find(m=>m.id===h.actor_id)?.username || h.actor_id} · {h.created_at}
        </p>)}
      </div>}
    </form>}
  </section>;
};
export default ProductResponsibilityManager;
