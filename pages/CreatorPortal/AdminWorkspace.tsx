
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch } from '../../utils/adminFetch';
import { usePublishedSiteConfig } from '../../contexts/SiteConfigContext';
import { SiteConfig, SiteMeta, DEFAULT_CONFIG } from '../../utils/siteConfig';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory'; 
import { DEFAULT_ASSETS } from '../../utils/assets';
import { useLanguage } from '../../contexts/LanguageContext';
import PortalLayout from './PortalLayout';

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import CategoryGrid from './components/CategoryGrid';
import CollectionManager from './components/CollectionManager';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';

const AdminWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<string>('review');
  const { config: publishedConfig, meta, refresh } = usePublishedSiteConfig();
  
  // Data State
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [configMeta, setConfigMeta] = useState<SiteMeta | null>(null);
  const [assetHistory, setAssetHistory] = useState<Record<string, any[]>>({});
  const [viewingHistoryKey, setViewingHistoryKey] = useState<string | null>(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const userName = sessionStorage.getItem('pz_user_name') || 'Admin';
  const userRole = sessionStorage.getItem('pz_user_role');

  const txt = t.creator.tabs;

  // --- ROLE CHECK ---
  useEffect(() => {
    if (userRole !== 'ADMIN') {
        navigate('/creator/factory', { replace: true });
    }
  }, [userRole, navigate]);

  // --- INIT DATA ---
  const loadData = async () => {
    setLoading(true);
    try {
      const inventoryPromise = adminFetch<{ products?: any[], data?: any[] }>('/admin/products?limit=500');
      const configPromise = adminFetch<{ config: SiteConfig, version: string, published_at: string }>('/site-config');

      const results = await Promise.allSettled([inventoryPromise, configPromise]);

      const inventoryRes = results[0].status === 'fulfilled' ? results[0].value : { products: [] };
      const rawItems = inventoryRes.products || inventoryRes.data || [];
      setLocalItems(normalizeProducts(rawItems));

      const configRes = results[1].status === 'fulfilled' ? results[1].value : null;
      
      // ✅ Fallback logic: Use Remote Config if exists, otherwise load Local Default
      if (configRes && configRes.config) {
        setSiteConfig(configRes.config);
        if (configRes.config.categories?.length > 0) {
            setCategories(configRes.config.categories);
        }
        setConfigMeta({ version: configRes.version, published_at: configRes.published_at });
      } else {
        console.warn("No remote config found. Initializing with defaults.");
        setSiteConfig(DEFAULT_CONFIG);
        setConfigMeta(null);
      }
    } catch (e) {
      console.error("Failed to load Admin data", e);
      // Ensure UI doesn't break on total failure
      setSiteConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pendingReviewCount = localItems.filter(i => i.status === 'pending').length;

  // --- HANDLERS ---
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
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try { await adminFetch(`/products/${id}`, { method: 'DELETE' }); loadData(); } catch (e: any) { alert(e.message); }
  };

  const handleSaveConfig = async () => {
    if (!siteConfig) return;
    setSavingConfig(true);
    try {
      await adminFetch('/site-config', { method: 'POST', body: JSON.stringify({ config: siteConfig }) });
      refresh(); loadData(); alert("Config Saved");
    } catch (e: any) { alert(e.message); } finally { setSavingConfig(false); }
  };

  const handleAssetUpdate = async (key: string, url: string) => {
    try { await adminFetch('/assets', { method: 'POST', body: JSON.stringify({ key, url }) }); alert("Asset Saved"); } 
    catch (e: any) { alert(e.message); }
  };

  const handleAdminUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await adminFetch<{ url: string }>('/upload-image', {
        method: 'POST',
        body: formData,
    });
    if (!data.url) throw new Error("Upload failed: No URL returned");
    return data.url;
  };

  const filteredItems = selectedCategoryId 
    ? localItems.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : localItems;

  return (
    <PortalLayout 
        role="ADMIN" 
        userName={userName}
        navActions={
            <>
                <button onClick={() => setActiveTab('review')} className={`relative text-sm font-bold uppercase tracking-widest ${activeTab === 'review' ? 'text-amber-700' : 'text-stone-400'}`}>
                    {txt.review}
                    {pendingReviewCount > 0 && (
                        <span className="absolute -top-2 -right-3 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full animate-pulse">
                            {pendingReviewCount}
                        </span>
                    )}
                </button>
                <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-amber-700' : 'text-stone-400'}`}>
                    {txt.inventory}
                </button>
                <button onClick={() => setActiveTab('accounts')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'accounts' ? 'text-amber-700' : 'text-stone-400'}`}>
                    {txt.accounts}
                </button>
                <button onClick={() => setActiveTab('config')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-amber-700' : 'text-stone-400'}`}>
                    {txt.config}
                </button>
                <button onClick={() => setActiveTab('assets')} className={`text-sm font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-amber-700' : 'text-stone-400'}`}>
                    {txt.assets}
                </button>
            </>
        }
    >
        {loading ? <div className="text-center py-20 text-stone-400">Loading Admin Workspace...</div> : (
            <>
                {/* 1. REVIEW QUEUE */}
                {activeTab === 'review' && (
                    <ReviewQueue 
                        lang={language}
                        products={localItems.filter(i => i.status === 'pending')} 
                        onProcess={(id, action) => {
                            const item = localItems.find(i => i.id === id);
                            if (item) handleSaveProduct({ ...item, status: action === 'approve' ? 'published' : 'rejected' });
                        }}
                    />
                )}

                {/* 2. INVENTORY */}
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
                                onUpload={handleAdminUpload}
                                userRole="ADMIN"
                            />
                        ) : (
                            <>
                                {!selectedCategoryId ? (
                                    <CategoryGrid 
                                        categories={categories}
                                        products={localItems}
                                        onSelectCategory={setSelectedCategoryId}
                                        onSelectAll={() => setSelectedCategoryId('ALL_MASTER')}
                                        onCreateCategory={() => setActiveTab('collections')}
                                    />
                                ) : (
                                    <ProductList 
                                        lang={language}
                                        items={filteredItems} 
                                        categories={categories}
                                        categoryTitle={selectedCategoryId === 'ALL_MASTER' ? 'Full Inventory' : categories.find(c=>c.id===selectedCategoryId)?.title}
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

                {/* 3. COLLECTIONS */}
                {activeTab === 'collections' && (
                    <CollectionManager 
                        categories={categories}
                        onUpdate={(cat) => {
                            const newCats = categories.map(c => c.id === cat.id ? cat : c);
                            setCategories(newCats);
                            if (siteConfig) {
                                const newConfig = { ...siteConfig, categories: newCats };
                                setSiteConfig(newConfig);
                                adminFetch('/site-config', { method: 'POST', body: JSON.stringify({ config: newConfig }) }).then(refresh);
                            }
                            setActiveTab('inventory');
                        }}
                        onDelete={() => alert("Restricted.")}
                        onUpload={handleAdminUpload}
                    />
                )}

                {/* 4. CONFIG */}
                {activeTab === 'config' && siteConfig && (
                    <SiteConfigEditor 
                        config={siteConfig} 
                        meta={configMeta}
                        onChange={setSiteConfig} 
                        onSave={handleSaveConfig} 
                        isSaving={savingConfig}
                        onRefresh={loadData}
                        onUpload={handleAdminUpload}
                    />
                )}

                {/* 5. ACCOUNTS */}
                {activeTab === 'accounts' && <AccountsManager />}

                {/* 6. ASSETS */}
                {activeTab === 'assets' && (
                    <PageAssets 
                        customAssets={DEFAULT_ASSETS} 
                        assetHistory={assetHistory}
                        onAssetUpdate={handleAssetUpdate}
                        onAssetReset={(k) => handleAssetUpdate(k, '')}
                        onAssetRollback={(k, u) => handleAssetUpdate(k, u)}
                        viewingHistoryKey={viewingHistoryKey}
                        setViewingHistoryKey={setViewingHistoryKey}
                        onUpload={handleAdminUpload}
                    />
                )}
            </>
        )}
    </PortalLayout>
  );
};

export default AdminWorkspace;
