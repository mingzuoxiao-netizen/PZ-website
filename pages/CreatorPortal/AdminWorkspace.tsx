import type { ProductVariant } from '../../types';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {fetchBackofficePage} from '../../utils/backofficeLists';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeAdminInventoryProducts } from '../../utils/normalizeAdminInventoryProducts';
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
import AdminReleaseQueue from './components/AdminReleaseQueue';
import AdminFastLanePanel from './components/AdminFastLanePanel';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import InquiryManager from './components/InquiryManager';

type AdminTab = 'review' | 'inventory' | 'inquiries' | 'categories' | 'media' | 'basics' | 'accounts' | 'organization' | 'audit';

const AdminWorkspace: React.FC = () => {
  const { t } = useLanguage();
  const dirtyProduct=useRef(false);
  const busyProduct=useRef(false);
  const rememberProductDirty=useCallback((dirty:boolean)=>{dirtyProduct.current=dirty;},[]);
  const rememberProductBusy=useCallback((busy:boolean)=>{busyProduct.current=busy;},[]);
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const [reviewSection, setReviewSection] = useState<'products' | 'new-categories' | 'category-changes' | 'fast-lane'>('products');

  const [catalogView, setCatalogView] = useState('action');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogHasMore, setCatalogHasMore] = useState(false);
  const [unpublishedReviewCount, setUnpublishedReviewCount] = useState<number | null>(null);
  const [catalogError, setCatalogError] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [forceDeleteEnabled,setForceDeleteEnabled]=useState(false);
  const [forceDeleteReason,setForceDeleteReason]=useState('正在检查 Worker 强制删除配置…');
  const catalogRequest = useRef(0);
  const [products, setProducts] = useState<any[]>([]);
  const [categoryRequests, setCategoryRequests] = useState<any[]>([]);
  const [allCategoryRequests, setAllCategoryRequests] = useState<any[]>([]);
  const [publishingCategoryId,setPublishingCategoryId] = useState<string|null>(null);
  const [categoryPublishMessage,setCategoryPublishMessage] = useState('');
  const [categoryQueueError,setCategoryQueueError] = useState('');
  const [categoryQueueLoaded,setCategoryQueueLoaded] = useState(false);
  const [targetedPublishSupported,setTargetedPublishSupported] = useState<boolean|null>(null);
  const [productReviewCount,setProductReviewCount] = useState<number|null>(null);
  const [categoryChangeCount,setCategoryChangeCount] = useState<number|null>(null);

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
    const request = ++catalogRequest.current;
    setIsProductsLoading(true);
    setCatalogError('');
    try {
      const query = new URLSearchParams({ view: catalogView, page: String(catalogPage), q: catalogQuery });
      const response = await adminFetch<{ products: ProductVariant[]; has_more: boolean; unpublished_review_count?: number }>('admin/products?' + query);
      if (request !== catalogRequest.current) return;
      if (!response.products.length && catalogPage > 1) {
        setCatalogPage(catalogPage - 1);
        return;
      }
      // For Admin inventory the current D1 status is authoritative. Legacy
      // is_published must not override it: that creates a false "published"
      // badge and a misleading unpublish action on ineligible rows.
      setProducts(normalizeAdminInventoryProducts(response.products));
      setCatalogHasMore(response.has_more);
      setUnpublishedReviewCount(response.unpublished_review_count ?? null);
    } catch {
      if (request === catalogRequest.current) {
        setProducts([]);
        setCatalogHasMore(false);
        setUnpublishedReviewCount(null);
        setCatalogError('读取产品失败，请刷新重试。');
      }
    } finally {
      if (request === catalogRequest.current) setIsProductsLoading(false);
    }
  }, [catalogView, catalogPage, catalogQuery]);

  const loadReviewQueue = useCallback(async () => {
    // Load each queue independently. Never misreport a failed fetch as "0 pending".
    const [categoryResult,productResult,changeResult] = await Promise.allSettled([
      adminFetch<{items:any[];capabilities?:{targetedCategoryPublish?:boolean;workflowVersion?:string}}>('admin/category-requests'),
      fetchBackofficePage<any>('admin/release-queue',{page_size:1}),
      adminFetch<{items:any[]}>('admin/category-change-requests')
    ]);
    if(categoryResult.status==='fulfilled' && Array.isArray(categoryResult.value?.items)){
      const items=categoryResult.value.items;
      setAllCategoryRequests(items);
      setCategoryRequests(items.filter(item =>
        item.status==='pending_admin' ||
        (item.legacy!==false && ['pending','awaiting_review'].includes(item.status))));
      setTargetedPublishSupported(categoryResult.value.capabilities?.targetedCategoryPublish===true);
      setCategoryQueueError('');
      setCategoryQueueLoaded(true);
    }else{
      const reason=categoryResult.status==='rejected'
        ? (categoryResult.reason?.message||'连接失败')
        : '接口没有返回正确的申请列表';
      setCategoryQueueError('新品类申请记录读取失败，不能将队列视为已清空：'+reason);
      setCategoryQueueLoaded(false);
      setTargetedPublishSupported(null);
    }
    if(productResult.status==='fulfilled')setProductReviewCount(productResult.value.total);
    else setProductReviewCount(null);
    if(changeResult.status==='fulfilled' && Array.isArray(changeResult.value?.items)){
      setCategoryChangeCount(changeResult.value.items.filter(item=>item.status==='pending').length);
    }else setCategoryChangeCount(null);
  }, []);

  const waitingCategories = allCategoryRequests.filter(item =>
    item.status==='approved' && item.published!==true);
  const actionableCategoryCount = categoryQueueLoaded ? categoryRequests.length : null;
  const reviewCounts = [productReviewCount,actionableCategoryCount,categoryChangeCount];
  const knownPending = reviewCounts.filter((count):count is number=>count!==null)
    .reduce((total,count)=>total+count,0);
  const reviewCountsComplete = reviewCounts.every(count=>count!==null);

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
    const sync = () => { if(document.visibilityState!=='hidden')void loadReviewQueue(); };
    sync();
    const intervalId = setInterval(sync, 30000);
    window.addEventListener('focus', sync);
    return () => { clearInterval(intervalId); window.removeEventListener('focus', sync); };
  }, [activeTab, loadReviewQueue]);

  useEffect(() => { void loadSiteConfig(); }, [loadSiteConfig]);
  const loadDeleteCapability=useCallback(async()=>{
    try{
      const data=await adminFetch<{force_available?:boolean;reason?:string|null}>('admin/product-delete/capabilities');
      const enabled=data.force_available===true;
      setForceDeleteEnabled(enabled);
      setForceDeleteReason(enabled?'':data.reason||
        '当前 Worker 未报告强制删除可用，请核对 Staging D1 016、Worker 版本和环境开关。');
    }catch(error:any){
      setForceDeleteEnabled(false);
      setForceDeleteReason('无法检查当前 Worker 强制删除能力：'+
        (error?.message||'请核对 Pages API 是否连接了正确的 Staging Worker。'));
    }
  },[]);
  useEffect(() => {
    if(activeTab!=='inventory')return;
    void loadProducts();
    void loadDeleteCapability();
  }, [activeTab, loadProducts,loadDeleteCapability]);
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
    if (!confirm('确认同时发布已审核的产品和已保存的网站配置吗？')) return;
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

  const handleCatalogVisibility = async (product: ProductVariant) => {
    const hidden = product.catalog_hidden === true;
    const action = hidden ? 'relist' : 'unpublish';
    const label = hidden ? '重新上架' : '下架';
    if (!window.confirm(label + ' ' + (product.code || product.name) + '？')) return;
    try{
      const result=await adminFetch<{success?:boolean}>(
        'admin/products/' + encodeURIComponent(product.id) + '/' + action,{method:'POST'});
      if(result.success!==true)throw new Error('上架状态没有得到服务器确认，请刷新列表。');
      await loadProducts();
    }catch(error:any){
      await loadProducts();
      if(/HTTP 409|PRODUCT_VISIBILITY_CONFLICT|expected state/i.test(error?.message||'')){
        throw new Error('产品最新状态与当前列表不一致，操作已取消并刷新列表。请检查实际状态后再操作。');
      }
      throw error;
    }
  };

  const handleArchive = async (items: ProductVariant[], restore = false) => {
    if (archiving || !items.length) return;
    const action = restore ? 'restore-archive' : 'archive';
    const label = restore ? '恢复为已下架' : '归档';
    if (!window.confirm(label + ' ' + items.length + ' 件产品？')) return;
    setArchiving(true);
    const failures:{sku:string;reason:string}[]=[];
    let succeeded=0,reconciled=0;
    try {
      for(const item of items){
        const id=encodeURIComponent(String(item.id||''));
        if(!item.id){
          failures.push({sku:item.code||item.name||'未标识产品',reason:'缺少产品 ID'});
          continue;
        }
        try {
          const result=await adminFetch<{success?:boolean;archived?:boolean}>(
            'admin/products/'+id+'/'+action,{method:'POST'});
          if(result.success!==true || result.archived!==!restore)
            throw new Error('服务器未确认目标归档状态');
          succeeded++;
        }catch(error:any){
          // D1 may have committed even though an older Worker returned 409,
          // or the client lost the response. Never retry the mutation here.
          try{
            const current=await adminFetch<{
              status:string;catalog_hidden:boolean;archived:boolean;deleted:boolean
            }>('admin/products/'+id+'/catalog-state');
            if(!current.deleted&&current.status?.toLowerCase()==='published'&&
              current.catalog_hidden&&current.archived===!restore){
              succeeded++;
              reconciled++;
              continue;
            }
            failures.push({sku:item.code||item.name||id,
              reason:'当前状态不符合目标：'+
                (current.deleted?'产品已移除':current.status+
                  ' / '+(current.archived?'已归档':'未归档'))});
          }catch{
            failures.push({sku:item.code||item.name||id,
              reason:(error?.message||'操作结果未确认')+
                '；数据库状态读取失败，请不要重复点击'});
          }
        }
      }
      try{await loadProducts();}
      catch(error:any){setCatalogError('操作已经结束，但列表刷新失败：'+
        (error?.message||'请刷新页面核对结果'));}
      if(failures.length){
        alert(label+'结果：成功 '+succeeded+' 件，失败 '+failures.length+
          ' 件。'+(reconciled?'\n其中 '+reconciled+' 件经数据库状态核对确认成功。':'')+
          '\n'+failures.slice(0,5).map(x=>x.sku+'：'+x.reason).join('\n'));
      }else if(reconciled){
        alert(label+'成功 '+succeeded+' 件；其中 '+reconciled+
          ' 件已通过数据库状态核对确认。');
      }
    } finally {
      setArchiving(false);
    }
  };

  const handlePermanentDelete=async(product:any):Promise<{
    state:'deleted'|'verified_removed'|'already_absent'
  }>=>{
    const id=String(product?.id||'');
    const sku=String(product?.code||'');
    if(!id||!sku)throw new Error('产品缺少 ID 或 SKU，请刷新后重试。');
    const endpoint='admin/products/'+encodeURIComponent(id)+'/permanent-delete';
    try{
      const check=await adminFetch<{
        eligible?:boolean;error?:string;force_enabled?:boolean;
        product?:{code:string;updated_at:string}
      }>(endpoint);
      if(check.eligible!==true||!check.product?.updated_at)
        throw new Error(check.error||'产品删除资格未确认，请刷新后重试。');
      if(check.product.code!==sku)
        throw new Error('产品 SKU 已更新，请刷新列表，不要重复操作。');
      // Fail closed if frontend and Worker do not agree about force deletion.
      if(forceDeleteEnabled && check.force_enabled!==true)
        throw new Error('Worker 强制删除能力与页面状态不一致，请重新检查配置。');
      const result=await adminFetch<{success?:boolean;sku_reusable?:boolean}>(endpoint,{
        method:'POST',
        body:JSON.stringify({confirm_sku:sku,expected_updated_at:check.product.updated_at,
          ...(forceDeleteEnabled?{force:true}:{})})
      });
      if(result.success!==true||result.sku_reusable!==true)
        throw new Error('删除响应尚未确认，正在复查数据库结果。');
      return {state:'deleted'};
    }catch(error:any){
      // A response can be lost after D1 has committed. Do not count this
      // as "failed" (or retry deletion) until the current persisted state is read.
      let status;
      try{
        status=await adminFetch<{
          state:'active'|'retired'|'absent'|'inconsistent';
          original_sku?:string;current_sku?:string;current_status?:string;
          reason?:string
        }>('admin/products/'+encodeURIComponent(id)+'/deletion-status');
      }catch{
        throw new Error((error?.message||'删除操作未确认')+
          '；且无法查询当前数据库状态。请刷新核对，暂勿重复删除。');
      }
      if(status.state==='retired'&&status.original_sku===sku)
        return {state:'verified_removed'};
      if(status.state==='absent')
        return {state:'already_absent'};
      if(status.state==='inconsistent')
        throw new Error('数据库删除记录与审计回执不一致，请暂停删除并检查 D1。');
      throw new Error((error?.message||'删除未完成')+
        (status.current_status?'；数据库当前状态：'+status.current_status:'')+
        '。该产品仍在数据库，请先检查后台配置。');
    }
  };

  // Frequently-used work is visible; less-used settings are grouped without
  // removing any existing route, permissions, audit view or publish actions.
  const navItems = [
    { id: 'review', label: '审核中心', icon: <Activity size={18} /> },
    { id: 'inventory', label: '产品管理', icon: <Package size={18} /> },
    { id: 'inquiries', label: '询盘管理', icon: <Inbox size={18} /> },
    { id: 'categories', label: '产品分类管理', icon: <LayoutGrid size={18} />, group: '网站内容' },
    { id: 'media', label: '网站图片管理', icon: <Images size={18} />, group: '网站内容' },
    { id: 'basics', label: '网站基础信息', icon: <Settings size={18} />, group: '网站内容' },
    { id: 'organization', label: '部门与主管管理', icon: <Users size={18} />, group: '系统管理' },
    { id: 'accounts', label: '账号权限管理', icon: <Users size={18} />, group: '系统管理' },
    { id: 'audit', label: '操作日志', icon: <LayoutGrid size={18} />, group: '系统管理' },
  ];

  return (
    <PortalLayout role="ADMIN" userName="系统管理员" navItems={navItems} activeTab={activeTab} onTabChange={(id) => { if(busyProduct.current)return;if(dirtyProduct.current&&!confirm('当前产品资料尚未保存，确认离开吗？'))return;setActiveTab(id as AdminTab); setEditingProduct(null); setIsCreating(false); }}>
      {hasPendingDeploy && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] whitespace-nowrap">有尚未发布的更改</span>
            </div>
            <button onClick={handleDeployEverything} disabled={isSyncing} className="bg-white text-stone-900 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all flex items-center gap-2">
              {isSyncing ? <RefreshCw className="animate-spin" size={14} /> : <ArrowUpCircle size={14} />} 发布待上线更改
            </button>
          </div>
        </div>
      )}

      <div className="pb-32">
        {activeTab === 'review' && (
          <section className="space-y-6" aria-label="统一审核中心">
            <div className="rounded border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-2xl text-stone-900">审核中心</h2>
                <span className="text-sm font-medium text-stone-700">
                  {reviewCountsComplete ? `待处理 ${knownPending} 项` :
                    `已统计 ${knownPending} 项 · 部分队列未完成同步`}
                  {waitingCategories.length>0 ? ` · 已批准待发布 ${waitingCategories.length} 项` : ''}
                </span>
              </div>
              <p className="mt-2 text-sm text-stone-500">
                产品和修订由部门主管先审核，管理员仅需确认发布或退回；新品类通过终审后单独发布，不会带出其他网站草稿。
              </p>
              <div role="tablist" aria-label="审核类型" className="mt-5 grid gap-2 sm:grid-cols-3">
                {([
                  ['products', '产品审核与发布', productReviewCount],
                  ['new-categories', '新增分类申请', actionableCategoryCount],
                  ['category-changes', '分类修改申请', categoryChangeCount],
                  ['fast-lane', '发布后抽检与可信操作员', null],
                ] as const).map(([id,label,count])=>(
                  <button key={id} type="button" role="tab"
                    aria-selected={reviewSection === id}
                    onClick={() => setReviewSection(id)}
                    className={`rounded border px-4 py-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-stone-900 ${
                      reviewSection === id
                        ? 'border-stone-900 bg-stone-900 text-white'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-500'
                    }`}>
                    {id==='fast-lane'?label:label+'（'+(count===null?'未同步':count)+'）'}
                  </button>
                ))}
              </div>
              {categoryQueueError && <p role="alert" className="mt-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {categoryQueueError}
              </p>}
              {categoryQueueLoaded && targetedPublishSupported===false &&
                <p role="alert" className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  当前 Worker 尚未确认支持“单分类自动发布”。请更新对应环境的 Worker，避免只更新前端导致分类通过审核却无法公开。
                </p>}
            </div>
            <div role="tabpanel" aria-label={
              reviewSection === 'products' ? '产品终审与发布' :
              reviewSection === 'new-categories' ? '新品类申请审核' :
               reviewSection === 'fast-lane' ? '发布后抽检及可信操作员' : '已有分类修改审核'
            }>
              {reviewSection === 'products' && <AdminReleaseQueue onQueueChanged={loadReviewQueue} />}
              {reviewSection === 'fast-lane' && <AdminFastLanePanel />}
              {reviewSection === 'new-categories' && (
                <div className="space-y-5">
                  {waitingCategories.length>0 &&
                    <section className="rounded border border-amber-300 bg-amber-50 p-4" aria-label="待补发的已批准分类">
                      <h3 className="font-semibold text-amber-950">已批准，但尚未发布的分类</h3>
                      <p className="mt-1 text-sm text-amber-900">无需重新审批，也不需要发布整站配置。点击单个分类可直接补发。</p>
                      {categoryPublishMessage && <p role="status" className="mt-2 text-sm text-amber-950">{categoryPublishMessage}</p>}
                      {targetedPublishSupported!==true && <p className="mt-2 text-xs text-amber-900">
                        原申请可见，但当前后端未确认支持单分类发布；更新 Worker 后可在这里重试，无需再次审批。
                      </p>}
                      <div className="mt-3 space-y-2">
                        {waitingCategories.map(item=>
                          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-200 bg-white p-3">
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{item.title_cn||item.title} · {item.title}</p>
                              <p className="text-xs text-amber-900">
                                {item.published===null || item.published===undefined
                                  ? '发布状态未确认，原审核记录已保留'
                                  : '已批准，但未在网站已发布配置中找到'}
                              </p>
                            </div>
                            <button type="button" disabled={!!publishingCategoryId || targetedPublishSupported!==true}
                              onClick={async()=>{
                                setPublishingCategoryId(item.id);
                                setCategoryPublishMessage('');
                                try{
                                  const r=await adminFetch<{success:boolean;published:boolean;publishError?:string}>(
                                    `admin/category-requests/${encodeURIComponent(item.id)}/publish`,
                                    {method:'POST',body:JSON.stringify({})});
                                  if(!r.success||!r.published)throw new Error(r.publishError||'分类尚未发布成功。');
                                  setCategoryPublishMessage('分类已单独发布，其他网站草稿未改动。');
                                }catch(e:any){setCategoryPublishMessage(e?.message||'发布失败，请检查后台。');}
                                finally{await Promise.all([loadReviewQueue(),loadSiteConfig()]);setPublishingCategoryId(null);}
                              }}
                              className="rounded bg-stone-900 px-4 py-2 text-xs text-white disabled:opacity-50">
                              {publishingCategoryId===item.id?'发布中…' :
                                targetedPublishSupported===true?'单独发布此分类':'请先更新 Worker'}
                            </button>
                          </div>
                        )}
                      </div>
                    </section>}
                  {!categoryQueueLoaded && <p role="status" className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    新品类审核记录未成功加载，暂不显示“审核队列已清空”。请检查上方错误信息后重试。
                  </p>}
                  {categoryQueueLoaded && <ReviewQueue
                  categoryOnly
                  products={[]}
                  categoryRequests={categoryRequests}
                  onProcessProduct={async () => {
                    throw new Error('旧产品审核已关闭，必须通过主管初审和管理员终审。');
                  }}
                  onProcessCategory={async (id, action, note) => {
                    // Never consume an approval on an older Worker that only writes
                    // site drafts. Otherwise the request leaves the queue without publishing.
                    if(action==='approve' && targetedPublishSupported!==true)
                      throw new Error('当前 Worker 尚不支持单分类自动发布，已阻止本次批准。请先更新 Worker，再重试。');
                    const endpoint = action === 'approve' ? 'approve' : 'reject';
                    if(action==='reject'&&!note?.trim())throw new Error('请填写退回原因。');
                    const result = await adminFetch<any>(
                      `admin/category-requests/${encodeURIComponent(id)}/${endpoint}`,
                      { method: 'POST', body: JSON.stringify({note:note||''}) }
                    );
                    if (result?.success !== true ||
                        (action==='approve' ? result.status!=='approved' :
                          !['returned_to_supervisor','rejected'].includes(result.status))) {
                      throw new Error('分类审核结果未确认，请刷新后核对状态。');
                    }
                    await Promise.all([loadReviewQueue(), loadSiteConfig()]);
                    if(action==='approve' && result.published!==true) {
                      throw new Error('分类已通过 Admin 审核，但自动发布尚未完成。请在本页“已批准但尚未发布”区域单独重试。'+(result.publishError||''));
                    }
                  }}
                  reloadQueue={loadReviewQueue}
                />}
                </div>
              )}
              {reviewSection === 'category-changes' && (
                <CategoryChangeReview onApproved={loadSiteConfig} />
              )}
            </div>
          </section>
        )}

        {activeTab === 'inventory' && (
          editingProduct || isCreating ? (
            <ProductForm onDirtyChange={rememberProductDirty} onBusyChange={rememberProductBusy} initialData={editingProduct || {}} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onSave={handleSaveProduct} onCancel={() => { if(busyProduct.current)return;if(dirtyProduct.current&&!confirm('当前产品资料尚未保存，确认离开吗？'))return;setEditingProduct(null);setIsCreating(false); }} onUpload={async (f) => { const fd = new FormData(); fd.append('file', f); const r = await adminFetch('upload-image', { method: 'POST', body: fd }); return r.url; }} userRole="ADMIN" lang="zh" />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2" aria-label="产品目录状态">
                {[['action', '待处理'], ['published', '在售'], ['unpublished', '已下架'], ['unpublished_review', unpublishedReviewCount === null ? '下架满 30 天' : `下架满 30 天（${unpublishedReviewCount}）`], ['archived', '归档'], ['archive_review', '归档满 30 天']].map(([value, label]) => (
                  <button key={value} type="button" aria-pressed={catalogView === value}
                    onClick={() => { setCatalogView(value); setCatalogPage(1); }}
                    className="rounded border px-3 py-2 text-sm aria-pressed:bg-stone-900 aria-pressed:text-white">{label}</button>
                ))}
                <form className="flex gap-2" onSubmit={event => {
                  event.preventDefault();
                  setCatalogQuery(catalogSearch.trim());
                  setCatalogPage(1);
                }}>
                  <input aria-label="搜索产品名称或 SKU" placeholder="产品名称或 SKU" value={catalogSearch}
                    maxLength={120} onChange={event => setCatalogSearch(event.target.value)} className="rounded border px-2 py-1" />
                  <button className="rounded border px-3 py-1" type="submit">搜索</button>
                </form>
                {(catalogView === 'unpublished' || catalogView === 'unpublished_review') && (
                  <button type="button" disabled={archiving || isProductsLoading || !products.some(p => p.status === 'published' && p.catalog_hidden)}
                    onClick={() => void handleArchive(products.filter(p => p.status === 'published' && p.catalog_hidden))}
                    className="rounded border px-3 py-2 disabled:opacity-50">归档本页</button>
                )}
              </div>
              {catalogView === 'unpublished_review' && (
                <p className="text-sm text-stone-600">请复核连续下架满 30 天的商品。确认停产后可归档，仍计划重新上架的商品可继续留在此清单。</p>
              )}
              {catalogView === 'archive_review' && (
                <p className="text-sm text-stone-600">这份清单用于复核。曾发布的产品按现行规则保留，审核或发布历史仍受永久删除保护。</p>
              )}
              {catalogError && <p role="alert">{catalogError}</p>}
              {!forceDeleteEnabled&&<div role="status" className="my-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <strong>在售产品强制删除尚未启用。</strong>
                <p className="mt-1">{forceDeleteReason}</p>
                <p className="mt-1 text-xs">需要正确的 Staging Worker、D1 016 迁移及两个删除开关。当前不能绕过后端保护。</p>
                <button type="button" className="mt-2 rounded border border-amber-700 px-3 py-1 text-xs"
                  onClick={()=>void loadDeleteCapability()}>重新检查删除权限</button>
              </div>}
            <ProductList items={products} isLoading={isProductsLoading} categories={siteConfig?.categories || DEFAULT_CONFIG.categories} onEdit={setEditingProduct} onCreate={() => setIsCreating(true)} onBack={() => {}} onRefresh={loadProducts} serverFiltered onArchive={item => handleArchive([item], !!item.archived_at)} onCatalogVisibility={handleCatalogVisibility} onPermanentDelete={handlePermanentDelete} forceDeleteEnabled={forceDeleteEnabled} lang="zh" userRole="ADMIN" />
              <nav aria-label="产品分页" className="flex items-center justify-end gap-3">
                <button type="button" disabled={catalogPage <= 1 || isProductsLoading} onClick={() => setCatalogPage(page => page - 1)}>上一页</button>
                <span>第 {catalogPage} 页</span>
                <button type="button" disabled={!catalogHasMore || isProductsLoading} onClick={() => setCatalogPage(page => page + 1)}>下一页</button>
              </nav>
            </>
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
