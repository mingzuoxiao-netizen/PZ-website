import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { SiteConfig, SiteMeta } from '../../utils/siteConfig';
import { ProductVariant, Category } from '../../types';
import { Package, Globe, Image as ImageIcon, LayoutGrid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; // Import static categories

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import CollectionManager from './components/CollectionManager';
import { DEFAULT_ASSETS } from '../../utils/assets';

const CreatorPortal: React.FC = () => {
  const { t } = useLanguage();
  const { config: publishedConfig, meta, refresh } = usePublishedSiteConfig();
  
  // State
  const [activeTab, setActiveTab] = useState<'inventory' | 'config' | 'assets' | 'collections'>('inventory');
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  // Initialize with static categories to ensure form has options even if API fails
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
      // 1. Fetch Inventory & Config
      const [inventoryRes, configRes, categoriesRes, historyRes] = await Promise.all([
        adminFetch<{ data: any[] }>('/products?limit=500'),
        adminFetch<{ config: SiteConfig, version: string, published_at: string }>('/site-config'),
        adminFetch<{ data: Category[] }>('/categories').catch(() => ({ data: [] })), // Catch error gracefully
        adminFetch<{ history: any }>('/assets/history')
      ]);

      // 2. Process Inventory with Strict Normalization
      const rawItems = inventoryRes.data || [];
      const normalizedItems = normalizeProducts(rawItems);
      setLocalItems(normalizedItems);

      // 3. Process Config
      if (configRes && configRes.config) {
        setSiteConfig(configRes.config);
        setConfigMeta({
          version: configRes.version,
          published_at: configRes.published_at
        });
      }

      // 4. Process Categories (Merge with static if needed, or prefer API)
      if (categoriesRes && categoriesRes.data && categoriesRes.data.length > 0) {
        setCategories(categoriesRes.data);
      } else {
        // Keep static categories if API is empty
        setCategories(staticCategories);
      }

      // 5. Process Asset History
      if (historyRes && historyRes.history) {
        setAssetHistory(historyRes.history);
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
      loadData(); // Refresh list
    } catch (e) {
      alert("Failed to save product");
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await adminFetch(`/products/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      alert("Failed to delete");
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
      refresh(); // Update public context
      loadData(); // Reload local state
      alert("Site Configuration Published!");
    } catch (e) {
      alert("Failed to save config");
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
       loadData();
    } catch (e) {
       alert("Failed to update asset");
    }
  };

  const handleCategoryUpdate = async (cat: Category) => {
     try {
         await adminFetch(`/categories/${cat.id}`, { method: 'PUT', body: JSON.stringify(cat) });
         loadData();
     } catch (e) {
         alert("Failed to update category");
     }
  };

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
          
          <div className="flex space-x-6">
             <button onClick={() => setActiveTab('inventory')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.inventory}
             </button>
             <button onClick={() => setActiveTab('config')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.config}
             </button>
             <button onClick={() => setActiveTab('collections')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'collections' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.collections}
             </button>
             <button onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-amber-700' : 'text-stone-400'}`}>
                {t.creator.tabs.media}
             </button>
          </div>
       </div>

       <div className="container mx-auto px-6 md:px-12 py-12">
          {activeTab === 'inventory' && (
             isCreating || editingItem ? (
                <ProductForm 
                  initialData={editingItem || {}} 
                  categories={categories}
                  onSave={handleSaveProduct} 
                  onCancel={() => { setEditingItem(null); setIsCreating(false); }} 
                />
             ) : (
                <ProductList 
                  items={localItems} 
                  categories={categories}
                  onEdit={setEditingItem} 
                  onDelete={handleDeleteProduct}
                  onCreate={() => setIsCreating(true)}
                />
             )
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

          {activeTab === 'collections' && (
              <CollectionManager 
                categories={categories} 
                onUpdate={handleCategoryUpdate} 
                onDelete={(id) => alert("Delete not implemented in demo")} 
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