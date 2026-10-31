import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Globe, Image as ImageIcon, Plus, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import PZImageManager from './PZImageManager';
import { resolveImage } from '../../../utils/imageResolver';

type AnyCategory = Record<string, any>;
type Approved = { id: string; title: string; title_cn?: string; subtitle?: string; image?: string; status: string };
interface Props {
  categories: AnyCategory[];
  approvedRequests: Approved[];
  onSave: (next: AnyCategory[], expected: AnyCategory[]) => Promise<void>;
  onPublish: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onUpload: (file: File) => Promise<string>;
}

const copy = (value: any) => JSON.parse(JSON.stringify(value));
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const CategoryManagement: React.FC<Props> = ({ categories, approvedRequests, onSave, onPublish, onRefresh, onUpload }) => {
  const [draft, setDraft] = useState<AnyCategory[]>(() => copy(categories || []));
  const [baseline, setBaseline] = useState<AnyCategory[]>(() => copy(categories || []));
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(copy(categories || []));
    setBaseline(copy(categories || []));
  }, [categories]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const selectedCategory = draft.find(c => c.id === selected);
  const hiddenCount = draft.filter(c => c.hidden).length;
  const approvedUnlinked = useMemo(() => approvedRequests.filter(r => r.status === 'approved' &&
    !draft.some(c => c.proposal_id === r.id)), [approvedRequests, draft]);

  const patch = (id: string, field: string, value: any) => {
    setDraft(old => old.map(c => c.id === id ? { ...c, [field]: value } : c));
  };
  const move = (id: string, offset: number) => {
    setDraft(old => {
      const next = copy(old);
      const index = next.findIndex((c: AnyCategory) => c.id === id);
      const target = index + offset;
      if (index < 0 || target < 0 || target >= next.length) return old;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };
  const add = () => {
    const title = prompt('请输入新分类的英文名称（生成固定分类 ID）')?.trim();
    if (!title) return;
    const id = slugify(title);
    if (!id || draft.some(c => c.id.toLowerCase() === id || String(c.title || '').toLowerCase() === title.toLowerCase())) {
      setError('该分类名称无法生成有效 ID，或分类已存在。');
      return;
    }
    setDraft(old => [...old, { id, title, title_cn: '', subtitle: '', description: '', image: '', subCategories: [], hidden: true }]);
    setSelected(id);
    setError('');
    setMessage('新分类已加入草稿，默认隐藏；取消隐藏并发布后才会公开。');
  };
  const importApproved = (r: Approved) => {
    const base = slugify(r.title) || 'category-' + r.id.slice(0, 8);
    if (draft.some(c => c.proposal_id === r.id || c.id === base || c.title?.toLowerCase() === r.title.toLowerCase())) {
      setError('名称或分类 ID 已存在，请先核对已有分类。');
      return;
    }
    setDraft(old => [...old, {
      id: base, title: r.title, title_cn: r.title_cn || '', title_zh: r.title_cn || '',
      subtitle: r.subtitle || '', description: '', image: r.image || '',
      subCategories: [], source: 'proposal', proposal_id: r.id, hidden: true
    }]);
    setSelected(base);
    setMessage('已批准申请已加入本地草稿，并默认隐藏。保存草稿后才会进入网站配置；发布前请检查封面。');
  };
  const updateSub = (id: string, index: number, key: string, value: string) => {
    setDraft(old => old.map(c => c.id !== id ? c : {
      ...c,
      subCategories: (c.subCategories || []).map((s: any, i: number) => i === index ? { ...s, [key]: value } : s)
    }));
  };
  const submit = async (action: 'save' | 'publish' | 'refresh') => {
    setError(''); setMessage(''); setBusy(true);
    try {
      if (action === 'save') {
        const ids = new Set<string>();
        for (const c of draft) {
          if (!c.id || !c.title?.trim()) throw new Error('所有分类都必须填写英文名称。');
          if (ids.has(c.id.toLowerCase())) throw new Error('存在重复分类 ID。');
          ids.add(c.id.toLowerCase());
        }
        await onSave(copy(draft), copy(baseline));
        setBaseline(copy(draft));
        setMessage('分类草稿已保存，公开网站仍未改变。');
      } else if (action === 'publish') {
        if (dirty) throw new Error('请先保存修改，再发布网站。');
        if (!confirm('确定发布已保存的整个网站配置吗？')) return;
        await onPublish();
        setMessage('发布完成。请在正式网站或 Preview 验证。');
      } else {
        if (dirty && !confirm('放弃尚未保存的分类修改吗？')) return;
        await onRefresh();
        setMessage('已重新读取服务端草稿。');
      }
    } catch (e: any) { setError(e?.message || '操作失败'); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-[1500px] mx-auto pb-24 space-y-5">
      <header className="bg-white border border-stone-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="font-serif text-2xl text-stone-900">产品分类管理</h2>
            <p className="text-sm text-stone-500 mt-2">全部正式分类统一管理 · {draft.length} 个分类 · {hiddenCount} 个隐藏</p>
            <p className="text-xs text-amber-700 mt-2">分类 ID 固定；隐藏代替删除。保存草稿与发布是两步独立操作。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void submit('refresh')} disabled={busy} className="border px-4 py-2 text-sm flex items-center gap-2"><RefreshCw size={15}/>刷新</button>
            <button onClick={add} disabled={busy} className="border px-4 py-2 text-sm flex items-center gap-2"><Plus size={15}/>新增分类</button>
            <button onClick={() => void submit('save')} disabled={busy || !dirty} className="bg-stone-900 text-white px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-40"><Save size={15}/>保存草稿</button>
            <button onClick={() => void submit('publish')} disabled={busy || dirty} className="bg-amber-800 text-white px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-40"><Globe size={15}/>发布网站</button>
          </div>
        </div>
      </header>
      {dirty && <div className="border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">有未保存的分类更改，网站访客暂时看不到。</div>}
      {message && <div role="status" className="border border-stone-300 bg-white p-3 text-sm">{message}</div>}
      {error && <div role="alert" className="border border-red-300 text-red-700 bg-red-50 p-3 text-sm">{error}</div>}
      <div className="grid lg:grid-cols-[340px_1fr] gap-5 items-start">
        <aside className="bg-white border border-stone-200 p-4 max-h-[76vh] overflow-y-auto">
          <h3 className="font-semibold text-sm mb-3">所有分类（含隐藏）</h3>
          {draft.map((c, index) => (
            <div key={c.id} className={'flex items-center gap-2 border-b py-2 ' + (selected === c.id ? 'bg-amber-50' : '')}>
              <button onClick={() => setSelected(c.id)} className="min-w-0 flex-1 text-left px-2 py-1">
                <span className="block truncate text-sm font-medium">{c.title_cn || c.title_zh || c.title || '未命名分类'}</span>
                <span className="text-[10px] text-stone-400">{c.id}</span>
                {c.hidden && <span className="ml-2 text-xs text-amber-700">已隐藏</span>}
              </button>
              <button title="上移" aria-label={'上移 '+c.id} disabled={index === 0} onClick={() => move(c.id,-1)} className="disabled:opacity-20"><ArrowUp size={15}/></button>
              <button title="下移" aria-label={'下移 '+c.id} disabled={index === draft.length-1} onClick={() => move(c.id,1)} className="disabled:opacity-20"><ArrowDown size={15}/></button>
            </div>
          ))}
          {approvedUnlinked.length > 0 && (
            <div className="border-t-2 mt-5 pt-4">
              <div className="flex items-center gap-2 text-amber-800 text-sm font-semibold"><ShieldAlert size={16}/>已批准但不在配置中的申请</div>
              <p className="text-xs text-stone-500 mt-1 mb-3">可人工导入草稿；不会修改原 D1 审批记录或直接公开。</p>
              {approvedUnlinked.map(r => <div key={r.id} className="py-2 flex items-center gap-2 border-b">
                <span className="text-sm flex-1 truncate">{r.title_cn || r.title}</span>
                <button onClick={() => importApproved(r)} className="text-xs border px-2 py-1">导入草稿</button>
              </div>)}
            </div>
          )}
        </aside>
        <main className="bg-white border border-stone-200 p-6">
          {!selectedCategory ? <p className="text-stone-500 text-sm">在左侧选择分类，即可编辑中英文名称、说明、封面、子分类及隐藏状态。</p> : (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-xl">编辑分类：{selectedCategory.title || selectedCategory.id}</h3>
                <p className="text-xs text-stone-500 mt-2">稳定 ID：{selectedCategory.id}（不能通过改名修改）</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key:'title',label:'英文名称 *' },{ key:'title_cn',label:'中文名称' },
                  { key:'subtitle',label:'英文副标题' },{ key:'subtitle_zh',label:'中文副标题' },
                  { key:'description',label:'英文说明' },{ key:'description_zh',label:'中文说明' }
                ].map(field => <label key={field.key} className="text-xs font-medium text-stone-600">{field.label}
                  <textarea rows={field.key.startsWith('description') ? 3 : 1} value={String(selectedCategory[field.key] || '')}
                    onChange={e => patch(selectedCategory.id,field.key,e.target.value)}
                    className="block w-full border border-stone-200 p-3 mt-1 text-sm resize-y" />
                </label>)}
              </div>
              <label className="flex gap-3 items-center text-sm">
                <input type="checkbox" checked={Boolean(selectedCategory.hidden)} onChange={e=>patch(selectedCategory.id,'hidden',e.target.checked)}/>
                隐藏此分类（保留产品关系和历史数据）
              </label>
              <section className="border-t pt-5">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><ImageIcon size={17}/>分类封面</h4>
                {selectedCategory.image && <img src={resolveImage(selectedCategory.image)} alt="现有封面" className="w-full max-w-md h-40 object-cover mb-3"/>}
                <PZImageManager images={selectedCategory.image ? [selectedCategory.image] : []}
                  onUpdate={urls=>patch(selectedCategory.id,'image',urls[0]||'')} onUpload={onUpload} onError={setError} maxImages={1} />
              </section>
              <section className="border-t pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">子分类（{selectedCategory.subCategories?.length || 0}）</h4>
                  <button onClick={()=>patch(selectedCategory.id,'subCategories',[...(selectedCategory.subCategories||[]),{name:'',name_zh:'',description:'',image:''}])}
                    className="text-xs border px-3 py-2">+ 新增子分类</button>
                </div>
                {(selectedCategory.subCategories || []).map((sub:any,i:number)=>(
                  <div key={i} className="border p-4 space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      {(['name','name_zh','description','description_zh'] as const).map(key=>
                        <label key={key} className="text-xs text-stone-600">{key}
                          <input className="block mt-1 border p-2 w-full text-sm" value={String(sub[key]||'')}
                            onChange={e=>updateSub(selectedCategory.id,i,key,e.target.value)}/>
                        </label>
                      )}
                    </div>
                    <PZImageManager images={sub.image ? [sub.image] : []}
                      onUpdate={urls=>updateSub(selectedCategory.id,i,'image',urls[0]||'')}
                      onUpload={onUpload} onError={setError} maxImages={1}/>
                    <button className="text-xs text-red-700 border border-red-200 px-3 py-2" onClick={()=>{
                      if (confirm('从此分类的草稿中移除这个子分类？关联产品不会删除。'))
                        patch(selectedCategory.id,'subCategories',(selectedCategory.subCategories||[]).filter((_:any,j:number)=>j!==i));
                    }}>移除此子分类</button>
                  </div>
                ))}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default CategoryManagement;
