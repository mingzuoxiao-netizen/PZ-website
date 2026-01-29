import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import PortalLayout from './PortalLayout';
import { 
    Package, ChevronLeft, LayoutGrid, ClipboardList, AlertCircle, 
    Clock, Plus, X, Save, Send, Loader2, Layers, Bell, CheckCircle, Database 
} from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';
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
  const [catRequest, setCatRequest] = useState({ title: '', subtitle: '', description: '', image: '' });

  const userName = sessionStorage.getItem('pz_user_name') || 'Factory Operator';

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
              added.forEach((c: any) => addNotification('category', `New Production Series: ${c.title}`));
          }
          
          setCategories(incomingCats);
          categoriesRef.current = incomingCats;
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
                  addNotification('approval', `Audit Confirmed: ${newItem.name}`, newItem.id);
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
      pending: products.filter(p => p.status === 'awaiting_review').length,
      rejected: products.filter(p => p.status === 'rejected').length,
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
      } catch (e: any) { alert(`Protocol Failure: ${e.message}`); }
  };

  const handleBatchSave = async (newProducts: any[]) => {
      try {
          await Promise.all(newProducts.map(p => 
            factoryFetch('factory/products', { method: 'POST', body: JSON.stringify({ ...p, status: 'draft' }) })
          ));
          setIsBatchCreating(false);
          loadData();
      } catch (e: any) { alert("Batch error: " + e.message); }
  };

  const handleBack = () => {
      if (isCreating || editingItem || isBatchCreating) {
          setIsCreating(false);
          setIsBatchCreating(false);
          setEditingItem(null);
      } else if (selectedCategoryId) {
          setSelectedCategoryId(null);
      }
  };

  const navItems = [{ id: 'inventory', label: 'Production Registry', icon: <Package size={18} /> }];

  return (
    <PortalLayout role="FACTORY" userName={userName} navItems={navItems} activeTab="inventory" onTabChange={() => {}}>
      
      {/* Comms Notification Center */}
      <div className="fixed top-24 right-8 z-[200] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
              <div key={n.id} className="w-80 bg-stone-900 border-l-4 border-safety-700 p-4 shadow-2xl animate-fade-in-up pointer-events-auto">
                  <div className="flex items-start gap-3">
                      {n.type === 'approval' ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" /> : <Database size={18} className="text-safety-700 flex-shrink-0" />}
                      <div>
                          <p className="text-[10px] font-mono font-bold uppercase text-stone-500 tracking-widest mb-1">{n.type === 'approval' ? 'Registry Update' : 'Kernel Update'}</p>
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
                      <div className="flex items-center gap-3"><LayoutGrid size={18} className="text-safety-700" /><h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">New Series Proposal</h4></div>
                      <button onClick={() => setIsRequestingCategory(false)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
                  </div>
                  <form onSubmit={async (e) => {
                      e.preventDefault();
                      if (!catRequest.title || !catRequest.image) return alert("Title and image required.");
                      setIsSavingCategory(true);
                      try {
                          const draft = await factoryFetch('factory/category-requests', { method: 'POST', body: JSON.stringify(catRequest) });
                          await factoryFetch(`factory/category-requests/${draft.id}/submit`, { method: 'POST' });
                          alert("Proposal submitted.");
                          setIsRequestingCategory(false);
                          setCatRequest({ title: '', subtitle: '', description: '', image: '' });
                      } catch (e: any) { alert(e.message); }
                      finally { setIsSavingCategory(false); }
                  }} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Category Name</label>
                                  <input type="text" required value={catRequest.title} onChange={e => setCatRequest({...catRequest, title: e.target.value})} className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Description</label>
                                  <textarea rows={3} value={catRequest.description} onChange={e => setCatRequest({...catRequest, description: e.target.value})} className="w-full border border-stone-200 p-3 text-xs focus:border-stone-900 outline-none resize-none" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Cover Asset</label>
                              <PZImageManager images={catRequest.image ? [catRequest.image] : []} onUpdate={(imgs) => setCatRequest({...catRequest, image: imgs[0] || ''})} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} maxImages={1} aspectRatio={4/3} onError={alert} />
                          </div>
                      </div>
                      <div className="pt-6 border-t border-stone-100 flex gap-4">
                          <button type="button" onClick={() => setIsRequestingCategory(false)} className="flex-1 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest">Discard</button>
                          <button type="submit" disabled={isSavingCategory} className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all flex items-center justify-center gap-3">
                              {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Transmit Review</>}
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
                      <h1 className="text-2xl font-serif text-stone-900">{isBatchCreating ? 'Batch SKU Induction' : isCreating ? 'Provision SKU' : editingItem ? `Modifying SKU` : selectedCategoryId ? 'Series Registry' : 'Production Board'}</h1>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1"><span>Kernel v2.5</span><span>/</span><span className="text-stone-900">{selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.title : 'Master'}</span></div>
                  </div>
              </div>
              {!isCreating && !editingItem && !isBatchCreating && (
                  <div className="hidden md:flex gap-6">
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><Clock size={16} className="text-amber-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">Pending</div><div className="text-sm font-bold text-stone-900">{stats.pending}</div></div></div>
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><AlertCircle size={16} className="text-red-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">Rejected</div><div className="text-sm font-bold text-stone-900">{stats.rejected}</div></div></div>
                  </div>
              )}
          </div>
          <div className="h-px bg-stone-200 w-full mb-8"></div>
      </div>

      {loading && products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-stone-300 font-mono"><Package className="animate-bounce mb-4 opacity-20" size={48} /><span className="text-[10px] font-bold tracking-widest uppercase">Initializing Registry...</span></div>
      ) : isBatchCreating ? (
          <BatchCreator categories={categories} onCancel={handleBack} onSave={handleBatchSave} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} />
      ) : editingItem || isCreating ? (
            <ProductForm 
                initialData={editingItem || {}} 
                categories={categories} 
                onSave={handleSaveDraft} 
                onSubmit={handleSubmitForReview}
                onCancel={handleBack} 
                userRole="FACTORY" 
                lang="en" 
            />
          ) : selectedCategoryId ? (
            <div className="space-y-6">
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsBatchCreating(true)} className="bg-white border border-stone-200 text-stone-600 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-stone-900 transition-colors shadow-sm flex items-center gap-2"><Layers size={16} /> Batch Induction</button>
                    <button onClick={() => setIsCreating(true)} className="bg-stone-900 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center gap-2"><ClipboardList size={16} /> Single SKU</button>
                </div>
                <ProductList 
                    lang="en" 
                    items={selectedCategoryId === 'all' ? products : products.filter(i => i.category === selectedCategoryId)} 
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
                    <div className="relative z-10"><h2 className="text-3xl font-serif mb-4">Welcome, {userName}</h2><p className="text-stone-400 text-sm max-w-lg leading-relaxed font-light">Access production series registry to submit new items or verify approval status.</p></div>
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
    </PortalLayout>
  );
};

export default FactoryWorkspace;