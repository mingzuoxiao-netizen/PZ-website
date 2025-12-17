import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch } from '../../utils/adminFetch';
import { useLanguage } from '../../contexts/LanguageContext';

import PortalLayout from './PortalLayout';

// Tabs
import ReviewQueue from './ReviewQueue';
import InventoryManager from './InventoryManager';
import CollectionManager from './CollectionManager';
import SiteConfigEditor from './SiteConfigEditor';
import PageAssets from './PageAssets';
import AccountsManager from './AccountsManager';

// Types
import { ProductVariant, Category } from '../../types';
import { categories as staticCategories } from '../../data/inventory';

/**
 * NOTE:
 * Products are legacy admin-only helpers.
 * They are NOT the source of truth for site publishing.
 * SiteConfig + Assets define what appears on the website.
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

  // Legacy products (admin-only helper)
  const [products, setProducts] = useState<ProductVariant[]>([]);

  // Site config (SOURCE OF TRUTH)
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Categories (site-config overrides static)
  const [categories, setCategories] = useState<Category[]>(staticCategories);

  const [loading, setLoading] = useState(true);

  /* ------------------------
     Load data
  ------------------------ */
  const loadData = async () => {
    setLoading(true);
    try {
      // Products are legacy → failure is acceptable
      const productsPromise = adminFetch('/admin/products?limit=500')
        .then(res => res.products || [])
        .catch(err => {
          console.warn('[Admin] products unavailable:', err);
          return [];
        });

      // Site config is CORE → must succeed
      const configRes = await adminFetch('/site-config');

      const legacyProducts = await productsPromise;

      setProducts(legacyProducts);
      setSiteConfig(configRes.config || null);

      if (configRes.config?.categories?.length > 0) {
        setCategories(configRes.config.categories);
      } else {
        setCategories(staticCategories);
      }
    } catch (err) {
      console.error('[Admin] Failed to load site config', err);
      alert('Failed to load site configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ------------------------
     Product save (legacy)
  ------------------------ */
  const handleSaveProduct = async (product: ProductVariant) => {
    if (!product) return;

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

    await loadData();
  };

  /* ------------------------
     Review actions (SAFE)
  ------------------------ */
  const handleReviewAction = async (
    id: string,
    status: 'published' | 'rejected'
  ) => {
    await adminFetch(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    await loadData();
  };

  /* ------------------------
     Site config save (SINGLE ENTRY)
  ------------------------ */
  const handleSaveConfig = async (config: any) => {
    await adminFetch('/site-config', {
      method: 'POST',
      body: JSON.stringify(config),
    });
    setSiteConfig(config);
    alert('Site configuration saved.');
  };

  /* ------------------------
     Upload / delete assets (Admin only)
  ------------------------ */
  const handleAdminUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await adminFetch('/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!res.url) throw new Error('Upload failed');
    return res.url;
  };

  const handleAdminDelete = async (url: string) => {
    await adminFetch('/admin/delete-image', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    alert('Image deleted.');
  };

  /* ------------------------
     Render
  ------------------------ */
  return (
    <PortalLayout role="ADMIN" userName={userName}>
      {loading ? (
        <div className="py-20 text-center text-stone-400">Loading admin workspace…</div>
      ) : (
        <>
          {activeTab === 'review' && (
            <ReviewQueue
              items={products.filter(p => p.status === 'pending')}
              onProcess={(id, action) =>
                handleReviewAction(
                  id,
                  action === 'approve' ? 'published' : 'rejected'
                )
              }
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager
              items={products}
              categories={categories}
              onSave={handleSaveProduct}
            />
          )}

          {activeTab === 'collections' && siteConfig && (
            <CollectionManager
              categories={categories}
              onUpdate={(cats) => {
                if (!siteConfig) return;
                setSiteConfig({ ...siteConfig, categories: cats });
                setCategories(cats);
              }}
            />
          )}

          {activeTab === 'config' && siteConfig && (
            <SiteConfigEditor
              config={siteConfig}
              onSave={handleSaveConfig}
              onUpload={handleAdminUpload}
              onDelete={handleAdminDelete}
            />
          )}

          {activeTab === 'assets' && (
            <PageAssets
              onUpload={handleAdminUpload}
              onDelete={handleAdminDelete}
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

