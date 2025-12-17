import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
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
  const [siteMeta, setSiteMeta] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  /* =========================
   * Loaders
   ========================= */
  const loadProducts = async () => {
    try {
        const res = await adminFetch<{ products: any[] }>('/admin/products?limit=500');
        setProducts(normalizeProducts(res.products || []));
    } catch (e) {
        console.error("Failed to load products", e);
    }
  };

  const loadSiteConfig = async () => {
    try {
        const res = await adminFetch<any>('/site-config');
        setSiteConfig(res.config ?? res);
        setSiteMeta(res.meta ?? null);
    } catch (e) {
        console.error("Failed to load site config", e);
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
      await adminFetch('/site-config', {
        method: 'POST', // Changed from PUT to POST to match SiteConfigEditor expectation if needed, or keeping usage consistent with API contract
        body: JSON.stringify({ config: siteConfig }),
      });
      await loadSiteConfig();
      alert('Site configuration published.');
    } catch (e: any) {
        alert(`Error saving config: ${e.message}`);
    } finally {
      setIsSavingConfig(false);
    }
  };

  /* =========================
   * Admin Upload
   ========================= */
  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminFetch<{ url: string }>('/upload-image', {
      method: 'POST',
      body: formData,
    });
    return res.url;
  };

  const handleDelete = async (url: string) => {
      // Logic handled in component or add endpoint here
  };

  /* =========================
   * Render
   ========================= */
  return (
    <PortalLayout 
        role="ADMIN" 
        userName="Admin"
        navActions={
            <div className="flex space-x-6">
                <button onClick={() => setActiveTab('products')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'products' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400'}`}>Inventory</button>
                <button onClick={() => setActiveTab('site-config')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'site-config' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400'}`}>Site Config</button>
                <button onClick={() => setActiveTab('accounts')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'accounts' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400'}`}>Accounts</button>
                <button onClick={() => setActiveTab('inquiries')} className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'inquiries' ? 'text-amber-700 border-b border-amber-700' : 'text-stone-400'}`}>Inquiries</button>
            </div>
        }
    >
      {activeTab === 'products' && (
        <>
          {editingProduct || isCreating ? (
            <ProductForm
              initialData={editingProduct || {}}
              categories={siteConfig?.categories || []}
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
              categories={siteConfig?.categories || []}
              onEdit={setEditingProduct}
              onCreate={() => setIsCreating(true)}
              onBack={() => {}} // No category nav in simple list mode
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