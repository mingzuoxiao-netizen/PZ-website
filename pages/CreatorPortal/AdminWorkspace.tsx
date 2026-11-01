import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';
import {
  RefreshCw, Package, Inbox,
  LayoutGrid, Settings, Images, Users, Activity,
  ArrowUpCircle
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteBasicsEditor, { SiteBasicsValues } from './components/SiteBasicsEditor';
import SiteMediaManager from './components/SiteMediaManager';
import CategoryManagement from './components/CategoryManagement';
import CategoryChangeReview from './components/CategoryChangeReview';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import InquiryManager from './components/InquiryManager';

type AdminTab = 'review' | 'inventory' | 'inquiries' | 'categories' | 'media' | 'basics' | 'accounts' | 'audit';

const AdminWorkspace: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('review');

  const [products, setProducts] = useState<any[]>([]);
  const [reviewProducts, setReviewProducts] = useState<any[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);
  const [allCategoryRequests, setAllCategoryRequests] = useState<any[]>([]);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [draftRevision, setDraftRevision] = useState<number | null>(null);
  // New Production D1 API returns a revision; Staging legacy KV may not.
  const saveDraftVersioned = async (config: any, revision: number | null = draftRevision) => {
    const payload = Number.isSafeInteger(revision)
      ? { revision, config }
      : config;
    const response = await adminFetch<{revision?:number}>('site-config', {
      method:'PUT', body:JSON.stringify(payload)
    });
    if (typeof response?.revision === 'number') setDraftRevision(response.revision);
    return response;
  };
  const publishVersioned = async (revision: number | null = draftRevision) => {
    const payload = Number.isSafeInteger(revision) ? {revision} : {};
    return adminFetch('admin/publish',{method:'POST',body:JSON.stringify(payload)});
  };
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
      // Legacy D1 category_requests defaults to "pending"; newer client
      // workflows may use "awaiting_review". Load both, not just one status.
      const catRes = await adminFetch<{ items: any[] }>('admin/category-requests');
      setAllCategoryRequests(catRes.items ?? []);
      setCategoryRequests((catRes.items ?? []).filter(item =>
        item.status === 'pending' || item.status === 'awaiting_review'));
    } catch (e) { console.error('Queue sync error', e); }
  }, []);

  const loadSiteConfig = useCallback(async () => {
    try {
      // Edit the saved draft, not the published snapshot.
      const result = await adminFetch<any>('admin/draft/site-config');
      let remoteConfig = result?.draft;
      setDraftRevision(typeof result?.revision === 'number' ? result.revision : null);
      if (!remoteConfig || Object.keys(remoteConfig).length === 0) {
        const published = await adminFetch<any>('site-config');
        remoteConfig = published?.config ?? published;
      }
      setSiteConfig({ ...DEFAULT_CONFIG, ...remoteConfig });
    } catch (e) {
      console.error('读取网站配置失败', e);
      // Never overwrite approved categories using fallback defaults.
      setSiteConfig(null);
      setDraftRevision(null);
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
  useEffect(() => { if (activeTab === 'categories') void loadReviewQueue(); }, [activeTab, loadReviewQueue]);

  // Update only the two basic fields against the latest D1 draft.
  // Re-read and compare before saving so concurrent category/image edits cannot be overwritten.
  const saveSiteBasics = async (values: SiteBasicsValues, baseline: SiteBasicsValues) => {
    setIsSavingConfig(true);
    try {
      const current = await adminFetch<{ draft: any; revision?: number }>('admin/draft/site-config');
      const live = current?.draft;
      if (!live?.home?.hero || !live?.catalog) {
        throw new Error('网站基础信息草稿读取失败，已拒绝覆盖其他网站配置。');
      }
      const liveTitle = String(live.home.hero.title ?? '');
      const liveCatalogUrl = String(live.catalog.url ?? '');
      if (liveTitle !== baseline.title || liveCatalogUrl !== baseline.catalogUrl) {
        throw new Error('其他管理员已修改网站基础信息，请刷新后重新编辑。');
      }
      const next = {
        ...live,
        home: { ...live.home, hero: { ...live.home.hero, title: values.title } },
        catalog: { ...live.catalog, url: values.catalogUrl }
      };
      await saveDraftVersioned(next, typeof current.revision === 'number' ? current.revision : null);
      setHasPendingDeploy(true);
      await loadSiteConfig();
    } finally {
      setIsSavingConfig(false);
    }
  };

  const uploadCatalogPdf = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const response = await adminFetch<{ url: string }>('admin/upload-pdf', {
      method: 'POST', body: form
    });
    if (!response?.url) throw new Error('PDF 上传失败：服务器未返回文件地址。');
    return response.url;
  };

  const handleDeployEverything = async () => {
    if (!confirm('确认同步已审核的产品，并发布已经保存的网站配置吗？')) return;
    setIsSyncing(true);
    try {
      await adminFetch('admin/publish/products', { method: 'POST' });
      await publishVersioned();
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
    { id: 'categories', label: '产品分类管理', icon: <LayoutGrid size={18} /> },
    { id: 'media', label: '网站图片管理', icon: <Images size={18} /> },
    { id: 'basics', label: '网站基础信息', icon: <Settings size={18} /> },
    { id: 'inquiries', label: '询盘管理', icon: <Inbox size={18} /> },
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
          <>
          <CategoryChangeReview onApproved={loadSiteConfig} />
          <ReviewQueue products={reviewProducts} categoryRequests={categoryRequests} onProcessProduct={async (id, action) => {
              try {
                const original = products.find(p => p.id === id) || reviewProducts.find(p => p.id === id);
                if (!original) throw new Error("未找到产品记录");
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
                { method: 'POST', body: JSON.stringify(action === 'approve' ? { autoPublish: false } : {}) }
              );
              if (result?.success !== true || result.status !== (action === 'approve' ? 'approved' : 'rejected')) {
                throw new Error('分类审核结果未确认，请刷新后核对状态。');
              }
              await Promise.all([loadReviewQueue(), loadSiteConfig()]);
              // Approval writes to draft only. Publishing is always a separate admin action.
              // Never verify public visibility until an explicit publish.
              if (action === 'approve' && result.needsPublish !== true) {
                throw new Error('分类审核完成，但草稿状态未确认；请检查网站配置。');
              }
            }}
            reloadQueue={async () => { await loadReviewQueue(); }}
          />
          </>
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm initialData={editingProduct || {}} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsCreating(false); }} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} userRole="ADMIN" lang="zh" />
          ) : (
            <ProductList items={products} isLoading={isProductsLoading} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onEdit={setEditingProduct} onDelete={handleDeleteProduct} onCreate={() => setIsCreating(true)} onBack={() => {}} onBulkStatusChange={handleBulkStatusChange} onBulkDelete={async (ids) => { if(!confirm(`确认删除选中的 ${ids.length} 条记录吗？`)) return; for (const id of ids) { await adminFetch(`admin/products/${id}`, { method: 'DELETE' }); } loadProducts(); }} onRefresh={loadProducts} lang="zh" userRole="ADMIN" />
          )
        )}

        {activeTab === 'categories' && siteConfig && (
          <CategoryManagement
            categories={siteConfig.categories || []}
            approvedRequests={allCategoryRequests}
            onSave={async (next, expected) => {
              setIsSavingConfig(true);
              try {
                const response = await adminFetch<{ draft: any; revision?: number }>('admin/draft/site-config');
                const live = response.draft;
                if (!live || !Array.isArray(live.categories)) throw new Error('正式站点草稿分类不存在，拒绝覆盖。');
                if (JSON.stringify(live.categories) !== JSON.stringify(expected)) {
                  throw new Error('其他管理员已经修改分类，请先刷新页面后重新编辑。');
                }
                await saveDraftVersioned({ ...live, categories: next }, typeof response.revision === 'number' ? response.revision : null);
                setHasPendingDeploy(true);
                await loadSiteConfig();
              } finally { setIsSavingConfig(false); }
            }}
            onPublish={async () => {
              setIsSavingConfig(true);
              try {
                await publishVersioned();
                setHasPendingDeploy(false);
                await loadSiteConfig();
              } finally { setIsSavingConfig(false); }
            }}
            onRefresh={loadSiteConfig}
            onUpload={async file => {
              const form = new FormData(); form.append('file', file);
              const response = await adminFetch<{ url: string }>('upload-image', { method:'POST', body:form });
              if (!response.url) throw new Error('封面上传没有返回图片地址');
              return response.url;
            }}
          />
        )}
        {activeTab === 'media' && (
          <SiteMediaManager
            key={activeTab}
            config={siteConfig}
            onChange={setSiteConfig}
            onSave={async () => {
              setIsSavingConfig(true);
              try {
                await saveDraftVersioned(siteConfig);
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
                await publishVersioned();
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

        {activeTab === 'basics' && (
          <SiteBasicsEditor
            config={siteConfig}
            isSaving={isSavingConfig}
            onSave={saveSiteBasics}
            onPublish={async () => {
              setIsSavingConfig(true);
              try {
                await publishVersioned();
                setHasPendingDeploy(false);
                await loadSiteConfig();
              } finally { setIsSavingConfig(false); }
            }}
            onRefresh={loadSiteConfig}
            onUploadPdf={uploadCatalogPdf}
          />
        )}

        {activeTab === 'inquiries' && <InquiryManager />}
        {activeTab === 'accounts' && <AccountsManager />}
        {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;