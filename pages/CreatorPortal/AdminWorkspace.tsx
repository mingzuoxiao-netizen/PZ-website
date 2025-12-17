import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { extractKeyFromUrl } from '../../utils/getAssetUrl';

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

  // Products
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Site Config
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  /* =========================
     Loaders
  ========================= */

  const loadProducts = async () => {
    const res = await adminFetch<{ products: any[] }>('/admin/products');
    setProducts(normalizeProducts(res.products || []));
  };

  const loadSiteConfig = async () => {
    const res = await adminFetch<any>('/site-config');
    // contract: GET /site-config returns { config, meta }
    setSiteConfig(res.config ?? res);
  };

  /* =========================
     Initial Load
  ========================= */

  useEffect(() => {
    loadProducts();
    loadSiteConfig();
  }, []);

  /* =========================
     Product Handlers
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
    await loadProducts();
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product permanently?')) return;

    await adminFetch(`/admin/products/${id}`, { method: 'DELETE' });
    await loadProducts();
  };

  /* =========================
     Image Handlers
  ========================= */

  const handleUploadImage = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);

    const res = await adminFetch<{ url: string }>('/upload-image', {
      method: 'POST',
      body: form,
    });

    if (!res.url) throw new Error('Upload failed');
    return res.url;
  };

  const handleDeleteImage = async (url: string) => {
    const key = extractKeyFromUrl(url);
    if (!key) return;

    await adminFetch('/admin/delete-image', {
      method: 'POST',
      body: JSON.stringify({ key }),
    });
  };

  /* =========================
     Site Config Handlers
  ========================= */

  const handleSaveSiteConfig = async () => {
    if (!siteConfig) return;

    setIsSavingConfig(true);
    try {
      await adminFetch('/site-config', {
        method: 'PUT',
        body: JSON.stringify({ config: siteConfig }),
      });
      alert('Site configuration published.');
      await loadSiteConfig();
    } finally {
      setIsSavingConfig(false);
    }
  };

  /* =========================
     Render
  ========================= */

  return (
    <PortalLayout
      role="ADMIN"
      userName="Admin"
      navItems={[
        { key: 'products', label: 'Products' },
        { key: 'site-config', label: 'Site Config' },
        { key: 'accounts', label: 'Accounts' },
        { key: 'inquiries', label: 'Inquiries' },
      ]}
      activeKey={activeTab}
      onNavChange={(key) => setActiveTab(key as Tab)}
    >
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
              onUpload={handleUploadImage}
              onDeleteImage={handleDeleteImage}
              userRole="ADMIN"
            />
          ) : (
            <ProductList
              items={products}
              onEdit={setEditingProduct}
              onDelete={handleDeleteProduct}
              onCreate={() => setIsCreating(true)}
            />
          )}
        </>
      )}

      {activeTab === 'site-config' && siteConfig && (
        <SiteConfigEditor
          config={siteConfig}
          meta={null} // 🔒 no history / no versioning
          onChange={setSiteConfig}
          onSave={handleSaveSiteConfig}
          isSaving={isSavingConfig}
          onRefresh={loadSiteConfig}
          onUpload={handleUploadImage}
          onDelete={handleDeleteImage}
        />
      )}

      {activeTab === 'accounts' && <AccountsManager />}

      {activeTab === 'inquiries' && <InquiriesPanel />}
    </PortalLayout>
  );
};

export default AdminWorkspace;

    