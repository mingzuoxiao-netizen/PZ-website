
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; 
import { DEFAULT_ASSETS } from '../../utils/assets';
import { useLanguage } from '../../contexts/LanguageContext';
import PortalLayout from './PortalLayout';

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import PageAssets from './components/PageAssets';
import CategoryGrid from './components/CategoryGrid';

const FactoryWorkspace: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  // Data
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  
  // UI
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const userName = sessionStorage.getItem('pz_user_name') || 'Factory';

  const txt = t.creator.tabs;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ products?: any[], data?: any[] }>('/admin/products?limit=500');
      const rawItems = res.products || res.data || [];
      setLocalItems(normalizeProducts(rawItems));
      
      const configRes = await adminFetch<any>('/site-config');
      if (configRes?.config?.categories) {
          setCategories(configRes.config.categories);
      }
    } catch (e) {
      console.error("Factory load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProduct = async (product: ProductVariant) => {
    try {
      if (product.id) {
        await adminFetch(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
      } else {
        await adminFetch('/products', { method: 'POST', body: JSON.stringify(product) });
      }
      setEditingItem(null);
      setIsCreating(false);
      loadData(); 
      alert("Product Submitted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const filteredItems = selectedCategoryId 
    ? localItems.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : localItems;

  return (
    <PortalLayout 
        role="FACTORY" 
        userName={userName} 
        navActions={
            <>
                <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-blue-700' : 'text-stone-400'}`}>
                    {txt.inventory}
                </button>
                <button onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-blue-700' : 'text-stone-400'}`}>
                    {txt.media}
                </button>
            </>
        }
    >
        {loading ? <div className="text-center py-20 text-stone-400">Loading Factory Portal...</div> : (
            <>
                {/* 1. INVENTORY */}
                {activeTab === 'inventory' && (
                    <>
                        {(isCreating || editingItem) ? (
                            <ProductForm 
                                lang={language}
                                initialData={editingItem || {}} 
                                categories={categories}
                                fixedCategoryId={isCreating && selectedCategoryId ? selectedCategoryId : undefined}
                                onSave={handleSaveProduct} 
                                onCancel={() => { setEditingItem(null); setIsCreating(false); }}
                                userRole="FACTORY"
                            />
                        ) : (
                            <>
                                {!selectedCategoryId ? (
                                    <CategoryGrid 
                                        categories={categories}
                                        products={localItems} // Factory sees all to know what exists
                                        onSelectCategory={setSelectedCategoryId}
                                        onSelectAll={() => setSelectedCategoryId('ALL_MASTER')}
                                        // No create category for factory
                                    />
                                ) : (
                                    <ProductList 
                                        lang={language}
                                        items={filteredItems} 
                                        categories={categories}
                                        categoryTitle={selectedCategoryId === 'ALL_MASTER' ? 'Inventory List' : categories.find(c=>c.id===selectedCategoryId)?.title}
                                        onBack={() => setSelectedCategoryId(null)}
                                        onEdit={setEditingItem} 
                                        onDelete={() => alert("Restricted: Factory cannot delete. Please archive.")}
                                        onCreate={() => setIsCreating(true)}
                                    />
                                )}
                            </>
                        )}
                    </>
                )}

                {/* 2. ASSETS (Media Library) */}
                {activeTab === 'assets' && (
                    <PageAssets 
                        customAssets={DEFAULT_ASSETS} 
                        assetHistory={{}}
                        onAssetUpdate={(k, u) => adminFetch('/assets', { method: 'POST', body: JSON.stringify({ key: k, url: u }) }).then(() => alert("Saved"))}
                        onAssetReset={() => {}}
                        onAssetRollback={() => {}}
                        viewingHistoryKey={null}
                        setViewingHistoryKey={() => {}}
                    />
                )}
            </>
        )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;
