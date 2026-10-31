import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Send, RefreshCw } from 'lucide-react';
import { factoryFetch } from '../../../utils/factoryFetch';
import { Category } from '../../../types';
import PZImageManager from './PZImageManager';
import { resolveImage } from '../../../utils/imageResolver';

type Editable = { title: string; title_cn: string; subtitle: string; description: string; image: string };
const fromCategory = (category: Category): Editable => ({
  title: category.title || '',
  title_cn: category.title_cn || category.title_zh || '',
  subtitle: category.subtitle || '',
  description: category.description || '',
  image: category.image || ''
});
type Item = { id: string; category_id: string; status: string; created_at: string; proposed: Editable; reject_reason?: string | null };
interface Props {
  categories: Category[];
  onUpload: (file: File) => Promise<string>;
}
const FactoryCategoryManagement: React.FC<Props> = ({ categories, onUpload }) => {
  const [categoryId, setCategoryId] = useState('');
  const [form, setForm] = useState<Editable | null>(null);
  const [requests, setRequests] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const selected = categories.find(category => category.id === categoryId);
  const original = selected ? fromCategory(selected) : null;
  const changed = !!(form && original && JSON.stringify(form) !== JSON.stringify(original));
  const choose = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setCategoryId(id);
    setForm(cat ? fromCategory(cat) : null);
    setError(''); setNotice('');
  };
  const refresh = async () => {
    try {
      const data = await factoryFetch<{ items: Item[] }>('factory/category-change-requests');
      setRequests(data.items || []);
    } catch (e: any) {
      setError('申请记录暂不可读取：' + (e?.message || '网络错误'));
    }
  };
  useEffect(() => { void refresh(); }, []);

  const submit = async () => {
    if (!selected || !original || !form || !changed || busy) return;
    if (!form.title.trim()) { setError('英文名称不能为空。'); return; }
    if (!confirm('确认提交分类修改申请吗？管理员批准前，网站不会发生变化。')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const proposed: Partial<Editable> = {};
      for (const key of Object.keys(form) as (keyof Editable)[]) {
        if (form[key] !== original[key]) proposed[key] = form[key];
      }
      const result = await factoryFetch<{ success: boolean; status: string; id: string }>('factory/category-change-requests', {
        method:'POST', body:JSON.stringify({ category_id: selected.id, proposed })
      });
      if (!result.success || result.status !== 'pending') throw new Error('服务器未确认待审核状态。');
      setNotice('申请已提交，状态 pending。原分类信息不会立即改变。');
      choose(selected.id);
      await refresh();
    } catch (e:any) { setError(e?.message || '提交失败'); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-6 pb-24">
      <header className="bg-white border border-stone-200 p-6">
        <h2 className="font-serif text-2xl">产品分类 · 修改申请</h2>
        <p className="text-sm text-stone-500 mt-2">选择已发布分类，修改中英文名称、简介或封面，再提交管理员审核。不能直接修改网站。</p>
        <p className="text-xs text-amber-800 mt-2">每个分类同时只允许一条待审核修改申请。已有申请请先等待批准或驳回。</p>
      </header>
      {error && <div role="alert" className="border border-red-300 bg-red-50 text-red-800 p-3 text-sm">{error}</div>}
      {notice && <div role="status" className="border border-green-300 bg-green-50 text-green-800 p-3 text-sm">{notice}</div>}
      <div className="grid lg:grid-cols-[300px_1fr] gap-5">
        <aside className="border bg-white p-4">
          <h3 className="font-semibold mb-4">所有已发布分类</h3>
          {categories.map(category => <button key={category.id} onClick={() => choose(category.id)}
            className={'block w-full text-left px-4 py-3 border-b text-sm ' + (categoryId === category.id ? 'bg-amber-50 text-amber-900' : '')}>
            {category.title_zh || category.title_cn || category.title}
            <span className="block text-xs text-stone-400">{category.id}</span>
            {requests.some(r=>r.category_id===category.id && r.status==='pending') &&
              <span className="text-xs text-amber-700">修改审核中</span>}
          </button>)}
        </aside>
        <main className="border bg-white p-6">
          {!selected || !form ? <p className="text-sm text-stone-500">请从左侧选择一个分类，填写修改内容。</p> : (
            <div className="space-y-5">
              <h3 className="font-serif text-xl">{selected.title_zh || selected.title} · 申请修改</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {([
                  {field:'title',label:'英文名称'}, {field:'title_cn',label:'中文名称'},
                  {field:'subtitle',label:'副标题'}, {field:'description',label:'英文说明'}
                ] as {field:keyof Editable;label:string}[]).map(({field,label})=>(
                  <label key={field} className="text-xs font-medium text-stone-600">
                    {label}
                    <textarea className="block border w-full p-2 mt-2 text-sm" rows={field==='description'?3:1}
                      value={form[field]} onChange={e=>setForm(prev=>prev?{...prev,[field]:e.target.value}:null)}/>
                    {original && form[field] !== original[field] && <span className="text-amber-700">有修改 · 原值：{original[field] || '空'}</span>}
                  </label>
                ))}
              </div>
              <section className="border-t pt-5">
                <h4 className="font-semibold mb-3">分类封面（上传只保存到当前环境 R2，审核批准前不会公开）</h4>
                {original?.image && <img src={resolveImage(original.image)} alt="当前正式封面" className="w-full max-w-md h-36 object-cover mb-4"/>}
                <PZImageManager images={form.image?[form.image]:[]} onUpdate={urls=>setForm(prev=>prev?{...prev,image:urls[0]||''}:null)}
                  onUpload={onUpload} maxImages={1}/>
                {form.image!==original?.image && <p className="text-xs text-amber-800 mt-2">新旧封面不同，管理员将看到修改前后对比。</p>}
              </section>
              <button onClick={()=>void submit()} disabled={busy || !changed || requests.some(r=>r.category_id===categoryId && r.status==='pending')}
                className="px-6 py-3 bg-stone-900 text-white text-sm inline-flex items-center gap-2 disabled:opacity-40">
                <Send size={16}/>提交修改申请
              </button>
            </div>
          )}
        </main>
      </div>
      <section className="bg-white border p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2"><ClipboardCheck size={16}/>我的分类修改记录</h3>
          <button className="border px-3 py-2 text-xs flex items-center gap-2" onClick={()=>void refresh()}><RefreshCw size={14}/>刷新</button>
        </div>
        {requests.length===0?<p className="text-sm text-stone-500">暂时没有修改申请。</p>:requests.map(r=>(
          <div key={r.id} className="border-t py-3 text-sm flex flex-wrap gap-3 justify-between">
            <div><strong>{categories.find(c=>c.id===r.category_id)?.title||r.category_id}</strong>
              <span className="text-xs text-stone-500 ml-2">{r.created_at}</span>
              {r.reject_reason && <p className="text-red-700 text-xs">退回原因：{r.reject_reason}</p>}
            </div>
            <span className={r.status==='pending'?'text-amber-700':'text-stone-600'}>{r.status}</span>
          </div>
        ))}
      </section>
    </div>
  );
};
export default FactoryCategoryManagement;
