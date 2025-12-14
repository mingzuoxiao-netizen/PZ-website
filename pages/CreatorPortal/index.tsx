
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { SiteConfig, SiteMeta } from '../../utils/siteConfig';
import { ProductVariant, Category } from '../../types';
import { Link } from 'react-router-dom';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; 

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import CategoryGrid from './components/CategoryGrid';
import CollectionManager from './components/CollectionManager'; // Imported CollectionManager
import { DEFAULT_ASSETS } from '../../utils/assets';

const CreatorPortal: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { config: publishedConfig, meta, refresh } = usePublishedSiteConfig();
  
  // State
  // Added 'collections' to allowed tabs
  const [activeTab, setActiveTab] = useState<'inventory' | 'config' | 'assets' | 'collections'>('inventory');
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  
  // Inventory UX State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [configMeta, setConfigMeta] = useState<SiteMeta | null>(null);
  const [assetHistory, setAssetHistory] = useState<Record<string, any[]>>({});
  const [viewingHistoryKey, setViewingHistoryKey] = useState<string | null>(null);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Form State
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // --- DATA FETCHING ---
  const loadData = async () => {
    setLoading(true);
    try {
      const inventoryPromise = adminFetch<{ products?: any[], data?: any[] }>('/admin/products?limit=500');
      const configPromise = adminFetch<{ config: SiteConfig, version: string, published_at: string }>('/site-config');

      const results = await Promise.allSettled([
        inventoryPromise,
        configPromise,
      ]);

      // 1. Process Inventory
      const inventoryRes = results[0].status === 'fulfilled' ? results[0].value : { products: [] };
      const rawItems = inventoryRes.products || inventoryRes.data || [];
      const normalizedItems = normalizeProducts(rawItems);
      setLocalItems(normalizedItems);

      // 2. Process Config
      const configRes = results[1].status === 'fulfilled' ? results[1].value : null;
      if (configRes && configRes.config) {
        setSiteConfig(configRes.config);
        
        // Sync categories from config if available, otherwise fallback to static
        if (configRes.config.categories && configRes.config.categories.length > 0) {
            setCategories(configRes.config.categories);
        } else {
            setCategories(staticCategories);
        }

        setConfigMeta({
          version: configRes.version,
          published_at: configRes.published_at
        });
      }
    } catch (e) {
      console.error("Failed to load Creator Portal data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- HANDLERS ---
  const handleSaveProduct = async (product: ProductVariant) => {
    try {
      if (product.id) {
        await adminFetch(`/products/${product.id}`, {
            method: 'PUT',
            body: JSON.stringify(product)
        });
      } else {
        await adminFetch('/products', {
            method: 'POST',
            body: JSON.stringify(product)
        });
      }
      setEditingItem(null);
      setIsCreating(false);
      loadData(); 
    } catch (e: any) {
      alert(`Failed to save product: ${e.message || "Unknown Error"}`);
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await adminFetch(`/products/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(`Failed to delete: ${e.message || "Unknown Error"}`);
    }
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setSavingConfig(true);
    try {
      await adminFetch('/site-config', {
        method: 'POST',
        body: JSON.stringify(siteConfig)
      });
      refresh(); 
      loadData(); 
      alert("Site Configuration Published!");
    } catch (e: any) {
      alert(`Failed to save config: ${e.message || "Unknown Error"}`);
    } finally {
      setSavingConfig(false);
    }
  };

  // Helper to save categories immediately via SiteConfig
  const handleSaveCategories = async (updatedCategory: Category) => {
      if (!siteConfig) return;
      
      const newCategories = categories.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
      );
      
      // Update local state
      setCategories(newCategories);
      
      // Update config object
      const newConfig = { ...siteConfig, categories: newCategories };
      setSiteConfig(newConfig);

      // Auto-save to cloud
      setSavingConfig(true);
      try {
        await adminFetch('/site-config', {
            method: 'POST',
            body: JSON.stringify(newConfig)
        });
        refresh();
        alert("Collection Updated.");
      } catch (e: any) {
        alert(`Failed to update collection: ${e.message}`);
      } finally {
        setSavingConfig(false);
      }
  };

  const handleAssetUpdate = async (key: string, url: string) => {
    try {
       await adminFetch('/assets', {
           method: 'POST',
           body: JSON.stringify({ key, url })
       });
       alert("Asset updated.");
    } catch (e: any) {
       alert(`Failed to update asset: ${e.message}`);
    }
  };

  // --- DERIVED STATE FOR INVENTORY ---
  const activeCategoryTitle = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId)?.title 
    : 'All Products';

  const filteredItems = selectedCategoryId 
    ? localItems.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : localItems;

  if (loading) return <div className="h-screen flex items-center justify-center">Loading Creator Portal...</div>;

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
       <div className="bg-white border-b border-stone-200 sticky top-0 z-40 px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center">
              <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-900 mr-4 font-bold text-xs uppercase tracking-widest">
                 ← {t.creator.backAdmin}
              </Link>
              <h1 className="font-serif text-xl text-stone-900">{t.creator.title}</h1>
          </div>
          
          <div className="flex items-center space-x-6">
             <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.inventory}
             </button>
             {/* New Collections Tab */}
             <button onClick={() => setActiveTab('collections')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'collections' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.collections}
             </button>
             <button onClick={() => setActiveTab('config')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.config}
             </button>
             <button onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.media}
             </button>

             {/* Language Switcher */}
             <div className="h-4 w-[1px] bg-stone-200 mx-2 hidden md:block"></div>
             <button 
                onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
                className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors border border-stone-200 px-3 py-1 rounded-sm hover:border-stone-400"
             >
                {language === 'en' ? 'EN / 中' : '中 / EN'}
             </button>
          </div>
       </div>

       <div className="container mx-auto px-6 md:px-12 py-12">
          
          {activeTab === 'inventory' && (
             <>
                {/* 1. PRODUCT FORM (Create/Edit) */}
                {(isCreating || editingItem) ? (
                    <ProductForm 
                        initialData={editingItem || {}} 
                        categories={categories}
                        // Lock category if we are creating new item from inside a category view
                        fixedCategoryId={isCreating && selectedCategoryId ? selectedCategoryId : undefined}
                        onSave={handleSaveProduct} 
                        onCancel={() => { setEditingItem(null); setIsCreating(false); }} 
                    />
                ) : (
                    /* 2. INVENTORY VIEWS */
                    <>
                        {/* 2a. CATEGORY GRID (Root Level) */}
                        {!selectedCategoryId && !editingItem && !isCreating && (
                            <CategoryGrid 
                                categories={categories}
                                products={localItems}
                                onSelectCategory={setSelectedCategoryId}
                                onSelectAll={() => setSelectedCategoryId('ALL_MASTER')} // Magic string to show list without filter
                            />
                        )}

                        {/* 2b. PRODUCT LIST (Filtered Level) */}
                        {selectedCategoryId && (
                            <ProductList 
                                items={filteredItems} 
                                categories={categories}
                                categoryTitle={selectedCategoryId === 'ALL_MASTER' ? 'Master Inventory List' : activeCategoryTitle}
                                onBack={() => setSelectedCategoryId(null)}
                                onEdit={setEditingItem} 
                                onDelete={handleDeleteProduct}
                                onCreate={() => setIsCreating(true)}
                            />
                        )}
                    </>
                )}
             </>
          )}

          {/* New Collections Manager View */}
          {activeTab === 'collections' && (
              <CollectionManager 
                  categories={categories}
                  onUpdate={handleSaveCategories}
                  onDelete={(id) => alert("Deletion via portal is restricted. Please contact engineering to remove a category structure.")}
              />
          )}

          {activeTab === 'config' && siteConfig && (
             <SiteConfigEditor 
               config={siteConfig} 
               meta={configMeta}
               onChange={setSiteConfig} 
               onSave={handleSaveConfig} 
               isSaving={savingConfig}
               onRefresh={loadData}
             />
          )}
          
          {activeTab === 'assets' && (
              <PageAssets 
                customAssets={DEFAULT_ASSETS} 
                assetHistory={assetHistory}
                onAssetUpdate={handleAssetUpdate}
                onAssetReset={(k) => handleAssetUpdate(k, '')}
                onAssetRollback={(k, u) => handleAssetUpdate(k, u)}
                viewingHistoryKey={viewingHistoryKey}
                setViewingHistoryKey={setViewingHistoryKey}
              />
          )}
       </div>
    </div>
  );
};

export default CreatorPortal;
