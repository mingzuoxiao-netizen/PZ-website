import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';
import {
  RefreshCw, Package,
  LayoutGrid, Settings, Users, Activity,
  ArrowUpCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';

type AdminTab = 'review' | 'inventory' | 'config' | 'accounts' | 'audit';

const AdminWorkspace: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('review');

  const [products, setProducts] = useState<any[]>([]);
  const [reviewProducts, setReviewProducts] = useState<any[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingDeploy, setHasPendingDeploy] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const res = await adminFetch<{ products?: any[]; items?: any[] }>('admin/products?limit=1000');
      const raw = res.products ?? res.items ?? [];
      setProducts(normalizeProducts(raw));
    } catch (e) { console.error(e); }
    finally { setIsProductsLoading(false); }
  }, []);

  const loadReviewQueue = useCallback(async () => {
    try {
      const res = await adminFetch<{ products?: any[]; items?: any[] }>('admin/products?status=awaiting_review&limit=1000');
      const raw = res.products ?? res.items ?? [];
      setReviewProducts(normalizeProducts(raw));
      const catRes = await adminFetch<{ items: any[] }>('admin/category-requests?status=awaiting_review');
      setCategoryRequests(catRes.items ?? []);
    } catch (e) { console.error('Queue sync error', e); }
  }, []);

  const loadSiteConfig = useCallback(async () => {
    try {
      const res = await adminFetch<any>('site-config');
      const remoteConfig = res?.config ?? res;
      setSiteConfig({ ...DEFAULT_CONFIG, ...remoteConfig });
    } catch (e) { setSiteConfig(DEFAULT_CONFIG); }
  }, []);

  useEffect(() => {
    if (activeTab !== 'review') return;
    const sync = () => loadReviewQueue();
    sync();
    const intervalId = setInterval(sync, 10000);
    window.addEventListener('focus', sync);
    return () => { clearInterval(intervalId); window.removeEventListener('focus', sync); };
  }, [activeTab, loadReviewQueue]);

  useEffect(() => { loadProducts(); loadSiteConfig(); }, [loadProducts, loadSiteConfig]);

  const handleDeployEverything = async () => {
    if (!confirm('Execute GLOBAL DEPLOYMENT? This will refresh all public-facing registry nodes.')) return;
    setIsSyncing(true);
    try {
      await adminFetch('admin/publish/products', { method: 'POST' });
      await adminFetch('admin/publish', { method: 'POST' });
      setHasPendingDeploy(false);
      alert('Global synchronization successful. Registry live.');
    } catch (e: any) { alert(`Deployment failure: ${e.message}`); }
    finally { setIsSyncing(false); }
  };

  const handleSaveProduct = async (product: any) => {
    try {
      const nextStatus = product.status || 'draft';
      const isPublished = nextStatus === 'published' ? 1 : 0;
      
      if (product.id) {
        await adminFetch(`admin/products/${product.id}`, { 
          method: 'PUT', 
          body: JSON.stringify({ ...product, is_published: isPublished, autoPublish: isPublished === 1 }) 
        });
      } else {
        await adminFetch('admin/products', { 
          method: 'POST', 
          body: JSON.stringify({ ...product, is_published: isPublished }) 
        });
      }
      
      setEditingProduct(null);
      setIsCreating(false);
      await loadProducts();
      await loadReviewQueue(); 
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Permanently delete this technical record? This action cannot be reversed.')) return;
    try {
      await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
      setHasPendingDeploy(true);
      await loadProducts();
    } catch (e: any) {
      alert(`Deletion failure: ${e.message}`);
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
    setIsSyncing(true);
    try {
      const isPublished = newStatus === 'published' ? 1 : 0;
      await Promise.all(ids.map(id => {
          const original = products.find(p => p.id === id);
          return adminFetch(`admin/products/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify({ ...original, status: newStatus, is_published: isPublished, autoPublish: isPublished === 1 }) 
          });
      }));
      await loadProducts();
      await loadReviewQueue();
    } catch (e: any) { alert(`System protocol error: ${e.message}`); }
    finally { setIsSyncing(false); }
  };

  const reviewTotalCount = reviewProducts.length + categoryRequests.length;

  const navItems = [
    { id: 'review', label: 'Review Queue', icon: <div className="relative"><Activity size={18} />{reviewTotalCount > 0 && <span className="absolute -top-2 -right-2 bg-safety-700 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">{reviewTotalCount}</span>}</div> },
    { id: 'inventory', label: 'Master Registry', icon: <Package size={18} /> },
    { id: 'config', label: 'Site Protocol', icon: <Settings size={18} /> },
    { id: 'accounts', label: 'Identity Matrix', icon: <Users size={18} /> },
    { id: 'audit', label: 'System Logs', icon: <LayoutGrid size={18} /> },
  ];

  return (
    <PortalLayout role="ADMIN" userName="System Administrator" navItems={navItems} activeTab={activeTab} onTabChange={(id) => { setActiveTab(id as AdminTab); setEditingProduct(null); setIsCreating(false); }}>
      {hasPendingDeploy && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] whitespace-nowrap">Uncommitted Changes Detected</span>
            </div>
            <button onClick={handleDeployEverything} disabled={isSyncing} className="bg-white text-stone-900 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all flex items-center gap-2">
              {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <ArrowUpCircle size={14} />} Commit & Deploy Now
            </button>
          </div>
        </div>
      )}

      <div className="pb-32">
        {activeTab === 'review' && (
          <ReviewQueue products={reviewProducts} categoryRequests={categoryRequests} onProcessProduct={async (id, action) => {
              try {
                const original = products.find(p => p.id === id) || reviewProducts.find(p => p.id === id);
                if (!original) throw new Error("Registry record not found");
                const nextStatus = action === 'approve' ? 'published' : 'rejected';
                const isPublished = nextStatus === 'published' ? 1 : 0;
                await adminFetch(`admin/products/${id}`, { 
                  method: 'PUT', 
                  body: JSON.stringify({ 
                    ...original, 
                    status: nextStatus, 
                    is_published: isPublished,
                    autoPublish: action === 'approve' 
                  }) 
                });
                await loadReviewQueue(); await loadProducts();
              } catch (e: any) { alert(e.message); }
            }}
            onProcessCategory={async (id, action) => {
              try {
                const endpoint = action === 'approve' ? 'approve' : 'reject';
                await adminFetch(`/admin/category-requests/${id}/${endpoint}`, { method: 'POST' });
                alert(action === 'approve' ? 'Proposal approved and published.' : 'Request declined.');
                await loadReviewQueue(); await loadSiteConfig();
              } catch (e: any) { alert(e?.message || 'Processing fault'); }
            }}
            reloadQueue={async () => { await loadReviewQueue(); }}
          />
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm initialData={editingProduct || {}} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsCreating(false); }} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} userRole="ADMIN" lang="en" />
          ) : (
            <ProductList items={products} isLoading={isProductsLoading} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onEdit={setEditingProduct} onDelete={handleDeleteProduct} onCreate={() => setIsCreating(true)} onBack={() => {}} onBulkStatusChange={handleBulkStatusChange} onBulkDelete={async (ids) => { if(!confirm(`Confirm removal of ${ids.length} records?`)) return; for (const id of ids) { await adminFetch(`admin/products/${id}`, { method: 'DELETE' }); } loadProducts(); }} onRefresh={loadProducts} lang="en" userRole="ADMIN" />
          )
        )}

        {activeTab === 'config' && (
          <SiteConfigEditor config={siteConfig} onChange={setSiteConfig} onSave={async () => { setIsSavingConfig(true); try { await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) }); setHasPendingDeploy(true); await loadSiteConfig(); } catch (e: any) { alert(e.message); } finally { setIsSavingConfig(false); } }} onPublish={handleDeployEverything} isSaving={isSavingConfig} onRefresh={loadSiteConfig} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} />
        )}

        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;