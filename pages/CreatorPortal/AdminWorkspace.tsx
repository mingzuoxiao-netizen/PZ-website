
import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';

// Admin sub-pages
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import AccountsManager from './components/AccountsManager';
import InquiriesPanel from './components/InquiriesPanel';

type Tab = 'products' | 'site-config' | 'accounts' | 'inquiries';

const AdminWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  /* =========================
   * Products
   ========================= */
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  /* =========================
   * Site Config
   ========================= */
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  /* =========================
   * Loaders
   ========================= */
  const loadProducts = async () => {
    try {
        const res = await adminFetch<{ products: any[] }>('admin/products?limit=500');
        setProducts(normalizeProducts(res.products || []));
    } catch (e) {
        console.error("Failed to load products", e);
    }
  };

  const loadSiteConfig = async () => {
    try {
        // GET /site-config
        const res = await adminFetch<any>('site-config');
        const remoteConfig = res.config ?? res;
        
        // ✅ Robustness: Merge with defaults to ensure 'categories' and other vital keys exist
        setSiteConfig({
            ...DEFAULT_CONFIG,
            ...remoteConfig,
            // Ensure categories specifically are preserved or defaulted
            categories: (remoteConfig.categories && remoteConfig.categories.length > 0) 
                ? remoteConfig.categories 
                : DEFAULT_CONFIG.categories
        });
    } catch (e) {
        console.error("Failed to load site config", e);
        setSiteConfig(DEFAULT_CONFIG);
    }
  };

  /* =========================
   * Initial Load
   ========================= */
  useEffect(() => {
    loadProducts();
    loadSiteConfig();
  }, []);

  /* =========================
   * Product Handlers
   ========================= */
  const handleSaveProduct = async (product: any) => {
    try {
        if (product.id) {
            await adminFetch(`admin/products/${product.id}`, {
                method: 'PUT',
                body: JSON.stringify(product),
            });
        } else {
            await adminFetch('admin/products', {
                method: 'POST',
                body: JSON.stringify(product),
            });
        }

        setEditingProduct(null);
        setIsCreating(false);
        loadProducts();
    } catch (e: any) {
        alert(`Error saving product: ${e.message}`);
    }
  };

  /* =========================
   * Site Config Handlers
   ========================= */
  const handleSaveSiteConfig = async () => {
    if (!siteConfig) return;
    setIsSavingConfig(true);
    try {
      await adminFetch('site-config', {
        method: 'PUT', 
        body: JSON.stringify(siteConfig),
      });
      alert('Site configuration published successfully.');
      await loadSiteConfig();
    } catch (e: any) {
        alert(`Error saving config: ${e.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminFetch<{ url: string }>('upload-image', {
      method: 'POST',
      body: formData,
    });
    return res.url;
  };

  return (
    <PortalLayout 
        role="ADMIN" 
        userName="Administrator"
        navActions={
            <div className="flex space-x-6">
                <button onClick={() => setActiveTab('products')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'products' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Inventory</button>
                <button onClick={() => setActiveTab('site-config')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'site-config' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Site Config</button>
                <button onClick={() => setActiveTab('accounts')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'accounts' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Accounts</button>
                <button onClick={() => setActiveTab('inquiries')} className={`text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'inquiries' ? 'text-amber-700 border-b-2 border-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>Inquiries</button>
            </div>
        }
    >
      {activeTab === 'products' && (
        <>
          {editingProduct || isCreating ? (
            <ProductForm
              initialData={editingProduct || {}}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onSave={handleSaveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setIsCreating(false);
              }}
              onUpload={handleUpload}
              userRole="ADMIN"
              lang="en"
            />
          ) : (
            <ProductList
              lang="en"
              items={products}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onEdit={setEditingProduct}
              onCreate={() => setIsCreating(true)}
              onBack={() => {}}
            />
          )}
        </>
      )}

      {activeTab === 'site-config' && (
        <SiteConfigEditor
          config={siteConfig}
          onChange={setSiteConfig}
          onSave={handleSaveSiteConfig}
          isSaving={isSavingConfig}
          onRefresh={loadSiteConfig}
          onUpload={handleUpload}
        />
      )}

      {activeTab === 'accounts' && <AccountsManager />}
      {activeTab === 'inquiries' && <InquiriesPanel />}
    </PortalLayout>
  );
};

export default AdminWorkspace;
