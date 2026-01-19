import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';
import {
  RefreshCw, Package,
  LayoutGrid, Settings, Users, Activity,
  Plus, ArrowUpCircle
} from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import { extractKeyFromUrl } from '../../utils/imageResolver';

type AdminTab = 'review' | 'inventory' | 'config' | 'accounts' | 'audit';

const AdminWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('review');

  // ✅ 全量库存（Master Inventory / 列表页用）
  const [products, setProducts] = useState<any[]>([]);

  // ✅ 更干净：Review Queue 专用（只拉 awaiting_review）
  const [reviewProducts, setReviewProducts] = useState<any[]>([]);

  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingDeploy, setHasPendingDeploy] = useState(false);

  // ---------------------------
  // LOADERS
  // ---------------------------

  // 全量
  const loadProducts = useCallback(async () => {
    try {
      const res = await adminFetch<{ products?: any[]; items?: any[] }>('admin/products?limit=1000');
      const raw = res.products ?? res.items ?? [];
      setProducts(normalizeProducts(raw));
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ✅ 只拉待审核（awaiting_review）
  const loadReviewProducts = useCallback(async () => {
    try {
      const res = await adminFetch<{ products?: any[]; items?: any[] }>(
        'admin/products?status=awaiting_review&limit=1000'
      );
      const raw = res.products ?? res.items ?? [];
      setReviewProducts(normalizeProducts(raw));
    } catch (e) {
      console.error('Failed to load review products', e);
      setReviewProducts([]); // 保底
    }
  }, []);

  const loadCategoryQueue = useCallback(async () => {
    try {
      const res = await adminFetch<{ items: any[] }>('admin/category-requests?status=awaiting_review');
      setCategoryRequests(res.items ?? []);
    } catch (e) {
      console.error('Failed to load category queue', e);
      setCategoryRequests([]);
    }
  }, []);

  const loadSiteConfig = useCallback(async () => {
    try {
      // 你这里用 site-config（PUT/GET）可继续沿用
      const res = await adminFetch<any>('site-config');
      const remoteConfig = res?.config ?? res;
      setSiteConfig({ ...DEFAULT_CONFIG, ...remoteConfig });
    } catch (e) {
      setSiteConfig(DEFAULT_CONFIG);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadReviewProducts();
    loadCategoryQueue();
    loadSiteConfig();
  }, [loadProducts, loadReviewProducts, loadCategoryQueue, loadSiteConfig]);

  // ---------------------------
  // PRODUCT CRUD
  // ---------------------------

  const handleSaveProduct = async (product: any) => {
    try {
      if (product.id) {
        await adminFetch(`admin/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
      } else {
        await adminFetch('admin/products', { method: 'POST', body: JSON.stringify(product) });
      }
      setEditingProduct(null);
      setIsCreating(false);
      setHasPendingDeploy(true);

      await loadProducts();
      await loadReviewProducts(); // ✅ 如果你编辑的是待审核/状态变化，ReviewQueue 也同步
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteImage = async (url: string) => {
    const key = extractKeyFromUrl(url);
    if (!key) return;
    try {
      await adminFetch('admin/delete-image', { method: 'POST', body: JSON.stringify({ key }) });
    } catch (e) {
      console.warn('Cloud cleanup failed', e);
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    setIsSyncing(true);
    try {
      await Promise.all(
        ids.map(id =>
          adminFetch(`admin/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: newStatus,
              is_published: newStatus === 'published' ? 1 : 0,
            }),
          })
        )
      );
      setHasPendingDeploy(true);

      await loadProducts();
      await loadReviewProducts(); // ✅
    } catch (e: any) {
      alert(`Registry Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to permanently delete these ${ids.length} items and their cloud assets?`)) return;

    setIsSyncing(true);
    try {
      for (const id of ids) {
        const product = products.find(p => p.id === id);
        if (product?.images) {
          await Promise.all(product.images.map((img: string) => handleDeleteImage(img)));
        }
        await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
      }

      await loadProducts();
      await loadReviewProducts(); // ✅
    } catch (e: any) {
      alert(`Deletion Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ---------------------------
  // DEPLOY
  // ---------------------------

  const handleDeployEverything = async () => {
    if (!confirm('Start global production deployment? This will update the public directory.')) return;

    setIsSyncing(true);
    try {
      await adminFetch('admin/publish/products', { method: 'POST' });
      await adminFetch('admin/publish', { method: 'POST' });
      setHasPendingDeploy(false);
      alert('Deployment Successful // Public Catalog Updated');
    } catch (e: any) {
      alert(`Deployment Error: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ---------------------------
  // COUNTS (更靠谱)
  // ---------------------------

  // ✅ reviewProducts 就是待审数量
  const pendingProductCount = reviewProducts.length;
  const reviewTotalCount = pendingProductCount + categoryRequests.length;

  const navItems = [
    {
      id: 'review',
      label: 'Review Queue',
      icon: (
        <div className="relative">
          <Activity size={18} />
          {reviewTotalCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-safety-700 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">
              {reviewTotalCount}
            </span>
          )}
        </div>
      ),
    },
    { id: 'inventory', label: 'Master Inventory', icon: <Package size={18} /> },
    { id: 'config', label: 'Site Protocol', icon: <Settings size={18} /> },
    { id: 'accounts', label: 'Identities', icon: <Users size={18} /> },
    { id: 'audit', label: 'System Logs', icon: <LayoutGrid size={18} /> },
  ];

  return (
    <PortalLayout
      role="ADMIN"
      userName="System Admin"
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(id) => {
        setActiveTab(id as AdminTab);
        setEditingProduct(null);
        setIsCreating(false);
      }}
    >
      {!editingProduct && !isCreating && activeTab === 'inventory' && (
        <button
          onClick={() => setIsCreating(true)}
          className="fixed bottom-10 right-10 bg-safety-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        >
          <Plus size={32} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {hasPendingDeploy && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] whitespace-nowrap">
                Uncommitted Changes
              </span>
            </div>
            <button
              onClick={handleDeployEverything}
              disabled={isSyncing}
              className="bg-white text-stone-900 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all flex items-center gap-2"
            >
              {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <ArrowUpCircle size={14} />}
              Push to Production
            </button>
          </div>
        </div>
      )}

      <div className="pb-32">
        {activeTab === 'review' && (
          <ReviewQueue
            // ✅ 更干净：直接用 reviewProducts（已经是 awaiting_review）
            products={reviewProducts}
            categoryRequests={categoryRequests}
            onProcessProduct={async (id, action) => {
              try {
                // 你现在审核用 PUT 改 status，这个逻辑没问题
                await adminFetch(`admin/products/${id}`, {
                  method: 'PUT',
                  body: JSON.stringify({
                    status: action === 'approve' ? 'published' : 'rejected',
                  }),
                });

                setHasPendingDeploy(true);

                // ✅ 两个都刷新：队列 & 主库存
                await loadReviewProducts();
                await loadProducts();
              } catch (e: any) {
                alert(e.message);
              }
            }}
            onProcessCategory={async (id, action) => {
              try {
                // ✅ 不要用 "/admin/..."，给 adminFetch 传干净的相对路径
                const endpoint = action === 'approve' ? 'approve-publish' : 'reject';
                await adminFetch(`admin/category-requests/${id}/${endpoint}`, { method: 'POST' });

                alert(action === 'approve'
                  ? 'Approved & published. Factory will see it after refresh.'
                  : 'Request rejected.'
                );

                await loadCategoryQueue();
                // （可选）如果 approve 会改 site-config draft/published，你也可以顺手 refresh config
                await loadSiteConfig();
              } catch (e: any) {
                alert(e?.message || `${action === 'approve' ? 'Approve' : 'Reject'} failed`);
              }
            }}
            // ✅ reloadQueue 现在是“刷新全部队列”
            reloadQueue={async () => {
              await loadReviewProducts();
              await loadCategoryQueue();
            }}
          />
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm
              initialData={editingProduct || {}}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onSave={handleSaveProduct}
              onCancel={() => {
                setEditingProduct(null);
                setIsCreating(false);
              }}
              onUpload={async (f) => {
                const fd = new FormData();
                fd.append('file', f);
                const r = await adminFetch('upload-image', { method: 'POST', body: fd });
                return r.url;
              }}
              userRole="ADMIN"
              lang="en"
            />
          ) : (
            <ProductList
              items={products}
              categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
              onEdit={setEditingProduct}
              onCreate={() => setIsCreating(true)}
              onBack={() => {}}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
              onRefresh={loadProducts}
              onDelete={async (id) => {
                if (confirm('Confirm deletion of this SKU and associated cloud assets?')) {
                  const p = products.find(x => x.id === id);
                  if (p?.images) await Promise.all(p.images.map((i: string) => handleDeleteImage(i)));
                  await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
                  await loadProducts();
                  await loadReviewProducts();
                }
              }}
              lang="en"
            />
          )
        )}

        {activeTab === 'config' && (
          <SiteConfigEditor
            config={siteConfig}
            onChange={setSiteConfig}
            onSave={async () => {
              setIsSavingConfig(true);
              try {
                await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) });
                setHasPendingDeploy(true);
                await loadSiteConfig();
              } catch (e: any) {
                alert(e.message);
              } finally {
                setIsSavingConfig(false);
              }
            }}
            onPublish={handleDeployEverything}
            isSaving={isSavingConfig}
            onRefresh={loadSiteConfig}
            onUpload={async (f) => {
              const fd = new FormData();
              fd.append('file', f);
              const r = await adminFetch('upload-image', { method: 'POST', body: fd });
              return r.url;
            }}
          />
        )}

        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;
