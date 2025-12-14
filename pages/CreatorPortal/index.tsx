
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { SiteConfig, SiteMeta } from '../../utils/siteConfig';
import { ProductVariant, Category } from '../../types';
import { Link } from 'react-router-dom';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; // Import static categories

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import { DEFAULT_ASSETS } from '../../utils/assets';

const CreatorPortal: React.FC = () => {
  const { t } = useLanguage();
  const { config: publishedConfig, meta, refresh } = usePublishedSiteConfig();
  
  // State
  const [activeTab, setActiveTab] = useState<'inventory' | 'config' | 'assets'>('inventory');
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  
  // STEP 1: Use Static Categories strictly. Do not fetch /categories or /collections.
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [configMeta, setConfigMeta] = useState<SiteMeta | null>(null);
  
  // Removed /assets/history fetching to prevent blocking
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
      // STEP 2: Promise.all only keeps 'really needed' (Inventory & SiteConfig)
      // Removed categoriesPromise and historyPromise to ensure stability.
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
        setConfigMeta({
          version: configRes.version,
          published_at: configRes.published_at
        });
      }

      // Note: Categories are statically loaded via import, no API call needed.

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
      refresh(); // Update public context
      loadData(); // Reload local state
      alert("Site Configuration Published!");
    } catch (e: any) {
      alert(`Failed to save config: ${e.message || "Unknown Error"}`);
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
       // No reload of data needed for asset update in this simplified version
       alert("Asset updated.");
    } catch (e: any) {
       alert(`Failed to update asset: ${e.message}`);
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
             {/* Collections Tab Removed - simplified to remove API dependency */}
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
