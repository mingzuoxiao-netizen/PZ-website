import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import PortalLayout from '../FactoryPortal/PortalLayout';

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
    const res = await adminFetch<{ products: any[] }>('/admin/products');
    setProducts(normalizeProducts(res.products || []));
  };

  const loadSiteConfig = async () => {
    const res = await adminFetch<any>('/site-config');
    // Contract: { config, meta }
    setSiteConfig(res.config ?? res);
    setSiteMeta(res.meta ?? null);
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
  };

  /* =========================
   * Site Config Handlers
   ========================= */
  const handleSaveSiteConfig = async () => {
    if (!siteConfig) return;
    setIsSavingConfig(true);
    try {
      await adminFetch('/site-config', {
        method: 'PUT',
        body: JSON.stringify({ config: siteConfig }),
      });
      await loadSiteConfig();
      alert('Site configuration published.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  /* =========================
   * Render
   ========================= */
  return (
    <PortalLayout role="ADMIN">
      {activeTab === 'products' && (
        <>
          {editingProduct || isCreating ? (
            <ProductForm
              initialData={editingProduct || {}}
              onSave={handleSaveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setIsCreating(false);
              }}
            />
          ) : (
            <ProductList
              items={products}
              onEdit={setEditingProduct}
              onCreate={() => setIsCreating(true)}
            />
          )}
        </>
      )}

      {activeTab === 'site-config' && (
        <SiteConfigEditor
          config={siteConfig}
          meta={siteMeta}
          onChange={setSiteConfig}
          onSave={handleSaveSiteConfig}
          isSaving={isSavingConfig}
          onRefresh={loadSiteConfig}
          onUpload={async (file) => {
            const form = new FormData();
            form.append('file', file);
            const res = await adminFetch<{ url: string }>('/upload-image', {
              method: 'POST',
              body: form,
            });
            return res.url;
          }}
        />
      )}

      {activeTab === 'accounts' && <AccountsManager />}
      {activeTab === 'inquiries' && <InquiriesPanel />}
    </PortalLayout>
  );
};

export default AdminWorkspace;


    