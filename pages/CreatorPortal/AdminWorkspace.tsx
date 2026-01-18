import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import MediaTools from './components/MediaTools';
import AuditTimeline from './components/AuditTimeline';

type AdminTab = 'review' | 'inventory' | 'media' | 'config' | 'accounts' | 'audit';

const AdminWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const loadProducts = async () => {
    try {
        const res = await adminFetch<{ products: any[] }>('admin/products?limit=1000');
        setProducts(normalizeProducts(res.products || []));
    } catch (e) {
        console.error("Failed to load products", e);
    }
  };

  const loadSiteConfig = async () => {
    try {
        const res = await adminFetch<any>('site-config');
        const remoteConfig = res.config ?? res;
        setSiteConfig({
            ...DEFAULT_CONFIG,
            ...remoteConfig,
            categories: (remoteConfig.categories && remoteConfig.categories.length > 0) 
                ? remoteConfig.categories 
                : DEFAULT_CONFIG.categories
        });
    } catch (e) {
        setSiteConfig(DEFAULT_CONFIG);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSiteConfig();
  }, []);

  const handleSaveProduct = async (product: any) => {
    try {
        if (product.id) {
            await adminFetch(`admin/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
        } else {
            await adminFetch('admin/products', { method: 'POST', body: JSON.stringify(product) });
        }
        setEditingProduct(null);
        setIsCreating(false);
        loadProducts();
    } catch (e: any) {
        alert(`错误: ${e.message}`);
    }
  };

  const handleProcessReview = async (id: string, action: 'approve' | 'reject', note?: string) => {
      try {
          const status = action === 'approve' ? 'published' : 'rejected';
          await adminFetch(`admin/products/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ status, admin_note: note })
          });
          loadProducts();
      } catch (e: any) {
          alert(`处理失败: ${e.message}`);
      }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await adminFetch<{ url: string }>('upload-image', { method: 'POST', body: formData });
    return res.url;
  };

  const navActions = (
    <>
      {[
        { id: 'review', label: '审核队列' },
        { id: 'inventory', label: '全库清单' },
        { id: 'media', label: '媒体库' },
        { id: 'config', label: '网站配置' },
        { id: 'accounts', label: '账号管理' },
        { id: 'audit', label: '审计日志' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => { setActiveTab(tab.id as AdminTab); setEditingProduct(null); setIsCreating(false); }}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm
            ${activeTab === tab.id ? 'bg-amber-700 text-white' : 'text-stone-400 hover:text-stone-200'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </>
  );

  const pendingItems = products.filter(p => p.status === 'pending');

  return (
    <PortalLayout role="ADMIN" userName="系统管理员" navActions={navActions}>
      {activeTab === 'review' && (
        <ReviewQueue products={pendingItems} onProcess={handleProcessReview} lang="zh" />
      )}

      {activeTab === 'inventory' && (
        <>
          {editingProduct || isCreating ? (
            <ProductForm
              initialData={editingProduct || {}}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onSave={handleSaveProduct}
              onCancel={() => { setEditingProduct(null); setIsCreating(false); }}
              onUpload={handleUpload}
              userRole="ADMIN"
              lang="zh"
            />
          ) : (
            <ProductList
              lang="zh"
              items={products}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onEdit={setEditingProduct}
              onCreate={() => setIsCreating(true)}
              onBack={() => {}}
            />
          )}
        </>
      )}

      {activeTab === 'media' && <MediaTools />}

      {activeTab === 'config' && (
        <SiteConfigEditor
          config={siteConfig}
          onChange={setSiteConfig}
          onSave={async () => {
             setIsSavingConfig(true);
             try {
                await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) });
                alert('配置已成功发布');
                loadSiteConfig();
             } catch(e: any) { alert(e.message); }
             finally { setIsSavingConfig(false); }
          }}
          isSaving={isSavingConfig}
          onRefresh={loadSiteConfig}
          onUpload={handleUpload}
        />
      )}

      {activeTab === 'accounts' && <AccountsManager />}
      {activeTab === 'audit' && <AuditTimeline />}
    </PortalLayout>
  );
};

export default AdminWorkspace;