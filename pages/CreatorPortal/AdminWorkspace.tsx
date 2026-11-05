import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import { mergeSiteMediaDraft, getSiteImageChanges } from '../../utils/siteMediaChanges';
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
import OrganizationManagement from './components/OrganizationManagement';
import ProductResponsibilityManager from './components/ProductResponsibilityManager';
import TwoStageProductReviews from './components/TwoStageProductReviews';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import InquiryManager from './components/InquiryManager';

type AdminTab = 'review' | 'inventory' | 'inquiries' | 'categories' | 'media' | 'basics' | 'accounts' | 'organization' | 'audit';

const AdminWorkspace: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const [reviewSection, setReviewSection] = useState<'products' | 'new-categories' | 'category-changes'>('products');

  const [products, setProducts] = useState<any[]>([]);
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
      // Phase 2 product approvals use /admin/reviews and supervisor first review.
      // Only category applications remain on the legacy category-request endpoint.
      const catRes = await adminFetch<{ items: any[] }>('admin/category-requests');
      setAllCategoryRequests(catRes.items ?? []);
      setCategoryRequests((catRes.items ?? []).filter(item =>
        item.status === 'pending' || item.status === 'awaiting_review'));
    } catch (e) { console.error('Category queue sync error', e); }
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
      const hydrated = { ...DEFAULT_CONFIG, ...remoteConfig };
      setSiteConfig(hydrated);
      return hydrated;
    } catch (e) {
      console.error('读取网站配置失败', e);
      // Never overwrite approved categories using fallback defaults.
      setSiteConfig(null);
      setDraftRevision(null);
      return null;
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
    // The two-stage review workflow forbids direct admin product writes.
    // Admin may maintain an unpublished draft through the guarded factory
    // draft endpoint, never rewrite approved/published or in-review records.
    const status = String(product.status || 'draft').toLowerCase();
    if (!['draft', 'rejected'].includes(status)) {
      throw new Error('该产品已进入审核或发布流程，不能直接覆盖。请走产品变更审核流程。');
    }
    const url = product.id
      ? `factory/products/${encodeURIComponent(product.id)}`
      : 'factory/products';
    const response = await adminFetch<{ success?: boolean }>(url, {
      method: product.id ? 'PUT' : 'POST',
      body: JSON.stringify({ ...product, status: 'draft', is_published: 0 })
    });
    if (response.success !== true) {
      throw new Error('服务器未确认草稿保存，请刷新列表核对后再试。');
    }
    setEditingProduct(null);
    setIsCreating(false);
    await loadProducts();
    await loadReviewQueue();
  };

  const navItems = [
    { id: 'review', label: '审核中心', icon: <Activity size={18} /> },
    { id: 'inventory', label: '产品管理', icon: <Package size={18} /> },
    { id: 'categories', label: '产品分类管理', icon: <LayoutGrid size={18} /> },
    { id: 'media', label: '网站图片管理', icon: <Images size={18} /> },
    { id: 'basics', label: '网站基础信息', icon: <Settings size={18} /> },
    { id: 'inquiries', label: '询盘管理', icon: <Inbox size={18} /> },
    { id: 'accounts', label: '账号权限管理', icon: <Users size={18} /> },
    { id: 'organization', label: '部门与主管管理', icon: <Users size={18} /> },
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
          <section className="space-y-6" aria-label="统一审核中心">
            <div className="rounded border border-stone-200 bg-white p-5">
              <h2 className="font-serif text-2xl text-stone-900">审核中心</h2>
              <p className="mt-2 text-sm text-stone-500">
                产品必须经过主管初审和管理员终审，终审批准后仍需独立发布。新品类及分类修改使用各自的审核流程。
              </p>
              <div role="tablist" aria-label="审核类型" className="mt-5 grid gap-2 sm:grid-cols-3">
                {([
                  ['products', '产品终审与发布'],
                  ['new-categories', '新品类申请审核'],
                  ['category-changes', '已有分类修改审核'],
                ] as const).map(([id, label]) => (
                  <button key={id} type="button" role="tab"
                    aria-selected={reviewSection === id}
                    onClick={() => setReviewSection(id)}
                    className={`rounded border px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900 ${
                      reviewSection === id
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-500'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div role="tabpanel" aria-label={
              reviewSection === 'products' ? '产品终审与发布' :
              reviewSection === 'new-categories' ? '新品类申请审核' : '已有分类修改审核'
            }>
              {reviewSection === 'products' && <TwoStageProductReviews role="ADMIN" />}
              {reviewSection === 'new-categories' && (
                <ReviewQueue
                  categoryOnly
                  products={[]}
                  categoryRequests={categoryRequests}
                  onProcessProduct={async () => {
                    throw new Error('旧产品审核已关闭，必须通过主管初审和管理员终审。');
                  }}
                  onProcessCategory={async (id, action) => {
                    const endpoint = action === 'approve' ? 'approve' : 'reject';
                    const result = await adminFetch<any>(
                      `admin/category-requests/${encodeURIComponent(id)}/${endpoint}`,
                      { method: 'POST', body: JSON.stringify(action === 'approve' ? {autoPublish:false} : {}) }
                    );
                    if (result?.success !== true || result.status !== (action === 'approve' ? 'approved' : 'rejected')) {
                      throw new Error('分类审核结果未确认，请刷新后核对状态。');
                    }
                    await Promise.all([loadReviewQueue(), loadSiteConfig()]);
                    if (action === 'approve' && result.needsPublish !== true) {
                      throw new Error('分类已批准，但草稿状态未确认，请检查网站配置。');
                    }
                  }}
                  reloadQueue={loadReviewQueue}
                />
              )}
              {reviewSection === 'category-changes' && (
                <CategoryChangeReview onApproved={loadSiteConfig} />
              )}
            </div>
          </section>
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm initialData={editingProduct || {}} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onSave={handleSaveProduct} onCancel={() => { setEditingProduct(null); setIsCreating(false); }} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} userRole="ADMIN" lang="zh" />
          ) : (
            <div className="space-y-6">
              <ProductResponsibilityManager products={products} />
              <ProductList items={products} isLoading={isProductsLoading} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onEdit={setEditingProduct} onCreate={() => setIsCreating(true)} onBack={() => {}} onRefresh={loadProducts} lang="zh" userRole="ADMIN" />
            </div>
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
            onSave={async (edited, baseline) => {
              setIsSavingConfig(true);
              try {
                const changes = getSiteImageChanges(baseline, edited);
                if (!changes.length) return;
                const latest = await adminFetch<{ draft: any; revision?: number }>('admin/draft/site-config');
                const live = latest?.draft;
                // Product covers, categories and site text are untouched.
                const merged = mergeSiteMediaDraft(live, baseline, edited);
                await saveDraftVersioned(merged, typeof latest.revision === 'number' ? latest.revision : null);
                setHasPendingDeploy(true);
                await loadSiteConfig();
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
        {activeTab === 'organization' && <OrganizationManagement />}
        {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;