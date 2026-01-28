import React, { useEffect, useState, useMemo } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import PortalLayout from './PortalLayout';
import { Package, ChevronLeft, LayoutGrid, ClipboardList, AlertCircle, Clock, Plus, X, Upload, Save, Send, Loader2, Layers } from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';
import PZImageManager from './components/PZImageManager';
import BatchCreator from './components/BatchCreator';

const FactoryWorkspace: React.FC = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isBatchCreating, setIsBatchCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [isRequestingCategory, setIsRequestingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [catRequest, setCatRequest] = useState({ title: '', subtitle: '', description: '', image: '' });

  const userName = sessionStorage.getItem('pz_user_name') || 'Factory Operator';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await factoryFetch<{ products?: any[] }>('factory/products?limit=500');
      setProducts(normalizeProducts(res.products || []));
      
      const configRes = await fetch('/api/site-config');
      if (configRes.ok) {
          const json = await configRes.json();
          const remoteConfig = json.config ?? json;
          if (remoteConfig.categories?.length > 0) setCategories(remoteConfig.categories);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const stats = useMemo(() => ({
      pending: products.filter(p => p.status === 'awaiting_review').length,
      rejected: products.filter(p => p.status === 'rejected').length,
      total: products.length
  }), [products]);

  // ✅ New Flow: Always save as 'draft' first
  const handleSaveDraft = async (product: ProductVariant) => {
    try {
      const method = product.id ? 'PUT' : 'POST';
      const url = product.id ? `factory/products/${product.id}` : 'factory/products';
      
      // Factory saves are always drafts until submitted
      await factoryFetch(url, { method, body: JSON.stringify({ ...product, status: 'draft' }) });
      
      setEditingItem(null);
      setIsCreating(false);
      await loadData();
      alert("Registry entry saved as draft.");
    } catch (e: any) { alert(e.message); }
  };

  // ✅ New Flow: Dedicated submission
  const handleSubmitForReview = async (id: string) => {
      try {
          await factoryFetch(`factory/products/${id}/submit`, { method: 'POST' });
          await loadData();
          setEditingItem(null);
          setIsCreating(false);
          alert("SKU promoted to 'Pending Review' state.");
      } catch (e: any) {
          alert(`Submission Protocol Failure: ${e.message}`);
      }
  };

  const handleBatchSave = async (newProducts: any[]) => {
      try {
          // Batch saves as drafts
          await Promise.all(newProducts.map(p => 
            factoryFetch('factory/products', { method: 'POST', body: JSON.stringify({ ...p, status: 'draft' }) })
          ));
          setIsBatchCreating(false);
          loadData();
          alert(`Batch inducted as drafts. Please review and submit items individually.`);
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

  const handleRequestCategory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!catRequest.title || !catRequest.image) { alert("Title and cover image required."); return; }
      setIsSavingCategory(true);
      try {
          const draftRes = await factoryFetch('factory/category-requests', { method: 'POST', body: JSON.stringify(catRequest) });
          if (!draftRes.id) throw new Error("Failed ID generation.");
          await factoryFetch(`factory/category-requests/${draftRes.id}/submit`, { method: 'POST' });
          alert("Proposal submitted for review.");
          setIsRequestingCategory(false);
          setCatRequest({ title: '', subtitle: '', description: '', image: '' });
      } catch (e: any) { alert(`Submission failed: ${e.message}`); }
      finally { setIsSavingCategory(false); }
  };

  const navItems = [{ id: 'inventory', label: 'Production Registry', icon: <Package size={18} /> }];

  return (
    <PortalLayout role="FACTORY" userName={userName} navItems={navItems} activeTab="inventory" onTabChange={() => {}}>
      {isRequestingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/70 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-xl shadow-2xl rounded-sm overflow-hidden animate-fade-in-up">
                  <div className="bg-stone-900 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3"><LayoutGrid size={18} className="text-safety-700" /><h4 className="text-[10px] font-bold uppercase tracking-[0.2em]">New Series Proposal</h4></div>
                      <button onClick={() => setIsRequestingCategory(false)} className="opacity-60 hover:opacity-100"><X size={20} /></button>
                  </div>
                  <form onSubmit={handleRequestCategory} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Category Name</label>
                                  <input type="text" required value={catRequest.title} onChange={e => setCatRequest({...catRequest, title: e.target.value})} placeholder="e.g. Zen Office Series" className="w-full border border-stone-200 p-3 text-sm focus:border-stone-900 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Description</label>
                                  <textarea rows={3} value={catRequest.description} onChange={e => setCatRequest({...catRequest, description: e.target.value})} placeholder="Specify technical scope..." className="w-full border border-stone-200 p-3 text-xs focus:border-stone-900 outline-none resize-none" />
                              </div>
                          </div>
                          <div>
                              <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">Cover Image</label>
                              <PZImageManager images={catRequest.image ? [catRequest.image] : []} onUpdate={(imgs) => setCatRequest({...catRequest, image: imgs[0] || ''})} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} maxImages={1} aspectRatio={4/3} onError={alert} />
                          </div>
                      </div>
                      <div className="pt-6 border-t border-stone-100 flex gap-4">
                          <button type="button" onClick={() => setIsRequestingCategory(false)} className="flex-1 py-4 border border-stone-200 text-[10px] font-bold uppercase tracking-widest">Discard</button>
                          <button type="submit" disabled={isSavingCategory} className="flex-[2] bg-stone-900 text-white py-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-safety-700 transition-all flex items-center justify-center gap-3 shadow-lg">
                              {isSavingCategory ? <Loader2 size={16} className="animate-spin" /> : <><Send size={14} /> Submit Review</>}
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
                      <h1 className="text-2xl font-serif text-stone-900">{isBatchCreating ? 'Batch SKU Induction' : isCreating ? 'Provision SKU' : editingItem ? `Modifying SKU` : selectedCategoryId ? 'Category Details' : 'Production Board'}</h1>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1"><span>Terminal v2.5</span><span>/</span><span className="text-stone-900">{selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.title : 'Registry'}</span></div>
                  </div>
              </div>
              {!isCreating && !editingItem && !isBatchCreating && (
                  <div className="hidden md:flex gap-6">
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><Clock size={16} className="text-amber-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">Pending Review</div><div className="text-sm font-bold text-stone-900">{stats.pending}</div></div></div>
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3"><AlertCircle size={16} className="text-red-500" /><div><div className="text-[10px] text-stone-400 font-bold uppercase">Rejected</div><div className="text-sm font-bold text-stone-900">{stats.rejected}</div></div></div>
                  </div>
              )}
          </div>
          <div className="h-px bg-stone-200 w-full mb-8"></div>
      </div>

      {loading && products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-stone-300 font-mono"><Package className="animate-bounce mb-4 opacity-20" size={48} /><span className="text-[10px] font-bold tracking-widest uppercase">Synchronizing...</span></div>
      ) : isBatchCreating ? (
          <BatchCreator categories={categories} onCancel={handleBack} onSave={handleBatchSave} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} />
      ) : editingItem || isCreating ? (
            <ProductForm 
                initialData={editingItem || {}} 
                categories={categories} 
                onSave={handleSaveDraft} 
                onSubmit={handleSubmitForReview}
                onCancel={handleBack} 
                onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await factoryFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} 
                fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined} 
                userRole="FACTORY" 
                lang="en" 
            />
          ) : selectedCategoryId ? (
            <div className="space-y-6">
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsBatchCreating(true)} className="bg-white border border-stone-200 text-stone-600 px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:border-stone-900 transition-colors shadow-sm flex items-center gap-2"><Layers size={16} /> Batch Induction</button>
                    <button onClick={() => setIsCreating(true)} className="bg-stone-900 text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center gap-2"><ClipboardList size={16} /> Single Entry</button>
                </div>
                <ProductList 
                    lang="en" 
                    items={selectedCategoryId === 'all' ? products : products.filter(i => i.category === selectedCategoryId)} 
                    categories={categories} 
                    onEdit={setEditingItem} 
                    onCreate={() => setIsCreating(true)} 
                    onRefresh={loadData} 
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
                <CategoryGrid categories={categories} products={products} onSelectCategory={setSelectedCategoryId} onSelectAll={() => setSelectedCategoryId('all')} onCreateCategory={() => setIsRequestingCategory(true)} />
            </div>
          )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;