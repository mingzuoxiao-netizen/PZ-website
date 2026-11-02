import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categoryMatches } from '../../utils/categoryMatching';
import { categories as staticCategories } from '../../data/inventory';
import { publishedSiteCategories } from '../../utils/catalogCategories';
import PortalLayout from './PortalLayout';
import { 
    Package, ChevronLeft, LayoutGrid, ClipboardList, AlertCircle, 
    Clock, Plus, X, Save, Send, Loader2, Layers, Bell, CheckCircle, Database 
} from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';
import FactoryCategoryManagement from './components/FactoryCategoryManagement';
import PZImageManager from './components/PZImageManager';
import BatchCreator from './components/BatchCreator';

interface Notification {
    id: string;
    type: 'approval' | 'category' | 'sync';
    message: string;
    target?: string;
}

const FactoryWorkspace: React.FC = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'categories'>('inventory');
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBatchCreating, setIsBatchCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [siteVersion, setSiteVersion] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newCategoryIds, setNewCategoryIds] = useState<string[]>([]);

  // Refs for state comparison
  const productsRef = useRef<ProductVariant[]>([]);
  const categoriesRef = useRef<Category[]>(staticCategories);

  const [isRequestingCategory, setIsRequestingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [catRequest, setCatRequest] = useState({ title: '', title_cn: '', subtitle: '', image: '' });

  const userName = sessionStorage.getItem('pz_user_name') || '工厂操作员';

  const addNotification = (type: Notification['type'], message: string, target?: string) => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications(prev => [{ id, type, message, target }, ...prev].slice(0, 3));
      setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== id));
      }, 8000);
  };

  const loadSiteConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/site-config');
      if (!res.ok) return;
      const json = await res.json();
      const config = json.config ?? json;
      const incomingCats = config.categories || [];

      if (incomingCats.length > 0) {
          // Detect new categories
          const currentIds = new Set(categoriesRef.current.map(c => c.id));
          const added = incomingCats.filter((c: any) => !currentIds.has(c.id));
          
          if (added.length > 0) {
              setNewCategoryIds(prev => [...prev, ...added.map((c: any) => c.id)]);
              added.forEach((c: any) => addNotification('category', `新增产品系列：${c.title}`));
          }
          
          setCategories(publishedSiteCategories(incomingCats));
          categoriesRef.current = publishedSiteCategories(incomingCats);
      }
    } catch (e) {
      console.error("[Registry] Config sync failed:", e);
    }
  }, []);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await factoryFetch<{ products?: any[] }>('factory/products?limit=500');
      const incomingProducts = normalizeProducts(res.products || []);
      
      // Detect Approvals: Status changed from awaiting_review to published
      if (isSilent && productsRef.current.length > 0) {
          incomingProducts.forEach(newItem => {
              const oldItem = productsRef.current.find(o => o.id === newItem.id);
              if (oldItem && oldItem.status === 'awaiting_review' && newItem.status === 'published') {
                  addNotification('approval', `审核通过：${newItem.name}`, newItem.id);
              }
          });
      }

      setProducts(incomingProducts);
      productsRef.current = incomingProducts;
      await loadSiteConfig();
    } catch (e) { 
        console.error("[Registry] Product sync failed:", e); 
    } finally {
        if (!isSilent) setLoading(false);
    }
  }, [loadSiteConfig]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const dataInterval = setInterval(() => {
        if (!isCreating && !editingItem && !isBatchCreating) {
            loadData(true);
        }
    }, 10000);

    const configInterval = setInterval(async () => {
        try {
            const res = await fetch('/api/site-config/meta', { cache: 'no-store' });
            if (!res.ok) return;
            const meta = await res.json();
            
            if (!siteVersion) {
                setSiteVersion(meta.version);
            } else if (meta.version !== siteVersion) {
                setSiteVersion(meta.version);
                await loadSiteConfig();
                loadData(true); // Sync everything
            }
        } catch {}
    }, 30000);

    const handleFocus = () => loadData(true);
    window.addEventListener('focus', handleFocus);

    return () => {
        clearInterval(dataInterval);
        clearInterval(configInterval);
        window.removeEventListener('focus', handleFocus);
    };
  }, [loadData, loadSiteConfig, siteVersion, isCreating, editingItem, isBatchCreating]);

  const stats = useMemo(() => ({
      pending: products.filter(p => ['awaiting_review','pending_supervisor','pending_admin','returned_to_supervisor','approved_pending_publish'].includes(p.status||'')).length,
      rejected: products.filter(p => ['rejected','returned_to_uploader'].includes(p.status||'')).length,
      total: products.length
  }), [products]);

  const handleSaveDraft = async (product: ProductVariant) => {
    try {
      const method = product.id ? 'PUT' : 'POST';
      const url = product.id ? `factory/products/${product.id}` : 'factory/products';
      const payload = { ...product, status: 'draft' };
      await factoryFetch(url, { method, body: JSON.stringify(payload) });
      setEditingItem(null);
      setIsCreating(false);
      await loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleSubmitForReview = async (productId: string) => {
      try {
          await factoryFetch(`factory/products/${productId}/submit`, { method: 'POST' });
          await loadData();
          setEditingItem(null);
          setIsCreating(false);
      } catch (e: any) { alert(`操作失败：${e.message}`); }
  };

  // O(batch size) indexed SKU lookup, rather than downloading the entire catalog.
  const checkBatchSkuCodes = async (codes: string[]): Promise<string[]> => {
      const res = await factoryFetch<{ existingCodes?: string[] }>('factory/products/check-skus', {
          method: 'POST',
          body: JSON.stringify({ codes }),
      });
      if (!Array.isArray(res?.existingCodes)) throw new Error('SKU 校验接口暂不可用。');
      return res.existingCodes;
  };

  const createBatchDraft = async (product: any): Promise<void> => {
      const response = await factoryFetch<{ success?: boolean }>('factory/products', {
          method: 'POST',
          body: JSON.stringify({ ...product, status: 'draft', is_published: 0 }),
      });
      if (response?.success !== true) throw new Error('草稿保存结果未确认，请到产品总库核对 SKU。');
  };

  const handleBack = () => {
      if (isBatchCreating && !window.confirm('确认离开批量录入吗？未完成的输入将丢失。')) return;
      if (isCreating || editingItem || isBatchCreating) {
          setIsCreating(false);
          setIsBatchCreating(false);
          setEditingItem(null);
      } else if (selectedCategoryId) {
          setSelectedCategoryId(null);
      }
  };

  const navItems = [
    { id: 'inventory', label: '工厂产品管理', icon: <Package size={18} /> },
    { id: 'categories', label: '产品分类申请', icon: <LayoutGrid size={18} /> }
  ];

  return (
    <PortalLayout role="FACTORY" userName={userName} navItems={navItems} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as 'inventory' | 'categories')}>
      {activeTab === 'categories' ? (
        <FactoryCategoryManagement categories={categories} onUpload={async file => {
          const form = new FormData(); form.append('file', file);
          const uploaded = await factoryFetch<{url:string}>('upload-image', { method: 'POST', body: form });
          if (!uploaded.url) throw new Error('上传封面未返回图片地址');
          return uploaded.url;
        }} />
      ) : (<>

      
      {/* Comms Notification Center */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
              <div key={n.id} className="w-80 bg-stone-900 border-l-4 border-safety-700 p-4 shadow-2xl animate-fade-in-up pointer-events-auto">
                  <div className="flex items-start gap-3">
                      {n.type === 'approval' ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <Database size={18} className="text-safety-700 flex-shrink-0" />}
                      <div>
                          <p className="text-[10px] font-mono font-bold uppercase text-stone-500 tracking-widest mb-1">{n.type === 'approval' ? '产品状态更新' : '系统通知'}</p>
                          <p className="text-xs text-white leading-relaxed font-bold">{n.message}</p>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {isRequestingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-xl shadow-2xl rounded-sm overflow-hidden animate-fade-in-up">
                  <div className="bg-stone-900 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3"><LayoutGrid size={18} className="text-safety-700" /><h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">新增产品分类申请</h4></div>
                      <button onClick={() => setIsRequestingCategory(false)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
                  </div>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!catRequest.title.trim() || !catRequest.title_cn.trim() || !catRequest.image) return alert('请填写中英文分类名称并上传封面图片。');
                      setIsSavingCategory(true);
                      try {
                          // Existing Staging D1 creates a reviewable "pending" request in one POST.
                          // There is no draft/submit endpoint in the verified legacy schema.
                          const created = await factoryFetch('factory/category-requests', { method: 'POST', body: JSON.stringify(catRequest) });
                          if (!created?.id || created?.status !== 'pending' || created?.success !== true) {
                            throw new Error('分类申请结果未确认，请让管理员检查待审核新品类，勿重复提交。');
                          }
                          alert('新品类申请已提交，请等待管理员审核。通过后才会显示在网站上。');
                          setIsRequestingCategory(false);
                          setCatRequest({ title: '', title_cn: '', subtitle: '', image: '' });
                      } catch (e: any) {
                          const message = String(e?.message || '未知错误');
                          alert(message.includes('Not found') && !message.includes('草稿已创建')
                            ? '当前 Worker 尚未提供「新品类申请」接口（404）。当前没有提交成功，请联系管理员检查环境部署。'
                            : message);
                      }
                      finally { setIsSavingCategory(false); }
                  }} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类英文名称（必填）</label>
                                  <input type="text" required value={catRequest.title} onChange={e => setCatRequest({...catRequest, title: e.target.value})} className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" />
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-3 mb-2">中文名称（必填）</label>
                                  <input type="text" value={catRequest.title_cn} onChange={e => setCatRequest({...catRequest, title_cn: e.target.value})} className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" placeholder="例如：实木台面" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类副标题（选填，200 字以内）</label>
                                  <textarea rows={3} maxLength={200} value={catRequest.subtitle} onChange={e => setCatRequest({...catRequest, subtitle: e.target.value})} className="w-full border border-stone-200 p-3 text-xs focus:border-stone-900 outline-none resize-none" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">分类封面</label>
                              <PZImageManager images={catRequest.image ? [catRequest.image] : []} onUpdate={(imgs) => setCatRequest({...catRequest, image: imgs[0] || ''})} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} maxImages={1} aspectRatio={4/3} onError={alert} />
                          </div>
                      </div>
                      <div className="pt-6 border-t border-stone-100 flex gap-4">
                          <button type="button" onClick={() => setIsRequestingCategory(false)} className="flex-1 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest">取消</button>
                          <button type="submit" disabled={isSavingCategory} className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all flex items-center justify-center gap-3">
                              {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> 提交审核</>}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                  {(selectedCategoryId || isCreating || editingItem || isBatchCreating) && (
                      <button onClick={handleBack} className="p-2 bg-white border border-stone-200 rounded-full hover:border-stone-900 transition-colors shadow-sm group"><ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" /></button>
                  )}
                  <div>
                      <h1 className="text-2xl font-serif text-stone-900">{isBatchCreating ? '批量录入产品' : isCreating ? '新增产品' : editingItem ? `编辑产品` : selectedCategoryId ? '分类产品管理' : '工厂产品管理'}</h1>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1"><span>工厂后台</span><span>/</span><span className="text-stone-900">{selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.title : '产品总库'}</span></div>
                  </div>
              </div>
              {!isCreating && !editingItem && !isBatchCreating && (
                  <div className="hidden md:flex gap-6">
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><Clock size={16} className="text-amber-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">待审核</div><div className="text-sm font-bold text-stone-900">{stats.pending}</div></div></div>
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><AlertCircle size={16} className="text-red-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">已退回</div><div className="text-sm font-bold text-stone-900">{stats.rejected}</div></div></div>
                  </div>
              )}
          </div>
          <div className="h-px bg-stone-200 w-full mb-8"></div>
      </div>

      {loading && products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-stone-300 font-mono"><Package className="animate-bounce mb-4 opacity-20" size={48} /><span className="text-[10px] font-bold tracking-widest uppercase">正在加载产品…</span></div>
      ) : isBatchCreating ? (
          <BatchCreator lang="zh"
              fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' && categories.some(c => c.id === selectedCategoryId) ? selectedCategoryId : undefined}
              categories={categories}
              onCancel={handleBack}
              onCreateDraft={createBatchDraft}
              onCheckSkuCodes={checkBatchSkuCodes}
              onCompleted={async () => { await loadData(); }}
              onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }}
          />
      ) : editingItem || isCreating ? (
            <ProductForm 
                initialData={editingItem || {}} 
                fixedCategoryId={isCreating && selectedCategoryId && selectedCategoryId !== 'all' && categories.some(c => c.id === selectedCategoryId) ? selectedCategoryId : undefined}
                categories={categories} 
                onSave={handleSaveDraft} 
                onSubmit={handleSubmitForReview}
                onCancel={handleBack} 
                userRole="FACTORY" 
                lang="zh" 
            />
          ) : selectedCategoryId ? (
            <div className="space-y-6">
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsBatchCreating(true)} className="bg-white border border-stone-200 text-stone-600 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-stone-900 transition-colors shadow-sm flex items-center gap-2"><Layers size={16} /> 批量录入</button>
                    <button onClick={() => setIsCreating(true)} className="bg-stone-900 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center gap-2"><ClipboardList size={16} /> 新建产品</button>
                </div>
                <ProductList 
                    lang="zh" 
                    items={selectedCategoryId === 'all' ? products : products.filter(item => {
                        const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
                        return selectedCategory ? categoryMatches(item.category, selectedCategory) : false;
                    })} 
                    categories={categories} 
                    onEdit={setEditingItem} 
                    onCreate={() => setIsCreating(true)} 
                    onRefresh={() => loadData(true)} 
                    onBack={handleBack}
                    onSubmit={handleSubmitForReview}
                    userRole="FACTORY"
                />
            </div>
          ) : (
            <div className="space-y-8">
                <div className="bg-stone-900 rounded-sm p-12 text-white relative overflow-hidden mb-8 shadow-2xl">
                    <div className="relative z-10"><h2 className="text-3xl font-serif mb-4">欢迎，{userName}</h2><p className="text-stone-400 text-sm max-w-lg leading-relaxed font-light">在此管理产品系列、录入新产品并查看审核状态。</p></div>
                    <LayoutGrid className="absolute right-[-20px] bottom-[-20px] text-white opacity-5 w-72 h-72 rotate-12" />
                </div>
                <CategoryGrid 
                    categories={categories} 
                    products={products} 
                    onSelectCategory={setSelectedCategoryId} 
                    onSelectAll={() => setSelectedCategoryId('all')} 
                    onCreateCategory={() => setIsRequestingCategory(true)}
                    newCategoryIds={newCategoryIds}
                />
            </div>
          )}
          </>)}
    </PortalLayout>
  );
};

export default FactoryWorkspace;