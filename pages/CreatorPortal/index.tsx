
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { SiteConfig, SiteMeta } from '../../utils/siteConfig';
import { ProductVariant, Category } from '../../types';
import { Link } from 'react-router-dom';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; 
import { DEFAULT_ASSETS } from '../../utils/assets';
import { Bell, Shield, Factory } from 'lucide-react';

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import CategoryGrid from './components/CategoryGrid';
import CollectionManager from './components/CollectionManager';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';

const CreatorPortal: React.FC = () => {
  const { t } = useLanguage();
  const { config: publishedConfig, meta, refresh } = usePublishedSiteConfig();
  
  // --- AUTH & ROLE STATE ---
  const [role, setRole] = useState<'ADMIN' | 'FACTORY'>('FACTORY');
  const [userName, setUserName] = useState('');

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<string>('inventory');
  
  // --- DATA STATE ---
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [configMeta, setConfigMeta] = useState<SiteMeta | null>(null);
  const [assetHistory, setAssetHistory] = useState<Record<string, any[]>>({});
  const [viewingHistoryKey, setViewingHistoryKey] = useState<string | null>(null);

  // --- UI STATE ---
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // --- INIT ---
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
    // Load Role from Session
    const storedRole = sessionStorage.getItem('pz_user_role');
    const storedName = sessionStorage.getItem('pz_user_name');
    if (storedRole === 'ADMIN') setRole('ADMIN');
    else setRole('FACTORY');
    if (storedName) setUserName(storedName);

    loadData();
  }, []);

  // --- COMPUTED ---
  // Updated status check to 'pending'
  const pendingReviewCount = localItems.filter(i => i.status === 'pending').length;

  // --- ACTIONS ---
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
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await adminFetch(`/products/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setSavingConfig(true);
    try {
      await adminFetch('/site-config', {
        method: 'POST',
        body: JSON.stringify({ config: siteConfig })
      });
      refresh(); 
      loadData(); 
      alert("Site Configuration Published!");
    } catch (e: any) {
      alert(`Failed to save config: ${e.message}`);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveCategories = async (updatedCategory: Category) => {
      if (!siteConfig) return;
      const newCategories = categories.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
      );
      setCategories(newCategories);
      const newConfig = { ...siteConfig, categories: newCategories };
      setSiteConfig(newConfig);
      setSavingConfig(true);
      try {
        await adminFetch('/site-config', {
            method: 'POST',
            body: JSON.stringify({ config: newConfig })
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

  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center font-mono text-sm text-stone-500">Loading System...</div>;

  const activeCategoryTitle = selectedCategoryId 
    ? categories.find(c => c.id === selectedCategoryId)?.title 
    : 'All Products';

  const filteredItems = selectedCategoryId 
    ? localItems.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : localItems;

  return (
    <div className="min-h-screen bg-stone-100 pb-20">
       {/* TOP NAV */}
       <div className="bg-white border-b border-stone-200 sticky top-0 z-40 px-6 md:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center">
              <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-900 mr-4 font-bold text-xs uppercase tracking-widest">
                 ← Exit
              </Link>
              <div className="flex items-center space-x-3 border-l border-stone-200 pl-4">
                  <div className={`p-1.5 rounded-sm ${role === 'ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {role === 'ADMIN' ? <Shield size={16} /> : <Factory size={16} />}
                  </div>
                  <div>
                      <h1 className="font-serif text-sm font-bold text-stone-900 leading-none">{userName}</h1>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest">{role === 'ADMIN' ? 'Decision Maker' : 'Factory Editor'}</p>
                  </div>
              </div>
          </div>
          
          <div className="flex items-center space-x-8">
             {/* ADMIN TABS */}
             {role === 'ADMIN' && (
                 <>
                    <button onClick={() => setActiveTab('review')} className={`relative text-sm font-bold uppercase tracking-widest ${activeTab === 'review' ? 'text-amber-700' : 'text-stone-400'}`}>
                        Review
                        {pendingReviewCount > 0 && (
                            <span className="absolute -top-2 -right-3 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse">
                                {pendingReviewCount}
                            </span>
                        )}
                    </button>
                    <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-amber-700' : 'text-stone-400'}`}>
                        Inventory
                    </button>
                    <button onClick={() => setActiveTab('accounts')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'accounts' ? 'text-amber-700' : 'text-stone-400'}`}>
                        Accounts
                    </button>
                    <button onClick={() => setActiveTab('config')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-amber-700' : 'text-stone-400'}`}>
                        Config
                    </button>
                 </>
             )}

             {/* FACTORY TABS */}
             {role === 'FACTORY' && (
                 <>
                    <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-blue-700' : 'text-stone-400'}`}>
                        My Inventory
                    </button>
                    <button onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-blue-700' : 'text-stone-400'}`}>
                        Media Library
                    </button>
                 </>
             )}
          </div>
       </div>

       <div className="container mx-auto px-6 md:px-12 py-12">
          
          {/* --- ADMIN: REVIEW QUEUE --- */}
          {activeTab === 'review' && role === 'ADMIN' && (
              <ReviewQueue 
                products={localItems.filter(i => i.status === 'pending')} 
                onProcess={(id, action, note) => {
                    // Find item
                    const item = localItems.find(i => i.id === id);
                    if (!item) return;
                    
                    // Update status locally for speed, then save
                    const updated = {
                        ...item,
                        status: action === 'approve' ? 'published' : 'rejected', // Updated to 'rejected'
                        // In real app, we'd append to an audit log here
                    };
                    handleSaveProduct(updated);
                    alert(`Product ${action === 'approve' ? 'Approved' : 'Rejected'}.`);
                }}
              />
          )}

          {/* --- SHARED: INVENTORY --- */}
          {activeTab === 'inventory' && (
             <>
                {(isCreating || editingItem) ? (
                    <ProductForm 
                        initialData={editingItem || {}} 
                        categories={categories}
                        fixedCategoryId={isCreating && selectedCategoryId ? selectedCategoryId : undefined}
                        onSave={handleSaveProduct} 
                        onCancel={() => { setEditingItem(null); setIsCreating(false); }}
                        userRole={role} // Pass role to restrict form actions
                    />
                ) : (
                    <>
                        {/* Root Grid */}
                        {!selectedCategoryId && !editingItem && !isCreating && (
                            <CategoryGrid 
                                categories={categories}
                                products={role === 'ADMIN' ? localItems : localItems} // Factory sees all or filtered? Usually all to know what exists.
                                onSelectCategory={setSelectedCategoryId}
                                onSelectAll={() => setSelectedCategoryId('ALL_MASTER')}
                                onCreateCategory={role === 'ADMIN' ? () => setActiveTab('collections') : undefined}
                            />
                        )}

                        {/* Filtered List */}
                        {selectedCategoryId && (
                            <ProductList 
                                items={filteredItems} 
                                categories={categories}
                                categoryTitle={selectedCategoryId === 'ALL_MASTER' ? 'Master Inventory List' : activeCategoryTitle}
                                onBack={() => setSelectedCategoryId(null)}
                                onEdit={setEditingItem} 
                                onDelete={role === 'ADMIN' ? handleDeleteProduct : () => alert("Factory users cannot delete products. Please archive instead.")}
                                onCreate={() => setIsCreating(true)}
                            />
                        )}
                    </>
                )}
             </>
          )}

          {/* --- ADMIN: COLLECTIONS --- */}
          {activeTab === 'collections' && role === 'ADMIN' && (
              <CollectionManager 
                  categories={categories}
                  onUpdate={handleSaveCategories}
                  onDelete={() => alert("Restricted.")}
              />
          )}

          {/* --- ADMIN: CONFIG --- */}
          {activeTab === 'config' && siteConfig && role === 'ADMIN' && (
             <SiteConfigEditor 
               config={siteConfig} 
               meta={configMeta}
               onChange={setSiteConfig} 
               onSave={handleSaveConfig} 
               isSaving={savingConfig}
               onRefresh={loadData}
             />
          )}
          
          {/* --- SHARED: ASSETS --- */}
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

          {/* --- ADMIN: ACCOUNTS --- */}
          {activeTab === 'accounts' && role === 'ADMIN' && (
              <AccountsManager />
          )}
       </div>
    </div>
  );
};

export default CreatorPortal;
