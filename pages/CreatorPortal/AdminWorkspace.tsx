
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';

import PortalLayout from './PortalLayout';

// Tabs (Corrected Paths: pointing to ./components/)
import ReviewQueue from './components/ReviewQueue';
import CollectionManager from './components/CollectionManager';
import SiteConfigEditor from './components/SiteConfigEditor';
import PageAssets from './components/PageAssets';
import AccountsManager from './components/AccountsManager';

// Components for Inventory Logic
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';

// Types
import { ProductVariant, Category } from '../../types';
import { categories as staticCategories } from '../../data/inventory';
import { normalizeProducts } from '../../utils/normalizeProduct';

/**
 * Admin Workspace
 * Orchestrates all CMS features.
 */
const AdminWorkspace: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  /* ------------------------
     Role guard (UX only)
  ------------------------ */
  const userRole = sessionStorage.getItem('pz_user_role');
  const userName = sessionStorage.getItem('pz_user_name') || 'Admin';

  useEffect(() => {
    if (!userRole) return;
    if (userRole !== 'ADMIN') {
      navigate('/creator/factory', { replace: true });
    }
  }, [userRole, navigate]);

  if (!userRole) {
    return (
      <div className="py-20 text-center text-stone-400">
        Checking permission…
      </div>
    );
  }

  /* ------------------------
     State
  ------------------------ */
  const [activeTab, setActiveTab] = useState<
    'review' | 'inventory' | 'collections' | 'config' | 'assets' | 'accounts'
  >('review');

  // Inventory State
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  
  // Inventory UI State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [loading, setLoading] = useState(true);

  /* ------------------------
     Load data
  ------------------------ */
  const loadData = async () => {
    setLoading(true);
    try {
      const productsPromise = adminFetch('/admin/products?limit=500')
        .then(res => res.products || [])
        .catch(err => {
          console.warn('[Admin] products unavailable:', err);
          return [];
        });

      const configRes = await adminFetch('/site-config');

      const rawProducts = await productsPromise;
      setProducts(normalizeProducts(rawProducts));
      
      setSiteConfig(configRes.config || null);

      if (configRes.config?.categories?.length > 0) {
        setCategories(configRes.config.categories);
      } else {
        setCategories(staticCategories);
      }
    } catch (err) {
      console.error('[Admin] Failed to load site config', err);
      // alert('Failed to load site configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ------------------------
     Handlers
  ------------------------ */
  const handleSaveProduct = async (product: ProductVariant) => {
    try {
      if (product.id) {
        await adminFetch(`/admin/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(product),
        });
      } else {
        await adminFetch('/admin/products', {
          method: 'POST',
          body: JSON.stringify(product),
        });
      }
      setEditingItem(null);
      setIsCreating(false);
      await loadData();
    } catch (e: any) {
      alert(`Error saving product: ${e.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
        await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
        await loadData();
    } catch (e: any) {
        alert(`Error deleting: ${e.message}`);
    }
  };

  const handleReviewAction = async (
    id: string,
    action: 'approve' | 'reject',
    note?: string
  ) => {
    const status = action === 'approve' ? 'published' : 'rejected';
    try {
        await adminFetch(`/admin/products/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status, note }),
        });
        await loadData();
    } catch (e: any) {
        alert(`Action failed: ${e.message}`);
    }
  };

  const handleSaveConfig = async (config: any) => {
    await adminFetch('/site-config', {
      method: 'POST',
      body: JSON.stringify({ config }),
    });
    setSiteConfig(config);
    alert('Site configuration saved.');
  };

  const handleAdminUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await adminFetch<{ url: string }>('/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!res.url) throw new Error('Upload failed');
    return res.url;
  };

  const handleAdminDelete = async (url: string) => {
    await adminFetch('/admin/delete-image', {
      method: 'POST',
      body: JSON.stringify({ url }), // Matches backend expectation often used
    });
    // Note: Backend might expect { key } or { url }. 
    // AdminFetch wrapper handles 204/200.
  };

  const filteredItems = selectedCategoryId 
    ? products.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : products;

  /* ------------------------
     Render
  ------------------------ */
  return (
    <PortalLayout 
        role="ADMIN" 
        userName={userName}
        navActions={
            <>
                <button onClick={() => setActiveTab('review')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'review' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Review</button>
                <button onClick={() => { setActiveTab('inventory'); setSelectedCategoryId(null); }} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'inventory' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Inventory</button>
                <button onClick={() => setActiveTab('collections')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'collections' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Collections</button>
                <button onClick={() => setActiveTab('config')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'config' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Site Config</button>
                <button onClick={() => setActiveTab('assets')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'assets' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Assets</button>
                <button onClick={() => setActiveTab('accounts')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'accounts' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Accounts</button>
            </>
        }
    >
      {loading ? (
        <div className="py-20 text-center text-stone-400">Loading admin workspace…</div>
      ) : (
        <>
          {activeTab === 'review' && (
            <ReviewQueue
              lang={language}
              products={products.filter(p => p.status === 'pending')}
              onProcess={handleReviewAction}
            />
          )}

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
                                products={products}
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

          {activeTab === 'collections' && siteConfig && (
            <CollectionManager
              categories={categories}
              onUpload={handleAdminUpload}
              onDelete={handleDeleteProduct}
              onUpdate={(cat) => {
                if (!siteConfig) return;
                const newCats = categories.map(c => c.id === cat.id ? cat : c);
                // If it's a new category (not found), append it
                if (!categories.find(c => c.id === cat.id)) newCats.push(cat);
                
                const newConfig = { ...siteConfig, categories: newCats };
                handleSaveConfig(newConfig);
                setCategories(newCats);
              }}
            />
          )}

          {activeTab === 'config' && siteConfig && (
            <SiteConfigEditor
              config={siteConfig}
              meta={{ version: 'latest', published_at: new Date().toISOString() }} 
              onSave={() => handleSaveConfig(siteConfig)}
              onChange={setSiteConfig}
              isSaving={false}
              onRefresh={loadData}
              onUpload={handleAdminUpload}
              onDelete={async (url) => handleAdminDelete(url)}
            />
          )}

          {activeTab === 'assets' && (
            <PageAssets
              customAssets={{}} 
              assetHistory={{}}
              onAssetUpdate={(key, url) => console.log(key, url)}
              onAssetReset={() => {}}
              onAssetRollback={() => {}}
              viewingHistoryKey={null}
              setViewingHistoryKey={() => {}}
              onUpload={handleAdminUpload}
              onDelete={async (url) => handleAdminDelete(url)}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsManager />
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default AdminWorkspace;
    