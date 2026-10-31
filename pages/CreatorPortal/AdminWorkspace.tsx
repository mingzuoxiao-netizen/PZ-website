import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';
import {
  RefreshCw, Package, Inbox,
  LayoutGrid, Settings, Users, Activity,
  ArrowUpCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import SiteMediaManager from './components/SiteMediaManager';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import InquiryManager from './components/InquiryManager';

type AdminTab = 'review' | 'inventory' | 'inquiries' | 'categories' | 'media' | 'config' | 'accounts' | 'audit';

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
      // Edit the saved draft, not the published snapshot.
      const result = await adminFetch<any>('admin/draft/site-config');
      let remoteConfig = result?.draft;
      if (!remoteConfig || Object.keys(remoteConfig).length === 0) {
        const published = await adminFetch<any>('site-config');
        remoteConfig = published?.config ?? published;
      }
      setSiteConfig({ ...DEFAULT_CONFIG, ...remoteConfig });
    } catch (e) {
      console.error('读取网站配置失败', e);
      // Never overwrite approved categories using fallback defaults.
      setSiteConfig(null);
    }
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
    if (!confirm('确认同步已审核的产品，并发布已经保存的网站配置吗？')) return;
    setIsSyncing(true);
    try {
      await adminFetch('admin/publish/products', { method: 'POST' });
      await adminFetch('admin/publish', { method: 'POST' });
      setHasPendingDeploy(false);
      alert('发布成功，公开网站内容已更新。');
    } catch (e: any) { alert(`发布失败：${e.message}`); }
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
    if (!confirm('确认永久删除这条产品记录吗？此操作无法撤销。')) return;
    try {
      await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
      setHasPendingDeploy(true);
      await loadProducts();
    } catch (e: any) {
      alert(`删除失败：${e.message}`);
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
    } catch (e: any) { alert(`批量操作失败：${e.message}`); }
    finally { setIsSyncing(false); }
  };

  const reviewTotalCount = reviewProducts.length + categoryRequests.length;

  const navItems = [
    { id: 'review', label: '审核中心', icon: <div className="relative"><Activity size={18} />{reviewTotalCount > 0 && <span className="absolute -top-2 -right-2 bg-safety-700 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold animate-pulse">{reviewTotalCount}</span>}</div> },
    { id: 'inventory', label: '产品管理', icon: <Package size={18} /> },
    { id: 'inquiries', label: '询盘管理', icon: <Inbox size={18} /> },
    { id: 'categories', label: '产品分类封面', icon: <LayoutGrid size={18} /> },
    { id: 'media', label: '其他网站图片', icon: <Settings size={18} /> },
    { id: 'config', label: '网站内容配置', icon: <Settings size={18} /> },
    { id: 'accounts', label: '账号权限管理', icon: <Users size={18} /> },
    { id: 'audit', label: '操作日志', icon: <LayoutGrid size={18} /> },
  ];

  return (
    <PortalLayout role="ADMIN" userName="系统管理员" navItems={navItems} activeTab={activeTab} onTabChange={(id) => { setActiveTab(id as AdminTab); setEditingProduct(null); setIsCreating(false); }}>
      {hasPendingDeploy && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] whitespace-nowrap">有尚未发布的更改</span>
            </div>
            <button onClick={handleDeployEverything} disabled={isSyncing} className="bg-white text-stone-900 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all flex items-center gap-2">
              {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <ArrowUpCircle size={14} />} 保存并发布
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
              const endpoint = action === 'approve' ? 'approve' : 'reject';
              const result = await adminFetch<any>(
                `admin/category-requests/${encodeURIComponent(id)}/${endpoint}`,
                { method: 'POST' }
              );
              if (result?.success !== true || result.status !== (action === 'approve' ? 'approved' : 'rejected')) {
                throw new Error('分类审核结果未确认，请刷新后核对状态。');
              }
              await Promise.all([loadReviewQueue(), loadSiteConfig()]);
              if (action === 'reject') return;
              if (result.published !== true) {
                throw new Error('分类已批准，但网站发布尚未完成。请检查网站图片管理并手动发布，勿重复批准。');
              }
              const response = await fetch('/api/site-config', { cache: 'no-store' });
              if (!response.ok) throw new Error('分类已批准，但无法验证公开网站配置。');
              const body = await response.json();
              const publicCategories = body?.config?.categories ?? body?.categories ?? [];
              if (!Array.isArray(publicCategories) ||
                !publicCategories.some((item: any) => item.proposal_id === id)) {
                throw new Error('分类已批准，但公开配置暂未找到新分类，请检查发布状态。');
              }
            }}
            reloadQueue={async () => { await loadReviewQueue(); }}
          />
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm initialData={editingProduct || {}} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsCreating(false); }} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} userRole="ADMIN" lang="zh" />
          ) : (
            <ProductList items={products} isLoading={isProductsLoading} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onEdit={setEditingProduct} onDelete={handleDeleteProduct} onCreate={() => setIsCreating(true)} onBack={() => {}} onBulkStatusChange={handleBulkStatusChange} onBulkDelete={async (ids) => { if(!confirm(`确认删除选中的 ${ids.length} 条记录吗？`)) return; for (const id of ids) { await adminFetch(`admin/products/${id}`, { method: 'DELETE' }); } loadProducts(); }} onRefresh={loadProducts} lang="zh" userRole="ADMIN" />
          )
        )}

        {(activeTab === 'media' || activeTab === 'categories') && (
          <SiteMediaManager
            key={activeTab}
            initialGroupIndex={activeTab === 'categories' ? 0 : 1}
            config={siteConfig}
            onChange={setSiteConfig}
            onSave={async () => {
              setIsSavingConfig(true);
              try {
                await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) });
                setHasPendingDeploy(true);
                await loadSiteConfig();
              } catch (e) {
                throw e;
              } finally {
                setIsSavingConfig(false);
              }
            }}
            onPublish={async () => {
              setIsSavingConfig(true);
              try {
                await adminFetch('admin/publish', { method: 'POST' });
                setHasPendingDeploy(false);
                await loadSiteConfig();
              } finally {
                setIsSavingConfig(false);
              }
            }}
            isSaving={isSavingConfig}
            onRefresh={loadSiteConfig}
            onUpload={async file => {
              const form = new FormData();
              form.append('file', file);
              const result = await adminFetch<{ url: string }>('upload-image', { method: 'POST', body: form });
              if (!result.url) throw new Error('上传失败：没有返回图片地址');
              return result.url;
            }}
          />
        )}

        {activeTab === 'config' && (
          <SiteConfigEditor config={siteConfig} onChange={setSiteConfig} onSave={async () => { setIsSavingConfig(true); try { await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) }); setHasPendingDeploy(true); await loadSiteConfig(); } catch (e: any) { alert(e.message); } finally { setIsSavingConfig(false); } }} onPublish={handleDeployEverything} isSaving={isSavingConfig} onRefresh={loadSiteConfig} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} />
        )}

        {activeTab === 'inquiries' && <InquiryManager />}
        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;